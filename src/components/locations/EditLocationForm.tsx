"use client";

import { useState, useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { MapPin, Tag, X, Map, AlertCircle, Sparkles } from "lucide-react";
import { ImageKitUploader } from "@/components/ui/ImageKitUploader";
import { PhotoCarouselManager } from "@/components/ui/PhotoCarouselManager";
import { TYPE_COLOR_MAP, getAvailableTypes } from "@/lib/location-constants";
import { indoorOutdoorSchema, DEFAULT_INDOOR_OUTDOOR } from "@/lib/form-constants";
import { Location, UserSave } from "@/types/location";
import { IMAGEKIT_URL_ENDPOINT } from "@/lib/imagekit";
import { useAuth } from "@/lib/auth-context";
import { useImproveDescription } from "@/hooks/useImproveDescription";
import Image from "next/image";
import { toast } from "sonner";

// Security: Regex to prevent XSS and SQL injection in text fields
const safeTextRegex = /^[a-zA-Z0-9\s\-.,!?&'"()]+$/;
const productionNotesRegex = /^[a-zA-Z0-9\s\-.,!?&'"();:@\n\r]+$/; // Allows @, commas, semicolons, colons for emails and phone numbers

const editLocationSchema = z.object({
    id: z.number(),
    name: z.string()
        .min(1, "Location name is required")
        .max(200, "Name must be 200 characters or less")
        .regex(safeTextRegex, "Invalid characters detected. Only letters, numbers, spaces, and basic punctuation (.,!?&'\"()-) are allowed. @ symbol is not allowed."),
    address: z.string().optional(),
    type: z.string().min(1, "Type is required"),
    indoorOutdoor: indoorOutdoorSchema,

    // Production details
    productionNotes: z.string().optional()
        .refine((val) => !val || val.length <= 500, "Production notes must be 500 characters or less")
        .refine((val) => !val || productionNotesRegex.test(val), "Invalid characters detected. Only letters, numbers, spaces, and punctuation (.,!?&'\"()-;:@) are allowed for contact info."),
    entryPoint: z.string().optional()
        .refine((val) => !val || val.length <= 200, "Entry point must be 200 characters or less")
        .refine((val) => !val || safeTextRegex.test(val), "Invalid characters detected. Only letters, numbers, spaces, and basic punctuation (.,!?&'\"()-) are allowed. @ symbol is not allowed."),
    parking: z.string().optional()
        .refine((val) => !val || val.length <= 200, "Parking info must be 200 characters or less")
        .refine((val) => !val || safeTextRegex.test(val), "Invalid characters detected. Only letters, numbers, spaces, and basic punctuation (.,!?&'\"()-) are allowed. @ symbol is not allowed."),
    access: z.string().optional()
        .refine((val) => !val || val.length <= 200, "Access info must be 200 characters or less")
        .refine((val) => !val || safeTextRegex.test(val), "Invalid characters detected. Only letters, numbers, spaces, and basic punctuation (.,!?&'\"()-) are allowed. @ symbol is not allowed."),

    // User save details
    caption: z.string().max(200).optional(),
    isFavorite: z.boolean().optional(),
    personalRating: z.number().min(0).max(5).optional(),
    color: z.string().optional(),
});

type EditLocationFormData = z.infer<typeof editLocationSchema>;

interface EditLocationFormProps {
    locationId: number;
    location: Location;
    userSave: UserSave;
    onSubmit: (data: any) => void;
    isPending?: boolean;
    showPhotoUpload?: boolean;
}

export function EditLocationForm({
    locationId,
    location,
    userSave,
    onSubmit,
    showPhotoUpload = false,
}: EditLocationFormProps) {
    const { user } = useAuth();
    // Check if user has admin or staffer role for extended location types
    const isAdmin = user?.isAdmin === true || user?.role === 'staffer' || user?.role === 'super_admin';
    const availableTypes = getAvailableTypes(isAdmin);
    
    const [tags, setTags] = useState<string[]>(userSave.tags || []);
    const [tagInput, setTagInput] = useState("");
    const [photos, setPhotos] = useState<any[]>([]);
    const [photosToDelete, setPhotosToDelete] = useState<number[]>([]);
    const [hasChanges, setHasChanges] = useState(false);
    const [changes, setChanges] = useState<string[]>([]);
    const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
    
    // AI description improvement hook
    const { improveDescription, isLoading: isAiLoading, error: aiError } = useImproveDescription();

    const form = useForm<EditLocationFormData>({
        resolver: zodResolver(editLocationSchema),
        defaultValues: {
            id: locationId,
            name: location.name,
            address: location.address || "",
            type: location.type || "",
            indoorOutdoor: (location.indoorOutdoor as "indoor" | "outdoor" | "both") || DEFAULT_INDOOR_OUTDOOR,
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

    // Watch form values using useWatch to avoid infinite loops
    const watchedName = useWatch({ control: form.control, name: "name" });
    const watchedType = useWatch({ control: form.control, name: "type" });
    const watchedCaption = useWatch({ control: form.control, name: "caption" });
    const watchedProductionNotes = useWatch({ control: form.control, name: "productionNotes" });
    const watchedPersonalRating = useWatch({ control: form.control, name: "personalRating" });
    const watchedIndoorOutdoor = useWatch({ control: form.control, name: "indoorOutdoor" });
    const watchedParking = useWatch({ control: form.control, name: "parking" });
    const watchedEntryPoint = useWatch({ control: form.control, name: "entryPoint" });
    const watchedAccess = useWatch({ control: form.control, name: "access" });

    // Subscribe to formState to ensure reactivity
    const { isDirty, dirtyFields } = form.formState;

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
            url: `${IMAGEKIT_URL_ENDPOINT}${photo.imagekitFilePath}`,
            isPrimary: photo.isPrimary,
            caption: photo.caption,
        }));

        setPhotos(newPhotos);
        setTags(userSave.tags || []);

        form.reset({
            id: locationId,
            name: location.name,
            address: location.address || "",
            type: location.type || "",
            indoorOutdoor: (location.indoorOutdoor as "indoor" | "outdoor" | "both") || DEFAULT_INDOOR_OUTDOOR,
            productionNotes: location.productionNotes || "",
            entryPoint: location.entryPoint || "",
            parking: location.parking || "",
            access: location.access || "",
            caption: userSave.caption || "",
            isFavorite: userSave.isFavorite || false,
            personalRating: userSave.personalRating || 0,
            color: userSave.color || TYPE_COLOR_MAP[location.type || ""] || "",
        });
    }, [locationId, location, userSave, form]);

    // Track changes for unsaved changes banner
    useEffect(() => {
        console.log('[Change Tracking]', {
            isDirty,
            dirtyFieldsKeys: Object.keys(dirtyFields),
            watchedName,
            watchedType,
            hasChanges
        });
        
        const changedFields: string[] = [];

        // Check form field changes
        if (dirtyFields.name) {
            changedFields.push(`Name: ${watchedName || '(empty)'}`);
        }
        if (dirtyFields.type) {
            changedFields.push(`Type: ${watchedType}`);
        }
        if (dirtyFields.caption) {
            changedFields.push('Caption updated');
        }
        if (dirtyFields.productionNotes) {
            changedFields.push('Production notes updated');
        }
        if (dirtyFields.personalRating) {
            changedFields.push(`Rating: ${watchedPersonalRating} stars`);
        }
        if (dirtyFields.parking) {
            changedFields.push('Parking info updated');
        }
        if (dirtyFields.entryPoint) {
            changedFields.push('Entry point updated');
        }
        if (dirtyFields.access) {
            changedFields.push('Access info updated');
        }
        if (dirtyFields.indoorOutdoor) {
            changedFields.push(`Setting: ${watchedIndoorOutdoor}`);
        }

        // Check if tags changed (compare arrays) - independent of form dirty state
        const currentTags = JSON.stringify([...tags].sort());
        const originalTags = JSON.stringify([...(userSave.tags || [])].sort());
        if (currentTags !== originalTags) {
            changedFields.push('Tags updated');
        }

        // Check if photos changed - independent of form dirty state
        if (photosToDelete.length > 0) {
            changedFields.push(`${photosToDelete.length} photo(s) marked for deletion`);
        }

        setChanges(changedFields);
        setHasChanges(changedFields.length > 0);
    }, [
        isDirty,
        dirtyFields,
        watchedName,
        watchedType,
        watchedCaption,
        watchedProductionNotes,
        watchedPersonalRating,
        watchedParking,
        watchedEntryPoint,
        watchedAccess,
        watchedIndoorOutdoor,
        tags,
        userSave.tags,
        photosToDelete.length
    ]);

    const handleDiscard = () => {
        // Reset form to original values
        form.reset({
            id: locationId,
            name: location.name,
            address: location.address || "",
            type: location.type || "",
            indoorOutdoor: (location.indoorOutdoor as "indoor" | "outdoor" | "both") || DEFAULT_INDOOR_OUTDOOR,
            productionNotes: location.productionNotes || "",
            entryPoint: location.entryPoint || "",
            parking: location.parking || "",
            access: location.access || "",
            caption: userSave.caption || "",
            isFavorite: userSave.isFavorite || false,
            personalRating: userSave.personalRating || 0,
            color: userSave.color || TYPE_COLOR_MAP[location.type || ""] || "",
        });

        // Reset tags
        setTags(userSave.tags || []);

        // Reset photos to delete
        setPhotosToDelete([]);

        // Reset photos to original
        const originalPhotos = (location.photos || []).map((photo: any) => ({
            id: photo.id,
            imagekitFileId: photo.imagekitFileId,
            imagekitFilePath: photo.imagekitFilePath,
            originalFilename: photo.originalFilename,
            fileSize: photo.fileSize || 0,
            mimeType: photo.mimeType || 'image/jpeg',
            width: photo.width,
            height: photo.height,
            url: `${IMAGEKIT_URL_ENDPOINT}${photo.imagekitFilePath}`,
            isPrimary: photo.isPrimary,
            caption: photo.caption,
        }));
        setPhotos(originalPhotos);
    };

    const handleSubmit = async (data: EditLocationFormData) => {
        // Show warning if photos are marked for deletion
        if (photosToDelete.length > 0) {
            const message = `You are about to delete ${photosToDelete.length} ${photosToDelete.length === 1 ? 'photo' : 'photos'} on this update. This action cannot be undone.\n\nDo you want to continue?`;
            
            if (!window.confirm(message)) {
                return; // User cancelled
            }

            // Delete marked photos from the server
            for (const photoId of photosToDelete) {
                try {
                    const response = await fetch(`/api/photos/${photoId}`, {
                        method: 'DELETE',
                        credentials: 'include',
                    });

                    if (!response.ok) {
                        const errorData = await response.json().catch(() => ({}));
                        console.error('Failed to delete photo from server:', errorData);
                    }
                } catch (error) {
                    console.error('Error deleting photo:', error);
                }
            }

            // Clear the deletion queue after deleting
            setPhotosToDelete([]);
        }

        const finalColor = data.color || TYPE_COLOR_MAP[data.type || ""] || "";
        const finalIndoorOutdoor = data.indoorOutdoor || DEFAULT_INDOOR_OUTDOOR;

        // Filter out deleted photos from the photos array before submitting
        const remainingPhotos = photos.filter(photo => !photo.id || !photosToDelete.includes(photo.id));

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
            photos: remainingPhotos.length > 0 ? remainingPhotos : undefined,
        };

        onSubmit(submitData);
    };

    const handleAddTag = () => {
        const trimmedTag = tagInput.trim();
        
        // Validate tag: alphanumeric, spaces, hyphens only (max 25 chars)
        const tagRegex = /^[a-zA-Z0-9\s\-]+$/;
        
        if (!trimmedTag) {
            return;
        }
        
        if (tags.includes(trimmedTag)) {
            toast.error('This tag already exists');
            return;
        }
        
        if (tags.length >= 20) {
            toast.error('Maximum 20 tags allowed');
            return;
        }
        
        if (trimmedTag.length > 25) {
            toast.error('Tag must be 25 characters or less');
            return;
        }
        
        if (!tagRegex.test(trimmedTag)) {
            toast.error('Invalid characters in tag. Only letters, numbers, spaces, and hyphens are allowed. @ symbol is not allowed.');
            return;
        }
        
        setTags([...tags, trimmedTag]);
        setTagInput("");
    };

    const handleRemoveTag = (tagToRemove: string) => {
        setTags(tags.filter((tag) => tag !== tagToRemove));
    };

    const handleImproveProductionNotes = async () => {
        const currentNotes = form.getValues("productionNotes");
        if (!currentNotes || currentNotes.trim().length === 0) return;

        const improved = await improveDescription(currentNotes, "improve");
        if (improved) {
            form.setValue("productionNotes", improved, { shouldDirty: true });
        }
    };

    const handleSuggestTags = async () => {
        const currentNotes = form.getValues("productionNotes");
        if (!currentNotes || currentNotes.trim().length === 0) return;

        const tagsResult = await improveDescription(currentNotes, "tags");
        if (tagsResult) {
            // Parse comma-separated tags and clean them up
            const newTags = tagsResult
                .split(',')
                .map(tag => tag.trim())
                .filter(tag => tag.length > 0 && tag.length <= 25)
                .slice(0, 10); // Limit to 10 suggestions
            
            setSuggestedTags(newTags);
        }
    };

    const handleAddSuggestedTag = (tag: string) => {
        if (!tags.includes(tag) && tags.length < 20) {
            setTags([...tags, tag]);
        }
        // Remove from suggestions after adding
        setSuggestedTags(suggestedTags.filter(t => t !== tag));
    };

    const handleAddAllSuggestedTags = () => {
        const availableSlots = 20 - tags.length;
        const tagsToAdd = suggestedTags
            .filter(tag => !tags.includes(tag))
            .slice(0, availableSlots);
        
        if (tagsToAdd.length > 0) {
            setTags([...tags, ...tagsToAdd]);
            setSuggestedTags([]);
        }
    };

    const handleDismissSuggestedTags = () => {
        setSuggestedTags([]);
    };

    const handleRemovePhoto = (index: number) => {
        const photoToRemove = photos[index];

        // If photo has a database ID, toggle its deletion status
        if (photoToRemove.id) {
            setPhotosToDelete(prev => {
                if (prev.includes(photoToRemove.id)) {
                    // Already marked - unmark it
                    return prev.filter(id => id !== photoToRemove.id);
                } else {
                    // Not marked - mark it for deletion
                    return [...prev, photoToRemove.id];
                }
            });
        } else {
            // New photo not yet saved - just remove from local state
            const newPhotos = photos.filter((_, i) => i !== index);
            setPhotos(newPhotos);
        }
    };

    // Character count helper using watched value
    const productionNotesCount = watchedProductionNotes?.length || 0;

    return (
        <form
            id="edit-location-form"
            onSubmit={form.handleSubmit(handleSubmit, (errors) => {
                // Auto-focus the first error field (Location Name or Type)
                if (errors.name) {
                    form.setFocus("name");
                } else if (errors.type) {
                    form.setFocus("type");
                }
            })}
            className="space-y-4"
        >
            {/* Photo Upload Section - Moved to Top (toggleable) */}
            {showPhotoUpload && (
                <div className="pb-4 border-b">
                    <ImageKitUploader
                        onPhotosChange={setPhotos}
                        maxPhotos={20}
                        // maxFileSize uses default from FILE_SIZE_LIMITS.PHOTO (10 MB)
                        existingPhotos={photos}
                        showPhotoGrid={false}
                    />
                </div>
            )}

            {/* Photo Section */}
            <div className="space-y-4 pb-4 border-b">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold">Photos</h3>
                    {photosToDelete.length > 0 && (
                        <Badge variant="destructive" className="text-xs">
                            {photosToDelete.length} marked for deletion
                        </Badge>
                    )}
                </div>
                
                {/* Photo Carousel (if photos exist) */}
                {photos.length > 0 ? (
                    <PhotoCarouselManager
                        photos={photos}
                        onPhotosChange={setPhotos}
                        onRemovePhoto={handleRemovePhoto}
                        photosToDelete={photosToDelete}
                        maxPhotos={20}
                    />
                ) : (
                    /* Static Map Preview when no photos */
                    <StaticMapPreview location={location} />
                )}
            </div>

            {/* Location Fields */}
            <div className="space-y-3">
                <div className="space-y-2">
                    <div>
                        <Label htmlFor="name">Location Name *</Label>
                        <div className="relative">
                            <Input
                                id="name"
                                {...form.register("name")}
                                placeholder="e.g., Central Park"
                                className={`focus-visible:ring-green-500 focus-visible:ring-2 pr-8 ${
                                    form.formState.errors.name 
                                        ? "border-destructive ring-destructive ring-2" 
                                        : ""
                                }`}
                            />
                            {form.watch("name") && (
                                <button
                                    type="button"
                                    onClick={() => form.setValue("name", "")}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                    title="Clear"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                        {form.formState.errors.name && (
                            <p className="text-sm text-destructive mt-1">
                                {form.formState.errors.name.message}
                            </p>
                        )}
                    </div>

                    {/* Type and Rating - Side by Side (MOVED UP) */}
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
                                <SelectTrigger
                                    id="type"
                                    className={`focus:ring-green-500 focus:ring-2 w-full min-w-[140px] ${
                                        form.formState.errors.type 
                                            ? "border-destructive ring-destructive" 
                                            : ""
                                    }`}
                                >
                                    <SelectValue placeholder="Required Info" />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableTypes.map((type) => (
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

                        {/* Rating */}
                        <div className="space-y-2">
                            <Label htmlFor="personalRating">Rating</Label>
                            <Select
                                onValueChange={(value) =>
                                    form.setValue("personalRating", parseInt(value))
                                }
                                defaultValue={form.getValues("personalRating")?.toString()}
                            >
                                <SelectTrigger className="w-full min-w-[110px]">
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
                </div>
            </div>

            {/* Production Details */}
            <div className="space-y-3">
                <div className="space-y-2">
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
                            rows={2}
                            maxLength={500}
                            className={form.formState.errors.productionNotes ? "border-destructive ring-destructive ring-2" : ""}
                        />
                        {form.formState.errors.productionNotes && (
                            <p className="text-sm text-destructive mt-1">
                                {form.formState.errors.productionNotes.message}
                            </p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={handleImproveProductionNotes}
                                disabled={isAiLoading || !watchedProductionNotes || watchedProductionNotes.trim().length === 0}
                                className="text-xs gap-1.5"
                            >
                                <Sparkles className="w-3.5 h-3.5" />
                                {isAiLoading ? "Improving..." : "Improve with AI"}
                            </Button>
                            {aiError && (
                                <span className="text-xs text-red-500">{aiError}</span>
                            )}
                        </div>
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <Label htmlFor="tags">Tags</Label>
                            <span className="text-xs text-muted-foreground">
                                {tags.length}/20 • each tag 25 chars max
                            </span>
                        </div>
                        <div className="relative">
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
                                className="pr-10"
                            />
                            <Button
                                type="button"
                                onClick={handleAddTag}
                                variant="ghost"
                                size="icon"
                                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                            >
                                <Tag className="w-4 h-4" />
                            </Button>
                        </div>
                        
                        {/* AI Suggest Tags Button */}
                        <div className="mt-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={handleSuggestTags}
                                disabled={isAiLoading || !watchedProductionNotes || watchedProductionNotes.trim().length === 0 || suggestedTags.length > 0}
                                className="text-xs gap-1.5"
                            >
                                <Sparkles className="w-3.5 h-3.5" />
                                {isAiLoading ? "Generating..." : "Suggest Tags from Notes"}
                            </Button>
                        </div>

                        {/* Suggested Tags */}
                        {suggestedTags.length > 0 && (
                            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg space-y-2">
                                <div className="flex items-center justify-between">
                                    <p className="text-xs font-semibold text-blue-900">AI Suggested Tags:</p>
                                    <div className="flex gap-1">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={handleAddAllSuggestedTags}
                                            className="text-xs h-6 px-2 text-blue-700 hover:text-blue-900"
                                        >
                                            Add All
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={handleDismissSuggestedTags}
                                            className="text-xs h-6 px-2 text-gray-500 hover:text-gray-700"
                                        >
                                            Dismiss
                                        </Button>
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {suggestedTags.map((tag) => (
                                        <Badge
                                            key={tag}
                                            variant="outline"
                                            className="gap-1 cursor-pointer hover:bg-blue-100 border-blue-300 text-blue-800"
                                            onClick={() => handleAddSuggestedTag(tag)}
                                        >
                                            + {tag}
                                        </Badge>
                                    ))}
                                </div>
                                <p className="text-xs text-blue-700 italic">Click a tag to add it to your location</p>
                            </div>
                        )}

                        {/* Current Tags */}
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

                    <div>
                        <Label htmlFor="parking">Parking</Label>
                        <Input
                            id="parking"
                            {...form.register("parking")}
                            placeholder="Parking info"
                            className={form.formState.errors.parking ? "border-destructive ring-destructive ring-2" : ""}
                        />
                        {form.formState.errors.parking && (
                            <p className="text-sm text-destructive mt-1">
                                {form.formState.errors.parking.message}
                            </p>
                        )}
                    </div>

                    <div>
                        <Label htmlFor="entryPoint">Entry Point</Label>
                        <Input
                            id="entryPoint"
                            {...form.register("entryPoint")}
                            placeholder="Main entrance"
                            className={form.formState.errors.entryPoint ? "border-destructive ring-destructive ring-2" : ""}
                        />
                        {form.formState.errors.entryPoint && (
                            <p className="text-sm text-destructive mt-1">
                                {form.formState.errors.entryPoint.message}
                            </p>
                        )}
                    </div>

                    <div>
                        <Label htmlFor="access">Access</Label>
                        <Input
                            id="access"
                            {...form.register("access")}
                            placeholder="How to access"
                            className={form.formState.errors.access ? "border-destructive ring-destructive ring-2" : ""}
                        />
                        {form.formState.errors.access && (
                            <p className="text-sm text-destructive mt-1">
                                {form.formState.errors.access.message}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Unsaved Changes Banner */}
            {hasChanges && (
                <div className="sticky bottom-0 mt-6 bg-amber-50 dark:bg-amber-950/20 border-t-2 border-amber-500 p-3 sm:p-4 shadow-lg z-10 animate-in slide-in-from-bottom">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                                <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600 dark:text-amber-500 flex-shrink-0" />
                                <p className="font-semibold text-sm sm:text-base text-amber-900 dark:text-amber-100">
                                    Unsaved changes
                                </p>
                            </div>
                            <ul className="text-xs sm:text-sm text-amber-800 dark:text-amber-200 space-y-1 ml-6 sm:ml-0">
                                {changes.slice(0, 3).map((change, i) => (
                                    <li key={i} className="truncate">• {change}</li>
                                ))}
                                {changes.length > 3 && (
                                    <li className="text-amber-700 dark:text-amber-300">
                                        +{changes.length - 3} more...
                                    </li>
                                )}
                            </ul>
                        </div>
                        <div className="flex gap-2 sm:gap-2 sm:flex-shrink-0">
                            <Button
                                variant="outline"
                                size="sm"
                                type="button"
                                onClick={handleDiscard}
                                className="flex-1 sm:flex-initial border-amber-300 dark:border-amber-700 text-xs sm:text-sm h-9"
                            >
                                Discard
                            </Button>
                            <Button
                                size="sm"
                                type="submit"
                                className="flex-1 sm:flex-initial bg-green-600 hover:bg-green-700 text-white text-xs sm:text-sm h-9"
                            >
                                Save Changes
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </form>
    );
}

// Static Map Preview Component
function StaticMapPreview({ location }: { location: Location }) {
    const [mapError, setMapError] = useState(false);
    const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
    
    const mapImageUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${location.lat},${location.lng}&zoom=15&size=600x300&markers=color:red%7C${location.lat},${location.lng}&key=${GOOGLE_MAPS_API_KEY}`;

    return (
        <div className="relative w-full h-48 rounded-lg overflow-hidden bg-muted">
            {!mapError && GOOGLE_MAPS_API_KEY ? (
                <Image
                    src={mapImageUrl}
                    alt={`Map of ${location.name}`}
                    fill
                    className="object-cover"
                    onError={() => setMapError(true)}
                    unoptimized
                />
            ) : (
                /* Placeholder when map fails to load */
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-950/20 dark:to-blue-900/10 border-2 border-dashed border-blue-300 dark:border-blue-700">
                    <Map className="w-12 h-12 text-blue-400 dark:text-blue-600" />
                    <div className="text-center px-4">
                        <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                            {location.name}
                        </p>
                        <p className="text-xs text-blue-500 dark:text-blue-500 mt-1">
                            {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
