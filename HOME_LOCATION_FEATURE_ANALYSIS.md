# Home Location Feature - Analysis & Design

**Date**: 2025-12-27 15:28 EST  
**Status**: 📋 **DESIGN PHASE - NO ACTION TAKEN**

---

## 📋 **User Request Summary**

### **Goal:**
Allow users to set a custom "Home Location" as their default map center instead of NYC.

### **Requirements:**

**1. Setting Methods (3 ways):**
- ✅ Current GPS Location (use device GPS)
- ✅ Google Search (search for an address)
- ✅ Point on Map (click to select)

**2. UI Location:**
- Path: `/profile` → Preferences tab → Home section
- Position: **Top of preferences** (above Email Notifications)

**3. Behavior:**
- Only editable in Preferences (not in /locations or map)
- Map uses this location as default center on load
- Falls back to NYC if not set

**4. Visual Treatment:**
- Use House icon (🏠) to identify home location
- Distinguish it visually from other locations

---

## 🎯 **Current State Analysis**

### **Map Default Center:**
```typescript
// src/app/map/page.tsx - line 31
const [center, setCenter] = useState({ lat: 40.7128, lng: -74.006 }); // NYC default
```

Currently hardcoded to New York City coordinates.

---

## 🔍 **Two Approaches Evaluated**

---

## **Option 1: Add Fields to User Table** ⭐ RECOMMENDED

### **Database Schema:**
```prisma
model User {
  // ... existing fields
  
  // Home Location
  homeLocationName    String? // e.g., "123 Main St, Boston, MA"
  homeLocationLat     Float?
  homeLocationLng     Float?
  homeLocationUpdated DateTime?
}
```

### **Pros:**
- ✅ **Simple & Direct** - Easy access via `user.homeLocationLat/Lng`
- ✅ **Clear Separation** - User preference, not a saved location
- ✅ **Fast Queries** - No joins needed, direct user lookup
- ✅ **Clean Logic** - No filtering required in locations list
- ✅ **Appropriate** - Home location is a user setting, belongs in User table
- ✅ **No Conflicts** - Won't interfere with user_saves table

### **Cons:**
- Adds 4 new columns to User table (minimal impact)

### **Implementation:**
```typescript
// Map page would load like this:
const [center, setCenter] = useState(
  user?.homeLocationLat && user?.homeLocationLng
    ? { lat: user.homeLocationLat, lng: user.homeLocationLng }
    : { lat: 40.7128, lng: -74.006 } // NYC fallback
);
```

---

## **Option 2: Special UserSave with "isHome" Flag**

### **Database Schema:**
```prisma
model UserSave {
  // ... existing fields
  isHome Boolean @default(false) // Only one can be true per user
}
```

### **Pros:**
- ✅ Reuses existing location infrastructure
- ✅ Could leverage full location data (address, photos, etc.)

### **Cons:**
- ❌ **Mixes Concerns** - Home is a preference, not a saved place
- ❌ **Complex Filtering** - Need to exclude home from locations list
- ❌ **Query Overhead** - Extra joins and filters
- ❌ **Logic Complexity** - Ensure only one home per user
- ❌ **User Confusion** - Home appearing in saved locations could be confusing
- ❌ **Edits Problem** - Need to prevent editing via /locations page

---

## 🏆 **Recommendation: Option 1 (User Table)**

**Why Option 1 is Better:**

1. **Semantically Correct** - Home location is a user preference, not a saved place
2. **Simpler Implementation** - Direct access, no filtering logic
3. **Better Performance** - No joins, faster queries
4. **Cleaner UX** - Home doesn't clutter saved locations
5. **Easier Maintenance** - Clear separation of concerns

---

## 🎨 **Proposed UI/UX Design**

### **Preferences Tab Layout:**

```
┌─────────────────────────────────────────┐
│ Preferences                             │
├─────────────────────────────────────────┤
│                                         │
│ 🏠 Home Location                        │
│ ─────────────────────────────────────── │
│                                         │
│ Set your default map location           │
│                                         │
│ Current Home: 123 Main St, Boston, MA  │
│ Coordinates: 42.3601° N, 71.0589° W    │
│                                         │
│ [Use Current GPS] [Search Address]     │
│ [Pick on Map]                           │
│                                         │
│ Last updated: Dec 27, 2024              │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│ 📧 Email Notifications     [Toggle]     │
│ ─────────────────────────────────────── │
│ ...                                     │
└─────────────────────────────────────────┘
```

---

## 🔧 **Implementation Components**

### **1. Database Migration**

```sql
ALTER TABLE users ADD COLUMN homeLocationName VARCHAR(255);
ALTER TABLE users ADD COLUMN homeLocationLat DOUBLE;
ALTER TABLE users ADD COLUMN homeLocationLng DOUBLE;
ALTER TABLE users ADD COLUMN homeLocationUpdated DATETIME;
```

### **2. API Endpoint**

**Update Profile API:**
```typescript
// PATCH /api/auth/profile
// Add to validation schema:
homeLocationName: z.string().max(255).optional(),
homeLocationLat: z.number().min(-90).max(90).optional(),
homeLocationLng: z.number().min(-180).max(180).optional(),
```

### **3. Preferences Component**

**New Component: `HomeLocationSettings.tsx`**

Features:
- Display current home location
- Three action buttons:
  1. "Use Current GPS" - Triggers GPS, sets coords
  2. "Search Address" - Opens Google Places search
  3. "Pick on Map" - Opens map modal for clicking

