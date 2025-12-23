"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, Star, SlidersHorizontal } from "lucide-react";
import { LOCATION_TYPES } from "@/lib/location-constants";

interface LocationFiltersProps {
    onSearchChange: (search: string) => void;
    onTypeChange: (type: string) => void;
    onFavoritesToggle: (favoritesOnly: boolean) => void;
    onSortChange: (sort: string) => void;
}



export function LocationFilters({
    onSearchChange,
    onTypeChange,
    onFavoritesToggle,
    onSortChange,
}: LocationFiltersProps) {
    const [search, setSearch] = useState("");
    const [favoritesOnly, setFavoritesOnly] = useState(false);
    const [showFilters, setShowFilters] = useState(false);

    const handleSearchChange = (value: string) => {
        setSearch(value);
        onSearchChange(value);
    };

    const handleFavoritesToggle = () => {
        const newValue = !favoritesOnly;
        setFavoritesOnly(newValue);
        onFavoritesToggle(newValue);
    };

    return (
        <div className="space-y-4">
            {/* Search and Quick Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                {/* Search Input */}
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                        type="text"
                        placeholder="Search locations..."
                        value={search}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        className="pl-9"
                    />
                </div>

                {/* Favorites Toggle */}
                <Button
                    variant={favoritesOnly ? "default" : "outline"}
                    size="default"
                    onClick={handleFavoritesToggle}
                    className="shrink-0"
                >
                    <Star className={`w-4 h-4 mr-2 ${favoritesOnly ? 'fill-current' : ''}`} />
                    Favorites
                </Button>

                {/* Filters Toggle */}
                <Button
                    variant="outline"
                    size="default"
                    onClick={() => setShowFilters(!showFilters)}
                    className="shrink-0"
                >
                    <SlidersHorizontal className="w-4 h-4 mr-2" />
                    Filters
                </Button>
            </div>

            {/* Advanced Filters */}
            {showFilters && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 border rounded-lg bg-muted/50">
                    {/* Type Filter */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Location Type</label>
                        <Select onValueChange={onTypeChange} defaultValue="all">
                            <SelectTrigger>
                                <SelectValue placeholder="All types" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All types</SelectItem>
                                {LOCATION_TYPES.map((type) => (
                                    <SelectItem key={type} value={type}>
                                        {type}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Sort Order */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Sort By</label>
                        <Select onValueChange={onSortChange} defaultValue="recent">
                            <SelectTrigger>
                                <SelectValue placeholder="Most recent" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="recent">Most Recent</SelectItem>
                                <SelectItem value="oldest">Oldest First</SelectItem>
                                <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                                <SelectItem value="name-desc">Name (Z-A)</SelectItem>
                                <SelectItem value="rating">Highest Rating</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            )}
        </div>
    );
}
