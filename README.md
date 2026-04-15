# fotolokashen

**Last Updated**: 2026-04-09
**Production**: [fotolokashen.com](https://fotolokashen.com) ✅ Live  
**Status**: Active Development - v2.0.0

This project is a knowledgebase for production management and scouting. We pair specific data pulled from real active productions married to specific useful information about those locations. This dataset can be easily parsed, shared and put into practical use over and over. Locations with Purpose.

USE CASES:

- Micheal needs a space for an interview, it needs to attractive, accessable (for gear being brought in), quiet (zero to few people), inexpensive to free and for about 4 hours. Carrie had used a place for an interview, a resturant in DC. It was quiet between Lunch and dinner and the Owner was open to her crew using the space.
- Bob usually works in the Boston area but is in Arizona. Bonnie from NY needs a live locatoin that says BOSTON but isn't in a busy downtown and had a place to Park a Truck for the Live Anchor Position.

In these scenarios Had Bob and Carrie collected their location knowledge this can easily be shared with fotolokashen to colleauges in need. Searching and Details, including contact info is shared.

You will find photos of the location, exact GPS and Address, Descriptions of the space, local contacts, info on parking. All in one location - Fotolokashen.

- How did this project arise? Many years ago a photographer David Rust collected details about places he had been, and he had been about everywhere. Resturants, Hotels, Shops - shooting locations, productions, how to get in and out of specific spots.

- Some years later a couple of Producers in Atlanta tried, and I think did, make an app to help our field teams, event planners collect their experiences in one place. However I know it was released but from there ...

- In April of 2025 a Manager in DC sent an email to Field Production about the 50 State PJ Guide, this was built on MicroSoft Share Point. Essentially software designed "for document management, secure file storage, team collaboration, and building intranet portals. It enables users to create customizable sites to share information, automate workflows, and co-author documents in real-time, functioning as a centralized hub for organizational content. - Microsoft Support

- The issue? No one uses it. It is not used for any of the above tasks in field production.
- On a good day it takes 2 login's to get to sharepoint. Its great for people only working at desks.

- So the Guide ? It was last updated 1 month prior to our Team email. When I tried to look through it I nearly deleted some of the pictures in a location.
- issue > too many people are allowed to edit, but then updating becomes harder since fewer people can moderate content.
- It was a good idea, with the wrong software and access to the people who needed to use it.

- Fotolokashen can be used on the fly on your phone. It can place you on a map and show you the locations around you we have collected and what to exspect there. Go to a courthouse - here are the bathrooms and resturants in 2 blocks that have bathrooms. WE all need a bathroom at somepoint.

- Future features: Assignments, Project Managment and Workspaces - Readable Useful Emails, Slack integration, Calendars. This will allow us better access and share team data, team planning, including budgeting, keeping hours and producing reports and sharing this across the company.

## 🚀 Technology Stack

### Core

- **Framework**: Next.js 16.1.6 (App Router, React 19.2.1, TypeScript 5)
- **Database**: PostgreSQL (Neon Cloud)
- **ORM**: Prisma 6.19.1
- **CDN**: ImageKit (photo storage)
- **Deployment**: Vercel
- **Authentication**: Custom JWT-based authentication
- **Monitoring**: Vercel Speed Insights, Sentry

### Frontend

- **Styling**: Tailwind CSS v4
- **Components**: shadcn/ui + Radix UI primitives
- **Maps**: Google Maps JavaScript API with @react-google-maps/api
- **State Management**: TanStack Query (React Query)
- **Forms**: React Hook Form + Zod validation
- **Onboarding**: React Joyride (guided tours)

### Backend & Infrastructure

- **API**: Next.js API Routes
- **Email**: Resend API with custom HTML templates
- **Image Processing**: Sharp (server-side conversion/compression)
- **Security**: DOMPurify (XSS protection), bcrypt (password hashing), ClamAV (virus scanning)
- **AI**: OpenAI API (description improvements, tag suggestions)

## 📋 Prerequisites

- Node.js 18+ and npm
- PostgreSQL database (we use Neon Cloud)
- Google Maps API Key
- ImageKit account (for photo uploads)
- Resend account (for transactional emails)
- **ClamAV** (for virus scanning) - Required for production, can be disabled for local development

## 🛠️ Getting Started

### 1. Clone and Install

```bash
git clone <repository-url>
cd fotolokashen
npm install
```

### 2. Install ClamAV (Required for Production)

ClamAV provides virus scanning for all uploaded files. All 5 upload entry points (Avatar, Banner, Save Location, Edit Location, Create-with-Photo) use server-side virus scanning.

**macOS:**

```bash
brew install clamav
brew services start clamav
```

**Linux (Ubuntu/Debian):**

```bash
sudo apt install clamav clamav-daemon
sudo systemctl start clamav-daemon
```

**To disable virus scanning** (local development only):

```bash
# Add to .env.local - NOT for production
DISABLE_VIRUS_SCAN="true"
```

### 3. Environment Setup

Create a `.env.local` file in the root directory:

```bash
# Database
DATABASE_URL="postgresql://..."

# Authentication
JWT_SECRET="your-secret-key-min-32-chars"

# Google Maps
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="your-google-maps-key"

# ImageKit CDN
NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY="your-public-key"
IMAGEKIT_PRIVATE_KEY="your-private-key"
IMAGEKIT_URL_ENDPOINT="https://ik.imagekit.io/your-id"

# Email (Resend)
RESEND_API_KEY="re_..."
EMAIL_FROM="noreply@yourdomain.com"

# App URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Optional: ClamAV
CLAMAV_HOST="localhost"
CLAMAV_PORT="3310"
```

### 4. Database Setup

```bash
# Generate Prisma Client
npm run db:generate

# Push schema to database (development)
npm run db:push

# OR run migrations (production)
npm run db:migrate
```

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
fotolokashen/
├── prisma/
│   └── schema.prisma          # Database schema
├── public/                     # Static assets
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API routes (standardized error/success patterns)
│   │   ├── map/               # Main map interface (decomposed into modules)
│   │   │   ├── page.tsx       # Map page (~800 lines, down from ~1,650)
│   │   │   ├── types.ts       # Shared map type definitions
│   │   │   ├── useMapMarkers.ts    # Marker creation & clustering
│   │   │   ├── useMapNavigation.ts # GPS, bounds, camera movement
│   │   │   ├── useGpsHandlers.ts   # GPS toggle & location tracking
│   │   │   └── MapInfoWindowContent.tsx # Info window component
│   │   ├── locations/         # Locations management
│   │   ├── search/            # User search/people page
│   │   ├── profile/           # User profile settings
│   │   ├── admin/             # Admin dashboard
│   │   └── [username]/        # Public user profiles
│   ├── components/            # React components
│   │   ├── auth/              # Authentication components
│   │   ├── locations/         # Location management
│   │   │   ├── TagInput.tsx   # Shared tag input with validation & AI suggestions
│   │   │   └── UnsavedChangesBanner.tsx # Reusable unsaved changes banner
│   │   ├── maps/              # Google Maps components
│   │   ├── onboarding/        # Tour providers
│   │   ├── panels/            # Side panels (Save, Edit, Detail)
│   │   └── ui/                # shadcn/ui components
│   ├── hooks/                 # Custom React hooks
│   ├── lib/                   # Utilities and libraries
│   │   ├── constants/messages.ts  # Centralized toast message catalog
│   │   └── __tests__/         # Unit tests (vitest)
│   └── types/                 # TypeScript definitions
├── docs/                       # Documentation
│   └── CODEBASE_REVIEW_PLAN.md # 6-phase review plan (all complete)
├── scripts/                    # Utility scripts
├── PROJECT_STATUS.md          # Current status & priorities
└── README.md                  # This file
```

## ✨ Key Features

### Authentication & Security

- Email/password registration with email verification
- Password reset with rate limiting
- JWT-based session management (7-day default, 30-day with "remember me")
- Multi-device session support (web + iOS)
- Account lockout after failed attempts
- ClamAV virus scanning for all uploads

### Location Management

- Google Maps integration with Places Autocomplete
- User-specific saved locations with personal ratings, captions, and tags
- Production date tracking for filming/shoots
- Favorite marking and categorization
- Indoor/outdoor classification
- AI-powered description improvements
- AI tag suggestions

### Photo System

- Multiple photos per location
- ImageKit CDN storage with flat directory structure
- Server-side HEIC/TIFF to JPEG conversion
- EXIF data extraction (GPS, camera info)
- Browser-side format conversion for previews

### Social Features

- Follow/unfollow users
- Public user profiles with saved locations
- User search with autocomplete
- Privacy controls (public, followers-only, private)

### Onboarding System

- Mandatory Terms of Service acceptance
- Guided tours for Map, Locations, and People pages
- Per-page completion tracking

### Support System

- Public support form with human verification
- Member support form (authenticated)
- Rate limiting and email notifications

### Admin Features

- User management dashboard
- Email template editor with live preview
- Device size simulation (desktop/tablet/mobile)
- Template duplication

## 🔒 Security Features

- **Authentication**: Custom JWT with secure httpOnly cookies
- **Password Security**: bcrypt hashing (10 rounds)
- **Email Verification**: Required, 30-minute token expiration
- **Rate Limiting**: Password reset (2/15min, 3/hour), Login attempts (lockout)
- **Virus Scanning**: ClamAV integration for all file uploads
- **XSS Protection**: DOMPurify sanitization
- **SQL Injection**: Prisma ORM with parameterized queries
- **Input Validation**: Zod schemas with centralized config

## 🔧 Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run db:generate  # Generate Prisma Client
npm run db:push      # Push schema to database
npm run db:migrate   # Run database migrations
npm run db:studio    # Open Prisma Studio
npm run db:seed      # Seed database with templates
```

## 📚 Documentation

- **[PROJECT_STATUS.md](./PROJECT_STATUS.md)** - Current status, priorities, and recent updates
- **[docs/CODEBASE_REVIEW_PLAN.md](./docs/CODEBASE_REVIEW_PLAN.md)** - 6-phase codebase review plan (all phases complete)
- **[docs/](./docs/)** - Complete documentation archive
  - `api/` - API documentation (Follow System, Search System, Mobile API Schemas)
  - `features/` - Feature specifications
  - `guides/` - Development guides
  - `deployment/` - Deployment documentation
  - `user-guides/` - End-user documentation

## 🚀 Deployment

The application is deployed to Vercel at [fotolokashen.com](https://fotolokashen.com).

### Automatic Deployment

- Push to `main` branch triggers automatic deployment
- Environment variables configured in Vercel dashboard

### Manual Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to production
vercel --prod

# Preview deployment
npx vercel
```

## 🔗 Useful Links

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [shadcn/ui Documentation](https://ui.shadcn.com)
- [Google Maps API Documentation](https://developers.google.com/maps/documentation)
- [TanStack Query Documentation](https://tanstack.com/query/latest)
- [ImageKit Documentation](https://docs.imagekit.io)

---

Built with ❤️ using Next.js, PostgreSQL, and modern web technologies.
