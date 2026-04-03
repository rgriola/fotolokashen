'use client';

import { useState, useEffect, useCallback } from 'react';
import { GoogleMap } from '@/components/maps/GoogleMap';
import { ClusteredMarkers } from '@/components/maps/ClusteredMarkers';
import { UserLocationMarker } from '@/components/maps/UserLocationMarker';
import { InfoWindow } from '@/components/maps/InfoWindow';
import { Button } from '@/components/ui/button';
import { Users, Locate } from 'lucide-react';
import { getColorForType } from '@/lib/location-constants';
import type { Location } from '@/types/location';

interface LocationsMapViewProps {
    locations: Location[];
}

interface MarkerData {
    id: number;
    position: { lat: number; lng: number };
    title: string;
    location: Location;
    color: string;
}

export function LocationsMapView({ locations }: LocationsMapViewProps) {
    const [map, setMap] = useState<google.maps.Map | null>(null);
    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [selectedMarker, setSelectedMarker] = useState<MarkerData | null>(null);
    const [markers, setMarkers] = useState<MarkerData[]>([]);
    const [showUserLocationInfo, setShowUserLocationInfo] = useState(false);

    // Convert locations to markers
    useEffect(() => {
        const markerData: MarkerData[] = locations.map((location) => ({
            id: location.id,
            position: {
                lat: location.lat,
                lng: location.lng,
            },
            title: location.name,
            location,
            color: location.userSave?.color || getColorForType(location.type || 'OTHER'),
        }));
        setMarkers(markerData);
    }, [locations]);

    // Center map on all locations when they load
    useEffect(() => {
        if (map && markers.length > 0) {
            const bounds = new google.maps.LatLngBounds();

            // Add all location markers to bounds
            markers.forEach((marker) => {
                bounds.extend(marker.position);
            });

            // Add user location if available
            if (userLocation) {
                bounds.extend(userLocation);
            }

            map.fitBounds(bounds);

            // Ensure minimum zoom level (don't zoom in too close if only one location)
            const listener = google.maps.event.addListenerOnce(map, 'bounds_changed', () => {
                const currentZoom = map.getZoom();
                if (currentZoom && currentZoom > 15) {
                    map.setZoom(15);
                }
            });

            return () => {
                google.maps.event.removeListener(listener);
            };
        }
    }, [map, markers, userLocation]);

    // Get user's current location
    const handleLocate = useCallback(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const pos = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                    };
                    setUserLocation(pos);

                    // Pan to user location
                    if (map) {
                        map.panTo(pos);
                        map.setZoom(15);
                    }
                },
                (error) => {
                    console.error('Error getting location:', error);
                    alert('Unable to get your location. Please check your browser permissions.');
                }
            );
        } else {
            alert('Geolocation is not supported by your browser.');
        }
    }, [map]);

    // Handle marker click
    const handleMarkerClick = (marker: MarkerData) => {
        setSelectedMarker(marker);
        setShowUserLocationInfo(false);

        // Pan to marker
        if (map) {
            map.panTo(marker.position);
        }
    };

    // Handle user location marker click
    const handleUserLocationClick = () => {
        setShowUserLocationInfo(true);
        setSelectedMarker(null);
    };

    // Handle map click (close info window)
    const handleMapClick = () => {
        setSelectedMarker(null);
        setShowUserLocationInfo(false);
    };

    // Navigate to location in main map view
    const handleViewLocation = (location: Location) => {
        window.location.href = `/map?lat=${location.lat}&lng=${location.lng}&zoom=17`;
    };

    return (
        <div className="relative h-[calc(100vh-16rem)] min-h-[500px] w-full rounded-lg overflow-hidden border">
            {/* Map Controls Overlay */}
            <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
                {/* GPS Location Button */}
                <Button
                    variant="secondary"
                    size="icon"
                    onClick={handleLocate}
                    title="Show my location"
                    className="bg-white hover:bg-muted shadow-lg"
                >
                    <Locate className="w-5 h-5" />
                </Button>



                {/* Location Count Badge */}
                <div className="bg-white px-4 py-2 rounded-lg shadow-lg">
                    <p className="text-sm font-medium">
                        {markers.length} location{markers.length !== 1 ? 's' : ''}
                    </p>
                </div>
            </div>

            {/* Google Map */}
            <GoogleMap
                center={markers.length > 0 ? markers[0].position : { lat: 40.7128, lng: -74.006 }}
                zoom={12}
                onMapLoad={setMap}
                onClick={handleMapClick}
                className="w-full h-full"
            >
                {/* User Location Marker (Blue Dot) */}
                {userLocation && (
                    <UserLocationMarker
                        position={userLocation}
                        onClick={handleUserLocationClick}
                    />
                )}

                {/* Clustered Saved Location Markers */}
                <ClusteredMarkers
                    map={map}
                    markers={markers.map(marker => ({
                        position: marker.position,
                        title: marker.title,
                        color: marker.color,
                        onClick: () => handleMarkerClick(marker),
                    }))}
                />

                {/* Info Window for Selected Location */}
                {selectedMarker && (
                    <InfoWindow
                        position={selectedMarker.position}
                        onClose={() => setSelectedMarker(null)}
                    >
                        <div className="p-2 max-w-xs">
                            <h3 className="font-semibold text-lg mb-2">
                                {selectedMarker.location.name}
                            </h3>
                            <p className="text-sm text-muted-foreground mb-2">
                                {selectedMarker.location.address}
                            </p>

                            {/* Location Type Badge */}
                            {selectedMarker.location.type && (
                                <div className="mb-2">
                                    <span
                                        className="inline-block px-2 py-1 text-xs font-medium text-white rounded"
                                        style={{ backgroundColor: selectedMarker.color }}
                                    >
                                        {selectedMarker.location.type}
                                    </span>
                                </div>
                            )}

                            {/* Personal Rating */}
                            {selectedMarker.location.userSave?.personalRating ? (
                                <div className="flex items-center gap-1 mb-2">
                                    <span className="text-warning">
                                        {'★'.repeat(selectedMarker.location.userSave.personalRating)}
                                    </span>
                                    <span className="text-muted-foreground">
                                        {'★'.repeat(5 - selectedMarker.location.userSave.personalRating)}
                                    </span>
                                </div>
                            ) : null}

                            {/* Coordinates */}
                            <p className="text-xs text-muted-foreground mb-3">
                                {selectedMarker.position.lat.toFixed(3)}, {selectedMarker.position.lng.toFixed(3)}
                            </p>

                            {/* Action Button */}
                            <Button
                                size="sm"
                                onClick={() => handleViewLocation(selectedMarker.location)}
                                className="w-full"
                            >
                                View in Map
                            </Button>
                        </div>
                    </InfoWindow>
                )}

                {/* Info Window for User Location */}
                {showUserLocationInfo && userLocation && (
                    <InfoWindow
                        position={userLocation}
                        onClose={() => setShowUserLocationInfo(false)}
                    >
                        <div className="p-2">
                            <h3 className="font-semibold mb-1">Your Location</h3>
                            <p className="text-xs text-muted-foreground">
                                {userLocation.lat.toFixed(6)}, {userLocation.lng.toFixed(6)}
                            </p>
                        </div>
                    </InfoWindow>
                )}
            </GoogleMap>
        </div>
    );
}
