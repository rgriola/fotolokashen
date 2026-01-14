"use client";

import { useState } from "react";
import { useLocations } from "@/hooks/useLocations";
import { LocationListCompact } from "@/components/locations/LocationListCompact";
import { LocationFilters } from "@/components/locations/LocationFilters";
import { FilterPanel } from "@/components/locations/FilterPanel";
import type { Location } from "@/types/location";
import { Loader2 } from "lucide-react";

interface SavedLocationsPanelProps {
    onLocationClick: (location: Location) => void;
    onShare: (location: Location) => void;
}

export function SavedLocationsPanel({
    onLocationClick,
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
    let filteredUserSaves = data?.locations || [];

    // Filter favorites
    if (favoritesOnly) {
        filteredUserSaves = filteredUserSaves.filter(
            (userSave) => userSave.isFavorite
        );
    }

    // Sort user saves
    filteredUserSaves = [...filteredUserSaves].sort((a, b) => {
        switch (sortBy) {
            case "recent":
                return new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime();
            case "oldest":
                return new Date(a.savedAt).getTime() - new Date(b.savedAt).getTime();
            case "name-asc":
                return (a.location?.name || '').localeCompare(b.location?.name || '');
            case "name-desc":
                return (b.location?.name || '').localeCompare(a.location?.name || '');
            case "rating":
                return (b.personalRating || 0) - (a.personalRating || 0);
            default:
                return 0;
        }
    });

    // Transform UserSave[] to Location[] for the LocationListCompact component
    // by extracting the location and attaching the userSave data
    const filteredLocations = filteredUserSaves
        .filter(userSave => userSave.location) // Only include if location exists
        .map(userSave => ({
            ...userSave.location!,
            userSave: userSave, // Attach the UserSave data
        }));

    const handleLocationClick = (location: Location) => {
        onLocationClick(location);
    };

    return (
        <div className="flex flex-col h-full">
            {/* Filters */}
            <div className="p-3 border-b bg-muted/30">
                <div className="flex items-center gap-2">
                    <div className="flex-1">
                        <LocationFilters
                            onSearchChange={setSearch}
                        />
                    </div>
                    <FilterPanel
                        onTypeChange={setTypeFilter}
                        onFavoritesToggle={setFavoritesOnly}
                        onSortChange={setSortBy}
                    />
                </div>
            </div>

            {/* Location Count */}
            <div className="px-3 py-2 text-sm text-muted-foreground border-b">
                {filteredLocations.length} location{filteredLocations.length !== 1 ? "s" : ""}
            </div>

            {/* Error State */}
            {error && (
                <div className="p-3 bg-destructive/10 text-destructive text-sm">
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

            {/* Locations List - Compact View */}
            {!isLoading && (
                <div className="flex-1 overflow-y-auto p-3">
                    <LocationListCompact
                        locations={filteredLocations}
                        isLoading={false}
                        onShare={onShare}
                        onClick={handleLocationClick}
                    />
                </div>
            )}
        </div>
    );
}
