import { PublicUser } from './user';

export interface Photo {
    id: number;
    placeId: string;
    userId: number;
    imagekitFileId: string;
    imagekitFilePath: string;
    originalFilename: string;
    fileSize: number | null;
    mimeType: string | null;
    width: number | null;
    height: number | null;
    isPrimary: boolean;
    caption: string | null;
    uploadedAt: Date;
}

export interface Location {
    id: number;
    placeId: string;
    name: string;
    address: string | null;
    lat: number;
    lng: number;
    type: string | null;

    // Detailed address components
    street: string | null;
    number: string | null;
    city: string | null;
    state: string | null;
    zipcode: string | null;

    // Production & access details
    productionNotes: string | null;
    entryPoint: string | null;
    parking: string | null;
    access: string | null;

    // Photo management
    photoUrls: string[] | null;

    // Additional metadata
    rating: number | null;
    isPermanent: boolean;

    // Production & Logistics
    permitRequired: boolean;
    permitCost: number | null;
    contactPerson: string | null;
    contactPhone: string | null;
    operatingHours: string | null;
    restrictions: string | null;
    indoorOutdoor: string | null;
    bestTimeOfDay: string | null;

    // Audit trail
    createdBy: number;
    lastModifiedBy: number | null;
    lastModifiedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;

    // Relationships
    userSave?: UserSave | null;
    photos?: Photo[];
}

export interface LocationWithCreator extends Location {
    creator: PublicUser;
    lastModifier?: PublicUser | null;
}

export interface UserSave {
    id: number
    userId: number
    locationId: number
    savedAt: Date
    caption: string | null

    // Organization & filtering
    tags: string[] | null  // Array of tag strings
    isFavorite: boolean

    // Personal tracking
    personalRating: number | null  // 1-5 stars
    visitedAt: Date | null

    // UI customization
    color: string | null  // Hex color like "#FF5733"

    location?: Location
}

export interface SaveLocationRequest {
    placeId: string
    name: string
    address?: string
    lat: number
    lng: number
    type?: string

    // Address components
    street?: string
    number?: string
    city?: string
    state?: string
    zipcode?: string

    // Production details
    productionNotes?: string
    entryPoint?: string
    parking?: string
    access?: string

    // Photo data
    photoUrls?: string[]
    rating?: number
    isPermanent?: boolean
    caption?: string
}

export interface UpdateLocationRequest {
    // Basic info
    name?: string
    address?: string
    type?: string

    // Address components
    street?: string
    number?: string
    city?: string
    state?: string
    zipcode?: string

    // Production details
    productionNotes?: string
    entryPoint?: string
    parking?: string
    access?: string

    // Metadata
    isPermanent?: boolean
    rating?: number
}

export interface UpdateCaptionRequest {
    caption: string
}
