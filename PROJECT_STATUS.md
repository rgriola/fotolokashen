# fotolokashen - Project Status

**Last Updated**: 2026-02-15 8:00pm
**Production URL**: https://fotolokashen.com  
**Status**: ✅ Live in Production | 📱 iOS App in Active Development

## Current Focus

### 🎯 Recent Completions (February 2026)

1. ✅ **Map View UX Enhancements** - Auto-fit, GPS display, and navigation improvements
   - Auto-fit bounds to show all user + public locations on initial load
   - Zoom capped at 16 to prevent over-zooming on single/few locations
   - Removed home location as default center for cleaner initial view
   - Fixed multiple public location API calls during initial load
   - Added GPS coordinates display (lat/lng) in top-right corner with 50% opacity background
   - GPS toggle button now properly turns GPS on/off (clears marker and coordinates)
   - Toast notifications moved to top-center for better visibility
   - Reduced map controls top margin for tighter layout
   - Comprehensive code documentation explaining map page architecture

2. ✅ **Tooltip UX Enhancement** - Comprehensive tooltip coverage across the app
   - Added tooltips to all buttons and links in LocationDetailPanel
   - Added tooltips to Filter, Edit, and Share buttons on /locations page
   - Consistent dark theme styling and positioning
   - Enhanced accessibility and user guidance

3. ✅ **Production Date Feature** - Track filming/production dates for locations
   - Added `productionDate` field to Location model
   - Date picker in EditLocationForm and CreateLocationWithPhoto
   - UTC-based date handling

4. ✅ **Unified Upload Security** - All 5 image upload entry points secured
   - Avatar, Banner, Save Location, Edit Location, Create-with-Photo
   - Server-side virus scanning (ClamAV)
   - Server-side HEIC/TIFF → JPEG conversion (Sharp)
   - Browser-side format conversion for previews

5. ✅ **Create-with-Photo UX Refactor** - Single-page layout
   - Replaced 2-step wizard with unified single-page form
   - Photo upload + GPS extraction + manual location in one view

6. ✅ **Avatar/Banner HEIC/TIFF Support**
   - Browser-side conversion for iPhone HEIC photos
   - Progress indicator and toast feedback

7. ✅ **Google Maps Performance Fix**
   - Fixed "LoadScript has been reloaded unintentionally" warning
   - Module-level constants for libraries array

8. ✅ **LocationDetailPanel UI/UX Refinements**
   - Cleaner presentation with consolidated content
   - Combined Address and GPS into single panel
   - Added copy address button
   - Comprehensive tooltips for all interactive elements

9. ✅ **Support System**
   - Public support form at `/support` with human verification
   - Member support form at `/member-support`
   - Rate limiting: 3/hour (public), 5/hour (members)

9. ✅ **Vercel Speed Insights** - Performance monitoring integration

10. ✅ **Documentation Cleanup** - Reorganized /docs folder structure

**Recent Completions (January 2026):**
- ✅ **Onboarding Tours Bug Fixes** - Fixed repeating tour issue
- ✅ **Enhanced Onboarding System** - Multi-page tours with terms acceptance
- ✅ **Admin Email Template Editor** - Unified editing, preview, and duplication
- ✅ **Location Sharing Feature** - Complete share functionality
- ✅ **Profile Management Enhancements** - Username/email change, avatar/banner editing
- ✅ **Privacy & Visibility System** - Granular privacy controls

### 📱 iOS Companion App
**Status**: Active Development  
**Location**: `/fotolokashen-ios/` workspace

- **Tech Stack**: SwiftUI, MVVM Architecture, Swift Concurrency
- **Core Features**: Camera-first workflow, GPS tagging, offline support
- **Backend Integration**: OAuth2 + PKCE authentication

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
