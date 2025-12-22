import { useState } from 'react';

interface ReverseGeocodeResult {
    formattedAddress: string;
    streetNumber?: string;
    street?: string;
    city?: string;
    state?: string;
    zipcode?: string;
    country?: string;
    placeId?: string;
}

export function useReverseGeocode() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const reverseGeocode = async (
        lat: number,
        lng: number
    ): Promise<ReverseGeocodeResult | null> => {
        setIsLoading(true);
        setError(null);

        try {
            const geocoder = new google.maps.Geocoder();
            const response = await geocoder.geocode({
                location: { lat, lng },
            });

            if (response.results && response.results.length > 0) {
                const result = response.results[0];
                const components = result.address_components;

                // Parse address components
                const getComponent = (type: string) => {
                    const component = components.find((c) => c.types.includes(type));
                    return component?.long_name;
                };

                const addressData: ReverseGeocodeResult = {
                    formattedAddress: result.formatted_address,
                    placeId: result.place_id,
                    streetNumber: getComponent('street_number'),
                    street: getComponent('route'),
                    city: getComponent('locality') || getComponent('sublocality'),
                    state: getComponent('administrative_area_level_1'),
                    zipcode: getComponent('postal_code'),
                    country: getComponent('country'),
                };

                setIsLoading(false);
                return addressData;
            }

            setIsLoading(false);
            return null;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to geocode location';
            setError(errorMessage);
            setIsLoading(false);
            return null;
        }
    };

    return { reverseGeocode, isLoading, error };
}
