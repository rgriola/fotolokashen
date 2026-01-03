# Merkel Vision

**Last Updated**: 2026-01-03  
**Production**: [merkelvision.com](https://merkelvision.com) ✅ Live  
**Status**: Active Development

A modern location discovery and sharing platform where users can search, save, and organize places with photos, personal ratings, and notes. Built with Next.js 16, PostgreSQL, and ImageKit CDN.

## 🚀 Technology Stack

### Core

- **Framework**: Next.js 16.0.10 (App Router, React 19, TypeScript 5)
- **Database**: PostgreSQL (Neon Cloud)
- **ORM**: Prisma 6.19.1 - ORM (Object-Relational Mapping)
- **CDN**: ImageKit (photo storage)
- **Deployment**: Vercel
- **Authentication**: NextAuth.js with JWT

### Frontend

- **Styling**: Tailwind CSS v4
- **Components**: shadcn/ui
- **Maps**: Google Maps JavaScript API with @react-google-maps/api
- **State Management**: TanStack Query (React Query)
- **Forms**: React Hook Form + Zod validation

### Backend & Infrastructure

- **API**: Next.js API Routes
- **Email**: Resend
- **Monitoring**: Sentry (error tracking)
- **Security**: DOMPurify (XSS protection), bcrypt (password hashing)

## 📋 Prerequisites

- Node.js 18+ and npm
- PostgreSQL database (we use Neon Cloud)
- Google Maps API Key
- ImageKit account (for photo uploads)
- Resend account (for transactional emails)

## 🛠️ Getting Started

### 1. Clone and Install

```bash
# Navigate to the project directory
cd google-search-me-refactor

# Install dependencies
npm install
```

### 2. Environment Setup

Create a `.env.local` file in the root directory (this is the ONLY environment file used for local development):

```bash
# See ENV_TEMPLATE.md for complete configuration guide
cp ENV_TEMPLATE.md .env.local
# Edit .env.local with your actual values
```

Required environment variables:

- `DATABASE_URL` - PostgreSQL connection string (Neon)
- `JWT_SECRET` - Secret key for JWT tokens (min 32 characters)
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` - Google Maps API key
- `NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY` - ImageKit public key
- `IMAGEKIT_PRIVATE_KEY` - ImageKit private key
- `IMAGEKIT_URL_ENDPOINT` - ImageKit URL endpoint
- `EMAIL_SERVER_*` - Resend API configuration

See [ENV_TEMPLATE.md](./ENV_TEMPLATE.md) for detailed configuration instructions.

### 3. Database Setup

```bash
# Generate Prisma Client
npm run db:generate

# Push schema to database (for development)
npm run db:push

# OR run migrations (for production)
npm run db:migrate
```

### 4. Run Development Server

```bash
# Start the development server
npm run dev

# In a separate terminal, open Prisma Studio (optional)
npm run db:studio
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```

google-search-me-refactor/
├── prisma/
│   └── schema.prisma          # Database schema (9 tables, 128 fields)
├── public/                     # Static assets
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API routes (auth, locations, etc.)
│   │   ├── map/               # Map page (protected)
│   │   ├── locations/         # Locations page (protected)
│   │   ├── login/             # Login page
│   │   ├── register/          # Registration page
│   │   └── verify-email/      # Email verification page
│   ├── components/            # React components
│   │   ├── auth/              # Auth components (ProtectedRoute, AdminRoute, etc.)
│   │   ├── locations/         # Location management components
│   │   ├── maps/              # Map components (GoogleMap, markers, etc.)
│   │   ├── panels/            # SaveLocationPanel, EditLocationPanel
│   │   ├── layout/            # Header, Footer, Navigation
│   │   └── ui/                # shadcn/ui components
│   ├── hooks/                 # Custom React hooks (useAuth, useSaveLocation, etc.)
│   ├── lib/                   # Utilities and libraries
│   │   ├── auth.ts            # JWT token generation/verification
│   │   ├── auth-context.tsx   # Authentication context provider
│   │   ├── api-middleware.ts  # API utilities (requireAuth, session validation)
│   │   ├── sanitize.ts        # XSS protection utilities
│   │   ├── validation-config.ts # Centralized validation rules
│   │   ├── prisma.ts          # Prisma client singleton
│   │   └── utils.ts           # Utility functions
│   └── types/                 # TypeScript type definitions
├── ENV_TEMPLATE.md            # Environment configuration guide
├── REFACTOR_STATUS.md         # Detailed project status (updated frequently)
└── package.json
```

## 🗄️ Database Schema

The application uses **9 interconnected tables** with **128 total fields**:

### Core Tables

- **users** (31 fields) - User accounts with authentication, profile, OAuth, 2FA, GPS permissions
- **locations** (31 fields) - Saved Google Maps locations with production details
- **user_saves** (10 fields) - Many-to-many with tags, favorites, ratings, colors
- **sessions** (13 fields) - Secure session management with device tracking
- **photos** (13 fields) - ImageKit integration for location photos

### Production Tables

- **projects** (11 fields) - Campaign/shoot organization
- **project_locations** (6 fields) - Many-to-many for shoots
- **location_contacts** (8 fields) - Property managers, owners
- **team_members** (5 fields) - Crew collaboration

> **Note**: Schema significantly enhanced beyond legacy Merkel-Vision database with enterprise features while maintaining backward compatibility.

## � Key Features

### Authentication & User Management

- ✅ Email/password registration and login
- ✅ Email verification with token system
- ✅ Password reset functionality
- ✅ JWT-based session management
- ✅ Admin dashboard for user management
- ✅ User account deletion

### Location Discovery & Management

- ✅ Google Maps integration with interactive search
- ✅ Places Autocomplete for quick location finding
- ✅ User-specific saved locations (each user has their own saves)
- ✅ Personal ratings and captions for each location
- ✅ Favorite marking
- ✅ Location categories
- ✅ GPS location support with permission toggle
- ✅ Home location setting

### Photo Management

- ✅ Multiple photos per location
- ✅ ImageKit CDN integration
- ✅ Flat directory structure for scalability
- ✅ Photo viewer with lightbox
- ✅ Automatic photo metadata storage

### Map Interface

- ✅ Interactive Google Maps display
- ✅ Custom markers for saved locations
- ✅ Saved locations panel with filtering/sorting
- ✅ Quick save from map InfoWindow
- ✅ Mobile-responsive map controls

### Security & Performance

- ✅ XSS protection with DOMPurify
- ✅ Input validation and sanitization
- ✅ Session validation on every request
- ✅ Sentry error tracking
- ✅ TanStack Query for optimized data fetching

## 🔒 Security Features

This application implements enterprise-grade security:

- **Authentication**: JWT tokens with secure httpOnly cookies
- **Session Management**: Database-validated sessions
- **Password Security**: bcrypt hashing (10 rounds)
- **Email Verification**: Mandatory before app access
- **XSS Protection**: DOMPurify sanitization on all user inputs
- **SQL Injection**: Prisma ORM with parameterized queries
- **Route Protection**: Client-side guards for authenticated pages
- **Input Validation**: Centralized config with max lengths
- **CSRF Protection**: SameSite cookie attribute
- **Rate Limiting**: Email verification (3 per hour)

## 🔧 Available Scripts

```bash
npm run dev          # Start development server (http://localhost:3000)
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run db:generate  # Generate Prisma Client (uses .env.local)
npm run db:push      # Push schema to database (uses .env.local)
npm run db:migrate   # Run database migrations (uses .env.local)
npm run db:studio    # Open Prisma Studio (uses .env.local)
```

**Note**: All Prisma scripts automatically use `.env.local` via `dotenv-cli`.

## 📝 Development Guidelines

### Code Style

- TypeScript strict mode enabled
- ESLint with Next.js recommended config
- Prettier for code formatting
- Tailwind CSS for styling (utility-first)

### Database Conventions

- Snake_case for database column names
- CamelCase for TypeScript/JavaScript
- Soft deletes using `deletedAt` field
- Timestamps on all tables (createdAt, updatedAt)

### API Conventions

- RESTful endpoints
- Standard HTTP status codes
- Consistent error response format
- Authentication via requireAuth middleware
- Input sanitization before storage

## 📚 Documentation

- **[PROJECT_STATUS.md](./PROJECT_STATUS.md)** - Current project status and priorities
- **[DEPLOYMENT_QUICK_REF.md](./DEPLOYMENT_QUICK_REF.md)** - Deployment guide
- **[ENV_TEMPLATE.md](./ENV_TEMPLATE.md)** - Environment variable reference
- **[ADMIN_QUICK_START.md](./ADMIN_QUICK_START.md)** - Admin features guide
- **[PHONE_VERIFICATION_GUIDE.md](./PHONE_VERIFICATION_GUIDE.md)** - Phone verification setup
- **[SECURITY_IMPLEMENTATION.md](./SECURITY_IMPLEMENTATION.md)** - Security features
- **[AVATAR_UPLOAD_FLOW.md](./AVATAR_UPLOAD_FLOW.md)** - Avatar system documentation
- **[/docs/](./docs/)** - Historical documentation archive

## 🚀 Deployment

The application is deployed to Vercel at [merkelvision.com](https://merkelvision.com).

### Automatic Deployment

- Push to `main` branch triggers automatic deployment
- Environment variables configured in Vercel dashboard
- Production database: Neon PostgreSQL

### Manual Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to production
vercel --prod
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
