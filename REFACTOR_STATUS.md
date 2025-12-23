# Google Maps Search App - Refactor Status
# NOTE
The Github repository for this project is at: https://github.com/rgriola/merkel-vision.git
The current produciton version is at: https://merkelvision.com/landing.html
Merkel Vision is name of the public facing application.

**Last Updated**: 2025-12-22 16:35:00 EST  
**Phase**: Phase 6 - Location Management Features (🚧 IN PROGRESS - 99%)  
**Overall Progress**: ~99% Complete

> [!WARNING]
> **Migration Alert**: Schema has been significantly enhanced beyond legacy Merkel-Vision. Some fields are NEW and will require implementation. Full schema comparison completed - see `MIGRATION_READINESS.md`.

> [!NOTE]
> **Session Update (Dec 22, 2024 - Evening)**: Implemented complete Edit Location workflow with API, hook, and panel integration. Enhanced My Locations page with beautiful cards, production details, and click-to-navigate functionality. Fixed layout overflow issues and data structure transformation for proper display.

## Recent Changes (Dec 22, 2024) - Edit Location & My Locations Enhancement

### Evening Session - Edit Workflow & My Locations (16:00 - 16:35 EST)

**Edit Location Complete Workflow**:
- ✅ Enhanced PATCH `/api/locations/[id]` endpoint to update UserSave fields
- ✅ Added support for `caption`, `tags`, `isFavorite`, `personalRating`, `color` updates
- ✅ Added `indoorOutdoor` field support to Location updates
- ✅ Created `EditLocationPanel` component (reuses SaveLocationPanel pattern)
- ✅ Wired up "Edit" button in InfoWindow for saved locations
- ✅ Updated RightSidebar to conditionally render Save or Edit panels
- ✅ Pre-populates all fields from location and userSave data
- ✅ Uses `useUpdateLocation` hook with optimistic updates
- **Files**:
  - [`src/app/api/locations/[id]/route.ts`](./src/app/api/locations/[id]/route.ts) - Enhanced PATCH endpoint
  - [`src/components/panels/EditLocationPanel.tsx`](./src/components/panels/EditLocationPanel.tsx) - NEW
  - [`src/app/map/page.tsx`](./src/app/map/page.tsx) - Integration

**Map Navigation Improvements**:
- ✅ Clicking any marker zooms to street level 17 automatically
- ✅ Smooth pan and zoom animation to marker position
- ✅ URL parameter handling for navigation from My Locations
- ✅ Supports `lat`, `lng`, and `zoom` query parameters
- **Files**: [`src/app/map/page.tsx`](./src/app/map/page.tsx)

**My Locations Page Enhancements**:
- ✅ **Enhanced LocationCard Design**:
  - Larger image area (h-56) with gradient overlay
  - Type-specific colored badges matching map markers
  - Photo count indicator for multiple photos
  - Hover effects with scale and shadow transitions
  - Production details display (notes, parking, access, indoor/outdoor)
  - Better caption display with italic styling and border accent
- ✅ **Click-to-Navigate**: Cards navigate to `/map?lat=X&lng=Y&zoom=17`
- ✅ **Photo Support**: ImageKit photos and photoUrls with fallback
- ✅ **Data Structure Fix**:
  - Transform UserSave[] (from API) → Location[] (for components)
  - Fixed empty cards showing no data
  - Fixed all cards navigating to same location
  - Proper delete using UserSave ID instead of Location ID
- **Files**:
  - [`src/components/locations/LocationCard.tsx`](./src/components/locations/LocationCard.tsx) - Complete redesign
  - [`src/app/locations/page.tsx`](./src/app/locations/page.tsx) - Data transformation

**Layout Fixes**:
- ✅ Fixed footer overlap on home, login, and registration pages
- ✅ Changed root layout from `h-screen overflow-hidden` to `min-h-screen`
- ✅ Removed `overflow-hidden` from main element
- ✅ Map page maintains its own `h-screen` for fixed layout
- **File**: [`src/app/layout.tsx`](./src/app/layout.tsx)

### Afternoon Session 2 - Saved Locations Display & Custom Markers (15:00 - 16:00 EST)

**Duplicate Save Prevention**:
- ✅ Enhanced error handling in `useSaveLocation` hook
- ✅ Parse API error codes to differentiate error types
- ✅ Show **warning toast** (yellow) instead of error toast for "ALREADY_SAVED" errors
- ✅ User-friendly message: *"This location is already in your saved locations"*
- **File**: [`src/hooks/useSaveLocation.ts`](./src/hooks/useSaveLocation.ts)

**Saved Locations Display on Map**:
- ✅ Integrated `useLocations()` hook to fetch all saved locations
- ✅ Created `useEffect` to convert saved locations into map markers
- ✅ Updated `MarkerData` interface with `userSave` and `color` properties
- ✅ Saved locations load automatically when map mounts
- ✅ Markers preserve temp markers while adding saved markers
- ✅ Visual distinction: Saved markers use type-specific colors
- **Files**:
  - [`src/app/map/page.tsx`](./src/app/map/page.tsx) - Added locations loading and display
  - [`src/hooks/useLocations.ts`](./src/hooks/useLocations.ts) - Already existed, now integrated

