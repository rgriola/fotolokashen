## fotolokashen - Project Status

**Last Updated**: 2026-05-08 12:25 EDT
**Production URL**: https://fotolokashen.com  
**Status**: ✅ Live in Production | 📱 iOS App v1.6.0

## Current Focus

### 🎯 Recent Completions (May 2026)

1. ✅ **iOS Pipeline Hardening + Bug Fixes (v1.6.0)** — May 8, 2026
   - EXIF preservation via raw `Data` capture path (ISO, aperture, lens metadata intact)
   - Camera UX: flip camera button + Apple-style flash control (Auto/On/Off, yellow when active)
   - Library race condition resolved: `TaskGroup` parallel loading + deferred dismissal + `PhotoLoadingOverlay`
   - Transition overlay for Camera→Library flow eliminates abrupt dismissal
   - `useNewPhotoPipeline = true` activates `PhotoPipelineCoordinator` + `PhotoUploadQueue`
   - Bug fix: `details` field (Create form) now round-trips correctly to Edit view

2. ✅ **Admin Email Template Test UX + Reliability Enhancements**
   - Added Test Variables modal on `/admin/email-templates/[id]/edit` so super admins can edit required test values before sending
   - Added custom variable key/value support for testing non-required placeholders and payload preview with remove action for custom entries
   - Improved test send error surfacing in editor UI so backend error messages are shown directly (instead of a generic failure toast)
   - Hardened test-send backend (`/api/admin/email-templates/[id]/test`) to auto-fill missing required variables with safe sample values

3. ✅ **Default Email Template Refresh + Seed Behavior Upgrade**
   - Refreshed default template visuals in `src/lib/email-templates.ts` to align with current app styling direction
   - Updated seed behavior in `/api/admin/email-templates/seed` and `prisma/seed-email-templates.ts` to refresh existing default templates (not only create missing templates)

4. ✅ **Email Documentation and QA Coverage Updated**
   - Updated user guide and testing checklist for Test Variables modal and custom variable workflow
   - Updated implementation progress logs and recreation runbook references to reflect current operational state

### 🎯 Recent Completions (Late April 2026)

1. ✅ **Mobile API v1 Contract Hardening + ImageKit Variants**
   - Added strict canonical response validation for `/api/v1/*` endpoints using shared Zod schemas in `src/lib/schemas/mobileApiV1.ts`
   - Added comprehensive contract tests (`src/lib/__tests__/mobileApiV1Contract.test.ts`) to enforce iOS-compatible response shapes
   - Locked coordinate response keys to `lat`/`lng` and added safeguards against `latitude`/`longitude` regressions
   - Standardized ImageKit photo variant generation and added regression tests (`src/lib/__tests__/imagekitVariants.test.ts`)

2. ✅ **Location Grouping Foundation (Events/Collections)**
   - Added Prisma schema support for grouped locations and new API routes:
     - `/api/location-groups`
     - `/api/location-groups/[id]`
     - `/api/user-group-types`
   - Updated location create/update flows to support group association

3. ✅ **Authentication & Session Reliability Fixes (Web + iOS)**
   - Fixed OAuth token exchange behavior so iOS authentication no longer invalidates active web sessions
   - Fixed stale auth cookie redirect loop by clearing invalid auth cookie state on `/api/auth/me` 401
   - Fixed production auth navigation edge cases (login render loop and logout redirect getting stuck on `/map`)

4. ✅ **Legal Content Architecture Refresh**
   - Extracted Terms, Privacy Policy, and Help/FAQ content into markdown under `/content/`
   - Added legal content API endpoint (`/api/content/legal`) and reusable markdown page rendering components
   - Updated onboarding terms flow to consume markdown-backed legal content

5. ✅ **Image URL Consistency Across Public Surfaces**
   - Standardized public/shared/profile/location image transforms via `getPhotoUrl` helper
   - Reduced transform drift across cards, lightbox, profile grids, and public location pages

### 🎯 Recent Completions (April 2026)

