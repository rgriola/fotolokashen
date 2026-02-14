'use client';

/**
 * Preview Page - Admin Component Testing & Layout Preview
 * 
 * Purpose: This page allows admins to preview and test all major UI components 
 * (panels, dialogs, cards) in isolation before deploying new features to production.
 * Each section displays the current production version of components with accurate 
 * layouts, widths, and functionality for visual QA and feature testing.
 * 
 * Last Updated: February 13, 2026 6:35pm EST 
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShareLocationDialog } from '@/components/dialogs/ShareLocationDialog';
import { LocationDetailPanel } from '@/components/panels/LocationDetailPanel';
import { Share2, Edit, Eye, MapPin, Loader2, Info, PanelLeft, X, Save } from 'lucide-react';
import type { Location } from '@/types/location';
import { toast } from 'sonner';
import { Sheet, SheetContent, SheetTitle, SheetHeader } from '@/components/ui/sheet';
import { VisuallyHidden } from '@/components/ui/visually-hidden';
import { SaveLocationPanel } from '@/components/panels/SaveLocationPanel';
import { EditLocationPanel } from '@/components/panels/EditLocationPanel';
import { LocationCard } from '@/components/locations/LocationCard';
import { AdminRoute } from '@/components/auth/AdminRoute';

export default function PreviewPage() {
    // Component visibility states
    const [shareDialogOpen, setShareDialogOpen] = useState(false);
    const [detailPanelOpen, setDetailPanelOpen] = useState(false);
    const [savePanelOpen, setSavePanelOpen] = useState(false);
    const [editPanelOpen, setEditPanelOpen] = useState(false);
    
    // Data states
    const [locations, setLocations] = useState<Location[]>([]);
    const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    
    // Panel header controls (matching production /map page)
    const [isFavorite, setIsFavorite] = useState(false);
    const [indoorOutdoor, setIndoorOutdoor] = useState<"indoor" | "outdoor">("outdoor");
    const [showPhotoUpload, setShowPhotoUpload] = useState(false);

    // Fetch user's locations
    useEffect(() => {
        const fetchLocations = async () => {
            try {
                const response = await fetch('/api/locations');
                if (response.ok) {
                    const data = await response.json();
                    console.log('Fetched locations:', data);
                    
                    // The API returns userSaves with nested location objects
                    // We need to transform them to extract the location data
                    const transformedLocations = (data.locations || []).map((userSave: {
                        id: number;
                        userId: number;
                        locationId: number;
                        isFavorite: boolean;
                        personalRating: number | null;
                        visitedAt: Date | null;
                        savedAt: Date;
                        caption: string | null;
                        tags: string[] | null;
                        color: string | null;
                        visibility: string;
                        location: Location;
                    }) => ({
                        ...userSave.location,
                        userSave: {
                            id: userSave.id,
                            userId: userSave.userId,
                            locationId: userSave.locationId,
                            isFavorite: userSave.isFavorite,
                            personalRating: userSave.personalRating,
                            visitedAt: userSave.visitedAt,
                            savedAt: userSave.savedAt,
                            caption: userSave.caption,
                            tags: userSave.tags,
                            color: userSave.color,
                            visibility: userSave.visibility,
                        }
                    }));
                    
                    console.log('Transformed locations:', transformedLocations);
                    setLocations(transformedLocations);
                } else {
                    const errorData = await response.json().catch(() => ({}));
                    console.error('Failed to fetch locations:', response.status, errorData);
                    toast.error('Failed to load locations');
                }
            } catch (error) {
                console.error('Error fetching locations:', error);
                toast.error('Error loading locations');
            } finally {
                setIsLoading(false);
            }
        };

        fetchLocations();
    }, []);

    return (
        <AdminRoute>
            <div className="min-h-screen bg-background p-8">
                <div className="container max-w-6xl mx-auto space-y-8">
                    {/* Header */}
                    <div className="space-y-2">
                        <h1 className="text-4xl font-bold tracking-tight">UX Component Preview</h1>
                        <p className="text-muted-foreground">
                            Test current production components with live location data
                        </p>
                    </div>

                    {/* Component Sections */}
                    <div className="grid gap-6">
                        {/* Location Cards Preview */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Eye className="w-5 h-5" />
                                    Location Cards (Grid View)
                                </CardTitle>
                                <CardDescription>
                                    Cards from /locations page - Shows Edit/Share buttons, no delete
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {isLoading ? (
                                    <div className="flex items-center justify-center py-8">
                                        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                                        <span className="ml-2 text-muted-foreground">Loading locations...</span>
                                    </div>
                                ) : locations.length === 0 ? (
                                    <div className="text-center py-8 text-muted-foreground">
                                        <MapPin className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                        <p>No saved locations found</p>
                                        <p className="text-sm">Save locations on /map to see cards here</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {locations.slice(0, 6).map((location) => (
                                            <LocationCard
                                                key={location.id}
                                                location={location}
                                                canEdit={true}
                                                onClick={(loc) => {
                                                    setSelectedLocation(loc);
                                                    setDetailPanelOpen(true);
                                                }}
                                                onEdit={(loc) => {
                                                    setSelectedLocation(loc);
                                                    setIsFavorite(loc.userSave?.isFavorite || false);
                                                    setIndoorOutdoor((loc.indoorOutdoor as "indoor" | "outdoor") || "outdoor");
                                                    setShowPhotoUpload(false);
                                                    setEditPanelOpen(true);
                                                }}
                                                onShare={(loc) => {
                                                    setSelectedLocation(loc);
                                                    setShareDialogOpen(true);
                                                }}
                                            />
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Panel Components */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <PanelLeft className="w-5 h-5" />
                                    Panel Components
                                </CardTitle>
                                <CardDescription>
                                    Current production panels - Details (max-w-3xl), Edit & Save (max-w-2xl)
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <Button
                                        onClick={() => {
                                            if (locations.length > 0) {
                                                setSelectedLocation(locations[0]);
                                                setDetailPanelOpen(true);
                                            } else {
                                                toast.error('No locations available');
                                            }
                                        }}
                                        variant="outline"
                                        className="gap-2 h-auto py-4 flex-col"
                                        disabled={locations.length === 0}
                                    >
                                        <Info className="w-6 h-6" />
                                        <span className="font-semibold">Details Panel</span>
                                        <span className="text-xs text-muted-foreground">LocationDetailPanel</span>
                                    </Button>

                                    <Button
                                        onClick={() => {
                                            if (locations.length > 0) {
                                                const loc = locations[0];
                                                setSelectedLocation(loc);
                                                setIsFavorite(loc.userSave?.isFavorite || false);
                                                setIndoorOutdoor((loc.indoorOutdoor as "indoor" | "outdoor") || "outdoor");
                                                setShowPhotoUpload(false);
                                                setEditPanelOpen(true);
                                            } else {
                                                toast.error('No locations available');
                                            }
                                        }}
                                        variant="outline"
                                        className="gap-2 h-auto py-4 flex-col"
                                        disabled={locations.length === 0}
                                    >
                                        <Edit className="w-6 h-6" />
                                        <span className="font-semibold">Edit Panel</span>
                                        <span className="text-xs text-muted-foreground">EditLocationPanel</span>
                                    </Button>

                                    <Button
                                        onClick={() => {
                                            setIsFavorite(false);
                                            setIndoorOutdoor("outdoor");
                                            setShowPhotoUpload(false);
                                            setSavePanelOpen(true);
                                        }}
                                        variant="outline"
                                        className="gap-2 h-auto py-4 flex-col"
                                    >
                                        <Save className="w-6 h-6" />
                                        <span className="font-semibold">Save Panel</span>
                                        <span className="text-xs text-muted-foreground">SaveLocationPanel</span>
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Dialog Components */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Share2 className="w-5 h-5" />
                                    Dialog Components
                                </CardTitle>
                                <CardDescription>
                                    Quick action dialogs for immediate user attention
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <Button
                                        onClick={() => {
                                            if (locations.length > 0) {
                                                setSelectedLocation(locations[0]);
                                                setShareDialogOpen(true);
                                            } else {
                                                toast.error('No locations available');
                                            }
                                        }}
                                        variant="outline"
                                        className="gap-2 h-auto py-4 flex-col"
                                        disabled={locations.length === 0}
                                    >
                                        <Share2 className="w-6 h-6" />
                                        <span className="font-semibold">Share Dialog</span>
                                        <span className="text-xs text-muted-foreground">ShareLocationDialog</span>
                                    </Button>

                                    <div className="p-4 border rounded-lg bg-muted/50">
                                        <p className="text-sm text-muted-foreground">
                                            Other dialogs: Delete confirmations, alerts, quick actions
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* UX Patterns Info */}
                        <Card className="border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20">
                            <CardHeader>
                                <CardTitle className="text-blue-900 dark:text-blue-100">
                                    Current UX Patterns
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="text-sm text-blue-800 dark:text-blue-200 space-y-3">
                                <div>
                                    <strong className="block mb-1">✅ Panels (Sheet components):</strong>
                                    <ul className="list-disc list-inside space-y-1 ml-2">
                                        <li>Used for: Forms (Save, Edit), Browsing content (Details)</li>
                                        <li>Width: Details (max-w-3xl), Edit & Save (max-w-2xl), full-width on mobile</li>
                                        <li>Behavior: Slide from right/bottom, dismissible by swipe or close button</li>
                                        <li>Header: Simple title + close button in production</li>
                                    </ul>
                                </div>
                                <div>
                                    <strong className="block mb-1">✅ Dialogs:</strong>
                                    <ul className="list-disc list-inside space-y-1 ml-2">
                                        <li>Used for: Quick actions (Share), Confirmations (Delete)</li>
                                        <li>Behavior: Center overlay, requires user response</li>
                                    </ul>
                                </div>
                                <div>
                                    <strong className="block mb-1">✅ Location Cards:</strong>
                                    <ul className="list-disc list-inside space-y-1 ml-2">
                                        <li>Edit/Share buttons at top for easy access</li>
                                        <li>No delete button (prevents accidental deletion)</li>
                                        <li>Consistent layout regardless of data</li>
                                    </ul>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            {/* Component Sheets/Dialogs */}
            {selectedLocation && (
                <>
                    {/* Share Dialog */}
                    <ShareLocationDialog
                        location={selectedLocation}
                        open={shareDialogOpen}
                        onOpenChange={setShareDialogOpen}
                    />

                    {/* Details Panel - Current Production Version */}
                    <Sheet open={detailPanelOpen} onOpenChange={setDetailPanelOpen}>
                        <SheetContent className="w-full sm:max-w-3xl p-0" hideCloseButton>
                            <SheetHeader>
                                <VisuallyHidden>
                                    <SheetTitle>{selectedLocation.name}</SheetTitle>
                                </VisuallyHidden>
                            </SheetHeader>
                            <div className="h-full">
                                <LocationDetailPanel
                                    location={selectedLocation}
                                    onEdit={(loc) => {
                                        setSelectedLocation(loc);
                                        setIsFavorite(loc.userSave?.isFavorite || false);
                                        setIndoorOutdoor((loc.indoorOutdoor as "indoor" | "outdoor") || "outdoor");
                                        setShowPhotoUpload(false);
                                        setDetailPanelOpen(false);
                                        setEditPanelOpen(true);
                                    }}
                                    onShare={(loc) => {
                                        setSelectedLocation(loc);
                                        setShareDialogOpen(true);
                                    }}
                                    onDelete={(id) => {
                                        toast.info(`Delete disabled in preview mode (location ID: ${id})`);
                                        setDetailPanelOpen(false);
                                    }}
                                    onViewOnMap={(loc) => {
                                        window.location.href = `/map?lat=${loc.lat}&lng=${loc.lng}&zoom=17`;
                                    }}
                                    onClose={() => setDetailPanelOpen(false)}
                                />
                            </div>
                        </SheetContent>
                    </Sheet>

                    {/* Edit Panel - Current Production Version */}
                    <Sheet open={editPanelOpen} onOpenChange={setEditPanelOpen}>
                        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto p-0">
                            {/* Custom Header with Controls */}
                            <div className="flex items-center justify-between px-3 py-2 border-b sticky top-0 bg-background z-10">
                                <SheetTitle className="text-base">Edit Location</SheetTitle>
                                <div className="flex items-center gap-1">
                                    {/* Close Button */}
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => setEditPanelOpen(false)}
                                        className="shrink-0 h-8 w-8"
                                    >
                                        <X className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                            
                            {/* Panel Content */}
                            <div className="p-3">
                                {selectedLocation?.userSave && (
                                    <EditLocationPanel
                                        locationId={selectedLocation.id}
                                        location={selectedLocation}
                                        userSave={selectedLocation.userSave}
                                        isFavorite={isFavorite}
                                        indoorOutdoor={indoorOutdoor}
                                        showPhotoUpload={showPhotoUpload}
                                        onPhotoUploadToggle={() => setShowPhotoUpload(!showPhotoUpload)}
                                        onSuccess={() => {
                                            setEditPanelOpen(false);
                                            toast.info("Changes saved (preview mode)");
                                        }}
                                        onCancel={() => {
                                            setEditPanelOpen(false);
                                        }}
                                    />
                                )}
                            </div>
                        </SheetContent>
                    </Sheet>
                </>
            )}

            {/* Save Panel - Note: /map page uses RightSidebar component, but basic panel shown here */}
            <Sheet open={savePanelOpen} onOpenChange={setSavePanelOpen}>
                <SheetContent className="w-full sm:max-w-2xl overflow-y-auto p-0">
                    {/* Simple Header */}
                    <div className="flex items-center justify-between px-3 py-2 border-b sticky top-0 bg-background z-10">
                        <SheetTitle className="text-base">Save Location</SheetTitle>
                        <div className="flex items-center gap-1">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setSavePanelOpen(false)}
                                className="shrink-0 h-8 w-8"
                            >
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                    
                    {/* Panel Content */}
                    <div className="p-3">
                        <SaveLocationPanel
                            initialData={{
                                lat: 40.7128,
                                lng: -74.0060,
                                name: 'New Test Location',
                                address: 'Click map to set location',
                                isFavorite: isFavorite,
                                indoorOutdoor: indoorOutdoor,
                            }}
                            onSuccess={() => {
                                setSavePanelOpen(false);
                                toast.info("Changes saved (preview mode)");
                            }}
                            onCancel={() => setSavePanelOpen(false)}
                            showPhotoUpload={showPhotoUpload}
                        />
                    </div>
                </SheetContent>
            </Sheet>
        </AdminRoute>
    );
}
