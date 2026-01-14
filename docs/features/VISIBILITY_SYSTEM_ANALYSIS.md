# Location Visibility System - Analysis & Implementation Plan

## Current State Analysis

### ✅ What Exists

1. **Database Schema (UserSave model)**
   ```prisma
   model UserSave {
     visibility String @default("private") // 'public', 'unlisted', 'private'
     @@index([visibility]) // Indexed for efficient filtering
   }
   ```

2. **API Support**
   - ✅ `/api/v1/locations/[id]/visibility` - PATCH endpoint to update visibility
   - ✅ Validates: `'public' | 'private' | 'followers'`
   - ✅ Requires user ownership to change

3. **Type Definitions**
   ```typescript
   // src/types/location.ts
   visibility: 'public' | 'private' | 'followers'
   ```

4. **UI Components**
   - ✅ `ShareLocationDialog` - Has visibility selector
   - ✅ Mobile API endpoints filter by visibility='public'

### ❌ What's Missing

1. **Map Page Integration**
   - `/app/map/page.tsx` does NOT fetch public/friends locations
   - Only shows current user's saved locations
   - No API endpoint to get public/friends locations for map display

2. **API Endpoints Needed**
   - ❌ GET `/api/locations/public` - Get all public locations in viewport
   - ❌ GET `/api/locations/friends` - Get friends' public + followers locations
   - ❌ GET `/api/locations/nearby` - Combined endpoint with filters

3. **UI/UX Features**
   - ❌ Map layer toggles (My Locations / Public / Friends)
   - ❌ Different marker colors/icons for visibility levels
   - ❌ Visibility indicator in location cards
   - ❌ Privacy settings explanation

## Design Decisions Needed

### 1. **Map Display Strategy**

**Option A: Separate Layers (Recommended)**
```
Map Controls:
[ ] My Locations (always visible)
[ ] Friends' Locations (public + followers visibility)
[ ] Public Locations (anyone's public locations)
```

**Benefits:**
- User controls what they see
- Clearer data source
- Better performance (opt-in loading)
- Privacy-conscious design

**Option B: Automatic Mixed View**
- Show everything by default
- Could be overwhelming
- Privacy concerns
- Performance impact

**Recommendation: Option A** with smart defaults:
- ✅ "My Locations" ON by default
- ⚪ "Friends' Locations" OFF by default (opt-in)
- ⚪ "Public Locations" OFF by default (opt-in)

### 2. **Visibility Level Semantics**

Currently defined as: `'public' | 'private' | 'followers'`

**Clarification Needed:**
- **'public'** = Anyone can see on map? Or just on profile?
- **'followers'** = Only users who follow me?
- **'private'** = Only me?

**Recommended Definitions:**

| Visibility | Who Can See | Map Display | Profile Display |
|-----------|------------|-------------|-----------------|
| `private` | Only me | ❌ Never | ❌ Never |
| `followers` | Me + My followers | ✅ If "Friends" layer ON | ✅ On my profile to followers |
| `public` | Everyone | ✅ If "Public" layer ON | ✅ On my profile to anyone |

### 3. **Friends/Followers Clarification**

Current system has:
- `UserFollow` model (following/followers relationship)
- `showSavedLocations` user setting: `'public' | 'followers' | 'private'`

**Question:** Should "Friends' Locations" mean:
- A) Users I follow
- B) Users who follow me
- C) Mutual follows only
- D) Controlled by user's `showSavedLocations` setting

**Recommendation: Option D** - Respect user's global privacy setting:
```typescript
// User A wants to see User B's locations on map:
// 1. Check User B's showSavedLocations setting
// 2. If 'public' → Show all public visibility locations
// 3. If 'followers' → Show public + followers visibility IF User A follows User B
// 4. If 'private' → Show nothing
```

### 4. **Performance Considerations**

**Viewport Filtering Required:**
```typescript
// Don't load all public locations globally
// Only load locations in current map viewport
GET /api/locations/public?bounds=lat1,lng1,lat2,lng2
```