1. ✅ **Codebase Review — 6-Phase Refactor** (Web + iOS)
   - **Phase A: API Route Standardization** — Unified error/success response patterns across 67 API routes; extracted shared helpers (`apiError`, `apiSuccess`, `parseBoundsFilter`); added unit tests (vitest)
   - **Phase B: Toast Standardization** — Centralized toast message catalog in `lib/constants/messages.ts`; consistent messaging across all user-facing toasts
   - **Phase C: Map Page Decomposition** — `map/page.tsx` reduced from ~1,650 → ~800 lines; extracted `useMapMarkers`, `useMapNavigation`, `useGpsHandlers`, `MapInfoWindowContent`, and `types.ts`
   - **Phase D: iOS Critical File Decomposition** — Extracted `GeocodingService.swift` (288 lines) from `LocationService` (602→335); extracted `LocationDetailSubviews.swift` (350 lines) from `LocationDetailView` (1,164→773)
   - **Phase E: Shared Web Components** — Extracted `TagInput.tsx` and `UnsavedChangesBanner.tsx`; `EditLocationForm` 1,052→817 (-22%); `SaveLocationForm` 545→493 (-10%)
   - **Phase F: iOS Medium File Cleanup** — Extracted `ProfileHeaderComponents.swift` (253 lines) with `ProfileBannerView`, `ProfileAvatarView`, `ProfileStatItem`, `FormField`, `ImagePicker`; `ProfileView` 665→454 (-32%); `PublicProfileView` 517→456 (-12%)
   - Full plan: [docs/CODEBASE_REVIEW_PLAN.md](./docs/CODEBASE_REVIEW_PLAN.md)

2. ✅ **Tailwind v4 Canonical Class Cleanup** — Replaced legacy classes (`flex-shrink-0`→`shrink-0`, `bg-gradient-to-br`→`bg-linear-to-br`, arbitrary values→standard utilities) across 9 files

### Previous Completions (February 2026)

1. ✅ **Friends/Public Locations API Flattening** - iOS compatibility fix
   - Flattened `/api/v1/locations/friends` and `/api/v1/locations/public` response structure.
   - iOS `MapSocialLocation` model now receives flat `lat`, `lng`, `name`, etc. at top level
   - Updated `useFriendsLocations.ts` and `usePublicLocations.ts` hooks for new flat structure
   - Fixed `/locations` page `mergedLocations` logic for Friends toggle
   - Fixed `/map` page `publicMarkers` to use flat structure

2. ✅ **Map View UX Enhancements** - Auto-fit, GPS display, and navigation improvements
   - Auto-fit bounds to show all user + public locations on initial load
   - Zoom capped at 16 to prevent over-zooming on single/few locations
   - Removed home location as default center for cleaner initial view
   - Fixed multiple public location API calls during initial load
   - Added GPS coordinates display (lat/lng) in top-right corner with 50% opacity background
   - GPS toggle button now properly turns GPS on/off (clears marker and coordinates)
   - Toast notifications moved to top-center for better visibility
   - Reduced map controls top margin for tighter layout
   - Comprehensive code documentation explaining map page architecture

3. ✅ **Tooltip UX Enhancement** - Comprehensive tooltip coverage across the app
   - Added tooltips to all buttons and links in LocationDetailPanel
   - Added tooltips to Filter, Edit, and Share buttons on /locations page
   - Consistent dark theme styling and positioning
   - Enhanced accessibility and user guidance

4. ✅ **Production Date Feature** - Track filming/production dates for locations
   - Added `productionDate` field to Location model
   - Date picker in EditLocationForm and CreateLocationWithPhoto
   - UTC-based date handling

5. ✅ **Unified Upload Security** - All 5 image upload entry points secured
   - Avatar, Banner, Save Location, Edit Location, Create-with-Photo
   - Server-side virus scanning (ClamAV)
   - Server-side HEIC/TIFF → JPEG conversion (Sharp)
   - Browser-side format conversion for previews

6. ✅ **Create-with-Photo UX Refactor** - Single-page layout
   - Replaced 2-step wizard with unified single-page form
   - Photo upload + GPS extraction + manual location in one view

7. ✅ **Avatar/Banner HEIC/TIFF Support**
   - Browser-side conversion for iPhone HEIC photos
   - Progress indicator and toast feedback

8. ✅ **Google Maps Performance Fix**
   - Fixed "LoadScript has been reloaded unintentionally" warning
   - Module-level constants for libraries array

9. ✅ **LocationDetailPanel UI/UX Refinements**
   - Cleaner presentation with consolidated content
   - Combined Address and GPS into single panel
   - Added copy address button
   - Comprehensive tooltips for all interactive elements

10. ✅ **Support System**
    - Public support form at `/support` with human verification
    - Member support form at `/member-support`
    - Rate limiting: 3/hour (public), 5/hour (members)

11. ✅ **Vercel Speed Insights** - Performance monitoring integration

12. ✅ **Documentation Cleanup** - Reorganized /docs folder structure

