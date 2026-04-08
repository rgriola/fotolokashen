'use client';

import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { useGpsLocation } from '@/hooks/useGpsLocation';
import { parseAddressComponents } from '@/lib/address-utils';
import { LocationData } from '@/lib/maps-utils';
import { toast } from 'sonner';
import { TOAST } from '@/lib/constants/messages';
import type { MarkerData } from './types';

interface UseGpsHandlersReturn {
    userLocation: { lat: number; lng: number } | null;
    gpsEnabled: boolean;
    showGpsDialog: boolean;
    showWelcomeBanner: boolean;
    handleGPSClick: () => Promise<void>;
    handleGpsPermissionConfirm: () => Promise<void>;
    handleGpsPermissionCancel: () => Promise<void>;
    handleWelcomeBannerEnable: () => void;
    handleWelcomeBannerDismiss: () => Promise<void>;
    handleUserLocationClick: (setSelectedMarker: (marker: MarkerData) => void) => Promise<void>;
    handleHomeLocationClick: (
        map: google.maps.Map | null,
        setSelectedMarker: (marker: MarkerData) => void,
        removeTemporaryMarkers: () => void,
    ) => Promise<void>;
    setGpsEnabled: (enabled: boolean) => void;
    setUserLocation: (location: { lat: number; lng: number } | null) => void;
}

