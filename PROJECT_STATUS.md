# Merkel Vision - Project Status

**Last Updated**: 2026-01-03  
**Production URL**: https://merkelvision.com  
**Status**: ✅ Live in Production

## Current State

Merkel Vision is a location discovery and sharing platform built with Next.js 16, PostgreSQL (Neon), and ImageKit CDN. Users can search for locations, save them with photos and personal notes, and manage their collection through a responsive map interface.

### Technology Stack

- **Framework**: Next.js 16.0.10 (App Router, React 19, TypeScript)
- **Database**: PostgreSQL (Neon Cloud)
  - Production: `ep-cool-star-a4dyxqi4`
  - Development: `ep-solitary-waterfall-a4yhnlsh`
- **ORM**: Prisma 6.19.1
- **CDN**: ImageKit (photo storage)
- **Authentication**: NextAuth.js with JWT
- **Deployment**: Vercel
- **Monitoring**: Sentry (error tracking)

### Core Features (Deployed)

✅ **User Authentication**
- Email/password registration and login
- Email verification flow
- Password reset functionality
- JWT-based session management

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

✅ **Map Interface**
- Interactive Google Maps display
- Custom markers for saved locations
- Saved locations panel with filtering
- GPS location support (with permission toggle)
- Home location setting

✅ **Admin Features**
- User management dashboard
- Account deletion capability
- User activity overview

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

**Email Verification Improvements** (Not Started)
- [ ] Add timer showing token expiration
- [ ] Implement resend email option
  - Generate new token on resend
  - Limit to 3 resends per 24 hours
  - Require email re-entry + Captcha for resend
  - Improve UX messaging

**Session Management Enhancements** (Not Started)
- [ ] Check email verification before password validation (security)
- [ ] Validate IP address in sessions
- [ ] Limit to 2 active sessions per user
- [ ] Auto-logout oldest session (prefer keeping mobile)
- [ ] Add "active session" detection for auto-logout timing

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

### Documentation

**Completed**:
- ✅ Reorganized 46 historical docs to `/docs/` archive
- ✅ Created `/docs/README.md` index
- ✅ Updated environment setup documentation
- ✅ Avatar system trace documented

**In Progress**:
- 🔄 README.md update (main project documentation)

## Recent Deployments

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

Automatic deployment to Vercel on push to `main` branch.

Manual deployment:
```bash
vercel --prod
```

## Architecture Notes

### Photo Storage
- Flat directory structure (no subdirectories by date)
- Path format: `/{environment}/users/{userId}/photos/{filename}`
- Files stored on ImageKit CDN
- Database stores metadata (locationId, placeId, imagekitFileId, etc.)

### User-Specific Locations
- Each user has their own saved locations (UserSave)
- Same Google Place can be saved by multiple users with different metadata
- UserSave contains: personalRating, caption, isFavorite, locationId, userId
- Location contains: Google Place data (name, address, coordinates, etc.)

### Type System
- **UserSave**: User's personal save with metadata
- **Location**: Actual location data from Google Places
- **LocationData**: Client-side location representation
- **MarkerData**: Map marker visualization data

## Quick References

- **Admin Quick Start**: `ADMIN_QUICK_START.md`
- **Deployment Guide**: `DEPLOYMENT_QUICK_REF.md`
- **Environment Setup**: `ENV_TEMPLATE.md`
- **Phone Verification**: `PHONE_VERIFICATION_GUIDE.md`
- **Photo Testing**: `PHOTO_FEATURE_TESTING_GUIDE.md`
- **Security Features**: `SECURITY_IMPLEMENTATION.md`
- **Avatar System**: `AVATAR_UPLOAD_FLOW.md`
- **Historical Docs**: `/docs/README.md`

---

For historical project phases and detailed implementation logs, see `/docs/planning/REFACTOR_STATUS.md`.
