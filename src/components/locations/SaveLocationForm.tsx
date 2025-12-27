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
import { MapPin, Tag, X } from "lucide-react";
import { ImageKitUploader } from "@/components/ui/ImageKitUploader";
import { TYPE_COLOR_MAP, LOCATION_TYPES } from "@/lib/location-constants";
import { indoorOutdoorSchema, DEFAULT_INDOOR_OUTDOOR, INDOOR_OUTDOOR_OPTIONS } from "@/lib/form-constants";

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
    productionNotes: z.string()
        .max(500, "Production notes must be 500 characters or less")
        .regex(safeLongTextRegex, "Production notes contain invalid characters")
        .or(z.literal("")) // Allow empty string
        .optional(),
    entryPoint: z.string()
        .max(200, "Entry point must be 200 characters or less")
        .regex(safeTextRegex, "Entry point contains invalid characters")
        .or(z.literal("")) // Allow empty string
        .optional(),
    parking: z.string()
        .max(200, "Parking info must be 200 characters or less")
        .regex(safeTextRegex, "Parking info contains invalid characters")
        .or(z.literal("")) // Allow empty string
        .optional(),
    access: z.string()
        .max(200, "Access info must be 200 characters or less")
        .regex(safeTextRegex, "Access info contains invalid characters")
        .or(z.literal("")) // Allow empty string
        .optional(),

    // User save details - Personal notes, needs validation
    caption: z.string()
        .max(200, "Caption must be 200 characters or less")
        .regex(safeLongTextRegex, "Caption contains invalid characters")
        .or(z.literal("")) // Allow empty string
        .optional(),
    isFavorite: z.boolean().optional(),
    personalRating: z.number().min(0).max(5).optional(),
    color: z.string().max(20).optional(),
});

type SaveLocationFormData = z.infer<typeof saveLocationSchema>;

interface SaveLocationFormProps {
    initialData?: Partial<SaveLocationFormData>;
    onSubmit: (data: any) => void;
    isPending?: boolean;
    hidePhotoUpload?: boolean; // ✅ Hide photo upload section (for GPS photo flow)
}

export function SaveLocationForm({
    initialData,
    onSubmit,
    isPending = false,
    hidePhotoUpload = false,
}: SaveLocationFormProps) {
    const [tags, setTags] = useState<string[]>([]);
    const [tagInput, setTagInput] = useState("");
    const [photos, setPhotos] = useState<any[]>([]);

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

    const handleSubmit = (data: SaveLocationFormData) => {
        // Ensure color is assigned based on type
        const finalColor = data.color || TYPE_COLOR_MAP[data.type || ""] || "";
        const finalIndoorOutdoor = data.indoorOutdoor || DEFAULT_INDOOR_OUTDOOR;

        const submitData = {
            ...data,
            color: finalColor,
            indoorOutdoor: finalIndoorOutdoor,
            tags: tags.length > 0 ? tags : undefined,
            // Only include photos if photo upload is not hidden (GPS flow handles photos separately)
            photos: !hidePhotoUpload && photos.length > 0 ? photos : undefined,
        };

        onSubmit(submitData);
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
    const captionCount = form.watch("caption")?.length || 0;
    const productionNotesCount = form.watch("productionNotes")?.length || 0;

    return (
        <form id="save-location-form" onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
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
                                onValueChange={(value) => form.setValue("indoorOutdoor", value as typeof INDOOR_OUTDOOR_OPTIONS[number])}
                                defaultValue={form.getValues("indoorOutdoor") || DEFAULT_INDOOR_OUTDOOR}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select" />
                                </SelectTrigger>
                                <SelectContent>
                                    {INDOOR_OUTDOOR_OPTIONS.map((option) => (
                                        <SelectItem key={option} value={option}>
                                            {option.charAt(0).toUpperCase() + option.slice(1)}
                                        </SelectItem>
                                    ))}
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

            {/* Photo Upload - Hidden for GPS photo flow */}
            {!hidePhotoUpload && (
                <div className="space-y-4">
                    <h3 className="text-sm font-semibold">Photos (Optional)</h3>
                    <ImageKitUploader
                        placeId={form.watch("placeId")}
                        onPhotosChange={setPhotos}
                        maxPhotos={20}
                        maxFileSize={1.5}
                    />
                </div>
            )}
        </form>
    );
}
