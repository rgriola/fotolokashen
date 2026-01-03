# Constants Centralization Summary

## ✅ Already Centralized

### Location Types & Colors
**File:** `src/lib/location-constants.ts`
- `TYPE_COLOR_MAP` - Maps location types to marker colors
- `LOCATION_TYPES` - Array of all location type names
- `getColorForType()` - Helper function

**Used in:**
- SaveLocationPanel.tsx
- EditLocationPanel.tsx
- LocationCard.tsx
- LocationFilters.tsx

### ImageKit Configuration
**File:** `src/lib/imagekit.ts`
- `IMAGEKIT_URL_ENDPOINT` - ImageKit CDN URL
- Helper functions for ImageKit operations

---

## 🆕 Newly Created

### Form Field Constants
**File:** `src/lib/form-constants.ts`
- `INDOOR_OUTDOOR_OPTIONS` - ["indoor", "outdoor", "both"]
- `DEFAULT_INDOOR_OUTDOOR` - "outdoor"
- `indoorOutdoorSchema` - Reusable Zod schema
- `LOCATION_SORT_OPTIONS` - Sort dropdown options
- `MIN_RATING`, `MAX_RATING`, `DEFAULT_RATING` - Rating constants

**Used in:**
- SaveLocationPanel.tsx ✅
- EditLocationPanel.tsx ✅
- LocationFilters.tsx ✅

### API Routes
**File:** `src/lib/api-routes.ts`
- `API_ROUTES` - All API endpoint paths
- `PAGE_ROUTES` - All page routes

**To be used in:**
- All hooks (useSaveLocation, useUpdateLocation, etc.)
- All API route handlers
- Navigation components

---

## ✅ Migration Completed

### Form Constants
**Status:** Successfully migrated to all target components

**Completed migrations:**
1. **SaveLocationPanel.tsx**
   - ✅ Replaced `z.enum(["indoor", "outdoor", "both"])` with `indoorOutdoorSchema`
   - ✅ Replaced hardcoded `"outdoor"` with `DEFAULT_INDOOR_OUTDOOR`
   - ✅ Updated dropdown to dynamically use `INDOOR_OUTDOOR_OPTIONS`

2. **EditLocationPanel.tsx**
   - ✅ Replaced `z.enum(["indoor", "outdoor", "both"])` with `indoorOutdoorSchema`
   - ✅ Replaced hardcoded `"outdoor"` with `DEFAULT_INDOOR_OUTDOOR`
   - ✅ Updated dropdown to dynamically use `INDOOR_OUTDOOR_OPTIONS`

3. **LocationFilters.tsx**
   - ✅ Updated sort dropdown to dynamically use `LOCATION_SORT_OPTIONS`

---

## 🔄 Migration Remaining (Optional)

### API Routes
**Status:** Constants created, optional migration

**Benefits:**
- Typo-proof API calls
- Easy to update endpoints
- Better TypeScript support

**Files to update:**
- All hooks in `src/hooks/`
- All API route files in `src/app/api/`

---

## 📊 Summary

| Category | File | Status | Impact |
|----------|------|--------|--------|
| Location Types | `location-constants.ts` | ✅ Complete | High - Used in 4 files |
| ImageKit Config | `imagekit.ts` | ✅ Complete | Medium - Already centralized |
| Form Constants | `form-constants.ts` | ✅ Complete | Medium - Used in 3 files |
| API Routes | `api-routes.ts` | 🔄 Optional | Low - Would benefit ~10+ files |

---

## 🎯 Next Steps (Optional)

1. **(Optional)** Migrate hooks and API routes to use `api-routes.ts` for centralized endpoint management
2. **(Optional)** Add similar constants for other reusable form field values

---

## 🔧 Usage Examples

### Before (Duplicated):
```tsx
// SaveLocationPanel.tsx
const saveLocationSchema = z.object({
    indoorOutdoor: z.enum(["indoor", "outdoor", "both"]).optional(),
    // ...
});

const defaultValues = {
    indoorOutdoor: "outdoor", // hardcoded
};
```

### After (Centralized):
```tsx
import { indoorOutdoorSchema, DEFAULT_INDOOR_OUTDOOR } from "@/lib/form-constants";

const saveLocationSchema = z.object({
    indoorOutdoor: indoorOutdoorSchema,
    // ...
});

const defaultValues = {
    indoorOutdoor: DEFAULT_INDOOR_OUTDOOR,
};
```

**Benefits:**
- Single source of truth
- Change once, update everywhere
- Type-safe with TypeScript
- No duplicate code
