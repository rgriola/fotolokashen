"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { useLocations } from "@/hooks/useLocations";
import { usePublicLocations } from "@/hooks/usePublicLocations";
import { useFriendsLocations } from "@/hooks/useFriendsLocations";
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
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { List, LayoutGrid, X, Plus, Map, Users, MapPin } from "lucide-react";
import type { Location, UserSave, LocationWithSource } from "@/types/location";

function LocationsPageInner() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const hasProcessedEdit = useRef(false);
    const { user } = useAuth();
    const [search, setSearch] = useState("");
    const [typeFilter, setTypeFilter] = useState("all");
    const [favoritesOnly, setFavoritesOnly] = useState(false);
    const [sortBy, setSortBy] = useState("recent");
    const [showPublic, setShowPublic] = useState(false);
    const [showFriends, setShowFriends] = useState(false);
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

    // Fetch public locations (conditionally)
    const { data: publicLocationsData, isLoading: isLoadingPublic } = usePublicLocations({
        enabled: showPublic,
        type: typeFilter !== "all" ? typeFilter : undefined,
    });

    // Fetch friends locations (conditionally)
    const { data: friendsLocationsData, isLoading: isLoadingFriends } = useFriendsLocations({
        enabled: showFriends,
        type: typeFilter !== "all" ? typeFilter : undefined,
    });

    // Delete mutation
    const deleteLocation = useDeleteLocation();

    // Transform UserSave[] to Location[] (API returns UserSave with nested location)
    const allLocations = useMemo(() => {
        return data?.locations
            ?.filter((userSave: UserSave) => userSave.location)
            ?.map((userSave: UserSave) => ({
                ...(userSave.location as Location),
                userSave: userSave, // Attach the UserSave data
            })) || [];
    }, [data?.locations]);

    // Merge locations from all sources (user's saves, public, friends)
    const mergedLocations = useMemo(() => {
        const locationMap = new globalThis.Map<number, Location & { source?: 'user' | 'friend' | 'public' }>();

        // Add user's own locations first (highest precedence)
        allLocations.forEach(loc => {
            locationMap.set(loc.id, { ...loc, source: 'user' as const });
        });

        // Add friends locations (skip if already in user's saves)
        if (showFriends && friendsLocationsData?.locations) {
            friendsLocationsData.locations.forEach(flatLoc => {
                if (!locationMap.has(flatLoc.id)) {
                    const loc = {
                        ...(flatLoc as unknown as Location),
                        source: 'friend' as const,
                    };
                    locationMap.set(flatLoc.id, loc);
                }
            });
        }

        // Add public locations (skip if already exists)
        if (showPublic && publicLocationsData?.locations) {
            publicLocationsData.locations.forEach(flatLoc => {
                if (!locationMap.has(flatLoc.id)) {
                    const loc = {
                        ...(flatLoc as unknown as Location),
                        source: 'public' as const,
                    };
                    locationMap.set(flatLoc.id, loc);
                }
            });
        }

        return Array.from(locationMap.values());
    }, [allLocations, publicLocationsData, friendsLocationsData, showPublic, showFriends]);

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
    let filteredLocations = mergedLocations;

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

    // Filter favorites (only applies to user's own locations)
    if (favoritesOnly) {
        filteredLocations = filteredLocations.filter(
            (loc) => (loc as LocationWithSource).source === 'user' && loc.userSave?.isFavorite
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
            <div className="shrink-0 bg-background border-b">
                <div className="container mx-auto px-4 py-3 max-w-7xl">
                    {/* Single Row: Search (left) + Toggles + Buttons (right) */}
                    <div className="flex items-center justify-between gap-4">
                        {/* Search - Full width mobile, max 50% desktop */}
                        <div className="flex-1 min-w-0 md:flex-none md:w-1/2" data-tour="locations-search">
                            <LocationFilters
                                onSearchChange={setSearch}
                            />
                        </div>

                        {/* Location Source Toggles - Center */}
                        <TooltipProvider delayDuration={300}>
                            <div className="hidden md:flex items-center gap-1 shrink-0" data-tour="location-source-toggles">
                                {/* My Locations - Always Active */}
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="default"
                                            size="sm"
                                            className="bg-indigo-600 hover:bg-indigo-700 text-white"
                                            disabled
                                        >
                                            <MapPin className="w-4 h-4 mr-1.5" />
                                            <span className="text-xs">Mine</span>
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent side="bottom" className="bg-slate-900 text-white border-slate-700 px-3 py-2 text-sm font-medium shadow-xl">
                                        Show my saved locations
                                    </TooltipContent>
                                </Tooltip>

                                {/* Public Locations Toggle */}
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant={showPublic ? "default" : "outline"}
                                            size="sm"
                                            onClick={() => setShowPublic(!showPublic)}
                                            className={showPublic ? "bg-purple-600 hover:bg-purple-700 text-white" : ""}
                                        >
                                            <Map className="w-4 h-4 mr-1.5" />
                                            <span className="text-xs">Public</span>
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent side="bottom" className="bg-slate-900 text-white border-slate-700 px-3 py-2 text-sm font-medium shadow-xl">
                                        Discover public locations from the community
                                    </TooltipContent>
                                </Tooltip>

                                {/* Friends Locations Toggle */}
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant={showFriends ? "default" : "outline"}
                                            size="sm"
                                            onClick={() => setShowFriends(!showFriends)}
                                            className={showFriends ? "bg-blue-600 hover:bg-blue-700 text-white" : ""}
                                        >
                                            <Users className="w-4 h-4 mr-1.5" />
                                            <span className="text-xs">Friends</span>
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent side="bottom" className="bg-slate-900 text-white border-slate-700 px-3 py-2 text-sm font-medium shadow-xl">
                                        View locations saved by people you follow
                                    </TooltipContent>
                                </Tooltip>
                            </div>
                        </TooltipProvider>

                        {/* Action Buttons - Grouped right */}
                        <TooltipProvider delayDuration={300}>
                            <div className="flex items-center gap-1.5 shrink-0">
                                {/* Create with Photo Button */}
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            asChild
                                            variant="default"
                                            size="icon"
                                            className="shrink-0 bg-green-600 hover:bg-green-700"
                                        >
                                            <Link href="/create-with-photo">
                                                <Plus className="w-4 h-4" />
                                            </Link>
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent side="bottom" className="bg-slate-900 text-white border-slate-700 px-3 py-2 text-sm font-medium shadow-xl">
                                        Add location with photo
                                    </TooltipContent>
                                </Tooltip>

                                {/* Filters Panel Button */}
                                <div data-tour="locations-filter">
                                    <FilterPanel
                                        typeFilter={typeFilter}
                                        favoritesOnly={favoritesOnly}
                                        sortBy={sortBy}
                                        onTypeChange={setTypeFilter}
                                        onFavoritesToggle={setFavoritesOnly}
                                        onSortChange={setSortBy}
                                    />
                                </div>

                                {/* View Toggle Button - Shows icon for the OTHER view */}
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            data-tour="locations-view-toggle"
                                            variant="outline"
                                            size="icon"
                                            onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
                                            className="shrink-0"
                                        >
                                            {viewMode === "grid" ? (
                                                <List className="w-4 h-4" />
                                            ) : (
                                                <LayoutGrid className="w-4 h-4" />
                                            )}
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent side="bottom" className="bg-slate-900 text-white border-slate-700 px-3 py-2 text-sm font-medium shadow-xl">
                                        {viewMode === "grid" ? "Switch to list view" : "Switch to grid view"}
                                    </TooltipContent>
                                </Tooltip>
                            </div>
                        </TooltipProvider>
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
                    {/* Empty state for public locations toggle */}
                    {showPublic && !isLoadingPublic && publicLocationsData?.locations.length === 0 && (
                        <div className="bg-purple-50 border border-purple-200 rounded-lg p-6 mb-4">
                            <h3 className="font-semibold text-purple-900 mb-2">No public locations found</h3>
                            <p className="text-sm text-purple-700">
                                Try adjusting your filters or check back later for new public locations.
                            </p>
                        </div>
                    )}

                    {/* Empty state for friends locations toggle */}
                    {showFriends && !isLoadingFriends && friendsLocationsData?.locations.length === 0 && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-4">
                            <h3 className="font-semibold text-blue-900 mb-2">No friends&apos; locations found</h3>
                            <p className="text-sm text-blue-700 mb-3">
                                You&apos;re not following anyone yet, or your friends haven&apos;t shared any locations.
                            </p>
                            <Link 
                                href="/search" 
                                className="text-sm font-medium text-blue-600 hover:text-blue-800 underline"
                            >
                                Find people to follow →
                            </Link>
                        </div>
                    )}

                    {/* Conditional rendering based on viewMode */}
                    {viewMode === "grid" ? (
                        <LocationList
                            locations={filteredLocations}
                            isLoading={isLoading || isLoadingPublic || isLoadingFriends}
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
                            isLoading={isLoading || isLoadingPublic || isLoadingFriends}
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
                    <div className="flex items-center justify-between px-3 py-2 border-b sticky top-0 bg-background z-10">
                        <SheetTitle className="text-base">Edit Location</SheetTitle>
                        <div className="flex items-center gap-1">
                            {/* Close Button */}
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setShowEditPanel(false)}
                                className="shrink-0 h-8 w-8"
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
                                onPhotoUploadToggle={() => setShowPhotoUpload(!showPhotoUpload)}
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
                <SheetContent className="w-full sm:max-w-3xl p-0" hideCloseButton>
                    <SheetHeader>
                        <VisuallyHidden>
                            <SheetTitle>{selectedLocation?.name || "Location Details"}</SheetTitle>
                        </VisuallyHidden>
                    </SheetHeader>
                    <div className="h-full">
                        {selectedLocation && (
                            <LocationDetailPanel
                                location={selectedLocation}
                                source={(selectedLocation as LocationWithSource).source || 'user'}
                                canEdit={
                                    user?.isAdmin ||
                                    user?.role === 'staffer' ||
                                    user?.role === 'super_admin' ||
                                    selectedLocation.createdBy === user?.id
                                }
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
                                onClose={() => setShowDetailModal(false)}
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
