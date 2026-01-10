# Location Deletion Behavior - Architecture & Recommendations

**Date:** January 9, 2026  
**Status:** 🔍 DIAGNOSED - Design Decision Required  
**Impact:** Database Orphans & ImageKit Storage Costs

---

## 🎯 Current Behavior (By Design)

When a user "deletes a location," the system currently:

1. ✅ **Deletes UserSave** - Removes the user's save record
2. ❌ **Preserves Location** - Keeps the Location table record
3. ❌ **Preserves Photos** - Keeps Photo table records AND ImageKit files
4. ✅ **UI Updated** - User no longer sees the location in their list

### Why This Design?

**Shared Resource Model:**
- Locations can be saved by multiple users
- Deleting UserSave only removes it from one user's list
- Location remains available for other users who saved it

**Example:**
```
Location: "Griffith Observatory"
- User A saves it → UserSave #1 created
- User B saves it → UserSave #2 created
- User A deletes it → UserSave #1 deleted, Location preserved for User B
- User B deletes it → UserSave #2 deleted, Location becomes ORPHANED ⚠️
```

---

## 🚨 Problem: Orphaned Data

### What Gets Orphaned?

When the **last user** deletes a location:

1. **Location Record** - Remains in database with `0 saves`
2. **Photo Records** - Remain in database (linked to orphaned location)
3. **ImageKit Files** - Remain in cloud storage (COSTING MONEY 💰)

### Database State Example

**Before Last Delete:**
```sql
-- UserSave
id: 123, userId: 1, locationId: 456

-- Location
id: 456, name: "Studio A", createdBy: 1

-- Photos
id: 789, locationId: 456, imagekitFileId: "abc123"
```

**After Last Delete:**
```sql
-- UserSave (DELETED)
-- (empty)

-- Location (ORPHANED ⚠️)
id: 456, name: "Studio A", createdBy: 1

-- Photos (ORPHANED ⚠️)
id: 789, locationId: 456, imagekitFileId: "abc123"

-- ImageKit Storage (STILL STORING FILE 💰)
File ID: abc123 → COSTING STORAGE FEES
```

---

## 📊 Current Deletion Flow (With Debug Logging)

The enhanced DELETE endpoint now logs:

```
========================================
🗑️  DELETE LOCATION - START
========================================

📋 Request Details:
   User ID: 1
   User Email: user@example.com
   UserSave ID: 123

✅ Found UserSave:
   UserSave ID: 123
   Location ID: 456
   Location Name: Studio A
   Photos Count: 3
   Total Saves (by all users): 1

✅ Permission check passed

📷 Photos associated with this location:
   1. Photo ID: 789
      ImageKit File ID: abc123
      ImageKit Path: /locations/456/photo1.jpg
      Uploaded by User ID: 1
   2. Photo ID: 790
      ImageKit File ID: def456
      ImageKit Path: /locations/456/photo2.jpg
      Uploaded by User ID: 1

📊 Deletion Impact Analysis:
   Is this the last save? YES
   Other users with this location: 0

⚠️  WARNING: This is the LAST save of this location!
   Location ID 456 will become orphaned.
   3 photo(s) will become orphaned.
   Consider implementing orphan cleanup.

🗑️  Deleting UserSave ID: 123...
✅ UserSave deleted successfully

📝 Database State After Deletion:
   ✅ UserSave 123 - DELETED
   ✅ Location 456 - PRESERVED (by design)
   ✅ Photos (3) - PRESERVED (by design)

⚠️  IMPORTANT NOTES:
   1. UserSave record is removed from database
   2. Location record remains in database (shared resource)
   3. Photos remain in database AND ImageKit (not deleted)
   4. User will no longer see this location in their saved list

🚨 ORPHANED RESOURCES DETECTED:
   Location ID 456 has no remaining saves
   3 photo(s) are now orphaned in database AND ImageKit
   ImageKit storage is NOT being cleaned up!
   Consider implementing a cleanup job for orphaned locations/photos

========================================
✅ DELETE LOCATION - COMPLETE
========================================
```

