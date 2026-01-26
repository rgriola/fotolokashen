# fotolokashen - Project Status

**Last Updated**: 2026-01-25  
**Production URL**: https://fotolokashen.com  
**Status**: ✅ Live in Production | 📱 iOS App in Active Development

## Current Focus

### 🎯 Active Development (January 25, 2026)

**Today's Goals:**
1. **Admin Email Template Editor** - Unified editing, preview, and duplication for email templates
2. **Helper Docs for Users** - In-app documentation and help system
3. **New User Tour** - Onboarding experience to explain features

**Recent Completion (January 25, 2026):**
- ✅ Email Template Editor: Unified edit/preview, device preview, validation, info dialog
- ✅ Email Template Duplication: Duplicate any template with pre-filled form
- ✅ Production-safe seeding endpoint for default templates
- ✅ Compact admin UI: Breadcrumb headers, tabbed settings/colors, search/filter row
- ✅ Merged email-preview into edit page for single workflow
- ✅ Copy HTML, device preview toggles, and info dialog in tab bar

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

---

## Current State

fotolokashen is a location discovery and sharing platform built with Next.js 16, PostgreSQL (Neon), and ImageKit CDN. Users can search for locations, save them with photos and personal notes, and manage their collection through a responsive map interface.

### Technology Stack

- **Framework**: Next.js 16.0.10 (App Router, React 19, TypeScript)
- **Database**: PostgreSQL (Neon Cloud)
  - Production: `ep-cool-star-a4dyxqi4`
  - Development: `ep-solitary-waterfall-a4yhnlsh`
- **ORM**: Prisma 6.19.1
- **CDN**: ImageKit (photo storage)
- **Authentication**: Custom JWT-based system
- **Email**: Resend API with custom HTML templates
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
- **Email Preview Tool** (NEW)
  - Live template preview
  - Device size simulation
  - Real-time customization
  - Sample data generation

✅ **Location Management**
- Google Maps integration for search
- User-specific saved locations
- Personal ratings and captions
- Favorite marking
- Location categories

✅ **Photo Upload**
- Multiple photos per location
- ImageKit CDN storage
- Flat directory structure: `/{environment}/users/{userId}/photos/`
- Photo viewer with lightbox
- EXIF data extraction (GPS, camera info)

✅ **Map Interface**
- Interactive Google Maps display
- Custom markers for saved locations
- Saved locations panel with filtering
- GPS location support (with permission toggle)
- Home location setting

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

**Performance Optimization** (Investigating)
- [ ] Investigate multiple page requests per user (possible duplicate fetches)
- [ ] Optimize image loading strategies
- [ ] Review database query patterns

**Avatar System** (Working, Needs Cleanup)
- Avatars currently saved to `/development/` folder on ImageKit
- Should use `/production/` in production
- Files work correctly, just in wrong folder
- See `AVATAR_UPLOAD_FLOW.md` for details

**Email Enhancements** (Future)
- [ ] Implement "Send Test Email" in admin preview
- [ ] Add email template versioning
- [ ] Create email analytics dashboard
- [ ] Add unsubscribe management

### Low Priority

**UI/UX Polish**
- [ ] Add loading skeletons for better perceived performance
- [ ] Implement toast notification system improvements
- [ ] Add keyboard shortcuts for power users
- [ ] Improve mobile navigation

### Documentation

**Completed**:
- ✅ Reorganized 46 historical docs to `/docs/` archive
- ✅ Created `/docs/README.md` index
- ✅ Updated environment setup documentation
- ✅ Avatar system trace documented
- ✅ Security implementation documented
- ✅ Email system documented

**In Progress**:
- 🔄 README.md update (main project documentation)

## Recent Deployments

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
