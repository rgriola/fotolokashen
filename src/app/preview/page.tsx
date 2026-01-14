'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShareLocationDialog } from '@/components/locations/ShareLocationDialog';
import { EditLocationDialog } from '@/components/locations/EditLocationDialog';
import { SaveLocationDialog } from '@/components/locations/SaveLocationDialog';
import { LocationDetailModal } from '@/components/locations/LocationDetailModal';
import { Settings, Share2, Edit, Eye, MapPin, Loader2, Save, Info, FileEdit, PanelLeft, Heart, Sun, Building, Camera, X } from 'lucide-react';
import type { Location } from '@/types/location';
import { toast } from 'sonner';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { SaveLocationPanel } from '@/components/panels/SaveLocationPanel';
import { EditLocationPanel } from '@/components/panels/EditLocationPanel';
import { LocationList } from '@/components/locations/LocationList';
import { AdminRoute } from '@/components/auth/AdminRoute';

// Mock location data for testing
const mockLocation: Location = {
    id: 1,
    placeId: 'test-place-id-123',
    name: 'Test Location',
    address: '123 Test Street, Test City, TC 12345',
    lat: 40.7128,
    lng: -74.0060,
    type: 'RESTAURANT',
    rating: 4.5,
    street: '123 Test Street',
    number: '123',
    city: 'Test City',
    state: 'TC',
    zipcode: '12345',
    productionNotes: null,
    entryPoint: null,
    parking: null,
    access: null,
    photoUrls: null,
    isPermanent: true,
    permitRequired: false,
    permitCost: null,
    contactPerson: null,
    contactPhone: null,
    operatingHours: null,
    restrictions: null,
    bestTimeOfDay: null,
    createdBy: 1,
    lastModifiedBy: null,
    lastModifiedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    indoorOutdoor: 'outdoor',
    userSave: {
        id: 1,
        userId: 1,
        locationId: 1,
        isFavorite: true,
        personalRating: 5,
        visitedAt: new Date(),
        savedAt: new Date(),
        caption: 'Great place to visit!',
        tags: ['favorite', 'tested'],
        color: '#FF5733',
        visibility: 'public',
    },
};

