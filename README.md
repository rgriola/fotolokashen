# Google Maps Search Application - Refactor

**Last Updated**: 2025-12-22 09:23:00 EST  
**Status**: Phase 6 (88% Complete) - Save/Edit Workflows & Security Hardening  
**Overall Progress**: ~92% Complete

A modern, scalable Google Maps search application built with Next.js, React, TypeScript, and MySQL. This is a complete refactor of the original vanilla JavaScript application with improved architecture, enterprise-grade security, mobile responsiveness, and developer experience.

## 🚀 Technology Stack

### Frontend
- **Framework**: Next.js 16 (App Router)
- **UI Library**: React 19
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS v4
- **Components**: shadcn/ui
- **Maps**: Google Maps JavaScript API with @react-google-maps/api
- **State Management**: TanStack Query (React Query)
- **Forms**: React Hook Form + Zod validation
- **Security**: DOMPurify (XSS protection)

### Backend
- **Runtime**: Node.js
- **API**: Next.js API Routes
- **Database**: MySQL 8.0+
- **ORM**: Prisma 6.19.1
- **Authentication**: JWT + bcrypt with session validation
- **Email**: Nodemailer with Mailtrap (development)
- **File Uploads**: ImageKit (ready for integration)

## 📋 Prerequisites

- Node.js 18+ and npm
- MySQL 8.0+ (local or cloud instance)
- Google Maps API Key
- SMTP server for email (Mailtrap for development)
- ImageKit account (optional, for photo uploads)

## 🛠️ Getting Started

### 1. Clone and Install

```bash
# Navigate to the project directory
cd google-search-me-refactor

# Install dependencies
npm install
```

### 2. Environment Setup

Copy the environment template and configure your variables:

```bash
# See ENV_TEMPLATE.md for complete configuration guide
# Create your .env.local file with your actual values
```

Required environment variables:
- `DATABASE_URL` - MySQL connection string
- `JWT_SECRET` - Secret key for JWT tokens (min 32 characters)
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` - Google Maps API key
- `NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY` - ImageKit public key
- `IMAGEKIT_PRIVATE_KEY` - ImageKit private key
- `IMAGEKIT_URL_ENDPOINT` - ImageKit URL endpoint
- SMTP settings for email (Mailtrap credentials)

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

## 🎨 Current Features

### ✅ Fully Implemented (Phases 1-5)

**Phase 1: Foundation**
- ✅ Next.js 16.0.10 with App Router
- ✅ TypeScript 5 configuration
- ✅ Tailwind CSS v4 with PostCSS
- ✅ shadcn/ui component library
- ✅ Prisma ORM with MySQL

**Phase 2: Authentication System**
- ✅ User registration with email verification
- ✅ Secure login with JWT tokens
- ✅ Password reset functionality
- ✅ Email verification with resend capability
- ✅ Session management with database validation
- ✅ Single active session per user enforcement
- ✅ Route protection (ProtectedRoute component)
- ✅ Admin route guard (AdminRoute component)

**Phase 3: Google Maps Integration**
- ✅ Google Maps JavaScript API integration
- ✅ Interactive map with search
- ✅ Places Autocomplete
- ✅ Geocoding and reverse geocoding
- ✅ User location detection (GPS)
- ✅ Custom markers with InfoWindows
- ✅ Click-to-save locations

**Phase 4: Location Management API**
- ✅ RESTful API for locations
- ✅ Save locations with metadata
- ✅ Update location details
- ✅ Delete locations
- ✅ List user's saved locations
- ✅ Input sanitization (XSS protection)
- ✅ Validation with centralized config

**Phase 5: Location UI Components**
- ✅ Location list/grid views
- ✅ Filtering and sorting
- ✅ Search functionality
- ✅ Share location dialog
- ✅ Edit location dialog
- ✅ Delete confirmation

### 🚧 Phase 6: In Progress (88% Complete)

**Save/Edit Workflows**
- ✅ SaveLocationPanel with right sidebar
- ✅ Quick save from map InfoWindow
- ✅ Form validation with character counters
- ✅ Tag management
- ⏸️ Photo upload UI (backend ready)
- ⏸️ EditLocationPanel enhancements
- ⏸️ Marker clustering
- ⏸️ Load saved markers on map

**Security Enhancements** (Completed December 21, 2024)
- ✅ **Critical**: Session validation against database on every request
- ✅ **Critical**: Auth context caching disabled (staleTime: 0)
- ✅ XSS protection with DOMPurify sanitization
- ✅ Centralized validation config (easy adjustment)
- ✅ Max length validation on all inputs
- ✅ Tag count/length limits
- ✅ Route protection for all authenticated pages
- ✅ Detailed error logging for debugging

**UX Improvements** (Completed December 21, 2024)
- ✅ Context-aware navigation (changes based on auth status)
- ✅ Logo redirects to map when authenticated
- ✅ Footer hidden for authenticated users (max screen space)
- ✅ Smooth authentication flow with proper redirects

### 📋 Upcoming Phases (Planned)

**Phase 7: Photo Upload**
- ImageKit integration
- Multiple photos per location
- Photo management UI

**Phase 8: Admin Dashboard**
- User management
- Location moderation
- Analytics

**Phase 9: Database Migration**
- Legacy SQLite → MySQL migration scripts
- Data validation and integrity checks

**Phase 10: Testing & Optimization**
- Unit and integration tests
- Performance optimization
- SEO improvements

**Phase 11: Production Deployment**
- CI/CD pipeline
- Production environment setup
- Monitoring and logging

## � Security Features

This application implements enterprise-grade security:

- **Authentication**: JWT tokens with secure httpOnly cookies
- **Session Management**: Database-validated sessions, single-session enforcement
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
npm run db:generate  $ Generate Prisma Client
npm run db:push      # Push schema to database (development)
npm run db:migrate   # Run database migrations (production)
npm run db:studio    # Open Prisma Studio (database GUI)
```

