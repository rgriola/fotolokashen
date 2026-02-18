/**
 * MAP PAGE - Main Interactive Map View
 * 
 * OVERVIEW:
 * This page displays an interactive Google Map showing the user's saved locations
 * and optionally public locations from other users. The map auto-fits to show all
 * locations on initial load and provides interactive controls for saving, editing,
 * and managing locations.
 * 
 * DATA FLOW:
 * 1. User's saved locations are loaded via useLocations() hook (always fetched)
 * 2. Public locations are loaded via usePublicLocations() hook when toggle is enabled
 * 3. Public locations are filtered by current map bounds to only show visible area
 * 4. Markers are deduplicated by placeId (user's saved locations take precedence)
 * 
 * AUTO-FIT BEHAVIOR (Initial Load):
 * - Map starts with neutral default center (NYC: 40.7128, -74.006)
 * - Once markers load, fitBounds() is called to show all user + public locations
 * - Zoom is capped at 16 to prevent over-zooming on single/few locations
 * - hasInitialFit flag prevents re-fitting when markers update later
 * - After auto-fit completes, map's 'idle' event updates bounds for public locations
 * 
 * PUBLIC LOCATIONS:
 * - Default: enabled (showPublicLocations = true)
 * - Only loads locations within current map viewport (bounds)
 * - Bounds update on map pan/zoom via 'idle' event listener
 * - Color: purple (#A855F7) to distinguish from user's locations
 * - Shows owner username on marker click
 * 
 * MARKER TYPES:
 * - Temporary (red): Newly clicked location, not yet saved
 * - Saved (custom color): User's saved locations with clustering
 * - Public (purple): Other users' saved locations with clustering
 * - Home (house icon): User's designated home location (if set)
 * - User (blue dot): User's current GPS location (if enabled)
 * 
 * DEDUPLICATION:
 * - Public and saved markers are deduplicated by Google Places placeId
 * - User's saved locations always take precedence over public versions
 * - Temporary markers are never deduplicated (always shown)
 * 
 * KEY INTERACTIONS:
 * - Click map: Create temporary marker, reverse geocode to get place info
 * - Click marker: Show info window or open details panel (saved locations)
 * - Click "Global View": Fit bounds to show all saved locations
 * - Toggle Public Locations: Show/hide locations from other users
 * - Search: Autocomplete search to find and center on locations
 * 
 * URL PARAMETERS:
 * - lat/lng/zoom: Navigate to specific location (from My Locations page)
 * - edit: Open edit panel for specific location ID
 * - When URL params exist, auto-fit is skipped to respect the navigation intent
 */

