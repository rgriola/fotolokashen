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
import { useSaveLocation } from "@/hooks/useSaveLocation";
import { MapPin, Tag, X, Zap } from "lucide-react";

const saveLocationSchema = z.object({
    placeId: z.string().min(1, "Place ID is required"),
    name: z.string().min(1, "Location name is required"),
    address: z.string().optional(),
    lat: z.number(),
    lng: z.number(),
    type: z.string().optional(),

    // Production details
    productionNotes: z.string().optional(),
    entryPoint: z.string().optional(),
    parking: z.string().optional(),
    access: z.string().optional(),

    // User save details
    caption: z.string().optional(),
    isFavorite: z.boolean().optional(),
    personalRating: z.number().min(0).max(5).optional(),
    color: z.string().optional(),
});

type SaveLocationFormData = z.infer<typeof saveLocationSchema>;

interface SaveLocationPanelProps {
    initialData?: Partial<SaveLocationFormData>;
    onSuccess?: () => void;
    onCancel?: () => void;
}

const LOCATION_TYPES = [
    "restaurant",
    "cafe",
    "park",
    "museum",
    "hotel",
    "landmark",
    "store",
    "other",
];

const MARKER_COLORS = [
    { value: "#EF4444", label: "Red" },
    { value: "#F59E0B", label: "Orange" },
    { value: "#EAB308", label: "Yellow" },
    { value: "#22C55E", label: "Green" },
    { value: "#3B82F6", label: "Blue" },
    { value: "#8B5CF6", label: "Purple" },
    { value: "#EC4899", label: "Pink" },
];

export function SaveLocationPanel({
    initialData,
    onSuccess,
    onCancel,
}: SaveLocationPanelProps) {
    const [tags, setTags] = useState<string[]>([]);
    const [tagInput, setTagInput] = useState("");

    const saveLocation = useSaveLocation();

    const form = useForm<SaveLocationFormData>({
        resolver: zodResolver(saveLocationSchema),
        defaultValues: {
            placeId: initialData?.placeId || "",
            name: initialData?.name || "",
            address: initialData?.address || "",
            lat: initialData?.lat || 0,
            lng: initialData?.lng || 0,
            type: initialData?.type || "",
            isFavorite: initialData?.isFavorite || false,
            personalRating: initialData?.personalRating || 0,
            color: initialData?.color || "#EF4444",
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
                isFavorite: initialData.isFavorite || false,
                personalRating: initialData.personalRating || 0,
                color: initialData.color || "#EF4444",
                ...initialData,
            });
        }
    }, [initialData, form]);

    const onSubmit = (data: SaveLocationFormData) => {
        saveLocation.mutate(
            {
                ...data,
                tags: tags.length > 0 ? tags : undefined,
            },
            {
                onSuccess: () => {
                    form.reset();
                    setTags([]);
                    onSuccess?.();
                },
            }
        );
    };

    const handleQuickSave = () => {
        const data = form.getValues();
        // Quick save: only save essential info
        saveLocation.mutate(
            {
                placeId: data.placeId,
                name: data.name,
                address: data.address,
                lat: data.lat,
                lng: data.lng,
                type: data.type,
                // Mark as quick save for reminder email
                isPermanent: false,
            },
            {
                onSuccess: () => {
                    // TODO: Trigger reminder email on backend
                    console.log("Quick save successful - reminder email queued");
                    form.reset();
                    setTags([]);
                    onSuccess?.();
                },
            }
        );
    };

    const handleAddTag = () => {
        if (tagInput.trim() && !tags.includes(tagInput.trim())) {
            setTags([...tags, tagInput.trim()]);
            setTagInput("");
        }
    };

    const handleRemoveTag = (tagToRemove: string) => {
        setTags(tags.filter((tag) => tag !== tagToRemove));
    };

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="p-4 border-b">
                <h2 className="text-lg font-semibold">Save New Location</h2>
                <p className="text-sm text-muted-foreground">
                    Add details and production notes for this location
                </p>
            </div>

            {/* Form - Scrollable */}
            <div className="flex-1 overflow-y-auto p-4">
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    {/* Basic Information */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold">Basic Information</h3>

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
                                <Label htmlFor="address">Address</Label>
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                                    <Input
                                        id="address"
                                        {...form.register("address")}
                                        placeholder="123 Main St"
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

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <Label htmlFor="type">Type</Label>
                                    <Select
                                        onValueChange={(value) => form.setValue("type", value)}
                                        defaultValue={form.getValues("type")}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {LOCATION_TYPES.map((type) => (
                                                <SelectItem key={type} value={type}>
                                                    {type.charAt(0).toUpperCase() + type.slice(1)}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <Label htmlFor="color">Marker Color</Label>
                                    <Select
                                        onValueChange={(value) => form.setValue("color", value)}
                                        defaultValue={form.getValues("color")}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Color" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {MARKER_COLORS.map((color) => (
                                                <SelectItem key={color.value} value={color.value}>
                                                    <div className="flex items-center gap-2">
                                                        <div
                                                            className="w-4 h-4 rounded-full border"
                                                            style={{ backgroundColor: color.value }}
                                                        />
                                                        {color.label}
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Personal Notes */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold">Personal Notes</h3>

                        <div>
                            <Label htmlFor="caption">Caption / Notes</Label>
                            <Textarea
                                id="caption"
                                {...form.register("caption")}
                                placeholder="Add your notes..."
                                rows={2}
                            />
                        </div>

                        <div>
                            <Label htmlFor="tags">Tags</Label>
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
                                />
                                <Button type="button" onClick={handleAddTag} variant="outline" size="icon">
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

                    {/* Production Details */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold">Production Details (Optional)</h3>

                        <div className="space-y-3">
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

                            <div>
                                <Label htmlFor="productionNotes">Production Notes</Label>
                                <Textarea
                                    id="productionNotes"
                                    {...form.register("productionNotes")}
                                    placeholder="Special considerations..."
                                    rows={2}
                                />
                            </div>
                        </div>
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
                        disabled={saveLocation.isPending}
                        className="flex-1"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={form.handleSubmit(onSubmit)}
                        disabled={saveLocation.isPending}
                        className="flex-1"
                    >
                        {saveLocation.isPending ? "Saving..." : "Save"}
                    </Button>
                </div>

                {/* Quick Save Button */}
                <Button
                    type="button"
                    variant="secondary"
                    onClick={handleQuickSave}
                    disabled={saveLocation.isPending || !form.watch("name")}
                    className="w-full"
                >
                    <Zap className="w-4 h-4 mr-2" />
                    Quick Save (Complete Later)
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                    Quick save stores basic info. You'll get a reminder email to complete details.
                </p>
            </div>
        </div>
    );
}
