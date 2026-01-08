"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Heart,
    MapPin,
    Edit,
    Trash2,
    Share2,
    Map,
    Star,
    Calendar,
    User,
    Clock,
    Navigation,
    Building2,
    DollarSign,
    Phone,
    Shield,
    AlertCircle,
    Key,
} from "lucide-react";
import { PhotoGallery } from "./PhotoGallery";
import type { Location } from "@/types/location";

interface LocationDetailModalProps {
    location: Location | null;
    isOpen: boolean;
    onClose: () => void;
    onEdit?: (location: Location) => void;
    onDelete?: (id: number) => void;
    onShare?: (location: Location) => void;
    onViewOnMap?: (location: Location) => void;
}

export function LocationDetailModal({
    location,
    isOpen,
    onClose,
    onEdit,
    onDelete,
    onShare,
    onViewOnMap,
}: LocationDetailModalProps) {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState("overview");

    if (!location) return null;

    const typeColor = location.userSave?.color || "#64748B";
    const isFavorite = location.userSave?.isFavorite || false;
    const personalRating = location.userSave?.personalRating || 0;

    const formatDate = (dateString: string | Date) => {
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
            });
        } catch {
            return String(dateString);
        }
    };

    const handleViewOnMap = () => {
        if (onViewOnMap) {
            onViewOnMap(location);
        } else {
            // Use UserSave ID for the edit parameter (API expects UserSave ID)
            const userSaveId = location.userSave?.id || location.id;
            router.push(`/map?lat=${location.lat}&lng=${location.lng}&zoom=17&edit=${userSaveId}`);
        }
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl h-[90vh] overflow-hidden flex flex-col p-0">
                {/* Header */}
                <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0">
                    <div className="space-y-4">
                        {/* Title and Badges */}
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                                <DialogTitle className="text-2xl font-bold mb-2 pr-8">
                                    {location.name}
                                </DialogTitle>
                                <div className="flex items-center gap-2 flex-wrap">
                                    {location.type && (
                                        <Badge
                                            style={{
                                                backgroundColor: typeColor,
                                                color: 'white',
                                            }}
                                        >
                                            {location.type}
                                        </Badge>
                                    )}
                                    {isFavorite && (
                                        <Badge variant="secondary" className="bg-red-100 text-red-700">
                                            <Heart className="w-3 h-3 mr-1 fill-current" />
                                            Favorite
                                        </Badge>
                                    )}
                                    {personalRating > 0 && (
                                        <Badge variant="secondary" className="bg-amber-100 text-amber-700">
                                            <Star className="w-3 h-3 mr-1 fill-current" />
                                            {personalRating}/5
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2 flex-wrap">
                            <Button
                                variant="default"
                                size="sm"
                                onClick={handleViewOnMap}
                            >
                                <Map className="w-4 h-4 mr-2" />
                                View on Map
                            </Button>
                            {onEdit && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        onEdit(location);
                                        onClose();
                                    }}
                                >
                                    <Edit className="w-4 h-4 mr-2" />
                                    Edit
                                </Button>
                            )}
                            {onShare && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        onShare(location);
                                        onClose();
                                    }}
                                >
                                    <Share2 className="w-4 h-4 mr-2" />
                                    Share
                                </Button>
                            )}
                            {onDelete && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        if (confirm('Are you sure you want to delete this location?')) {
                                            onDelete(location.id);
                                            onClose();
                                        }
                                    }}
                                    className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                                >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Delete
                                </Button>
                            )}
                        </div>
                    </div>
                </DialogHeader>

                {/* Content - Scrollable */}
                <div className="flex-1 overflow-y-auto px-6 pb-6 scrollbar-hide">
                    {/* Photo Gallery or Static Map */}
                    <div className="mb-6">
                        {location.photos && location.photos.length > 0 ? (
                            <PhotoGallery photos={location.photos} />
                        ) : (
                            <div className="relative h-64 bg-gradient-to-br from-muted to-muted/50 overflow-hidden rounded-lg">
                                <img
                                    src={`https://maps.googleapis.com/maps/api/staticmap?center=${location.lat},${location.lng}&zoom=16&size=800x400&scale=2&maptype=roadmap&markers=color:red%7C${location.lat},${location.lng}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''}`}
                                    alt={`Map of ${location.name}`}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        target.style.display = 'none';
                                        const parent = target.parentElement;
                                        if (parent) {
                                            parent.innerHTML = '<div class="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5"><svg class="w-20 h-20 text-muted-foreground/30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"></path></svg></div>';
                                        }
                                    }}
                                />
                            </div>
                        )}
                    </div>

                    {/* Tabs */}
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="overview">Overview</TabsTrigger>
                            <TabsTrigger value="production">Production</TabsTrigger>
                            <TabsTrigger value="metadata">Metadata</TabsTrigger>
                        </TabsList>

                        {/* Overview Tab */}
                        <TabsContent value="overview" className="space-y-4 mt-4">
                            {/* Address - Clickable to map */}
                            <div className="space-y-2">
                                <h3 className="font-semibold text-sm text-muted-foreground">Address</h3>
                                <button
                                    onClick={handleViewOnMap}
                                    className="text-left w-full p-3 rounded-lg border hover:bg-accent transition-colors group"
                                >
                                    <div className="flex items-start gap-2">
                                        <MapPin className="w-4 h-4 mt-0.5 text-primary group-hover:scale-110 transition-transform" />
                                        <div className="flex-1">
                                            <p className="font-medium group-hover:text-primary transition-colors">
                                                {location.address}
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                Click to view on map
                                            </p>
                                        </div>
                                    </div>
                                </button>
                            </div>

                            {/* Coordinates */}
                            <div className="space-y-2">
                                <h3 className="font-semibold text-sm text-muted-foreground">Coordinates</h3>
                                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                                    <Navigation className="w-4 h-4 text-muted-foreground" />
                                    <code className="text-sm font-mono">
                                        {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                                    </code>
                                </div>
                            </div>

                            {/* Tags */}
                            {location.userSave?.tags && location.userSave.tags.length > 0 && (
                                <div className="space-y-2">
                                    <h3 className="font-semibold text-sm text-muted-foreground">Tags</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {location.userSave.tags.map((tag, index) => (
                                            <Badge key={index} variant="outline">
                                                {tag}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Indoor/Outdoor */}
                            {location.indoorOutdoor && (
                                <div className="space-y-2">
                                    <h3 className="font-semibold text-sm text-muted-foreground">Environment</h3>
                                    <div className="flex items-center gap-2">
                                        <Building2 className="w-4 h-4 text-muted-foreground" />
                                        <span className="capitalize">{location.indoorOutdoor}</span>
                                    </div>
                                </div>
                            )}

                            {/* Permanent/Temporary */}
                            {location.isPermanent !== undefined && (
                                <div className="space-y-2">
                                    <h3 className="font-semibold text-sm text-muted-foreground">Status</h3>
                                    <div className="flex items-center gap-2">
                                        <Shield className="w-4 h-4 text-muted-foreground" />
                                        <span>{location.isPermanent ? 'Permanent' : 'Temporary'}</span>
                                    </div>
                                </div>
                            )}
                        </TabsContent>

                        {/* Production Tab */}
                        <TabsContent value="production" className="space-y-4 mt-4">
                            {location.productionNotes && (
                                <div className="space-y-2">
                                    <h3 className="font-semibold text-sm text-muted-foreground">Production Notes</h3>
                                    <p className="text-sm p-3 bg-muted rounded-lg whitespace-pre-wrap">
                                        {location.productionNotes}
                                    </p>
                                </div>
                            )}

                            {location.entryPoint && (
                                <div className="space-y-2">
                                    <h3 className="font-semibold text-sm text-muted-foreground">Entry Point</h3>
                                    <p className="text-sm">{location.entryPoint}</p>
                                </div>
                            )}

                            {location.parking && (
                                <div className="space-y-2">
                                    <h3 className="font-semibold text-sm text-muted-foreground">Parking</h3>
                                    <p className="text-sm">{location.parking}</p>
                                </div>
                            )}

                            {location.access && (
                                <div className="space-y-2">
                                    <h3 className="font-semibold text-sm text-muted-foreground">Access</h3>
                                    <p className="text-sm">{location.access}</p>
                                </div>
                            )}

                            {location.operatingHours && (
                                <div className="space-y-2">
                                    <h3 className="font-semibold text-sm text-muted-foreground">Operating Hours</h3>
                                    <div className="flex items-center gap-2">
                                        <Clock className="w-4 h-4 text-muted-foreground" />
                                        <span className="text-sm">{location.operatingHours}</span>
                                    </div>
                                </div>
                            )}

                            {location.contactPerson && (
                                <div className="space-y-2">
                                    <h3 className="font-semibold text-sm text-muted-foreground">Contact Person</h3>
                                    <div className="flex items-center gap-2">
                                        <User className="w-4 h-4 text-muted-foreground" />
                                        <span className="text-sm">{location.contactPerson}</span>
                                    </div>
                                </div>
                            )}

                            {location.contactPhone && (
                                <div className="space-y-2">
                                    <h3 className="font-semibold text-sm text-muted-foreground">Contact Phone</h3>
                                    <div className="flex items-center gap-2">
                                        <Phone className="w-4 h-4 text-muted-foreground" />
                                        <a href={`tel:${location.contactPhone}`} className="text-sm text-primary hover:underline">
                                            {location.contactPhone}
                                        </a>
                                    </div>
                                </div>
                            )}

                            {location.permitRequired !== undefined && (
                                <div className="space-y-2">
                                    <h3 className="font-semibold text-sm text-muted-foreground">Permit Required</h3>
                                    <div className="flex items-center gap-2">
                                        <Key className="w-4 h-4 text-muted-foreground" />
                                        <span className="text-sm">{location.permitRequired ? 'Yes' : 'No'}</span>
                                    </div>
                                </div>
                            )}

                            {location.permitCost !== undefined && location.permitCost !== null && location.permitCost > 0 && (
                                <div className="space-y-2">
                                    <h3 className="font-semibold text-sm text-muted-foreground">Permit Cost</h3>
                                    <div className="flex items-center gap-2">
                                        <DollarSign className="w-4 h-4 text-muted-foreground" />
                                        <span className="text-sm">${location.permitCost}</span>
                                    </div>
                                </div>
                            )}

                            {location.restrictions && (
                                <div className="space-y-2">
                                    <h3 className="font-semibold text-sm text-muted-foreground">Restrictions</h3>
                                    <div className="flex items-start gap-2">
                                        <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5" />
                                        <p className="text-sm">{location.restrictions}</p>
                                    </div>
                                </div>
                            )}

                            {location.bestTimeOfDay && (
                                <div className="space-y-2">
                                    <h3 className="font-semibold text-sm text-muted-foreground">Best Time of Day</h3>
                                    <div className="flex items-center gap-2">
                                        <Clock className="w-4 h-4 text-muted-foreground" />
                                        <span className="text-sm">{location.bestTimeOfDay}</span>
                                    </div>
                                </div>
                            )}

                            {!location.productionNotes && !location.entryPoint && !location.parking && !location.access && (
                                <div className="text-center py-8 text-muted-foreground">
                                    <p className="text-sm">No production details available</p>
                                </div>
                            )}
                        </TabsContent>

                        {/* Metadata Tab */}
                        <TabsContent value="metadata" className="space-y-4 mt-4">
                            <div className="space-y-4">
                                {location.createdAt && (
                                    <div className="space-y-2">
                                        <h3 className="font-semibold text-sm text-muted-foreground">Created</h3>
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-4 h-4 text-muted-foreground" />
                                            <span className="text-sm">{formatDate(location.createdAt)}</span>
                                        </div>
                                    </div>
                                )}

                                {location.lastModifiedAt && (
                                    <div className="space-y-2">
                                        <h3 className="font-semibold text-sm text-muted-foreground">Last Modified</h3>
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-4 h-4 text-muted-foreground" />
                                            <span className="text-sm">{formatDate(location.lastModifiedAt)}</span>
                                        </div>
                                    </div>
                                )}

                                {location.userSave?.savedAt && (
                                    <div className="space-y-2">
                                        <h3 className="font-semibold text-sm text-muted-foreground">Saved to Collection</h3>
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-4 h-4 text-muted-foreground" />
                                            <span className="text-sm">{formatDate(location.userSave.savedAt)}</span>
                                        </div>
                                    </div>
                                )}

                                <div className="pt-4 border-t space-y-2">
                                    <h3 className="font-semibold text-sm text-muted-foreground">IDs</h3>
                                    <div className="space-y-1 text-xs font-mono bg-muted p-3 rounded-lg">
                                        <p><span className="text-muted-foreground">Location ID:</span> {location.id}</p>
                                        <p><span className="text-muted-foreground">Place ID:</span> {location.placeId}</p>
                                    </div>
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            </DialogContent>
        </Dialog>
    );
}
