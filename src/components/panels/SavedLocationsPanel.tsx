"use client";

import { useState } from "react";
import { useLocations } from "@/hooks/useLocations";
import { LocationList } from "@/components/locations/LocationList";
import { LocationFilters } from "@/components/locations/LocationFilters";
import type { Location } from "@/types/location";
import { Loader2 } from "lucide-react";

interface SavedLocationsPanelProps {
    onLocationClick: (location: Location) => void;
    onEdit: (location: Location) => void;
    onDelete: (id: number) => void;
    onShare: (location: Location) => void;
}

export function SavedLocationsPanel({
    onLocationClick,
    onEdit,
    onDelete,
    onShare,
}: SavedLocationsPanelProps) {
    const [search, setSearch] = useState("");
    const [typeFilter, setTypeFilter] = useState("all");
    const [favoritesOnly, setFavoritesOnly] = useState(false);
    const [sortBy, setSortBy] = useState("recent");

    // Fetch locations
    const { data, isLoading, error } = useLocations({
        search: search || undefined,
        type: typeFilter !== "all" ? typeFilter : undefined,
    });

    // Filter and sort locations client-side
    let filteredLocations = data?.locations || [];

    // Filter favorites
    if (favoritesOnly) {
        filteredLocations = filteredLocations.filter(
            (loc) => loc.userSave?.isFavorite
        );
    }

    // Sort locations
    filteredLocations = [...filteredLocations].sort((a, b) => {
        switch (sortBy) {
            case "recent":
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            case "oldest":
                return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
            case "name-asc":
                return a.name.localeCompare(b.name);
            case "name-desc":
                return b.name.localeCompare(a.name);
            case "rating":
                return (b.userSave?.personalRating || 0) - (a.userSave?.personalRating || 0);
            default:
                return 0;
        }
    });

    const handleLocationClick = (location: Location) => {
        onLocationClick(location);
    };

    return (
        <div className="flex flex-col h-full">
            {/* Filters */}
            <div className="p-4 border-b bg-muted/30">
                <LocationFilters
                    onSearchChange={setSearch}
                    onTypeChange={setTypeFilter}
                    onFavoritesToggle={setFavoritesOnly}
                    onSortChange={setSortBy}
                />
            </div>

            {/* Location Count */}
            <div className="px-4 py-2 text-sm text-muted-foreground border-b">
                {filteredLocations.length} location{filteredLocations.length !== 1 ? "s" : ""}
            </div>

            {/* Error State */}
            {error && (
                <div className="p-4 bg-destructive/10 text-destructive text-sm">
                    <p className="font-medium">Error loading locations</p>
                    <p>{error.message}</p>
                </div>
            )}

            {/* Loading State */}
            {isLoading && (
                <div className="flex-1 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
            )}

            {/* Locations List */}
            {!isLoading && (
                <div className="flex-1 overflow-y-auto p-4">
                    <LocationList
                        locations={filteredLocations}
                        isLoading={false}
                        onEdit={onEdit}
                        onDelete={onDelete}
                        onShare={onShare}
                        onClick={handleLocationClick}
                    />
                </div>
            )}
        </div>
    );
}
