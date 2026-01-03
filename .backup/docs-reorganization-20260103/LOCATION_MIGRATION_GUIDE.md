# Location Architecture Migration - User-Specific Locations

**Date**: 2026-01-02  
**Status**: ⚠️ **READY TO APPLY**

---

## 🎯 What's Changing

### **Before (Shared Locations):**
```
Location Table:
- placeId: UNIQUE (same Google place = 1 shared record)
- All users see same location data
- Photos pooled by placeId

Problem: User 5 sees User 2's photos and notes ❌
```

### **After (User-Specific Locations):**
```
Location Table:
- placeId: NOT unique
- UNIQUE constraint on (createdBy, placeId)
- Each user gets their own copy of the location
- Photos tied to specific location record

Result: Each user sees only their own data ✅
```

---

## 📋 Migration Options

### **Option 1: Reset Database (Recommended for Development)**

**Pros:**
- Clean slate
- No data migration issues
- Fastest approach

**Cons:**
- Loses existing data (locations, photos, user_saves)
- Users remain intact

**Command:**
```bash
npx prisma migrate reset
npx prisma db push
```

### **Option 2: Manual SQL Migration (Keep Data)**

**Pros:**
- Keeps existing data
- Migrates photos to correct locations

**Cons:**
- More complex
- Requires manual SQL execution

**Steps:**
1. Run `LOCATION_MIGRATION_MANUAL.sql` in database
2. Run `npx prisma db push`

---

## 🔧 Schema Changes

### **Location Model:**
```diff
model Location {
  id        Int    @id @default(autoincrement())
- placeId   String @unique
+ placeId   String // NOT unique anymore
  createdBy Int
+ photos    Photo[] // New relation
  
- @@index([placeId])
+ @@unique([createdBy, placeId]) // Each user can save place once
+ @@index([placeId])              // For lookups
}
```

### **Photo Model:**
```diff
model Photo {
  id         Int    @id @default(autoincrement())
+ locationId Int    // Link to specific location record
  placeId    String // Keep for backwards compatibility
+ location   Location @relation(fields: [locationId], references: [id], onDelete: Cascade)
  
+ @@index([locationId])
}
```

---

## 🚀 Recommended Approach (Development)

Since you're in development, I recommend **Option 1** (reset):

```bash
# 1. Reset database (will lose current test data)
npx prisma migrate reset

# 2. Push new schema
npx prisma db push

# 3. Regenerate Prisma Client
npx prisma generate
```

**What you'll lose:**
- Existing locations
- Existing photos  
- Existing user_saves

**What you'll keep:**
- Users
- Sessions
- Security logs

---

## 📝 After Migration - Code Updates Needed

### **1. Location Creation** (`src/app/api/locations/route.ts`)
```typescript
// OLD: Check if location exists by placeId
const location = await prisma.location.findUnique({
    where: { placeId }
});

// NEW: Check if THIS USER already saved this place
const location = await prisma.location.findUnique({
    where: { 
        createdBy_placeId: {
            createdBy: user.id,
            placeId: placeId
        }
    }
});
```

### **2. Photo Creation** (`src/app/api/photos/route.ts`)
```typescript
// OLD: Photos linked by placeId only
await prisma.photo.create({
    data: {
        placeId,
        userId,
        // ...
    }
});

// NEW: Photos linked to specific location record
await prisma.photo.create({
    data: {
        locationId: location.id, // User's specific location
        placeId,  // Keep for compatibility
        userId,
        // ...
    }
});
```

### **3. Photo Fetching** (`src/app/api/photos/route.ts`)
```typescript
// OLD: Fetch all photos for placeId (all users)
const photos = await prisma.photo.findMany({
    where: { placeId }
});

// NEW: Fetch photos for specific location (one user)
const photos = await prisma.photo.findMany({
    where: { locationId }
});
```

---

## ✅ Decision Point

**Which approach do you want?**

1. **Reset database** (lose current data, clean start)
   - I'll run the commands for you
   - Then update all the code

2. **Manual migration** (keep data, more complex)
   - You run the SQL script manually
   - Then I update the code

**Let me know which you prefer and I'll proceed!**

---

## 🎯 Expected Behavior After Migration

When User 5 saves the same Google place as User 2:

**Before:**
- ❌ User 5 sees User 2's photos
- ❌ User 5 sees User 2's notes
- ❌ Editing changes data for both users

**After:**
- ✅ User 5 gets their own location record
- ✅ User 5 sees only their photos
- ✅ User 5's notes are separate
- ✅ Each user has independent data

---

**Ready when you are!** Let me know which approach you want to take. 🚀
