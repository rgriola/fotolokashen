/**
 * MAP PAGE - Main Interactive Map View (Orchestrator)
 *
 * Displays an interactive Google Map with saved/public locations, GPS,
 * clustering, search, and detail panels.
 *
 * Logic is decomposed into custom hooks:
 * - useMapMarkers: marker state, populate from API, geocoding, deduplication
 * - useMapNavigation: map instance, initial fit-bounds, URL params, pan utilities
 * - useGpsHandlers: GPS state, permission dialogs, user/home location clicks
 *
 * This orchestrator wires the hooks together with panel/sheet state and renders
 * the map, markers, InfoWindow, panels, sheets, and dialogs.
 */

'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { GoogleMap } from '@/components/maps/GoogleMap';
import { CustomMapControls } from '@/components/maps/CustomMapControls';
import { CustomMarker } from '@/components/maps/CustomMarker';
import { ClusteredMarkers } from '@/components/maps/ClusteredMarkers';
import { InfoWindow } from '@/components/maps/InfoWindow';
import { PlacesAutocomplete } from '@/components/maps/PlacesAutocomplete';
import { UserLocationMarker } from '@/components/maps/UserLocationMarker';
import { HomeLocationMarker } from '@/components/maps/HomeLocationMarker';
import { RightSidebar } from '@/components/layout/RightSidebar';
import { SaveLocationPanel } from '@/components/panels/SaveLocationPanel';
import { LocationDetailPanel } from '@/components/panels/LocationDetailPanel';
import { SavedLocationsPanel } from '@/components/panels/SavedLocationsPanel';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { LocationData } from '@/lib/maps-utils';
import { Location, Photo } from '@/types/location';
import type { PublicLocation } from '@/hooks/usePublicLocations';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { TOAST } from '@/lib/constants/messages';
import { GpsPermissionDialog } from '@/components/maps/GpsPermissionDialog';
import { GpsWelcomeBanner } from '@/components/maps/GpsWelcomeBanner';
import { MapControls } from '@/components/maps/MapControls';
import { FriendsDialog } from '@/components/map/FriendsDialog';
import { ShareLocationDialog } from '@/components/dialogs/ShareLocationDialog';
import { MapPin as MapPinIcon, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { VisuallyHidden } from '@/components/ui/visually-hidden';
import { OnboardingProvider } from '@/components/onboarding/OnboardingProvider';
import { WelcomeModal } from '@/components/onboarding/WelcomeModal';
import { CompletionModal } from '@/components/onboarding/CompletionModal';
import { OnboardingTour } from '@/components/onboarding/OnboardingTour';
import { TermsModal } from '@/components/onboarding/TermsModal';
import type { MarkerData, MapBounds } from './types';
import { useMapMarkers } from './useMapMarkers';
import { useGpsHandlers } from './useGpsHandlers';
import { useMapNavigation } from './useMapNavigation';
import { MapInfoWindowContent } from './MapInfoWindowContent';

function MapPageInner() {
    const { user } = useAuth();
    const router = useRouter();

    // --- Panel & Sheet State ---
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [sidebarView, setSidebarView] = useState<'save'>('save');
    const [locationToSave, setLocationToSave] = useState<MarkerData | null>(null);
    const [locationToEdit, setLocationToEdit] = useState<MarkerData | null>(null);
    const [showDetailsSheet, setShowDetailsSheet] = useState(false);
    const [isFavorite, setIsFavorite] = useState(false);
    const [indoorOutdoor, setIndoorOutdoor] = useState<"indoor" | "outdoor">("outdoor");
    const [showSearchDialog, setShowSearchDialog] = useState(false);
    const [showLocationsPanel, setShowLocationsPanel] = useState(false);
    const [showFriendsDialog, setShowFriendsDialog] = useState(false);
    const [shareLocation, setShareLocation] = useState<Location | null>(null);

    // --- Public Location Detail State ---
    const [showPublicLocations, setShowPublicLocations] = useState(true);
    const [showPublicDetailsSheet, setShowPublicDetailsSheet] = useState(false);
    const [selectedPublicLocation, setSelectedPublicLocation] = useState<PublicLocation | null>(null);
    const [publicLocationPhotos, setPublicLocationPhotos] = useState<Photo[]>([]);
    const [mapBounds, setMapBounds] = useState<MapBounds | null>(null);

    // --- Custom Hooks ---
    const {
        markers,
        setMarkers,
        selectedMarker,
        setSelectedMarker,
        createTemporaryMarkerFromClick,
        createTemporaryMarkerFromSearch,
        removeTemporaryMarkers,
        handleInfoWindowClose: hookInfoWindowClose,
        expandBounds,
    } = useMapMarkers({ showPublicLocations, mapBounds });

    const {
        map,
        handleMapLoad,
        panToWithOffset,
    } = useMapNavigation({
        markers,
        showPublicLocations,
        expandBounds,
        setMapBounds,
        onLocationFromUrl: (markerData) => {
            setLocationToEdit(markerData);
            setShowDetailsSheet(true);
            setIsSidebarOpen(false);
        },
    });

    const {
        userLocation,
        gpsEnabled,
        showGpsDialog,
        showWelcomeBanner,
        handleGPSClick,
        handleGpsPermissionConfirm,
        handleGpsPermissionCancel,
        handleWelcomeBannerEnable,
        handleWelcomeBannerDismiss,
        handleUserLocationClick,
        handleHomeLocationClick,
    } = useGpsHandlers(map);

    // Map center for GoogleMap initial render
    const [center, setCenter] = useState({ lat: 40.7128, lng: -74.006 });

    // --- Map Click Handler ---
    const handleMapClick = useCallback(async (event: google.maps.MapMouseEvent) => {
        if (!event.latLng) return;

        if (isSidebarOpen) {
            setIsSidebarOpen(false);
            setLocationToSave(null);
        }

        await createTemporaryMarkerFromClick(
            { lat: event.latLng.lat(), lng: event.latLng.lng() },
            map,
        );
    }, [map, isSidebarOpen, createTemporaryMarkerFromClick]);

    // --- Marker Click Handler ---
    const handleMarkerClick = useCallback((marker: MarkerData) => {
        // Public locations: show InfoWindow with owner info
        if (marker.isPublic) {
            setSelectedMarker(marker);
            if (map) {
                map.panTo(marker.position);
                if (map.getZoom()! < 16) {
                    map.setZoom(16);
                }
            }
            return;
        }

        // Saved markers: open Details Panel
        if (!marker.isTemporary && marker.userSave) {
            removeTemporaryMarkers();
            setSelectedMarker(null);
            setLocationToEdit(marker);
            setShowDetailsSheet(true);
            panToWithOffset(marker.position, 18);
        } else {
            // Temporary markers: show InfoWindow
            setSelectedMarker(marker);
            if (map) {
                map.panTo(marker.position);
                map.setZoom(17);
            }
        }
    }, [map, panToWithOffset, removeTemporaryMarkers, setSelectedMarker]);

    // --- Place Search Handler ---
    const handlePlaceSelected = useCallback((place: LocationData) => {
        if (isSidebarOpen) {
            setIsSidebarOpen(false);
            setLocationToSave(null);
        }

        const newMarker = createTemporaryMarkerFromSearch(place);
        setCenter(newMarker.position);

        if (map) {
            map.setOptions({ center: newMarker.position, zoom: 16 });
        }
    }, [map, isSidebarOpen, createTemporaryMarkerFromSearch]);

    // --- InfoWindow Close (supplemented with sidebar close) ---
    const handleInfoWindowCloseWithPanel = useCallback(() => {
        hookInfoWindowClose();
        if (isSidebarOpen) {
            setIsSidebarOpen(false);
            setLocationToSave(null);
        }
    }, [hookInfoWindowClose, isSidebarOpen]);

    // --- InfoWindow Button Handlers ---
    const handleViewPublicDetails = useCallback(async () => {
        if (!selectedMarker?.publicLocationRaw) return;
        const loc = selectedMarker.publicLocationRaw;
        setSelectedPublicLocation(loc);
        setPublicLocationPhotos([]);
        setShowPublicDetailsSheet(true);

        try {
            const res = await fetch(`/api/locations/${loc.id}/photos?limit=100`, { credentials: 'include' });
            if (res.ok) {
                const data = await res.json();
                setPublicLocationPhotos(data.photos || []);
            }
        } catch {
            // Fall back to single primary photo already on the marker
        }

        panToWithOffset(selectedMarker.position, 18);
    }, [selectedMarker, panToWithOffset]);

    const handleViewSavedDetails = useCallback(() => {
        if (!selectedMarker) return;
        setLocationToEdit(selectedMarker);
        setShowDetailsSheet(true);
        panToWithOffset(selectedMarker.position, 18);
    }, [selectedMarker, panToWithOffset]);

    const handleSaveFromInfoWindow = useCallback(() => {
        if (!selectedMarker) return;
        setLocationToSave(selectedMarker);
        setSidebarView('save');
        setIsSidebarOpen(true);

        // Pan map to adjust for panel covering right side (desktop only)
        if (map && typeof window !== 'undefined') {
            const isDesktop = window.innerWidth >= 1024;
            if (isDesktop) {
                const PANEL_WIDTH = window.innerWidth / 2;
                setTimeout(() => {
                    map.panBy(PANEL_WIDTH / 2, 0);
                }, 100);
            }
        }
    }, [selectedMarker, map]);

    // --- View All / Fit Bounds ---
    const handleViewAll = useCallback(() => {
        if (!map) return;
        const savedMarkers = markers.filter(m => !m.isTemporary);
        if (savedMarkers.length === 0) {
            toast.info(TOAST.LOCATION.NONE_SAVED);
            return;
        }
        const bounds = new google.maps.LatLngBounds();
        savedMarkers.forEach(marker => bounds.extend(marker.position));
        map.fitBounds(bounds);
        setTimeout(() => {
            if (map.getZoom()! > 16) {
                map.setZoom(16);
            }
        }, 100);
    }, [map, markers]);

    // --- Sidebar Close ---
    const handleSidebarClose = useCallback(() => {
        // Pan map back to center when closing (reverse the offset)
        if (map && typeof window !== 'undefined') {
            const isDesktop = window.innerWidth >= 1024;
            if (isDesktop) {
                const PANEL_WIDTH = window.innerWidth / 2;
                map.panBy(-PANEL_WIDTH / 2, 0);
            }
        }
        setIsSidebarOpen(false);
        setLocationToSave(null);
        setLocationToEdit(null);
        setIsFavorite(false);
        setIndoorOutdoor("outdoor");
    }, [map]);

    // --- Location Delete ---
    const handleLocationDelete = useCallback(async (id: number) => {
        try {
            const response = await fetch(`/api/locations/${id}`, { method: 'DELETE' });
            if (response.ok) {
                setShowDetailsSheet(false);
                setLocationToEdit(null);
                setMarkers(prev => prev.filter(m => m.userSave?.id !== id));
                toast.success(TOAST.LOCATION.DELETED);
            } else {
                toast.error(TOAST.LOCATION.DELETE_FAILED);
            }
        } catch (error) {
            console.error('Delete error:', error);
            toast.error(TOAST.LOCATION.DELETE_FAILED);
        }
    }, [setMarkers]);

    // --- Save Panel Initial Data ---
    const saveLocationInitialData = useMemo(() => {
        if (!locationToSave) return null;
        return {
            placeId: locationToSave.data?.placeId || locationToSave.id,
            name: locationToSave.data?.name || 'Selected Location',
            address: locationToSave.data?.address,
            lat: locationToSave.position.lat,
            lng: locationToSave.position.lng,
            street: locationToSave.data?.street,
            number: locationToSave.data?.number,
            city: locationToSave.data?.city,
            state: locationToSave.data?.state,
            zipcode: locationToSave.data?.zipcode,
            isFavorite: isFavorite,
            indoorOutdoor: indoorOutdoor,
        };
    }, [locationToSave, isFavorite, indoorOutdoor]);

    const rightPanelOpen = isSidebarOpen || showDetailsSheet || showLocationsPanel || showPublicDetailsSheet;

    return (
        <div className="fixed inset-0 top-16 flex flex-col">
            {/* Map Container */}
            <div className="flex-1 relative">
                <GoogleMap
                    center={center}
                    zoom={12}
                    onMapLoad={handleMapLoad}
                    onClick={handleMapClick}
                    className="w-full h-full"
                >
                    {/* User location blue dot - only show when GPS is enabled */}
                    {gpsEnabled && (
                        <UserLocationMarker
                            position={userLocation}
                            onClick={() => handleUserLocationClick(setSelectedMarker)}
                        />
                    )}

                    {/* Home location marker (house icon) */}
                    {user?.homeLocationLat && user?.homeLocationLng && (
                        <HomeLocationMarker
                            position={{
                                lat: user.homeLocationLat,
                                lng: user.homeLocationLng,
                            }}
                            name={user.homeLocationName || undefined}
                            onClick={() => handleHomeLocationClick(map, setSelectedMarker, removeTemporaryMarkers)}
                        />
                    )}

                    {/* Render temporary markers (not clustered) */}
                    {markers.filter(m => m.isTemporary).map((marker) => (
                        <CustomMarker
                            key={marker.id}
                            position={marker.position}
                            title={marker.data?.name || 'Custom location'}
                            onClick={() => handleMarkerClick(marker)}
                            isTemporary={true}
                            color={marker.color || '#EF4444'}
                        />
                    ))}

                    {/* Render saved markers (clustered) */}
                    <ClusteredMarkers
                        map={map}
                        markers={markers.filter(m => !m.isTemporary).map(marker => ({
                            position: marker.position,
                            title: marker.data?.name || 'Saved location',
                            color: marker.color || '#EF4444',
                            onClick: () => handleMarkerClick(marker),
                        }))}
                    />

                    {/* Render info window for selected marker */}
                    {selectedMarker && (
                        <InfoWindow
                            position={selectedMarker.position}
                            onClose={handleInfoWindowCloseWithPanel}
                        >
                            <MapInfoWindowContent
                                marker={selectedMarker}
                                onViewPublicDetails={handleViewPublicDetails}
                                onViewSavedDetails={handleViewSavedDetails}
                                onSaveLocation={handleSaveFromInfoWindow}
                            />
                        </InfoWindow>
                    )}
                </GoogleMap>

                {/* GPS Coordinates Display - Top Right, to the left of map controls */}
                <div 
                    className={`
                        fixed top-20 z-10
                        bg-black/50 text-white px-3 py-2 rounded-lg text-sm font-medium shadow-lg
                        transition-all duration-300 ease-in-out
                        ${rightPanelOpen ? 'right-[calc(50%+14rem)]' : 'right-56'}
                    `}
                >
                    {gpsEnabled && userLocation ? (
                        <div className="flex gap-3">
                            <span>Lat: {userLocation.lat.toFixed(3)}</span>
                            <span>Lng: {userLocation.lng.toFixed(3)}</span>
                        </div>
                    ) : (
                        <div>Toggle GPS</div>
                    )}
                </div>

                {/* Custom Map Controls - Top Right (Map type + Zoom) */}
                <CustomMapControls 
                    map={map}
                    rightPanelOpen={rightPanelOpen}
                />

                {/* Map Controls - Responsive (Desktop: left-side vertical buttons, Mobile: bottom floating menu) */}
                <MapControls
                    userLocation={userLocation}
                    onGpsToggle={handleGPSClick}
                    onSearchClick={() => setShowSearchDialog(true)}
                    hideMobileButton={isSidebarOpen}
                    onFriendsClick={() => setShowFriendsDialog(true)}
                    onViewAllClick={handleViewAll}
                    onMyLocationsClick={() => setShowLocationsPanel(true)}
                    onPublicToggle={(showPublic) => setShowPublicLocations(showPublic)}
                    showPublicLocations={showPublicLocations}
                    savedLocationsCount={markers.filter(m => !m.isTemporary && !m.isPublic).length}
                />

                {/* Locations Panel - Slide in from right, same width as save/edit panels */}
                {showLocationsPanel && (
                    <div className="absolute top-0 right-0 h-full w-full sm:w-1/2 bg-white shadow-2xl z-20 flex flex-col animate-in slide-in-from-right">
                        {/* Panel Header */}
                        <div className="flex items-center justify-between p-3 border-b bg-muted">
                            <h3 className="font-semibold text-lg flex items-center gap-2">
                                <MapPinIcon className="w-5 h-5" />
                                My Locations
                            </h3>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowLocationsPanel(false)}
                            >
                                <X className="w-4 h-4" />
                            </Button>
                        </div>

                        {/* Panel Content - SavedLocationsPanel */}
                        <SavedLocationsPanel
                            onLocationClick={(location) => {
                                setShowLocationsPanel(false);

                                const markerData = {
                                    id: location.placeId,
                                    position: { lat: location.lat, lng: location.lng },
                                    data: {
                                        placeId: location.placeId,
                                        name: location.name,
                                        address: location.address,
                                        type: location.type,
                                        rating: location.rating,
                                        street: location.street,
                                        number: location.number,
                                        city: location.city,
                                        state: location.state,
                                        zipcode: location.zipcode,
                                        productionNotes: location.productionNotes,
                                        entryPoint: location.entryPoint,
                                        parking: location.parking,
                                        access: location.access,
                                        indoorOutdoor: location.indoorOutdoor,
                                        isPermanent: location.isPermanent,
                                        photoUrls: location.photoUrls,
                                        permitRequired: location.permitRequired,
                                        permitCost: location.permitCost,
                                        contactPerson: location.contactPerson,
                                        contactPhone: location.contactPhone,
                                        operatingHours: location.operatingHours,
                                        restrictions: location.restrictions,
                                        bestTimeOfDay: location.bestTimeOfDay,
                                    },
                                    userSave: location.userSave,
                                };

                                setLocationToEdit(markerData as unknown as MarkerData);
                                setShowDetailsSheet(true);
                                panToWithOffset({ lat: location.lat, lng: location.lng }, 18);
                            }}
                            onShare={(location) => {
                                setShareLocation(location);
                            }}
                        />
                    </div>
                )}
            </div>

            {/* Right Sidebar - Save Location */}
            <RightSidebar
                isOpen={isSidebarOpen}
                onClose={handleSidebarClose}
                view='save-location'
                title='Save Location'
                showFavorite={false}
                isFavorite={isFavorite}
                onFavoriteToggle={() => setIsFavorite(!isFavorite)}
                showIndoorOutdoor={false}
                indoorOutdoor={indoorOutdoor}
                onIndoorOutdoorToggle={(value) => setIndoorOutdoor(value)}
                showSaveButton={false}
            >
                {/* Save Location Panel */}
                {sidebarView === 'save' && locationToSave && saveLocationInitialData && (
                    <SaveLocationPanel
                        initialData={saveLocationInitialData}
                        onSuccess={() => {
                            setIsSidebarOpen(false);
                            setMarkers((prev) =>
                                prev.map((m) =>
                                    m.id === locationToSave.id
                                        ? { ...m, isTemporary: false }
                                        : m
                                )
                            );
                            setSelectedMarker(null);
                            setLocationToSave(null);
                        }}
                        showPhotoUpload={true}
                    />
                )}
            </RightSidebar>

            {/* Location Details Sheet */}
            <Sheet open={showDetailsSheet} onOpenChange={setShowDetailsSheet}>
                <SheetContent className="w-full sm:w-1/2 p-0" hideOverlay={true}>
                    <SheetHeader>
                        <VisuallyHidden>
                            <SheetTitle>
                                {locationToEdit?.data?.name || locationToEdit?.userSave?.location?.name || "Location Details"}
                            </SheetTitle>
                        </VisuallyHidden>
                    </SheetHeader>
                    <div className="h-full">
                        {locationToEdit?.userSave?.location && locationToEdit?.position && (
                            <LocationDetailPanel
                                location={{
                                    id: locationToEdit.userSave.locationId,
                                    placeId: locationToEdit.data?.placeId || locationToEdit.id,
                                    name: locationToEdit.data?.name || 'Selected Location',
                                    address: locationToEdit.data?.address ?? null,
                                    lat: locationToEdit.position?.lat ?? 0,
                                    lng: locationToEdit.position?.lng ?? 0,
                                    type: locationToEdit.data?.type || locationToEdit.userSave.location?.type || '',
                                    rating: locationToEdit.data?.rating ?? null,
                                    street: locationToEdit.data?.street ?? null,
                                    number: locationToEdit.data?.number ?? null,
                                    city: locationToEdit.data?.city ?? null,
                                    state: locationToEdit.data?.state ?? null,
                                    zipcode: locationToEdit.data?.zipcode ?? null,
                                    productionDate: locationToEdit.userSave.location?.productionDate ?? null,
                                    productionNotes: locationToEdit.userSave.location?.productionNotes ?? null,
                                    entryPoint: locationToEdit.userSave.location?.entryPoint ?? null,
                                    parking: locationToEdit.userSave.location?.parking ?? null,
                                    access: locationToEdit.userSave.location?.access ?? null,
                                    indoorOutdoor: locationToEdit.userSave.location?.indoorOutdoor ?? null,
                                    isPermanent: locationToEdit.userSave.location?.isPermanent ?? false,
                                    photoUrls: locationToEdit.userSave.location?.photoUrls ?? null,
                                    permitRequired: locationToEdit.userSave.location?.permitRequired ?? false,
                                    permitCost: locationToEdit.userSave.location?.permitCost ?? null,
                                    contactPerson: locationToEdit.userSave.location?.contactPerson ?? null,
                                    contactPhone: locationToEdit.userSave.location?.contactPhone ?? null,
                                    operatingHours: locationToEdit.userSave.location?.operatingHours ?? null,
                                    restrictions: locationToEdit.userSave.location?.restrictions ?? null,
                                    bestTimeOfDay: locationToEdit.userSave.location?.bestTimeOfDay ?? null,
                                    lastModifiedBy: locationToEdit.userSave.location?.lastModifiedBy ?? null,
                                    lastModifiedAt: locationToEdit.userSave.location?.lastModifiedAt ?? null,
                                    createdAt: locationToEdit.userSave.location?.createdAt || new Date(),
                                    updatedAt: locationToEdit.userSave.location?.updatedAt || new Date(),
                                    createdBy: locationToEdit.userSave.location?.createdBy || 0,
                                    photos: locationToEdit.userSave.location?.photos ?? [],
                                    userSave: locationToEdit.userSave,
                                }}
                                source="user"
                                canEdit={
                                    user?.isAdmin ||
                                    user?.role === 'staffer' ||
                                    user?.role === 'super_admin' ||
                                    (locationToEdit.userSave.location?.createdBy === user?.id)
                                }
                                onEdit={() => {
                                    const userSaveId = locationToEdit.userSave?.id;
                                    if (userSaveId) {
                                        router.push(`/locations?edit=${userSaveId}`);
                                    } else {
                                        router.push('/locations');
                                    }
                                    setShowDetailsSheet(false);
                                }}
                                onDelete={handleLocationDelete}
                                onShare={(location) => {
                                    setShareLocation({
                                        ...location,
                                        userSave: locationToEdit.userSave,
                                    } as Location);
                                }}
                                onViewOnMap={() => {
                                    setShowDetailsSheet(false);
                                }}
                            />
                        )}
                    </div>
                </SheetContent>
            </Sheet>

            {/* Public Location Details Sheet */}
            <Sheet open={showPublicDetailsSheet} onOpenChange={setShowPublicDetailsSheet}>
                <SheetContent className="w-full sm:w-1/2 p-0" hideOverlay={true} hideCloseButton={true}>
                    <SheetHeader>
                        <VisuallyHidden>
                            <SheetTitle>
                                {selectedPublicLocation?.name || 'Location Details'}
                            </SheetTitle>
                        </VisuallyHidden>
                    </SheetHeader>
                    <div className="flex-1 min-h-0 overflow-hidden">
                        {selectedPublicLocation && (
                            <LocationDetailPanel
                                location={{
                                    id: selectedPublicLocation.id,
                                    placeId: selectedPublicLocation.placeId || '',
                                    name: selectedPublicLocation.name,
                                    address: selectedPublicLocation.address,
                                    lat: selectedPublicLocation.lat,
                                    lng: selectedPublicLocation.lng,
                                    type: selectedPublicLocation.type || '',
                                    rating: selectedPublicLocation.rating,
                                    street: null,
                                    number: null,
                                    city: selectedPublicLocation.city,
                                    state: selectedPublicLocation.state,
                                    zipcode: null,
                                    productionDate: null,
                                    productionNotes: null,
                                    entryPoint: null,
                                    parking: null,
                                    access: null,
                                    indoorOutdoor: null,
                                    isPermanent: false,
                                    photoUrls: null,
                                    permitRequired: false,
                                    permitCost: null,
                                    contactPerson: null,
                                    contactPhone: null,
                                    operatingHours: null,
                                    restrictions: null,
                                    bestTimeOfDay: null,
                                    createdBy: selectedPublicLocation.user.id,
                                    lastModifiedBy: null,
                                    lastModifiedAt: null,
                                    createdAt: selectedPublicLocation.savedAt ? new Date(selectedPublicLocation.savedAt) : new Date(),
                                    updatedAt: new Date(),
                                    photos: publicLocationPhotos.length > 0
                                        ? publicLocationPhotos
                                        : selectedPublicLocation.photos.map((p, i) => ({
                                            id: i,
                                            placeId: '',
                                            userId: selectedPublicLocation.user.id,
                                            imagekitFileId: '',
                                            imagekitFilePath: p.imagekitFilePath,
                                            originalFilename: '',
                                            fileSize: null,
                                            mimeType: null,
                                            width: null,
                                            height: null,
                                            isPrimary: i === 0,
                                            caption: null,
                                            uploadedAt: new Date(),
                                        })),
                                    userSave: {
                                        id: selectedPublicLocation.id,
                                        userId: selectedPublicLocation.user.id,
                                        locationId: selectedPublicLocation.id,
                                        savedAt: selectedPublicLocation.savedAt ? new Date(selectedPublicLocation.savedAt) : new Date(),
                                        caption: selectedPublicLocation.caption,
                                        tags: null,
                                        isFavorite: false,
                                        personalRating: null,
                                        visitedAt: null,
                                        color: null,
                                        visibility: 'public',
                                        user: selectedPublicLocation.user,
                                    },
                                }}
                                source="public"
                                canEdit={false}
                                onClose={() => setShowPublicDetailsSheet(false)}
                                onViewOnMap={() => setShowPublicDetailsSheet(false)}
                            />
                        )}
                    </div>
                </SheetContent>
            </Sheet>

            {/* GPS Permission Dialog */}
            <GpsPermissionDialog
                open={showGpsDialog}
                onConfirm={handleGpsPermissionConfirm}
                onCancel={handleGpsPermissionCancel}
            />

            {/* GPS Welcome Banner (First Visit) */}
            {showWelcomeBanner && (
                <GpsWelcomeBanner
                    onEnable={handleWelcomeBannerEnable}
                    onDismiss={handleWelcomeBannerDismiss}
                />
            )}

            {/* Floating Search Bar - Appears above buttons */}
            {showSearchDialog && (
                <div className="absolute top-20 left-20 w-100 max-w-[calc(100vw-6rem)] z-20 animate-in slide-in-from-left">
                    <div className="bg-white rounded-lg shadow-2xl border border-border p-3">
                        <div className="flex items-center gap-2">
                            <div className="flex-1">
                                <PlacesAutocomplete
                                    onPlaceSelected={(place) => {
                                        handlePlaceSelected(place);
                                        setShowSearchDialog(false);
                                    }}
                                    placeholder="Search Google Maps..."
                                />
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setShowSearchDialog(false)}
                                className="shrink-0"
                            >
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Friends Dialog */}
            <FriendsDialog 
                open={showFriendsDialog} 
                onOpenChange={setShowFriendsDialog}
            />

            {/* Share Location Dialog */}
            <ShareLocationDialog
                open={!!shareLocation}
                onOpenChange={(open) => !open && setShareLocation(null)}
                location={shareLocation}
            />
        </div>
    );
}

