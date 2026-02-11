export async function getUserLocation(): Promise<{ lat: number; lng: number }> {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('Geolocation is not supported by your browser'));
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                resolve({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                });
            },
            (error) => {
                // Fallback to New York City if user denies location
                console.warn('Geoloaction error:', error.message);
                resolve({ lat: 40.7128, lng: -74.006 }); // NYC
            },
            {
                enableHighAccuracy: true,
                timeout: 5000,
                maximumAge: 0,
            }
        );
    });
}

export function calculateDistance(
    point1: { lat: number; lng: number },
    point2: { lat: number; lng: number }
): number {
    const R = 6371; // Earth's radius in km
    const dLat = toRad(point2.lat - point1.lat);
    const dLon = toRad(point2.lng - point1.lng);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(point1.lat)) *
        Math.cos(toRad(point2.lat)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
}

function toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
}

import { parseAddressComponents } from './address-utils';

export function formatAddress(place: google.maps.places.PlaceResult): string {
    if (place.formatted_address) {
        return place.formatted_address;
    }

    const components = place.address_components || [];
    const parts: string[] = [];

    const street = components.find((c) => c.types.includes('route'))?.long_name;
    const city = components.find((c) => c.types.includes('locality'))?.long_name;
    const state = components.find((c) =>
        c.types.includes('administrative_area_level_1')
    )?.short_name;

    if (street) parts.push(street);
    if (city) parts.push(city);
    if (state) parts.push(state);

    return parts.join(', ') || 'Unknown address';
}

export interface LocationData {
    placeId: string;
    name: string;
    address?: string;
    latitude: number;
    longitude: number;
    plusCode?: string; // Google Plus Code for precise location
    type?: string;
    rating?: number;
    photoUrls?: string[];
    // Address components
    street?: string;
    number?: string;
    city?: string;
    state?: string;
    zipcode?: string;
}

export function extractPlaceData(
    place: google.maps.places.PlaceResult
): LocationData | null {
    if (!place.place_id || !place.geometry?.location) {
        return null;
    }

    const photoUrls = place.photos
        ? place.photos.slice(0, 5).map((photo) => photo.getUrl({ maxWidth: 800 }))
        : [];

    // Parse address components using shared utility function
    const addressComponents = parseAddressComponents(place.address_components);

    return {
        placeId: place.place_id,
        name: place.name || 'Unnamed location',
        address: formatAddress(place),
        latitude: place.geometry.location.lat(),
        longitude: place.geometry.location.lng(),
        type: place.types?.[0] || undefined,
        rating: place.rating,
        photoUrls,
        ...addressComponents, // Add parsed address components (street, number, city, state, zipcode)
    };
}