## 🌐 Deployment

### Database Options
- **PlanetScale** - Free tier available, serverless MySQL
- **Railway** - $5/month, includes MySQL + hosting
- **AWS RDS** - Scalable, production-ready
- **Digital Ocean** - Managed MySQL databases

### Hosting Options
- **Vercel** - Recommended for Next.js (free tier available)
- **Railway** - Full-stack hosting with database
- **Render** - Current platform for legacy app
- **AWS** - Enterprise deployment

### Environment Variables for Production

Ensure all production environment variables are securely configured:
- Use strong JWT_SECRET (min 32 characters)
- Enable HTTPS/SSL for DATABASE_URL
- Use production SMTP credentials
- Configure proper CORS settings
- Set secure cookie settings

## 📝 Development Guidelines

### Code Style
- TypeScript strict mode enabled
- ESLint with Next.js recommended config
- Prettier for code formatting (via IDE)
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

## 🤝 Contributing

This is a refactor project. Key improvements over the original:

| Aspect | Old App | New App |
|--------|---------|---------|
| **Lines of CSS** | 27,000+ | Component-based (Tailwind) |
| **HTML Files** | 105 | Single Page Application |
| **Database** | SQLite | MySQL (production-ready) |
| **Language** | Vanilla JavaScript | TypeScript (type-safe) |
| **Framework** | None | Next.js 16 (App Router) |
| **Security** | Basic | Enterprise-grade |
| **Testing** | None | Planned comprehensive suite |
| **Mobile** | Limited | Fully responsive |

## 📊 Project Stats

- **Overall Progress**: ~92% Complete
- **Current Phase**: Phase 6 of 11
- **Tables**: 9 (128 total fields)
- **API Routes**: 15+ endpoints
- **Components**: 40+ React components
- **Lines of Code**: ~15,000+ (TypeScript)
- **Dependencies**: 50+ packages

## 📄 License

Private project

## 🔗 Useful Links

- [Project Status (Detailed)](./REFACTOR_STATUS.md)
- [Environment Setup Guide](./ENV_TEMPLATE.md)
- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [shadcn/ui Documentation](https://ui.shadcn.com)
- [Google Maps API Documentation](https://developers.google.com/maps/documentation)
- [React Query Documentation](https://tanstack.com/query/latest)

---

**For detailed phase-by-phase progress and implementation notes, see [REFACTOR_STATUS.md](./REFACTOR_STATUS.md)**
