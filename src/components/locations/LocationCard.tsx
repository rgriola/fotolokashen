"use client";

import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    MapPin, Star, Edit, Trash2, Share2, Calendar, Camera,
    Clock, DollarSign, Phone, User, AlertCircle, Key,
    Navigation, MapPinned, Shield, Heart
} from "lucide-react";
import type { Location } from "@/types/location";
import { useState, memo } from "react";
import { useRouter } from "next/navigation";
import { IMAGEKIT_URL_ENDPOINT } from "@/lib/imagekit";
import { TYPE_COLOR_MAP } from "@/lib/location-constants";

// Get Google Maps API key for static images
const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

interface LocationCardProps {
    location: Location;
    onEdit?: (location: Location) => void;
    onDelete?: (id: number) => void;
    onShare?: (location: Location) => void;
    onClick?: (location: Location) => void;
    canEdit?: boolean;
}

export const LocationCard = memo(function LocationCard({
    location,
    onEdit,
    onDelete,
    onShare,
    onClick,
    canEdit = false,
}: LocationCardProps) {
    const [photoError, setPhotoError] = useState(false);
    const [mapError, setMapError] = useState(false);
    const [showAllData, setShowAllData] = useState(false);
    const router = useRouter();
    const userSave = location.userSave;

    // Get the first photo from photos array or photoUrls
    const photoUrl = location.photos && location.photos.length > 0
        ? `${IMAGEKIT_URL_ENDPOINT}${location.photos[0].imagekitFilePath}`
        : location.photoUrls && location.photoUrls.length > 0
            ? location.photoUrls[0]
            : null;

    // Get type color for the marker
    const typeColor = userSave?.color || (location.type ? TYPE_COLOR_MAP[location.type] || "#64748B" : "#64748B");

    // Generate Google Maps Static API URL as fallback
    // Docs: https://developers.google.com/maps/documentation/maps-static
    const mapImageUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${location.lat},${location.lng}&zoom=16&size=600x400&scale=2&maptype=roadmap&markers=color:red%7C${location.lat},${location.lng}&key=${GOOGLE_MAPS_API_KEY}`;

    // Navigate to map view at this location or open modal
    const handleCardClick = (e: React.MouseEvent) => {
        const target = e.target as HTMLElement;
        if (target.closest('button') || target.closest('a')) {
            return;
        }
        // Use onClick prop if provided (for modal), otherwise navigate to map
        if (onClick) {
            onClick(location);
        } else {
            router.push(`/map?lat=${location.lat}&lng=${location.lng}&zoom=17`);
        }
    };

    return (
        <Card
            className="overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer group border-2 hover:border-primary/50"
            onClick={handleCardClick}
            style={{
                backgroundColor: `${typeColor}80`, // 80 in hex = 50% opacity
            }}
        >
            {/* Image Section */}
            <div className="relative h-56 bg-gradient-to-br from-muted to-muted/50 overflow-hidden">
                {photoUrl && !photoError ? (
                    <img
                        src={photoUrl}
                        alt={location.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={() => setPhotoError(true)}
                    />
                ) : !mapError ? (
                    <img
                        src={mapImageUrl}
                        alt={`Map of ${location.name}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={() => {
                            console.error('Google Maps Static API image failed to load:', mapImageUrl);
                            console.error('Troubleshooting: 1) Verify Maps Static API is enabled in Google Cloud Console, 2) Check billing is set up, 3) Verify API key is correct');
                            setMapError(true);
                        }}
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                        <Camera className="w-20 h-20 text-muted-foreground/30" />
                    </div>
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

                {/* Top Badges */}
                <div className="absolute top-3 left-3 right-3 flex items-start justify-between gap-2">
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
                    {userSave?.isFavorite && (
                        <div className="bg-red-500 text-white p-2 rounded-full shadow-lg">
                            <Heart className="w-4 h-4 fill-current" />
                        </div>
                    )}
                </div>

                {/* Photo Count & Status Badges - Bottom Right */}
                <div className="absolute bottom-3 right-3 flex flex-col gap-2 items-end">
                    {(!photoUrl || photoError) && !mapError && (
                        <div className="bg-blue-500/90 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 shadow-lg">
                            <MapPinned className="w-3 h-3" />
                            Map View
                        </div>
                    )}
                    {((location.photos && location.photos.length > 1) || (location.photoUrls && location.photoUrls.length > 1)) && (
                        <div className="bg-black/70 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                            <Camera className="w-3 h-3" />
                            {location.photos?.length || location.photoUrls?.length || 0}
                        </div>
                    )}
                    {location.isPermanent && (
                        <Badge className="bg-green-500 text-white border-none shadow-lg">
                            Permanent
                        </Badge>
                    )}
                    {location.permitRequired && (
                        <Badge className="bg-orange-500 text-white border-none shadow-lg">
                            <Shield className="w-3 h-3 mr-1" />
                            Permit
                        </Badge>
                    )}
                </div>

                {/* Location Name */}
                <div className="absolute bottom-3 left-3 right-3">
                    <h3 className="font-bold text-lg text-white drop-shadow-lg line-clamp-2">
                        {location.name}
                    </h3>
                </div>
            </div>

            <CardHeader className="space-y-3 pb-3">
                {/* Action Buttons - At the very top */}
                <div className="flex gap-2">
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
                        className="flex-1"
                    >
                        <Share2 className="w-4 h-4 mr-1" />
                        Share
                    </Button>
                </div>

                {/* Main Address */}
                <p className="text-sm text-black line-clamp-2 flex items-start gap-2">
                    <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-black" />
                    <span>{location.address || 'No address available'}</span>
                </p>

                {/* Coordinates */}
                <div className="text-xs text-black flex items-center gap-2">
                    <Navigation className="w-3 h-3 text-black" />
                    <span>{location.lat.toFixed(3)}, {location.lng.toFixed(3)}</span>
                </div>
            </CardHeader>

            <CardContent className="space-y-3 pt-0 hidden">{/* Hidden content below coordinates */}
                {/* Production Notes */}
                {location.productionNotes && (
                    <div className="text-xs bg-blue-50 border border-blue-200 p-2 rounded-md">
                        <p className="font-semibold text-black mb-1">📝 Production Notes:</p>
                        <p className="text-black">{location.productionNotes}</p>
                    </div>
                )}

                {/* Quick Info Grid */}
                <div className="grid grid-cols-2 gap-2 text-xs text-black">
                    {location.indoorOutdoor && (
                        <div className="bg-muted/50 px-2 py-1.5 rounded flex items-center gap-1">
                            <MapPinned className="w-3 h-3 text-black" />
                            <span className="font-medium capitalize">{location.indoorOutdoor}</span>
                        </div>
                    )}
                    {location.parking && (
                        <div className="bg-muted/50 px-2 py-1.5 rounded truncate flex items-center gap-1" title={location.parking}>
                            🅿️ <span>{location.parking}</span>
                        </div>
                    )}
                </div>

                {/* Access & Entry Point */}
                {location.access && (
                    <div className="text-xs bg-muted/50 px-2 py-1.5 rounded flex items-start gap-2">
                        <Key className="w-3 h-3 mt-0.5 shrink-0 text-black" />
                        <div>
                            <p className="font-medium text-black">Access:</p>
                            <p className="text-black">{location.access}</p>
                        </div>
                    </div>
                )}

                {location.entryPoint && (
                    <div className="text-xs bg-muted/50 px-2 py-1.5 rounded flex items-start gap-2">
                        <MapPin className="w-3 h-3 mt-0.5 shrink-0 text-black" />
                        <div>
                            <p className="font-medium text-black">Entry Point:</p>
                            <p className="text-black">{location.entryPoint}</p>
                        </div>
                    </div>
                )}

                {/* Expandable Section for Additional Data */}
                {(location.bestTimeOfDay || location.operatingHours || location.restrictions ||
                    location.contactPerson || location.contactPhone || location.permitCost) && (
                        <div className="border-t pt-3">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="w-full text-xs text-black"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowAllData(!showAllData);
                                }}
                            >
                                {showAllData ? '▼ Hide' : '▶ Show'} Additional Details
                            </Button>

                            {showAllData && (
                                <div className="mt-3 space-y-2 text-xs">
                                    {location.bestTimeOfDay && (
                                        <div className="flex items-start gap-2 bg-muted/30 p-2 rounded">
                                            <Clock className="w-3 h-3 mt-0.5 shrink-0 text-black" />
                                            <div>
                                                <p className="font-medium text-black">Best Time:</p>
                                                <p className="text-black">{location.bestTimeOfDay}</p>
                                            </div>
                                        </div>
                                    )}

                                    {location.operatingHours && (
                                        <div className="flex items-start gap-2 bg-muted/30 p-2 rounded">
                                            <Clock className="w-3 h-3 mt-0.5 shrink-0 text-black" />
                                            <div>
                                                <p className="font-medium text-black">Operating Hours:</p>
                                                <p className="text-black">{location.operatingHours}</p>
                                            </div>
                                        </div>
                                    )}

                                    {location.restrictions && (
                                        <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 p-2 rounded">
                                            <AlertCircle className="w-3 h-3 mt-0.5 shrink-0 text-black" />
                                            <div>
                                                <p className="font-medium text-black">Restrictions:</p>
                                                <p className="text-black">{location.restrictions}</p>
                                            </div>
                                        </div>
                                    )}

                                    {location.contactPerson && (
                                        <div className="flex items-start gap-2 bg-muted/30 p-2 rounded">
                                            <User className="w-3 h-3 mt-0.5 shrink-0 text-black" />
                                            <div>
                                                <p className="font-medium text-black">Contact:</p>
                                                <p className="text-black">{location.contactPerson}</p>
                                            </div>
                                        </div>
                                    )}

                                    {location.contactPhone && (
                                        <div className="flex items-start gap-2 bg-muted/30 p-2 rounded">
                                            <Phone className="w-3 h-3 mt-0.5 shrink-0 text-black" />
                                            <div>
                                                <p className="font-medium text-black">Phone:</p>
                                                <p className="text-black">{location.contactPhone}</p>
                                            </div>
                                        </div>
                                    )}

                                    {location.permitCost !== null && location.permitCost !== undefined && (
                                        <div className="flex items-start gap-2 bg-green-50 border border-green-200 p-2 rounded">
                                            <DollarSign className="w-3 h-3 mt-0.5 shrink-0 text-black" />
                                            <div>
                                                <p className="font-medium text-black">Permit Cost:</p>
                                                <p className="text-black">
                                                    {location.permitCost === 0 ? 'Free' : `$${location.permitCost}`}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                {/* Tags */}
                {userSave?.tags && userSave.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-2">
                        {userSave.tags.slice(0, 6).map((tag: string, index: number) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                                #{tag}
                            </Badge>
                        ))}
                        {userSave.tags.length > 6 && (
                            <Badge variant="secondary" className="text-xs font-semibold">
                                +{userSave.tags.length - 6}
                            </Badge>
                        )}
                    </div>
                )}

                {/* Dates Section */}
                <div className="flex flex-col gap-1 text-xs text-black border-t pt-3">
                    {userSave?.visitedAt && (
                        <div className="flex items-center gap-1.5">
                            <Calendar className="w-3 h-3 text-black" />
                            <span>Visited: {new Date(userSave.visitedAt).toLocaleDateString()}</span>
                        </div>
                    )}
                    {userSave?.savedAt && (
                        <div className="flex items-center gap-1.5">
                            <Star className="w-3 h-3 text-black" />
                            <span>Saved: {new Date(userSave.savedAt).toLocaleDateString()}</span>
                        </div>
                    )}
                    <div className="flex items-center gap-1.5">
                        <Clock className="w-3 h-3 text-black" />
                        <span>Created: {new Date(location.createdAt).toLocaleDateString()}</span>
                    </div>
                    {location.lastModifiedAt && (
                        <div className="flex items-center gap-1.5">
                            <Clock className="w-3 h-3 text-black" />
                            <span>Modified: {new Date(location.lastModifiedAt).toLocaleDateString()}</span>
                        </div>
                    )}
                </div>

                {/* Debug Info (IDs) */}
                <div className="text-xs text-black/50 font-mono bg-muted/20 px-2 py-1 rounded">
                    ID: {location.id} | Place: {location.placeId.slice(0, 8)}...
                </div>
            </CardContent>

            <CardFooter className="hidden">{/* Action buttons moved to CardHeader */}
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
                        className="text-destructive hover:bg-destructive hover:text-white"
                    >
                        <Trash2 className="w-4 h-4" />
                    </Button>
                )}
            </CardFooter>
        </Card>
    );
});
