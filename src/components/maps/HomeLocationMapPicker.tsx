'use client';

import { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { GoogleMap } from '@/components/maps/GoogleMap';
import { MapPin, Home } from 'lucide-react';
import { toast } from 'sonner';

interface HomeLocationMapPickerProps {
    open: boolean;
    onClose: () => void;
    onLocationSelected: (name: string, lat: number, lng: number) => void;
    currentLocation?: {
        lat: number;
        lng: number;
        name: string;
    };
}

export function HomeLocationMapPicker({
    open,
    onClose,
    onLocationSelected,
    currentLocation
}: HomeLocationMapPickerProps) {
    const [selectedPosition, setSelectedPosition] = useState<{ lat: number; lng: number } | null>(
        currentLocation ? { lat: currentLocation.lat, lng: currentLocation.lng } : null
    );
    const [locationName, setLocationName] = useState<string>(currentLocation?.name || '');
    const [isGeocoding, setIsGeocoding] = useState(false);
    const [map, setMap] = useState<google.maps.Map | null>(null);

    const handleMapClick = useCallback(async (event: google.maps.MapMouseEvent) => {
        if (!event.latLng) return;

        const lat = event.latLng.lat();
        const lng = event.latLng.lng();

        setSelectedPosition({ lat, lng });

        // Reverse geocode to get address
        setIsGeocoding(true);
        try {
            const geocoder = new google.maps.Geocoder();
            const response = await geocoder.geocode({
                location: { lat, lng },
            });

            if (response.results && response.results.length > 0) {
                const address = response.results[0].formatted_address;
                setLocationName(address);
            } else {
                setLocationName(`${lat.toFixed(4)}°, ${lng.toFixed(4)}°`);
            }
        } catch (error) {
            console.error('Reverse geocoding error:', error);
            setLocationName(`${lat.toFixed(4)}°, ${lng.toFixed(4)}°`);
        } finally {
            setIsGeocoding(false);
        }
    }, []);

    const handleConfirm = () => {
        if (!selectedPosition) {
            toast.error('Please select a location on the map');
            return;
        }

        onLocationSelected(locationName, selectedPosition.lat, selectedPosition.lng);
        onClose();
    };

    const handleCancel = () => {
        setSelectedPosition(currentLocation ? { lat: currentLocation.lat, lng: currentLocation.lng } : null);
        setLocationName(currentLocation?.name || '');
        onClose();
    };

    return (
        <Dialog open={open} onOpenChange={(open) => !open && handleCancel()}>
            <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Home className="w-5 h-5" />
                        Pick Home Location on Map
                    </DialogTitle>
                    <DialogDescription>
                        Click anywhere on the map to set your home location
                    </DialogDescription>
                </DialogHeader>

                {/* Selected Location Info */}
                {selectedPosition && (
                    <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                        <div className="flex items-start gap-2">
                            <MapPin className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                                {isGeocoding ? (
                                    <p className="text-sm text-blue-900 dark:text-blue-100">
                                        Getting address...
                                    </p>
                                ) : (
                                    <>
                                        <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                                            {locationName}
                                        </p>
                                        <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                                            {selectedPosition.lat.toFixed(6)}°, {selectedPosition.lng.toFixed(6)}°
                                        </p>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Map Container */}
                <div className="flex-1 relative rounded-lg overflow-hidden border">
                    <GoogleMap
                        center={selectedPosition || currentLocation || { lat: 40.7128, lng: -74.006 }}
                        zoom={selectedPosition ? 15 : 12}
                        onClick={handleMapClick}
                        onMapLoad={setMap}
                        className="w-full h-full"
                    >
                        {/* Selected Position Marker */}
                        {selectedPosition && (
                            <div
                                style={{
                                    position: 'absolute',
                                    transform: 'translate(-50%, -100%)',
                                }}
                            >
                                <div className="relative">
                                    <div className="absolute -top-10 left-1/2 -translate-x-1/2">
                                        <div className="bg-orange-500 text-white rounded-full p-2 shadow-lg animate-bounce">
                                            <Home className="w-6 h-6" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </GoogleMap>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={handleCancel}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleConfirm}
                        disabled={!selectedPosition || isGeocoding}
                        className="bg-orange-600 hover:bg-orange-700"
                    >
                        {isGeocoding ? 'Getting Address...' : 'Set as Home'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
