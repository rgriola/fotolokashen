"use client";

import { useState } from "react";
import { useLocations } from "@/hooks/useLocations";
import { useDeleteLocation } from "@/hooks/useDeleteLocation";
import { LocationList } from "@/components/locations/LocationList";
import { LocationFilters } from "@/components/locations/LocationFilters";
import { ShareLocationDialog } from "@/components/locations/ShareLocationDialog";
import { SaveLocationDialog } from "@/components/locations/SaveLocationDialog";
import { EditLocationDialog } from "@/components/locations/EditLocationDialog";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus, MapIcon, List } from "lucide-react";
import type { Location } from "@/types/location";

function LocationsPageInner() {
    const [search, setSearch] = useState("");
    const [typeFilter, setTypeFilter] = useState("all");
    const [favoritesOnly, setFavoritesOnly] = useState(false);
    const [sortBy, setSortBy] = useState("recent");
    const [shareLocation, setShareLocation] = useState<Location | null>(null);
    const [editLocation, setEditLocation] = useState<Location | null>(null);
    const [showSaveDialog, setShowSaveDialog] = useState(false);

    // Fetch locations
    const { data, isLoading, error } = useLocations({
        search: search || undefined,
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
        <div className="container mx-auto px-4 py-8 max-w-7xl">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold">My Locations</h1>
                    <p className="text-muted-foreground mt-1">
                        {filteredLocations.length} saved location{filteredLocations.length !== 1 ? 's' : ''}
                    </p>
                </div>
                <Button size="lg" onClick={() => setShowSaveDialog(true)}>
                    <Plus className="w-5 h-5 mr-2" />
                    Add Location
                </Button>
            </div>

            {/* Filters */}
            <div className="mb-6">
                <LocationFilters
                    onSearchChange={setSearch}
                    onTypeChange={setTypeFilter}
                    onFavoritesToggle={setFavoritesOnly}
                    onSortChange={setSortBy}
                />
            </div>

            {/* Error State */}
            {error && (
                <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-lg mb-6">
                    <p className="font-medium">Error loading locations</p>
                    <p className="text-sm">{error.message}</p>
                </div>
            )}

            {/* List/Map Tabs */}
            <Tabs defaultValue="list" className="space-y-6">
                <TabsList className="grid w-full max-w-md grid-cols-2">
                    <TabsTrigger value="list" className="flex items-center gap-2">
                        <List className="w-4 h-4" />
                        List View
                    </TabsTrigger>
                    <TabsTrigger value="map" className="flex items-center gap-2">
                        <MapIcon className="w-4 h-4" />
                        Map View
                    </TabsTrigger>
                </TabsList>

                {/* List View */}
                <TabsContent value="list" className="space-y-6">
                    <LocationList
                        locations={filteredLocations}
                        isLoading={isLoading}
                        onEdit={setEditLocation}
                        onDelete={handleDelete}
                        onShare={setShareLocation}
                    />
                </TabsContent>

                {/* Map View */}
                <TabsContent value="map" className="space-y-6">
                    <div className="border rounded-lg p-8 text-center bg-muted/50 min-h-[500px] flex items-center justify-center">
                        <div>
                            <MapIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-lg font-semibold mb-2">Map View Coming Soon</h3>
                            <p className="text-muted-foreground max-w-md">
                                The map view with clustered markers will be implemented next.
                            </p>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>

            {/* Save Dialog */}
            <SaveLocationDialog
                open={showSaveDialog}
                onOpenChange={setShowSaveDialog}
            />

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
        </div>
    );
}

export default function LocationsPage() {
    return (
        <ProtectedRoute>
            <LocationsPageInner />
        </ProtectedRoute>
    );
}
