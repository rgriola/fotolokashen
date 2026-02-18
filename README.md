# fotolokashen

**Last Updated**: 2026-02-18
**Production**: [fotolokashen.com](https://fotolokashen.com) ✅ Live  
**Status**: Active Development - v2.0.0

A modern location discovery and sharing platform where users can search, save, and organize places with photos, personal ratings, and notes. Built with Next.js 16, PostgreSQL, and ImageKit CDN.

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
│   │   ├── api/               # API routes
│   │   ├── map/               # Main map interface
│   │   ├── locations/         # Locations management
│   │   ├── search/            # User search/people page
│   │   ├── profile/           # User profile settings
│   │   ├── admin/             # Admin dashboard
│   │   └── [username]/        # Public user profiles
│   ├── components/            # React components
│   │   ├── auth/              # Authentication components
│   │   ├── locations/         # Location management
│   │   ├── maps/              # Google Maps components
│   │   ├── onboarding/        # Tour providers
│   │   ├── panels/            # Side panels (Save, Edit, Detail)
│   │   └── ui/                # shadcn/ui components
│   ├── hooks/                 # Custom React hooks
│   ├── lib/                   # Utilities and libraries
│   └── types/                 # TypeScript definitions
├── docs/                       # Documentation
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
- **[docs/](./docs/)** - Complete documentation archive
  - `api/` - API documentation (Follow System, Search System)
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
