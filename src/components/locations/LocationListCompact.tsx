"use client";

import { MapPin, Star, Edit, Trash2, Share2, MoreVertical, Camera, Heart } from "lucide-react";
import type { Location } from "@/types/location";
import { useAuth } from "@/lib/auth-context";
import { Skeleton } from "@/components/ui/skeleton";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { getColorForType } from "@/lib/location-constants";
import { IMAGEKIT_URL_ENDPOINT } from "@/lib/imagekit";
import { useState } from "react";

// Get Google Maps API key for static images
const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

interface LocationListCompactProps {
    locations: Location[];
    isLoading?: boolean;
    onEdit?: (location: Location) => void;
    onDelete?: (id: number) => void;
    onShare?: (location: Location) => void;
    onClick?: (location: Location) => void;
}

export function LocationListCompact({
    locations,
    isLoading,
    onEdit,
    onDelete,
    onShare,
    onClick,
}: LocationListCompactProps) {
    const { user } = useAuth();

    if (isLoading) {
        return (
            <div className="space-y-2">
                {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
                        <Skeleton className="h-16 w-16 rounded flex-shrink-0" />
                        <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-3 w-1/2" />
                        </div>
                        <Skeleton className="h-8 w-8 rounded" />
                    </div>
                ))}
            </div>
        );
    }

    if (!locations || locations.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                    <svg
                        className="w-8 h-8 text-muted-foreground"
                        fill="none"
                        strokeWidth="2"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
                        />
                    </svg>
                </div>
                <h3 className="text-lg font-semibold mb-2">No locations saved yet</h3>
                <p className="text-muted-foreground max-w-sm">
                    Start by saving your first location using the map or search feature.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {locations.map((location) => {
                // Check if user can edit (creator or admin)
                const canEdit = user?.isAdmin || location.createdBy === user?.id;

                const typeColor = getColorForType(location.type || "OTHER");
                const personalRating = location.userSave?.personalRating || 0;

                // Get photo URL
                const photoUrl = location.photos && location.photos.length > 0
                    ? `${IMAGEKIT_URL_ENDPOINT}${location.photos[0].imagekitFilePath}`
                    : location.photoUrls && location.photoUrls.length > 0
                        ? location.photoUrls[0]
                        : null;

                // Generate Google Maps Static API URL as fallback
                const mapImageUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${location.lat},${location.lng}&zoom=16&size=200x200&scale=2&maptype=roadmap&markers=color:red%7C${location.lat},${location.lng}&key=${GOOGLE_MAPS_API_KEY}`;

                return (
                    <LocationListItem
                        key={location.id}
                        location={location}
                        canEdit={canEdit}
                        typeColor={typeColor}
                        personalRating={personalRating}
                        photoUrl={photoUrl}
                        mapImageUrl={mapImageUrl}
                        onClick={onClick}
                        onEdit={onEdit}
                        onShare={onShare}
                        onDelete={onDelete}
                    />
                );
            })}
        </div>
    );
}

// Separate component to handle image state
function LocationListItem({
    location,
    canEdit,
    typeColor,
    personalRating,
    photoUrl,
    mapImageUrl,
    onClick,
    onEdit,
    onShare,
    onDelete,
}: {
    location: Location;
    canEdit: boolean;
    typeColor: string;
    personalRating: number;
    photoUrl: string | null;
    mapImageUrl: string;
    onClick?: (location: Location) => void;
    onEdit?: (location: Location) => void;
    onShare?: (location: Location) => void;
    onDelete?: (id: number) => void;
}) {
    const [photoError, setPhotoError] = useState(false);
    const [mapError, setMapError] = useState(false);

    return (
        <div
            className="group flex items-center gap-4 p-3 border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
            onClick={() => onClick?.(location)}
        >
            {/* Photo Thumbnail */}
            <div className="flex-shrink-0 w-16 h-16 rounded overflow-hidden bg-muted">
                {photoUrl && !photoError ? (
                    <img
                        src={photoUrl}
                        alt={location.name}
                        className="w-full h-full object-cover"
                        onError={() => setPhotoError(true)}
                    />
                ) : !mapError ? (
                    <img
                        src={mapImageUrl}
                        alt={`Map of ${location.name}`}
                        className="w-full h-full object-cover"
                        onError={() => setMapError(true)}
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                        <Camera className="w-6 h-6 text-muted-foreground/30" />
                    </div>
                )}
            </div>

            {/* Location Info */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-base truncate">
                        {location.name}
                    </h3>
                    {location.userSave?.isFavorite && (
                        <Heart className="w-4 h-4 fill-red-500 text-red-500 flex-shrink-0" />
                    )}
                    {personalRating > 0 && (
                        <div className="flex items-center gap-1 flex-shrink-0">
                            <Star className="w-3.5 h-3.5 fill-yellow-500 text-yellow-500" />
                            <span className="text-xs text-muted-foreground">
                                {personalRating}
                            </span>
                        </div>
                    )}
                </div>
                <p className="text-sm text-muted-foreground truncate">
                    {location.address || `${location.lat.toFixed(3)}, ${location.lng.toFixed(3)}`}
                </p>
            </div>

            {/* Actions */}
            <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        <MoreVertical className="w-4 h-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    {canEdit && onEdit && (
                        <DropdownMenuItem
                            onClick={(e) => {
                                e.stopPropagation();
                                onEdit(location);
                            }}
                        >
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                        </DropdownMenuItem>
                    )}
                    {onShare && (
                        <DropdownMenuItem
                            onClick={(e) => {
                                e.stopPropagation();
                                onShare(location);
                            }}
                        >
                            <Share2 className="w-4 h-4 mr-2" />
                            Share
                        </DropdownMenuItem>
                    )}
                    {canEdit && onDelete && (
                        <DropdownMenuItem
                            onClick={(e) => {
                                e.stopPropagation();
                                onDelete(location.userSave?.id || location.id);
                            }}
                            className="text-destructive focus:bg-destructive focus:text-white"
                        >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                        </DropdownMenuItem>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}