**Recent Completions (January 2026):**

- ✅ **Onboarding Tours Bug Fixes** - Fixed repeating tour issue
- ✅ **Enhanced Onboarding System** - Multi-page tours with terms acceptance
- ✅ **Admin Email Template Editor** - Unified editing, preview, and duplication
- ✅ **Location Sharing Feature** - Complete share functionality
- ✅ **Profile Management Enhancements** - Username/email change, avatar/banner editing
- ✅ **Privacy & Visibility System** - Granular privacy controls

### 📱 iOS Companion App (v1.6.0)

**Status**: Active Development  
**Location**: `/fotolokashen-ios/` workspace

- **Tech Stack**: SwiftUI (iOS 16+), MVVM + Shared Store, Swift Concurrency, AVFoundation, PhotosUI
- **Core Features**: Camera-first workflow (flip + flash + EXIF), GPS tagging, offline support (iOS 17+), multi-photo sessions
- **Upload Pipeline**: `PhotoPipelineCoordinator` → `PhotoCompressionService` → `PhotoUploadQueue` (concurrent, retry-capable). Feature-flagged; active in production config.
- **Social Features**: Follow/unfollow, public profiles, friends' locations on map, people search
- **Backend Integration**: OAuth2 + PKCE (`prefersEphemeralWebBrowserSession = true`), secure server-mediated uploads
- **Recent Milestones**: v1.6.0 pipeline hardening, EXIF preservation, camera UX (flip/flash), library race condition fix, `details` field edit bug fix
- **Test Coverage**: Unit tests for `PhotoUploadQueue`, `PhotoCompressionService`, ViewModels, `APIClient` (Phases 4a–4d)
- **Observability**: `dlog()` routes through `os.Logger` in debug builds

---

## Current State

fotolokashen is a location discovery and sharing platform built with Next.js 16, PostgreSQL (Neon), and ImageKit CDN.

### Technology Stack

- **Framework**: Next.js 16.1.6 (App Router, React 19.2.1, TypeScript 5)
- **Database**: PostgreSQL (Neon Cloud)
- **ORM**: Prisma 6.19.1
- **CDN**: ImageKit (photo storage)
- **Image Processing**: Sharp 0.34.x (server-side conversion/compression)
- **Security**: ClamAV (virus scanning)
- **Authentication**: Custom JWT-based system
- **Email**: Resend API with custom HTML templates
- **State Management**: TanStack Query (React Query)
- **Deployment**: Vercel
- **Monitoring**: Vercel Speed Insights, Sentry (error tracking)

### Core Features (Deployed)

✅ **User Authentication & Security**

- Email/password registration and login
- Email verification with 30-minute token expiration
- Password reset with rate limiting
- JWT-based session management
- Multi-layer security logging
- Account lockout after failed attempts
- Session invalidation on password change

✅ **Onboarding System** (NEW - January 2026)

- Mandatory Terms of Service and Privacy Policy acceptance
- Main map tour (9 steps, required completion)
- Locations page tour (5 steps, contextual)
- People/search page tour (4 steps, contextual)
- Per-page completion tracking in database
- Tour restart options from profile menu
- React Joyride integration with custom styling
- Database fields: `termsAcceptedAt`, `termsVersion`, `privacyAcceptedAt`, `privacyVersion`, `locationsOnboardingCompleted`, `peopleOnboardingCompleted`

✅ **Email System**

- Professional HTML email templates
- Responsive design (mobile/tablet/desktop)
- User timezone-aware timestamps
- Development mode console logging
- Production email via Resend API
- Templates:
  - Email Verification (30-min expiry)
  - Welcome Email (post-verification)
  - Password Reset (15-min expiry)
  - Password Changed Notification
  - Account Deletion Confirmation

✅ **Admin Features**

- User management dashboard
- Account deletion capability
- User activity overview
- Email template editor with live preview
- Device size simulation (desktop/tablet/mobile)
- Template duplication and customization
- Production-safe template seeding endpoint

✅ **Profile Management** (NEW - January 2026)

- Username change with uniqueness validation
- Email change with verification flow
- Avatar upload, crop, and rotation
- Banner image upload and editing
- Profile visibility controls
- Bio and location information

✅ **Location Management**

- Google Maps integration for search
- User-specific saved locations (UserSave model)
- Personal ratings, captions, and tags
- **Production date tracking** (filming/production dates independent of EXIF/creation dates)
- Favorite marking
- Location categories and types
- Indoor/outdoor classification
- AI-powered description improvements
- AI tag suggestions based on production notes
- Virus scanning for uploaded photos
- `/locations` page with grid/list views and filtering