---

## 💰 Cost Impact

### ImageKit Storage Costs
- Files are NOT deleted from ImageKit
- You're paying for storage of deleted photos
- Files accumulate over time

### Database Bloat
- Orphaned Location records
- Orphaned Photo records
- Slower queries over time

---

## 🔧 Solution Options

### Option 1: Cascade Delete (Aggressive) ⚠️

**When to use:** Single-user app, no location sharing

**Implementation:**
```typescript
// If last save, delete everything
if (isLastSave) {
    console.log('🗑️  Cascade delete - removing location and photos...');
    
    // 1. Delete photos from ImageKit
    for (const photo of userSave.location.photos) {
        try {
            await imagekit.deleteFile(photo.imagekitFileId);
            console.log(`✅ Deleted photo ${photo.id} from ImageKit`);
        } catch (error) {
            console.error(`❌ Failed to delete photo ${photo.id}:`, error);
        }
    }
    
    // 2. Delete photos from database
    await prisma.photo.deleteMany({
        where: { locationId: userSave.locationId }
    });
    
    // 3. Delete location
    await prisma.location.delete({
        where: { id: userSave.locationId }
    });
    
    console.log('✅ Cascade delete complete');
}

// Delete UserSave
await prisma.userSave.delete({ where: { id } });
```

**Pros:**
- ✅ No orphaned data
- ✅ No storage costs for deleted content
- ✅ Clean database

**Cons:**
- ❌ If location was shared, other users lose it
- ❌ Permanent data loss
- ❌ No recovery option

---

### Option 2: Soft Delete / Archive (Recommended) ✅

**When to use:** Multi-user app with data retention needs

**Implementation:**
```prisma
// Add to Location model
model Location {
  // ...existing fields
  deletedAt DateTime?
  deletedBy Int?
}

// Add to Photo model
model Photo {
  // ...existing fields
  deletedAt DateTime?
}
```

**Code:**
```typescript
if (isLastSave) {
    console.log('🗑️  Soft delete - marking as deleted...');
    
    // Mark location as deleted
    await prisma.location.update({
        where: { id: userSave.locationId },
        data: {
            deletedAt: new Date(),
            deletedBy: user.id
        }
    });
    
    // Mark photos as deleted
    await prisma.photo.updateMany({
        where: { locationId: userSave.locationId },
        data: { deletedAt: new Date() }
    });
    
    console.log('✅ Soft delete complete');
}
```

**Cleanup Job (run nightly):**
```typescript
// Delete files older than 30 days
const oldDeletedPhotos = await prisma.photo.findMany({
    where: {
        deletedAt: {
            lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        }
    }
});

for (const photo of oldDeletedPhotos) {
    await imagekit.deleteFile(photo.imagekitFileId);
    await prisma.photo.delete({ where: { id: photo.id } });
}
```

**Pros:**
- ✅ 30-day recovery window
- ✅ Audit trail
- ✅ Accidental delete protection
- ✅ Gradual cleanup

**Cons:**
- ⚠️ Requires background job
- ⚠️ More complex queries (need to filter deletedAt)

---

### Option 3: Orphan Cleanup Job (Minimal Change) 🔄

**When to use:** Don't want to change delete logic, but need cleanup

**Implementation:**
```typescript
// scripts/cleanup-orphans.ts
async function cleanupOrphans() {
    // Find locations with no saves
    const orphanedLocations = await prisma.location.findMany({
        where: {
            savedBy: {
                none: {}
            }
        },
        include: {
            photos: true
        }
    });

    console.log(`Found ${orphanedLocations.length} orphaned locations`);

    for (const location of orphanedLocations) {
        console.log(`Cleaning up location ${location.id}: ${location.name}`);
        
        // Delete photos from ImageKit
        for (const photo of location.photos) {
            try {
                await imagekit.deleteFile(photo.imagekitFileId);
            } catch (error) {
                console.error(`Failed to delete photo ${photo.id}`, error);
            }
        }
        
        // Delete from database (cascade will handle photos)
        await prisma.location.delete({
            where: { id: location.id }
        });
        
        console.log(`✅ Cleaned up location ${location.id}`);
    }
}
```

