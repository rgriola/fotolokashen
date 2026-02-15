"use client";

import { Button } from "@/components/ui/button";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Heart, SlidersHorizontal, Filter, ArrowUpDown } from "lucide-react";
import { LOCATION_TYPES } from "@/lib/location-constants";
import { LOCATION_SORT_OPTIONS } from "@/lib/form-constants";

interface FilterPanelProps {
    typeFilter: string;
    favoritesOnly: boolean;
    sortBy: string;
    onTypeChange: (type: string) => void;
    onFavoritesToggle: (favoritesOnly: boolean) => void;
    onSortChange: (sort: string) => void;
}

export function FilterPanel({
    typeFilter,
    favoritesOnly,
    sortBy,
    onTypeChange,
    onFavoritesToggle,
    onSortChange,
}: FilterPanelProps) {
    const handleFavoritesToggle = () => {
        onFavoritesToggle(!favoritesOnly);
    };

    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="shrink-0">
                    <SlidersHorizontal className="w-4 h-4" />
                </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[320px] sm:w-[380px] flex flex-col">
                <SheetHeader className="pb-4">
                    <SheetTitle className="flex items-center gap-2">
                        <SlidersHorizontal className="w-5 h-5" />
                        Filters & Sorting
                    </SheetTitle>
                    <SheetDescription>
                        Customize your location view
                    </SheetDescription>
                </SheetHeader>
                
                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto -mx-6 px-6">
                    <div className="space-y-6 py-2 ml-2.5 mr-2.5">
                        {/* Favorites Section */}
                        <div className="space-y-3">
                            <Button
                                variant={favoritesOnly ? "destructive" : "outline"}
                                size="default"
                                onClick={handleFavoritesToggle}
                                className="w-full justify-start"
                            >
                                <Heart className={`w-4 h-4 mr-2 ${favoritesOnly ? 'fill-white text-white' : ''}`} />
                                {favoritesOnly ? 'Favorites' : 'Favorites'}
                            </Button>
                            {favoritesOnly && (
                                <p className="text-xs text-muted-foreground">
                                    Only showing your favorited locations
                                </p>
                            )}
                        </div>

                        <Separator />

                        {/* Type Filter Section */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <Filter className="w-4 h-4 text-muted-foreground" />
                                <Label htmlFor="type-filter" className="text-sm font-semibold">
                                    Location Type
                                </Label>
                            </div>
                            <Select 
                                value={typeFilter} 
                                onValueChange={onTypeChange}
                            >
                                <SelectTrigger id="type-filter" className="h-11">
                                    <SelectValue placeholder="All Types" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">
                                        <span className="font-medium">All Types</span>
                                    </SelectItem>
                                    <Separator className="my-1" />
                                    {LOCATION_TYPES.map((type) => (
                                        <SelectItem key={type} value={type}>
                                            {type}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">
                                Filter by location category
                            </p>
                        </div>

                        <Separator />

                        {/* Sort Section */}
                        <div className="space-y-3" data-tour="locations-sort">
                            <div className="flex items-center gap-2">
                                <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
                                <Label htmlFor="sort-order" className="text-sm font-semibold">
                                    Sort Order
                                </Label>
                            </div>
                            <Select 
                                value={sortBy} 
                                onValueChange={onSortChange}
                            >
                                <SelectTrigger id="sort-order" className="h-11">
                                    <SelectValue placeholder="Most Recent" />
                                </SelectTrigger>
                                <SelectContent>
                                    {LOCATION_SORT_OPTIONS.map((option) => (
                                        <SelectItem key={option.value} value={option.value}>
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">
                                Change the order of locations
                            </p>
                        </div>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