export function useGpsHandlers(
    map: google.maps.Map | null,
): UseGpsHandlersReturn {
    const { user } = useAuth();
    const router = useRouter();
    const { requestLocation, updateUserPermission } = useGpsLocation();
    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [gpsEnabled, setGpsEnabled] = useState(false);
    const [showGpsDialog, setShowGpsDialog] = useState(false);
    const [showWelcomeBanner, setShowWelcomeBanner] = useState(() => {
        if (typeof window !== 'undefined') {
            const dismissed = localStorage.getItem('gpsWelcomeBannerDismissed');
            return !dismissed;
        }
        return false;
    });

    // Hide welcome banner if user is not eligible
    useEffect(() => {
        if (user && user.gpsPermission !== 'not_asked') {
            setShowWelcomeBanner(false);
        }
    }, [user]);

    const handleGPSClick = useCallback(async () => {
        if (gpsEnabled && userLocation) {
            setGpsEnabled(false);
            setUserLocation(null);
            return;
        }

        if (user?.gpsPermission === 'denied') {
            toast.error(TOAST.GPS.DISABLED, {
                description: 'Enable it in Profile > Preferences',
                action: {
                    label: 'Go to Settings',
                    onClick: () => router.push('/profile?tab=preferences'),
                },
            });
            return;
        }

        if (user?.gpsPermission === 'not_asked') {
            setShowGpsDialog(true);
            return;
        }

        const position = await requestLocation();
        if (position) {
            const coords = {
                lat: position.coords.latitude,
                lng: position.coords.longitude,
            };
            setGpsEnabled(true);
            setUserLocation(coords);
            if (map) {
                map.setOptions({ center: coords, zoom: 15 });
            }
        }
    }, [gpsEnabled, userLocation, user?.gpsPermission, requestLocation, map, router]);

    const handleGpsPermissionConfirm = useCallback(async () => {
        setShowGpsDialog(false);
        await updateUserPermission('granted');
        const position = await requestLocation();
        if (position) {
            const coords = {
                lat: position.coords.latitude,
                lng: position.coords.longitude,
            };
            setGpsEnabled(true);
            setUserLocation(coords);
            if (map) {
                map.setOptions({ center: coords, zoom: 15 });
            }
        }
    }, [updateUserPermission, requestLocation, map]);

    const handleGpsPermissionCancel = useCallback(async () => {
        setShowGpsDialog(false);
        await updateUserPermission('denied');
    }, [updateUserPermission]);

    const handleWelcomeBannerEnable = useCallback(() => {
        localStorage.setItem('gpsWelcomeBannerDismissed', 'true');
        setShowWelcomeBanner(false);
        setShowGpsDialog(true);
    }, []);

    const handleWelcomeBannerDismiss = useCallback(async () => {
        localStorage.setItem('gpsWelcomeBannerDismissed', 'true');
        setShowWelcomeBanner(false);
        await updateUserPermission('denied');
    }, [updateUserPermission]);

    // Reverse-geocode helper shared by user and home location clicks
    const reverseGeocodePosition = useCallback(async (
        position: { lat: number; lng: number },
        defaultName: string,
    ): Promise<LocationData | undefined> => {
        const geocoder = new google.maps.Geocoder();
        const response = await geocoder.geocode({ location: position });

        if (!response.results || response.results.length === 0) return undefined;

        const plusCodeResult = response.results.find(result =>
            result.types.includes('plus_code')
        );
        const plusCode = plusCodeResult?.plus_code?.global_code;

        const addressPriority = [
            'street_address', 'route', 'premise', 'neighborhood', 'locality'
        ];

        let addressResult = response.results[0];
        for (const type of addressPriority) {
            const found = response.results.find(result =>
                result.types.includes(type) && !result.types.includes('plus_code')
            );
            if (found) {
                addressResult = found;
                break;
            }
        }

        const streetNumber = addressResult.address_components?.find(c =>
            c.types.includes('street_number')
        )?.long_name;
        const route = addressResult.address_components?.find(c =>
            c.types.includes('route')
        )?.long_name;

        let name = defaultName;
        if (streetNumber && route) {
            name = `${streetNumber} ${route}`;
        } else {
            name = addressResult.formatted_address.split(',')[0] || defaultName;
        }

        const addressComponents = parseAddressComponents(addressResult.address_components);

        return {
            placeId: addressResult.place_id,
            name,
            address: addressResult.formatted_address,
            latitude: position.lat,
            longitude: position.lng,
            plusCode,
            ...addressComponents,
        };
    }, []);

    const handleUserLocationClick = useCallback(async (
        setSelectedMarker: (marker: MarkerData) => void,
    ) => {
        if (!userLocation) return;

        try {
            const locationData = await reverseGeocodePosition(userLocation, 'Current Location');

            const newMarker: MarkerData = {
                id: 'user-location-info',
                position: userLocation,
                data: locationData,
                isTemporary: true,
            };

            setSelectedMarker(newMarker);
        } catch (error) {
            console.error('Error getting location details:', error);
        }
    }, [userLocation, reverseGeocodePosition]);

    const handleHomeLocationClick = useCallback(async (
        mapInstance: google.maps.Map | null,
        setSelectedMarker: (marker: MarkerData) => void,
        removeTemporaryMarkers: () => void,
    ) => {
        if (!user?.homeLocationLat || !user?.homeLocationLng) return;

        removeTemporaryMarkers();

        const homePosition = {
            lat: user.homeLocationLat,
            lng: user.homeLocationLng,
        };

        try {
            // Use custom home name if set
            const defaultName = user.homeLocationName || 'Home';
            const locationData = await reverseGeocodePosition(homePosition, defaultName);

            // Override name with custom home name if the user set one
            if (locationData && user.homeLocationName) {
                locationData.name = user.homeLocationName;
            }

            const homeMarker: MarkerData = {
                id: 'home-location-info',
                position: homePosition,
                data: locationData,
                isTemporary: false,
            };

            setSelectedMarker(homeMarker);

            if (mapInstance) {
                mapInstance.setOptions({ center: homePosition, zoom: 17 });
            }
        } catch (error) {
            console.error('Error getting home location details:', error);
        }
    }, [user, reverseGeocodePosition]);

    return {
        userLocation,
        gpsEnabled,
        showGpsDialog,
        showWelcomeBanner,
        handleGPSClick,
        handleGpsPermissionConfirm,
        handleGpsPermissionCancel,
        handleWelcomeBannerEnable,
        handleWelcomeBannerDismiss,
        handleUserLocationClick,
        handleHomeLocationClick,
        setGpsEnabled,
        setUserLocation,
    };
}
