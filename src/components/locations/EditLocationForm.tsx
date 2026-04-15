"use client";

import { useState, useEffect, useRef } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, X, Map, Sparkles, Camera, Navigation, AlertTriangle } from "lucide-react";
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogFooter,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogAction,
    AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { ImageKitUploader } from "@/components/ui/ImageKitUploader";
import { PhotoCarouselManager } from "@/components/ui/PhotoCarouselManager";
import { TagInput } from "@/components/locations/TagInput";
import { UnsavedChangesBanner } from "@/components/locations/UnsavedChangesBanner";
import { TYPE_COLOR_MAP, getAvailableTypes } from "@/lib/location-constants";
import { indoorOutdoorSchema, DEFAULT_INDOOR_OUTDOOR } from "@/lib/form-constants";
import { Location, UserSave } from "@/types/location";
import { IMAGEKIT_URL_ENDPOINT } from "@/lib/imagekit";
import { useAuth } from "@/lib/auth-context";
import { useImproveDescription } from "@/hooks/useImproveDescription";
import Image from "next/image";
import { toast } from "sonner";
import { TOAST } from "@/lib/constants/messages";
import { sanitizeUserInput } from "@/lib/sanitize";

const editLocationSchema = z.object({
    id: z.number(),
    name: z.string()
        .min(1, "Location name is required")
        .max(50, "Name must be 50 characters or less")
        .transform(sanitizeUserInput),
    address: z.string().optional(),
    type: z.string().min(1, "Type is required"),
    indoorOutdoor: indoorOutdoorSchema,

    // Production details
    productionDate: z.string().optional(),
    productionNotes: z.string()
        .max(500, "Production notes must be 500 characters or less")
        .transform(sanitizeUserInput)
        .optional(),
    entryPoint: z.string()
        .max(200, "Entry point must be 200 characters or less")
        .transform(sanitizeUserInput)
        .optional(),
    parking: z.string()
        .max(200, "Parking info must be 200 characters or less")
        .transform(sanitizeUserInput)
        .optional(),
    access: z.string()
        .max(200, "Access info must be 200 characters or less")
        .transform(sanitizeUserInput)
        .optional(),

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
    onPhotoUploadToggle?: () => void;
}

export function EditLocationForm({
    locationId,
    location,
    userSave,
    onSubmit,
    showPhotoUpload = false,
    onPhotoUploadToggle,
}: EditLocationFormProps) {
    const { user } = useAuth();
    // Check if user has admin or staffer role for extended location types
    const isAdmin = user?.isAdmin === true || user?.role === 'staffer' || user?.role === 'super_admin';
    const availableTypes = getAvailableTypes(isAdmin);
    
    const [tags, setTags] = useState<string[]>(userSave.tags || []);
    const [photos, setPhotos] = useState<any[]>([]);
    const [photosToDelete, setPhotosToDelete] = useState<number[]>([]);
    const [hasChanges, setHasChanges] = useState(false);
    const [changes, setChanges] = useState<string[]>([]);
    const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
    
    // Deferred photo upload state (new photos staged but not yet uploaded)
    const [cachedPhotos, setCachedPhotos] = useState<any[]>([]);
    const [isUploadingPhotos, setIsUploadingPhotos] = useState(false);
    const uploadPhotosRef = useRef<(() => Promise<any[]>) | null>(null);
    
    // Photo delete confirmation dialog state
    const [showPhotoDeleteDialog, setShowPhotoDeleteDialog] = useState(false);
    const pendingSubmitRef = useRef<{ data: EditLocationFormData; uploadedPhotos: any[] } | null>(null);
    
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
            productionDate: location.productionDate 
                ? (() => {
                    const d = new Date(location.productionDate);
                    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
                })()
                : "",
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
    const watchedProductionDate = useWatch({ control: form.control, name: "productionDate" });
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
            productionDate: location.productionDate 
                ? (() => {
                    const d = new Date(location.productionDate);
                    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
                })()
                : "",
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
        }        if (dirtyFields.productionDate) {
            changedFields.push('Production date updated');
        }        if (dirtyFields.productionDate) {
            changedFields.push('Production date updated');
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
            changedFields.push(`${photosToDelete.length} photo(s) pending deletion`);
        }

        // Check if photo captions or primary status changed
        const originalPhotos = (location.photos || []).map((photo: any) => ({
            id: photo.id,
            caption: photo.caption,
            isPrimary: photo.isPrimary
        }));
        const currentPhotos = photos.map(photo => ({
            id: photo.id,
            caption: photo.caption,
            isPrimary: photo.isPrimary
        }));
        
        const photosChanged = JSON.stringify(originalPhotos) !== JSON.stringify(currentPhotos);
        if (photosChanged) {
            changedFields.push('Photo details updated');
        }
        
        // Check for new cached photos (not yet uploaded)
        if (cachedPhotos.length > 0) {
            changedFields.push(`${cachedPhotos.length} new photo(s) ready to upload`);
        }

        setChanges(changedFields);
        setHasChanges(changedFields.length > 0);
    }, [
        isDirty,
        dirtyFields,
        watchedName,
        watchedType,
        watchedCaption,
        watchedProductionDate,
        watchedProductionNotes,
        watchedPersonalRating,
        watchedParking,
        watchedEntryPoint,
        watchedAccess,
        watchedIndoorOutdoor,
        JSON.stringify(tags),
        JSON.stringify(userSave.tags || []),
        photosToDelete.length,
        cachedPhotos.length,
        JSON.stringify(photos.map(p => ({ id: p.id, caption: p.caption, isPrimary: p.isPrimary })))
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
        
        // Clear cached photos (new uploads)
        setCachedPhotos([]);

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
        let uploadedPhotos: any[] = [];

        // If there are cached photos (new uploads), upload them first
        if (cachedPhotos.length > 0 && uploadPhotosRef.current) {
            console.log('[EditLocationForm] Starting photo upload for', cachedPhotos.length, 'photos');
            try {
                setIsUploadingPhotos(true);
                toast.info(TOAST.PHOTO.UPLOADING(cachedPhotos.length));
                
                // Upload all cached photos to ImageKit using the function from ImageKitUploader
                uploadedPhotos = await uploadPhotosRef.current();
                
                console.log('[EditLocationForm] Photos uploaded successfully:', uploadedPhotos);
                toast.success(TOAST.PHOTO.UPLOAD_SUCCESS(uploadedPhotos.length));
            } catch (error) {
                const message = error instanceof Error ? error.message : TOAST.PHOTO.UPLOAD_FAILED;
                toast.error(message);
                setIsUploadingPhotos(false);
                return; // Don't proceed with location save if photo upload fails
            } finally {
                setIsUploadingPhotos(false);
            }
        }

        // Show warning if photos are marked for deletion
        if (photosToDelete.length > 0) {
            // Save state and show confirmation dialog
            pendingSubmitRef.current = { data, uploadedPhotos };
            setShowPhotoDeleteDialog(true);
            return;
        }

        // No photos to delete — proceed directly
        await finalizeSubmit(data, uploadedPhotos);
    };

    const finalizeSubmit = async (data: EditLocationFormData, uploadedPhotos: any[]) => {
        // Delete marked photos from the server
        if (photosToDelete.length > 0) {
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

        // Combine existing photos with newly uploaded photos
        const allPhotos = [...photos, ...uploadedPhotos];
        
        // Filter out deleted photos from the combined array
        const remainingPhotos = allPhotos.filter(photo => !photo.id || !photosToDelete.includes(photo.id));

        const submitData = {
            id: data.id,
            name: data.name,
            type: data.type,
            indoorOutdoor: finalIndoorOutdoor,
            productionDate: data.productionDate || undefined,
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

        try {
            await onSubmit(submitData);
            
            // Clear photo cache on successful save
            setCachedPhotos([]);
        } catch (error) {
            // Error handling is done by parent, but we keep photos cached
            console.error('Edit location error:', error);
        }
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

    const handleDismissSuggestedTags = () => {
        setSuggestedTags([]);
    };

    const handleRemovePhoto = (index: number) => {
        // Determine if this photo is from existing photos or cached photos
        const allPhotos = [...photos, ...cachedPhotos];
        const photoToRemove = allPhotos[index];

        if (index < photos.length) {
            // This is an existing photo (from database)
            if (photoToRemove.id) {
                // Toggle its deletion status
                setPhotosToDelete(prev => {
                    if (prev.includes(photoToRemove.id)) {
                        // Already marked - unmark it
                        return prev.filter(id => id !== photoToRemove.id);
                    } else {
                        // Not marked - mark it for deletion
                        return [...prev, photoToRemove.id];
                    }
                });
            }
        } else {
            // This is a cached photo (not yet uploaded) - remove it from cache
            const cachedIndex = index - photos.length;
            const newCachedPhotos = cachedPhotos.filter((_, i) => i !== cachedIndex);
            setCachedPhotos(newCachedPhotos);
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
            {/* Photo Section */}
            <div className="space-y-4 pb-2">
                {/* Photo Upload Toggle Button */}
                {onPhotoUploadToggle && (
                    <Button
                        type="button"
                        size="sm"
                        onClick={onPhotoUploadToggle}
                        className="bg-success hover:bg-success/90 text-white flex items-center gap-2"
                    >
                        <Camera className="w-3.5 h-3.5" />
                        {showPhotoUpload ? 'Photo Upload' : 'Add Photos'}
                    </Button>
                )}

                {/* Photo Upload Section - Reveals beneath button when toggled */}
                {showPhotoUpload && (
                    <div className="space-y-2">
                        {cachedPhotos.length > 0 && (
                            <p className="text-xs text-muted-foreground">
                                {cachedPhotos.length} photo(s) ready • Will upload when you save
                            </p>
                        )}
                        <ImageKitUploader
                            uploadMode="deferred"
                            onCachedPhotosChange={setCachedPhotos}
                            onUploadReady={(uploadFn) => {
                                uploadPhotosRef.current = uploadFn;
                            }}
                            maxPhotos={20}
                            // maxFileSize uses default from FILE_SIZE_LIMITS.PHOTO (10 MB)
                            showPhotoGrid={false}
                        />
                    </div>
                )}
                
                {/* Photo Carousel (if photos exist) */}
                {(photos.length > 0 || cachedPhotos.length > 0) ? (
                    <PhotoCarouselManager
                        photos={[
                            ...photos,
                            ...cachedPhotos.map(cached => ({
                                ...cached,
                                url: cached.url || cached.preview, // Use preview URL for cached photos
                            }))
                        ]}
                        onPhotosChange={() => {}} // Not used in edit mode
                        onRemovePhoto={handleRemovePhoto}
                        photosToDelete={photosToDelete}
                        maxPhotos={20}
                        locationName={location.name}
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
                        <Label htmlFor="name" className="pb-2">Location Name *</Label>
                        <div className="relative">
                            <Input
                                id="name"
                                {...form.register("name")}
                                placeholder="e.g., Central Park"
                                className={`focus-visible:ring-success focus-visible:ring-2 pr-8 ${
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
                                    className={`focus:ring-success focus:ring-2 w-full min-w-35 ${
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

                        {/* Production Date */}
                        <div className="space-y-2">
                            <Label htmlFor="productionDate">Production Date</Label>
                            <Input
                                id="productionDate"
                                type="date"
                                {...form.register("productionDate")}
                                className="w-full"
                            />
                            <p className="text-xs text-muted-foreground">
                                Date this location was/will be used for filming
                            </p>
                        </div>
                    </div>

                    {/* Address and GPS Coordinates Combined */}
                    <div className="space-y-2">
                        <Label htmlFor="address" className="text-sm text-muted-foreground">Address</Label>
                        <div className="p-3 rounded-lg border bg-muted/30">
                            <div className="flex items-start gap-2">
                                <MapPin className="w-4 h-4 mt-0.5 text-primary shrink-0" />
                                <div className="flex-1 space-y-2">
                                    <p className="font-medium group-hover:text-primary transition-colors">
                                        {location.address || "Address not available"}
                                    </p>
                                    
                                    {location.lat != null && location.lng != null && (
                                        <div className="flex items-center gap-2">
                                            <Navigation className="w-3 h-3 text-muted-foreground" />
                                            <code className="text-xs font-mono text-muted-foreground">
                                                {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                                            </code>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Production Details */}
            <div className="space-y-3">
                <div className="space-y-2">
                    <div>
                        <div className="flex justify-between items-center">
                            <Label htmlFor="productionNotes" className="pb-2">Production Notes</Label>
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
                                {isAiLoading ? "Improving..." : "AI Rewrite"}
                            </Button>
                            {aiError && (
                                <span className="text-xs text-destructive">{aiError}</span>
                            )}
                        </div>
                    </div>

                    <TagInput
                        tags={tags}
                        onTagsChange={setTags}
                        ai={{
                            suggestedTags,
                            onSuggestTags: handleSuggestTags,
                            onDismissSuggested: handleDismissSuggestedTags,
                            isLoading: isAiLoading,
                            disabled: !watchedProductionNotes || watchedProductionNotes.trim().length === 0,
                        }}
                    />

                    <div>
                        <Label htmlFor="parking" className="pb-2">Parking</Label>
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
                        <Label htmlFor="entryPoint" className="pb-2">Entry Point</Label>
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
                        <Label htmlFor="access" className="pb-2">Access</Label>
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
            <UnsavedChangesBanner
                changes={hasChanges ? changes : []}
                onDiscard={handleDiscard}
            />

            {/* Photo Delete Confirmation Dialog */}
            <AlertDialog open={showPhotoDeleteDialog} onOpenChange={setShowPhotoDeleteDialog}>
                <AlertDialogContent className="border-destructive">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                            <AlertTriangle className="w-5 h-5" />
                            Delete Photos
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-foreground">
                            <span className="font-semibold">{photosToDelete.length} {photosToDelete.length === 1 ? 'photo' : 'photos'}</span> will be permanently deleted from <span className="font-semibold">&ldquo;{location.name}&rdquo;</span>. This cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => { pendingSubmitRef.current = null; }}>
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive text-white hover:bg-destructive/90"
                            onClick={async () => {
                                const pending = pendingSubmitRef.current;
                                pendingSubmitRef.current = null;
                                if (pending) {
                                    await finalizeSubmit(pending.data, pending.uploadedPhotos);
                                }
                            }}
                        >
                            Delete Permanently
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
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
                    className="object-contain"
                    onError={() => setMapError(true)}
                    unoptimized
                />
            ) : (
                /* Placeholder when map fails to load */
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-linear-to-br from-primary/20 to-primary/10 dark:from-primary/10 dark:to-primary/10 border-2 border-dashed border-primary/30 dark:border-primary">
                    <Map className="w-12 h-12 text-primary dark:text-primary" />
                    <div className="text-center px-4">
                        <p className="text-sm font-medium text-primary dark:text-primary">
                            {location.name}
                        </p>
                        <p className="text-xs text-primary dark:text-primary mt-1">
                            {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
