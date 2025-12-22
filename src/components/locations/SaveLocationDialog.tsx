"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useSaveLocation } from "@/hooks/useSaveLocation";
import { MapPin, Tag, X } from "lucide-react";

const saveLocationSchema = z.object({
    placeId: z.string().min(1, "Place ID is required"),
    name: z.string().min(1, "Location name is required"),
    address: z.string().optional(),
    lat: z.number(),
    lng: z.number(),
    type: z.string().optional(),

    // Address components
    street: z.string().optional(),
    number: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zipcode: z.string().optional(),

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
    isPermanent: z.boolean().optional(),
});

type SaveLocationFormData = z.infer<typeof saveLocationSchema>;

interface SaveLocationDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    initialData?: Partial<SaveLocationFormData>;
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

export function SaveLocationDialog({
    open,
    onOpenChange,
    initialData,
}: SaveLocationDialogProps) {
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
            isPermanent: initialData?.isPermanent || false,
            ...initialData,
        },
    });

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
                    onOpenChange(false);
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
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Save New Location</DialogTitle>
                    <DialogDescription>
                        Add a new location to your collection with details and notes.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    {/* Basic Information */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold">Basic Information</h3>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2">
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

                            <div className="col-span-2">
                                <Label htmlFor="address">Address</Label>
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                                    <Input
                                        id="address"
                                        {...form.register("address")}
                                        placeholder="123 Main St, City, State"
                                        className="pl-9"
                                    />
                                </div>
                            </div>

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
                                        <SelectValue placeholder="Select color" />
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

                    {/* Personal Notes */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold">Personal Notes</h3>

                        <div>
                            <Label htmlFor="caption">Caption / Notes</Label>
                            <Textarea
                                id="caption"
                                {...form.register("caption")}
                                placeholder="Add your personal notes about this location..."
                                rows={3}
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
                                <Button type="button" onClick={handleAddTag} variant="outline">
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

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="personalRating">Personal Rating</Label>
                                <Select
                                    onValueChange={(value) =>
                                        form.setValue("personalRating", parseInt(value))
                                    }
                                    defaultValue={form.getValues("personalRating")?.toString()}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Rate this location" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="0">No rating</SelectItem>
                                        <SelectItem value="1">⭐ 1 star</SelectItem>
                                        <SelectItem value="2">⭐⭐ 2 stars</SelectItem>
                                        <SelectItem value="3">⭐⭐⭐ 3 stars</SelectItem>
                                        <SelectItem value="4">⭐⭐⭐⭐ 4 stars</SelectItem>
                                        <SelectItem value="5">⭐⭐⭐⭐⭐ 5 stars</SelectItem>
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
                                    <span className="text-sm">Mark as favorite</span>
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Production Details */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold">Production Details (Optional)</h3>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="entryPoint">Entry Point</Label>
                                <Input
                                    id="entryPoint"
                                    {...form.register("entryPoint")}
                                    placeholder="Main entrance description"
                                />
                            </div>

                            <div>
                                <Label htmlFor="parking">Parking Info</Label>
                                <Input
                                    id="parking"
                                    {...form.register("parking")}
                                    placeholder="Parking availability"
                                />
                            </div>

                            <div className="col-span-2">
                                <Label htmlFor="access">Access Information</Label>
                                <Input
                                    id="access"
                                    {...form.register("access")}
                                    placeholder="How to access the location"
                                />
                            </div>

                            <div className="col-span-2">
                                <Label htmlFor="productionNotes">Production Notes</Label>
                                <Textarea
                                    id="productionNotes"
                                    {...form.register("productionNotes")}
                                    placeholder="Special considerations for filming/shooting..."
                                    rows={2}
                                />
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={saveLocation.isPending}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={saveLocation.isPending}>
                            {saveLocation.isPending ? "Saving..." : "Save Location"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
