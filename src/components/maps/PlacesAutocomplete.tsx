'use client';

import { Autocomplete } from '@react-google-maps/api';
import { useState, useRef } from 'react';
import { extractPlaceData, LocationData } from '@/lib/maps-utils';
import { toast } from 'sonner';

interface PlacesAutocompleteProps {
    onPlaceSelected: (place: LocationData) => void;
    className?: string;
    placeholder?: string;
}

// Coordinate format detection and parsing utilities
function parseCoordinates(input: string): { lat: number; lng: number } | null {
    // Remove extra spaces
    const cleaned = input.trim();

    // Try decimal format: "32.699278, -117.170750" or "32.699278,-117.170750"
    const decimalRegex = /^(-?\d+\.?\d*)\s*,?\s*(-?\d+\.?\d*)$/;
    const decimalMatch = cleaned.match(decimalRegex);
    
    if (decimalMatch) {
        const lat = parseFloat(decimalMatch[1]);
        const lng = parseFloat(decimalMatch[2]);
        
        if (isValidCoordinate(lat, lng)) {
            return { lat, lng };
        }
    }

    // Try DMS format: 32°41'57.4"N 117°10'14.7"W
    const dmsRegex = /(\d+)[°\s]+(\d+)['\s]+(\d+\.?\d*)["\s]*([NS])\s+(\d+)[°\s]+(\d+)['\s]+(\d+\.?\d*)["\s]*([EW])/i;
    const dmsMatch = cleaned.match(dmsRegex);
    
    if (dmsMatch) {
        const latDeg = parseInt(dmsMatch[1]);
        const latMin = parseInt(dmsMatch[2]);
        const latSec = parseFloat(dmsMatch[3]);
        const latDir = dmsMatch[4].toUpperCase();
        
        const lngDeg = parseInt(dmsMatch[5]);
        const lngMin = parseInt(dmsMatch[6]);
        const lngSec = parseFloat(dmsMatch[7]);
        const lngDir = dmsMatch[8].toUpperCase();
        
        const lat = dmsToDecimal(latDeg, latMin, latSec, latDir);
        const lng = dmsToDecimal(lngDeg, lngMin, lngSec, lngDir);
        
        if (isValidCoordinate(lat, lng)) {
            return { lat, lng };
        }
    }

    return null;
}

function dmsToDecimal(degrees: number, minutes: number, seconds: number, direction: string): number {
    let decimal = degrees + minutes / 60 + seconds / 3600;
    if (direction === 'S' || direction === 'W') {
        decimal *= -1;
    }
    return decimal;
}

function isValidCoordinate(lat: number, lng: number): boolean {
    return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

export function PlacesAutocomplete({
    onPlaceSelected,
    className = '',
    placeholder = 'Find a Google Maps location or enter coordinates...',
}: PlacesAutocompleteProps) {
    const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const [isProcessingCoordinates, setIsProcessingCoordinates] = useState(false);

    const handleLoad = (autocompleteInstance: google.maps.places.Autocomplete) => {
        setAutocomplete(autocompleteInstance);
    };

    const handlePlaceChanged = () => {
        if (autocomplete) {
            const place = autocomplete.getPlace();

            if (place.geometry?.location) {
                const locationData = extractPlaceData(place);
                if (locationData) {
                    onPlaceSelected(locationData);
                    // Clear input after selection
                    if (inputRef.current) {
                        inputRef.current.value = '';
                    }
                }
            }
        }
    };

    const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && inputRef.current) {
            e.preventDefault();
            const input = inputRef.current.value.trim();
            
            // Check if input looks like coordinates
            const coords = parseCoordinates(input);
            
            if (coords) {
                setIsProcessingCoordinates(true);
                toast.info('Processing coordinates...');
                
                try {
                    // Use Google Geocoding API to get place details from coordinates
                    const geocoder = new google.maps.Geocoder();
                    const result = await geocoder.geocode({
                        location: { lat: coords.lat, lng: coords.lng }
                    });

                    if (result.results && result.results.length > 0) {
                        const place = result.results[0];
                        
                        // Create LocationData from geocoded result
                        const locationData: LocationData = {
                            placeId: place.place_id || `coord_${coords.lat}_${coords.lng}`,
                            name: place.formatted_address || `Location at ${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`,
                            address: place.formatted_address,
                            latitude: coords.lat,
                            longitude: coords.lng,
                            type: place.types?.[0],
                        };

                        onPlaceSelected(locationData);
                        toast.success('Coordinates found!');
                        
                        // Clear input
                        inputRef.current.value = '';
                    } else {
                        toast.error('Could not find location for these coordinates');
                    }
                } catch (error) {
                    console.error('Geocoding error:', error);
                    toast.error('Failed to geocode coordinates');
                } finally {
                    setIsProcessingCoordinates(false);
                }
            }
            // If not coordinates, let the autocomplete handle it normally
        }
    };

    return (
        <Autocomplete
            onLoad={handleLoad}
            onPlaceChanged={handlePlaceChanged}
            options={{
                fields: ['place_id', 'name', 'formatted_address', 'geometry', 'types', 'rating', 'photos', 'address_components'],
            }}
        >
            <input
                ref={inputRef}
                type="text"
                placeholder={placeholder}
                onKeyDown={handleKeyDown}
                disabled={isProcessingCoordinates}
                className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                    isProcessingCoordinates ? 'opacity-50 cursor-wait' : ''
                } ${className}`}
            />
        </Autocomplete>
    );
}
