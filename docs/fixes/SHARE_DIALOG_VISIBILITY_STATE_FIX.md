# ShareLocationDialog Visibility State Fix

**Date:** January 21, 2026  
**Status:** ✅ Fixed

## Problem

After updating a location's visibility in the ShareLocationDialog and reloading the page, the dialog would default back to "Public" instead of showing the saved visibility setting.

## Root Cause

The `useState` hook only initializes once when the component mounts. When the page reloads and fresh data is fetched from the API:

1. Page reloads after visibility update
2. API fetches updated location data with new visibility
3. User opens ShareLocationDialog again
4. Dialog still shows old visibility from initial state

**The issue:** React state wasn't updating when the `location` prop changed with new data.

## Solution

Added a `useEffect` hook to sync the visibility state whenever the location's visibility changes:

```typescript
// Update visibility when location changes (after reload)
useEffect(() => {
  if (location?.userSave?.visibility) {
    setVisibility(location.userSave.visibility as VisibilityType);
  }
}, [location?.userSave?.visibility]);
```

## Changes Made

### File: `/src/components/dialogs/ShareLocationDialog.tsx`

**1. Added useEffect import:**
```typescript
import { useState, useEffect } from 'react';
```

**2. Added effect to sync visibility state:**
```typescript
export function ShareLocationDialog({ open, onOpenChange, location }) {
  const { user } = useAuth();
  const currentVisibility = (location?.userSave?.visibility as VisibilityType) || 'public';
  const [visibility, setVisibility] = useState<VisibilityType>(currentVisibility);
  
  // ✅ NEW: Update visibility when location changes (after reload)
  useEffect(() => {
    if (location?.userSave?.visibility) {
      setVisibility(location.userSave.visibility as VisibilityType);
    }
  }, [location?.userSave?.visibility]);
  
  // ... rest of component
}
```

## How It Works Now

### Complete Flow:

1. **User opens dialog:**
   - `location.userSave.visibility = 'private'`
   - State initializes: `visibility = 'private'`
   - Dialog shows "Private" with green highlight ✅

2. **User changes to "Public":**
   - Clicks "Public" button
   - State updates: `setVisibility('public')`
   - Green highlight moves to "Public" ✅

3. **User clicks "Update Visibility":**
   - API call: `PATCH /api/v1/locations/123/visibility`
   - Database updates: `visibility = 'public'`
   - Success toast shown
   - Page reloads

4. **After page reload:**
   - API fetches fresh data: `location.userSave.visibility = 'public'`
   - useEffect triggers because `location.userSave.visibility` changed
   - State updates: `setVisibility('public')` ✅
   - Dialog now correctly shows "Public" with green highlight

5. **User opens dialog again:**
   - Dialog shows correct saved value from database ✅

## Data Flow

```
[Database]
    ↓
[API: GET /api/locations]
    ↓
[location.userSave.visibility = 'public']
    ↓
[useEffect detects change]
    ↓
[setVisibility('public')]
    ↓
[Dialog shows "Public" selected with green highlight ✅]
```

## Testing

### Manual Test Steps:

1. **Test initial load:**
   - Create a location with default visibility ('private')
   - Open ShareLocationDialog
   - Verify "Private" is selected and highlighted in green ✅

2. **Test update to Public:**
   - Click "Public" option
   - Click "Update Visibility"
   - Wait for page reload
   - Open ShareLocationDialog again
   - Verify "Public" is selected and highlighted in green ✅

3. **Test update to Followers:**
   - Click "Followers" option
   - Click "Update Visibility"
   - Wait for page reload
   - Open ShareLocationDialog again
   - Verify "Followers" is selected and highlighted in green ✅

4. **Test update to Private:**
   - Click "Private" option
   - Click "Update Visibility"
   - Wait for page reload
   - Open ShareLocationDialog again
   - Verify "Private" is selected and highlighted in green ✅

### Expected Behavior:

- ✅ Dialog always shows current saved visibility
- ✅ Green highlight on correct option
- ✅ State syncs after page reload
- ✅ No default to "Public" anymore

## Why This Fix Works

### React State Update Pattern:

**Before (Broken):**
```typescript
const [visibility, setVisibility] = useState(currentVisibility);
// State only set once on mount
// Never updates when location prop changes
```

**After (Fixed):**
```typescript
const [visibility, setVisibility] = useState(currentVisibility);

useEffect(() => {
  if (location?.userSave?.visibility) {
    setVisibility(location.userSave.visibility);
  }
}, [location?.userSave?.visibility]);
// State updates whenever location.userSave.visibility changes
```

## Related Files

- ✅ `/src/components/dialogs/ShareLocationDialog.tsx` - Fixed
- ✅ `/src/app/api/locations/route.ts` - Already returns visibility
- ✅ `/src/app/api/v1/locations/[id]/visibility/route.ts` - Saves correctly
- ✅ `/prisma/schema.prisma` - Schema has visibility field
- ✅ `/src/types/location.ts` - TypeScript types correct

## Verification

### API Response Includes Visibility:

```typescript
// GET /api/locations returns:
{
  locations: [
    {
      id: 123,
      userId: 456,
      locationId: 789,
      visibility: "public",  // ✅ Included
      caption: "...",
      savedAt: "...",
      location: { ... }
    }
  ]
}
```

### Dialog Reads Visibility:

```typescript
// ShareLocationDialog receives:
location = {
  id: 789,
  name: "...",
  userSave: {
    id: 123,
    visibility: "public",  // ✅ Available
    caption: "..."
  }
}
```

### useEffect Syncs State:

```typescript
// When location changes:
location.userSave.visibility changes
  → useEffect triggers
  → setVisibility(location.userSave.visibility)
  → Dialog UI updates with correct selection ✅
```

## Notes

- This is a common React pattern for syncing state with props
- The dependency array `[location?.userSave?.visibility]` ensures the effect only runs when visibility actually changes
- The optional chaining (`?.`) prevents errors if location or userSave is null
- The effect includes a safety check: `if (location?.userSave?.visibility)`

## Future Enhancements

Consider these improvements:

1. **Optimistic UI Update:**
   - Update UI immediately without page reload
   - Use React Query mutation with cache update
   - Remove `window.location.reload()`

2. **Invalidate Query Instead of Reload:**
   ```typescript
   const queryClient = useQueryClient();
   await queryClient.invalidateQueries(['locations']);
   ```

3. **Add Loading State:**
   - Show loading spinner during update
   - Disable buttons while updating

4. **Add Undo Functionality:**
   - Keep previous value
   - Allow reverting changes