✅ **Social Features** (NEW - January 2026)

- Location sharing with visibility controls (public, private, followers-only)
- Share via link, email, or direct to users
- Follow/unfollow users
- Follower/following lists
- People search with filters
- User profiles with saved locations
- Privacy enforcement throughout the app

✅ **Photo Upload** (Enhanced February 2026)

- Multiple photos per location
- ImageKit CDN storage
- Flat directory structure: `/{environment}/users/{userId}/photos/`
- **Unified secure upload pipeline** (all 5 entry points)
- Server-side virus scanning (ClamAV)
- Server-side HEIC/TIFF → JPEG conversion (Sharp)
- Centralized file size limits (10MB global max)
- Photo viewer with lightbox
- EXIF data extraction and preservation (GPS, camera info)

✅ **Map Interface**

- Interactive Google Maps display with auto-fit to show all locations on load
- Custom markers for saved locations with type-based colors
- Public location markers (purple) with deduplication by placeId
- GPS coordinates display (lat/lng) in top-right corner with toggle on/off
- GPS location support with permission dialog and visual feedback
- Saved locations panel with filtering and search
- Home location setting and navigation (optional default center)
- Marker clustering for performance optimization
- Location detail panels with comprehensive metadata
- Quick save from map pins
- Zoom capped at 16 to prevent over-zooming
- Toast notifications centered at top of viewport

### Security Features

**Rate Limiting**

- Forgot Password: 2 per 15 min, 3 per hour
- Reset Password: 2 per 15 min, 3 per hour
- Change Password: 5 per hour
- Login Attempts: Account lockout after multiple failures

**Token Security**

- Email Verification: 30-minute expiration
- Password Reset: 15-minute expiration
- JWT Sessions: 7-day default, 30-day with "remember me"
- Cryptographically secure token generation (256-bit)

**Email Verification**

- Required for all login methods
- Cannot be bypassed via password reset
- Clear user feedback on verification status
- Resend verification with rate limiting

**Security Logging**

- All authentication events logged
- Failed login tracking
- Password change tracking
- Rate limit violations
- IP address and user agent capture

### Environment Configuration

**Local Development**: Uses `.env.local` only

- Next.js automatically loads `.env.local`
- Prisma scripts use `dotenv-cli` to load `.env.local`
- See `ENV_TEMPLATE.md` for required variables

**Production**: Vercel environment variables

- Configured through Vercel dashboard
- Auto-deployed on push to main branch

## Known Issues & Priorities

### Active Priorities (Top)

**1) Session Management Hardening (web + iOS)**

- [ ] Validate unusual IP change behavior in active sessions
- [ ] Limit active sessions per account (target: 2-3)
- [ ] Auto-expire oldest session when the cap is exceeded
- [ ] Add user-facing "Active Sessions" management UI

**2) Email Verification UX Completion**

- [ ] Add visual token-expiry timer on verify/resend flows
- [ ] Implement resend flow with email re-entry + captcha
- [ ] Ensure resend always rotates token and invalidates prior token

**3) Performance & Reliability**

- [ ] Optimize key database query patterns and indexing
- [ ] Add targeted caching for high-read endpoints
- [ ] Continue Core Web Vitals regression tracking
- [ ] Expand automated test coverage and E2E for critical flows

**4) Product Enhancements (Next)**

- [ ] Add social interaction notification system
- [ ] Add location collections/albums
- [ ] Expand AI features (auto-tagging, smart search)
- [ ] Add in-app help documentation system

### Recently Resolved

- ✅ Onboarding tour stability issues resolved (2026-02-06)
- ✅ Session metadata capture + multi-device session support + iOS logout isolation completed (2026-01-16)
- ✅ Avatar upload environment path issue resolved (see `AVATAR_UPLOAD_FLOW.md`)

### Documentation

**Completed**:

- ✅ Reorganized 46 historical docs to `/docs/` archive
- ✅ Created `/docs/README.md` index
- ✅ Updated environment setup documentation
- ✅ Security implementation documented
- ✅ Email system documented
- ✅ Onboarding system implementation documented
- ✅ Social features and privacy system documented
- ✅ Profile management features documented
- ✅ AI features (descriptions, tags) documented

**In Progress**:

- 🔄 API documentation for mobile app integration
- 🔄 User guide and help system content

## Recent Deployments

