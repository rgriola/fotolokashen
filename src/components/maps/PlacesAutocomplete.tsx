'use client';

import { Autocomplete } from '@react-google-maps/api';
import { useState, useRef } from 'react';
import { extractPlaceData, LocationData } from '@/lib/maps-utils';

interface PlacesAutocompleteProps {
    onPlaceSelected: (place: LocationData) => void;
    className?: string;
    placeholder?: string;
}

export function PlacesAutocomplete({
    onPlaceSelected,
    className = '',
    placeholder = 'Find a Google Maps location ... ',
}: PlacesAutocompleteProps) {
    const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

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
                className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${className}`}
            />
        </Autocomplete>
    );
}
