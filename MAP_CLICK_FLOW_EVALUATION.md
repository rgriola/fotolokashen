# Map Click Flow Evaluation

**Date**: January 7, 2026  
**Page**: `/map`

---

## Current Click Flows

### 1. **Clicking on the Map (Empty Space)**
**Handler**: `handleMapClick` (line 162)

**Flow**:
1. Closes any open SaveLocationPanel
2. Removes all temporary markers
3. Creates a new temporary marker at clicked position
4. Performs reverse geocoding to get address details
5. Auto-opens InfoWindow for the new marker
6. Zooms to level 16 and centers on the clicked location

**Marker Type**: Temporary (red camera icon)

---

### 2. **Clicking on a Saved Location Marker** ✅ UPDATED
**Handler**: `handleMarkerClick` (line 569)

**Flow**:
1. **Skips InfoWindow** - goes directly to EditLocationPanel
2. Opens EditLocationPanel in right sidebar
3. Loads location data (favorite status, indoor/outdoor, etc.)
4. Zooms to level 17 and centers on the marker
5. **Desktop**: Pans map right to accommodate the 450px panel
6. **Mobile**: Just centers on marker (no pan needed)

**Panel Actions**:
- Edit all location details
- Delete location
- View photos
- Update notes

**Marker Type**: Saved (custom color, clustered)

---

### 3. **Clicking on a Temporary Marker**
**Handler**: `handleMarkerClick` (line 474)

**Flow**:
1. Sets the clicked marker as selected
2. Opens InfoWindow showing location details
3. Zooms to level 17 and centers on the marker

**InfoWindow Actions**:
- **Save Button**: Opens SaveLocationPanel in sidebar
- **Quick Save Button**: Currently disabled
- **Directions Button**: Opens Google Maps directions in new tab

**Marker Type**: Temporary (red camera icon, not clustered)

---

### 4. **Clicking on User Location (Blue Dot)**
**Handler**: `handleUserLocationClick` (line 394)

**Flow**:
1. Performs reverse geocoding on user's current location
2. Creates a special temporary marker with location data
3. Opens InfoWindow with "Current Location" details
4. Shows Save button to save current location

**Marker Type**: Special temporary marker

---

### 5. **Clicking on Home Location (House Icon)**
**Handler**: None (not clickable currently)

**Flow**: No interaction - purely visual marker

**Marker Type**: Static home marker

---

## InfoWindow Behavior

### When InfoWindow Closes (`handleInfoWindowClose` - line 490):
1. If marker is temporary → removes it from map
2. Closes SaveLocationPanel if open
3. Clears selected marker

### InfoWindow Buttons:

| Marker Type | Buttons Available |
|-------------|------------------|
| **Saved Location** | View, Directions |
| **Temporary Location** | Save, Quick Save (disabled), Directions |
| **User Location** | Save, Quick Save (disabled), Directions |

---

## Issues & Observations

### Current Behavior:
1. ✅ **Map Click**: Creates temporary marker with InfoWindow
2. ✅ **Marker Click**: Opens InfoWindow with appropriate buttons
3. ✅ **Auto-zoom**: Zooms to street level on all clicks
4. ⚠️ **Multiple Clicks**: Each map click removes previous temporary markers
5. ⚠️ **Closing InfoWindow**: Removes temporary markers (might be unexpected)

### Potential UX Issues:

1. **Temporary Marker Removal**:
   - Clicking X on InfoWindow removes the temporary marker
   - User might expect marker to stay until explicitly deleted
   - Could be confusing if user accidentally closes InfoWindow

2. **Auto-Zoom on Every Click**:
   - Zooms to 16-17 on every marker click
   - Might be jarring if user is already zoomed in/out
   - Could preserve current zoom level instead

3. **No Multi-Select**:
   - Can only have one InfoWindow open at a time
   - Can't compare multiple locations side-by-side

4. **Saved Marker Click**:
   - Opens InfoWindow but requires "View" button to see full details
   - Could open EditPanel directly on click

---

## Suggested Improvements

### Option A: Keep Temporary Markers Until Explicitly Deleted
```typescript
// In handleInfoWindowClose
const handleInfoWindowClose = useCallback(() => {
    // DON'T remove temporary markers - let user delete manually
    // Only close the InfoWindow
    setSelectedMarker(null);
    
    // Still close SaveLocationPanel
    if (isSidebarOpen) {
        setIsSidebarOpen(false);
        setLocationToSave(null);
    }
}, [isSidebarOpen]);
```

### Option B: Preserve Zoom Level on Marker Click
```typescript
// In handleMarkerClick
const handleMarkerClick = useCallback((marker: MarkerData) => {
    setSelectedMarker(marker);
    
    // Pan to marker but DON'T change zoom
    if (map) {
        map.panTo(marker.position);
        // Remove: map.setZoom(17);
    }
}, [map]);
```

### Option C: Direct Edit on Saved Marker Click
```typescript
// In handleMarkerClick - for saved markers
if (!marker.isTemporary && marker.userSave) {
    // Skip InfoWindow, open EditPanel directly
    setLocationToEdit(marker);
    setSidebarView('edit');
    setIsSidebarOpen(true);
} else {
    // For temporary markers, show InfoWindow
    setSelectedMarker(marker);
}
```

### Option D: Add Delete Button to InfoWindow
```typescript
// In InfoWindow for temporary markers
{selectedMarker.isTemporary && (
    <button
        onClick={() => {
            setMarkers(prev => prev.filter(m => m.id !== selectedMarker.id));
            setSelectedMarker(null);
        }}
        className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
    >
        Delete
    </button>
)}
```

---

## Questions for User

1. **Temporary Marker Behavior**:
   - Should closing InfoWindow remove the temporary marker?
   - Or should temporary markers stay until user explicitly deletes them?

2. **Zoom Behavior**:
   - Should clicking a marker auto-zoom to street level (16-17)?
   - Or preserve current zoom and just pan to marker?

3. **Saved Marker Click**:
   - Should clicking a saved marker open InfoWindow first?
   - Or go directly to EditPanel?

4. **Multiple Markers**:
   - Should users be able to place multiple temporary markers?
   - Or keep current behavior (one at a time)?

---

## Current Marker Types

| Type | Icon | Color | Clustered | Clickable |
|------|------|-------|-----------|-----------|
| **Temporary** | Camera | Red (#EF4444) | No | Yes |
| **Saved** | Pin | Custom (user-defined) | Yes | Yes |
| **User Location** | Blue Dot | Blue | No | Yes |
| **Home Location** | House | Default | No | No |

---

## Recommendations

### High Priority:
1. **Add Delete button** to temporary marker InfoWindows
2. **Preserve zoom level** on marker clicks (just pan, don't zoom)
3. **Keep temporary markers** when InfoWindow closes (don't auto-delete)

### Medium Priority:
4. Make home location marker clickable
5. Add visual feedback when hovering over markers
6. Consider direct-to-edit flow for saved markers

### Low Priority:
7. Multi-select capability
8. Batch operations on multiple markers
9. Keyboard shortcuts for common actions

---

**Next Steps**: Discuss which improvements to implement first.
