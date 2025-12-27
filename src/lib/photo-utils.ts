import { parse } from 'exifr';

export interface PhotoGPS {
    lat: number;
    lng: number;
    altitude?: number;
    accuracy?: number;
    dateTaken?: Date;
    camera?: {
        make?: string;
        model?: string;
    };
    hasGPS: boolean;
}

export interface PhotoMetadata extends PhotoGPS {
    width?: number;
    height?: number;
    orientation?: number;
    iso?: number;
    focalLength?: string;
    aperture?: string;
    exposureTime?: string;
    colorSpace?: string;
}

/**
 * Extract GPS coordinates and metadata from a photo file
 * Enhanced with comprehensive debugging and fallback options
 * @param file - Image file to extract EXIF data from
 * @returns PhotoMetadata object with GPS coordinates and camera info
 */
export async function extractPhotoGPS(file: File): Promise<PhotoMetadata> {
    console.log('📸 ===== GPS EXTRACTION START =====');
    console.log('📸 File name:', file.name);
    console.log('📸 File size:', `${(file.size / 1024).toFixed(2)}KB`);
    console.log('📸 File type:', file.type);
    console.log('📸 Last modified:', new Date(file.lastModified).toLocaleString());

    try {
        // Try with comprehensive options - enable ALL features
        console.log('📸 Attempting EXIF extraction...');

        const exif = await parse(file, {
            // Enable all parsing
            tiff: true,
            exif: true,
            gps: true,
            iptc: false,
            icc: false,
            jfif: false,
            ihdr: false,
            // Merge all GPS formats
            mergeOutput: true,
            // Get everything
            pick: [
                // GPS - try all variations
                'GPSLatitude',
                'GPSLongitude',
                'GPSLatitudeRef',
                'GPSLongitudeRef',
                'latitude',
                'longitude',
                'GPSAltitude',
                'GPSAltitudeRef',
                // Dates - all formats
                'DateTimeOriginal',
                'DateTime',
                'CreateDate',
                'ModifyDate',
                // Camera info
                'Make',
                'Model',
                'LensMake',
                'LensModel',
                // Image properties
                'ImageWidth',
                'ImageHeight',
                'Orientation',
                'ColorSpace',
                // Exposure settings
                'ISO',
                'ISOSpeedRatings',
                'FocalLength',
                'FNumber',
                'ApertureValue',
                'ExposureTime',
                'ShutterSpeedValue',
                'ExposureMode',
                'WhiteBalance',
                'Flash',
            ],
        });

        console.log('📸 Raw EXIF data received:', exif);

        if (!exif || Object.keys(exif).length === 0) {
            console.warn('⚠️ No EXIF data found in file');
            console.log('📸 This could mean:');
            console.log('   - Photo has no EXIF data');
            console.log('   - EXIF data was stripped (common for web downloads)');
            console.log('   - File format doesn\'t support EXIF');
            return { hasGPS: false, lat: 0, lng: 0 };
        }

        console.log('📸 EXIF keys found:', Object.keys(exif));

        // Check for GPS data in various formats (exifr normalizes these)
        const lat = exif.latitude ?? exif.GPSLatitude ?? null;
        const lng = exif.longitude ?? exif.GPSLongitude ?? null;

        console.log('📸 GPS check:');
        console.log('   - latitude:', lat);
        console.log('   - longitude:', lng);
        console.log('   - GPSLatitude:', exif.GPSLatitude);
        console.log('   - GPSLongitude:', exif.GPSLongitude);

        const hasGPS = !!(lat !== null && lng !== null && !isNaN(lat) && !isNaN(lng));

        if (hasGPS) {
            console.log('✅ GPS DATA FOUND!');
            console.log('   📍 Coordinates:', `${lat}, ${lng}`);
            if (exif.GPSAltitude) {
                console.log('   ⛰️  Altitude:', exif.GPSAltitude, 'm');
            }
        } else {
            console.warn('⚠️ Photo has EXIF data but NO VALID GPS coordinates');
            console.log('   This is normal for:');
            console.log('   - Photos with location services disabled');
            console.log('   - Screenshots');
            console.log('   - Photos from cameras without GPS');
            console.log('   - Downloaded/edited photos');
        }

        // Extract date
        const dateString = exif.DateTimeOriginal || exif.DateTime || exif.CreateDate || exif.ModifyDate;
        const dateTaken = dateString ? new Date(dateString) : undefined;

        if (dateTaken) {
            console.log('📅 Photo taken:', dateTaken.toLocaleString());
        }

        // Extract camera info
        if (exif.Make || exif.Model) {
            console.log('📷 Camera:', exif.Make || '', exif.Model || '');
        }

        console.log('📸 ===== GPS EXTRACTION COMPLETE =====\n');

        return {
            lat: lat || 0,
            lng: lng || 0,
            altitude: exif.GPSAltitude,
            dateTaken,
            camera: {
                make: exif.Make,
                model: exif.Model,
            },
            width: exif.ImageWidth,
            height: exif.ImageHeight,
            orientation: exif.Orientation,
            iso: exif.ISO || exif.ISOSpeedRatings,
            focalLength: exif.FocalLength ? `${exif.FocalLength}mm` : undefined,
            aperture: exif.FNumber ? `f/${exif.FNumber}` : undefined,
            exposureTime: exif.ExposureTime ? (exif.ExposureTime < 1 ? `1/${Math.round(1 / exif.ExposureTime)}s` : `${exif.ExposureTime}s`) : undefined,
            colorSpace: exif.ColorSpace ? String(exif.ColorSpace) : undefined,
            hasGPS,
        };
    } catch (error) {
        console.error('❌ FATAL ERROR during GPS extraction:');
        console.error('Error name:', error instanceof Error ? error.name : 'Unknown');
        console.error('Error message:', error instanceof Error ? error.message : String(error));
        if (error instanceof Error && error.stack) {
            console.error('Stack trace:', error.stack);
        }
        console.log('📸 ===== GPS EXTRACTION FAILED =====\n');

        // Return empty GPS data instead of throwing
        return { hasGPS: false, lat: 0, lng: 0 };
    }
}

