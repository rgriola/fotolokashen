"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useUpdateLocation } from "@/hooks/useUpdateLocation";
import { MapPin, Tag, X, Save } from "lucide-react";
import { ImageKitUploader } from "@/components/ui/ImageKitUploader";
import { UserSave, Location } from "@/types/location";
import { IMAGEKIT_URL_ENDPOINT } from "@/lib/imagekit";

const editLocationSchema = z.object({
    id: z.number(),
    name: z.string().min(1, "Location name is required"),
    address: z.string().optional(),
    type: z.string().min(1, "Type is required"),
    indoorOutdoor: z.enum(["indoor", "outdoor", "both"]).optional(),

    // Production details
    productionNotes: z.string().max(500).optional(),
    entryPoint: z.string().optional(),
    parking: z.string().optional(),
    access: z.string().optional(),

    // User save details
    caption: z.string().max(200).optional(),
    isFavorite: z.boolean().optional(),
    personalRating: z.number().min(0).max(5).optional(),
    color: z.string().optional(),
});

type EditLocationFormData = z.infer<typeof editLocationSchema>;

interface EditLocationPanelProps {
    locationId: number;
    location: Location;
    userSave: UserSave;
    onSuccess?: () => void;
    onCancel?: () => void;
}

// Type-to-Color mapping
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

const LOCATION_TYPES = Object.keys(TYPE_COLOR_MAP);