### **4. Map Modal for Selection**

**Component: `HomeLocationMapPicker.tsx`**

- Modal dialog with map
- Click anywhere to set location
- Shows preview marker
- "Set as Home" button to confirm

### **5. Map Page Integration**

```typescript
// Use home location as default center
const defaultCenter = useMemo(() => {
  if (user?.homeLocationLat && user?.homeLocationLng) {
    return {
      lat: user.homeLocationLat,
      lng: user.homeLocationLng,
    };
  }
  return { lat: 40.7128, lng: -74.006 }; // NYC fallback
}, [user]);

const [center, setCenter] = useState(defaultCenter);
```

---

## 🎨 **Visual Design Details**

### **Home Location Display:**

**In Preferences:**
```
🏠 Home Location
─────────────────────────────────────────
Currently set to:
📍 123 Main Street, Boston, MA
   42.3601° N, 71.0589° W

[Use Current GPS]  [Search Address]  [Pick on Map]

Last updated: December 27, 2024
```

**Optional: Show on Map**
- Small house icon at home location
- Different color (e.g., warm orange/yellow)
- Tooltip: "Your Home Location"
- **NOT clickable** (can't edit from map)
- **NOT in locations list**

---

## 📐 **Data Flow**

### **Setting Home via GPS:**
```
User clicks "Use Current GPS"
    ↓
Check GPS permission (use existing logic)
    ↓
Get device location via Geolocation API
    ↓
Reverse geocode to get address name
    ↓
PATCH /api/auth/profile:
  {
    homeLocationName: "123 Main St, Boston, MA",
    homeLocationLat: 42.3601,
    homeLocationLng: -71.0589,
    homeLocationUpdated: new Date()
  }
    ↓
Refresh user data
    ↓
Show success toast
```

### **Setting Home via Search:**
```
User clicks "Search Address"
    ↓
Open Google Places Autocomplete
    ↓
User selects address
    ↓
Get place details (lat, lng, formatted address)
    ↓
PATCH /api/auth/profile (same as above)
```

### **Setting Home via Map:**
```
User clicks "Pick on Map"
    ↓
Open modal with Google Map
    ↓
User clicks on map
    ↓
Get clicked coordinates
    ↓
Reverse geocode to get address
    ↓
Show preview: "Set home to: [address]?"
    ↓
User confirms
    ↓
PATCH /api/auth/profile
```

---

## 🔒 **Business Rules**

1. ✅ **Optional** - Users don't have to set a home location
2. ✅ **Fallback** - If not set, map defaults to NYC
3. ✅ **Update Anytime** - Users can change home location freely
4. ✅ **Clear Button** - Option to remove/clear home location
5. ✅ **Timestamp** - Track when home was last updated
6. ❌ **No Multi-Home** - Only one home location per user
7. ❌ **Preferences Only** - Can't edit from map or locations page

---

## 🚫 **What Home Location Is NOT:**

- ❌ Not a saved location (doesn't appear in /locations)
- ❌ Not editable from map page
- ❌ Not deletable from locations list
- ❌ No photos, ratings, or production notes
- ❌ Not shareable or collaborative

---

## ✅ **What Home Location IS:**

- ✅ A user preference/setting
- ✅ Default map center point
- ✅ Convenience feature
- ✅ Personal to each user
- ✅ Optional and changeable

---

## 📊 **Comparison Summary**

| Aspect | Option 1: User Table | Option 2: UserSave Flag |
|--------|---------------------|------------------------|
| **Semantics** | ✅ Correct (preference) | ❌ Wrong (saved place) |
| **Simplicity** | ✅ Simple & direct | ❌ Complex filtering |
| **Performance** | ✅ Fast (no joins) | ❌ Slower (joins) |
| **User Confusion** | ✅ Clear separation | ❌ Mixes concepts |
| **Maintenance** | ✅ Easy | ❌ More complex |
| **Schema Changes** | 4 new columns | 1 new column |

**Winner: Option 1 (User Table)** 🏆

---

## 🎯 **Final Recommendation**

**Use Option 1: Add fields to User table**

### **Prisma Schema Addition:**
```prisma
model User {
  // ... existing fields
  
  // Home Location (default map center)
  homeLocationName    String?   // User-friendly address
  homeLocationLat     Float?    // Latitude
  homeLocationLng     Float?    // Longitude
  homeLocationUpdated DateTime? // Last update timestamp
}
```

### **UI Hierarchy:**
```
/profile → Preferences tab
  ↓
  1. 🏠 Home Location (NEW - at top)
  2. 📧 Email Notifications
  3. 🌐 Language
  4. 🕐 Timezone
  5. 📍 GPS Permission
```

### **Three Setting Methods:**
1. **GPS** - One-click, uses device location
2. **Search** - Google Places Autocomplete
3. **Map** - Modal with clickable map

---

## ❓ **Questions for Confirmation**

Before implementing, please confirm:

1. ✅ **Option 1 (User Table)** - Is this approach approved?
2. ❓ **Show on Map** - Should home location appear as a house icon on the map?
   - If yes: Read-only marker, just visual reference
   - If no: Only used as default center, not shown
3. ❓ **Clear/Remove** - Should there be a "Clear Home Location" button?
4. ❓ **Priority** - Which setting method to implement first?
   - GPS (easiest)
   - Search (moderate)
   - Map picker (most complex)

---

**Ready to implement once you confirm the approach!**