export default function PreviewPage() {
    const [shareDialogOpen, setShareDialogOpen] = useState(false);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [saveDialogOpen, setSaveDialogOpen] = useState(false);
    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const [savePanelOpen, setSavePanelOpen] = useState(false);
    const [editPanelOpen, setEditPanelOpen] = useState(false);
    const [showGridView, setShowGridView] = useState(false);
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
                    const transformedLocations = (data.locations || []).map((userSave: any) => ({
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
                <div className="container max-w-4xl mx-auto space-y-8">
                {/* Header */}
                <div className="space-y-2">
                    <h1 className="text-4xl font-bold tracking-tight">Component Preview</h1>
                    <p className="text-muted-foreground">
                        Test and preview modals and components in isolation
                    </p>
                </div>

                {/* Preview Section */}
                <div className="grid gap-6">
                    {/* My Locations List */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <MapPin className="w-5 h-5" />
                                My Locations
                            </CardTitle>
                            <CardDescription>
                                Select a location to test the Share or Edit dialogs
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
                                    <p className="text-sm">Go to the map or locations page to save some locations</p>
                                </div>
                            ) : (
                                <div className="space-y-2 max-h-96 overflow-y-auto">
                                    {locations.map((location) => (
                                        <div
                                            key={location.id}
                                            className="flex items-start justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                                        >
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-semibold truncate">{location.name}</h4>
                                                <p className="text-sm text-muted-foreground truncate">
                                                    {location.address || (location.lat && location.lng ? `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}` : 'No address')}
                                                </p>
                                            </div>
                                            <div className="flex flex-col gap-1.5 ml-4 flex-shrink-0">
                                                <div className="flex gap-1.5">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => {
                                                            setSelectedLocation(location);
                                                            setShareDialogOpen(true);
                                                        }}
                                                        className="gap-1 h-7 text-xs"
                                                        title="ShareLocationDialog"
                                                    >
                                                        <Share2 className="w-3 h-3" />
                                                        Share
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => {
                                                            setSelectedLocation(location);
                                                            setDetailModalOpen(true);
                                                        }}
                                                        className="gap-1 h-7 text-xs"
                                                        title="LocationDetailModal"
                                                    >
                                                        <Info className="w-3 h-3" />
                                                        Detail
                                                    </Button>
                                                </div>
                                                <div className="flex gap-1.5">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => {
                                                            setSelectedLocation(location);
                                                            setEditDialogOpen(true);
                                                        }}
                                                        className="gap-1 h-7 text-xs"
                                                        title="EditLocationDialog"
                                                    >
                                                        <Edit className="w-3 h-3" />
                                                        Edit Dialog
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => {
                                                            setSelectedLocation(location);
                                                            setIsFavorite(location.userSave?.isFavorite || false);
                                                            setIndoorOutdoor((location.indoorOutdoor as "indoor" | "outdoor") || "outdoor");
                                                            setShowPhotoUpload(false);
                                                            setEditPanelOpen(true);
                                                        }}
                                                        className="gap-1 h-7 text-xs"
                                                        title="EditLocationPanel"
                                                    >
                                                        <PanelLeft className="w-3 h-3" />
                                                        Edit Panel
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Location Modals */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Eye className="w-5 h-5" />
                                Location Views
                            </CardTitle>
                            <CardDescription>
                                Test different location view layouts and pages
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex flex-wrap gap-3">
                                <Button
                                    onClick={() => setShowGridView(true)}
                                    variant="outline"
                                    className="gap-2"
                                    title="/locations - Grid View"
                                >
                                    <Eye className="w-4 h-4" />
                                    Grid View (/locations)
                                </Button>

                                <Button
                                    onClick={() => {
                                        if (locations.length > 0) {
                                            // Use the first location to construct the URL
                                            const firstLocation = locations[0];
                                            const username = 'admin'; // You can replace this with actual username from session
                                            window.open(`/@${username}/locations/${firstLocation.id}`, '_blank');
                                        } else {
                                            toast.error('No locations available. Save a location first.');
                                        }
                                    }}
                                    variant="outline"
                                    className="gap-2"
                                    title="/@username/locations/[id] - Public Location Page"
                                    disabled={locations.length === 0}
                                >
                                    <MapPin className="w-4 h-4" />
                                    Public Location Page
                                    {locations.length > 0 && (
                                        <span className="text-xs text-muted-foreground">
                                            (opens /@admin/locations/{locations[0].id})
                                        </span>
                                    )}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Save Location Components */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Eye className="w-5 h-5" />
                                Save Location Components
                            </CardTitle>
                            <CardDescription>
                                Test SaveLocationDialog and SaveLocationPanel
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex flex-wrap gap-3">
                                <Button
                                    onClick={() => {
                                        setIsFavorite(false);
                                        setIndoorOutdoor("outdoor");
                                        setShowPhotoUpload(false);
                                        setSaveDialogOpen(true);
                                    }}
                                    className="gap-2"
                                    title="SaveLocationDialog"
                                >
                                    <Save className="w-4 h-4" />
                                    Save Dialog
                                </Button>

                                <Button
                                    onClick={() => {
                                        setIsFavorite(false);
                                        setIndoorOutdoor("outdoor");
                                        setShowPhotoUpload(false);
                                        setSavePanelOpen(true);
                                    }}
                                    variant="outline"
                                    className="gap-2"
                                    title="SaveLocationPanel"
                                >
                                    <PanelLeft className="w-4 h-4" />
                                    Save Panel
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Mock Data Testing */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileEdit className="w-5 h-5" />
                                Test with Mock Data
                            </CardTitle>
                            <CardDescription>
                                Use mock location data for testing all modals
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-2">
                                <Button
                                    onClick={() => {
                                        setSelectedLocation(mockLocation);
                                        setShareDialogOpen(true);
                                    }}
                                    variant="outline"
                                    className="gap-2"
                                    title="ShareLocationDialog"
                                >
                                    <Share2 className="w-4 h-4" />
                                    Share Dialog
                                </Button>

                                <Button
                                    onClick={() => {
                                        setSelectedLocation(mockLocation);
                                        setDetailModalOpen(true);
                                    }}
                                    variant="outline"
                                    className="gap-2"
                                    title="LocationDetailModal"
                                >
                                    <Info className="w-4 h-4" />
                                    Detail Modal
                                </Button>

                                <Button
                                    onClick={() => {
                                        setSelectedLocation(mockLocation);
                                        setEditDialogOpen(true);
                                    }}
                                    variant="outline"
                                    className="gap-2"
                                    title="EditLocationDialog"
                                >
                                    <Edit className="w-4 h-4" />
                                    Edit Dialog
                                </Button>

                                <Button
                                    onClick={() => {
                                        setSelectedLocation(mockLocation);
                                        setIsFavorite(mockLocation.userSave?.isFavorite || false);
                                        setIndoorOutdoor((mockLocation.indoorOutdoor as "indoor" | "outdoor") || "outdoor");
                                        setShowPhotoUpload(false);
                                        setEditPanelOpen(true);
                                    }}
                                    variant="outline"
                                    className="gap-2"
                                    title="EditLocationPanel"
                                >
                                    <PanelLeft className="w-4 h-4" />
                                    Edit Panel
                                </Button>
                            </div>

                            {/* Mock Data Display */}
                            <div className="mt-6 p-4 bg-muted rounded-lg">
                                <h4 className="font-semibold mb-2 text-sm">Mock Location Data:</h4>
                                <pre className="text-xs overflow-auto">
                                    {JSON.stringify(
                                        {
                                            name: mockLocation.name,
                                            address: mockLocation.address,
                                            type: mockLocation.type,
                                            visibility: mockLocation.userSave?.visibility,
                                        },
                                        null,
                                        2
                                    )}
                                </pre>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Coming Soon Section */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Settings className="w-5 h-5" />
                                More Components
                            </CardTitle>
                            <CardDescription>
                                Additional components will be added here for testing
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">
                                You can add more modal and component previews to this page as needed.
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Usage Instructions */}
                <Card className="border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20">
                    <CardHeader>
                        <CardTitle className="text-blue-900 dark:text-blue-100">
                            Usage Instructions
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-blue-800 dark:text-blue-200 space-y-2">
                        <p>
                            <strong>Purpose:</strong> This page allows you to test modals and components
                            without navigating through the entire application.
                        </p>
                        <p>
                            <strong>How to use:</strong> Click the buttons above to open different modals.
                            You can test functionality, styling, and behavior in isolation.
                        </p>
                        <p>
                            <strong>Development:</strong> Add new component tests by importing the component
                            and adding a button to trigger it.
                        </p>
                    </CardContent>
                </Card>
            </div>
            </div>

            {/* Modal Components */}
            {selectedLocation && (
                <>
                    <ShareLocationDialog
                        location={selectedLocation}
                        open={shareDialogOpen}
                        onOpenChange={setShareDialogOpen}
                    />

                    <EditLocationDialog
                        location={selectedLocation}
                        open={editDialogOpen}
                        onOpenChange={setEditDialogOpen}
                    />

                    <LocationDetailModal
                        location={selectedLocation}
                        isOpen={detailModalOpen}
                        onClose={() => setDetailModalOpen(false)}
                    />

                    <Sheet open={editPanelOpen} onOpenChange={setEditPanelOpen}>
                        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto p-0">
                            {/* Custom Header with Controls (matching production) */}
                            <div className="flex items-center justify-between p-3 border-b sticky top-0 bg-background z-10">
                                <SheetTitle>Edit Location Panel</SheetTitle>
                                <div className="flex items-center gap-1">
                                    {/* Save Button (DISABLED - Preview Mode) */}
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => {
                                            toast.info('Save disabled in preview mode');
                                        }}
                                        disabled={false}
                                        className="shrink-0 bg-indigo-600 hover:bg-indigo-700 hover:text-white opacity-50 cursor-not-allowed"
                                        title="Save disabled in preview mode"
                                    >
                                        <Save className="w-4 h-4 text-white" />
                                    </Button>
                                    
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
                                        onClick={() => setEditPanelOpen(false)}
                                        className="shrink-0"
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
                                        onSuccess={() => {
                                            // Disabled in preview mode - no actual save occurs
                                            setEditPanelOpen(false);
                                            toast.info("Save disabled in preview mode");
                                        }}
                                        onCancel={() => setEditPanelOpen(false)}
                                    />
                                )}
                            </div>
                        </SheetContent>
                    </Sheet>
                </>
            )}

            {/* Save Location Components */}
            <SaveLocationDialog
                open={saveDialogOpen}
                onOpenChange={setSaveDialogOpen}
                initialData={mockLocation}
            />

            {/* Grid View Modal - /locations page */}
            <Sheet open={showGridView} onOpenChange={setShowGridView}>
                <SheetContent className="w-full sm:max-w-6xl overflow-y-auto p-0" side="bottom">
                    <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-background z-10">
                        <SheetTitle>Grid View - /locations Page</SheetTitle>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setShowGridView(false)}
                            className="shrink-0"
                        >
                            <X className="w-4 h-4" />
                        </Button>
                    </div>
                    <div className="p-6">
                        {locations.length > 0 ? (
                            <LocationList
                                locations={locations}
                                onClick={(location: Location) => {
                                    setSelectedLocation(location);
                                    setDetailModalOpen(true);
                                }}
                                onShare={(location: Location) => {
                                    setSelectedLocation(location);
                                    setShareDialogOpen(true);
                                }}
                                onEdit={(location: Location) => {
                                    setSelectedLocation(location);
                                    setEditDialogOpen(true);
                                }}
                                onDelete={(_id: number) => {
                                    toast.info('Delete disabled in preview mode');
                                }}
                            />
                        ) : (
                            <div className="text-center py-12 text-muted-foreground">
                                <MapPin className="w-16 h-16 mx-auto mb-4 opacity-50" />
                                <p className="text-lg">No locations to display</p>
                                <p className="text-sm mt-2">Save some locations to see them in grid view</p>
                            </div>
                        )}
                    </div>
                </SheetContent>
            </Sheet>

            {/* Save Panel */}
            <Sheet open={savePanelOpen} onOpenChange={setSavePanelOpen}>
                <SheetContent className="w-full sm:max-w-2xl overflow-y-auto p-0">
                    {/* Custom Header with Controls (matching production) */}
                    <div className="flex items-center justify-between p-3 border-b sticky top-0 bg-background z-10">
                        <SheetTitle>Save Location Panel</SheetTitle>
                        <div className="flex items-center gap-1">
                            {/* Save Button (DISABLED - Preview Mode) */}
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                    toast.info('Save disabled in preview mode');
                                }}
                                disabled={false}
                                className="shrink-0 bg-indigo-600 hover:bg-indigo-700 hover:text-white opacity-50 cursor-not-allowed"
                                title="Save disabled in preview mode"
                            >
                                <Save className="w-4 h-4 text-white" />
                            </Button>
                            
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
                                onClick={() => setSavePanelOpen(false)}
                                className="shrink-0"
                            >
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                    
                    {/* Panel Content */}
                    <div className="p-3">
                        <SaveLocationPanel
                            initialData={{
                                ...mockLocation,
                                isFavorite: isFavorite,
                                indoorOutdoor: indoorOutdoor,
                            }}
                            onSuccess={() => {
                                // Disabled in preview mode - no actual save occurs
                                setSavePanelOpen(false);
                                toast.info("Save disabled in preview mode");
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
