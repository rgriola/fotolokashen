# Icon Management Guide

**File**: `src/config/icons.ts`  
**Purpose**: Centralized icon configuration for the entire application

---

## 📍 **Current State**

**Before (Scattered):**
Icons were imported individually in multiple files:
- `HomeLocationMarker.tsx` - imports `Home`
- `HomeLocationSettings.tsx` - imports `Home, MapPin, Navigation, Search, Map`
- `AvatarUpload.tsx` - imports `Camera, Upload, X, User`
- Many other files...

**After (Centralized):**
All icons are now managed in **one file**: `src/config/icons.ts`

---

## 🎯 **How to Use**

### **Current Usage (Scattered):**
```tsx
import { Home } from 'lucide-react';

<Home className="w-6 h-6" />
```

### **New Recommended Usage (Centralized):**
```tsx
import { AppIcons } from '@/config/icons';

<AppIcons.Home className="w-6 h-6" />
```

---

## 🔧 **How to Change Icons in the Future**

### **Example: Change Home Icon**

**Step 1:** Open `src/config/icons.ts`

**Step 2:** Import new icon:
```typescript
import { HouseIcon } from 'lucide-react'; // Or from another library
```

**Step 3:** Update the mapping:
```typescript
export const AppIcons = {
    Home: HouseIcon,  // Changed from Home to HouseIcon
    // ... rest stays the same
}
```

**Step 4:** Done! All components using `AppIcons.Home` will now use the new icon automatically.

---

## 📦 **Included in Icons Config**

### **Location & Map Icons:**
- `Home` - Home location marker 🏠
- `MapPin` - General location pin 📍
- `Map` - Map interface 🗺️
- `Navigation` - GPS/navigation 🧭

### **Media Icons:**
- `Camera` - Photo capture/upload 📷
- `Upload` - File upload ⬆️

### **User Interface Icons:**
- `User` - User profile 👤
- `Settings` - Settings/preferences ⚙️
- `Bell` - Notifications 🔔
- `Globe` - Language 🌍
- `Clock` - Time/timezone ⏰
- `Search` - Search 🔍

### **Action Icons:**
- `X` - Close/dismiss ✖️
- `ArrowLeft` - Back ⬅️
- `AlertCircle` - Warning ⚠️

---

## 🎨 **Bonus: Color & Size Standards**

### **Icon Colors:**
```typescript
import { IconColors } from '@/config/icons';

<AppIcons.Home className={IconColors.homeLocation} />
// Applies: text-orange-600
```

**Available Colors:**
- `homeLocation` - Orange (🏠)
- `savedLocation` - Blue (📍)
- `userLocation` - Light Blue (📍)
- `camera` - Gray (📷)
- `navigation` - Indigo (🧭)
- `warning` - Yellow (⚠️)
- `error` - Red (❌)
- `success` - Green (✅)

### **Icon Sizes:**
```typescript
import { IconSizes } from '@/config/icons';

<AppIcons.Home className={IconSizes.lg} />
// Applies: w-6 h-6
```

**Available Sizes:**
- `xs` - 12px (w-3 h-3)
- `sm` - 16px (w-4 h-4)
- `md` - 20px (w-5 h-5)
- `lg` - 24px (w-6 h-6)
- `xl` - 32px (w-8 h-8)
- `2xl` - 40px (w-10 h-10)

---

## 🔄 **Migration Strategy**

You can migrate files gradually:

### **Option 1: Keep Old Imports (Works Now)**
```tsx
// Still works, no changes needed
import { Home } from 'lucide-react';
<Home className="w-6 h-6" />
```

### **Option 2: Migrate to Centralized (Recommended)**
```tsx
// Future-proof, easier to maintain
import { AppIcons, IconSizes } from '@/config/icons';
<AppIcons.Home className={IconSizes.lg} />
```

---

## 📝 **Example: Update HomeLocationMarker**

### **Before:**
```tsx
import { Home } from 'lucide-react';

<div>
    <Home className="w-6 h-6 text-white" />
</div>
```

### **After:**
```tsx
import { AppIcons, IconSizes } from '@/config/icons';

<div>
    <AppIcons.Home className={`${IconSizes.lg} text-white`} />
</div>
```

---

## ✅ **Benefits**

1. **Single Source of Truth**: Change icon once, updates everywhere
2. **Easy Swapping**: Switch from lucide-react to another library easily
3. **Consistent Styling**: Standardized colors and sizes
4. **Type Safety**: TypeScript autocomplete for all icons
5. **Better Organization**: Know exactly what icons are used
6. **Future-Proof**: Easy to update or rebrand

---

## 🎯 **Next Steps**

**Immediate (Optional):**
- Start using `AppIcons` in new components
- Gradually migrate existing components

**Future Icon Changes:**
1. Open `src/config/icons.ts`
2. Update the icon mapping
3. Done! All usages update automatically

**Add New Icons:**
```typescript
// In src/config/icons.ts
import { Star } from 'lucide-react';

export const AppIcons = {
    // ... existing icons
    Star: Star,  // Add new icon
}
```

---

## 📁 **File Location**

**Main Config**: `src/config/icons.ts`

**Current Icon Files:**
- `src/components/maps/HomeLocationMarker.tsx` - Uses `Home`
- `src/components/profile/HomeLocationSettings.tsx` - Uses `Home, MapPin, etc.`
- `src/components/profile/AvatarUpload.tsx` - Uses `Camera`
- Many more...

---

**You now have a centralized icon management system!** 🎉

**To change the house icon in the future:**  
Just edit `src/config/icons.ts` - one file, done! 🏠
