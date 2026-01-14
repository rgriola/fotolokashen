"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocations } from "@/hooks/useLocations";
import { useDeleteLocation } from "@/hooks/useDeleteLocation";
import { LocationList } from "@/components/locations/LocationList";
import { LocationListCompact } from "@/components/locations/LocationListCompact";
import { LocationFilters } from "@/components/locations/LocationFilters";
import { FilterPanel } from "@/components/locations/FilterPanel";
import { ShareLocationDialog } from "@/components/locations/ShareLocationDialog";
import { EditLocationDialog } from "@/components/locations/EditLocationDialog";
import { LocationDetailModal } from "@/components/locations/LocationDetailModal";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { List, LayoutGrid } from "lucide-react";
import type { Location, UserSave } from "@/types/location";

function LocationsPageInner() {
    const router = useRouter();
    const [search, setSearch] = useState("");
    const [typeFilter, setTypeFilter] = useState("all");
    const [favoritesOnly, setFavoritesOnly] = useState(false);
    const [sortBy, setSortBy] = useState("recent");
    const [shareLocation, setShareLocation] = useState<Location | null>(null);
    const [editLocation, setEditLocation] = useState<Location | null>(null);
    const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

    // Fetch locations (search is handled client-side)
    const { data, isLoading, error } = useLocations({
        type: typeFilter !== "all" ? typeFilter : undefined,
    });

    // Delete mutation
    const deleteLocation = useDeleteLocation();

    // Transform UserSave[] to Location[] (API returns UserSave with nested location)
    const allLocations = data?.locations
        ?.filter((userSave: UserSave) => userSave.location)
        ?.map((userSave: UserSave) => ({
            ...(userSave.location as Location),
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
        <div className="fixed inset-0 top-16 flex flex-col">
            {/* Fixed Controls Section - Compact Mobile Layout */}
            <div className="flex-shrink-0 bg-background border-b">
                <div className="container mx-auto px-4 py-3 max-w-7xl">
                    {/* Single Row: Search + Filter Button + Grid/List Toggle */}
                    <div className="flex items-center gap-2">
                        {/* Search - Takes most space */}
                        <div className="flex-1">
                            <LocationFilters
                                onSearchChange={setSearch}
                            />
                        </div>

                        {/* Filters Panel Button */}
                        <FilterPanel
                            onTypeChange={setTypeFilter}
                            onFavoritesToggle={setFavoritesOnly}
                            onSortChange={setSortBy}
                        />

                        {/* View Toggle Button - Single button that switches icon */}
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
                            className="shrink-0"
                            title={viewMode === "grid" ? "Switch to list view" : "Switch to grid view"}
                        >
                            {viewMode === "grid" ? (
                                <LayoutGrid className="w-4 h-4" />
                            ) : (
                                <List className="w-4 h-4" />
                            )}
                        </Button>
                    </div>

                    {/* Error State */}
                    {error && (
                        <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-lg mt-3">
                            <p className="font-medium">Error loading locations</p>
                            <p className="text-sm">{error.message}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto">
                <div className="container mx-auto px-4 py-6 max-w-7xl">
                    {/* Conditional rendering based on viewMode */}
                    {viewMode === "grid" ? (
                        <LocationList
                            locations={filteredLocations}
                            isLoading={isLoading}
                            onEdit={setEditLocation}
                            onDelete={handleDelete}
                            onShare={setShareLocation}
                            onClick={(location) => {
                                setSelectedLocation(location);
                                setShowDetailModal(true);
                            }}
                        />
                    ) : (
                        <LocationListCompact
                            locations={filteredLocations}
                            isLoading={isLoading}
                            onShare={setShareLocation}
                            onClick={(location) => {
                                setSelectedLocation(location);
                                setShowDetailModal(true);
                            }}
                        />
                    )}
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

            {/* Location Detail Modal */}
            <LocationDetailModal
                location={selectedLocation}
                isOpen={showDetailModal}
                onClose={() => {
                    setShowDetailModal(false);
                    setSelectedLocation(null);
                }}
                onEdit={(location) => {
                    setEditLocation(location);
                    setShowDetailModal(false);
                }}
                onDelete={(id) => {
                    handleDelete(id);
                    setShowDetailModal(false);
                }}
                onShare={(location) => {
                    setShareLocation(location);
                    setShowDetailModal(false);
                }}
                onViewOnMap={(location) => {
                    // Use UserSave ID for the edit parameter (API expects UserSave ID)
                    const userSaveId = location.userSave?.id || location.id;
                    router.push(`/map?lat=${location.lat}&lng=${location.lng}&zoom=17&edit=${userSaveId}`);
                }}
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
