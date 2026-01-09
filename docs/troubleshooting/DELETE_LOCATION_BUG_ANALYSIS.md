# Delete Location Bug - Root Cause Analysis

**Date:** January 9, 2026  
**Issue:** Locations not being deleted from database when user clicks delete button  
**Severity:** HIGH - Data integrity issue  
**Status:** IDENTIFIED - Fix Required

---

## Problem Statement

When users delete a location (especially in List Compact view), the location is removed from the UI but **remains in the database**. On page refresh, the deleted location reappears.

### User Report
> "I noticed after deleting locations, no photos, the location was not removed from the table. I believe the delete API skips the locationID associated with the userId on the location table."

---

## Root Cause

**ID Mismatch Between Frontend and Backend**

The delete functionality has an architectural mismatch:

1. **Frontend sends:** `location.id` (the `Location` table's primary key)
2. **Backend expects:** `userSave.id` (the `UserSave` table's primary key)

### Database Architecture

```prisma
model Location {
  id: number (PK)
  placeId: string
  name: string
  // ... other fields
  savedBy: UserSave[]  // One-to-many relationship
}

model UserSave {
  id: number (PK)            // ← API expects THIS
  userId: number
  locationId: number         // ← Frontend sends THIS
  savedAt: DateTime
  // ... other fields
  location: Location
}
```

**Key Insight:** When a user "deletes a location," they're actually removing their **save** of that location (the `UserSave` record), NOT the `Location` itself. This is by design to support location sharing.

---

## Code Analysis

### 1. DELETE API Endpoint
**File:** `src/app/api/locations/[id]/route.ts` (lines 263-309)

```typescript
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: idParam } = await params;
    const id = parseInt(idParam);  // ← Expects UserSave.id

    // Get the UserSave (NOT the Location!)
    const userSave = await prisma.userSave.findUnique({
        where: { id },  // ← Looking up by UserSave.id
    });

    if (!userSave) {
        return apiError('Saved location not found', 404, 'NOT_FOUND');
    }

    // Delete the UserSave (keeps Location for other users)
    await prisma.userSave.delete({
        where: { id },
    });
}
```

**Design Intent:** Delete only the user's save, preserve the Location for other users.

---

### 2. Frontend Data Transformation
**File:** `src/app/locations/page.tsx` (lines 40-47)

```typescript
// API returns UserSave[] with nested location
const allLocations = data?.locations
    ?.filter((userSave: UserSave) => userSave.location)
    ?.map((userSave: UserSave) => ({
        ...(userSave.location as Location),  // Spread Location fields
        userSave: userSave,                  // Attach UserSave as nested object
    })) || [];
```

**Result Structure:**
```typescript
{
    id: 456,              // ← Location.id (WRONG for delete!)
    name: "Studio A",
    // ... other Location fields
    userSave: {
        id: 123,          // ← UserSave.id (CORRECT for delete!)
        userId: 789,
        locationId: 456,
        savedAt: "2026-01-09"
    }
}
```

---

### 3. Delete Handler Calls

#### ❌ **BROKEN: LocationListCompact.tsx** (line 243)
```typescript
<DropdownMenuItem
    onClick={(e) => {
        e.stopPropagation();
        onDelete(location.id);  // ← Sends Location.id (456) - WRONG!
    }}
>
    <Trash2 className="w-4 h-4 mr-2" />
    Delete
</DropdownMenuItem>
```

#### ✅ **WORKING: LocationCard.tsx** (line 212)
```typescript
<Button
    onClick={(e) => {
        e.stopPropagation();
        onDelete?.(userSave?.id || location.id);  // ← Sends UserSave.id (123) - CORRECT!
    }}
>
    <Trash2 className="w-4 h-4" />
</Button>
```

**Key Difference:** `LocationCard` correctly uses `userSave?.id`, while `LocationListCompact` incorrectly uses `location.id`.

---

### 4. LocationDetailModal.tsx Issue
**File:** `src/components/locations/LocationDetailModal.tsx` (line 171)

```typescript
onDelete(location.id);  // ← Also incorrect!
```

---

## Bug Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│ 1. API Returns Data                                         │
│    UserSave { id: 123, locationId: 456, location: {...} }  │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Frontend Transforms                                      │
│    Location { id: 456, userSave: { id: 123 } }            │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. User Clicks Delete in List Compact View                 │
│    onDelete(location.id)  // Sends 456                     │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. DELETE /api/locations/456                                │
│    WHERE userSave.id = 456  // No match!                   │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. API Returns 404 "Saved location not found"              │
│    UserSave with id=456 doesn't exist                       │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. Frontend Optimistic Update Removes from UI              │
│    But onError rollback may fail silently                   │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│ 7. User Refreshes Page                                     │
│    Location reappears (still in database!)                  │
└─────────────────────────────────────────────────────────────┘
```

---

## Why LocationCard Works

**LocationCard.tsx** has a **fallback mechanism**:

```typescript
onDelete?.(userSave?.id || location.id);
```

- **If `userSave` exists:** Uses `userSave.id` (123) ✅
- **If `userSave` is missing:** Falls back to `location.id` (456) ⚠️

**This fallback is a workaround**, not a proper fix. It works in most cases because the page transformation ensures `userSave` is always present.

---

## Why the Bug Exists

1. **Inconsistent Implementation:** Three different components handle delete differently
2. **No Type Safety:** TypeScript doesn't prevent passing wrong ID type
3. **Misleading Naming:** The `id` in the URL path `/api/locations/[id]` suggests it's a Location ID, but it's actually a UserSave ID
4. **Missing Validation:** No server-side logging to catch ID mismatches

---

## Impact Assessment

### Affected Components
1. ❌ **LocationListCompact.tsx** - Always broken
2. ❌ **LocationDetailModal.tsx** - Always broken
3. ✅ **LocationCard.tsx** - Works (has fallback)

### User Experience
- ✅ **Grid View:** Works (uses LocationCard with fallback)
- ❌ **List View:** Broken (uses LocationListCompact)
- ❌ **Detail Modal:** Broken (passes wrong ID)

### Data Integrity
- **Database:** Orphaned UserSave records accumulate
- **Storage:** Photos may remain without cleanup
- **Performance:** User's location list grows unchecked

---

## Recommended Fix

### Option 1: Fix Frontend Components (RECOMMENDED)
Change all delete calls to use `userSave.id`:

**LocationListCompact.tsx:**
```typescript
// BEFORE
onDelete(location.id);

// AFTER
onDelete(location.userSave?.id || location.id);
```

**LocationDetailModal.tsx:**
```typescript
// BEFORE
onDelete(location.id);

// AFTER
onDelete(location.userSave?.id || location.id);
```

**Pros:**
- Minimal changes
- Preserves existing API contract
- Consistent with LocationCard pattern

**Cons:**
- Fallback still feels like a workaround

---

### Option 2: Refactor API Route (More Work)
Rename route to clarify it's for UserSave:

```typescript
// FROM: /api/locations/[id]
// TO:   /api/user-saves/[id]
```

**Pros:**
- Clearer naming
- Better separation of concerns
- Type safety improvements

**Cons:**
- Breaking change
- Requires updating all API calls
- More testing required

---

### Option 3: Dual Lookup API (Safest)
Make API accept both UserSave ID and Location ID:

```typescript
// Try UserSave.id first
let userSave = await prisma.userSave.findUnique({ where: { id } });

// If not found, try finding by Location.id + userId
if (!userSave) {
    userSave = await prisma.userSave.findFirst({
        where: { locationId: id, userId: user.id }
    });
}
```

**Pros:**
- Backward compatible
- Works with both ID types
- No frontend changes needed

**Cons:**
- Hides the underlying issue
- Extra database query
- Less explicit contract

---

## Immediate Action Items

1. ✅ **Fix LocationListCompact.tsx** - Change `location.id` to `location.userSave?.id || location.id`
2. ✅ **Fix LocationDetailModal.tsx** - Change `location.id` to `location.userSave?.id || location.id`
3. ⚠️ **Add API Logging** - Log mismatched IDs for monitoring
4. ⚠️ **Add Tests** - Test delete with both view modes
5. ⚠️ **Database Cleanup** - Query for orphaned UserSave records

---

## Testing Checklist

After fix:
- [ ] Delete location from Grid view (LocationCard)
- [ ] Delete location from List view (LocationListCompact)
- [ ] Delete location from Detail Modal
- [ ] Verify deletion persists after page refresh
- [ ] Check database to confirm UserSave is deleted
- [ ] Verify Location remains if shared with others
- [ ] Test error handling (network failure, permission denied)

---

## Prevention Measures

1. **Type Safety:** Create `UserSaveId` and `LocationId` branded types
2. **API Documentation:** Clearly document ID expectations
3. **Prop Names:** Use `userSaveId` instead of generic `id`
4. **Server Validation:** Log warnings when ID lookup fails
5. **Integration Tests:** Test all delete paths

---

## Related Files

### Need Changes:
- `src/components/locations/LocationListCompact.tsx` (line 243)
- `src/components/locations/LocationDetailModal.tsx` (line 171)

### Reference (Working):
- `src/components/locations/LocationCard.tsx` (line 212)

### API:
- `src/app/api/locations/[id]/route.ts` (DELETE handler, line 266)

### Hook:
- `src/hooks/useDeleteLocation.ts` (mutation logic)

---

## Conclusion

This is a **critical data integrity bug** caused by ID mismatch between frontend and backend. The fix is straightforward: ensure all delete calls pass `userSave.id` instead of `location.id`.

**Priority:** HIGH  
**Effort:** LOW (2 line changes)  
**Risk:** LOW (follows existing pattern in LocationCard)

---

**Next Steps:** Apply Option 1 fix to LocationListCompact and LocationDetailModal.
