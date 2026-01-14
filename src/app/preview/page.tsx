'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShareLocationDialog } from '@/components/locations/ShareLocationDialog';
import { EditLocationDialog } from '@/components/locations/EditLocationDialog';
import { Settings, Share2, Edit, Eye, MapPin, Loader2 } from 'lucide-react';
import type { Location } from '@/types/location';
import { toast } from 'sonner';

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
    const [locations, setLocations] = useState<Location[]>([]);
    const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
    const [isLoading, setIsLoading] = useState(true);

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

    const handleOpenShare = (location: Location) => {
        setSelectedLocation(location);
        setShareDialogOpen(true);
    };

    const handleOpenEdit = (location: Location) => {
        setSelectedLocation(location);
        setEditDialogOpen(true);
    };

    return (
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
                                            className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                                        >
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-semibold truncate">{location.name}</h4>
                                                <p className="text-sm text-muted-foreground truncate">
                                                    {location.address || (location.lat && location.lng ? `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}` : 'No address')}
                                                </p>
                                            </div>
                                            <div className="flex gap-2 ml-4">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleOpenShare(location)}
                                                    className="gap-1"
                                                >
                                                    <Share2 className="w-3 h-3" />
                                                    Share
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleOpenEdit(location)}
                                                    className="gap-1"
                                                >
                                                    <Edit className="w-3 h-3" />
                                                    Edit
                                                </Button>
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
                                Test with Mock Data
                            </CardTitle>
                            <CardDescription>
                                Use mock location data if you don't have saved locations
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex flex-wrap gap-3">
                                <Button
                                    onClick={() => {
                                        setSelectedLocation(mockLocation);
                                        setShareDialogOpen(true);
                                    }}
                                    className="gap-2"
                                >
                                    <Share2 className="w-4 h-4" />
                                    Open Share Dialog (Mock)
                                </Button>

                                <Button
                                    onClick={() => {
                                        setSelectedLocation(mockLocation);
                                        setEditDialogOpen(true);
                                    }}
                                    variant="outline"
                                    className="gap-2"
                                >
                                    <Edit className="w-4 h-4" />
                                    Open Edit Dialog (Mock)
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

            {/* Modal Components */}
            <ShareLocationDialog
                location={selectedLocation || mockLocation}
                open={shareDialogOpen}
                onOpenChange={setShareDialogOpen}
            />

            <EditLocationDialog
                location={selectedLocation || mockLocation}
                open={editDialogOpen}
                onOpenChange={setEditDialogOpen}
            />
        </div>
    );
}