'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { GoogleMap } from '@/components/maps/GoogleMap';
import { CustomMapControls } from '@/components/maps/CustomMapControls';
import { CustomMarker } from '@/components/maps/CustomMarker';
import { ClusteredMarkers } from '@/components/maps/ClusteredMarkers';
import { InfoWindow } from '@/components/maps/InfoWindow';
import { PlacesAutocomplete } from '@/components/maps/PlacesAutocomplete';
import { UserLocationMarker } from '@/components/maps/UserLocationMarker';
import { HomeLocationMarker } from '@/components/maps/HomeLocationMarker';
import { RightSidebar } from '@/components/layout/RightSidebar';
import { SaveLocationPanel } from '@/components/panels/SaveLocationPanel';
import { LocationDetailPanel } from '@/components/panels/LocationDetailPanel';
import { SavedLocationsPanel } from '@/components/panels/SavedLocationsPanel';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { LocationData } from '@/lib/maps-utils';
import { parseAddressComponents } from '@/lib/address-utils';
import { useLocations } from '@/hooks/useLocations';
import { usePublicLocations } from '@/hooks/usePublicLocations';
import { UserSave, Location } from '@/types/location';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { GpsPermissionDialog } from '@/components/maps/GpsPermissionDialog';
import { GpsWelcomeBanner } from '@/components/maps/GpsWelcomeBanner';
import { useGpsLocation } from '@/hooks/useGpsLocation';
import { MapControls } from '@/components/maps/MapControls';
import { FriendsDialog } from '@/components/map/FriendsDialog';
import { ShareLocationDialog } from '@/components/dialogs/ShareLocationDialog';
import { MapPin as MapPinIcon, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { VisuallyHidden } from '@/components/ui/visually-hidden';
import { OnboardingProvider } from '@/components/onboarding/OnboardingProvider';
import { WelcomeModal } from '@/components/onboarding/WelcomeModal';
import { CompletionModal } from '@/components/onboarding/CompletionModal';
import { OnboardingTour } from '@/components/onboarding/OnboardingTour';
import { TermsModal } from '@/components/onboarding/TermsModal';

interface MarkerData {
    id: string;
    position: { lat: number; lng: number };
    data?: LocationData;
    isTemporary?: boolean; // True for markers not yet saved
    userSave?: UserSave; // User save data if this is a saved location
    color?: string; // Marker color for saved locations
    isPublic?: boolean; // True for public locations from other users
    ownerUsername?: string; // Username of location owner for public locations
}

function MapPageInner() {
    const searchParams = useSearchParams();
    const [markers, setMarkers] = useState<MarkerData[]>([]);
    const [selectedMarker, setSelectedMarker] = useState<MarkerData | null>(null);
    const [map, setMap] = useState<google.maps.Map | null>(null);
    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [showFriendsDialog, setShowFriendsDialog] = useState(false);
    const [shareLocation, setShareLocation] = useState<Location | null>(null);
    const [hasInitialFit, setHasInitialFit] = useState(false);

    // Sidebar state
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [sidebarView, setSidebarView] = useState<'save'>('save');
    const [locationToSave, setLocationToSave] = useState<MarkerData | null>(null);
    const [locationToEdit, setLocationToEdit] = useState<MarkerData | null>(null);
    const [showDetailsSheet, setShowDetailsSheet] = useState(false);
    const [isFavorite, setIsFavorite] = useState(false);
    const [indoorOutdoor, setIndoorOutdoor] = useState<"indoor" | "outdoor">("outdoor");
    const [showSearchDialog, setShowSearchDialog] = useState(false);
    
    // Public locations state
    const [showPublicLocations, setShowPublicLocations] = useState(true);
    const [mapBounds, setMapBounds] = useState<{
        north: number;
        south: number;
        east: number;
        west: number;
    } | null>(null);

    // Helper function to expand bounds for loading locations outside viewport
    // Adds 25% padding on each side to pre-load nearby locations
    const expandBounds = useCallback((bounds: google.maps.LatLngBounds) => {
        const ne = bounds.getNorthEast();
        const sw = bounds.getSouthWest();
        
        const latSpan = ne.lat() - sw.lat();
        const lngSpan = ne.lng() - sw.lng();
        
        const latPadding = latSpan * 0.25; // 25% padding
        const lngPadding = lngSpan * 0.25;
        
        return {
            north: ne.lat() + latPadding,
            south: sw.lat() - latPadding,
            east: ne.lng() + lngPadding,
            west: sw.lng() - lngPadding,
        };
    }, []);


    // GPS permission state
    const { user } = useAuth();
    const router = useRouter();
    const { requestLocation, updateUserPermission } = useGpsLocation();
    const [showGpsDialog, setShowGpsDialog] = useState(false);
    const [gpsEnabled, setGpsEnabled] = useState(false);
    // Lazy initialize showWelcomeBanner from localStorage
    const [showWelcomeBanner, setShowWelcomeBanner] = useState(() => {
        if (typeof window !== 'undefined') {
            const dismissed = localStorage.getItem('gpsWelcomeBannerDismissed');
            return !dismissed;
        }
        return false;
    });
    const [showLocationsPanel, setShowLocationsPanel] = useState(false);

    // Use neutral default center (NYC) - auto-fit will adjust to show all locations
    const defaultCenter = useMemo(() => {
        return { lat: 40.7128, lng: -74.006 }; // NYC
    }, []);

    const [center, setCenter] = useState(defaultCenter);

    // Hide welcome banner if user is not eligible (sync with user profile)
    useEffect(() => {
        if (user && user.gpsPermission !== 'not_asked') {
            setShowWelcomeBanner(false);
        }
    }, [user]);

    // Load saved locations
    const { data: locationsData } = useLocations();
    
    // Load public locations when enabled
    const { data: publicLocationsData } = usePublicLocations({
        bounds: mapBounds || undefined,
        enabled: showPublicLocations,
    });
    
    // Update bounds when public locations toggle is turned on (after initial fit)
    useEffect(() => {
        if (showPublicLocations && map && hasInitialFit) {
            const bounds = map.getBounds();
            if (bounds) {
                setMapBounds(expandBounds(bounds));
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [showPublicLocations, map, hasInitialFit]);

    // Populate markers from saved locations
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
                        placeId: publicLoc.placeId,
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
                    markerMap.set(marker.data.placeId, marker); // Overwrite public with saved
                }
            }
            // Add any temporary markers
            setMarkers(prev => {
                const tempMarkers = prev.filter(m => m.isTemporary);
                return [...Array.from(markerMap.values()), ...tempMarkers];
            });
        }
    }, [locationsData, publicLocationsData, showPublicLocations]);

    // Fit map bounds to show all markers on initial load
    useEffect(() => {
        // Don't auto-fit if URL has specific coordinates (navigation from My Locations)
        const hasUrlCoords = searchParams.get('lat') && searchParams.get('lng');
        
        if (map && markers.length > 0 && !hasInitialFit && !hasUrlCoords) {
            const bounds = new google.maps.LatLngBounds();
            let hasValidMarkers = false;

            // Add all non-temporary markers to bounds
            markers.forEach((marker) => {
                if (!marker.isTemporary) {
                    bounds.extend(marker.position);
                    hasValidMarkers = true;
                }
            });

            // Fit bounds if we have valid markers
            if (hasValidMarkers) {
                map.fitBounds(bounds);
                
                // Add some padding to prevent over-zooming (same as Global View button)
                setTimeout(() => {
                    if (map.getZoom()! > 16) {
                        map.setZoom(16);
                    }
                    // Mark initial fit as complete - let 'idle' event handle bounds update
                    setHasInitialFit(true);
                }, 100);
            }
        }
    }, [map, markers, hasInitialFit, searchParams, showPublicLocations, expandBounds]);

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
                    .then(data => {
                        // Extract userSave from API response
                        const userSaveData = data.userSave;
                        const locationData = userSaveData?.location;
                        
                        if (!userSaveData || !locationData) {
                            throw new Error('Invalid location data');
                        }
                        
                        // Create marker data from location
                        const markerData = {
                            id: locationData.placeId,
                            position: { lat: locationData.lat, lng: locationData.lng },
                            data: {
                                placeId: locationData.placeId,
                                name: locationData.name,
                                address: locationData.address,
                                type: locationData.type,
                                rating: locationData.rating,
                                street: locationData.street,
                                number: locationData.number,
                                city: locationData.city,
                                state: locationData.state,
                                zipcode: locationData.zipcode,
                                productionNotes: locationData.productionNotes,
                                entryPoint: locationData.entryPoint,
                                parking: locationData.parking,
                                access: locationData.access,
                                indoorOutdoor: locationData.indoorOutdoor,
                                isPermanent: locationData.isPermanent,
                                photoUrls: locationData.photoUrls,
                                permitRequired: locationData.permitRequired,
                                permitCost: locationData.permitCost,
                                contactPerson: locationData.contactPerson,
                                contactPhone: locationData.contactPhone,
                                operatingHours: locationData.operatingHours,
                                restrictions: locationData.restrictions,
                                bestTimeOfDay: locationData.bestTimeOfDay,
                            },
                            userSave: userSaveData,
                        };

                        // Open edit panel
                        setLocationToEdit(markerData as unknown as MarkerData);
                        setShowDetailsSheet(true);
                        setIsSidebarOpen(false); //  Close save panel if open

                        // No need to load states for details view

                        // Pan map with offset for desktop
                        if (typeof window !== 'undefined') {
                            const isDesktop = window.innerWidth >= 1024;
                            if (isDesktop) {
                                const PANEL_WIDTH = window.innerWidth / 2; // 50% of viewport
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
        
        // Add listener for bounds changes to update public locations
        // Skip during initial auto-fit to prevent multiple API calls
        mapInstance.addListener('idle', () => {
            if (showPublicLocations && hasInitialFit) {
                const bounds = mapInstance.getBounds();
                if (bounds) {
                    setMapBounds(expandBounds(bounds));
                }
            }
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [showPublicLocations, hasInitialFit]);

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
        // If GPS is currently enabled, toggle it off
        if (gpsEnabled && userLocation) {
            setGpsEnabled(false);
            setUserLocation(null);
            return;
        }

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
            setGpsEnabled(true);
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
            setGpsEnabled(true);
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
        // For public locations from other users: show read-only InfoWindow with owner info
        if (marker.isPublic) {
            setSelectedMarker(marker);
            
            // Center map on the selected location with smooth animation
            if (map) {
                map.panTo(marker.position);
                if (map.getZoom()! < 16) {
                    map.setZoom(16);
                }
            }
            return;
        }
        
        // For saved markers: show Details Panel
        if (!marker.isTemporary && marker.userSave) {
            // Remove any temporary markers when clicking a saved marker
            setMarkers((prev) => prev.filter((m) => !m.isTemporary));

            // Close any open InfoWindow
            setSelectedMarker(null);

            // Open Details Panel instead of Edit Panel
            setLocationToEdit(marker);
            setShowDetailsSheet(true);

            // Center map on the selected location with smooth animation
            if (map && typeof window !== 'undefined') {
                const isDesktop = window.innerWidth >= 1024;
                
                // Use panTo for smooth animation and set zoom to 18 for better detail
                map.panTo(marker.position);
                map.setZoom(18);
                
                if (isDesktop) {
                    // After centering, pan to accommodate panel (right side)
                    const PANEL_WIDTH = window.innerWidth / 2; // 50% of viewport
                    setTimeout(() => {
                        map.panBy(PANEL_WIDTH / 2, 0);
                    }, 300);
                }
            }
        } else {
            // For temporary markers: show InfoWindow as before
            setSelectedMarker(marker);

            // Zoom to street level and pan to marker
            if (map) {
                map.panTo(marker.position);
                map.setZoom(17);
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
                    {/* User location blue dot - only show when GPS is enabled */}
                    {gpsEnabled && (
                        <UserLocationMarker
                            position={userLocation}
                            onClick={handleUserLocationClick}
                        />
                    )}

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
                                {/* Show owner for public locations */}
                                {selectedMarker.isPublic && selectedMarker.ownerUsername && (
                                    <div className="flex items-center gap-2 mt-2 p-2 bg-purple-50 rounded border border-purple-200">
                                        <div className="text-sm">
                                            <span className="text-gray-600">Shared by </span>
                                            <a 
                                                href={`/${selectedMarker.ownerUsername}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="font-medium text-purple-600 hover:text-purple-700 hover:underline"
                                            >
                                                @{selectedMarker.ownerUsername}
                                            </a>
                                        </div>
                                    </div>
                                )}
                                {selectedMarker.data?.rating && (
                                    <div className="flex items-center gap-1">
                                        <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                        </svg>
                                        <span className="text-sm font-medium">{selectedMarker.data.rating}</span>
                                    </div>
                                )}
                                <div className="flex gap-2 mt-2">
                                    {/* View button for saved locations (not public) */}
                                    {selectedMarker.userSave && !selectedMarker.isPublic && (
                                        <button
                                            onClick={() => {
                                                setLocationToEdit(selectedMarker);
                                                setShowDetailsSheet(true);

                                                // Center map on the selected location with smooth animation
                                                if (map && typeof window !== 'undefined') {
                                                    const isDesktop = window.innerWidth >= 1024;
                                                    
                                                    // Use panTo for smooth animation and set zoom to 18 for better detail
                                                    map.panTo(selectedMarker.position);
                                                    map.setZoom(18);
                                                    
                                                    if (isDesktop) {
                                                        // After centering, pan to accommodate panel (right side)
                                                        const PANEL_WIDTH = window.innerWidth / 2; // 50% of viewport
                                                        setTimeout(() => {
                                                            map.panBy(PANEL_WIDTH / 2, 0);
                                                        }, 300);
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
                                                        const PANEL_WIDTH = window.innerWidth / 2; // 50% of viewport
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

                {/* GPS Coordinates Display - Top Right, to the left of map controls */}
                <div 
                    className={`
                        fixed top-20 z-10
                        bg-black/50 text-white px-3 py-2 rounded-lg text-sm font-medium shadow-lg
                        transition-all duration-300 ease-in-out
                        ${(isSidebarOpen || showDetailsSheet || showLocationsPanel) ? 'right-[calc(50%+14rem)]' : 'right-56'}
                    `}
                >
                    {gpsEnabled && userLocation ? (
                        <div className="flex gap-3">
                            <span>Lat: {userLocation.lat.toFixed(3)}</span>
                            <span>Lng: {userLocation.lng.toFixed(3)}</span>
                        </div>
                    ) : (
                        <div>Toggle GPS</div>
                    )}
                </div>

                {/* Custom Map Controls - Top Right (Map type + Zoom) */}
                <CustomMapControls 
                    map={map}
                    rightPanelOpen={isSidebarOpen || showDetailsSheet || showLocationsPanel}
                />

                {/* Map Controls - Responsive (Desktop: left-side vertical buttons, Mobile: bottom floating menu) */}
                <MapControls
                    userLocation={userLocation}
                    onGpsToggle={handleGPSClick}
                    onSearchClick={() => setShowSearchDialog(true)}
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
                    onPublicToggle={(showPublic) => setShowPublicLocations(showPublic)}
                    showPublicLocations={showPublicLocations}
                    savedLocationsCount={markers.filter(m => !m.isTemporary && !m.isPublic).length}
                />

                {/* Locations Panel - Slide in from right, same width as save/edit panels */}
                {showLocationsPanel && (
                    <div className="absolute top-0 right-0 h-full w-full sm:w-1/2 bg-white shadow-2xl z-20 flex flex-col animate-in slide-in-from-right">
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
                                // Just open the details panel
                                setLocationToEdit(markerData as unknown as MarkerData);
                                setShowDetailsSheet(true);

                                // Center map on the selected location with smooth animation
                                if (map && typeof window !== 'undefined') {
                                    const isDesktop = window.innerWidth >= 1024;
                                    
                                    // Use panTo for smooth animation and set zoom to 18 for better detail
                                    map.panTo({ lat: location.lat, lng: location.lng });
                                    map.setZoom(18);
                                    
                                    if (isDesktop) {
                                        // After centering, pan to accommodate panel (right side)
                                        const PANEL_WIDTH = window.innerWidth / 2; // 50% of viewport
                                        setTimeout(() => {
                                            map.panBy(PANEL_WIDTH / 2, 0);
                                        }, 300);
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
                            const PANEL_WIDTH = window.innerWidth / 2; // 50% of viewport
                            // Pan right (panel sliding out to the right)
                            map.panBy(-PANEL_WIDTH / 2, 0);
                        }
                    }

                    setIsSidebarOpen(false);
                    setLocationToSave(null);
                    setLocationToEdit(null);
                    setIsFavorite(false);
                    setIndoorOutdoor("outdoor");
                }}
                view='save-location'
                title='Save Location'
                showFavorite={false}
                isFavorite={isFavorite}
                onFavoriteToggle={() => setIsFavorite(!isFavorite)}
                showIndoorOutdoor={false}
                indoorOutdoor={indoorOutdoor}
                onIndoorOutdoorToggle={(value) => setIndoorOutdoor(value)}
                showSaveButton={false}  // Save button is now at bottom of form
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
                        showPhotoUpload={true}  // Always show photo upload
                    />
                )}
            </RightSidebar>

            {/* Location Details Sheet */}
            <Sheet open={showDetailsSheet} onOpenChange={setShowDetailsSheet}>
                <SheetContent className="w-full sm:w-1/2 p-0" hideOverlay={true}>
                    <SheetHeader>
                        <VisuallyHidden>
                            <SheetTitle>
                                {locationToEdit?.data?.name || locationToEdit?.userSave?.location?.name || "Location Details"}
                            </SheetTitle>
                        </VisuallyHidden>
                    </SheetHeader>
                    <div className="h-full">
                        {locationToEdit?.userSave?.location && locationToEdit?.position && (
                            <LocationDetailPanel
                                location={{
                                    id: locationToEdit.userSave.locationId,
                                    placeId: locationToEdit.data?.placeId || locationToEdit.id,
                                    name: locationToEdit.data?.name || 'Selected Location',
                                    address: locationToEdit.data?.address ?? null,
                                    lat: locationToEdit.position?.lat ?? 0,
                                    lng: locationToEdit.position?.lng ?? 0,
                                    type: locationToEdit.data?.type || locationToEdit.userSave.location?.type || '',
                                    rating: locationToEdit.data?.rating ?? null,
                                    street: locationToEdit.data?.street ?? null,
                                    number: locationToEdit.data?.number ?? null,
                                    city: locationToEdit.data?.city ?? null,
                                    state: locationToEdit.data?.state ?? null,
                                    zipcode: locationToEdit.data?.zipcode ?? null,
                                    productionDate: locationToEdit.userSave.location?.productionDate ?? null,
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
                                    userSave: locationToEdit.userSave,
                                }}
                                source="user"
                                canEdit={
                                    user?.isAdmin ||
                                    user?.role === 'staffer' ||
                                    user?.role === 'super_admin' ||
                                    (locationToEdit.userSave.location?.createdBy === user?.id)
                                }
                                onEdit={() => {
                                    // Navigate to /locations with edit parameter
                                    const userSaveId = locationToEdit.userSave?.id;
                                    if (userSaveId) {
                                        router.push(`/locations?edit=${userSaveId}`);
                                    } else {
                                        router.push('/locations');
                                    }
                                    setShowDetailsSheet(false);
                                }}
                                onDelete={async (id) => {
                                    // Delete location via API
                                    try {
                                        const response = await fetch(`/api/locations/${id}`, { 
                                            method: 'DELETE' 
                                        });
                                        if (response.ok) {
                                            setShowDetailsSheet(false);
                                            setLocationToEdit(null);
                                            // Remove marker from map
                                            setMarkers(prev => prev.filter(m => m.userSave?.id !== id));
                                            toast.success('Location deleted');
                                        } else {
                                            toast.error('Failed to delete location');
                                        }
                                    } catch (error) {
                                        console.error('Delete error:', error);
                                        toast.error('Failed to delete location');
                                    }
                                }}
                                onShare={(location) => {
                                    setShareLocation({
                                        ...location,
                                        userSave: locationToEdit.userSave,
                                    } as Location);
                                }}
                                onViewOnMap={() => {
                                    // Already on map, just close sheet
                                    setShowDetailsSheet(false);
                                }}
                            />
                        )}
                    </div>
                </SheetContent>
            </Sheet>

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
                <div className="absolute top-20 left-20 w-100 max-w-[calc(100vw-6rem)] z-20 animate-in slide-in-from-left">
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
                                className="shrink-0"
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
    const { user } = useAuth();
    const [userOnboardingStatus, setUserOnboardingStatus] = useState<{
        onboardingCompleted: boolean;
        onboardingSkipped: boolean;
        onboardingStep: number | null;
        termsAccepted: boolean;
    } | null>(null);

    // Fetch user onboarding status
    useEffect(() => {
        if (user?.id) {
            fetch('/api/v1/users/me', {
                credentials: 'include',
            })
                .then(res => res.json())
                .then(data => {
                    if (data.user) {
                        setUserOnboardingStatus({
                            onboardingCompleted: data.user.onboardingCompleted ?? false,
                            onboardingSkipped: data.user.onboardingSkipped ?? false,
                            onboardingStep: data.user.onboardingStep ?? null,
                            termsAccepted: !!data.user.termsAcceptedAt,
                        });
                    }
                })
                .catch(err => console.error('Failed to fetch onboarding status:', err));
        }
    }, [user?.id]);

    return (
        <ProtectedRoute>
            <OnboardingProvider userOnboardingStatus={userOnboardingStatus ?? undefined}>
                <MapPageInner />
                <TermsModal />
                <WelcomeModal />
                <CompletionModal />
                <OnboardingTour />
            </OnboardingProvider>
        </ProtectedRoute>
    );
}

export default MapPageContent;
