"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    MapPin,
    Edit,
    Trash2,
    Share2,
    Map,
    Calendar,
    User,
    Clock,
    Navigation,
    Building2,
    DollarSign,
    Phone,
    AlertCircle,
    Key,
    X,
    Copy,
} from "lucide-react";
import { PhotoGallery } from "../locations/PhotoGallery";
import type { Location } from "@/types/location";

interface LocationDetailPanelProps {
    location: Location;
    onEdit?: (location: Location) => void;
    onDelete?: (id: number) => void;
    onShare?: (location: Location) => void;
    onViewOnMap?: (location: Location) => void;
    onClose?: () => void;
}

export function LocationDetailPanel({
    location,
    onEdit,
    onDelete,
    onShare,
    onViewOnMap,
    onClose,
}: LocationDetailPanelProps) {
    const router = useRouter();

    const typeColor = location.userSave?.color || "#64748B";

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
    };

    return (
        <div className="flex flex-col h-full">
            {/* Header - Fixed at top */}
            <div className="px-4 pb-3 border-b shrink-0">
                {/* Title with Close Button */}
                <div className="flex items-center justify-between gap-4">
                    <h2 className="text-xl font-bold flex-1">
                        {location.name}
                    </h2>
                    {onClose && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onClose}
                            className="h-8 w-8 hover:bg-muted shrink-0"
                            title="Close"
                        >
                            <X className="w-4 h-4" />
                        </Button>
                    )}
                </div>
            </div>

            {/* Content - Scrollable */}
            <div className="flex-1 overflow-y-auto">
                <div className="px-4 pb-20">
                    {/* Photo Gallery or Static Map */}
                    <div className="my-4 relative">
                        {/* Action Buttons - Overlay top-left */}
                        <div className="absolute top-2 left-2 flex gap-1.5 z-10">
                            {onEdit && (
                                <Button
                                    variant="secondary"
                                    size="icon"
                                    onClick={() => onEdit(location)}
                                    title="Edit location"
                                    className="h-7 w-7 bg-white/90 hover:bg-white shadow-md backdrop-blur-sm"
                                >
                                    <Edit className="w-3.5 h-3.5" />
                                </Button>
                            )}
                            {onShare && (
                                <Button
                                    variant="secondary"
                                    size="icon"
                                    onClick={() => onShare(location)}
                                    title="Share location"
                                    className="h-7 w-7 bg-white/90 hover:bg-white shadow-md backdrop-blur-sm"
                                >
                                    <Share2 className="w-3.5 h-3.5" />
                                </Button>
                            )}
                            <Button
                                variant="secondary"
                                size="icon"
                                onClick={handleViewOnMap}
                                title="View on Map"
                                className="h-7 w-7 bg-white/90 hover:bg-white shadow-md backdrop-blur-sm"
                            >
                                <Map className="w-3.5 h-3.5" />
                            </Button>
                            {location.type && (
                                <Badge
                                    style={{
                                        backgroundColor: typeColor,
                                        color: 'white',
                                    }}
                                    className="h-7 flex items-center"
                                >
                                    {location.type}
                                </Badge>
                            )}
                        </div>

                        {/* Delete button - Overlay top-right */}
                        <div className="absolute top-2 right-2 flex gap-1.5 z-10">
                            {onDelete && (
                                <Button
                                    variant="secondary"
                                    size="icon"
                                    onClick={() => {
                                        if (confirm('Are you sure you want to delete this location?')) {
                                            onDelete(location.userSave?.id || location.id);
                                        }
                                    }}
                                    className="h-7 w-7 bg-white/90 hover:bg-white shadow-md backdrop-blur-sm text-destructive hover:text-destructive"
                                    title="Delete location"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                            )}
                        </div>
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

                {/* All Content - Single Scrollable Section */}
                <div className="space-y-4 mt-4">
                    {/* Address & Coordinates Combined */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-sm text-muted-foreground">Address</h3>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    navigator.clipboard.writeText(location.address || '');
                                }}
                                className="h-7 px-2"
                            >
                                <Copy className="w-3.5 h-3.5" />
                            </Button>
                        </div>
                        <button
                            onClick={handleViewOnMap}
                            className="text-left w-full p-3 rounded-lg border hover:bg-accent transition-colors group"
                        >
                            <div className="flex items-start gap-2">
                                <MapPin className="w-4 h-4 mt-0.5 text-primary group-hover:scale-110 transition-transform" />
                                <div className="flex-1 space-y-2">
                                    <p className="font-medium group-hover:text-primary transition-colors">
                                        {location.address}
                                    </p>
                                    {location.lat != null && location.lng != null && (
                                        <div className="flex items-center gap-2">
                                            <Navigation className="w-3 h-3 text-muted-foreground" />
                                            <code className="text-xs font-mono text-muted-foreground">
                                                {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                                            </code>
                                        </div>
                                    )}
                                    <p className="text-xs text-muted-foreground">
                                        Click to view on map
                                    </p>
                                </div>
                            </div>
                        </button>
                    </div>
                    
                    {/* Production Notes */}
                    {location.productionNotes && (
                        <div className="space-y-2">
                            <h3 className="font-semibold text-sm text-muted-foreground">Production Notes</h3>
                            <p className="text-sm p-3 bg-muted rounded-lg whitespace-pre-wrap">
                                {location.productionNotes}
                            </p>
                        </div>
                    )}

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

                    

                    {/* Entry Point */}
                    {location.entryPoint && (
                        <div className="space-y-2">
                            <h3 className="font-semibold text-sm text-muted-foreground">Entry Point</h3>
                            <p className="text-sm">{location.entryPoint}</p>
                        </div>
                    )}

                    {/* Parking */}
                    {location.parking && (
                        <div className="space-y-2">
                            <h3 className="font-semibold text-sm text-muted-foreground">Parking</h3>
                            <p className="text-sm">{location.parking}</p>
                        </div>
                    )}

                    {/* Access */}
                    {location.access && (
                        <div className="space-y-2">
                            <h3 className="font-semibold text-sm text-muted-foreground">Access</h3>
                            <p className="text-sm">{location.access}</p>
                        </div>
                    )}

                    {/* Operating Hours */}
                    {location.operatingHours && (
                        <div className="space-y-2">
                            <h3 className="font-semibold text-sm text-muted-foreground">Operating Hours</h3>
                            <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-muted-foreground" />
                                <span className="text-sm">{location.operatingHours}</span>
                            </div>
                        </div>
                    )}

                    {/* Contact Person */}
                    {location.contactPerson && (
                        <div className="space-y-2">
                            <h3 className="font-semibold text-sm text-muted-foreground">Contact Person</h3>
                            <div className="flex items-center gap-2">
                                <User className="w-4 h-4 text-muted-foreground" />
                                <span className="text-sm">{location.contactPerson}</span>
                            </div>
                        </div>
                    )}

                    {/* Contact Phone */}
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

                    {/* Permit Required */}
                    {location.permitRequired !== undefined && (
                        <div className="space-y-2">
                            <h3 className="font-semibold text-sm text-muted-foreground">Permit Required</h3>
                            <div className="flex items-center gap-2">
                                <Key className="w-4 h-4 text-muted-foreground" />
                                <span className="text-sm">{location.permitRequired ? 'Yes' : 'No'}</span>
                            </div>
                        </div>
                    )}

                    {/* Permit Cost */}
                    {location.permitCost !== undefined && location.permitCost !== null && location.permitCost > 0 && (
                        <div className="space-y-2">
                            <h3 className="font-semibold text-sm text-muted-foreground">Permit Cost</h3>
                            <div className="flex items-center gap-2">
                                <DollarSign className="w-4 h-4 text-muted-foreground" />
                                <span className="text-sm">${location.permitCost}</span>
                            </div>
                        </div>
                    )}

                    {/* Restrictions */}
                    {location.restrictions && (
                        <div className="space-y-2">
                            <h3 className="font-semibold text-sm text-muted-foreground">Restrictions</h3>
                            <div className="flex items-start gap-2">
                                <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5" />
                                <p className="text-sm">{location.restrictions}</p>
                            </div>
                        </div>
                    )}

                    {/* Best Time of Day */}
                    {location.bestTimeOfDay && (
                        <div className="space-y-2">
                            <h3 className="font-semibold text-sm text-muted-foreground">Best Time of Day</h3>
                            <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-muted-foreground" />
                                <span className="text-sm">{location.bestTimeOfDay}</span>
                            </div>
                        </div>
                    )}

                    {/* Created */}
                    {location.createdAt && (
                        <div className="space-y-2">
                            <h3 className="font-semibold text-sm text-muted-foreground">Created</h3>
                            <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-muted-foreground" />
                                <span className="text-sm">{formatDate(location.createdAt)}</span>
                            </div>
                        </div>
                    )}

                    {/* Last Modified */}
                    {location.lastModifiedAt && (
                        <div className="space-y-2">
                            <h3 className="font-semibold text-sm text-muted-foreground">Last Modified</h3>
                            <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-muted-foreground" />
                                <span className="text-sm">{formatDate(location.lastModifiedAt)}</span>
                            </div>
                        </div>
                    )}

                    {/* Saved to Collection */}
                    {location.userSave?.savedAt && (
                        <div className="space-y-2">
                            <h3 className="font-semibold text-sm text-muted-foreground">Saved to Collection</h3>
                            <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-muted-foreground" />
                                <span className="text-sm">{formatDate(location.userSave.savedAt)}</span>
                            </div>
                        </div>
                    )}

                    {/* IDs */}
                    <div className="pt-4 border-t space-y-2">
                        <h3 className="font-semibold text-sm text-muted-foreground">IDs</h3>
                        <div className="space-y-1 text-xs font-mono bg-muted p-3 rounded-lg">
                            <p><span className="text-muted-foreground">Location ID:</span> {location.id}</p>
                            <p><span className="text-muted-foreground">Place ID:</span> {location.placeId}</p>
                        </div>
                    </div>
                </div>
                </div>
            </div>
        </div>
    );
}
