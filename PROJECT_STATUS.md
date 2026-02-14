# fotolokashen - Project Status

**Last Updated**: 2026-02-13  
**Production URL**: https://fotolokashen.com  
**Status**: ✅ Live in Production | 📱 iOS App in Active Development

## Current Focus

### 🎯 Active Development (February 13, 2026)

**This Week's Completion:**
1. ✅ **Production Date Feature** (February 13, 2026) - Track filming/production dates for locations
   - Added `productionDate` field to Location model (DateTime?, nullable)
   - Updated API endpoints: POST /api/locations and PATCH /api/locations/[id]
   - Added date picker to EditLocationForm and CreateLocationWithPhoto
   - Added production date display in LocationDetailPanel (Calendar icon)
   - UTC-based date handling to prevent timezone conversion issues
   - Change detection triggers save button on date changes
   - Optional field (supports past and future dates)
   - Documentation: `/fotolokashen-ios/docs/PRODUCTION_DATE_API.md` (iOS implementation guide)

2. ✅ **Unified Upload Security** (February 13, 2026) - All 5 image upload entry points secured
   - Avatar, Banner, Save Location, Edit Location, Create-with-Photo all use secure server pipeline
   - Server-side virus scanning (ClamAV) for all uploads
   - Server-side HEIC/TIFF → JPEG conversion (Sharp)
   - Browser-side HEIC/TIFF → JPEG conversion (heic2any + UTIF) for proper previews
   - Centralized file size limits (`FILE_SIZE_LIMITS` constants)
   - Removed direct ImageKit client uploads from AvatarUpload, BannerUpload, ProfileHeader
   - Fixed critical security gap in `usePhotoCacheManager.ts` (deferred uploads now go through secure API)
   - Documentation: `/docs/features/UNIFIED_UPLOAD_SECURITY.md`

2. ✅ **Create-with-Photo UX Refactor** (February 13, 2026) - Single-page layout
   - Created new unified `CreateLocationWithPhoto.tsx` component
   - Replaced 2-step wizard with single-page form (matches Save/Edit Location patterns)
   - Integrated photo upload + GPS extraction + manual location + form in one view
   - Uses `usePhotoCacheManager` for deferred upload (orphan prevention)
   - Simplified `page.tsx` to render single component
   - Browser-side HEIC/TIFF conversion with progress indicator
   - Manual location selection with Google Maps + PlacesAutocomplete

3. ✅ **Avatar/Banner HEIC/TIFF Support** (February 13, 2026)
   - Added browser-side conversion to AvatarUpload.tsx and BannerUpload.tsx
   - iPhone users can now upload HEIC photos without issues
   - Conversion progress indicator (Loader2 spinner)
   - Toast feedback during conversion

4. ✅ **Google Maps Performance Fix** (February 13, 2026)
   - Fixed "LoadScript has been reloaded unintentionally" warning
   - Moved `libraries` array to module-level constant in 3 files
   - Prevents unnecessary Google Maps script reloads on re-render

5. ✅ **LocationDetailPanel UI/UX Refinements** - Cleaner presentation and improved usability
   - Removed photo counter (1/4 indicator) from PhotoGallery
   - Removed Primary badge and star rating badge from detail display
   - Combined Address and GPS coordinates into single panel with smaller coordinate font
   - Added copy address button for quick clipboard access
   - Removed Status (Permanent/Temporary) field display
   - Removed tab navigation (Overview, Production, Metadata)
   - Consolidated all content into single scrollable section
   - Increased bottom padding (pb-20) for full content visibility
   - Added custom close button (X) to header, removed duplicate Sheet close button
   - Fixed photo caption change detection in EditLocationForm
   - Improved PhotoGallery caption/metadata toggle (info button)
   - Removed unused imports and variables for code cleanliness

