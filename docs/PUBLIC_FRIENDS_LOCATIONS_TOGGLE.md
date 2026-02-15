# Public & Friends Locations Toggle Implementation Plan

**Created**: February 15, 2026  1:19pm

**Status**: Planning  
**Feature**: Add toggle buttons to /locations page for viewing public and friends' locations

## Overview

Add two toggle buttons to the /locations page toolbar that allow users to view:
1. **Public Locations** - All locations shared publicly by any user 
2. **Friends' Locations** - Locations from users they follow (respecting privacy settings)

These toggles use the same icons as /map page (`Map` for public, `Users` for friends) and will be positioned between the search bar and action buttons.

## Current State

### What Exists ✅
- `usePublicLocations` hook ([src/hooks/usePublicLocations.ts](src/hooks/usePublicLocations.ts))
- `/api/v1/locations/public` endpoint ([src/app/api/v1/locations/public/route.ts](src/app/api/v1/locations/public/route.ts))
- Follow/following system (`UserFollow` model)
- Privacy settings (`showSavedLocations`, `visibility` fields)
- `FriendsDialog` component (shows followers/following lists)
- Map page toggle buttons in [MapControls.tsx](src/components/maps/MapControls.tsx#L143-L158)

### What's Missing ❌
- Friends locations API endpoint
- `useFriendsLocations` hook
- Toggle buttons on /locations page
- Location source merging logic
- Visual indicators for public/friends locations
- Quick-save functionality for non-owned locations

## Key Decisions

| Decision                                                      | Choice | Rationale |
|----------                                                     |--------|-----------|
| **Bounds handling**                                           | Make bounds optional for /locations API | Grid view doesn't have map bounds; enforce strict 100-location limit without bounds | 
| **Button placement** | Between search and action buttons | Better visual flow, grouped with other controls |
| **Icons** | `Map` (public), `Users` (friends) | Matches /map page for consistency |
| **Color scheme** | Purple (public), Blue (friends), Indigo (my locations) | Distinct colors, purple already used for public on map | <!-- In the Grid/List views this should be a badge -->
| **Deduplication** | User's own saves take precedence | If same location in multiple sources, show user's version | <!-- Show Both. Each Location is independent and owned separately  -->
| **Privacy enforcement** | Server-side in API | Respects both `visibility` field and `showSavedLocations` preference |

## Implementation Steps

### 1. Add UI Toggle Buttons to /locations page

**File**: [src/app/locations/page.tsx](src/app/locations/page.tsx#L154-L165)

**Changes**:
- Import `Map` and `Users` icons from `lucide-react`
- Add state variables:
  ```typescript
  const [showPublic, setShowPublic] = useState(false);
  const [showFriends, setShowFriends] = useState(false);
  ```
- Insert button group between search input and create-with-photo button
- Three pill-style buttons:
  - **My Locations** - Always active, `MapPin` icon, indigo background
  - **Public** - Toggle, `Map` icon, purple when active
  - **Friends** - Toggle, `Users` icon, blue when active
- Mobile responsive: Show icons only, text labels on desktop

**Button Styling**:
```typescript
// Active state examples
"bg-purple-600 hover:bg-purple-700 text-white"  // Public
"bg-blue-600 hover:bg-blue-700 text-white"      // Friends
"bg-indigo-600 hover:bg-indigo-700 text-white"  // My Locations

// Inactive state
"bg-white hover:bg-gray-50 border border-gray-300"
```

**Notes**:
<!-- Add your implementation notes here -->

---

### 2. Integrate existing usePublicLocations hook

**File**: [src/app/locations/page.tsx](src/app/locations/page.tsx)

**Changes**:
- Import `usePublicLocations` from `@/hooks/usePublicLocations`
- Call hook with conditional fetching:
  ```typescript
  const { data: publicLocationsData, isLoading: isLoadingPublic } = usePublicLocations({
    enabled: showPublic,
    type: typeFilter !== "all" ? typeFilter : undefined,
  });
  ```
- Initially pass `bounds: undefined` (will be handled in step 3)
- Display loading state when `isLoadingPublic` is true

**Notes**:
<!-- Add your implementation notes here -->

---

### 3. Update /api/v1/locations/public to support non-bounds queries

**File**: [src/app/api/v1/locations/public/route.ts](src/app/api/v1/locations/public/route.ts#L20-L45)

**Changes**:
- Make `bounds` parameter optional in query validation
- Add `limit` query parameter (default 100, max 500 with bounds, max 100 without)
- Logic:
  - **With bounds**: Use existing spatial query, max 500 results
  - **Without bounds**: Query most recent 100 locations globally
- Add `hasMore` boolean to response indicating if more results exist
- Update Zod schema for optional bounds

**Security Considerations**:
- Maintain authentication requirement
- Enforce strict limit without bounds to prevent performance issues
- Keep existing privacy filtering (only `visibility='public'`)

**Notes**:
<!-- Add your implementation notes here -->

---

### 4. Create /api/v1/locations/friends endpoint

**File**: `src/app/api/v1/locations/friends/route.ts` (NEW)

**Implementation**:
```typescript
// GET /api/v1/locations/friends
// Query params: bounds?, type?, limit? (default 100)

// 1. Get current user from auth
// 2. Find all users current user follows (UserFollow table)
// 3. Query UserSave where:
//    - userId in following list
//    - deletedAt is null
//    - visibility='public' OR (visibility='followers' AND user follows owner)
// 4. Join with User table to check showSavedLocations preference
// 5. Apply type filter if provided
// 6. Apply bounds filter if provided
// 7. Order by createdAt DESC
// 8. Limit results
```

**Response Structure**:
```typescript
{
  locations: PublicLocation[];  // UserSaves with owner info
  total: number;
  hasMore: boolean;
}
```

**Privacy Logic**:
- Check `User.showSavedLocations` field:
  - `'private'`: Exclude all locations from this user
  - `'followers'`: Include if current user follows them AND visibility='followers' OR 'public'
  - `'public'`: Include only if visibility='public'
- Always respect `UserSave.visibility` field
- Filter out soft-deleted locations (`deletedAt IS NULL`)

**Notes**:
<!-- Add your implementation notes here -->

---

### 5. Create useFriendsLocations hook

**File**: `src/hooks/useFriendsLocations.ts` (NEW)

**Implementation**:
```typescript
import { useQuery } from '@tanstack/react-query';

interface UseFriendsLocationsParams {
  bounds?: { north: number; south: number; east: number; west: number };
  type?: string;
  enabled?: boolean;
  limit?: number;
}

export function useFriendsLocations(params: UseFriendsLocationsParams = {}) {
  return useQuery({
    queryKey: ['friends-locations', params],
    queryFn: async () => {
      const queryParams = new URLSearchParams();
      if (params.bounds) {
        queryParams.set('bounds', JSON.stringify(params.bounds));
      }
      if (params.type) {
        queryParams.set('type', params.type);
      }
      if (params.limit) {
        queryParams.set('limit', params.limit.toString());
      }
      
      const response = await fetch(`/api/v1/locations/friends?${queryParams}`);
      if (!response.ok) throw new Error('Failed to fetch friends locations');
      return response.json();
    },
    enabled: params.enabled ?? true,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
```

**Notes**:
<!-- Add your implementation notes here -->

---

### 6. Merge location sources in /locations page

**File**: [src/app/locations/page.tsx](src/app/locations/page.tsx)

**Changes**:
- Import `useFriendsLocations` hook
- Call hook with conditional fetching:
  ```typescript
  const { data: friendsLocationsData, isLoading: isLoadingFriends } = useFriendsLocations({
    enabled: showFriends,
    type: typeFilter !== "all" ? typeFilter : undefined,
  });
  ```
- Create `mergedLocations` computed value:
  ```typescript
  const mergedLocations = useMemo(() => {
    const userLocations = data?.locations || [];
    const publicLocations = showPublic ? (publicLocationsData?.locations || []) : [];
    const friendsLocations = showFriends ? (friendsLocationsData?.locations || []) : [];
    
    // Combine and deduplicate by location.id
    const locationMap = new Map();
    
    // User's saves take precedence
    userLocations.forEach(loc => locationMap.set(loc.location.id, { ...loc, source: 'user' }));
    
    // Add friends locations (skip if already in user's saves)
    friendsLocations.forEach(loc => {
      if (!locationMap.has(loc.location.id)) {
        locationMap.set(loc.location.id, { ...loc, source: 'friend' });
      }
    });
    
    // Add public locations (skip if already exists)
    publicLocations.forEach(loc => {
      if (!locationMap.has(loc.location.id)) {
        locationMap.set(loc.location.id, { ...loc, source: 'public' });
      }
    });
    
    return Array.from(locationMap.values());
  }, [data, publicLocationsData, friendsLocationsData, showPublic, showFriends]);
  ```
- Apply existing filters to `mergedLocations` (search, favorites, sort)
- Update loading state: `isLoading || isLoadingPublic || isLoadingFriends`

**Notes**:
<!-- Add your implementation notes here -->

---

### 7. Add visual indicators for location source

**Files**: 
- [src/components/locations/LocationList.tsx](src/components/locations/LocationList.tsx)
- [src/components/locations/LocationListCompact.tsx](src/components/locations/LocationListCompact.tsx)

**Changes**:
- Add `source` prop to location items: `'user' | 'friend' | 'public'`
- For non-user locations, display:
  - Small badge: "Public" (purple bg) or "Friend" (blue bg)
  - Owner username + avatar (link to `/@{username}`)
  - Quick-save button (bookmark icon) instead of edit/delete actions
- Conditional rendering:
  ```typescript
  {source !== 'user' && (
    <div className="flex items-center gap-2">
      <Badge className={source === 'public' ? 'bg-purple-600' : 'bg-blue-600'}>
        {source === 'public' ? 'Public' : 'Friend'}
      </Badge>
      <Link href={`/@${location.user.username}`}>
        <Avatar size="sm" src={location.user.avatar} />
        <span>{location.user.username}</span>
      </Link>
    </div>
  )}
  ```
- Implement quick-save button:
  - Calls `/api/locations` POST with `locationId` from public/friend location
  - On success, refetch user's locations and show toast
  - Button disabled if already in user's saves

**Notes**:
<!-- Add your implementation notes here -->

---

### 8. Update FilterPanel to work with merged data

**File**: [src/components/locations/FilterPanel.tsx](src/components/locations/FilterPanel.tsx)

**Changes**:
- Favorites filter should only apply to user's own saves (check `source === 'user'`)
- Add informational text to Favorites section:
  ```tsx
  <p className="text-xs text-muted-foreground">
    Favorites filter applies only to your saved locations
  </p>
  ```
- Optional: Add "Source" filter:
  ```tsx
  <Select>
    <SelectItem value="all">All Sources</SelectItem>
    <SelectItem value="user">My Locations Only</SelectItem>
    <SelectItem value="public">Public Only</SelectItem>
    <SelectItem value="friends">Friends Only</SelectItem>
  </Select>
  ```

**Notes**:
<!-- Add your implementation notes here -->

---

### 9. Handle empty states

**File**: [src/app/locations/page.tsx](src/app/locations/page.tsx)

**Changes**:
- Add empty state messages based on active toggles:
  ```typescript
  {showPublic && publicLocationsData?.locations.length === 0 && (
    <div className="text-center py-12">
      <p className="text-muted-foreground">No public locations found</p>
      <p className="text-sm text-muted-foreground mt-2">
        Try changing your filter settings
      </p>
    </div>
  )}
  
  {showFriends && friendsLocationsData?.locations.length === 0 && (
    <div className="text-center py-12">
      <p className="text-muted-foreground">No friends' locations found</p>
      <Link href="/search" className="text-sm text-primary mt-2 inline-block">
        Find people to follow →
      </Link>
    </div>
  )}
  ```
- Show independent loading skeletons for each data source
- Combine loading states appropriately

**Notes**:
<!-- Add your implementation notes here -->

---

### 10. Update onboarding tour if needed

**File**: [src/components/onboarding/LocationsOnboardingProvider.tsx](src/components/onboarding/LocationsOnboardingProvider.tsx)

**Changes**:
- Check if tour steps need updating due to button position changes
- Add new tour step for toggle buttons:
  ```typescript
  {
    target: '[data-tour="location-source-toggles"]',
    content: 'Toggle to view locations from friends and the community',
    disableBeacon: true,
  }
  ```
- Update existing step indices if needed
- Add `data-tour="location-source-toggles"` attribute to button group

**Notes**:
<!-- Add your implementation notes here -->

---

## Verification Checklist

Before marking complete, verify:

- [ ] Run `npm run build` - no TypeScript errors
- [ ] Toggle public locations on/off - locations appear/disappear correctly
- [ ] Toggle friends locations - only followers' locations with correct privacy show
- [ ] Test with no friends - empty state appears with link to /search
- [ ] Test search/filter with mixed location sources - filters apply to all sources
- [ ] Test quick-save button on public/friends locations - creates new UserSave in database
- [ ] Test favorites toggle - only applies to user's own locations, not public/friends
- [ ] Test privacy scenarios:
  - [ ] Account A follows Account B
  - [ ] B's `showSavedLocations='followers'` locations appear for A
  - [ ] B's `showSavedLocations='private'` locations do NOT appear for A
  - [ ] B's `visibility='followers'` locations appear for A (when B allows)
  - [ ] B's `visibility='private'` locations do NOT appear for A
- [ ] Test grid view mode with 100+ mixed locations
- [ ] Test list view mode with 100+ mixed locations
- [ ] Mobile responsive: Toggle buttons work and look good on small screens
- [ ] Check performance: API response times with 100+ locations
- [ ] Test deduplication: Same location owned by multiple users shows correctly
- [ ] Test onboarding tour: New step appears and doesn't break existing flow

## Performance Considerations

- **Limit enforcement**: Maximum 100 locations per source without bounds prevents overload
- **Stale time**: 5-minute cache reduces API calls during rapid toggle on/off
- **Deduplication**: Uses Map for O(n) deduplication instead of nested loops
- **Conditional fetching**: `enabled` parameter prevents unnecessary API calls when toggles off
- **Database indexes**: Ensure indexes on `userId`, `visibility`, `deletedAt` in UserSave table

## Security Considerations

- **Authentication required**: All endpoints require valid JWT token
- **Privacy enforcement**: Server-side filtering in friends API based on:
  - `showSavedLocations` user preference
  - `visibility` field on UserSave
  - Following relationship (UserFollow table)
- **Rate limiting**: Consider adding rate limits to prevent API abuse
- **Input validation**: All query parameters validated with Zod schemas

## Future Enhancements

- **Nearby filter**: Add distance-based filtering (requires user location)
- **Advanced source filter**: Multi-select to show combinations (My + Friends, etc.)
- **Location clustering**: Group nearby locations in grid view
- **Export functionality**: Export visible locations to CSV/GeoJSON
- **Batch quick-save**: Save multiple public/friends locations at once
- **Notification**: Alert when friends add new locations

## Related Documentation

- [Follow System API](docs/api/FOLLOW_SYSTEM.md)
- [Privacy System](docs/features/PRIVACY_ENFORCEMENT.md)
- [Visibility System Analysis](docs/features/VISIBILITY_SYSTEM_ANALYSIS.md)
- [Public Locations Hook](src/hooks/usePublicLocations.ts)
- [Map Controls Component](src/components/maps/MapControls.tsx)

---

**Last Updated**: February 15, 2026