**2026-04-30**: Mobile API v1 Contract Hardening + ImageKit Variants

- Added strict contract validation layer for mobile API responses with canonical shared schemas
- Added endpoint fixtures and source-scan checks to prevent `latitude`/`longitude` regressions in `/api/v1/*`
- Added ImageKit variant tests and standardized photo URL transform behavior

**2026-04-27**: Location Groups + Auth/Session Stability + Legal Content Migration

- Added `LocationGroup` schema support and new endpoints (`/api/location-groups`, `/api/location-groups/[id]`, `/api/user-group-types`)
- Fixed iOS OAuth token exchange side effects that were invalidating active web sessions
- Fixed stale-auth redirect loops and logout redirect issues in production auth flows
- Migrated legal content to markdown-backed pages and fixed footer/legal links

**2026-04-08**: Codebase Review — Full 6-Phase Refactor

- Phase A: API route standardization with shared helpers and unit tests
- Phase B: Centralized toast message catalog
- Phase C: Map page decomposed into 5 focused modules (1,650→800 lines)
- Phase E: Shared `TagInput` and `UnsavedChangesBanner` components extracted
- Tailwind v4 canonical class cleanup across 9 files
- iOS Phases D+F: 5 new extracted files, all source files under SwiftLint thresholds

**2026-02-18**: Friends/Public Locations API & iOS Compatibility

- Flattened `/api/v1/locations/friends` and `/api/v1/locations/public` response structure for iOS
- Updated `useFriendsLocations.ts`, `usePublicLocations.ts`, and locations page for flat structure
- Fixed map page `publicMarkers` to use flat `publicLoc.lat/lng` instead of nested
- Fixed LocationDetailPanel.tsx JSX nesting error (duplicate closing tag)
- Applied Tailwind v4 canonical class names across 5 component files

**2026-02-15**: Map View UX Enhancements

- Implemented auto-fit bounds to show all user + public locations on initial load
- Added GPS coordinates display (lat/lng) in top-right corner with 50% opacity background
- GPS toggle button now properly controls GPS on/off state, marker visibility, and coordinate display
- Fixed multiple public location API calls during initial load (prevented bounds updates during auto-fit)
- Removed home location as default center to avoid conflicting with auto-fit
- Zoom capped at 16 to prevent over-zooming on single/few locations
- Moved toast notifications from top-right to top-center for better visibility
- Reduced map controls top margin for tighter layout
- Added comprehensive code documentation at top of map page explaining architecture

**2026-02-13**: Unified Upload Security Implementation

- Secured all 5 image upload entry points (Avatar, Banner, Save Location, Edit Location, Create-with-Photo)
- Implemented server-side virus scanning via ClamAV for all uploads
- Added server-side HEIC/TIFF → JPEG conversion using Sharp
- Centralized file size limits in `FILE_SIZE_LIMITS` constants (10MB global max)
- Removed direct ImageKit client uploads from AvatarUpload, BannerUpload, ProfileHeader
- Fixed critical security gap in `usePhotoCacheManager.ts` (deferred uploads now use `/api/photos/upload`)
- All uploads now go through secure server pipeline with validation, scanning, and processing

**2026-01-11/12**: Security & Email System Overhaul

- Implemented comprehensive email template system
- Fixed critical email verification bypass vulnerability
- Added password reset rate limiting
- Implemented welcome email flow
- Created admin email preview tool
- Added timezone-aware timestamps
- Enhanced verify-email page UX

**2026-01-04**: Sentry DataCloneError Fix

- Fixed Date serialization in API responses (Next.js/React 19 requirement)
- Updated 7 API routes to return ISO strings instead of Date objects
- Routes updated: login, register, reset-password, profile, admin users, and requireAuth middleware
- Resolved production error: `DataCloneError: The object can not be cloned`

**2026-01-03**: Documentation cleanup

- Reorganized 46 historical .md files to `/docs/` archive
- Created PROJECT_STATUS.md (this file)
- Consolidated environment variable management

**2026-01-02**: Photo upload fixes

- Fixed `locationId` missing in photo save requests
- Updated production database schema
- Verified photo uploads working end-to-end

**2025-12**: Environment consolidation

- Consolidated to `.env.local` only for local development
- Updated Prisma scripts with `dotenv-cli`
- Removed duplicate `.env` files

## Development Workflow

### Running Locally

```bash
# Install dependencies
npm install

# Set up environment
cp ENV_TEMPLATE.md .env.local
# Edit .env.local with your credentials

# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Run development server
npm run dev
```

