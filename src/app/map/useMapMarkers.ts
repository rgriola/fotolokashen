'use client';

import { useState, useCallback, useEffect } from 'react';
import { useLocations } from '@/hooks/useLocations';
import { usePublicLocations } from '@/hooks/usePublicLocations';
import { LocationData } from '@/lib/maps-utils';
import { parseAddressComponents } from '@/lib/address-utils';
import type { MarkerData, MapBounds } from './types';

interface UseMapMarkersOptions {
    showPublicLocations: boolean;
    mapBounds: MapBounds | null;
}

interface UseMapMarkersReturn {
    markers: MarkerData[];
    setMarkers: React.Dispatch<React.SetStateAction<MarkerData[]>>;
    selectedMarker: MarkerData | null;
    setSelectedMarker: React.Dispatch<React.SetStateAction<MarkerData | null>>;
    locationsData: ReturnType<typeof useLocations>['data'];
    createTemporaryMarkerFromClick: (position: { lat: number; lng: number }, map: google.maps.Map | null) => Promise<void>;
    createTemporaryMarkerFromSearch: (place: LocationData) => MarkerData;
    removeTemporaryMarkers: () => void;
    handleInfoWindowClose: () => void;
    expandBounds: (bounds: google.maps.LatLngBounds) => MapBounds;
}

