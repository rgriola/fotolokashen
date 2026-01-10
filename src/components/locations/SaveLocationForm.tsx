"use client";

import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { MapPin, Tag, X } from "lucide-react";
import { toast } from "sonner";
import { ImageKitUploader } from "@/components/ui/ImageKitUploader";
import { TYPE_COLOR_MAP, getAvailableTypes } from "@/lib/location-constants";
import { indoorOutdoorSchema, DEFAULT_INDOOR_OUTDOOR, INDOOR_OUTDOOR_OPTIONS } from "@/lib/form-constants";
import { useAuth } from "@/lib/auth-context";
import type { CachedPhoto, UploadedPhotoData } from "@/types/photo-cache";

// Security: Regex to prevent XSS and SQL injection in text fields
const safeTextRegex = /^[a-zA-Z0-9\s\-.,!?&'"()]+$/;
const safeLongTextRegex = /^[a-zA-Z0-9\s\-.,!?&'"()\n\r]+$/; // Allows newlines

const saveLocationSchema = z.object({
    placeId: z.string().min(1, "Place ID is required").max(255),
    name: z.string()
        .min(1, "Location name is required")
        .max(200, "Name must be 200 characters or less")
        .regex(safeTextRegex, "Name contains invalid characters"),
    address: z.string().max(500).optional(),
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
    type: z.string().min(1, "Type is required"),
    indoorOutdoor: indoorOutdoorSchema,

    // Address components (read-only from Google, but validate anyway)
    street: z.string().max(200).optional(),
    number: z.string().max(50).optional(),
    city: z.string().max(100).optional(),
    state: z.string().max(100).optional(),
    zipcode: z.string().max(20).optional(),

    // Production details - User editable, needs strict validation
    productionNotes: z.string().optional()
        .refine((val) => !val || val.length <= 500, "Production notes must be 500 characters or less")
        .refine((val) => !val || safeLongTextRegex.test(val), "Production notes contain invalid characters"),
    entryPoint: z.string().optional()
        .refine((val) => !val || val.length <= 200, "Entry point must be 200 characters or less")
        .refine((val) => !val || safeTextRegex.test(val), "Entry point contains invalid characters"),
    parking: z.string().optional()
        .refine((val) => !val || val.length <= 200, "Parking info must be 200 characters or less")
        .refine((val) => !val || safeTextRegex.test(val), "Parking info contains invalid characters"),
    access: z.string().optional()
        .refine((val) => !val || val.length <= 200, "Access info must be 200 characters or less")
        .refine((val) => !val || safeTextRegex.test(val), "Access info contains invalid characters"),

    // User save details - Personal notes, needs validation
    isFavorite: z.boolean().optional(),
    personalRating: z.number().min(0).max(5).optional(),
    color: z.string().max(20).optional(),
});

type SaveLocationFormData = z.infer<typeof saveLocationSchema>;

interface SaveLocationFormProps {
    initialData?: Partial<SaveLocationFormData>;
    onSubmit: (data: any) => void;
    isPending?: boolean;
    showPhotoUpload?: boolean; // Toggle photo upload section visibility
    onUploadingStateChange?: (isUploading: boolean) => void; // Notify parent when uploading photos
}

export function SaveLocationForm({
    initialData,
    onSubmit,
    isPending = false,
    showPhotoUpload = false,
    onUploadingStateChange,
}: SaveLocationFormProps) {
    const { user } = useAuth();
    const isAdmin = user?.isAdmin === true;
    const availableTypes = getAvailableTypes(isAdmin);
    
    const [tags, setTags] = useState<string[]>([]);
    const [tagInput, setTagInput] = useState("");
    const [cachedPhotos, setCachedPhotos] = useState<CachedPhoto[]>([]);
    const [isUploadingPhotos, setIsUploadingPhotos] = useState(false);
    
    // Ref to store upload function from ImageKitUploader
    const uploadPhotosRef = useRef<(() => Promise<UploadedPhotoData[]>) | null>(null);
    
    // Debug: Log when cached photos change
    useEffect(() => {
        console.log('[SaveLocationForm] Cached photos changed:', cachedPhotos.length, cachedPhotos);
    }, [cachedPhotos]);

    const form = useForm<SaveLocationFormData>({
        resolver: zodResolver(saveLocationSchema),
        defaultValues: {
            placeId: initialData?.placeId || "",
            name: initialData?.name || "",
            address: initialData?.address || "",
            lat: initialData?.lat || 0,
            lng: initialData?.lng || 0,
            type: initialData?.type || "",
            indoorOutdoor: initialData?.indoorOutdoor || DEFAULT_INDOOR_OUTDOOR,
            street: initialData?.street || "",
            number: initialData?.number || "",
            city: initialData?.city || "",
            state: initialData?.state || "",
            zipcode: initialData?.zipcode || "",
            isFavorite: initialData?.isFavorite || false,
            personalRating: initialData?.personalRating || 0,
            color: initialData?.color || "",
            ...initialData,
        },
    });

    // Update form when initialData changes
    useEffect(() => {
        if (initialData) {
            form.reset({
                placeId: initialData.placeId || "",
                name: initialData.name || "",
                address: initialData.address || "",
                lat: initialData.lat || 0,
                lng: initialData.lng || 0,
                type: initialData.type || "",
                indoorOutdoor: initialData.indoorOutdoor || DEFAULT_INDOOR_OUTDOOR,
                street: initialData.street || "",
                number: initialData.number || "",
                city: initialData.city || "",
                state: initialData.state || "",
                zipcode: initialData.zipcode || "",
                isFavorite: initialData.isFavorite || false,
                personalRating: initialData.personalRating || 0,
                color: initialData.color || "",
                ...initialData,
            });
        }
    }, [initialData, form]);

    // Auto-focus the Location Name field when form opens
    useEffect(() => {
        // Small delay to allow the sidebar to finish opening animation
        const timer = setTimeout(() => {
            form.setFocus("name");
        }, 100);

        return () => clearTimeout(timer);
    }, [form]);
    
    // Cleanup cached photos on unmount (if user closes form without saving)
    useEffect(() => {
        return () => {
            // Cleanup will be handled by ImageKitUploader itself
            console.log('[SaveLocationForm] Unmounting, ImageKitUploader will handle cleanup');
        };
    }, []);

    const handleSubmit = async (data: SaveLocationFormData) => {
        // Ensure color is assigned based on type
        const finalColor = data.color || TYPE_COLOR_MAP[data.type || ""] || "";
        const finalIndoorOutdoor = data.indoorOutdoor || DEFAULT_INDOOR_OUTDOOR;

        let uploadedPhotos: UploadedPhotoData[] | undefined;

        // If photos are enabled and user has cached photos, upload them first
        if (showPhotoUpload && cachedPhotos.length > 0 && uploadPhotosRef.current) {
            console.log('[SaveLocationForm] Starting photo upload for', cachedPhotos.length, 'photos');
            try {
                setIsUploadingPhotos(true);
                onUploadingStateChange?.(true);
                toast.info(`Uploading ${cachedPhotos.length} photo(s)...`);
                
                // Upload all cached photos to ImageKit using the function from ImageKitUploader
                uploadedPhotos = await uploadPhotosRef.current();
                
                console.log('[SaveLocationForm] Photos uploaded successfully:', uploadedPhotos);
                toast.success(`${uploadedPhotos.length} photo(s) uploaded successfully!`);
            } catch (error) {
                const message = error instanceof Error ? error.message : 'Failed to upload photos';
                toast.error(message);
                setIsUploadingPhotos(false);
                onUploadingStateChange?.(false);
                return; // Don't proceed with location save if photo upload fails
            } finally {
                setIsUploadingPhotos(false);
                onUploadingStateChange?.(false);
            }
        }

        const submitData = {
            ...data,
            color: finalColor,
            indoorOutdoor: finalIndoorOutdoor,
            tags: tags.length > 0 ? tags : undefined,
            photos: uploadedPhotos && uploadedPhotos.length > 0 ? uploadedPhotos : undefined,
        };
        
        console.log('[SaveLocationForm] Submitting with photos:', uploadedPhotos?.length || 0);

        try {
            await onSubmit(submitData);
            
            // Clear photo cache on successful save (ImageKitUploader will handle this)
            setCachedPhotos([]);
        } catch (error) {
            // Error handling is done by parent, but we keep photos cached
            console.error('Save location error:', error);
        }
    };

    const handleAddTag = () => {
        const trimmedTag = tagInput.trim();

        // Validate tag: alphanumeric, spaces, hyphens only (max 25 chars)
        const tagRegex = /^[a-zA-Z0-9\s\-]+$/;

        if (trimmedTag &&
            !tags.includes(trimmedTag) &&
            tags.length < 20 &&
            trimmedTag.length <= 25 &&
            tagRegex.test(trimmedTag)) {
            setTags([...tags, trimmedTag]);
            setTagInput("");
        } else if (trimmedTag && !tagRegex.test(trimmedTag)) {
            // Optionally show error for invalid characters
            console.warn('Tag contains invalid characters');
        }
    };

    const handleRemoveTag = (tagToRemove: string) => {
        setTags(tags.filter((tag) => tag !== tagToRemove));
    };

    // Character count helpers
    const productionNotesCount = form.watch("productionNotes")?.length || 0;

    return (
        <form
            id="save-location-form"
            onSubmit={form.handleSubmit(handleSubmit, (errors) => {
                // Auto-focus and scroll to the first error field
                if (errors.name) {
                    form.setFocus("name");
                    document.getElementById("name")?.scrollIntoView({ 
                        behavior: "smooth", 
                        block: "center" 
                    });
                } else if (errors.type) {
                    // Type is a Select component, scroll to it
                    const typeElement = document.getElementById("type");
                    if (typeElement) {
                        typeElement.scrollIntoView({ 
                            behavior: "smooth", 
                            block: "center" 
                        });
                        // Try to focus the Select trigger button
                        typeElement.focus();
                    }
                }
            })}
            className="space-y-6"
        >
            {/* Photo Upload - Deferred mode (uploads on save) */}
            {showPhotoUpload && (
                <div className="space-y-4 pb-4 border-b">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold">Photos (Encouraged)</h3>
                        {cachedPhotos.length > 0 && (
                            <p className="text-xs text-muted-foreground">
                                {cachedPhotos.length} photo(s) ready • Will upload when you save
                            </p>
                        )}
                    </div>
                    <ImageKitUploader
                        uploadMode="deferred"
                        onCachedPhotosChange={setCachedPhotos}
                        onUploadReady={(uploadFn) => {
                            uploadPhotosRef.current = uploadFn;
                        }}
                        maxPhotos={20}
                        // maxFileSize uses default from FILE_SIZE_LIMITS.PHOTO (10 MB)
                    />
                </div>
            )}

            {/* Location Fields */}
            <div className="space-y-4">
                <div className="space-y-3">
                    <div>
                        <Label htmlFor="name">Location Name *</Label>
                        <div className="relative">
                            <Input
                                id="name"
                                {...form.register("name")}
                                placeholder="e.g., Central Park"
                                className="focus-visible:ring-green-500 focus-visible:ring-2 pr-8"
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
                                {form.watch("lat")?.toFixed(6) || "0.000000"}
                            </p>
                        </div>
                        <div>
                            <Label className="text-xs text-muted-foreground">Longitude</Label>
                            <p className="text-sm font-mono font-medium">
                                {form.watch("lng")?.toFixed(6) || "0.000000"}
                            </p>
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
                        <Label htmlFor="access">Access</Label>
                        <Input
                            id="access"
                            {...form.register("access")}
                            placeholder="How to access"
                        />
                    </div>
                </div>
            </div>

        </form>
    );
}