/**
 * Reverse geocode GPS coordinates to get address information
 * Uses Google Maps Geocoding API
 * @param lat - Latitude
 * @param lng - Longitude
 * @returns Address string and components
 */
export async function reverseGeocodeGPS(
    lat: number,
    lng: number
): Promise<{
    address: string;
    name: string;
    street?: string;
    number?: string;
    city?: string;
    state?: string;
    zipcode?: string;
    placeId?: string;
}> {
    console.log('🗺️  Reverse geocoding:', lat, lng);

    try {
        const geocoder = new google.maps.Geocoder();
        const response = await geocoder.geocode({
            location: { lat, lng },
        });

        if (response.results && response.results.length > 0) {
            const result = response.results[0];
            console.log('✅ Address found:', result.formatted_address);

            // Extract address components
            const components = result.address_components;
            const street = components?.find((c) => c.types.includes('route'))?.long_name;
            const number = components?.find((c) => c.types.includes('street_number'))?.long_name;
            const city = components?.find((c) => c.types.includes('locality'))?.long_name;
            const state = components?.find((c) => c.types.includes('administrative_area_level_1'))?.short_name;
            const zipcode = components?.find((c) => c.types.includes('postal_code'))?.long_name;

            // Generate name from street address or first part of formatted address
            let name = 'Photo Location';
            if (number && street) {
                name = `${number} ${street}`;
            } else if (result.formatted_address) {
                name = result.formatted_address.split(',')[0];
            }

            return {
                address: result.formatted_address,
                name,
                street,
                number,
                city,
                state,
                zipcode,
                placeId: result.place_id,
            };
        }

        console.warn('⚠️ No address found for coordinates');
        return {
            address: `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
            name: 'Photo Location',
        };
    } catch (error) {
        console.error('❌ Reverse geocoding failed:', error);
        return {
            address: `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
            name: 'Photo Location',
        };
    }
}

/**
 * Calculate distance between two GPS coordinates in meters
 * Uses Haversine formula
 * @param coord1 - First coordinate
 * @param coord2 - Second coordinate
 * @returns Distance in meters
 */
export function calculatePhotoDistance(
    coord1: { lat: number; lng: number },
    coord2: { lat: number; lng: number }
): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (coord1.lat * Math.PI) / 180;
    const φ2 = (coord2.lat * Math.PI) / 180;
    const Δφ = ((coord2.lat - coord1.lat) * Math.PI) / 180;
    const Δλ = ((coord2.lng - coord1.lng) * Math.PI) / 180;

    const a =
        Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
}

/**
 * Determine if two photos should be clustered together
 * @param photo1 - First photo GPS
 * @param photo2 - Second photo GPS
 * @param thresholdMeters - Distance threshold in meters (default: 50)
 * @returns True if photos should be clustered
 */
export function shouldClusterPhotos(
    photo1: { lat: number; lng: number },
    photo2: { lat: number; lng: number },
    thresholdMeters: number = 50
): boolean {
    const distance = calculatePhotoDistance(photo1, photo2);
    return distance < thresholdMeters;
}

/**
 * Calculate centroid (average position) of multiple GPS coordinates
 * @param coords - Array of GPS coordinates
 * @returns Centroid coordinate
 */
export function calculatePhotoCentroid(
    coords: Array<{ lat: number; lng: number }>
): { lat: number; lng: number } {
    if (coords.length === 0) {
        return { lat: 0, lng: 0 };
    }

    const sum = coords.reduce(
        (acc, coord) => ({
            lat: acc.lat + coord.lat,
            lng: acc.lng + coord.lng,
        }),
        { lat: 0, lng: 0 }
    );

    return {
        lat: sum.lat / coords.length,
        lng: sum.lng / coords.length,
    };
}

/**
 * Format GPS coordinates for display
 * @param lat - Latitude
 * @param lng - Longitude
 * @param precision - Number of decimal places
 * @returns Formatted coordinate string
 */
export function formatGPSCoordinates(lat: number, lng: number, precision: number = 5): string {
    const latDir = lat >= 0 ? 'N' : 'S';
    const lngDir = lng >= 0 ? 'E' : 'W';
    return `${Math.abs(lat).toFixed(precision)}°${latDir}, ${Math.abs(lng).toFixed(precision)}°${lngDir}`;
}
