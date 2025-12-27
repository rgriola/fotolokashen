export interface Photo {
    id: number
    placeId: string
    userId: number | null

    // ImageKit fields
    imagekitFileId: string
    imagekitFilePath: string
    originalFilename: string | null

    // File metadata
    fileSize: number | null
    mimeType: string | null
    width: number | null
    height: number | null

    // Photo properties
    isPrimary: boolean
    caption: string | null

    // Timestamps
    uploadedAt: Date
}

export interface PhotoWithUploader extends Photo {
    uploader?: {
        id: number
        username: string
        email: string
    } | null
}

export interface UploadPhotoRequest {
    placeId: string
    imagekitFileId: string
    imagekitFilePath: string
    originalFilename?: string
    fileSize?: number
    mimeType?: string
    width?: number
    height?: number
    isPrimary?: boolean
    caption?: string
}

export interface UpdatePhotoRequest {
    isPrimary?: boolean
    caption?: string
}

/**
 * Photo Upload Type Definitions
 * Additional types for photo upload flow
 */

/**
 * Photo metadata extracted from EXIF data
 */
export interface PhotoMetadata {
    hasGPS: boolean;
    lat: number;
    lng: number;
    altitude?: number | null;
    accuracy?: number | null;
    dateTaken?: Date | null;
    camera?: {
        make?: string;
        model?: string;
    } | null;
    lens?: {
        make?: string;
        model?: string;
    } | null;
    iso?: number | null;
    focalLength?: string | null;
    aperture?: string | null;
    exposureTime?: string | null;
    exposureMode?: string | null;
    whiteBalance?: string | null;
    flash?: string | null;
    orientation?: number | null;
    colorSpace?: string | null;
}

/**
 * ImageKit upload response
 */
export interface ImageKitUploadResponse {
    fileId: string;
    filePath: string;
    name: string;
    size: number;
    versionInfo: {
        id: string;
        name: string;
    };
    url: string;
    thumbnailUrl: string;
    width?: number;
    height?: number;
    fileType: string;
}

/**
 * ImageKit authentication data
 */
export interface ImageKitAuthData {
    token: string;
    expire: number;
    signature: string;
    publicKey: string;
}

/**
 * Photo data for database storage
 */
export interface PhotoUploadData {
    // ImageKit fields
    fileId: string;
    filePath: string;
    name: string;
    size: number;
    type: string;
    width?: number;
    height?: number;
    url: string;
    thumbnailUrl: string;

    // GPS data
    gpsLatitude: number | null;
    gpsLongitude: number | null;
    gpsAltitude: number | null;
    hasGpsData: boolean;

    // Camera data
    cameraMake: string | null;
    cameraModel: string | null;
    lensMake: string | null;
    lensModel: string | null;

    // Exposure data
    dateTaken: string | null;
    iso: number | null;
    focalLength: string | null;
    aperture: string | null;
    shutterSpeed: string | null;
    exposureMode: string | null;
    whiteBalance: string | null;
    flash: string | null;

    // Image properties
    orientation: number | null;
    colorSpace: string | null;

    // Metadata
    uploadSource: 'photo_gps' | 'manual' | 'bulk_upload';
}

/**
 * Location form data (from SaveLocationForm)
 */
export interface LocationFormData {
    placeId: string;
    name: string;
    address?: string;
    lat: number;
    lng: number;
    type: string;
    indoorOutdoor: 'indoor' | 'outdoor';

    // Address components
    street?: string;
    number?: string;
    city?: string;
    state?: string;
    zipcode?: string;

    // Production details
    productionNotes?: string;
    entryPoint?: string;
    parking?: string;
    access?: string;

    // User save details
    caption?: string;
    isFavorite?: boolean;
    personalRating?: number;
    color?: string;
}

/**
 * Location submit data (for API)
 * Transforms lat/lng to latitude/longitude
 */
export interface LocationSubmitData extends Omit<LocationFormData, 'lat' | 'lng'> {
    latitude: number;
    longitude: number;
    photos?: PhotoUploadData[];
}
