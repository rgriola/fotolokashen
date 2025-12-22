"use client";

import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Star, Edit, Trash2, Share2, Calendar } from "lucide-react";
import type { Location } from "@/types/location";
import { useState } from "react";

interface LocationCardProps {
    location: Location;
    onEdit?: (location: Location) => void;
    onDelete?: (id: number) => void;
    onShare?: (location: Location) => void;
    onClick?: (location: Location) => void;
    canEdit?: boolean;
}

export function LocationCard({
    location,
    onEdit,
    onDelete,
    onShare,
    onClick,
    canEdit = false,
}: LocationCardProps) {
    const [imageError, setImageError] = useState(false);
    const userSave = location.userSave;

    // Get the first photo or use placeholder
    const photoUrl = location.photos && location.photos.length > 0
        ? location.photos[0].imagekitFilePath
        : null;

    return (
        <Card
            className={`overflow-hidden hover:shadow-lg transition-shadow ${onClick ? 'cursor-pointer' : ''}`}
            onClick={() => onClick?.(location)}
        >
            {/* Image Section */}
            <div className="relative h-48 bg-muted">
                {photoUrl && !imageError ? (
                    <img
                        src={photoUrl}
                        alt={location.name}
                        className="w-full h-full object-cover"
                        onError={() => setImageError(true)}
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                        <MapPin className="w-16 h-16 text-muted-foreground/50" />
                    </div>
                )}

                {/* Favorite Star */}
                {userSave?.isFavorite && (
                    <div className="absolute top-2 right-2 bg-yellow-500 text-white p-1.5 rounded-full shadow-md">
                        <Star className="w-4 h-4 fill-current" />
                    </div>
                )}

                {/* Custom Color Marker */}
                {userSave?.color && (
                    <div
                        className="absolute top-2 left-2 w-6 h-6 rounded-full border-2 border-white shadow-md"
                        style={{ backgroundColor: userSave.color }}
                    />
                )}
            </div>

            <CardHeader className="space-y-2">
                {/* Title and Type */}
                <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-lg line-clamp-1">{location.name}</h3>
                    {location.type && (
                        <Badge variant="secondary" className="shrink-0">
                            {location.type}
                        </Badge>
                    )}
                </div>

                {/* Address */}
                <p className="text-sm text-muted-foreground line-clamp-2 flex items-start gap-1">
                    <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
                    {location.address}
                </p>
            </CardHeader>

            <CardContent className="space-y-3">
                {/* Rating */}
                {userSave?.personalRating && (
                    <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                                key={i}
                                className={`w-4 h-4 ${i < (userSave.personalRating || 0)
                                    ? 'text-yellow-500 fill-yellow-500'
                                    : 'text-muted-foreground'
                                    }`}
                            />
                        ))}
                    </div>
                )}

                {/* Caption */}
                {userSave?.caption && (
                    <p className="text-sm text-foreground line-clamp-2">
                        {userSave.caption}
                    </p>
                )}

                {/* Tags */}
                {userSave?.tags && userSave.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                        {userSave.tags.slice(0, 3).map((tag: string, index: number) => (
                            <Badge key={index} variant="outline" className="text-xs">
                                {tag}
                            </Badge>
                        ))}
                        {userSave.tags.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                                +{userSave.tags.length - 3}
                            </Badge>
                        )}
                    </div>
                )}

                {/* Visit Date */}
                {userSave?.visitedAt && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Visited {new Date(userSave.visitedAt).toLocaleDateString()}
                    </p>
                )}
            </CardContent>

            <CardFooter className="flex justify-between gap-2">
                {canEdit && (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEdit?.(location)}
                        className="flex-1"
                    >
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                    </Button>
                )}

                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onShare?.(location)}
                    className={canEdit ? "" : "flex-1"}
                >
                    <Share2 className="w-4 h-4 mr-1" />
                    Share
                </Button>

                {canEdit && (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onDelete?.(location.id)}
                        className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                    >
                        <Trash2 className="w-4 h-4" />
                    </Button>
                )}
            </CardFooter>
        </Card>
    );
}
