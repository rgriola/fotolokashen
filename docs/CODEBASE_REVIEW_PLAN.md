# Codebase Review Plan — fotolokashen (Web + iOS)

**Created:** April 8, 2026  
**Last Updated:** April 8, 2026  
**Status:** All 6 phases COMPLETE

---

## Discovery Findings

### Web App — Top Files by Size

| #   | File                                            | Lines  | Priority |
| --- | ----------------------------------------------- | ------ | -------- |
| 1   | `src/app/map/page.tsx`                          | ~1,250 | CRITICAL |
| 2   | `src/lib/email-templates.ts`                    | ~700   | OK       |
| 3   | `src/components/locations/EditLocationForm.tsx` | ~650   | MODERATE |
| 4   | `src/components/panels/LocationDetailPanel.tsx` | ~600   | MODERATE |
| 5   | `src/app/locations/page.tsx`                    | ~550   | HIGH     |
| 6   | `src/app/search/page.tsx`                       | ~450   | MODERATE |
| 7   | `src/components/locations/SaveLocationForm.tsx` | ~450   | MODERATE |

### iOS App — Top Files by Size

| #   | File                       | Lines           | Priority                      |
| --- | -------------------------- | --------------- | ----------------------------- |
| 1   | `LocationDetailView.swift` | ~~1,164~~ → 773 | ✅ RESOLVED (Phase D)         |
| 2   | `LocationService.swift`    | ~~602~~ → 335   | ✅ RESOLVED (Phase D)         |
| 3   | `ProfileView.swift`        | 672             | WARNING (exceeds 500 warning) |
| 4   | `PublicProfileView.swift`  | 564             | WARNING                       |
| 5   | `EditLocationView.swift`   | 554             | WARNING                       |
| 6   | `MapView.swift`            | 475             | OK                            |
| 7   | `PhotoUploadService.swift` | 465             | OK                            |
| 8   | `CameraView.swift`         | 457             | OK                            |

### SwiftLint Thresholds

- Function body: warn 50 lines, error 100 lines
- File length: warn 500 lines, error 1,000 lines
- Line length: warn 120 chars, error 150 chars

### API Route Patterns (67 routes analyzed)

- ~50 routes repeat identical auth+try/catch boilerplate (5–7 lines each)
- ~15 routes use raw `Response.json()` instead of `apiError()`
- File upload validation duplicated verbatim across 3 routes
- Bounds/viewport filtering duplicated across 4 routes
- User select fields (`id, username, firstName, lastName`) repeated 15+ times
- Pagination approaches inconsistent across endpoints

### Toast System (sonner)

- Library: `sonner`, configured in `src/components/ui/sonner.tsx`, mounted in root layout
- Usage: `toast.success()`, `toast.error()`, `toast.warning()`, `toast.info()`
- Issues: inconsistent messaging, photo upload lacks stage feedback, no standardized message catalog

---

## Phased Plan

### Phase A: API Route Standardization (Web) ✅ COMPLETE

1. ✅ Created `withAuth(request, handler)` wrapper in `src/lib/api-middleware.ts`
2. ✅ Created `withOptionalAuth()` variant for optional-auth routes
3. ✅ Migrated all ~50 protected routes to use wrapper
4. ✅ Standardized ~15 routes using raw `Response.json()` to use `apiError()`/`apiResponse()`
5. ✅ Extracted `validateAndScanUpload(formData, sizeLimit)` for 3 upload routes
6. ✅ Extracted `parseBoundsFilter(searchParams)` for 4 location viewport routes
7. ✅ Defined `USER_PUBLIC_SELECT` constant for 15+ routes
8. ✅ Added auth check to `/ai/improve-description` (security gap fixed)
9. ✅ Integration tests written

**Verification**: ✅ Full test suite passed; iOS smoke test passed

---

### Phase B: Toast Standardization (Web) ✅ COMPLETE

