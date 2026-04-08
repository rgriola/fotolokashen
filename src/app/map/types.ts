import { LocationData } from '@/lib/maps-utils';
import { UserSave, Photo } from '@/types/location';
import type { PublicLocation } from '@/hooks/usePublicLocations';

export interface MarkerData {
    id: string;
    position: { lat: number; lng: number };
    data?: LocationData;
    isTemporary?: boolean;
    userSave?: UserSave;
    color?: string;
    isPublic?: boolean;
    ownerUsername?: string;
    publicLocationRaw?: PublicLocation;
}

export interface MapBounds {
    north: number;
    south: number;
    east: number;
    west: number;
}

export interface PanToOptions {
    position: { lat: number; lng: number };
    zoom?: number;
    withPanelOffset?: boolean;
}

export interface PublicLocationSheetData {
    location: PublicLocation;
    photos: Photo[];
}
