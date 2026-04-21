# LCP Performance Optimization — April 2026

> **Purpose:** Documents the 5 performance optimizations applied to fotolokashen.com to fix the Largest Contentful Paint (LCP) metric flagged by Vercel Speed Insights.

---

## What is LCP?

Largest Contentful Paint measures how long it takes for the **largest visible element** (usually a hero image or heading) to render on screen. Good LCP is under 2.5 seconds.

---

## Root Causes Found & Fixes Applied

### 1. `GoogleMapsProvider` Blocking ALL Page Rendering — Critical

**Before:** `GoogleMapsProvider` wrapped the **entire app** in `layout.tsx`. It called `useLoadScript()` from `@react-google-maps/api` and **blocked rendering** until the SDK loaded. Every page — including login, register, landing — showed a loading spinner until the Google Maps JS SDK (~200-500ms) finished downloading.

**After:**
- Removed `GoogleMapsProvider` from root `layout.tsx`
- Created `src/components/layout/MapsLayout.tsx` — a reusable wrapper
- Added route-level `layout.tsx` files for pages that need maps
- Updated `GoogleMapsProvider` to be non-blocking

### 2. Landing Page as Client Component — Critical

**Before:** `page.tsx` was `"use client"` — the hero was client-rendered, requiring JS to display anything.

**After:** Converted to Server Component. Hero image, h1, and features are in the initial HTML. Auth-dependent CTAs extracted to `src/components/landing/HeroCTA.tsx`.

### 3. `beforeInteractive` Third-Party Script — Critical

**Before:** `tweakcn.com/live-preview.min.js` loaded with `strategy="beforeInteractive"`, blocking all hydration.

**After:** Changed to `strategy="lazyOnload"`.

### 4. CSS Background Images → Next.js Image

**Before:** Auth pages used CSS `backgroundImage` (not preloadable, not optimizable).

**After:** All 9 pages converted to Next.js `<Image fill priority sizes="100vw">` — enables preloading, WebP, and responsive srcset.

### 5. Image Format Optimization

Next.js `<Image>` with `priority` automatically serves WebP/AVIF to supporting browsers. No manual conversion needed.

---

## Expected LCP Improvement

| Factor | Estimated Savings |
|---|---|
| Google Maps SDK → route-level only | ~400ms |
| Client-rendered landing → SSR | ~300ms |
| beforeInteractive → lazyOnload | ~150ms |
| CSS bg → Image preload + WebP | ~100ms |
| **Total** | **~800-1200ms** |
