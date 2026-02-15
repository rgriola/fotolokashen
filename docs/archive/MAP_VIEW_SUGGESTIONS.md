# Map View Implementation Suggestions

## Overview
The Map View for the My Locations page should provide an interactive, visual way to see all saved locations on a map with their custom colors and metadata.

## Key Features

### 1. **Full-Screen Interactive Map**
- Use the existing Google Maps integration (`@vis.gl/react-google-maps`)
- Display a full-page map (minus header) with all saved locations as markers
- Auto-fit bounds to show all markers on initial load

### 2. **Custom Marker Colors**
- Each marker should use the type-based color from `getColorForType()`
- Markers should be visually distinct with the location type color
- Consider using custom SVG markers or the Advanced Marker API for better styling

### 3. **Marker Clustering**
- When zoomed out, cluster nearby markers to avoid overlap
- Use the `@googlemaps/markerclusterer` library
- Cluster colors could represent the dominant location type in the cluster
- Show the number of locations in each cluster

### 4. **Info Windows / Popups**
- Clicking a marker opens an info window with:
  - Location name
  - Address
  - Type badge
  - Personal rating (if set)
  - Favorite status
  - Quick action buttons:
    - View Details (opens edit dialog)
    - Navigate (opens Google Maps directions)
    - Share

### 5. **Map Controls**
- **Filters Panel (Sidebar or Overlay)**
  - Filter by location type (with color-coded chips)
  - Filter by favorites only
  - Search by name/address
  - Date range filter (saved date)
  
- **View Controls**
  - Map type selector (roadmap, satellite, hybrid)
  - Zoom controls
  - "Fit All Markers" button
  - "My Location" button

### 6. **Interactive Features**
- **Hover Effects**: Show location name on marker hover
- **Selected State**: Highlight selected marker with a larger size or glow effect
- **Heatmap Mode**: Optional heatmap overlay showing location density
- **Drawing Tools**: Allow users to draw areas/routes connecting locations

### 7. **List Integration**
- **Side Panel**: Show a collapsible list of visible locations on the map
  - Click list item to pan/zoom to that marker
  - List updates as map bounds change
  - Sortable by distance, name, date saved, rating

### 8. **Production Features**
- **Route Planning**: Connect multiple locations to plan a shoot route
- **Distance Calculator**: Show distance between selected locations
- **Production Notes Preview**: Quick view of production notes in info window
- **Photo Preview**: Show primary photo in info window if available

## Implementation Approach

### Component Structure
\`\`\`
LocationsMapView/
├── LocationsMap.tsx          # Main map component
├── LocationMarkers.tsx       # Renders all location markers
├── LocationCluster.tsx       # Handles marker clustering
├── LocationInfoWindow.tsx    # Info window content
├── MapFiltersPanel.tsx       # Filter overlay/sidebar
└── MapControls.tsx           # Custom map controls
\`\`\`

### Data Flow
1. Fetch filtered locations from the existing query
2. Convert locations to marker positions `{ lat, lng, ...metadata }`
3. Apply client-side filters from the filter panel
4. Update markers and bounds reactively

### Example Code Structure

\`\`\`tsx
export function LocationsMapView({ 
  locations, 
  onEdit, 
  onDelete, 
  onShare 
}: LocationsMapViewProps) {
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [mapCenter, setMapCenter] = useState({ lat: 40.7128, lng: -74.0060 }); // Default: NYC
  const [zoom, setZoom] = useState(10);
  const mapRef = useRef<google.maps.Map | null>(null);

  // Fit bounds to show all markers
  useEffect(() => {
    if (locations.length > 0 && mapRef.current) {
      const bounds = new google.maps.LatLngBounds();
      locations.forEach(loc => bounds.extend({ lat: loc.lat, lng: loc.lng }));
      mapRef.current.fitBounds(bounds);
    }
  }, [locations]);

  return (
    <div className="relative h-full w-full">
      {/* Map */}
      <Map
        mapId="locations-map"
        defaultCenter={mapCenter}
        defaultZoom={zoom}
        onLoad={(map) => mapRef.current = map}
      >
        {/* Markers with clustering */}
        <MarkerClusterer>
          {locations.map((location) => (
            <AdvancedMarker
              key={location.id}
              position={{ lat: location.lat, lng: location.lng }}
              onClick={() => setSelectedLocation(location)}
            >
              <CustomMarkerPin 
                color={getColorForType(location.type || "OTHER")}
                isFavorite={location.userSave?.isFavorite}
              />
            </AdvancedMarker>
          ))}
        </MarkerClusterer>

        {/* Info Window */}
        {selectedLocation && (
          <InfoWindow
            position={{ lat: selectedLocation.lat, lng: selectedLocation.lng }}
            onCloseClick={() => setSelectedLocation(null)}
          >
            <LocationInfoWindow
              location={selectedLocation}
              onEdit={onEdit}
              onShare={onShare}
            />
          </InfoWindow>
        )}
      </Map>

      {/* Filter Panel Overlay */}
      <MapFiltersPanel 
        className="absolute top-4 left-4"
        onFilterChange={handleFilterChange}
      />

      {/* Locations List Sidebar */}
      <MapLocationsList
        className="absolute right-0 top-0 h-full w-80"
        locations={visibleLocations}
        selectedLocation={selectedLocation}
        onSelectLocation={setSelectedLocation}
      />
    </div>
  );
}
\`\`\`

## Advanced Features (Future Enhancements)

1. **Street View Integration**: Click a button to enter Street View at the location
2. **Weather Overlay**: Show current weather at each location
3. **Historical View**: Show locations saved in different time periods
4. **Shared Maps**: Allow sharing map views with filtered locations
5. **Export**: Export locations as KML/GPX for use in other mapping tools
6. **Offline Support**: Cache map tiles and location data for offline viewing

## Performance Considerations

- **Lazy Loading**: Only render markers within the current viewport + buffer
- **Virtualization**: For very large datasets (1000+ locations), use clustering aggressively
- **Debouncing**: Debounce filter changes to avoid excessive re-renders
- **Memoization**: Memoize marker components to prevent unnecessary re-creation

## UI/UX Best Practices

- **Loading States**: Show skeleton/spinner while map loads
- **Empty States**: Show helpful message when no locations match filters
- **Mobile Responsive**: Make filter panel collapsible on mobile
- **Accessibility**: Ensure keyboard navigation for markers and controls
- **Dark Mode**: Support dark map styling to match app theme

## Integration with Existing Features

The Map View should seamlessly integrate with:
- ✅ Existing location filters (type, favorites, search, sort)
- ✅ Edit/Delete/Share functionality (via info window)
- ✅ Photo management (show in info window)
- ✅ Personal ratings (display in markers/info window)
- ✅ Authentication (respect user permissions)

---

**Recommendation**: Start with a basic map showing all markers with clustering, then incrementally add features like info windows, filters, and the locations list sidebar.
