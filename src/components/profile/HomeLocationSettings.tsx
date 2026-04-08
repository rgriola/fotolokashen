'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Home, MapPin, Navigation, Search, Map } from 'lucide-react';
import { toast } from 'sonner';
import { TOAST } from '@/lib/constants/messages';
import { useAuth } from '@/lib/auth-context';
import { useGpsLocation } from '@/hooks/useGpsLocation';
import { PlacesAutocomplete } from '@/components/maps/PlacesAutocomplete';
import { HomeLocationMapPicker } from '@/components/maps/HomeLocationMapPicker';

export function HomeLocationSettings() {
    const { user, refetchUser } = useAuth();
    const { requestLocation, isRequesting } = useGpsLocation();
    const [isUpdating, setIsUpdating] = useState(false);
    const [showSearch, setShowSearch] = useState(false);
    const [showMapPicker, setShowMapPicker] = useState(false);

    const updateHomeLocation = async (name: string, lat: number, lng: number) => {
        setIsUpdating(true);
        try {
            const response = await fetch('/api/auth/profile', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    homeLocationName: name,
                    homeLocationLat: lat,
                    homeLocationLng: lng,
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                toast.error(result.error || TOAST.PROFILE.HOME_LOCATION_FAILED);
                return false;
            }

            toast.success(TOAST.PROFILE.HOME_LOCATION_UPDATED);
            await refetchUser();
            return true;
        } catch (error) {
            console.error('Update home location error:', error);
            toast.error(TOAST.GENERIC.UNEXPECTED);
            return false;
        } finally {
            setIsUpdating(false);
        }
    };

    const handleUseGPS = async () => {
        // Request GPS location
        const position = await requestLocation();
        if (!position) return;

        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        // Reverse geocode to get address name
        try {
            const geocoder = new google.maps.Geocoder();
            const response = await geocoder.geocode({
                location: { lat, lng },
            });

            if (response.results && response.results.length > 0) {
                const address = response.results[0].formatted_address;
                await updateHomeLocation(address, lat, lng);
            } else {
                // No address found, just use coordinates
                await updateHomeLocation(`${lat.toFixed(4)}°, ${lng.toFixed(4)}°`, lat, lng);
            }
        } catch (error) {
            console.error('Reverse geocoding error:', error);
            // Fallback to coordinates
            await updateHomeLocation(`${lat.toFixed(4)}°, ${lng.toFixed(4)}°`, lat, lng);
        }
    };

    const handlePlaceSelected = async (placeData: any) => {
        if (placeData.latitude && placeData.longitude) {
            // Use full address (formatted_address) instead of just name (street)
            await updateHomeLocation(
                placeData.address || placeData.name || 'Custom Location',
                placeData.latitude,
                placeData.longitude
            );
            setShowSearch(false);
        }
    };

    const handleMapLocationSelected = async (name: string, lat: number, lng: number) => {
        await updateHomeLocation(name, lat, lng);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Home className="w-5 h-5" />
                    Home Location
                </CardTitle>
                <CardDescription>
                    Set your default map location
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Current Home Location Display */}
                {user?.homeLocationLat && user?.homeLocationLng ? (
                    <div className="bg-muted rounded-lg p-4 space-y-4">
                        {/* Static Map Preview */}
                        <div className="relative w-full h-48 rounded-lg overflow-hidden bg-muted">
                            <Image
                                src={`https://maps.googleapis.com/maps/api/staticmap?center=${user.homeLocationLat},${user.homeLocationLng}&zoom=13&size=600x400&markers=color:red%7C${user.homeLocationLat},${user.homeLocationLng}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`}
                                alt="Home location map"
                                fill
                                className="object-cover"
                                unoptimized
                            />
                        </div>
                        
                        <div>
                            <p className="text-sm font-medium mb-2">Currently set to:</p>
                            <div className="flex items-start gap-2">
                                <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                                <div className="flex-1">
                                    <p className="text-sm font-medium">
                                        {user.homeLocationName || 'Custom Location'}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {user.homeLocationLat.toFixed(4)}° N, {user.homeLocationLng.toFixed(4)}° W
                                    </p>
                                </div>
                            </div>
                            {user.homeLocationUpdated && (
                                <p className="text-xs text-muted-foreground mt-2">
                                    Last updated: {new Date(user.homeLocationUpdated).toLocaleDateString()}
                                </p>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {/* Map Placeholder */}
                        <div className="relative w-full h-48 rounded-lg overflow-hidden bg-linear-to-br from-primary/20 to-primary/10 dark:from-primary/10 dark:to-primary/10 border-2 border-dashed border-primary/30 dark:border-primary">
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                                <Map className="w-12 h-12 text-primary dark:text-primary" />
                                <p className="text-sm font-medium text-primary dark:text-primary">
                                    No home location set
                                </p>
                                <p className="text-xs text-primary dark:text-primary text-center px-4">
                                    Choose a location below to see it here
                                </p>
                            </div>
                        </div>
                        
                        {/* Info Message */}
                        <div className="bg-primary/10 dark:bg-primary/10 border border-primary/20 dark:border-primary rounded-lg p-4">
                            <p className="text-sm text-primary dark:text-primary-foreground">
                                <span className="font-semibold">Default:</span> Your map will center on New York City until you set a home location.
                            </p>
                        </div>
                    </div>
                )}

                {/* Search Input (Conditional) */}
                {showSearch && (
                    <div className="space-y-2">
                        <Label htmlFor="search-location">Search for an address</Label>
                        <PlacesAutocomplete
                            onPlaceSelected={handlePlaceSelected}
                            placeholder="Enter an address..."
                        />
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowSearch(false)}
                            className="w-full"
                        >
                            Cancel
                        </Button>
                    </div>
                )}

                {/* Action Buttons */}
                {!showSearch && (
                    <div className="grid grid-cols-3 gap-2">
                        <Button
                            onClick={handleUseGPS}
                            disabled={isUpdating || isRequesting}
                            variant="outline"
                        >
                            <Navigation className="w-4 h-4 mr-2" />
                            {isRequesting ? 'Getting...' : 'Use GPS'}
                        </Button>
                        <Button
                            onClick={() => setShowSearch(true)}
                            disabled={isUpdating}
                            variant="outline"
                        >
                            <Search className="w-4 h-4 mr-2" />
                            Search
                        </Button>
                        <Button
                            onClick={() => setShowMapPicker(true)}
                            disabled={isUpdating}
                            variant="outline"
                        >
                            <Map className="w-4 h-4 mr-2" />
                            Pick on Map
                        </Button>
                    </div>
                )}

                {/* Info Note */}
                <div className="bg-muted/50 rounded-md p-3">
                    <p className="text-xs text-muted-foreground">
                        This location will be used as the default center when you open the map.
                    </p>
                </div>

                {/* Map Picker Modal */}
                <HomeLocationMapPicker
                    open={showMapPicker}
                    onClose={() => setShowMapPicker(false)}
                    onLocationSelected={handleMapLocationSelected}
                    currentLocation={
                        user?.homeLocationLat && user?.homeLocationLng
                            ? {
                                lat: user.homeLocationLat,
                                lng: user.homeLocationLng,
                                name: user.homeLocationName || '',
                            }
                            : undefined
                    }
                />
            </CardContent>
        </Card>
    );
}