export function useMapMarkers({ showPublicLocations, mapBounds }: UseMapMarkersOptions): UseMapMarkersReturn {
    const [markers, setMarkers] = useState<MarkerData[]>([]);
    const [selectedMarker, setSelectedMarker] = useState<MarkerData | null>(null);

    // Load saved locations
    const { data: locationsData } = useLocations();

    // Load public locations when enabled
    const { data: publicLocationsData } = usePublicLocations({
        bounds: mapBounds || undefined,
        enabled: showPublicLocations,
    });

    // Helper function to expand bounds for loading locations outside viewport
    const expandBounds = useCallback((bounds: google.maps.LatLngBounds): MapBounds => {
        const ne = bounds.getNorthEast();
        const sw = bounds.getSouthWest();

        const latSpan = ne.lat() - sw.lat();
        const lngSpan = ne.lng() - sw.lng();

        const latPadding = latSpan * 0.25;
        const lngPadding = lngSpan * 0.25;

        return {
            north: ne.lat() + latPadding,
            south: sw.lat() - latPadding,
            east: ne.lng() + lngPadding,
            west: sw.lng() - lngPadding,
        };
    }, []);

    // Populate markers from saved + public locations
    useEffect(() => {
        if (locationsData?.locations) {
            const savedMarkers: MarkerData[] = locationsData.locations
                .filter((userSave) => userSave.location)
                .map((userSave) => ({
                    id: `saved-${userSave.id}`,
                    position: {
                        lat: userSave.location!.lat,
                        lng: userSave.location!.lng,
                    },
                    data: {
                        placeId: userSave.location!.placeId,
                        name: userSave.location!.name,
                        address: userSave.location!.address || undefined,
                        latitude: userSave.location!.lat,
                        longitude: userSave.location!.lng,
                        type: userSave.location!.type || undefined,
                        street: userSave.location!.street || undefined,
                        number: userSave.location!.number || undefined,
                        city: userSave.location!.city || undefined,
                        state: userSave.location!.state || undefined,
                        zipcode: userSave.location!.zipcode || undefined,
                    },
                    isTemporary: false,
                    userSave: userSave,
                    color: userSave.color || '#EF4444',
                    isPublic: false,
                }));

            const publicMarkers: MarkerData[] = showPublicLocations && publicLocationsData?.locations
                ? publicLocationsData.locations.map((publicLoc) => ({
                    id: `public-${publicLoc.id}`,
                    position: {
                        lat: publicLoc.lat,
                        lng: publicLoc.lng,
                    },
                    data: {
                        placeId: publicLoc.placeId ?? '',
                        name: publicLoc.name,
                        address: publicLoc.address || undefined,
                        latitude: publicLoc.lat,
                        longitude: publicLoc.lng,
                        type: publicLoc.type || undefined,
                    },
                    isTemporary: false,
                    color: '#A855F7',
                    isPublic: true,
                    ownerUsername: publicLoc.user.username,
                    publicLocationRaw: publicLoc,
                }))
                : [];

            // Deduplicate by placeId: prefer savedMarkers over publicMarkers
            const markerMap = new Map<string, MarkerData>();
            for (const marker of publicMarkers) {
                if (marker.data?.placeId) {
                    markerMap.set(marker.data.placeId, marker);
                }
            }
            for (const marker of savedMarkers) {
                if (marker.data?.placeId) {
                    markerMap.set(marker.data.placeId, marker);
                }
            }
            // Add any temporary markers
            setMarkers(prev => {
                const tempMarkers = prev.filter(m => m.isTemporary);
                return [...Array.from(markerMap.values()), ...tempMarkers];
            });
        }
    }, [locationsData, publicLocationsData, showPublicLocations]);

    const removeTemporaryMarkers = useCallback(() => {
        setMarkers((prev) => prev.filter((m) => !m.isTemporary));
    }, []);

    // Reverse-geocode a position and create a temporary marker
    const createTemporaryMarkerFromClick = useCallback(async (
        position: { lat: number; lng: number },
        map: google.maps.Map | null,
    ) => {
        // Remove all temporary markers before creating a new one
        setMarkers((prev) => prev.filter((m) => !m.isTemporary));

        try {
            const geocoder = new google.maps.Geocoder();
            const response = await geocoder.geocode({ location: position });

            let locationData: LocationData | undefined;

            if (response.results && response.results.length > 0) {
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

                let name = 'Selected Location';
                if (streetNumber && route) {
                    name = `${streetNumber} ${route}`;
                } else {
                    name = addressResult.formatted_address.split(',')[0] || 'Selected Location';
                }

                const addressComponents = parseAddressComponents(addressResult.address_components);

                locationData = {
                    placeId: addressResult.place_id,
                    name: name,
                    address: addressResult.formatted_address,
                    latitude: position.lat,
                    longitude: position.lng,
                    plusCode: plusCode,
                    ...addressComponents,
                };
            }

            const newMarker: MarkerData = {
                id: Date.now().toString(),
                position,
                data: locationData,
                isTemporary: true,
            };

            setMarkers((prev) => [...prev, newMarker]);
            setSelectedMarker(newMarker);

            if (map) {
                map.setOptions({ center: position, zoom: 16 });
            }
        } catch (error) {
            console.error('Error geocoding location:', error);
            const newMarker: MarkerData = {
                id: Date.now().toString(),
                position,
                isTemporary: true,
            };
            setMarkers((prev) => [...prev, newMarker]);
            setSelectedMarker(newMarker);

            if (map) {
                map.setOptions({ center: position, zoom: 16 });
            }
        }
    }, []);

    const createTemporaryMarkerFromSearch = useCallback((place: LocationData): MarkerData => {
        // Remove all temporary markers
        setMarkers((prev) => prev.filter((m) => !m.isTemporary));

        const newMarker: MarkerData = {
            id: place.placeId,
            position: { lat: place.latitude, lng: place.longitude },
            data: place,
            isTemporary: true,
        };

        setMarkers((prev) => [...prev, newMarker]);
        setSelectedMarker(newMarker);
        return newMarker;
    }, []);

    const handleInfoWindowClose = useCallback(() => {
        if (selectedMarker?.isTemporary) {
            setMarkers((prev) => prev.filter((m) => m.id !== selectedMarker.id));
        }
        setSelectedMarker(null);
    }, [selectedMarker]);

    return {
        markers,
        setMarkers,
        selectedMarker,
        setSelectedMarker,
        locationsData,
        createTemporaryMarkerFromClick,
        createTemporaryMarkerFromSearch,
        removeTemporaryMarkers,
        handleInfoWindowClose,
        expandBounds,
    };
}