3. ✅ **Support System Enhancements** - Public and member support forms with email integration
   - Public support form at `/support` with human verification (hold-to-verify)
   - Member support form at `/member-support` (authenticated, no verification needed)
   - Dual-email system: admin notification + user confirmation
   - Support form onBlur validation for better UX
   - Compact form design with reduced spacing
   - Support email templates added to admin system
   - Rate limiting: 3/hour (public), 5/hour (members)
   
4. ✅ **Navigation & UX Improvements**
   - Tour management consolidated in Profile → Preferences
   - "Start Tour" removed from dropdown (auto-starts on first login)
   - Support link added to member dropdown menu
   - Interactive Tours card with 3 restart buttons (Map, Locations, People)

**Recent Completions (February 2026):**
- ✅ **Onboarding Tours Bug Fixes** - Fixed repeating tour issue for /locations and /search pages
  - Implemented local state tracking to prevent tour restarts
  - Added callback handlers to update parent component state
  - Fixed positioning issues with spotlight overlay in fixed layouts
  - Removed problematic tour steps targeting non-existent elements
  - Tours now properly save completion status to database

**Recent Completions (January 2026):**
- ✅ **Enhanced Onboarding System** - Multi-page tours with terms acceptance
  - Terms of Service modal (mandatory acceptance before app use)
  - Main map tour (9 steps, mandatory completion)
  - Locations page tour (5 steps, contextual)
  - People/search page tour (4 steps, contextual)
  - Per-page completion tracking in database
  - Profile menu tour restart options
- ✅ **Admin Email Template Editor** - Unified editing, preview, and duplication
- ✅ **Location Sharing Feature** - Complete share functionality across all views
- ✅ **Profile Management Enhancements** - Username change, email change, avatar/banner editing
- ✅ **Privacy & Visibility System** - Granular privacy controls and enforcement

### 📱 iOS Companion App (January 2026)
**Status**: Active Development  
**Location**: `/fotolokashen-ios/` workspace

The fotolokashen iOS app is a camera-first mobile companion for location scouting and photo management. Development is underway with focus on:

- **Tech Stack**: SwiftUI, MVVM Architecture, Swift Concurrency
- **Core Features**: Camera-first workflow, GPS tagging, offline support
- **Backend Integration**: OAuth2 + PKCE authentication, mobile-optimized APIs
- **Phase**: Backend gap analysis complete, mobile development in progress

**Documentation**:
- Main README: `/fotolokashen-ios/README.md`
- iOS Development Stack: `/fotolokashen-ios/docs/IOS_DEVELOPMENT_STACK.md`
- Backend Evaluation: `/fotolokashen-ios/docs/IOS_APP_EVALUATION.md`
- API Specification: `/fotolokashen-ios/docs/API.md`

---

## Recent Major Updates

### 2026-02-10: Support System & Navigation Enhancements ✅ COMPLETE

**Support Forms**
- ✅ Public support form at `/support`
  - Human verification with hold-to-verify component (3-second hold)
  - OnBlur validation for all fields (name, email, subject, message)
  - Compact design with optimized spacing
  - Character counters for subject (200) and message (2000)
  - Rate limiting: 3 requests per hour (IP-based)
  - Single email sent to admin

- ✅ Member support form at `/member-support`
  - Protected route (authentication required)
  - Pre-populated user info (name, username, email) - non-editable display
  - No human verification needed (already authenticated)
  - Profile page styling for consistency
  - Dual-email system:
    * Admin notification with username
    * User confirmation email
  - Rate limiting: 5 requests per hour (user-based)
  - Success/error dialog feedback

**Email Templates**
- ✅ Added three new support templates to `/lib/email-templates.ts`:
  - `publicSupportRequestTemplate()` - Admin notification for public requests
  - `memberSupportRequestTemplate()` - Admin notification for member requests (includes username)
  - `supportConfirmationTemplate()` - User confirmation after submission
- ✅ Templates integrated into admin seeding system
- ✅ "Support" category added to email template filters
- ✅ Professional HTML design matching existing template system