**Caching Strategy:**
- Client-side caching of loaded locations
- Only refetch when viewport changes significantly
- Use bounds parameter to prevent over-fetching

## Implementation Plan

### Phase 1: API Development (Backend)

**1.1 Create Public Locations Endpoint**
```typescript
// src/app/api/locations/public/route.ts
GET /api/locations/public?bounds=lat1,lng1,lat2,lng2&limit=100

// Returns:
{
  locations: [
    {
      id, lat, lng, name, address,
      userSave: { visibility: 'public', userId, color },
      user: { id, username, avatar } // Include owner info
    }
  ]
}
```

**1.2 Create Friends Locations Endpoint**
```typescript
// src/app/api/locations/friends/route.ts
GET /api/locations/friends?bounds=lat1,lng1,lat2,lng2&limit=100

// Logic:
// 1. Get list of users current user follows
// 2. For each followed user:
//    - Check their showSavedLocations setting
//    - Filter locations by visibility + setting
// 3. Return combined results
```

**1.3 Update Existing Locations Endpoint**
```typescript
// src/app/api/locations/route.ts
// Add visibility filter support for consistency
GET /api/locations?visibility=public,followers,private
```

### Phase 2: Frontend - Map Controls

**2.1 Add Map Layer Toggles**
```tsx
// src/components/maps/MapLayerControls.tsx
<MapControls>
  <Toggle checked={showMyLocations} onChange={setShowMyLocations}>
    <User className="w-4 h-4" />
    My Locations
  </Toggle>
  
  <Toggle checked={showFriendsLocations} onChange={setShowFriendsLocations}>
    <Users className="w-4 h-4" />
    Friends' Locations
  </Toggle>
  
  <Toggle checked={showPublicLocations} onChange={setShowPublicLocations}>
    <Globe className="w-4 h-4" />
    Public Locations
  </Toggle>
</MapControls>
```

**2.2 Update Map Page State**
```tsx
// src/app/map/page.tsx
const [layerVisibility, setLayerVisibility] = useState({
  myLocations: true,
  friendsLocations: false,
  publicLocations: false,
});

// Separate marker sets
const [myMarkers, setMyMarkers] = useState<MarkerData[]>([]);
const [friendsMarkers, setFriendsMarkers] = useState<MarkerData[]>([]);
const [publicMarkers, setPublicMarkers] = useState<MarkerData[]>([]);
```

**2.3 Differentiate Markers by Source**
```tsx
// Different colors/styles for different sources
const getMarkerColor = (marker: MarkerData) => {
  if (marker.source === 'mine') return marker.color || '#EF4444';
  if (marker.source === 'friend') return '#3B82F6'; // Blue
  if (marker.source === 'public') return '#10B981'; // Green
};
```

### Phase 3: UI/UX Enhancements

**3.1 Visibility Indicator in Location Cards**
```tsx
<Badge variant={getVisibilityVariant(location.userSave.visibility)}>
  {location.userSave.visibility === 'public' && <Globe className="w-3 h-3" />}
  {location.userSave.visibility === 'followers' && <Users className="w-3 h-3" />}
  {location.userSave.visibility === 'private' && <Lock className="w-3 h-3" />}
  {location.userSave.visibility}
</Badge>
```

**3.2 Visibility Quick Toggle**
```tsx
// In location detail/edit views
<Select value={visibility} onChange={handleVisibilityChange}>
  <option value="private">🔒 Private (Only me)</option>
  <option value="followers">👥 Followers (My followers)</option>
  <option value="public">🌐 Public (Everyone)</option>
</Select>
```

**3.3 Privacy Settings Page**
```tsx
// src/app/settings/privacy/page.tsx
<Card>
  <CardTitle>Location Sharing</CardTitle>
  <Select value={user.showSavedLocations}>
    <option value="private">Don't show my locations to anyone</option>
    <option value="followers">Show to my followers</option>
    <option value="public">Show to everyone</option>
  </Select>
  <p className="text-sm text-muted-foreground">
    This controls who can see your locations on the map and your profile.
    Individual location visibility settings will still apply.
  </p>
</Card>
```