**Run via cron:**
```bash
# Run daily at 2 AM
0 2 * * * cd /app && node scripts/cleanup-orphans.js
```

**Pros:**
- ✅ No code changes to delete flow
- ✅ Eventual consistency
- ✅ Batch processing

**Cons:**
- ⚠️ Delay before cleanup
- ⚠️ Storage costs until job runs
- ⚠️ Requires cron setup

---

### Option 4: Reference Counting (Conservative) 🔢

**When to use:** Want to preserve data but track usage

**Implementation:**
```typescript
// After delete, check reference count
const remainingSaves = await prisma.userSave.count({
    where: { locationId: userSave.locationId }
});

if (remainingSaves === 0) {
    // Mark for cleanup but don't delete yet
    await prisma.location.update({
        where: { id: userSave.locationId },
        data: {
            // Add custom field
            lastAccessedAt: null,
            // Or use existing field
            updatedAt: new Date()
        }
    });
    
    console.log(`⚠️  Location ${userSave.locationId} marked for cleanup (0 saves)`);
}
```

**Cleanup job removes locations not accessed in 90 days**

**Pros:**
- ✅ Long retention period
- ✅ Automatic cleanup
- ✅ Low risk

**Cons:**
- ⚠️ Slow cleanup
- ⚠️ Higher storage costs

---

## 🎯 Recommended Approach

**For Your Use Case (Development DB):**

1. **Immediate:** Implement **Option 3 (Orphan Cleanup Job)**
   - Run it manually now to clean existing orphans
   - Schedule it to run weekly

2. **Medium Term:** Add **Option 2 (Soft Delete)**
   - 30-day retention
   - Nightly cleanup job

3. **Production:** Monitor and adjust based on:
   - User behavior (how often they delete)
   - Storage costs
   - Data retention policies

---

## 🔍 How to Check for Orphans Now

```sql
-- Find locations with no saves
SELECT l.id, l.name, l.createdAt, 
       COUNT(us.id) as save_count,
       (SELECT COUNT(*) FROM photos WHERE locationId = l.id) as photo_count
FROM locations l
LEFT JOIN user_saves us ON us.locationId = l.id
GROUP BY l.id
HAVING COUNT(us.id) = 0;

-- Find total orphaned photos
SELECT COUNT(*) as orphaned_photos
FROM photos p
WHERE p.locationId IN (
    SELECT l.id FROM locations l
    LEFT JOIN user_saves us ON us.locationId = l.id
    GROUP BY l.id
    HAVING COUNT(us.id) = 0
);

-- Estimate ImageKit storage being wasted
SELECT 
    COUNT(*) as orphaned_files,
    SUM(fileSize) / 1024 / 1024 as total_mb
FROM photos p
WHERE p.locationId IN (
    SELECT l.id FROM locations l
    LEFT JOIN user_saves us ON us.locationId = l.id
    GROUP BY l.id
    HAVING COUNT(us.id) = 0
);
```

---

## 📝 Next Steps

1. ✅ **Test delete with new debug logging** - See terminal output
2. ⚠️ **Run orphan query** - Check how many orphans you have
3. ⚠️ **Choose cleanup strategy** - Pick Option 1, 2, 3, or 4
4. ⚠️ **Implement chosen strategy** - Add cleanup code
5. ⚠️ **Monitor storage costs** - Track ImageKit usage

---

## 🔗 Related Files

- `src/app/api/locations/[id]/route.ts` - Enhanced DELETE handler with debug logs
- `src/app/api/photos/[id]/route.ts` - Photo deletion logic
- `prisma/schema.prisma` - Database schema with cascade rules
- `docs/troubleshooting/DELETE_LOCATION_BUG_FIX.md` - UserSave ID fix

---

**Status:** Ready for testing and strategy decision  
**Priority:** MEDIUM (costs accumulating but not urgent)  
**Effort:** Varies by option (1hr - 4hrs)
