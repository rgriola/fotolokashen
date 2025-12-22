/**
 * Enhanced geocoding utilities for address resolution
 */

/**
 * Processes geocoding results to extract the best postal address and Plus Code
 * @param results - Array of geocoding results from Google Maps API
 * @returns Object containing the preferred address result and Plus Code if available
 */
export function processGeocodingResults(results: google.maps.GeocoderResult[]): {
    addressResult: google.maps.GeocoderResult;
    plusCode: string | undefined;
} {
    if (!results || results.length === 0) {
        throw new Error('No geocoding results found');
    }

    // Extract Plus Code from results (usually in the first result)
    const plusCodeResult = results.find(result =>
        result.types.includes('plus_code')
    );
    const plusCode = plusCodeResult?.plus_code?.global_code;

    // Find the best postal address result
    // Priority order: street_address > route > premise > locality
    const addressPriority = [
        'street_address',
        'route',
        'premise',
        'neighborhood',
        'locality'
    ];

    let addressResult: google.maps.GeocoderResult | undefined;

    // Try each priority level
    for (const type of addressPriority) {
        addressResult = results.find(result => result.types.includes(type));
        if (addressResult) break;
    }

    // Fallback to first non-plus-code result
    if (!addressResult) {
        addressResult = results.find(result => !result.types.includes('plus_code'));
    }

    // Final fallback to first result
    if (!addressResult) {
        addressResult = results[0];
    }

    return {
        addressResult,
        plusCode
    };
}

/**
 * Extract a user-friendly name from a geocoding result
 * @param result - Geocoding result
 * @returns A short, readable name for the location
 */
export function extractLocationName(result: google.maps.GeocoderResult): string {
    // For street addresses, use the street number + route
    const streetNumber = result.address_components?.find(c =>
        c.types.includes('street_number')
    )?.long_name;
    const route = result.address_components?.find(c =>
        c.types.includes('route')
    )?.long_name;

    if (streetNumber && route) {
        return `${streetNumber} ${route}`;
    }

    // For neighborhoods or localities, use the formatted address first part
    const parts = result.formatted_address.split(',');
    return parts[0]?.trim() || 'Selected Location';
}