export function EditLocationPanel({
    locationId,
    location,
    userSave,
    onSuccess,
    onCancel,
}: EditLocationPanelProps) {
    const [tags, setTags] = useState<string[]>(userSave.tags || []);
    const [tagInput, setTagInput] = useState("");

    const [photos, setPhotos] = useState<any[]>([]);

    const updateLocation = useUpdateLocation();

    const form = useForm<EditLocationFormData>({
        resolver: zodResolver(editLocationSchema),
        defaultValues: {
            id: locationId,
            name: location.name,
            address: location.address || "",
            type: location.type || "",
            indoorOutdoor: (location.indoorOutdoor as "indoor" | "outdoor" | "both") || "outdoor",
            productionNotes: location.productionNotes || "",
            entryPoint: location.entryPoint || "",
            parking: location.parking || "",
            access: location.access || "",
            caption: userSave.caption || "",
            isFavorite: userSave.isFavorite || false,
            personalRating: userSave.personalRating || 0,
            color: userSave.color || TYPE_COLOR_MAP[location.type || ""] || "",
        },
    });

    // Reset form and state when location changes
    useEffect(() => {
        // Recalculate photos from current location data
        const newPhotos = (location.photos || []).map((photo: any) => ({
            id: photo.id,
            imagekitFileId: photo.imagekitFileId,
            imagekitFilePath: photo.imagekitFilePath,
            originalFilename: photo.originalFilename,
            fileSize: photo.fileSize || 0,
            mimeType: photo.mimeType || 'image/jpeg',
            width: photo.width,
            height: photo.height,
            url: `${IMAGEKIT_URL_ENDPOINT}${photo.imagekitFilePath}`, // Construct full ImageKit URL
            isPrimary: photo.isPrimary,
            caption: photo.caption,
        }));

        // Reset photos
        setPhotos(newPhotos);

        // Reset tags
        setTags(userSave.tags || []);

        // Reset form with new location data
        form.reset({
            id: locationId,
            name: location.name,
            address: location.address || "",
            type: location.type || "",
            indoorOutdoor: (location.indoorOutdoor as "indoor" | "outdoor" | "both") || "outdoor",
            productionNotes: location.productionNotes || "",
            entryPoint: location.entryPoint || "",
            parking: location.parking || "",
            access: location.access || "",
            caption: userSave.caption || "",
            isFavorite: userSave.isFavorite || false,
            personalRating: userSave.personalRating || 0,
            color: userSave.color || TYPE_COLOR_MAP[location.type || ""] || "",
        });
    }, [locationId, location.photos, userSave.tags, userSave.caption, userSave.isFavorite, userSave.personalRating, userSave.color]); // Re-run when location or userSave changes

    const onSubmit = (data: EditLocationFormData) => {
        const finalColor = data.color || TYPE_COLOR_MAP[data.type || ""] || "";
        const finalIndoorOutdoor = data.indoorOutdoor || "outdoor";

        const submitData = {
            id: data.id,
            name: data.name,
            type: data.type,
            indoorOutdoor: finalIndoorOutdoor,
            productionNotes: data.productionNotes,
            entryPoint: data.entryPoint,
            parking: data.parking,
            access: data.access,
            caption: data.caption,
            tags: tags.length > 0 ? tags : undefined,
            isFavorite: data.isFavorite,
            personalRating: data.personalRating,
            color: finalColor,
            photos: photos.length > 0 ? photos : undefined,
        };

        console.log('[EditLocationPanel] Updating location:', submitData);

        updateLocation.mutate(
            submitData,
            {
                onSuccess: () => {
                    onSuccess?.();
                },
            }
        );
    };

    const handleAddTag = () => {
        if (tagInput.trim() && !tags.includes(tagInput.trim()) && tags.length < 20) {
            setTags([...tags, tagInput.trim()]);
            setTagInput("");
        }
    };

    const handleRemoveTag = (tagToRemove: string) => {
        setTags(tags.filter((tag) => tag !== tagToRemove));
    };

    // Character count helpers
    const captionCount = form.watch("caption")?.length || 0;
    const productionNotesCount = form.watch("productionNotes")?.length || 0;

    return (
        <div className="flex flex-col h-full">
            {/* Form - Scrollable */}
            <div className="flex-1 overflow-y-auto p-4">
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    {/* Location Fields */}
                    <div className="space-y-4">
                        <div className="space-y-3">
                            <div>
                                <Label htmlFor="name">Location Name *</Label>
                                <Input
                                    id="name"
                                    {...form.register("name")}
                                    placeholder="e.g., Central Park"
                                />
                                {form.formState.errors.name && (
                                    <p className="text-sm text-destructive mt-1">
                                        {form.formState.errors.name.message}
                                    </p>
                                )}
                            </div>

                            <div>
                                <Label htmlFor="address">Full Address (from Google)</Label>
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                                    <Input
                                        id="address"
                                        {...form.register("address")}
                                        placeholder="123 Main St, New York, NY 10001"
                                        className="pl-9"
                                        readOnly
                                    />
                                </div>
                            </div>

                            {/* GPS Coordinates Display */}
                            <div className="grid grid-cols-2 gap-3 p-3 bg-muted/50 rounded-md border">
                                <div>
                                    <Label className="text-xs text-muted-foreground">Latitude</Label>
                                    <p className="text-sm font-mono font-medium">
                                        {location.lat?.toFixed(6) || "0.000000"}
                                    </p>
                                </div>
                                <div>
                                    <Label className="text-xs text-muted-foreground">Longitude</Label>
                                    <p className="text-sm font-mono font-medium">
                                        {location.lng?.toFixed(6) || "0.000000"}
                                    </p>
                                </div>
                            </div>

                            {/* Type and Indoor/Outdoor - Side by Side */}
                            <div className="grid grid-cols-2 gap-3">
                                {/* Type - Select Dropdown */}
                                <div className="space-y-2">
                                    <Label htmlFor="type">Type *</Label>
                                    <Select
                                        onValueChange={(value) => {
                                            form.setValue("type", value);
                                            form.setValue("color", TYPE_COLOR_MAP[value] || "");
                                        }}
                                        value={form.watch("type") || ""}
                                    >
                                        <SelectTrigger id="type">
                                            <SelectValue placeholder="Select location type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {LOCATION_TYPES.map((type) => (
                                                <SelectItem key={type} value={type}>
                                                    <div className="flex items-center gap-2">
                                                        <div
                                                            className="w-3 h-3 rounded-full"
                                                            style={{ backgroundColor: TYPE_COLOR_MAP[type] }}
                                                        />
                                                        <span>{type}</span>
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {form.formState.errors.type && (
                                        <p className="text-xs text-destructive">
                                            {form.formState.errors.type.message}
                                        </p>
                                    )}
                                </div>

                                {/* Indoor/Outdoor */}
                                <div className="space-y-2">
                                    <Label htmlFor="indoorOutdoor">Indoor/Outdoor</Label>
                                    <Select
                                        onValueChange={(value) => form.setValue("indoorOutdoor", value as "indoor" | "outdoor" | "both")}
                                        defaultValue={form.getValues("indoorOutdoor") || "outdoor"}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="indoor">Indoor</SelectItem>
                                            <SelectItem value="outdoor">Outdoor</SelectItem>
                                            <SelectItem value="both">Both</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Production Details */}
                    <div className="space-y-4">
                        <div className="space-y-3">
                            <div>
                                <div className="flex justify-between items-center">
                                    <Label htmlFor="productionNotes">Production Notes (Optional)</Label>
                                    <span className="text-xs text-muted-foreground">
                                        {productionNotesCount}/500 characters
                                    </span>
                                </div>
                                <Textarea
                                    id="productionNotes"
                                    {...form.register("productionNotes")}
                                    placeholder="Special considerations..."
                                    rows={3}
                                    maxLength={500}
                                />
                            </div>

                            <div>
                                <Label htmlFor="entryPoint">Entry Point</Label>
                                <Input
                                    id="entryPoint"
                                    {...form.register("entryPoint")}
                                    placeholder="Main entrance"
                                />
                            </div>

                            <div>
                                <Label htmlFor="parking">Parking</Label>
                                <Input
                                    id="parking"
                                    {...form.register("parking")}
                                    placeholder="Parking info"
                                />
                            </div>

                            <div>
                                <Label htmlFor="access">Access</Label>
                                <Input
                                    id="access"
                                    {...form.register("access")}
                                    placeholder="How to access"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Personal Notes */}
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="tags">Tags (max 20)</Label>
                            <div className="flex gap-2">
                                <Input
                                    id="tags"
                                    value={tagInput}
                                    onChange={(e) => setTagInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            e.preventDefault();
                                            handleAddTag();
                                        }
                                    }}
                                    placeholder="Add tags..."
                                    maxLength={25}
                                />
                                <Button type="button" onClick={handleAddTag} variant="outline" size="icon">
                                    <Tag className="w-4 h-4" />
                                </Button>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                {tags.length}/20 tags • Max 25 characters per tag
                            </p>
                            {tags.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {tags.map((tag) => (
                                        <Badge key={tag} variant="secondary" className="gap-1">
                                            {tag}
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveTag(tag)}
                                                className="ml-1 hover:text-destructive"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </Badge>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label htmlFor="personalRating">Rating</Label>
                                <Select
                                    onValueChange={(value) =>
                                        form.setValue("personalRating", parseInt(value))
                                    }
                                    defaultValue={form.getValues("personalRating")?.toString()}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Rate" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="0">No rating</SelectItem>
                                        <SelectItem value="1">⭐</SelectItem>
                                        <SelectItem value="2">⭐⭐</SelectItem>
                                        <SelectItem value="3">⭐⭐⭐</SelectItem>
                                        <SelectItem value="4">⭐⭐⭐⭐</SelectItem>
                                        <SelectItem value="5">⭐⭐⭐⭐⭐</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex items-end">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        {...form.register("isFavorite")}
                                        className="w-4 h-4 rounded border-gray-300"
                                    />
                                    <span className="text-sm">Favorite</span>
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Photo Upload */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold">Photos (Max 20)</h3>
                        <ImageKitUploader
                            placeId={location.placeId}
                            onPhotosChange={setPhotos}
                            maxPhotos={20}
                            maxFileSize={1.5}
                            existingPhotos={photos}
                        />
                    </div>
                </form>
            </div>

            {/* Footer with Actions */}
            <div className="p-4 border-t space-y-2">
                <div className="flex gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onCancel}
                        disabled={updateLocation.isPending}
                        className="flex-1"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={form.handleSubmit(onSubmit)}
                        disabled={updateLocation.isPending}
                        className="flex-1"
                    >
                        {updateLocation.isPending ? "Updating..." : "Update"}
                    </Button>
                </div>
            </div>
        </div>
    );
}