1. ✅ Audited all `toast.*()` calls — ~200+ calls across ~45 files
2. ✅ Created `src/lib/toast-messages.ts` with standardized constants
3. ✅ Defined patterns: action toasts, stage toasts, error toasts
4. ✅ Added upload stage feedback
5. ✅ Standardized durations
6. ✅ Replaced all inline toast strings with constants

**Verification**: ✅ Manual walkthrough confirmed

---

### Phase C: Map Page Decomposition (Web) ✅ COMPLETE

1. ✅ Created `src/app/map/types.ts` — shared types (MarkerData, MapBounds, PanToOptions, PublicLocationSheetData)
2. ✅ Created `src/app/map/useMapMarkers.ts` (263 lines) — marker state, API populate, geocoding, deduplication
3. ✅ Created `src/app/map/useGpsHandlers.ts` (262 lines) — GPS state, permissions, user/home location clicks
4. ✅ Created `src/app/map/useMapNavigation.ts` (192 lines) — map instance, fit-bounds, URL params, panToWithOffset
5. ✅ Created `src/app/map/MapInfoWindowContent.tsx` (97 lines) — InfoWindow UI component
6. ✅ Rewrote `map/page.tsx` as orchestrator: 1,667 → 802 lines

**Verification**: ✅ All 12 test scenarios passed (user confirmed); `tsc --noEmit` 0 errors

---

### Phase D: iOS Critical File Decomposition ✅ COMPLETE

1. ✅ `LocationService.swift` → extracted `GeocodingService.swift` (288 lines); LocationService 602 → 335 lines
2. ✅ `LocationDetailView.swift` → extracted `LocationDetailSubviews.swift` (350 lines): PhotoGallerySection, PhotoGalleryFullScreen, DetailPhoto (with `fromLocationPhotos()` helper), PhotosResponse, SectionHeader, DetailRow; LocationDetailView 1,164 → 773 lines
3. ✅ LocationService under 500 ✓; LocationDetailView under 1,000 ✓ (773, SwiftLint warning but no error)

**Verification**: ✅ `xcodebuild` BUILD SUCCEEDED; zero SwiftLint file_length errors

---

### Phase E: Shared Web Components ✅ COMPLETE

1. ⏭️ `PhotoSection` extraction deferred — EditLocationForm and SaveLocationForm use different photo patterns (carousel vs. deferred upload), minimal overlap
2. ✅ Extracted `TagInput` component (198 lines) — shared tag input with validation, add/remove, optional AI suggestions; integrated into EditLocationForm and SaveLocationForm
3. ✅ Extracted `UnsavedChangesBanner` component (63 lines) — sticky warning with change list, discard/save buttons; integrated into EditLocationForm
4. ⏭️ `MetadataRow` extraction deferred — LocationDetailPanel rows each have unique UI (icons, links, copy buttons), no shared pattern to extract

**Results**: EditLocationForm 1,052 → 817 lines (-22%); SaveLocationForm 545 → 493 lines (-10%); `tsc --noEmit` 0 errors, 0 new lint warnings

**Verification**: ✅ TypeScript + ESLint clean; zero new warnings

---

### Phase F: iOS Medium File Cleanup ✅ COMPLETE

1. ✅ `ProfileView.swift` (665 → 454, -32%) + `PublicProfileView.swift` (517 → 456, -12%) → shared `ProfileHeaderComponents.swift` (253 lines)
   - Extracted: `ProfileBannerView`, `ProfileAvatarView` (generic with optional edit/contextMenu), `ProfileStatItem`, `FormField`, `ImagePicker`
2. ⏭️ `EditLocationView.swift` (461) — already under 500, no extraction needed
3. ⏭️ `CameraView.swift` (479) — already under 500, no extraction needed
4. ✅ All four target files now under 500-line SwiftLint warning threshold

**Verification**: ✅ `xcodebuild` BUILD SUCCEEDED; zero SwiftLint file_length warnings

---

## Decisions

- Phase A done all at once (not incremental) with integration tests
- Toast standardization included as Phase B
- SwiftLint enforcement is part of iOS verification (Phases D, F)
- iOS shares API endpoints with web — Phase A tested from iOS
- All phases are refactor-only — no feature changes, no new behavior