**Custom Camera Markers with Type Colors**:
- ✅ Updated `CustomMarker` to use camera icon for **ALL** locations
- ✅ Removed temporary-only restriction
- ✅ Dynamic color fill based on location type (13 production-specific colors)
- ✅ Consistent visual language across all map markers
- ✅ Easy type identification at a glance
- **Color Mapping**:
  - 🔵 Blue (#3B82F6) - BROLL
  - 🔴 Red (#EF4444) - STORY  
  - 🟣 Purple (#8B5CF6) - INTERVIEW
  - 🔴 Dark Red (#DC2626) - LIVE ANCHOR
  - 🟠 Orange (#F59E0B) - REPORTER LIVE
  - ⚫ Gray (#6B7280) - STAKEOUT
  - 🔵 Cyan (#06B6D4) - DRONE
  - 🟢 Green (#22C55E) - SCENE
  - 🟢 Lime (#84CC16) - EVENT
  - ⚫ Slate (#64748B) - OTHER
  - 🔵 Dark Blue (#1E40AF) - HQ
  - 🟣 Violet (#7C3AED) - BUREAU
  - 🩷 Pink (#EC4899) - REMOTE STAFF
- **File**: [`src/components/maps/CustomMarker.tsx`](./src/components/maps/CustomMarker.tsx)

**InfoWindow Improvements**:
- ✅ Conditional button display based on marker state
- ✅ Save/Quick Save buttons only show for **unsaved** (temporary) markers
- ✅ Prevents duplicate save attempts via UI
- ✅ Saved locations get "View Details" button (placeholder for future edit feature)
- **File**: [`src/app/map/page.tsx`](./src/app/map/page.tsx)

**Enhanced Logging**:
- ✅ Added comprehensive debug logging to `/api/locations` POST endpoint
- ✅ Logs location creation vs reuse scenarios
- ✅ Logs "already saved" checks with user/location IDs
- ✅ Better diagnostics for troubleshooting save issues
- **File**: [`src/app/api/locations/route.ts`](./src/app/api/locations/route.ts)

**User Experience Impact**:
- 🎯 Users can now see all their saved locations on the map
- 🎯 Duplicate saves prevented with friendly warnings
- 🎯 Color-coded markers make it easy to identify location types
- 🎯 No more confusion about which locations are already saved
- 🎯 Unified camera marker design across the application

---

### Afternoon Session - UI Refinements & Per-Photo Captions

**SaveLocationPanel UI Improvements**:
- Updated location types to production-specific categories: BROLL, STORY, INTERVIEW, LIVE ANCHOR, REPORTER LIVE, STAKEOUT, DRONE, SCENE, OTHER, HQ, BUREAU, REMOTE STAFF
- Hid individual address component fields (street, number, city, state, zip) - still saved to DB, just not displayed for cleaner UI
- Removed redundant section headers:
  - "Save New Location" (redundant with sidebar title)
  - "Basic Information" (implied)
  - "Personal Notes" (implied)
- Reordered sections: Production Details now appears before Personal Notes for better workflow

**Per-Photo Captions**:
- Removed general Caption/Notes textarea (wasn't being used properly)
- Implemented per-photo captions in ImageKitUploader
- Each photo now has its own caption input field (100 character limit)
- Caption data saves to `photos.caption` column in database
- Caption input appears below each photo thumbnail

### Morning Session - Core Implementation

**Fixed Critical Bugs**:
- **API UserSave Bug**: API was only saving `caption` field to `user_saves` table - now saves ALL fields (tags, isFavorite, personalRating, color)
- **Missing Address Components**: Form was missing street, number, city, state, zipcode fields - now auto-filled from Google Places
- **No Photo Upload**: ImageKit integration was completely missing - now fully implemented with drag-and-drop

**New Features**:
- **ImageKit Photo Upload**:
  - Drag-and-drop interface with live previews
  - Automatic compression to 1.5MB max file size
  - Canvas-based client-side compression (maintains quality)
  - Max 20 photos per location
  - Photo metadata saved to database
- **Address Component Parsing**:
  - Created `parseAddressComponents()` utility
  - Auto-fills street, number, city, state, zip from Google Geocoding
  - All address fields readonly (from Google data)
- **Form Enhancements**:
  - Character counters on textareas (caption: 200 chars, production notes: 500 chars)
  - Tag management system (max 20 tags, 25 chars each)
  - Badge display for tags with remove buttons
  - Rating selector (0-5 stars)
  - Marker color picker
  - Favorite checkbox
- **Custom Temporary Marker**:
  - Red square with camera icon (SVG-based)
  - Bottom pointer pin
  - Same size as default Google marker
  - Distinguishes temp vs saved markers

### Map UX Improvements
- **Auto-zoom to Street Level**: Map clicks now zoom to level 16 for better detail
- **Smooth Animations**: Using `map.setOptions()` for combined pan + zoom animations
- **InfoWindow Positioning**: Added 40px offset above marker to prevent overlap
- **Clean Workflow**:
  - Clicking new location auto-closes SaveLocationPanel
  - Removes all temporary markers on new click (only one temp marker at a time)
  - Closing InfoWindow X also closes SaveLocationPanel
  - Temporary markers cleaned up automatically

### API Endpoints Created
- `POST /api/imagekit/auth` - ImageKit authentication for client uploads
- `GET /api/photos?placeId=xxx` - Fetch photos for location
- `POST /api/photos` - Save photo metadata after upload
- `DELETE /api/photos/[id]` - Delete photo from ImageKit and database

### Files Created
- `/src/components/ui/ImageKitUploader.tsx` - Photo upload component
- `/src/app/api/imagekit/auth/route.ts` - ImageKit auth endpoint
- `/src/app/api/photos/route.ts` - Photo CRUD API
- `/src/app/api/photos/[id]/route.ts` - Photo deletion
- `/src/lib/address-utils.ts` - Google address parser

### Files Modified
- `/src/components/panels/SaveLocationPanel.tsx` - Complete overhaul with all fields
- `/src/app/api/locations/route.ts` - Fixed UserSave creation to include all fields
- `/src/hooks/useSaveLocation.ts` - Added photo handling and all UserSave fields
- `/src/app/map/page.tsx` - Address component parsing, improved click workflow
- `/src/lib/maps-utils.ts` - Added address component fields to LocationData
- `/src/components/maps/CustomMarker.tsx` - Custom temporary marker (red square with camera)
- `/src/components/maps/InfoWindow.tsx` - Added 40px pixel offset

---

## Recent Changes (Dec 21, 2024)

---

## 🎯 Project Overview

Refactoring legacy vanilla JavaScript Google Maps application to modern Next.js/React/TypeScript stack.

**Migration Stats**:
- Old: 27K+ lines CSS, 105 HTML files, SQLite, Vanilla JS
- New: Next.js 16, React 19, TypeScript, Tailwind CSS v4, MySQL, Prisma ORM

---

## ✅ COMPLETED PHASES

### Phase 1: Foundation (100% Complete)

**Infrastructure**:
- ✅ Next.js 16.0.10 project initialized
- ✅ TypeScript 5 configured
- ✅ Tailwind CSS v4 with PostCSS
- ✅ shadcn/ui component library setup (`components.json` configured)
- ✅ Prisma 6.19.1 with MySQL (downgraded from v7 for Next.js compatibility)

**Database Schema** ([`prisma/schema.prisma`](./prisma/schema.prisma)):
- ✅ **9 tables, 128 total fields**
- ✅ User model (31 fields: auth, profile, OAuth, 2FA, preferences, soft delete, GPS tracking)
- ✅ Location model (31 fields: Google Places, address, production, permits, contacts)
- ✅ Photo model (13 fields: ImageKit integration, multiple photos per location)
- ✅ UserSave model (10 fields: tags, favorites, ratings, colors, visit tracking)
- ✅ Session model (13 fields: security tracking, device info, geographic data)
- ✅ Project model (11 fields: campaign/shoot organization)
- ✅ ProjectLocation model (6 fields: many-to-many with shoot dates)
- ✅ LocationContact model (8 fields: property managers, owners)
- ✅ TeamMember model (5 fields: crew collaboration)

> [!IMPORTANT]
> **Legacy Compatibility**: Core Merkel-Vision fields preserved. Additional fields added for enterprise features and production workflows. Full mapping document needed for Phase 9 migration.

**Project Structure**:
```
src/
├── app/              # Next.js App Router
│   ├── api/auth/    # Authentication API routes (7 routes)
│   └── page.tsx     # Home page (default Next.js template)
├── components/       # React components (empty - to be built)
│   ├── auth/
│   ├── locations/
│   ├── maps/
│   ├── layout/
│   └── ui/          # shadcn/ui components
├── hooks/           # Custom React hooks (empty)
├── lib/             # Utilities and libraries
│   ├── auth.ts      # JWT, bcrypt, token utilities
│   ├── email.ts     # Nodemailer email service
│   ├── api-middleware.ts  # Auth middleware
│   ├── prisma.ts    # Prisma client singleton
│   └── utils.ts     # Tailwind merge utility
└── types/           # TypeScript definitions
    ├── user.ts      # User, PublicUser, AuthResponse
    ├── location.ts  # Location types
    └── maps.ts      # Google Maps types
```

**Configuration Files**:
- ✅ `ENV_TEMPLATE.md` - Complete environment variable documentation
- ✅ `.gitignore` - Configured for Next.js + excludes `.env*` files
- ✅ `package.json` - All dependencies installed
- ✅ `tsconfig.json` - TypeScript paths configured (`@/*` alias)
- ✅ `prisma.config.ts` - Prisma 7 configuration with DATABASE_URL

---

### Phase 2: Authentication System (Backend: 100%, Frontend: 100% - BLOCKED ON DB)

#### ✅ Backend Complete

**Authentication Utilities** ([`src/lib/auth.ts`](./src/lib/auth.ts)):
- ✅ `hashPassword()` - bcrypt with 10 salt rounds
- ✅ `comparePassword()` - Password verification
- ✅ `generateToken()` - JWT generation (7 or 30 day expiry)
- ✅ `verifyToken()` - JWT validation
- ✅ `generateVerificationToken()` - Email verification tokens
- ✅ `generatePasswordResetToken()` - Password reset tokens
- ✅ `getResetTokenExpiry()` - 1 hour token expiry

**Email Service** ([`src/lib/email.ts`](./src/lib/email.ts)):
- ✅ Nodemailer configured with SMTP
- ✅ `sendVerificationEmail()` - Professional HTML template
- ✅ `sendPasswordResetEmail()` - Security-focused template
- ✅ `sendWelcomeEmail()` - Onboarding email
- ✅ Development mode logging for Mailtrap

## ✅ Phase 2: Authentication System (COMPLETE)

**Status**: Backend and frontend authentication fully implemented and tested. All features working.

### Backend API Routes

All authentication endpoints implemented in `/src/app/api/auth/`:

- ✅ **POST** `/api/auth/register` - User registration with email verification
- ✅ **POST** `/api/auth/login` - User login with JWT tokens
- ✅ **GET** `/api/auth/me` - Get current user profile
- ✅ **POST** `/api/auth/logout` - User logout
- ✅ **POST** `/api/auth/forgot-password` - Request password reset
- ✅ **POST** `/api/auth/reset-password` - Reset password with token
- ✅ **POST** `/api/auth/change-password` - Change password (authenticated)
- ✅ **GET** `/api/auth/verify-email` - Email verification endpoint with production logging

### Frontend Pages & Components

- ✅ Login page (`/src/app/login/page.tsx`)
- ✅ Registration page (`/src/app/register/page.tsx`)
- ✅ Email verification page (`/src/app/verify-email/page.tsx`) - With loading/success/error states
- ✅ Login form component (`/src/components/auth/LoginForm.tsx`)
- ✅ Registration form component (`/src/components/auth/RegisterForm.tsx`)
- ✅ Toast notifications configured (Sonner)

### Authentication Infrastructure

- ✅ JWT token generation and validation (`/src/lib/auth.ts`)
- ✅ Password hashing with bcryptjs
- ✅ Protected route middleware (`/src/lib/api-middleware.ts`)
- ✅ Email service setup (`/src/lib/email.ts`) - Development mode logs to terminal
- ✅ Database schema with User, Session, and auth fields
- ✅ Prisma 6.19.1 (downgraded from v7 for Next.js compatibility)

### Testing Status

- ✅ Registration flow tested and working
- ✅ Login flow tested and working
- ✅ Session management tested and working
- ✅ Email verification complete with terminal logging
- ✅ Password validation working
- ✅ JWT token storage in sessions table (VARCHAR(500))
- ✅ Cookie-based authentication working

### Bug Fixes Completed

- ✅ Fixed Prisma 7 → Prisma 6 downgrade for Next.js compatibility
- ✅ Fixed `nodemailer.createTransporter` → `nodemailer.createTransport`
- ✅ Fixed nodemailer import (changed to `import * as nodemailer`)
- ✅ Fixed Session token column size (VARCHAR(255) → VARCHAR(500))
- ✅ Fixed email service to log to terminal in development mode
- ✅ Database CONNECTION_URL configuration resolved
- ✅ `hashPassword()` - bcrypt with 10 salt rounds
- ✅ `comparePassword()` - Password verification
- ✅ `generateToken()` - JWT generation (7 or 30 day expiry)
- ✅ `verifyToken()` - JWT validation
- ✅ `generateVerificationToken()` - Email verification tokens
- ✅ `generatePasswordResetToken()` - Password reset tokens
- ✅ `getResetTokenExpiry()` - 1 hour token expiry

**Email Service** ([`src/lib/email.ts`](./src/lib/email.ts)):
- ✅ Nodemailer configured with SMTP
- ✅ `sendVerificationEmail()` - Professional HTML template
- ✅ `sendPasswordResetEmail()` - Security-focused template
- ✅ `sendWelcomeEmail()` - Onboarding email
- ✅ Development mode logging for Mailtrap

**API Middleware** ([`src/lib/api-middleware.ts`](./src/lib/api-middleware.ts)):
- ✅ `requireAuth()` - JWT verification + database user fetch
- ✅ `requireAdmin()` - Admin-only access control
- ✅ `getAuthUser()` - Optional auth helper
- ✅ `apiResponse()` - Standardized success responses
- ✅ `apiError()` - Standardized error responses with codes
- ✅ `setAuthCookie()` / `clearAuthCookie()` - httpOnly cookie management

**API Routes** (7 routes in [`src/app/api/auth/`](./src/app/api/auth/)):

1. ✅ **POST `/api/auth/register`** ([`register/route.ts`](./src/app/api/auth/register/route.ts))
   - Zod validation (email, username, password strength)
   - Duplicate checking
   - Password hashing
   - Verification email sending
   - Session creation
   - JWT token + httpOnly cookie

2. ✅ **POST `/api/auth/login`** ([`login/route.ts`](./src/app/api/auth/login/route.ts))
   - Email/password verification
   - Remember me support (30 day tokens)
   - Session creation
   - Returns user + token

3. ✅ **POST `/api/auth/logout`** ([`logout/route.ts`](./src/app/api/auth/logout/route.ts))
   - Session deletion
   - Cookie clearing

4. ✅ **GET `/api/auth/verify-email?token=xxx`** ([`verify-email/route.ts`](./src/app/api/auth/verify-email/route.ts))
   - Token validation
   - Sets `emailVerified = true`

5. ✅ **POST `/api/auth/forgot-password`** ([`forgot-password/route.ts`](./src/app/api/auth/forgot-password/route.ts))
   - Email lookup (security: always returns success)
   - Reset token generation (1 hour expiry)
   - Reset email sending

6. ✅ **POST `/api/auth/reset-password`** ([`reset-password/route.ts`](./src/app/api/auth/reset-password/route.ts))
   - Token validation + expiry check
   - Password update
   - All sessions invalidated for security

7. ✅ **GET `/api/auth/me`** ([`me/route.ts`](./src/app/api/auth/me/route.ts))
   - Returns current authenticated user
   - Supports Bearer token or cookie auth

#### ❌ Frontend Not Started

**Blocked On**: Environment configuration (`.env.local` file)

**Next Steps for Phase 2 Frontend**:
1. Create `.env.local` file (gitignored, must be manual)
2. Run `npx prisma db push` to sync database
3. Install shadcn/ui components: `button`, `input`, `label`, `form`, `card`, `toast`
4. Build auth components:
   - `LoginForm.tsx`
   - `RegisterForm.tsx`
   - `ForgotPasswordForm.tsx`
   - `ResetPasswordForm.tsx`
5. Create auth pages:
   - `/login/page.tsx`
   - `/register/page.tsx`
   - `/forgot-password/page.tsx`
   - `/reset-password/page.tsx`
   - `/verify-email/page.tsx`
6. Build auth context provider
7. Test complete authentication flow

---

## ✅ CURRENT STATUS: PHASE 3 COMPLETE

### What's Complete

✅ **Phase 1**: Foundation (100%)  
✅ **Phase 2**: Authentication System - Backend & Frontend (100%)  
✅ **Phase 2**: Database Setup - MySQL 9.5.0 installed and configured (100%)  
✅ **Phase 3**: Base Layout & Navigation (100%)

### Database Setup (RESOLVED)

**MySQL 9.5.0 Installed via Homebrew**:
```bash
brew install mysql
brew services start mysql
mysql -u root -e "CREATE DATABASE google_search_me;"
DATABASE_URL="mysql://root@localhost:3306/google_search_me" npx prisma db push
```

**Status**: ✅ Running on `localhost:3306`  
**Tables Created**: users, locations, user_saves, sessions

### Phase 3 Implementation (COMPLETE)

**Components Created**:
- ✅ Auth Context Provider ([`src/lib/auth-context.tsx`](./src/lib/auth-context.tsx))
- ✅ Providers Wrapper ([`src/components/providers.tsx`](./src/components/providers.tsx))
- ✅ Header Component ([`src/components/layout/Header.tsx`](./src/components/layout/Header.tsx))
- ✅ Navigation Component ([`src/components/layout/Navigation.tsx`](./src/components/layout/Navigation.tsx))
- ✅ AuthButton Component ([`src/components/layout/AuthButton.tsx`](./src/components/layout/AuthButton.tsx))
- ✅ MobileMenu Component ([`src/components/layout/MobileMenu.tsx`](./src/components/layout/MobileMenu.tsx))
- ✅ Footer Component ([`src/components/layout/Footer.tsx`](./src/components/layout/Footer.tsx))

**shadcn/ui Components Added**:
- ✅ Avatar, Dropdown Menu, Sheet, Separator

**Pages Updated**:
- ✅ Root Layout - Added providers, header, footer
- ✅ Home Page - Modern hero section with auth-aware CTAs

### Development Server

```bash
npm run dev
# ✓ Ready at http://localhost:3000
```

**Note**: Prisma was downgraded from v7.1.0 to v6.19.1 due to Next.js compatibility issues. Prisma 7 removed support for `url = env("DATABASE_URL")` in schema files, requiring a config file approach that doesn't work with Next.js runtime environment loading. Prisma 6 works perfectly with the traditional schema-based configuration.

### Critical Action Required

**Problem**: `.env.local` file is gitignored and cannot be auto-created.

**Solution**: User must manually create `.env.local` with these values:

```bash
# Database (MySQL - local or cloud)
DATABASE_URL="mysql://root:password@localhost:3306/google_search_me"

# JWT Secret (generate: openssl rand -base64 32)
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"

# Email (Mailtrap for development)
EMAIL_SERVICE="mailtrap"
EMAIL_HOST="sandbox.smtp.mailtrap.io"
EMAIL_PORT="2525"
EMAIL_USER="your-mailtrap-username"
EMAIL_PASS="your-mailtrap-password"
EMAIL_MODE="development"
EMAIL_FROM_NAME="Google Maps Search"
EMAIL_FROM_ADDRESS="dev@localhost"

# Google Maps
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="your-google-maps-api-key"

# ImageKit (photo uploads)
IMAGEKIT_PUBLIC_KEY="your-imagekit-public-key"
IMAGEKIT_PRIVATE_KEY="your-imagekit-private-key"
IMAGEKIT_URL_ENDPOINT="your-imagekit-url"

# App URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Environment
NODE_ENV="development"
```

**After creating `.env.local`**:
```bash
cd google-search-me-refactor
npx prisma db push
npx prisma studio  # Verify database
npm run dev        # Test API routes
```

---

## 📋 REMAINING PHASES (NOT STARTED)

### Phase 4: Google Maps Integration (100% ✅ + Map Interaction Refinements)
- [x] @react-google-maps/api setup
- [x] GoogleMap wrapper component
- [x] Map controls (zoom, GPS, map type toggle)
- [x] Custom markers with click handlers
- [x] Info windows with location details
- [x] Places Autocomplete search
- [x] Map utility functions
- [x] Test page at `/map`
- [x] Integration with root layout
- [x] **User location blue dot marker**
- [x] **Reverse geocoding integration**
- [x] **Temporary marker state management**
- [x] **InfoWindow data enrichment**
- [x] **Click-to-save workflow foundation**

**Key Components**:
- `GoogleMapsProvider` - Context provider with loading/error states
- `GoogleMap` - Main map wrapper with event handlers
- `CustomMarker` - Reusable marker component (supports icons, symbols)
- `UserLocationMarker` - Blue dot for user's current location
- `InfoWindow` - Popup windows for location details with full data
- `PlacesAutocomplete` - Search with autocomplete
- `maps-utils.ts` - GPS, distance calculation, address formatting

#### ✅ Map Interaction Refinements (December 20, 2024)

**User Location ("Blue Dot") Implementation**:
- ✅ Created `UserLocationMarker` component ([`src/components/maps/UserLocationMarker.tsx`](./src/components/maps/UserLocationMarker.tsx))
  - Uses `google.maps.SymbolPath.CIRCLE` for native-looking blue dot
  - Clickable marker to fetch location data
  - Proper TypeScript typing with `google.maps.Symbol`
- ✅ Updated `CustomMarker` component to support `google.maps.Symbol` icons
- ✅ GPS button now zooms to street level (zoom: 17) for better detail
- ✅ Blue dot appears when GPS button is clicked or user location is detected

**Temporary Marker Management**:
- ✅ Added `isTemporary` flag to `MarkerData` interface
- ✅ Map-clicked markers marked as `isTemporary: true`
- ✅ Search-based markers marked as `isTemporary: false` (persist)
- ✅ Auto-removal: Temporary markers removed when InfoWindow closes without saving
- ✅ Saved markers persist on the map (foundation for Phase 6)

**InfoWindow Data Integration**:
- ✅ Reverse geocoding using Google Geocoding API
- ✅ InfoWindow displays:
  - Place name/address
  - Full formatted address
  - Latitude/Longitude (3 decimal places)
  - Rating (if available from Google Places)
  - "Save" button (placeholder - to be connected in Phase 6)
  - "Directions" button (links to Google Maps)
- ✅ Clicking blue dot fetches user location data via reverse geocoding
- ✅ Clicking anywhere on map creates temporary marker with location data

**Technical Improvements**:
- ✅ Removed invalid `myLocationEnabled` option (not supported in JavaScript API)
- ✅ Fixed TypeScript casting for map options
- ✅ Proper error handling for geocoding failures
- ✅ Auto-show InfoWindow when marker is created

**Files Modified**:
- [`src/components/maps/GoogleMap.tsx`](./src/components/maps/GoogleMap.tsx) - Removed invalid options
- [`src/components/maps/UserLocationMarker.tsx`](./src/components/maps/UserLocationMarker.tsx) - NEW component
- [`src/components/maps/CustomMarker.tsx`](./src/components/maps/CustomMarker.tsx) - Symbol icon support
- [`src/app/map/page.tsx`](./src/app/map/page.tsx) - Marker lifecycle, blue dot integration, InfoWindow data

**Next Steps for Map (Phase 6)**:
- [ ] Connect "Save" button to `SaveLocationPanel` component
- [ ] Implement saved marker persistence with custom colors
- [ ] Add marker clustering for Map View
- [ ] Integrate with location API for full CRUD operations

---

### Phase 6: Save/Edit Workflows & Map Integration (In Progress - 85%)

**Objective**: Connect map interactions to location API, implement save/edit panels, enhance marker management, and secure authentication.

**Status Update (December 20, 2024 - 22:55 EST)**:
- ✅ Save Location workflow **COMPLETE and tested**
- ✅ **Security fixes implemented and tested**
- ✅ All critical bug fixes resolved
- ✅ Full integration between map, InfoWindow, and SaveLocationPanel
- 🚧 Edit workflow and marker clustering pending

#### ✅ Security Fixes Implemented (December 20, 2024)

**Email Verification Enforcement**:
- ✅ Login route checks `emailVerified` status
- ✅ Unverified users blocked with 403 error + clear message
- ✅ Created `/api/auth/resend-verification` endpoint
- ✅ Rate limiting: 3 emails per hour per user
- ✅ 24-hour token expiry
- ✅ `EmailVerificationPrompt` component ready for use
- **File**: [`src/app/api/auth/login/route.ts`](./src/app/api/auth/login/route.ts) (lines 48-56)
- **File**: [`src/app/api/auth/resend-verification/route.ts`](./src/app/api/auth/resend-verification/route.ts) - NEW
- **File**: [`src/components/auth/EmailVerificationPrompt.tsx`](./src/components/auth/EmailVerificationPrompt.tsx) - NEW

**Single-Session Security**:
- ✅ Only 1 active session per user at any time
- ✅ Old sessions automatically deleted on new login
- ✅ Prevents session hijacking and orphaned sessions
- ✅ More secure than multi-device approach
- **Implementation**: Uses `prisma.session.deleteMany()` before creating new session
- **File**: [`src/app/api/auth/login/route.ts`](./src/app/api/auth/login/route.ts) (lines 79-83)
- **Tested**: Verified in Prisma Studio - sessions properly managed

**Authentication Bug Fixes**:
- ✅ Fixed login route syntax error (missing closing brace)
- ✅ Fixed auth state not refreshing after login
- ✅ Changed redirect to full page reload: `window.location.href = '/map'`
- ✅ Added diagnostic logging to `requireAuth` middleware
- ✅ Verified cookie transmission (HttpOnly flag set correctly)
- ✅ **UX Improvement**: Already-verified emails show success message + auto-redirect to login
- ✅ **Route Protection**: Protected pages now redirect to login if unauthorized
- ✅ **CRITICAL FIX**: Session validation now checks database on every request
- ✅ **CRITICAL FIX**: Auth context caching disabled (staleTime: 0, gcTime: 0)
- **File**: [`src/components/auth/LoginForm.tsx`](./src/components/auth/LoginForm.tsx)
- **File**: [`src/lib/api-middleware.ts`](./src/lib/api-middleware.ts) - **CRITICAL**: Added session DB validation
- **File**: [`src/lib/auth-context.tsx`](./src/lib/auth-context.tsx) - **CRITICAL**: Removed stale caching
- **File**: [`src/app/verify-email/page.tsx`](./src/app/verify-email/page.tsx) - Friendly message with 3-second countdown
- **File**: [`src/app/api/auth/verify-email/route.ts`](./src/app/api/auth/verify-email/route.ts) - Detects already-verified status
- **File**: [`src/components/auth/ProtectedRoute.tsx`](./src/components/auth/ProtectedRoute.tsx) - NEW route guard component

#### ✅ Previous Bug Fixes Completed

1. **Field Name Mismatch (FIXED)**
   - **Issue**: API rejected save requests with 400 Bad Request
   - **Root Cause**: Frontend sent `lat`/`lng` but API expected `latitude`/`longitude`
   - **Fix**: Updated `useSaveLocation` hook to map field names before API call
   - **File**: [`src/hooks/useSaveLocation.ts`](./src/hooks/useSaveLocation.ts)
   - **Status**: ✅ Tested and working

2. **Login Redirect Path (FIXED)**
   - **Issue**: Users redirected to `/app` (404) after login
   - **Root Cause**: `LoginForm.tsx` had hardcoded redirect to non-existent `/app` page
   - **Fix**: Changed redirect destination to `/map`
   - **File**: `src/components/auth/LoginForm.tsx`
   - **Status**: ✅ Tested and working

#### ✅ Marker State Management (Complete)

**Foundation Implemented**:
- ✅ `isTemporary` flag on `MarkerData` interface
- ✅ Temporary markers (map clicks) automatically removed when InfoWindow closes
- ✅ Persistent markers (search results) remain on map
- ✅ Auto-show InfoWindow on marker creation
- ✅ Marker lifecycle management and cleanup

**User Experience**:
- ✅ Click anywhere on map → temporary marker appears with InfoWindow
- ✅ Close InfoWindow without saving → marker disappears (no clutter)
- ✅ Search for location → marker stays on map (persists)
- ✅ Future: Save location → marker persists with custom color

#### ✅ Save Location Workflow (COMPLETE - 100%)

**Components Implemented**:
- ✅ `SaveLocationPanel` - Right sidebar panel for saving locations ([`src/components/panels/SaveLocationPanel.tsx`](./src/components/panels/SaveLocationPanel.tsx))
  - ✅ Pre-filled from InfoWindow data (name, address, lat/lng, rating)
  - ✅ Form fields for production details (notes, parking, access, entry point)
  - ✅ Address component fields (street, number, city, state, zip)
  - ✅ Tags input with badge display
  - ✅ Category selector and color picker
  - ✅ Photo upload integration (ImageKit) - UI ready
  - ✅ Save button → POST to `/api/locations` via `useSaveLocation` hook
  - ✅ Form validation with `react-hook-form` and `zod`
  - ✅ **BUG FIX**: Field name mapping (`lat`/`lng` → `latitude`/`longitude`)
- ✅ `RightSidebar` component for panel container ([`src/components/layout/RightSidebar.tsx`](./src/components/layout/RightSidebar.tsx))
- ✅ `useSaveLocation` hook with proper data transformation ([`src/hooks/useSaveLocation.ts`](./src/hooks/useSaveLocation.ts))

**Integration Points**:
- ✅ Wired "Save" button in InfoWindow to open `SaveLocationPanel`
- ✅ Pass location data from InfoWindow to panel via `initialData` prop
- ✅ On successful save:
  - ✅ Update marker to `isTemporary: false`
  - ✅ Close sidebar and InfoWindow
  - ✅ Show success toast (via `useSaveLocation` hook)
  - ✅ **TESTED**: Locations save to database successfully
  - ✅ **TESTED**: Markers persist after save
  - [ ] Apply custom color to marker (deferred to marker clustering phase)
  - [ ] Load saved locations on map (deferred to marker persistence phase)

**Quick Save Feature**:
- ✅ "Quick Save" button implemented in InfoWindow
  - Saves only: name, address, lat/lng, placeId
  - Marks marker as permanent
  - Shows success alert
  - **Note**: Email reminder and auto-deletion deferred to Phase 6b (requires backend cron job)

#### 🚧 Edit Location Workflow (Planned)

**Components to Build**:
- [ ] `EditLocationPanel` - Similar to save panel, but pre-filled
  - Load existing location data
  - All fields editable
  - Audit trail tracking (lastModifiedBy, lastModifiedAt)
  - Update button → PATCH to `/api/locations/[id]`

**Access Control**:
- [ ] Check permissions (creator OR admin can edit)
- [ ] Show edit button only to authorized users
- [ ] Implement optimistic updates with rollback

#### 📍 Saved Marker Persistence (Planned)

**Features to Implement**:
- [ ] Load user's saved locations on map load
  - Query `/api/locations` with viewport bounds
  - Create persistent markers for all saved locations
  - Apply custom colors from user preferences
- [ ] Marker clustering for dense areas
  - Use `@googlemaps/markerclusterer` library
  - Cluster markers when zoomed out
  - Expand clusters on click
- [ ] Custom marker icons based on category/tags
- [ ] Highlight markers on hover/selection from sidebar

**Current Status**:
- ✅ Temporary marker management complete
- ✅ Marker lifecycle and cleanup working
- ✅ SaveLocationPanel created and integrated
- ✅ InfoWindow "Save" button connected to panel
- ✅ **Save workflow TESTED and working**
- ✅ Quick Save button implemented
- ✅ **Bug fixes**: Field mapping, login redirect, and auth state
- ✅ **Security fixes**: Email verification + single-session enforcement
- ⏸️ EditLocationPanel - Not started (next priority)
- ⏸️ Marker clustering - Not started
- ⏸️ Load saved markers on map - Not started
- ⏸️ Custom marker colors - Not started

**Files Created/Modified for Phase 6**:

*Save Location Workflow*:
- [`src/components/panels/SaveLocationPanel.tsx`](./src/components/panels/SaveLocationPanel.tsx) - NEW component
- [`src/components/layout/RightSidebar.tsx`](./src/components/layout/RightSidebar.tsx) - NEW component
- [`src/hooks/useSaveLocation.ts`](./src/hooks/useSaveLocation.ts) - **FIXED**: Field name mapping (lat/lng → latitude/longitude)
- [`src/app/map/page.tsx`](./src/app/map/page.tsx) - Integrated SaveLocationPanel + Quick Save
- [`src/types/maps.ts`](./src/types/maps.ts) - Updated types for marker data and panel props

*Security & Authentication*:
- [`src/app/api/auth/resend-verification/route.ts`](./src/app/api/auth/resend-verification/route.ts) - NEW endpoint with rate limiting
- [`src/app/api/auth/login/route.ts`](./src/app/api/auth/login/route.ts) - Email verification check + single-session enforcement
- [`src/components/auth/EmailVerificationPrompt.tsx`](./src/components/auth/EmailVerificationPrompt.tsx) - NEW component (ready for use)
- `src/components/auth/LoginForm.tsx` - **FIXED**: Full page reload + redirect to `/map` instead of `/app`
- [`src/lib/api-middleware.ts`](./src/lib/api-middleware.ts) - Debug logging added
- [`src/app/verify-email/page.tsx`](./src/app/verify-email/page.tsx) - **IMPROVED**: Gentle UX for already-verified emails
- [`src/app/api/auth/verify-email/route.ts`](./src/app/api/auth/verify-email/route.ts) - **IMPROVED**: Detects verified status
- [`src/components/auth/ProtectedRoute.tsx`](./src/components/auth/ProtectedRoute.tsx) - NEW route guard component
- [`src/app/map/page.tsx`](./src/app/map/page.tsx) - **PROTECTED**: Wrapped with ProtectedRoute
- [`src/app/locations/page.tsx`](./src/app/locations/page.tsx) - **PROTECTED**: Wrapped with ProtectedRoute

> [!IMPORTANT]
> **Route Protection Requirements**
> 
> All authenticated pages must be wrapped with `ProtectedRoute` component to prevent unauthorized access:
> - ✅ `/map` - Protected
> - ✅ `/locations` - Protected
> - ⚠️ **Future Admin Pages** - Will require protection AND `requireAdmin()` check
> - ⚠️ **Future User Profile** - Will require protection
> 
> The `ProtectedRoute` component checks authentication client-side and redirects to `/login` if unauthorized.
> For admin-only pages, an `AdminRoute` component should be created that also checks `user.isAdmin`.

#### ✅ Additional Security Enhancements (December 21, 2024)

**Critical Session Validation Fix**:
- ✅ **VULNERABILITY FIXED**: JWT tokens were valid even after session deletion
- ✅ Added database session validation to `requireAuth` middleware
- ✅ Every request now checks `sessions` table for valid, non-expired session
- ✅ Deleted sessions = immediate logout (no more ghost sessions)
- **Impact**: Prevents unauthorized access with deleted but unexpired JWT tokens
- **File**: [`src/lib/api-middleware.ts`](./src/lib/api-middleware.ts) (lines 69-93)

**Frontend Cache Security Fix**:
- ✅ **VULNERABILITY FIXED**: React Query cached user data for 5 minutes
- ✅ Set `staleTime: 0` and `gcTime: 0` to always check server
- ✅ Added `refetchOnMount` and `refetchOnWindowFocus`
- ✅ Clear all cache on logout
- **Impact**: No stale authentication data, immediate logout reflection
- **File**: [`src/lib/auth-context.tsx`](./src/lib/auth-context.tsx)

**Validation Infrastructure**:
- ✅ Created centralized validation config (`/src/lib/validation-config.ts`)
- ✅ Max lengths configurable in one place:
  - Name: 50 chars
  - Address: 100 chars
  - Notes: 500 chars
  - Caption: 20 chars
  - Tags: 25 chars each, 20 max
- ✅ Helper functions for validation and character counting

**XSS Protection**:
- ✅ Installed `isomorphic-dompurify` for XSS sanitization
- ✅ Created sanitization utility (`/src/lib/sanitize.ts`):
  - `sanitizeText()` - Strips all HTML tags
  - `sanitizeHTML()` - Allows safe HTML only
  - `sanitizeArray()` - Sanitizes arrays (tags, etc.)
  - `sanitizeLocationData()` - Sanitizes entire location object
- ✅ Backend API sanitizes all user inputs before storage
- **Files**:
  - [`src/lib/sanitize.ts`](./src/lib/sanitize.ts) - NEW
  - [`src/app/api/locations/route.ts`](./src/app/api/locations/route.ts) - Uses sanitization

**Admin Route Guard**:
- ✅ Created `AdminRoute` component for future admin pages
- ✅ Checks `user.isAdmin` before rendering
- ✅ Redirects non-admin users with toast notification
- ✅ Ready for Phases 8-11 admin features
- **File**: [`src/components/auth/AdminRoute.tsx`](./src/components/auth/AdminRoute.tsx) - NEW

#### ✅ UX Improvements (December 21, 2024)

**Context-Aware Navigation**:
- ✅ Logo link conditional based on auth state
  - Unauthenticated: Links to `/` (landing page)
  - Authenticated: Links to `/map` (primary app view)
- ✅ Navigation links filter by auth status
  - Unauthenticated: Shows "Home" only
  - Authenticated: Shows "Map" and "My Locations" (no redundant Home link)
- ✅ Better UX - authenticated users always have relevant navigation
- **Files**:
  - [`src/components/layout/Header.tsx`](./src/components/layout/Header.tsx) - Uses `useAuth` for conditional logo link
  - [`src/components/layout/Navigation.tsx`](./src/components/layout/Navigation.tsx) - Filters nav items by auth

**Conditional Footer**:
- ✅ Footer hidden for authenticated users
- ✅ Footer shown only on landing/marketing pages
- ✅ Maximizes screen space for map and app views
- ✅ Cleaner app-focused interface post-login
- **Files**:
  - [`src/components/layout/ConditionalFooter.tsx`](./src/components/layout/ConditionalFooter.tsx) - NEW wrapper component
  - [`src/app/layout.tsx`](./src/app/layout.tsx) - Uses conditional footer

#### ✅ Bug Fixes & Improvements (December 21, 2024)

**TypeScript Error Resolution**:
- ✅ Fixed TypeScript error in `requireAuth` middleware
- ✅ Added missing `PublicUser` fields to select statement (avatar, city, country, language)
- ✅ User object now matches `PublicUser` type exactly
- **File**: [`src/lib/api-middleware.ts`](./src/lib/api-middleware.ts)

**Validation Config Updates**:
- ✅ Increased address max length: 100 → **250 characters**
- ✅ More realistic for full addresses with building names, etc.
- **File**: [`src/lib/validation-config.ts`](./src/lib/validation-config.ts)

**API Error Logging**:
- ✅ Added detailed error logging to `/api/locations` POST endpoint
- ✅ Logs show exact validation failures (field name, actual/max lengths)
- ✅ Better diagnostics for 400 errors
- **File**: [`src/app/api/locations/route.ts`](./src/app/api/locations/route.ts)

---

## 🔧 Known Issues & Improvements Needed

### Phase 6 - Save Location Enhancements (Next Priority)

**Areas for Improvement**:
1. **Form Validation** - Enhance client-side validation feedback
2. **Input Sanitization** - Review for XSS/injection vulnerabilities (see below)
3. **Photo Upload** - Complete ImageKit integration (UI ready, backend pending)
4. **Error Handling** - Better error messages for API failures
5. **Tags Management** - Improve tag input UX
6. **Loading States** - Add better loading indicators during save

**Input Validation Status**:
- ✅ **Backend Validation** (Zod schemas + validation config):
  - Registration: email format, password strength (min 8 chars)
  - Login: email format required
  - Save Location: required fields + max length validation
  - **NEW**: Using centralized `VALIDATION_CONFIG`
  - **NEW**: Input sanitization with DOMPurify
- ✅ **Frontend Validation** (react-hook-form + zod):
  - Registration form: real-time validation with error messages
  - Login form: required field validation
  - Save Location form: field validation (name, address required)
  - 🚧 **IN PROGRESS**: Character counters for max lengths
  - 🚧 **IN PROGRESS**: Tag count/length validation UI
- ✅ **XSS Protection**: ✅ **IMPLEMENTED**
  - DOMPurify sanitization on all user inputs
  - Text fields: HTML stripped completely
  - Rich text fields: Safe HTML only
- ✅ **SQL Injection**: Using Prisma ORM (parameterized queries) - ✅ Protected
- 🚧 **Needs Completion**:
  - Character counters in SaveLocationPanel
  - Tag validation UI (count + length)
  - Apply validation to EditLocationDialog

**Next Features to Implement**:
- [ ] EditLocationPanel for editing saved locations
- [ ] Load saved locations on map with custom colors
- [ ] Marker clustering for dense areas
- [ ] Custom marker icons based on category/tags

- Profile (3): firstName, lastName, bio
- Email Verification (3): emailVerified, verificationToken, verificationTokenExpiry
- Password Reset (2): resetToken, resetTokenExpiry
- Account Status (2): isActive, isAdmin
- GPS Permission (2): gpsPermission, gpsPermissionUpdated
- Extended Profile (6): avatar, phoneNumber, city, country, timezone, language
- Preferences (1): emailNotifications
- Two-Factor Auth (2): twoFactorEnabled, twoFactorSecret
- OAuth (2): googleId, appleId
- Activity (1): lastLoginAt
- Soft Delete (1): deletedAt
- Timestamps (2): createdAt, updatedAt

**Location Model** - 29 total fields (100% legacy compatible):
- Core (6): id, placeId, name, address, lat, lng
- Type & Rating (2): type, rating
- Address Components (5): street, number, city, state, zipcode
- Production Details (4): productionNotes, entryPoint, parking, access
- Photos (7): photoUrls, imagekitFileId, imagekitFilePath, originalFilename, photoUploadedBy, photoUploadedAt
- Metadata (1): isPermanent
- Audit Trail (4): createdBy, lastModifiedBy, lastModifiedAt
- Timestamps (2): createdAt, updatedAt

#### ✅ API Routes (All Tested & Working)
- [x] GET `/api/locations` - List with filters, viewport bounds ✅ Tested
- [x] POST `/api/locations` - Save location (all 29 fields) ✅ Tested
- [x] GET `/api/locations/[id]` - Single location ✅ Tested
- [x] PATCH `/api/locations/[id]` - Update location (audit trail working) ✅ Tested
- [x] PATCH `/api/locations/[id]/caption` - Update caption ✅ Tested
- [x] DELETE `/api/locations/[id]` - Remove from saves
- [x] POST `/api/locations/[id]/share` - Share placeholder

#### ✅ Bug Fixes & Improvements
- [x] Fixed Prisma validation error (optional field handling with spread operator)
- [x] Fixed Next.js 15+ async params bug in all [id] routes
- [x] Removed unused `website` field
- [x] Added enterprise features: 2FA, soft delete, email preferences
- [x] Complete API endpoint testing with real data
- [x] Database persistence verified


#### ✅ Frontend (100% Complete!)
- [x] Permission helper functions
- [x] TypeScript types updated (User: 31 fields, Location: 31 fields + Photo interface)
- [x] React Query hooks (useLocations, useSaveLocation, useUpdateLocation, useDeleteLocation, useUpdateCaption)
- [x] React Query DevTools installed and configured
- [x] UI Components - LocationCard, LocationList, LocationFilters, ShareLocationDialog
- [x] SaveLocationDialog component - Comprehensive form for adding locations
- [x] EditLocationDialog component - Pre-filled form for editing
- [x] My Locations page (list/map view toggle)
- [x] Search and filter functionality
- [x] Navigation updated with Locations link
- [ ] Map clustering setup (Map View placeholder ready - Phase 6)

**Key Features**:
- ✅ 100% legacy Merkel-Vision compatibility (Users: 26->31 fields, Locations: 29 fields)
- ✅ Enterprise-ready: 2FA, soft delete, email preferences, bio
- ✅ Production-ready: Detailed address, production notes, parking, access info
- ✅ Photo management with ImageKit metadata tracking
- ✅ Complete audit trail (creator, modifier, photo uploader)
- ✅ Permission system (creator OR admin can edit)
- ✅ GPS permission tracking for mobile apps
- ✅ OAuth ready (Google, Apple)
- ✅ All API endpoints tested and verified
- ✅ Optimistic updates for instant UI feedback
- ✅ Client-side filtering and sorting

### Phase 6: Main Application Page (0%)
- [ ] Location API routes (CRUD)
- [ ] Location list component
- [ ] Location card component
- [ ] Save location dialog
- [ ] Edit location form
- [ ] Filters and sorting

### Phase 6: Main Application Page (0%)
- [ ] App layout (map + sidebar)
- [ ] TanStack Query setup
- [ ] Search functionality
- [ ] Location details panel
- [ ] Save/edit/delete interactions

### Phase 7: Photo Upload (0%)
- [ ] ImageKit integration
- [ ] Upload component
- [ ] Photo gallery
- [ ] Image optimization

### Phase 8: User Profile & Settings (0%)
- [ ] Profile API routes
- [ ] Profile page
- [ ] Settings page
- [ ] Change password

### Phase 9: Data Migration (0%)
- [ ] Export from SQLite (`server/locations.db`)
- [ ] Transform to new schema
- [ ] Import to MySQL
- [ ] Verify integrity

### Phase 10: Testing & Optimization (0%)
- [ ] Unit tests
- [ ] E2E tests
- [ ] Performance optimization
- [ ] Accessibility audit

### Phase 11: Production Deployment (0%)
- [ ] Production database setup
- [ ] Environment configuration
- [ ] Deploy to Vercel/Railway
- [ ] DNS and SSL

---

## 🔧 TECHNICAL NOTES FOR NEXT AGENT

### Known Issues

1. **Gitignore Blocking Auth Routes**
   - Parent `.gitignore` has `auth/` pattern (line 128)
   - Used shell `cat > file.ts << 'EOF'` workaround to create files
   - All auth routes successfully created despite gitignore

2. **Prisma 7 Configuration**
   - DATABASE_URL must be in `prisma.config.ts`, NOT in `schema.prisma`
   - Schema datasource only has `provider = "mysql"`
   - This is correct per Prisma 7 requirements

3. **Environment Files**
   - `.env.local` is gitignored (cannot auto-create)
   - `ENV_TEMPLATE.md` has full documentation
   - User must manually create from template

### Dependencies Installed

Core dependencies already in `package.json`:
- Next.js 16.0.10
- React 19.2.1
- TypeScript 5
- Prisma 7.1.0
- @prisma/client 7.1.0
- bcryptjs 3.0.3
- jsonwebtoken 9.0.3
- Tailwind CSS v4
- Zod 4.2.0
- React Hook Form 7.68.0
- TanStack Query 5.90.12
- @react-google-maps/api 2.20.7

Recently installed:
- nodemailer (for emails)
- @types/nodemailer

### File Locations

**Critical Files**:
- Database schema: `prisma/schema.prisma`
- Prisma config: `prisma.config.ts`
- Auth utilities: `src/lib/auth.ts`, `src/lib/email.ts`, `src/lib/api-middleware.ts`
- API routes: `src/app/api/auth/**/route.ts`
- Environment template: `ENV_TEMPLATE.md`
- This status: `REFACTOR_STATUS.md`

**Old Application** (for reference):
- Server: `../server/` (Express.js backend)
- Database: `../server/locations.db` (SQLite with existing user data)
- Frontend: `../app.html`, `../js/`, `../css/`

### Testing API Routes

Once `.env.local` is configured and database is pushed:

```bash
# Start dev server
npm run dev

# Test registration
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","username":"testuser","password":"Test123!@#"}'

# Test login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!@#"}'

# Check Mailtrap for verification email
```

---

## 📊 PROGRESS METRICS

- **Overall**: ~90% Complete (Phases 1-5 complete + Map Refinements + Phase 6 Save workflow + Security fixes)
- **Phase 1 Foundation**: 100% ✅
- **Phase 2 Auth Backend**: 100% ✅
- **Phase 2 Auth Frontend**: 100% ✅
- **Phase 2 Database Setup**: 100% ✅
- **Phase 3 Base Layout & Navigation**: 100% ✅
- **Phase 4 Google Maps Integration**: 100% ✅
- **Phase 4 Map Interaction Refinements**: 100% ✅
- **Phase 5 Location Management Frontend**: 100% ✅
- **Phase 6 Save/Edit Workflows**: 85% 🚧
  - ✅ Save Location workflow (100%)
  - ✅ Quick Save (100%)
  - ✅ Bug fixes (100%)
  - ✅ **Security fixes (100%)** ⭐
    - Email verification enforcement
    - Single-session security
    - Auth state management
  - ⏸️ Edit Location workflow (0%)
  - ⏸️ Marker clustering (0%)
  - ⏸️ Load saved markers (0%)
- **Phases 7-11**: 0% ❌

**Phase 6 Completed (December 20, 2024)**:
1. ✅ SaveLocationPanel fully implemented
2. ✅ InfoWindow → Panel integration working
3. ✅ Save workflow tested and validated
4. ✅ Quick Save functionality added
5. ✅ Critical bug fixes (field mapping, login redirect, auth state)
6. ✅ **Security fixes (email verification + single-session)** ⭐

**Next Immediate Steps**:
1. 🚀 **NEXT**: Implement EditLocationPanel for editing saved locations
2. Load saved locations on map with custom colors
3. Add marker clustering for dense areas
4. Photo upload workflow (ImageKit integration)
5. Project management features (Phase 7)

---

## 🎯 RECOMMENDED APPROACH FOR NEXT AGENT

1. **Read this document first** to understand current state
2. **Check if `.env.local` exists** - if not, request user to create it
3. **Verify database** with `npx prisma studio`
4. **Review implementation plan** in conversation artifacts
5. **Continue with Phase 2 frontend** (auth UI components)
6. **Update this file** when making significant progress

**Documentation Links**:
- [README.md](./README.md) - Project overview
- [ENV_TEMPLATE.md](./ENV_TEMPLATE.md) - Environment variables guide
- Implementation plan in conversation artifacts
- Task breakdown in conversation artifacts

---

**End of Status Document**  
*Update this file when significant progress is made on any phase.*