function MapPageContent() {
    const { user } = useAuth();
    const [userOnboardingStatus, setUserOnboardingStatus] = useState<{
        onboardingCompleted: boolean;
        onboardingSkipped: boolean;
        onboardingStep: number | null;
        termsAccepted: boolean;
    } | null>(null);

    // Fetch user onboarding status
    useEffect(() => {
        if (user?.id) {
            fetch('/api/v1/users/me', {
                credentials: 'include',
            })
                .then(res => res.json())
                .then(data => {
                    if (data.user) {
                        setUserOnboardingStatus({
                            onboardingCompleted: data.user.onboardingCompleted ?? false,
                            onboardingSkipped: data.user.onboardingSkipped ?? false,
                            onboardingStep: data.user.onboardingStep ?? null,
                            termsAccepted: !!data.user.termsAcceptedAt,
                        });
                    }
                })
                .catch(err => console.error('Failed to fetch onboarding status:', err));
        }
    }, [user?.id]);

    return (
        <ProtectedRoute>
            <OnboardingProvider userOnboardingStatus={userOnboardingStatus ?? undefined}>
                <MapPageInner />
                <TermsModal />
                <WelcomeModal />
                <CompletionModal />
                <OnboardingTour />
            </OnboardingProvider>
        </ProtectedRoute>
    );
}

export default MapPageContent;
