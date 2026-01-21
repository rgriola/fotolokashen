# Full Migration Implementation Plan - CONTINUATION NEEDED

## ✅ COMPLETED STEPS

### Phase 1: Cleanup
- ✅ Deleted `SaveLocationDialog.tsx` (unused component)
- ✅ Created `LocationDetailPanel.tsx` (new panel component)

### Phase 2: `/locations` Page Migration
- ✅ Updated imports to use Panels instead of Dialogs
- ✅ Added Sheet wrapper for Edit Panel
- ✅ Added Sheet wrapper for Detail Panel
- ✅ Added state management for panel controls (favorite, indoor/outdoor, photo upload)
- ✅ Wired up Detail Panel → Edit Panel flow

### Phase 3: `/map` Page Migration (PARTIALLY COMPLETE)
- ✅ Removed EditLocationPanel import
- ✅ Added LocationDetailPanel import
- ✅ Added `showDetailsSheet` state
- ✅ Updated marker click handler → opens Details instead of Edit
- ✅ Updated URL parameter handler → opens Details
- ✅ Updated InfoWindow "View" button → opens Details  
- ✅ Updated Saved Locations click → opens Details

## ❌ REMAINING WORK

### `/map` Page - Need to Complete
The `/map` page has compile errors that need fixing:

**File:** `/Users/rgriola/Desktop/01_Vibecode/fotolokashen/src/app/map/page.tsx`

**Issues:**
1. Lines 1097-1178: Remove entire `Edit Location Panel` section (lines 1122-1178)
2. After RightSidebar closing tag (line 1179), add Details Sheet

**Code to Remove (lines 1122-1178):**
```tsx
                {/* Edit Location Panel */}
                {sidebarView === 'edit' && locationToEdit?.userSave && locationToEdit?.data && (
                    <EditLocationPanel
                        ... (entire EditLocationPanel component)
                    />
                )}
```

**Code to Add (after line 1179 `</RightSidebar>`):**
```tsx
            {/* Location Details Sheet */}
            <Sheet open={showDetailsSheet} onOpenChange={setShowDetailsSheet}>
                <SheetContent className="w-full sm:max-w-3xl overflow-y-auto p-0">
                    <div className="h-full">
                        {locationToEdit?.userSave?.location && (
                            <LocationDetailPanel
                                location={{
                                    id: locationToEdit.userSave.locationId,
                                    placeId: locationToEdit.data?.placeId || locationToEdit.id,
                                    name: locationToEdit.data?.name || 'Selected Location',
                                    address: locationToEdit.data?.address ?? null,
                                    lat: locationToEdit.position.lat,
                                    lng: locationToEdit.position.lng,
                                    type: locationToEdit.data?.type || locationToEdit.userSave.location?.type || '',
                                    rating: locationToEdit.data?.rating ?? null,
                                    street: locationToEdit.data?.street ?? null,
                                    number: locationToEdit.data?.number ?? null,
                                    city: locationToEdit.data?.city ?? null,
                                    state: locationToEdit.data?.state ?? null,
                                    zipcode: locationToEdit.data?.zipcode ?? null,
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
                                onEdit={() => {
                                    // Close details and navigate to /locations
                                    const userSaveId = locationToEdit.userSave?.id || locationToEdit.id;
                                    router.push(`/locations?edit=${userSaveId}`);
                                    setShowDetailsSheet(false);
                                }}
                                onDelete={(id) => {
                                    // Handle delete via API
                                    fetch(`/api/locations/${id}`, { method: 'DELETE' })
                                        .then(() => {
                                            setShowDetailsSheet(false);
                                            setLocationToEdit(null);
                                            // Refresh markers
                                            setMarkers(prev => prev.filter(m => m.userSave?.id !== id));
                                        });
                                }}
                                onShare={(location) => {
                                    setShareLocation({
                                        ...location,
                                        userSave: locationToEdit.userSave,
                                    } as Location);
                                    setShowDetailsSheet(false);
                                }}
                                onViewOnMap={() => {
                                    // Already on map, just close sheet
                                    setShowDetailsSheet(false);
                                }}
                            />
                        )}
                    </div>
                </SheetContent>
            </Sheet>
```

### `/preview` Page - Fix URL Bug & Update Components
**File:** `/Users/rgriola/Desktop/01_Vibecode/fotolokashen/src/app/preview/page.tsx`

**Issues:**
1. Line ~278: Still uses `/@${username}` pattern
2. Remove SaveLocationDialog import and usage
3. Remove EditLocationDialog import and usage
4. Update to use only Panel versions

### Phase 4: Delete Old Components
After map page is fixed, delete:
- `/src/components/locations/EditLocationDialog.tsx`
- `/src/components/locations/LocationDetailModal.tsx`

## USER FLOW CONFIRMATION

### ✅ `/map` Page Flow (NEW)
1. User clicks saved marker → **Details Panel** opens
2. Details Panel shows location info
3. User clicks "Edit" button → **Navigates to `/locations` page** with edit param
4. `/locations` opens Edit Panel automatically

### ✅ `/locations` Page Flow (UPDATED)
1. User clicks location → **Details Panel** opens
2. User clicks "Edit" → **Edit Panel** opens (stays on same page)
3. User clicks "View on Map" → **Navigates to `/map`** with coordinates

### ✅ Benefits
- Consistent UX across both pages
- Edit functionality centralized in `/locations`
- Map page focused on viewing/exploring
- Mobile-first Panel design everywhere

## NEXT STEPS FOR USER

1. **Manually edit `/map` page:**
   - Remove lines 1122-1178 (Edit Location Panel section)
   - Add Details Sheet code after line 1179

2. **Fix `/preview` page:**
   - Search for `/@${username}` and replace with `/${username}`
   - Remove SaveLocationDialog import/usage
   - Remove EditLocationDialog import/usage

3. **Delete old components:**
   ```bash
   rm /src/components/locations/EditLocationDialog.tsx
   rm /src/components/locations/LocationDetailModal.tsx
   ```

4. **Test the flow:**
   - Test `/map` marker click → Details → Navigate to `/locations`
   - Test `/locations` location click → Details → Edit
   - Test mobile responsiveness

---

**Status:** BLOCKED - Token limit reached during implementation
**Completion:** ~80% done, final edits needed manually