### Database Management

```bash
# Generate Prisma client
npm run db:generate

# Push schema changes (development)
npm run db:push

# Run migrations (production)
npm run db:migrate

# Open Prisma Studio
npm run db:studio
```

### Deployment

Manual deployment:

```bash
vercel --prod
```

## Architecture Notes

### Email System

- **Templates**: Styled HTML with responsive design
- **Development Mode**: Console logging only
- **Production Mode**: Resend API
- **Customization**: Admin preview tool for testing
- **Timezone Handling**: User timezone preference or UTC fallback

### Photo Storage

- Flat directory structure (no subdirectories by date)
- Path format: `/{environment}/users/{userId}/photos/{filename}`
- Files stored on ImageKit CDN
- Database stores metadata (locationId, placeId, imagekitFileId, etc.)
- EXIF data extraction for GPS coordinates

### User-Specific Locations

- Each user has their own saved locations (UserSave)
- Same Google Place can be saved by multiple users with different metadata
- UserSave contains: personalRating, caption, isFavorite, locationId, userId
- Location contains: Google Place data (name, address, coordinates, etc.)

### Security Architecture

- **Authentication**: Custom JWT with secure token generation
- **Rate Limiting**: Multiple time windows (15 min, 1 hour)
- **Security Logging**: All events tracked in database
- **Session Management**: Token-based with expiration
- **Email Verification**: Required, cannot be bypassed

### Type System

- **UserSave**: User's personal save with metadata
- **Location**: Actual location data from Google Places
- **LocationData**: Client-side location representation
- **MarkerData**: Map marker visualization data
- **PublicUser**: Sanitized user data for client

## Quick References

### Essential Documentation (Root Level)

- **PROJECT_STATUS.md** (this file) - Current project status and updates
- **README.md** - Project overview, setup instructions, and technology stack

### Organized Documentation (`/docs/`)

- **completed-features/** - Feature implementation summaries and completion reports
- **deployment/** - Deployment guides, build fixes, and production checklists
- **summaries/** - Implementation summaries, reviews, and technical updates
- **features/** - Feature specifications and guides
- **guides/** - Development and technical guides
- **user-guides/** - End-user documentation and privacy guides
- **troubleshooting/** - Issue resolution guides
- **api/** - API documentation (Follow System, Search System)
- **implementation/** - Phase completion reports
- **archive/** - Historical documentation

### iOS App Documentation (`/fotolokashen-ios/docs/`)

- **API.md** - Mobile API specifications and endpoints
- **IOS_APP_EVALUATION.md** - Backend gap analysis and implementation strategy
- **IOS_DEVELOPMENT_STACK.md** - Tech stack and architecture decisions

---

## File Structure

```
fotolokashen/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── admin/             # Admin pages
│   │   │   ├── email-preview/ # Email template preview tool
│   │   │   └── users/         # User management
│   │   ├── api/               # API routes
│   │   │   └── auth/          # Authentication endpoints
│   │   ├── map/               # Main map interface
│   │   └── verify-email/      # Email verification page
│   ├── components/            # React components
│   │   ├── auth/              # Authentication forms
│   │   └── ui/                # UI components
│   └── lib/                   # Utilities
│       ├── email.ts           # Email sending functions
│       ├── email-templates.ts # HTML email templates
│       ├── security.ts        # Security utilities
│       └── auth-context.tsx   # Auth state management
├── prisma/
│   └── schema.prisma          # Database schema
├── docs/                      # Organized documentation
│   ├── completed-features/    # Feature completion summaries
│   ├── deployment/            # Deployment documentation
│   └── summaries/             # Implementation summaries
├── README.md                  # Main project documentation
└── PROJECT_STATUS.md          # This file

fotolokashen-ios/
├── fotolokashen/              # iOS app source
│   ├── App/                   # App entry point & config
│   ├── Models/                # Data models
│   ├── ViewModels/            # Business logic (MVVM)
│   ├── Views/                 # SwiftUI views
│   ├── Services/              # API & auth services
│   └── Utilities/             # Helpers & extensions
├── docs/                      # iOS documentation
│   ├── API.md                 # Mobile API specs
│   ├── IOS_APP_EVALUATION.md  # Backend analysis
│   └── IOS_DEVELOPMENT_STACK.md # Architecture guide
└── README.md                  # iOS app overview
```

---

For historical project phases and detailed implementation logs, see `/docs/planning/REFACTOR_STATUS.md`.
