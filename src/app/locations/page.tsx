"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useLocations } from "@/hooks/useLocations";
import { useDeleteLocation } from "@/hooks/useDeleteLocation";
import { LocationsOnboardingProvider } from "@/components/onboarding/LocationsOnboardingProvider";
import { LocationList } from "@/components/locations/LocationList";
import { LocationListCompact } from "@/components/locations/LocationListCompact";
import { LocationFilters } from "@/components/locations/LocationFilters";
import { FilterPanel } from "@/components/locations/FilterPanel";
import { ShareLocationDialog } from "@/components/dialogs/ShareLocationDialog";
import { EditLocationPanel } from "@/components/panels/EditLocationPanel";
import { LocationDetailPanel } from "@/components/panels/LocationDetailPanel";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { VisuallyHidden } from "@/components/ui/visually-hidden";
import { List, LayoutGrid, X, Camera, Sun, Building, Heart } from "lucide-react";
import type { Location, UserSave } from "@/types/location";

function LocationsPageInner() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const hasProcessedEdit = useRef(false);
    const [search, setSearch] = useState("");
    const [typeFilter, setTypeFilter] = useState("all");
    const [favoritesOnly, setFavoritesOnly] = useState(false);
    const [sortBy, setSortBy] = useState("recent");
    const [shareLocation, setShareLocation] = useState<Location | null>(null);
    const [editLocation, setEditLocation] = useState<Location | null>(null);
    const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showEditPanel, setShowEditPanel] = useState(false);
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

    // Panel state for Edit
    const [isFavorite, setIsFavorite] = useState(false);
    const [indoorOutdoor, setIndoorOutdoor] = useState<"indoor" | "outdoor">("outdoor");
    const [showPhotoUpload, setShowPhotoUpload] = useState(false);

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

    // Auto-open Edit Panel when navigating from map with ?edit=userSaveId
    useEffect(() => {
        const editId = searchParams.get('edit');
        if (editId && !hasProcessedEdit.current && data?.locations) {
            const locationToEdit = data.locations
                .filter((userSave: UserSave) => userSave.location)
                .map((userSave: UserSave) => ({
                    ...(userSave.location as Location),
                    userSave: userSave,
                }))
                .find((loc) => loc.userSave?.id === parseInt(editId, 10));
            
            if (locationToEdit) {
                hasProcessedEdit.current = true;
                
                // Schedule state updates to avoid cascading renders
                setTimeout(() => {
                    setEditLocation(locationToEdit);
                    setIsFavorite(locationToEdit.userSave?.isFavorite || false);
                    setIndoorOutdoor((locationToEdit.indoorOutdoor as "indoor" | "outdoor") || "outdoor");
                    setShowPhotoUpload(false);
                    setShowEditPanel(true);
                }, 0);
                
                // Clear the query parameter to prevent re-opening on refresh
                router.replace('/locations', { scroll: false });
            }
        }
        
        // Reset ref when edit parameter is removed
        if (!searchParams.get('edit')) {
            hasProcessedEdit.current = false;
        }
    }, [searchParams, data, router]);

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
                        <div className="flex-1" data-tour="locations-search">
                            <LocationFilters
                                onSearchChange={setSearch}
                            />
                        </div>

                        {/* Filters Panel Button */}
                        <div data-tour="locations-filter">
                            <FilterPanel
                                onTypeChange={setTypeFilter}
                                onFavoritesToggle={setFavoritesOnly}
                                onSortChange={setSortBy}
                            />
                        </div>

                        {/* View Toggle Button - Shows icon for the OTHER view */}
                        <Button
                            data-tour="locations-view-toggle"
                            variant="outline"
                            size="icon"
                            onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
                            className="shrink-0"
                            title={viewMode === "grid" ? "Switch to list view" : "Switch to grid view"}
                        >
                            {viewMode === "grid" ? (
                                <List className="w-4 h-4" />
                            ) : (
                                <LayoutGrid className="w-4 h-4" />
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
                            onEdit={(location) => {
                                setEditLocation(location);
                                setIsFavorite(location.userSave?.isFavorite || false);
                                setIndoorOutdoor((location.indoorOutdoor as "indoor" | "outdoor") || "outdoor");
                                setShowPhotoUpload(false);
                                setShowEditPanel(true);
                            }}
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

            {/* Edit Panel */}
            <Sheet open={showEditPanel} onOpenChange={setShowEditPanel}>
                <SheetContent className="w-full sm:max-w-2xl overflow-y-auto p-0">
                    {/* Custom Header with Controls */}
                    <div className="flex items-center justify-between p-3 border-b sticky top-0 bg-background z-10">
                        <SheetTitle>Edit Location</SheetTitle>
                        <div className="flex items-center gap-1">
                            {/* Photo Upload Toggle */}
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setShowPhotoUpload(!showPhotoUpload)}
                                className={`shrink-0 ${showPhotoUpload ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-400 hover:bg-gray-500'} text-white hover:text-white`}
                                title="Toggle photo upload"
                            >
                                <Camera className="w-4 h-4 text-white" />
                            </Button>
                            
                            {/* Indoor/Outdoor Toggle */}
                            <div className="flex items-center gap-0.5">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setIndoorOutdoor("outdoor")}
                                    className="shrink-0"
                                    title="Outdoor"
                                >
                                    <Sun
                                        className={`w-5 h-5 transition-colors ${
                                            indoorOutdoor === "outdoor"
                                                ? "text-amber-500 fill-amber-500"
                                                : "text-muted-foreground"
                                        }`}
                                    />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setIndoorOutdoor("indoor")}
                                    className="shrink-0"
                                    title="Indoor"
                                >
                                    <Building
                                        className={`w-5 h-5 transition-colors ${
                                            indoorOutdoor === "indoor"
                                                ? "text-blue-600 stroke-[2.5]"
                                                : "text-muted-foreground"
                                        }`}
                                        fill={indoorOutdoor === "indoor" ? "#fbbf24" : "none"}
                                        fillOpacity={indoorOutdoor === "indoor" ? 0.2 : 0}
                                    />
                                </Button>
                            </div>
                            
                            {/* Favorite Toggle */}
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setIsFavorite(!isFavorite)}
                                className="shrink-0"
                                title={isFavorite ? "Remove from favorites" : "Add to favorites"}
                            >
                                <Heart
                                    className={`w-5 h-5 transition-colors ${
                                        isFavorite
                                            ? "fill-red-500 text-red-500"
                                            : "text-muted-foreground"
                                    }`}
                                />
                            </Button>
                            
                            {/* Close Button */}
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setShowEditPanel(false)}
                                className="shrink-0"
                            >
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                    
                    {/* Panel Content */}
                    <div className="p-3">
                        {editLocation?.userSave && (
                            <EditLocationPanel
                                locationId={editLocation.id}
                                location={editLocation}
                                userSave={editLocation.userSave}
                                isFavorite={isFavorite}
                                indoorOutdoor={indoorOutdoor}
                                showPhotoUpload={showPhotoUpload}
                                onSuccess={() => {
                                    setShowEditPanel(false);
                                    setEditLocation(null);
                                }}
                                onCancel={() => {
                                    setShowEditPanel(false);
                                    setEditLocation(null);
                                }}
                            />
                        )}
                    </div>
                </SheetContent>
            </Sheet>

            {/* Share Dialog */}
            <ShareLocationDialog
                location={shareLocation}
                open={!!shareLocation}
                onOpenChange={(open) => !open && setShareLocation(null)}
            />

            {/* Location Detail Panel */}
            <Sheet open={showDetailModal} onOpenChange={setShowDetailModal}>
                <SheetContent className="w-full sm:max-w-3xl p-0">
                    <SheetHeader>
                        <VisuallyHidden>
                            <SheetTitle>{selectedLocation?.name || "Location Details"}</SheetTitle>
                        </VisuallyHidden>
                    </SheetHeader>
                    <div className="h-full">
                        {selectedLocation && (
                            <LocationDetailPanel
                                location={selectedLocation}
                                onEdit={(location) => {
                                    setEditLocation(location);
                                    setIsFavorite(location.userSave?.isFavorite || false);
                                    setIndoorOutdoor((location.indoorOutdoor as "indoor" | "outdoor") || "outdoor");
                                    setShowPhotoUpload(false);
                                    setShowDetailModal(false);
                                    setShowEditPanel(true);
                                }}
                                onDelete={(id) => {
                                    handleDelete(id);
                                    setShowDetailModal(false);
                                    setSelectedLocation(null);
                                }}
                                onShare={(location) => {
                                    setShareLocation(location);
                                }}
                                onViewOnMap={(location) => {
                                    const userSaveId = location.userSave?.id || location.id;
                                    router.push(`/map?lat=${location.lat}&lng=${location.lng}&zoom=17&edit=${userSaveId}`);
                                }}
                            />
                        )}
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    );
}

export default function LocationsPage() {
    const { user } = useAuth();
    const [locationsOnboardingCompleted, setLocationsOnboardingCompleted] = useState(false);

    // Fetch user onboarding status
    useEffect(() => {
        if (user?.id) {
            fetch('/api/v1/users/me', {
                credentials: 'include',
            })
                .then(res => res.json())
                .then(data => {
                    if (data.user) {
                        setLocationsOnboardingCompleted(data.user.locationsOnboardingCompleted ?? false);
                    }
                })
                .catch(err => console.error('Failed to fetch onboarding status:', err));
        }
    }, [user?.id]);

    const handleTourComplete = () => {
        // Update state immediately when tour completes
        setLocationsOnboardingCompleted(true);
    };

    return (
        <ProtectedRoute>
            <LocationsOnboardingProvider 
                locationsOnboardingCompleted={locationsOnboardingCompleted}
                onTourComplete={handleTourComplete}
            >
                <LocationsPageInner />
            </LocationsOnboardingProvider>
        </ProtectedRoute>
    );
}
