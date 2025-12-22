'use client';

import { useState, useCallback } from 'react';
import { GoogleMap } from '@/components/maps/GoogleMap';
import { CustomMarker } from '@/components/maps/CustomMarker';
import { InfoWindow } from '@/components/maps/InfoWindow';
import { PlacesAutocomplete } from '@/components/maps/PlacesAutocomplete';
import { UserLocationMarker } from '@/components/maps/UserLocationMarker';
import { RightSidebar } from '@/components/layout/RightSidebar';
import { SaveLocationPanel } from '@/components/panels/SaveLocationPanel';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { LocationData, getUserLocation } from '@/lib/maps-utils';
import { parseAddressComponents } from '@/lib/address-utils';

interface MarkerData {
    id: string;
    position: { lat: number; lng: number };
    data?: LocationData;
    isTemporary?: boolean; // True for markers not yet saved
}

function MapPageInner() {
    const [center, setCenter] = useState({ lat: 40.7128, lng: -74.006 }); // NYC default
    const [markers, setMarkers] = useState<MarkerData[]>([]);
    const [selectedMarker, setSelectedMarker] = useState<MarkerData | null>(null);
    const [map, setMap] = useState<google.maps.Map | null>(null);
    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

    // Sidebar state
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [locationToSave, setLocationToSave] = useState<MarkerData | null>(null);

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
        const newPosition = { lat: place.latitude, lng: place.longitude };
        setCenter(newPosition);

        const newMarker: MarkerData = {
            id: place.placeId,
            position: newPosition,
            data: place,
            isTemporary: false, // Search results are not temporary
        };

        setMarkers((prev) => [...prev, newMarker]);
        setSelectedMarker(newMarker);

        // Pan to location
        if (map) {
            // map.panTo(newPosition);
            // map.setZoom(16);
            map.setOptions({
                center: newPosition,
                zoom: 16,
            });
        }
    }, [map]);

    const handleGPSClick = async () => {
        try {
            const position = await getUserLocation();
            setCenter(position);
            setUserLocation(position); // Show blue dot
            if (map) {
                //   map.panTo(position);
                //   map.setZoom(17); // Closer zoom for street-level detail
                map.setOptions({
                    center: position,
                    zoom: 15,
                });
            }
        } catch (error) {
            console.error('Error getting location:', error);
        }
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
                };

                setSelectedMarker(newMarker);
            }
        } catch (error) {
            console.error('Error getting location details:', error);
        }
    };

    const handleMarkerClick = useCallback((marker: MarkerData) => {
        setSelectedMarker(marker);
    }, []);

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

    return (
        <div className="h-screen flex flex-col">
            {/* Header with Search */}
            <div className="bg-white shadow-md p-4 z-10">
                <div className="max-w-4xl mx-auto flex gap-4 items-center">
                    <div className="flex-1">
                        <PlacesAutocomplete
                            onPlaceSelected={handlePlaceSelected}
                            placeholder="Search for a place (e.g., Central Park NYC)..."
                        />
                    </div>
                    <button
                        onClick={handleGPSClick}
                        className="px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors flex items-center gap-2"
                        title="Use my location"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                            />
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                        </svg>
                        <span className="hidden sm:inline">GPS</span>
                    </button>
                </div>
            </div>

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
                    <UserLocationMarker
                        position={userLocation}
                        onClick={handleUserLocationClick}
                    />

                    {/* Render all markers */}
                    {markers.map((marker) => (
                        <CustomMarker
                            key={marker.id}
                            position={marker.position}
                            title={marker.data?.name || 'Custom location'}
                            onClick={() => handleMarkerClick(marker)}
                            isTemporary={marker.isTemporary} // Pass temporary status
                        />
                    ))}

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
                                    <button
                                        onClick={() => {
                                            setLocationToSave(selectedMarker);
                                            setIsSidebarOpen(true);
                                        }}
                                        className="px-3 py-1 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700 transition-colors"
                                    >
                                        Save
                                    </button>
                                    <button
                                        onClick={async () => {
                                            // Quick Save: save with minimal info
                                            if (!selectedMarker.data) return;

                                            try {
                                                const response = await fetch('/api/locations', {
                                                    method: 'POST',
                                                    headers: { 'Content-Type': 'application/json' },
                                                    body: JSON.stringify({
                                                        placeId: selectedMarker.data.placeId || selectedMarker.id,
                                                        name: selectedMarker.data.name,
                                                        address: selectedMarker.data.address,
                                                        lat: selectedMarker.position.lat,
                                                        lng: selectedMarker.position.lng,
                                                        quickSave: true, // Flag for quick save
                                                    }),
                                                });

                                                if (response.ok) {
                                                    // Mark marker as permanent (saved)
                                                    setMarkers((prev) =>
                                                        prev.map((m) =>
                                                            m.id === selectedMarker.id
                                                                ? { ...m, isTemporary: false }
                                                                : m
                                                        )
                                                    );

                                                    // Close InfoWindow
                                                    setSelectedMarker(null);

                                                    // Show success feedback
                                                    alert('Location quick saved! You can add more details later.');
                                                } else {
                                                    alert('Failed to save location');
                                                }
                                            } catch (error) {
                                                console.error('Quick save error:', error);
                                                alert('Failed to save location');
                                            }
                                        }}
                                        className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                                        title="Quick save with basic info"
                                    >
                                        Quick Save
                                    </button>
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
            </div>

            {/* Instructions Footer */}
            <div className="bg-gray-100 p-3 text-center text-sm text-gray-600">
                <p>
                    <strong>Test Instructions:</strong> Search for places, click GPS button, or click the map to add markers
                </p>
            </div>

            {/* Right Sidebar with SaveLocationPanel */}
            <RightSidebar
                isOpen={isSidebarOpen}
                onClose={() => {
                    setIsSidebarOpen(false);
                    setLocationToSave(null);
                }}
                view="save-location"
                title="Save Location"
            >
                {locationToSave && (
                    <SaveLocationPanel
                        initialData={{
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
                        }}
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
                        onCancel={() => {
                            setIsSidebarOpen(false);
                            setLocationToSave(null);
                        }}
                    />
                )}
            </RightSidebar>
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
