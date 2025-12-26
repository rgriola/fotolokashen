"use client";

import { useState } from "react";
import { useLocations } from "@/hooks/useLocations";
import { useDeleteLocation } from "@/hooks/useDeleteLocation";
import { LocationList } from "@/components/locations/LocationList";
import { LocationListCompact } from "@/components/locations/LocationListCompact";
import { LocationsMapView } from "@/components/locations/LocationsMapView";
import { LocationFilters } from "@/components/locations/LocationFilters";
import { ShareLocationDialog } from "@/components/locations/ShareLocationDialog";
import { EditLocationDialog } from "@/components/locations/EditLocationDialog";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, MapIcon, List, LayoutGrid } from "lucide-react";
import type { Location } from "@/types/location";

function LocationsPageInner() {
    const [search, setSearch] = useState("");
    const [typeFilter, setTypeFilter] = useState("all");
    const [favoritesOnly, setFavoritesOnly] = useState(false);
    const [sortBy, setSortBy] = useState("recent");
    const [shareLocation, setShareLocation] = useState<Location | null>(null);
    const [editLocation, setEditLocation] = useState<Location | null>(null);

    // Fetch locations (search is handled client-side)
    const { data, isLoading, error } = useLocations({
        type: typeFilter !== "all" ? typeFilter : undefined,
    });

    // Delete mutation
    const deleteLocation = useDeleteLocation();

    // Transform UserSave[] to Location[] (API returns UserSave with nested location)
    const allLocations = data?.locations?.map((userSave: any) => ({
        ...userSave.location,
        userSave: userSave, // Attach the UserSave data
    })) || [];

    // Filter and sort locations client-side
    let filteredLocations = allLocations;

    // Filter by search query
    if (search && search.trim()) {
        const searchLower = search.toLowerCase().trim();
        filteredLocations = filteredLocations.filter((loc) => {
            // Search in primary location fields
            const nameMatch = loc.name?.toLowerCase().includes(searchLower);
            const addressMatch = loc.address?.toLowerCase().includes(searchLower);
            const streetMatch = loc.street?.toLowerCase().includes(searchLower);
            const cityMatch = loc.city?.toLowerCase().includes(searchLower);
            const stateMatch = loc.state?.toLowerCase().includes(searchLower);

            // Search in user tags (array of strings)
            const tagsMatch = loc.userSave?.tags?.some((tag: string) =>
                tag.toLowerCase().includes(searchLower)
            );

            return nameMatch || addressMatch || streetMatch || cityMatch || stateMatch || tagsMatch;
        });
    }

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
                return new Date(b.userSave?.savedAt || b.createdAt).getTime() - new Date(a.userSave?.savedAt || a.createdAt).getTime();
            case "oldest":
                return new Date(a.userSave?.savedAt || a.createdAt).getTime() - new Date(b.userSave?.savedAt || b.createdAt).getTime();
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

    const handleDelete = (id: number) => {
        if (confirm("Are you sure you want to delete this location?")) {
            deleteLocation.mutate(id);
        }
    };

    return (
        <Tabs defaultValue="grid" className="fixed inset-0 top-16 flex flex-col">
            {/* Fixed Controls Section - MADE MORE COMPACT */}
            <div className="flex-shrink-0 bg-background border-b">
                <div className="container mx-auto px-4 py-3 max-w-7xl">
                    {/* Filters */}
                    <div className="mb-3">
                        <LocationFilters
                            onSearchChange={setSearch}
                            onTypeChange={setTypeFilter}
                            onFavoritesToggle={setFavoritesOnly}
                            onSortChange={setSortBy}
                        />
                    </div>

                    {/* Error State */}
                    {error && (
                        <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-lg mb-3">
                            <p className="font-medium">Error loading locations</p>
                            <p className="text-sm">{error.message}</p>
                        </div>
                    )}

                    {/* Tabs Header */}
                    <TabsList className="grid w-full max-w-md grid-cols-3">
                        <TabsTrigger value="grid" className="flex items-center gap-2">
                            <LayoutGrid className="w-4 h-4" />
                            Grid
                        </TabsTrigger>
                        <TabsTrigger value="list" className="flex items-center gap-2">
                            <List className="w-4 h-4" />
                            List
                        </TabsTrigger>
                        <TabsTrigger value="map" className="flex items-center gap-2">
                            <MapIcon className="w-4 h-4" />
                            Map
                        </TabsTrigger>
                    </TabsList>
                </div>
            </div>

            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto">
                <div className="container mx-auto px-4 py-6 max-w-7xl">
                    {/* Grid View */}
                    <TabsContent value="grid" className="mt-0">
                        <LocationList
                            locations={filteredLocations}
                            isLoading={isLoading}
                            onEdit={setEditLocation}
                            onDelete={handleDelete}
                            onShare={setShareLocation}
                        />
                    </TabsContent>

                    {/* List View */}
                    <TabsContent value="list" className="mt-0">
                        <LocationListCompact
                            locations={filteredLocations}
                            isLoading={isLoading}
                            onEdit={setEditLocation}
                            onDelete={handleDelete}
                            onShare={setShareLocation}
                        />
                    </TabsContent>

                    {/* Map View */}
                    <TabsContent value="map" className="mt-0">
                        <LocationsMapView locations={filteredLocations} />
                    </TabsContent>
                </div>
            </div>

            {/* Edit Dialog */}
            <EditLocationDialog
                location={editLocation}
                open={!!editLocation}
                onOpenChange={(open) => !open && setEditLocation(null)}
            />

            {/* Share Dialog */}
            <ShareLocationDialog
                location={shareLocation}
                open={!!shareLocation}
                onOpenChange={(open) => !open && setShareLocation(null)}
            />
        </Tabs>
    );
}

export default function LocationsPage() {
    return (
        <ProtectedRoute>
            <LocationsPageInner />
        </ProtectedRoute>
    );
}
