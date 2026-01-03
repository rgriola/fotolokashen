# Logout Page Styling Guide

## ✅ Current Implementation

The `/logout` page now matches the `/login` page styling with:

- ✅ Same background image (`/images/landing/hero/login-hero-bg.jpg`)
- ✅ Unique CSS class (`logout-bg-image`) for future customization
- ✅ Same gradient overlay (indigo → purple → indigo)
- ✅ Same animated blur effects
- ✅ Centered card with glass morphism effect
- ✅ Consistent spacing and layout

## 🎨 Styling Details

### Background Structure
```tsx
<div className="relative flex min-h-screen flex-col overflow-hidden">
  {/* Background Image - Unique class for customization */}
  <div
    className="logout-bg-image absolute inset-0 bg-cover bg-center opacity-90"
    style={{ backgroundImage: 'url(/images/landing/hero/login-hero-bg.jpg)' }}
  />
  
  {/* Gradient Overlay */}
  <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/80 via-purple-900/80 to-indigo-900/80" />
  
  {/* Animated Blur Effects */}
  <div className="absolute -top-24 right-0 h-96 w-96 rounded-full bg-blue-400/20 blur-3xl animate-pulse" />
  <div className="absolute bottom-0 left-0 h-96 w-96 rounded-full bg-purple-400/20 blur-3xl animate-pulse" />
  
  {/* Content */}
  <div className="relative z-10 w-full px-4 md:px-6 lg:px-8 flex-1 flex items-center justify-center">
    <Card className="w-full max-w-md shadow-2xl border-white/10 bg-white/95 backdrop-blur-sm">
      {/* Card content */}
    </Card>
  </div>
</div>
```

### Key Classes
- **`logout-bg-image`** - Unique class for logout background (allows future customization)
- **`relative flex min-h-screen`** - Full-screen container
- **`bg-white/95 backdrop-blur-sm`** - Glass morphism card effect
- **`shadow-2xl border-white/10`** - Elevated card with subtle border

## 🔧 How to Customize the Logout Background

### Option 1: Change Background Image (Recommended)

1. **Add your new image** to `/public/images/landing/hero/`
   - Example: `logout-hero-bg.jpg`

2. **Update the inline style** in `/src/app/logout/page.tsx`:
   ```tsx
   <div
     className="logout-bg-image absolute inset-0 bg-cover bg-center opacity-90"
     style={{ backgroundImage: 'url(/images/landing/hero/logout-hero-bg.jpg)' }}
   />
   ```

### Option 2: Use CSS for Background (Global Styling)

1. **Create/update** `src/app/globals.css` or `src/styles/logout.css`:
   ```css
   .logout-bg-image {
     background-image: url('/images/landing/hero/logout-hero-bg.jpg');
     background-size: cover;
     background-position: center;
   }
   ```

2. **Remove inline style** from `/src/app/logout/page.tsx`:
   ```tsx
   <div className="logout-bg-image absolute inset-0 opacity-90" />
   ```

### Option 3: Different Gradient Overlay

Change the gradient colors to give a different mood:

```tsx
{/* Example: Warm orange/red gradient for logout */}
<div className="absolute inset-0 bg-gradient-to-br from-orange-900/80 via-red-900/80 to-orange-900/80" />

{/* Example: Cool teal/cyan gradient */}
<div className="absolute inset-0 bg-gradient-to-br from-teal-900/80 via-cyan-900/80 to-teal-900/80" />

{/* Example: Monochrome dark gradient */}
<div className="absolute inset-0 bg-gradient-to-br from-gray-900/80 via-slate-900/80 to-gray-900/80" />
```

### Option 4: Different Blur Colors

Adjust the animated blur effects:

```tsx
{/* Warmer blur colors */}
<div className="absolute -top-24 right-0 h-96 w-96 rounded-full bg-orange-400/20 blur-3xl animate-pulse" />
<div className="absolute bottom-0 left-0 h-96 w-96 rounded-full bg-red-400/20 blur-3xl animate-pulse" />

{/* Cooler blur colors */}
<div className="absolute -top-24 right-0 h-96 w-96 rounded-full bg-teal-400/20 blur-3xl animate-pulse" />
<div className="absolute bottom-0 left-0 h-96 w-96 rounded-full bg-cyan-400/20 blur-3xl animate-pulse" />
```

## 🎯 Design Rationale

### Why This Styling?

1. **Consistency**: Matches login page for familiar UX
2. **Visual Hierarchy**: Background → Overlay → Card creates depth
3. **Accessibility**: High contrast card on background ensures readability
4. **Modern**: Glass morphism and blur effects feel current
5. **Customizable**: Unique class allows easy future changes

### Differences from Login Page

| Aspect | Login Page | Logout Page |
|--------|-----------|-------------|
| Background Class | Default `bg-cover bg-center` | `logout-bg-image` (unique) |
| Content Alignment | `items-start md:items-center` with `mt-[25px]` | `items-center justify-center` (fully centered) |
| Card Styling | Same | Same (shadow-2xl, backdrop-blur) |

### Why Fully Centered for Logout?

- **No header needed**: Logout is a standalone page (uses standalone layout)
- **Focus on message**: Center positioning emphasizes the logout confirmation
- **Simpler layout**: No need to account for header spacing

## 📝 File Locations

- **Page**: `/src/app/logout/page.tsx`
- **Layout**: `/src/app/logout/layout.tsx` (standalone, bypasses app layout)
- **Background Image**: `/public/images/landing/hero/login-hero-bg.jpg`
- **Global Styles**: `/src/app/globals.css` (for CSS-based customization)

## 🚀 Quick Examples

### Example 1: Sunset Theme for Logout

```tsx
// In /src/app/logout/page.tsx
<div
  className="logout-bg-image absolute inset-0 bg-cover bg-center opacity-90"
  style={{ backgroundImage: 'url(/images/landing/hero/sunset-logout-bg.jpg)' }}
/>
<div className="absolute inset-0 bg-gradient-to-br from-orange-900/80 via-pink-900/80 to-purple-900/80" />
<div className="absolute -top-24 right-0 h-96 w-96 rounded-full bg-orange-400/20 blur-3xl animate-pulse" />
<div className="absolute bottom-0 left-0 h-96 w-96 rounded-full bg-pink-400/20 blur-3xl animate-pulse" />
```

### Example 2: Monochrome Theme

```tsx
<div
  className="logout-bg-image absolute inset-0 bg-cover bg-center opacity-90"
  style={{ backgroundImage: 'url(/images/landing/hero/monochrome-logout-bg.jpg)' }}
/>
<div className="absolute inset-0 bg-gradient-to-br from-gray-900/90 via-slate-900/90 to-gray-900/90" />
<div className="absolute -top-24 right-0 h-96 w-96 rounded-full bg-white/10 blur-3xl animate-pulse" />
<div className="absolute bottom-0 left-0 h-96 w-96 rounded-full bg-white/5 blur-3xl animate-pulse" />
```

---

**Status**: ✅ Styled and ready for customization

The logout page now has the same beautiful background and effects as the login page, with a unique `logout-bg-image` class that makes it easy to customize in the future without affecting the login page.