**Navigation Improvements**
- ✅ Tour management moved to Profile → Preferences → Interactive Tours
  - Map Tour restart button
  - Locations Tour restart button
  - People Tour restart button
  - Each button calls respective API endpoint
- ✅ Removed tour links from member dropdown menu
- ✅ "Start Tour" removed (tours auto-start on first login)
- ✅ "Support" link added to member dropdown

**Components Updated:**
- `src/components/panels/LocationDetailPanel.tsx` (major UI restructuring)
- `src/components/locations/PhotoGallery.tsx` (caption/metadata toggle)
- `src/components/locations/EditLocationForm.tsx` (photo caption change detection)
- `src/components/ui/sheet.tsx` (added hideCloseButton prop)
- `src/app/locations/page.tsx` (added onClose and hideCloseButton props)

---

### 2026-02-10: Support System & Navigation Enhancements ✅ COMPLETE

**Support Forms**
- ✅ Public support form at `/support`

**Fixed Repeating Tour Issue**
- ✅ Added local `isCompleted` state to track completion within provider
- ✅ Implemented `onTourComplete` callback to notify parent components
- ✅ Added proper state synchronization between provider and parent
- ✅ Fixed positioning issues with `isFixed: true` for elements in fixed containers
- ✅ Added CSS transforms to correct spotlight overlay alignment
- ✅ Removed conditional tour steps (user cards, follow buttons) that cause failures
- ✅ Added comprehensive logging to track API calls and database updates
- ✅ Ensured database completion status persists correctly

**Components Updated:**
- `src/components/onboarding/LocationsOnboardingProvider.tsx`
- `src/components/onboarding/PeopleOnboardingProvider.tsx`
- `src/app/locations/page.tsx`
- `src/app/search/page.tsx`
- `src/lib/onboarding/locationsSteps.ts` (reduced to 5 reliable steps)
- `src/lib/onboarding/peopleSteps.ts` (reduced to 4 reliable steps)

**API Routes Enhanced:**
- `src/app/api/onboarding/locations/complete/route.ts` (added logging)
- `src/app/api/onboarding/people/complete/route.ts` (added logging)

### 2026-01-25: Admin Email Template Editor & Duplication Features ✅ COMPLETE

**Admin Email Template System Overhaul**
- ✅ Unified editor for email templates (edit, preview, validation, info dialog)
- ✅ Device preview (Desktop, Tablet, Mobile) in tab bar
- ✅ Copy HTML and info dialog in tab bar
- ✅ Tabbed interface for Settings, Colors, and (future) Header image
- ✅ Real-time validation for key, name, subject
- ✅ Production-safe seeding endpoint (`/api/admin/email-templates/seed`)
- ✅ Compact admin UI: Breadcrumb headers, search/filter/create row
- ✅ Merged email-preview into edit page for single workflow
- ✅ Email template duplication: Pre-fills form for new template based on existing one
- ✅ All changes TypeScript error-free and production-ready

**Files Updated:**
- Backend (Admin Email Templates):
  - `src/app/api/admin/email-templates/route.ts`
  - `src/app/api/admin/email-templates/seed.ts`

- Frontend (Admin Email Template Editor):
  - `src/app/admin/email-template-editor/page.tsx`
  - `src/components/admin/EmailTemplateEditor.tsx`
  - `src/components/admin/EmailTemplatePreview.tsx`

**Benefits:**
- Streamlined email template management for administrators
- Reduced complexity with unified editing and previewing
- Increased efficiency with template duplication feature
- Improved admin UI for better usability

  - Public Support Request (admin notification)
  - Member Support Request (admin notification with username)
  - Support Confirmation (user confirmation)

✅ **Support System** (NEW - February 2026)
- Public support form at `/support`
  - Human verification (hold-to-verify)
  - OnBlur field validation
  - Rate limiting: 3 requests/hour
