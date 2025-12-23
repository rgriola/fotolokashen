"use client";

import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Star, Edit, Trash2, Share2, Calendar, Camera, Navigation } from "lucide-react";
import type { Location } from "@/types/location";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { IMAGEKIT_URL_ENDPOINT } from "@/lib/imagekit";

interface LocationCardProps {
    location: Location;
    onEdit?: (location: Location) => void;
    onDelete?: (id: number) => void;
    onShare?: (location: Location) => void;
    onClick?: (location: Location) => void;
    canEdit?: boolean;
}

// Type-to-Color mapping (same as map markers)
const TYPE_COLOR_MAP: Record<string, string> = {
    "BROLL": "#3B82F6",
    "STORY": "#EF4444",
    "INTERVIEW": "#8B5CF6",
    "LIVE ANCHOR": "#DC2626",
    "REPORTER LIVE": "#F59E0B",
    "STAKEOUT": "#6B7280",
    "DRONE": "#06B6D4",
    "SCENE": "#22C55E",
    "EVENT": "#84CC16",
    "OTHER": "#64748B",
    "HQ": "#1E40AF",
    "BUREAU": "#7C3AED",
    "REMOTE STAFF": "#EC4899",
};

export function LocationCard({
    location,
    onEdit,
    onDelete,
    onShare,
    onClick,
    canEdit = false,
}: LocationCardProps) {
    const [imageError, setImageError] = useState(false);
    const router = useRouter();
    const userSave = location.userSave;

    // Get the first photo from photos array or photoUrls
    const photoUrl = location.photos && location.photos.length > 0
        ? `${IMAGEKIT_URL_ENDPOINT}${location.photos[0].imagekitFilePath}` // Construct full URL
        : location.photoUrls && location.photoUrls.length > 0
            ? location.photoUrls[0]
            : null;

    // Get type color
    const typeColor = location.type ? TYPE_COLOR_MAP[location.type] || "#64748B" : "#64748B";

    // Navigate to map view at this location
    const handleCardClick = (e: React.MouseEvent) => {
        // Don't navigate if clicking on action buttons
        const target = e.target as HTMLElement;
        if (target.closest('button') || target.closest('a')) {
            return;
        }

        // Navigate to map with location coordinates
        router.push(`/map?lat=${location.lat}&lng=${location.lng}&zoom=17`);
    };

    return (
        <Card
            className="overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer group border-2 hover:border-primary/50"
            onClick={handleCardClick}
        >
            {/* Image Section */}
            <div className="relative h-56 bg-gradient-to-br from-muted to-muted/50 overflow-hidden">
                {photoUrl && !imageError ? (
                    <img
                        src={photoUrl}
                        alt={location.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={() => setImageError(true)}
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                        <Camera className="w-20 h-20 text-muted-foreground/30" />
                    </div>
                )}

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

                {/* Top Badges Row */}
                <div className="absolute top-3 left-3 right-3 flex items-start justify-between gap-2">
                    {/* Type Badge */}
                    {location.type && (
                        <Badge
                            className="shadow-lg font-semibold"
                            style={{
                                backgroundColor: typeColor,
                                color: 'white',
                                borderColor: typeColor,
                            }}
                        >
                            {location.type}
                        </Badge>
                    )}

                    {/* Favorite Star */}
                    {userSave?.isFavorite && (
                        <div className="bg-yellow-500 text-white p-2 rounded-full shadow-lg">
                            <Star className="w-4 h-4 fill-current" />
                        </div>
                    )}
                </div>

                {/* Photo Count */}
                {((location.photos && location.photos.length > 1) || (location.photoUrls && location.photoUrls.length > 1)) && (
                    <div className="absolute top-3 right-3 bg-black/70 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                        <Camera className="w-3 h-3" />
                        {location.photos?.length || location.photoUrls?.length || 0}
                    </div>
                )}

                {/* Bottom Location Name */}
                <div className="absolute bottom-3 left-3 right-3">
                    <h3 className="font-bold text-lg text-white drop-shadow-lg line-clamp-2">
                        {location.name}
                    </h3>
                </div>
            </div>

            <CardHeader className="space-y-3 pb-3">
                {/* Address */}
                <p className="text-sm text-muted-foreground line-clamp-2 flex items-start gap-2">
                    <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
                    <span>{location.address || 'No address available'}</span>
                </p>

                {/* User Rating */}
                {userSave?.personalRating && userSave.personalRating > 0 && (
                    <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                                key={i}
                                className={`w-4 h-4 ${i < (userSave.personalRating || 0)
                                    ? 'text-yellow-500 fill-yellow-500'
                                    : 'text-gray-300'
                                    }`}
                            />
                        ))}
                    </div>
                )}
            </CardHeader>

            <CardContent className="space-y-3 pt-0">
                {/* Caption */}
                {userSave?.caption && (
                    <p className="text-sm text-foreground/90 line-clamp-2 italic border-l-2 border-primary pl-2">
                        "{userSave.caption}"
                    </p>
                )}

                {/* Production Details */}
                {location.productionNotes && (
                    <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded-md">
                        <p className="font-medium mb-1">Production Notes:</p>
                        <p className="line-clamp-2">{location.productionNotes}</p>
                    </div>
                )}

                {/* Location Details Grid */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                    {location.indoorOutdoor && (
                        <div className="bg-muted/50 px-2 py-1 rounded">
                            <span className="font-medium capitalize">{location.indoorOutdoor}</span>
                        </div>
                    )}
                    {location.parking && (
                        <div className="bg-muted/50 px-2 py-1 rounded truncate" title={location.parking}>
                            🅿️ {location.parking}
                        </div>
                    )}
                    {location.access && (
                        <div className="col-span-2 bg-muted/50 px-2 py-1 rounded truncate" title={location.access}>
                            🔑 {location.access}
                        </div>
                    )}
                </div>

                {/* Tags */}
                {userSave?.tags && userSave.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                        {userSave.tags.slice(0, 4).map((tag: string, index: number) => (
                            <Badge key={index} variant="outline" className="text-xs">
                                {tag}
                            </Badge>
                        ))}
                        {userSave.tags.length > 4 && (
                            <Badge variant="outline" className="text-xs font-semibold">
                                +{userSave.tags.length - 4}
                            </Badge>
                        )}
                    </div>
                )}

                {/* Visit Date */}
                {userSave?.visitedAt && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1 pt-1">
                        <Calendar className="w-3 h-3" />
                        Visited {new Date(userSave.visitedAt).toLocaleDateString()}
                    </p>
                )}
            </CardContent>

            <CardFooter className="flex justify-between gap-2 pt-4 border-t">
                {canEdit && (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                            e.stopPropagation();
                            onEdit?.(location);
                        }}
                        className="flex-1"
                    >
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                    </Button>
                )}

                <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                        e.stopPropagation();
                        onShare?.(location);
                    }}
                    className={canEdit ? "" : "flex-1"}
                >
                    <Share2 className="w-4 h-4 mr-1" />
                    Share
                </Button>

                {canEdit && (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete?.(userSave?.id || location.id);
                        }}
                        className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                    >
                        <Trash2 className="w-4 h-4" />
                    </Button>
                )}
            </CardFooter>
        </Card>
    );
}
