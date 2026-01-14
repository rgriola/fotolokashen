'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { GoogleMap } from '@/components/maps/GoogleMap';
import { CustomMarker } from '@/components/maps/CustomMarker';
import { ClusteredMarkers } from '@/components/maps/ClusteredMarkers';
import { InfoWindow } from '@/components/maps/InfoWindow';
import { PlacesAutocomplete } from '@/components/maps/PlacesAutocomplete';
import { UserLocationMarker } from '@/components/maps/UserLocationMarker';
import { HomeLocationMarker } from '@/components/maps/HomeLocationMarker';
import { RightSidebar } from '@/components/layout/RightSidebar';
import { SaveLocationPanel } from '@/components/panels/SaveLocationPanel';
import { EditLocationPanel } from '@/components/panels/EditLocationPanel';
import { SavedLocationsPanel } from '@/components/panels/SavedLocationsPanel';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { LocationData } from '@/lib/maps-utils';
import { parseAddressComponents } from '@/lib/address-utils';
import { useLocations } from '@/hooks/useLocations';
import { UserSave, Location } from '@/types/location';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { GpsPermissionDialog } from '@/components/maps/GpsPermissionDialog';
import { GpsWelcomeBanner } from '@/components/maps/GpsWelcomeBanner';
import { useGpsLocation } from '@/hooks/useGpsLocation';
import { MapControls } from '@/components/maps/MapControls';
import { FriendsDialog } from '@/components/map/FriendsDialog';
import { ShareLocationDialog } from '@/components/map/ShareLocationDialog';
import { MapPin as MapPinIcon, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { debounceLeading } from '@/lib/utils/debounce';

interface MarkerData {
    id: string;
    position: { lat: number; lng: number };
    data?: LocationData;
    isTemporary?: boolean; // True for markers not yet saved
    userSave?: UserSave; // User save data if this is a saved location
    color?: string; // Marker color for saved locations
}

function MapPageInner() {
    const searchParams = useSearchParams();
    const [markers, setMarkers] = useState<MarkerData[]>([]);
    const [selectedMarker, setSelectedMarker] = useState<MarkerData | null>(null);
    const [map, setMap] = useState<google.maps.Map | null>(null);
    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [showFriendsDialog, setShowFriendsDialog] = useState(false);
    const [shareLocation, setShareLocation] = useState<Location | null>(null);

    // Sidebar state
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [sidebarView, setSidebarView] = useState<'save' | 'edit'>('save');
    const [locationToSave, setLocationToSave] = useState<MarkerData | null>(null);
    const [locationToEdit, setLocationToEdit] = useState<MarkerData | null>(null);
    const [isFavorite, setIsFavorite] = useState(false);
    const [indoorOutdoor, setIndoorOutdoor] = useState<"indoor" | "outdoor">("outdoor");
    const [showPhotoUpload, setShowPhotoUpload] = useState(false);
    const [showSearchDialog, setShowSearchDialog] = useState(false);
    const [isSavingLocation, setIsSavingLocation] = useState(false); // Track save operation


    // GPS permission state
    const { user } = useAuth();
    const router = useRouter();
    const { requestLocation, updateUserPermission } = useGpsLocation();
    const [showGpsDialog, setShowGpsDialog] = useState(false);
    const [showWelcomeBanner, setShowWelcomeBanner] = useState(false);
    const [showLocationsPanel, setShowLocationsPanel] = useState(false);

    // Use home location as default center if set, otherwise NYC
    const defaultCenter = useMemo(() => {
        if (user?.homeLocationLat && user?.homeLocationLng) {
            return {
                lat: user.homeLocationLat,
                lng: user.homeLocationLng,
            };
        }
        return { lat: 40.7128, lng: -74.006 }; // NYC fallback
    }, [user]);

    const [center, setCenter] = useState(defaultCenter);

    // Show welcome banner on first visit if GPS not configured
    useEffect(() => {
        if (user && user.gpsPermission === 'not_asked') {
            // Check if banner was previously dismissed (could use localStorage)
            const dismissed = localStorage.getItem('gpsWelcomeBannerDismissed');
            if (!dismissed) {
                setShowWelcomeBanner(true);
            }
        }
    }, [user]);

    // Update map center when home location is loaded/changed
    useEffect(() => {
        if (user?.homeLocationLat && user?.homeLocationLng) {
            setCenter({
                lat: user.homeLocationLat,
                lng: user.homeLocationLng,
            });
        }
    }, [user?.homeLocationLat, user?.homeLocationLng]);

    // Load saved locations
    const { data: locationsData } = useLocations();

    // Populate markers from saved locations
    useEffect(() => {
        if (locationsData?.locations) {
            const savedMarkers: MarkerData[] = locationsData.locations
                .filter((userSave) => userSave.location) // Filter out any undefined locations
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
                    isTemporary: false, // Saved locations are NOT temporary
                    userSave: userSave,
                    color: userSave.color || '#EF4444', // Use user's custom color or default red
                }));

            // Update markers, preserving any temporary markers
            setMarkers(prev => {
                const tempMarkers = prev.filter(m => m.isTemporary);
                return [...savedMarkers, ...tempMarkers];
            });
        }
    }, [locationsData]);

    // Handle URL parameters (from My Locations page navigation)
    useEffect(() => {
        const lat = searchParams.get('lat');
        const lng = searchParams.get('lng');
        const zoom = searchParams.get('zoom');
        const editLocationId = searchParams.get('edit');

        if (lat && lng && map) {
            const position = {
                lat: parseFloat(lat),
                lng: parseFloat(lng),
            };

            // If edit parameter is present, fetch the location and open edit panel
            if (editLocationId) {
                // Fetch the location data
                fetch(`/api/locations/${editLocationId}`)
                    .then(res => res.json())
                    .then(location => {
                        // Create marker data from location
                        const markerData = {
                            id: location.placeId,
                            position: { lat: location.lat, lng: location.lng },
                            data: {
                                placeId: location.placeId,
                                name: location.name,
                                address: location.address,
                                type: location.type,
                                rating: location.rating,
                                street: location.street,
                                number: location.number,
                                city: location.city,
                                state: location.state,
                                zipcode: location.zipcode,
                                productionNotes: location.productionNotes,
                                entryPoint: location.entryPoint,
                                parking: location.parking,
                                access: location.access,
                                indoorOutdoor: location.indoorOutdoor,
                                isPermanent: location.isPermanent,
                                photoUrls: location.photoUrls,
                                permitRequired: location.permitRequired,
                                permitCost: location.permitCost,
                                contactPerson: location.contactPerson,
                                contactPhone: location.contactPhone,
                                operatingHours: location.operatingHours,
                                restrictions: location.restrictions,
                                bestTimeOfDay: location.bestTimeOfDay,
                            },
                            userSave: location.userSave,
                        };

                        // Open edit panel
                        setLocationToEdit(markerData as any);
                        setSidebarView('edit');
                        setIsSidebarOpen(true);

                        // Load states
                        setIsFavorite(location.userSave?.isFavorite || false);
                        setIndoorOutdoor((location.indoorOutdoor as "indoor" | "outdoor") || "outdoor");

                        // Pan map with offset for desktop
                        if (typeof window !== 'undefined') {
                            const isDesktop = window.innerWidth >= 1024;
                            if (isDesktop) {
                                const PANEL_WIDTH = 450;
                                setTimeout(() => {
                                    map.setOptions({
                                        center: position,
                                        zoom: zoom ? parseInt(zoom) : 17,
                                    });
                                    setTimeout(() => {
                                        map.panBy(PANEL_WIDTH / 2, 0);
                                    }, 100);
                                }, 50);
                            } else {
                                map.setOptions({
                                    center: position,
                                    zoom: zoom ? parseInt(zoom) : 17,
                                });
                            }
                        }
                    })
                    .catch(err => {
                        console.error('Failed to fetch location:', err);
                        // Fallback: just pan to the coordinates
                        map.setOptions({
                            center: position,
                            zoom: zoom ? parseInt(zoom) : 17,
                        });
                    });
            } else {
                // No edit parameter, just pan to the location
                map.setOptions({
                    center: position,
                    zoom: zoom ? parseInt(zoom) : 17,
                });
            }
        }
    }, [searchParams, map]);

    const handleMapLoad = useCallback((mapInstance: google.maps.Map) => {
        setMap(mapInstance);
    }, []);

    const handleMapClick = useCallback(async (event: google.maps.MapMouseEvent) => {
        if (event.latLng) {
            // Close SaveLocationPanel if open (Option A: force user to commit or cancel)
            if (isSidebarOpen) {
                setIsSidebarOpen(false);
                setLocationToSave(null);
            }

            // Remove all temporary markers before creating a new one
            setMarkers((prev) => prev.filter((m) => !m.isTemporary));

            const position = {
                lat: event.latLng.lat(),
                lng: event.latLng.lng(),
            };

            try {
                // Use reverse geocoding to get place information
                const geocoder = new google.maps.Geocoder();
                const response = await geocoder.geocode({
                    location: position,
                });

                let locationData: LocationData | undefined;

                if (response.results && response.results.length > 0) {
                    // Extract Plus Code from results (usually first result)
                    const plusCodeResult = response.results.find(result =>
                        result.types.includes('plus_code')
                    );
                    const plusCode = plusCodeResult?.plus_code?.global_code;

                    // Find the best postal address result
                    // Priority: street_address > route > premise > neighborhood > locality
                    const addressPriority = [
                        'street_address',
                        'route',
                        'premise',
                        'neighborhood',
                        'locality'
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

                    // Extract readable name
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

                    // Parse address components
                    const addressComponents = parseAddressComponents(addressResult.address_components);

                    locationData = {
                        placeId: addressResult.place_id,
                        name: name,
                        address: addressResult.formatted_address,
                        latitude: position.lat,
                        longitude: position.lng,
                        plusCode: plusCode,
                        ...addressComponents, // Add parsed address components
                    };
                }

                const newMarker: MarkerData = {
                    id: Date.now().toString(),
                    position,
                    data: locationData,
                    isTemporary: true, // Mark as temporary until saved
                };

                setMarkers((prev) => [...prev, newMarker]);
                setSelectedMarker(newMarker); // Auto-show InfoWindow

                // Zoom to street level for better detail
                if (map) {
                    // map.panTo(position);
                    // map.setZoom(16);
                    map.setOptions({
                        center: position,
                        zoom: 16,
                    });
                }
            } catch (error) {
                console.error('Error geocoding location:', error);
                // Still create marker even if geocoding fails
                const newMarker: MarkerData = {
                    id: Date.now().toString(),
                    position,
                    isTemporary: true, // Mark as temporary
                };
                setMarkers((prev) => [...prev, newMarker]);
                setSelectedMarker(newMarker);

                // Zoom to street level even on geocoding error
                if (map) {
                    // map.panTo(newPosition);
                    // map.setZoom(16);
                    map.setOptions({
                        center: position,
                        zoom: 16,
                    });
                }
            }
        }
    }, [map, isSidebarOpen]);

    const handlePlaceSelected = useCallback((place: LocationData) => {
        // Close SaveLocationPanel if open (same as map click flow)
        if (isSidebarOpen) {
            setIsSidebarOpen(false);
            setLocationToSave(null);
        }

        // Remove all temporary markers before creating a new one (same as map click flow)
        setMarkers((prev) => prev.filter((m) => !m.isTemporary));

        const newPosition = { lat: place.latitude, lng: place.longitude };
        setCenter(newPosition);

        const newMarker: MarkerData = {
            id: place.placeId,
            position: newPosition,
            data: place,
            isTemporary: true, // Mark as temporary so it uses custom red camera marker
        };

        setMarkers((prev) => [...prev, newMarker]);
        setSelectedMarker(newMarker);

        // Pan to location
        if (map) {
            map.setOptions({
                center: newPosition,
                zoom: 16,
            });
        }
    }, [map, isSidebarOpen]);

    const handleGPSClick = async () => {
        // Check app-level permission
        if (user?.gpsPermission === 'denied') {
            toast.error('GPS is disabled', {
                description: 'Enable it in Profile > Preferences',
                action: {
                    label: 'Go to Settings',
                    onClick: () => router.push('/profile?tab=preferences'),
                },
            });
            return;
        }

        // If not asked, show permission dialog
        if (user?.gpsPermission === 'not_asked') {
            setShowGpsDialog(true);
            return;
        }

        // Permission granted, request browser location
        const position = await requestLocation();
        if (position) {
            const coords = {
                lat: position.coords.latitude,
                lng: position.coords.longitude,
            };
            setCenter(coords);
            setUserLocation(coords);
            if (map) {
                map.setOptions({
                    center: coords,
                    zoom: 15,
                });
            }
        }
    };

    const handleGpsPermissionConfirm = async () => {
        setShowGpsDialog(false);
        await updateUserPermission('granted');
        // Now request location
        const position = await requestLocation();
        if (position) {
            const coords = {
                lat: position.coords.latitude,
                lng: position.coords.longitude,
            };
            setCenter(coords);
            setUserLocation(coords);
            if (map) {
                map.setOptions({
                    center: coords,
                    zoom: 15,
                });
            }
        }
    };

    const handleGpsPermissionCancel = async () => {
        setShowGpsDialog(false);
        await updateUserPermission('denied');
    };

    const handleWelcomeBannerEnable = () => {
        localStorage.setItem('gpsWelcomeBannerDismissed', 'true');
        setShowWelcomeBanner(false);
        setShowGpsDialog(true);
    };

    const handleWelcomeBannerDismiss = async () => {
        localStorage.setItem('gpsWelcomeBannerDismissed', 'true');
        setShowWelcomeBanner(false);
        await updateUserPermission('denied');
    };

    const handleUserLocationClick = async () => {
        if (!userLocation) return;

        try {
            // Use reverse geocoding to get place information
            const geocoder = new google.maps.Geocoder();
            const response = await geocoder.geocode({
                location: userLocation,
            });

            if (response.results && response.results.length > 0) {
                // Extract Plus Code
                const plusCodeResult = response.results.find(result =>
                    result.types.includes('plus_code')
                );
                const plusCode = plusCodeResult?.plus_code?.global_code;

                // Find the best postal address
                const addressPriority = [
                    'street_address',
                    'route',
                    'premise',
                    'neighborhood',
                    'locality'
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

                // Extract readable name
                const streetNumber = addressResult.address_components?.find(c =>
                    c.types.includes('street_number')
                )?.long_name;
                const route = addressResult.address_components?.find(c =>
                    c.types.includes('route')
                )?.long_name;

                let name = 'Current Location';
                if (streetNumber && route) {
                    name = `${streetNumber} ${route}`;
                } else {
                    name = addressResult.formatted_address.split(',')[0] || 'Current Location';
                }

                // Parse address components
                const addressComponents = parseAddressComponents(addressResult.address_components);

                const locationData: LocationData = {
                    placeId: addressResult.place_id,
                    name: name,
                    address: addressResult.formatted_address,
                    latitude: userLocation.lat,
                    longitude: userLocation.lng,
                    plusCode: plusCode,
                    ...addressComponents, // Add parsed address components
                };

                // Create a special marker for the clicked user location
                const newMarker: MarkerData = {
                    id: 'user-location-info',
                    position: userLocation,
                    data: locationData,
                    isTemporary: true, // Make it temporary so Save button appears
                };

                setSelectedMarker(newMarker);
            }
        } catch (error) {
            console.error('Error getting location details:', error);
        }
    };


    const handleHomeLocationClick = async () => {
        if (!user?.homeLocationLat || !user?.homeLocationLng) return;

        // Remove any temporary markers when clicking home location
        setMarkers((prev) => prev.filter((m) => !m.isTemporary));

        const homePosition = {
            lat: user.homeLocationLat,
            lng: user.homeLocationLng,
        };

        try {
            // Use reverse geocoding to get place information
            const geocoder = new google.maps.Geocoder();
            const response = await geocoder.geocode({
                location: homePosition,
            });

            if (response.results && response.results.length > 0) {
                // Extract Plus Code
                const plusCodeResult = response.results.find(result =>
                    result.types.includes('plus_code')
                );
                const plusCode = plusCodeResult?.plus_code?.global_code;

                // Find the best postal address
                const addressPriority = [
                    'street_address',
                    'route',
                    'premise',
                    'neighborhood',
                    'locality'
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

                // Use custom home name if set, otherwise extract from address
                let name = user.homeLocationName || 'Home';
                if (!user.homeLocationName) {
                    const streetNumber = addressResult.address_components?.find(c =>
                        c.types.includes('street_number')
                    )?.long_name;
                    const route = addressResult.address_components?.find(c =>
                        c.types.includes('route')
                    )?.long_name;

                    if (streetNumber && route) {
                        name = `${streetNumber} ${route}`;
                    } else {
                        name = addressResult.formatted_address.split(',')[0] || 'Home';
                    }
                }

                // Parse address components
                const addressComponents = parseAddressComponents(addressResult.address_components);

                const locationData: LocationData = {
                    placeId: addressResult.place_id,
                    name: name,
                    address: addressResult.formatted_address,
                    latitude: homePosition.lat,
                    longitude: homePosition.lng,
                    plusCode: plusCode,
                    ...addressComponents,
                };

                // Create a marker for the home location to show in InfoWindow
                const homeMarker: MarkerData = {
                    id: 'home-location-info',
                    position: homePosition,
                    data: locationData,
                    isTemporary: false, // Not temporary - it's the home location
                };

                setSelectedMarker(homeMarker);

                // Pan to home location
                if (map) {
                    map.setOptions({
                        center: homePosition,
                        zoom: 17,
                    });
                }
            }
        } catch (error) {
            console.error('Error getting home location details:', error);
        }
    };

    const handleMarkerClick = useCallback((marker: MarkerData) => {
        // For saved markers: skip InfoWindow, open EditLocationPanel directly
        if (!marker.isTemporary && marker.userSave) {
            // Remove any temporary markers when clicking a saved marker
            setMarkers((prev) => prev.filter((m) => !m.isTemporary));

            // Close any open InfoWindow
            setSelectedMarker(null);

            setLocationToEdit(marker);
            setSidebarView('edit');
            setIsSidebarOpen(true);

            // Load favorite state from saved location
            setIsFavorite(marker.userSave?.isFavorite || false);

            // Load indoor/outdoor state from saved location
            setIndoorOutdoor((marker.userSave?.location?.indoorOutdoor as "indoor" | "outdoor") || "outdoor");

            // Pan map to adjust for panel (desktop only)
            if (map && typeof window !== 'undefined') {
                const isDesktop = window.innerWidth >= 1024;
                if (isDesktop) {
                    const PANEL_WIDTH = 450;
                    setTimeout(() => {
                        // Center on marker first
                        map.setOptions({
                            center: marker.position,
                            zoom: 17,
                        });
                        // Then pan to accommodate panel
                        setTimeout(() => {
                            map.panBy(PANEL_WIDTH / 2, 0);
                        }, 100);
                    }, 50);
                } else {
                    // Mobile: just center on marker
                    map.setOptions({
                        center: marker.position,
                        zoom: 17,
                    });
                }
            }
        } else {
            // For temporary markers: show InfoWindow as before
            setSelectedMarker(marker);

            // Zoom to street level and pan to marker
            if (map) {
                map.setOptions({
                    center: marker.position,
                    zoom: 17,
                });
            }
        }
    }, [map]);

    const handleInfoWindowClose = useCallback(() => {
        // If the selected marker is temporary (not saved), remove it from the map
        if (selectedMarker?.isTemporary) {
            setMarkers((prev) => prev.filter((m) => m.id !== selectedMarker.id));
        }

        // Close SaveLocationPanel if it's open
        if (isSidebarOpen) {
            setIsSidebarOpen(false);
            setLocationToSave(null);
        }

        setSelectedMarker(null);
    }, [selectedMarker, isSidebarOpen]);

    // Debounced save handler to prevent rapid repeated clicks
    // Uses debounceLeading to execute immediately on first click, ignore subsequent clicks within 1 second
    const handleSaveClick = useMemo(
        () => debounceLeading(() => {
            // Trigger form submit for either save or edit
            const formId = sidebarView === 'save' ? 'save-location-form' : 'edit-location-form';
            const form = document.getElementById(formId) as HTMLFormElement;
            if (form) {
                form.requestSubmit();
            }
        }, 1000), // 1 second debounce - prevents duplicate submissions
        [sidebarView]
    );

    // Memoize initialData for SaveLocationPanel to prevent unnecessary form resets
    const saveLocationInitialData = useMemo(() => {
        if (!locationToSave) return null;
        return {
            placeId: locationToSave.data?.placeId || locationToSave.id,
            name: locationToSave.data?.name || 'Selected Location',
            address: locationToSave.data?.address,
            lat: locationToSave.position.lat,
            lng: locationToSave.position.lng,
            street: locationToSave.data?.street,
            number: locationToSave.data?.number,
            city: locationToSave.data?.city,
            state: locationToSave.data?.state,
            zipcode: locationToSave.data?.zipcode,
            isFavorite: isFavorite,
            indoorOutdoor: indoorOutdoor,
        };
    }, [
        locationToSave,
        isFavorite,
        indoorOutdoor,
    ]);

    return (
        <div className="fixed inset-0 top-16 flex flex-col">
            {/* Map Container */}
            <div className="flex-1 relative">
                <GoogleMap
                    center={center}
                    zoom={12}
                    onMapLoad={handleMapLoad}
                    onClick={handleMapClick}
                    className="w-full h-full"
                >
                    {/* User location blue dot */}

                    {/* Home location marker (house icon) */}
                    {user?.homeLocationLat && user?.homeLocationLng && (
                        <HomeLocationMarker
                            position={{
                                lat: user.homeLocationLat,
                                lng: user.homeLocationLng,
                            }}
                            name={user.homeLocationName || undefined}
                            onClick={handleHomeLocationClick}
                        />
                    )}

                    <UserLocationMarker
                        position={userLocation}
                        onClick={handleUserLocationClick}
                    />

                    {/* Render temporary markers (not clustered) */}
                    {markers.filter(m => m.isTemporary).map((marker) => (
                        <CustomMarker
                            key={marker.id}
                            position={marker.position}
                            title={marker.data?.name || 'Custom location'}
                            onClick={() => handleMarkerClick(marker)}
                            isTemporary={true}
                            color={marker.color || '#EF4444'}
                        />
                    ))}

                    {/* Render saved markers (clustered) */}
                    <ClusteredMarkers
                        map={map}
                        markers={markers.filter(m => !m.isTemporary).map(marker => ({
                            position: marker.position,
                            title: marker.data?.name || 'Saved location',
                            color: marker.color || '#EF4444',
                            onClick: () => handleMarkerClick(marker),
                        }))}
                    />

                    {/* Render info window for selected marker */}
                    {selectedMarker && (
                        <InfoWindow
                            position={selectedMarker.position}
                            onClose={handleInfoWindowClose}
                        >
                            <div className="space-y-2">
                                <h3 className="font-semibold text-lg">
                                    {selectedMarker.data?.name || 'Custom Location'}
                                </h3>
                                {selectedMarker.data?.address && (
                                    <p className="text-sm text-gray-600">
                                        {selectedMarker.data.address}
                                    </p>
                                )}
                                {/* Display coordinates */}
                                <p className="text-xs text-gray-500 font-mono">
                                    {selectedMarker.position.lat.toFixed(3)}, {selectedMarker.position.lng.toFixed(3)}
                                </p>
                                {selectedMarker.data?.rating && (
                                    <div className="flex items-center gap-1">
                                        <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                        </svg>
                                        <span className="text-sm font-medium">{selectedMarker.data.rating}</span>
                                    </div>
                                )}
                                <div className="flex gap-2 mt-2">
                                    {/* View button for saved locations */}
                                    {selectedMarker.userSave && (
                                        <button
                                            onClick={() => {
                                                setLocationToEdit(selectedMarker);
                                                setSidebarView('edit');
                                                setIsSidebarOpen(true);
                                                // Load favorite state from saved location
                                                setIsFavorite(selectedMarker.userSave?.isFavorite || false);
                                                // Load indoor/outdoor state from saved location
                                                setIndoorOutdoor((selectedMarker.userSave?.location?.indoorOutdoor as "indoor" | "outdoor") || "outdoor");

                                                // Pan map to adjust for panel (same as Save button)
                                                if (map && typeof window !== 'undefined') {
                                                    const isDesktop = window.innerWidth >= 1024;
                                                    if (isDesktop) {
                                                        const PANEL_WIDTH = 450;
                                                        setTimeout(() => {
                                                            map.panBy(PANEL_WIDTH / 2, 0);
                                                        }, 100);
                                                    }
                                                }
                                            }}
                                            className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                                        >
                                            View
                                        </button>
                                    )}
                                    {/* Save button for temporary markers */}
                                    {selectedMarker.isTemporary && (
                                        <button
                                            onClick={() => {
                                                setLocationToSave(selectedMarker);
                                                setSidebarView('save');
                                                setIsSidebarOpen(true);

                                                // Pan map to adjust for panel covering right side (desktop only)
                                                if (map && typeof window !== 'undefined') {
                                                    // Only pan on desktop (lg breakpoint = 1024px)
                                                    const isDesktop = window.innerWidth >= 1024;
                                                    if (isDesktop) {
                                                        const PANEL_WIDTH = 450; // lg:w-[450px]
                                                        // Pan left (same direction as panel sliding in)
                                                        setTimeout(() => {
                                                            map.panBy(PANEL_WIDTH / 2, 0);
                                                        }, 100); // Small delay to ensure panel animation starts
                                                    }
                                                }
                                            }}
                                            className="px-3 py-1 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700 transition-colors"
                                        >
                                            Save
                                        </button>
                                    )}
                                    {/* Quick Save button - disabled (feature in development) */}
                                    {selectedMarker.isTemporary && (
                                        <button
                                            disabled
                                            className="px-3 py-1 bg-gray-400 text-gray-200 text-sm rounded cursor-not-allowed opacity-60"
                                            title="Quick save feature temporarily disabled"
                                        >
                                            Quick Save
                                        </button>
                                    )}
                                    {selectedMarker.data && (
                                        <a
                                            href={`https://www.google.com/maps/dir/?api=1&destination=${selectedMarker.position.lat},${selectedMarker.position.lng}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded hover:bg-gray-200 transition-colors"
                                        >
                                            Directions
                                        </a>
                                    )}
                                </div>
                            </div>
                        </InfoWindow>
                    )}
                </GoogleMap>

                {/* Map Controls - Responsive (Desktop: top-center buttons, Mobile: bottom floating menu) */}
                <MapControls
                    userLocation={userLocation}
                    onGpsToggle={handleGPSClick}
                    onSearchClick={() => setShowSearchDialog(true)}
                    searchOpen={showSearchDialog}
                    hideMobileButton={isSidebarOpen}
                    onFriendsClick={() => setShowFriendsDialog(true)}
                    onViewAllClick={() => {
                        if (!map) return;

                        const savedMarkers = markers.filter(m => !m.isTemporary);

                        if (savedMarkers.length === 0) {
                            toast.info('No saved locations to display');
                            return;
                        }

                        // Create bounds to fit all markers
                        const bounds = new google.maps.LatLngBounds();
                        savedMarkers.forEach(marker => {
                            bounds.extend(marker.position);
                        });

                        // Fit map to show all markers
                        map.fitBounds(bounds);

                        // Add some padding
                        setTimeout(() => {
                            if (map.getZoom()! > 16) {
                                map.setZoom(16);
                            }
                        }, 100);
                    }}
                    onMyLocationsClick={() => setShowLocationsPanel(true)}
                    savedLocationsCount={markers.filter(m => !m.isTemporary).length}
                />

                {/* Locations Panel - Slide in from right, same width as save/edit panels */}
                {showLocationsPanel && (
                    <div className="absolute top-0 right-0 h-full w-full sm:w-[400px] lg:w-[450px] bg-white shadow-2xl z-20 flex flex-col animate-in slide-in-from-right">
                        {/* Panel Header */}
                        <div className="flex items-center justify-between p-3 border-b bg-gray-50">
                            <h3 className="font-semibold text-lg flex items-center gap-2">
                                <MapPinIcon className="w-5 h-5" />
                                My Locations
                            </h3>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowLocationsPanel(false)}
                            >
                                <X className="w-4 h-4" />
                            </Button>
                        </div>

                        {/* Panel Content - SavedLocationsPanel */}
                        <SavedLocationsPanel
                            onLocationClick={(location) => {
                                // Close the panel first
                                setShowLocationsPanel(false);

                                // Create a marker-like structure from the location data
                                const markerData = {
                                    id: location.placeId,
                                    position: { lat: location.lat, lng: location.lng },
                                    data: {
                                        placeId: location.placeId,
                                        name: location.name,
                                        address: location.address,
                                        type: location.type,
                                        rating: location.rating,
                                        street: location.street,
                                        number: location.number,
                                        city: location.city,
                                        state: location.state,
                                        zipcode: location.zipcode,
                                        productionNotes: location.productionNotes,
                                        entryPoint: location.entryPoint,
                                        parking: location.parking,
                                        access: location.access,
                                        indoorOutdoor: location.indoorOutdoor,
                                        isPermanent: location.isPermanent,
                                        photoUrls: location.photoUrls,
                                        permitRequired: location.permitRequired,
                                        permitCost: location.permitCost,
                                        contactPerson: location.contactPerson,
                                        contactPhone: location.contactPhone,
                                        operatingHours: location.operatingHours,
                                        restrictions: location.restrictions,
                                        bestTimeOfDay: location.bestTimeOfDay,
                                    },
                                    userSave: location.userSave,
                                };

                                // Don't set selectedMarker (which shows InfoWindow)
                                // Just open the edit panel
                                setLocationToEdit(markerData as any);
                                setSidebarView('edit');
                                setIsSidebarOpen(true);

                                // Load favorite state
                                setIsFavorite(location.userSave?.isFavorite || false);

                                // Load indoor/outdoor state
                                setIndoorOutdoor((location.indoorOutdoor as "indoor" | "outdoor") || "outdoor");

                                // Pan map to adjust for panel (same as handleMarkerClick)
                                if (map && typeof window !== 'undefined') {
                                    const isDesktop = window.innerWidth >= 1024;
                                    if (isDesktop) {
                                        const PANEL_WIDTH = 450;
                                        setTimeout(() => {
                                            // Center on location first
                                            map.setOptions({
                                                center: { lat: location.lat, lng: location.lng },
                                                zoom: 17,
                                            });
                                            // Then pan to accommodate panel
                                            setTimeout(() => {
                                                map.panBy(PANEL_WIDTH / 2, 0);
                                            }, 100);
                                        }, 50);
                                    } else {
                                        // Mobile: just center on location
                                        map.setOptions({
                                            center: { lat: location.lat, lng: location.lng },
                                            zoom: 17,
                                        });
                                    }
                                }
                            }}
                            onShare={(location) => {
                                setShareLocation(location);
                            }}
                        />
                    </div>
                )}
            </div>

            {/* Instructions Footer */}
            {/* <div className="bg-gray-100 p-3 text-center text-sm text-gray-600">
                <p>
                    <strong>Test Instructions:</strong> Search for places, click GPS button, or click the map to add markers
                </p>
            </div> */}

            {/* Right Sidebar - Save or Edit */}
            <RightSidebar
                isOpen={isSidebarOpen}
                onClose={() => {
                    // Pan map back to center when closing (reverse the offset)
                    if (map && typeof window !== 'undefined') {
                        const isDesktop = window.innerWidth >= 1024;
                        if (isDesktop) {
                            const PANEL_WIDTH = 450;
                            // Pan right (panel sliding out to the right)
                            map.panBy(-PANEL_WIDTH / 2, 0);
                        }
                    }

                    setIsSidebarOpen(false);
                    setLocationToSave(null);
                    setLocationToEdit(null);
                    setIsFavorite(false);
                    setIndoorOutdoor("outdoor");
                    setShowPhotoUpload(false);
                }}
                view={sidebarView === 'save' ? 'save-location' : 'edit-location'}
                title={sidebarView === 'save' ? 'Save Location' : 'Edit Location'}
                showFavorite={true}
                isFavorite={isFavorite}
                onFavoriteToggle={() => setIsFavorite(!isFavorite)}
                showIndoorOutdoor={true}
                indoorOutdoor={indoorOutdoor}
                onIndoorOutdoorToggle={(value) => setIndoorOutdoor(value)}
                showPhotoUpload={true}
                onPhotoUploadToggle={() => setShowPhotoUpload(!showPhotoUpload)}
                showSaveButton={true}
                onSave={handleSaveClick}  // Use debounced save handler
                isSaving={isSavingLocation}  // Use dynamic state instead of hardcoded false
            >
                {/* Save Location Panel */}
                {sidebarView === 'save' && locationToSave && saveLocationInitialData && (
                    <SaveLocationPanel
                        initialData={saveLocationInitialData}
                        onSuccess={() => {
                            // Close sidebar
                            setIsSidebarOpen(false);

                            // Mark marker as permanent (saved)
                            setMarkers((prev) =>
                                prev.map((m) =>
                                    m.id === locationToSave.id
                                        ? { ...m, isTemporary: false }
                                        : m
                                )
                            );

                            // Close InfoWindow
                            setSelectedMarker(null);
                            setLocationToSave(null);
                        }}
                        onSavingChange={setIsSavingLocation}  // Wire up save state
                        showPhotoUpload={showPhotoUpload}
                    />
                )}

                {/* Edit Location Panel */}
                {sidebarView === 'edit' && locationToEdit?.userSave && locationToEdit?.data && (
                    <EditLocationPanel
                        locationId={locationToEdit.userSave.locationId}
                        location={{
                            id: locationToEdit.userSave.locationId,
                            placeId: locationToEdit.data.placeId || locationToEdit.id,
                            name: locationToEdit.data.name || 'Selected Location',
                            address: locationToEdit.data.address ?? null,
                            lat: locationToEdit.position.lat,
                            lng: locationToEdit.position.lng,
                            type: locationToEdit.data.type || locationToEdit.userSave.location?.type || '',
                            rating: locationToEdit.data.rating ?? null,
                            street: locationToEdit.data.street ?? null,
                            number: locationToEdit.data.number ?? null,
                            city: locationToEdit.data.city ?? null,
                            state: locationToEdit.data.state ?? null,
                            zipcode: locationToEdit.data.zipcode ?? null,
                            productionNotes: locationToEdit.userSave.location?.productionNotes ?? null,
                            entryPoint: locationToEdit.userSave.location?.entryPoint ?? null,
                            parking: locationToEdit.userSave.location?.parking ?? null,
                            access: locationToEdit.userSave.location?.access ?? null,
                            indoorOutdoor: locationToEdit.userSave.location?.indoorOutdoor ?? null,
                            isPermanent: locationToEdit.userSave.location?.isPermanent ?? false,
                            photoUrls: locationToEdit.userSave.location?.photoUrls ?? null,
                            permitRequired: locationToEdit.userSave.location?.permitRequired ?? false,
                            permitCost: locationToEdit.userSave.location?.permitCost ?? null,
                            contactPerson: locationToEdit.userSave.location?.contactPerson ?? null,
                            contactPhone: locationToEdit.userSave.location?.contactPhone ?? null,
                            operatingHours: locationToEdit.userSave.location?.operatingHours ?? null,
                            restrictions: locationToEdit.userSave.location?.restrictions ?? null,
                            bestTimeOfDay: locationToEdit.userSave.location?.bestTimeOfDay ?? null,
                            lastModifiedBy: locationToEdit.userSave.location?.lastModifiedBy ?? null,
                            lastModifiedAt: locationToEdit.userSave.location?.lastModifiedAt ?? null,
                            createdAt: locationToEdit.userSave.location?.createdAt || new Date(),
                            updatedAt: locationToEdit.userSave.location?.updatedAt || new Date(),
                            createdBy: locationToEdit.userSave.location?.createdBy || 0,
                            photos: locationToEdit.userSave.location?.photos ?? [],
                        }}
                        userSave={locationToEdit.userSave}
                        isFavorite={isFavorite}
                        indoorOutdoor={indoorOutdoor}
                        showPhotoUpload={showPhotoUpload}
                        onSuccess={() => {
                            // Close sidebar and InfoWindow
                            setIsSidebarOpen(false);
                            setSelectedMarker(null);
                            setLocationToEdit(null);
                        }}
                        onSavingChange={setIsSavingLocation}  // Wire up save state for EditLocationPanel
                    />
                )}
            </RightSidebar>

            {/* GPS Permission Dialog */}
            <GpsPermissionDialog
                open={showGpsDialog}
                onConfirm={handleGpsPermissionConfirm}
                onCancel={handleGpsPermissionCancel}
            />

            {/* GPS Welcome Banner (First Visit) */}
            {showWelcomeBanner && (
                <GpsWelcomeBanner
                    onEnable={handleWelcomeBannerEnable}
                    onDismiss={handleWelcomeBannerDismiss}
                />
            )}

            {/* Floating Search Bar - Appears above buttons */}
            {showSearchDialog && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 w-[30%] min-w-[300px] z-20 animate-in slide-in-from-top">
                    <div className="bg-white rounded-lg shadow-2xl border border-gray-200 p-3">
                        <div className="flex items-center gap-2">
                            <div className="flex-1">
                                <PlacesAutocomplete
                                    onPlaceSelected={(place) => {
                                        handlePlaceSelected(place);
                                        setShowSearchDialog(false);
                                    }}
                                    placeholder="Search Google Maps..."
                                />
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setShowSearchDialog(false)}
                                className="flex-shrink-0"
                            >
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Friends Dialog */}
            <FriendsDialog 
                open={showFriendsDialog} 
                onOpenChange={setShowFriendsDialog}
            />

            {/* Share Location Dialog */}
            <ShareLocationDialog
                open={!!shareLocation}
                onOpenChange={(open) => !open && setShareLocation(null)}
                location={shareLocation}
            />
        </div>
    );
}

function MapPageContent() {
    return (
        <ProtectedRoute>
            <MapPageInner />
        </ProtectedRoute>
    );
}

export default MapPageContent;