- Member support form at `/member-support`
  - Authenticated users only
  - Pre-populated user information
  - Dual-email system (admin + confirmation)
  - Rate limiting: 5 requests/hour
- Support email templates in admin system
---

## Current State

fotolokashen is a location discovery and sharing platform built with Next.js 16, PostgreSQL (Neon), and ImageKit CDN. Users can search for locations, save them with photos and personal notes, and manage their collection through a responsive map interface.

### Technology Stack

- **Framework**: Next.js 16.0.10 (App Router, React 19, TypeScript 5)
- **Database**: PostgreSQL (Neon Cloud)
  - Production: `ep-cool-star-a4dyxqi4`
  - Development: `ep-solitary-waterfall-a4yhnlsh`
- **ORM**: Prisma 6.19.1
- **CDN**: ImageKit (photo storage)
- **Image Processing**: Sharp 0.33.x (server-side conversion/compression)
- **Security**: ClamAV (virus scanning via clamav.js)
- **Authentication**: Custom JWT-based system
- **Email**: Resend API with custom HTML templates
- **State Management**: TanStack Query (React Query)
- **Deployment**: Vercel
- **Monitoring**: Sentry (error tracking)

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
- Interactive Google Maps display
- Custom markers for saved locations with type-based colors
- Saved locations panel with filtering and search
- GPS location support with permission toggle
- Home location setting and navigation
- Marker clustering for performance
- Location detail panels
- Quick save from map pins

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

### High Priority

**Onboarding Tours** ✅ COMPLETED (2026-02-06)
- [x] Fixed repeating tour issue on /locations and /search
- [x] Proper state management and database persistence
- [x] Fixed positioning issues in fixed layouts
- [x] Removed unreliable tour steps

**Session Management Enhancements** ✅ COMPLETED (2026-01-16)
- [x] Capture all session metadata (IP, user agent, device type, device name)
- [x] Support multi-device sessions (web + iOS simultaneously)
- [x] iOS logout isolation (doesn't affect web sessions)
- [ ] Validate IP address changes in sessions
- [ ] Limit to 2-3 active sessions per user
- [ ] Auto-logout oldest session when limit exceeded
- [ ] Add "active session" management UI

**Email Verification Improvements** (Partially Complete)
- [x] Add token expiration (30 minutes)
- [x] Improve UX messaging
- [ ] Add visual timer showing token expiration
- [ ] Implement resend email option with:
  - Generate new token on resend
  - Rate limiting (already implemented)
  - Email re-entry + Captcha for resend

### Medium Priority

**Performance Optimization**
- [ ] Optimize database query patterns and indexing
- [ ] Implement query result caching where appropriate
- [ ] Review and optimize image loading strategies
- [ ] Monitor and improve Core Web Vitals

**Feature Enhancements**
- [ ] Add in-app help documentation system
- [ ] Implement notification system for social interactions
- [ ] Add location collections/albums feature
- [ ] Expand AI features (auto-tagging, smart search)

**Avatar System** ✅ RESOLVED
- Avatars currently saved to `/development/` folder on ImageKit
- Should use `/production/` in production
- Files work correctly, just in wrong folder
- See `AVATAR_UPLOAD_FLOW.md` for details

**Email Enhancements**
- [ ] Implement "Send Test Email" in admin preview
- [ ] Add email template versioning system
- [ ] Create email analytics dashboard
- [ ] Add unsubscribe management
- [ ] Implement email notification preferences

### Low Priority

**UI/UX Polish**
- [ ] Add loading skeletons for better perceived performance
- [ ] Implement comprehensive toast notification system
- [ ] Add keyboard shortcuts for power users
- [ ] Improve mobile navigation and gestures
- [ ] Add dark mode support

**Testing & Quality**
- [ ] Expand automated test coverage
- [ ] Implement E2E testing for critical flows
- [ ] Add performance monitoring and alerting
- [ ] Create user acceptance testing protocols

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