### Phase 4: Testing & Validation

**4.1 Test Cases**
- [ ] Private location never appears on public/friends layers
- [ ] Followers location only appears to actual followers
- [ ] Public location appears on public layer
- [ ] User's global privacy setting is respected
- [ ] Viewport bounds filtering works correctly
- [ ] Performance with 1000+ public locations

**4.2 Edge Cases**
- [ ] User unfollows → friends locations disappear
- [ ] User changes privacy setting → map updates
- [ ] User changes location visibility → map updates
- [ ] Multiple users at same coordinates (clustering)

## Security Considerations

### 1. **API Authorization**
```typescript
// Always verify:
// 1. For public locations → No auth required, but respect user's global setting
// 2. For friends locations → Verify follow relationship
// 3. For private locations → Only owner can see
```

### 2. **Data Exposure**
```typescript
// Public/friends location responses should NOT include:
// - productionNotes (private to owner)
// - personalRating (private to owner)
// - internal IDs that could be enumerated
// - Full address details (optional - show approximate)
```

### 3. **Rate Limiting**
```typescript
// Prevent abuse of public location endpoints
// Limit: 100 requests per user per hour
// Bounds size limit: Max 100km² viewport
```

## Migration Plan

### Database Migration
```sql
-- No migration needed - visibility column already exists
-- But add index if not present:
CREATE INDEX idx_user_saves_visibility ON user_saves(visibility);
```

### Default Values for Existing Data
```sql
-- All existing locations default to 'private'
-- No action needed - already set in schema default
```

### Gradual Rollout
1. **Week 1**: Deploy API endpoints (no UI changes)
2. **Week 2**: Add map layer controls (hidden behind feature flag)
3. **Week 3**: Enable for beta users
4. **Week 4**: Full rollout with announcement

## Open Questions for Product Decision

1. **Should public locations show full address or approximate?**
   - Option A: Full address (helps with finding spots)
   - Option B: Neighborhood only (better privacy)

2. **Should we show user info on public locations?**
   - Option A: Show username + avatar (social discovery)
   - Option B: Anonymous (privacy first)

3. **Default visibility for new locations?**
   - Current: `private`
   - Alternative: Ask user to choose on first save

4. **Should visibility be changeable after initial save?**
   - Currently: Yes (via API)
   - Consider: Audit log for visibility changes

5. **Map layer limits?**
   - Max number of public/friends locations to show at once
   - Clustering strategy for dense areas

## Next Steps

1. **Review & Decide:** Product team reviews design decisions above
2. **API Implementation:** Backend team implements endpoints (Phase 1)
3. **UI Design:** Design team creates mockups for map controls
4. **Frontend Implementation:** Frontend team integrates (Phase 2-3)
5. **QA Testing:** Test all privacy scenarios (Phase 4)
6. **Documentation:** Update user guides and API docs
7. **Launch:** Gradual rollout with monitoring

## Related Files to Modify

### Backend
- [ ] `src/app/api/locations/public/route.ts` (NEW)
- [ ] `src/app/api/locations/friends/route.ts` (NEW)
- [ ] `src/app/api/locations/route.ts` (MODIFY - add filters)

### Frontend
- [ ] `src/app/map/page.tsx` (MODIFY - add layers)
- [ ] `src/components/maps/MapLayerControls.tsx` (NEW)
- [ ] `src/components/maps/CustomMarker.tsx` (MODIFY - source styling)
- [ ] `src/hooks/useLocations.ts` (MODIFY - add public/friends fetching)

### Types
- [ ] `src/types/location.ts` (ADD - MarkerSource type)
- [ ] `src/types/user.ts` (VERIFY - privacy settings)

### Documentation
- [ ] `docs/api/locations.md` (NEW)
- [ ] `docs/features/visibility-system.md` (NEW)
- [ ] `README.md` (UPDATE - feature list)
