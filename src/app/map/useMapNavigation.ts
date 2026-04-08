'use client';

import { useState, useCallback, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import type { MarkerData, MapBounds } from './types';

interface UseMapNavigationOptions {
    markers: MarkerData[];
    showPublicLocations: boolean;
    expandBounds: (bounds: google.maps.LatLngBounds) => MapBounds;
    setMapBounds: (bounds: MapBounds) => void;
    onLocationFromUrl?: (markerData: MarkerData) => void;
}

interface UseMapNavigationReturn {
    map: google.maps.Map | null;
    hasInitialFit: boolean;
    handleMapLoad: (mapInstance: google.maps.Map) => void;
    panToWithOffset: (position: { lat: number; lng: number }, zoom?: number) => void;
}

export function useMapNavigation({
    markers,
    showPublicLocations,
    expandBounds,
    setMapBounds,
    onLocationFromUrl,
}: UseMapNavigationOptions): UseMapNavigationReturn {
    const searchParams = useSearchParams();
    const [map, setMap] = useState<google.maps.Map | null>(null);
    const [hasInitialFit, setHasInitialFit] = useState(false);

    // Shared utility: pan to position with optional panel offset for desktop
    const panToWithOffset = useCallback((
        position: { lat: number; lng: number },
        zoom?: number,
    ) => {
        if (!map) return;

        map.panTo(position);
        if (zoom !== undefined) {
            map.setZoom(zoom);
        }

        if (typeof window !== 'undefined') {
            const isDesktop = window.innerWidth >= 1024;
            if (isDesktop) {
                const PANEL_WIDTH = window.innerWidth / 2;
                setTimeout(() => {
                    map.panBy(PANEL_WIDTH / 2, 0);
                }, 300);
            }
        }
    }, [map]);

    const handleMapLoad = useCallback((mapInstance: google.maps.Map) => {
        setMap(mapInstance);

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

    // Update bounds when public locations toggle is turned on
    useEffect(() => {
        if (showPublicLocations && map && hasInitialFit) {
            const bounds = map.getBounds();
            if (bounds) {
                setMapBounds(expandBounds(bounds));
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [showPublicLocations, map, hasInitialFit]);

    // Fit map bounds to show all markers on initial load
    useEffect(() => {
        const hasUrlCoords = searchParams.get('lat') && searchParams.get('lng');

        if (map && markers.length > 0 && !hasInitialFit && !hasUrlCoords) {
            const bounds = new google.maps.LatLngBounds();
            let hasValidMarkers = false;

            markers.forEach((marker) => {
                if (!marker.isTemporary) {
                    bounds.extend(marker.position);
                    hasValidMarkers = true;
                }
            });

            if (hasValidMarkers) {
                map.fitBounds(bounds);

                setTimeout(() => {
                    if (map.getZoom()! > 16) {
                        map.setZoom(16);
                    }
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

            if (editLocationId && onLocationFromUrl) {
                fetch(`/api/locations/${editLocationId}`)
                    .then(res => res.json())
                    .then(data => {
                        const userSaveData = data.userSave;
                        const locationData = userSaveData?.location;

                        if (!userSaveData || !locationData) {
                            throw new Error('Invalid location data');
                        }

                        const markerData = {
                            id: locationData.placeId,
                            position: { lat: locationData.lat, lng: locationData.lng },
                            data: {
                                placeId: locationData.placeId,
                                name: locationData.name,
                                address: locationData.address,
                                type: locationData.type,
                                rating: locationData.rating,
                                latitude: locationData.lat,
                                longitude: locationData.lng,
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
                        } as unknown as MarkerData;

                        onLocationFromUrl(markerData);
                        panToWithOffset(position, zoom ? parseInt(zoom) : 17);
                    })
                    .catch(err => {
                        console.error('Failed to fetch location:', err);
                        map.setOptions({
                            center: position,
                            zoom: zoom ? parseInt(zoom) : 17,
                        });
                    });
            } else {
                map.setOptions({
                    center: position,
                    zoom: zoom ? parseInt(zoom) : 17,
                });
            }
        }
    }, [searchParams, map]); // eslint-disable-line react-hooks/exhaustive-deps

    return {
        map,
        hasInitialFit,
        handleMapLoad,
        panToWithOffset,
    };
}
