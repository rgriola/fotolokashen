# Copilot Instructions for fotolokashen

You are assisting with the **fotolokashen** project, this platform allows professoinals in media production, photographers, producers, directors to share a locations and location features with other professionals.

## Tech Stack

- **Framework**: Next.js 16.1.6 (App Router), React 19.2.1, TypeScript 5
- **Database**: PostgreSQL (Neon Cloud) with Prisma 6.19.1 ORM
- **Styling**: Tailwind CSS v4, shadcn/ui components
- **APIs**: Google Maps JavaScript API, ImageKit CDN, Resend (email), OpenAI (AI features)
- **State**: TanStack Query (React Query)
- **Auth**: Custom JWT-based authentication
- **Image Processing**: Sharp (server-side HEIC/TIFF conversion)
- **Security**: ClamAV (virus scanning), DOMPurify (XSS protection)
- **Monitoring**: Vercel Speed Insights
- **lingo**: when the user or you are refering to iOS this is the /fotolokashen-ios directory. The web app (/fotolokashen) is the source of truth and backbone for all features. The iOS app selectively integrates features from the web app, but all core functionality is built and tested on the web first.

## Key Principles

### 1. Type Safety

- Always use TypeScript strict mode
- Leverage Prisma-generated types
- Use Zod for runtime validation

### 2. Security First

- **Sanitize all user inputs**: Use `sanitizeInput()` from `/src/lib/sanitize.ts`
- **Scan uploaded files**: Use `scanFile()` from `/src/lib/virus-scan.ts` before processing
- **Protect routes**: Use `requireAuth` middleware for all protected API routes
- **Validate data**: Use Zod schemas before database operations
- **Never expose passwords**: Return `PublicUser` type, never raw `User`

### 3. Database Conventions

- **Database columns**: `snake_case` (use Prisma `@@map`)
- **TypeScript/JavaScript**: `camelCase`
- **Soft deletes**: Use `deletedAt DateTime?` field
- **Timestamps**: Always include `createdAt` and `updatedAt`

### 4. API Standards

- **RESTful endpoints**: Follow REST conventions
- **HTTP status codes**:
  - 200: Success
  - 201: Created
  - 400: Bad request
  - 401: Unauthorized
  - 403: Forbidden
  - 404: Not found
  - 500: Server error
- **Error responses**: `{ error: "descriptive message" }`
- **Success responses**: `{ data: {...} }` or direct object
- **Mobile API v1**: See `/docs/api/MOBILE_API_SCHEMAS.md` for canonical response structures
  - **CRITICAL**: Always use `lat`/`lng` (NOT `latitude`/`longitude`) for location coordinates
  - All `/api/v1/*` endpoints MUST match documented schemas for iOS compatibility
  - Use explicit `null` for missing optional fields, never omit fields

### 5. UI/UX Standards

- **Mobile-first**: Design for mobile, enhance for desktop
- **Use shadcn/ui**: Components from `/src/components/ui/`
- **Tailwind utility classes**: Avoid custom CSS unless necessary
- **Consistent spacing**: Use Tailwind spacing scale (p-4, m-2, etc.)
- **Image optimization**: Always use Next.js `Image` component, never `<img>` tags
- **Responsive images**: Include `sizes` attribute for proper optimization

### 6. Style Guide (ENFORCED — do not bypass)

#### Color — Semantic Tokens Only

**Never use hardcoded Tailwind color classes** (gray, slate, red, green, amber, yellow, blue, purple, indigo, etc.). Always use the semantic token system:

| Intent                 | Token              | Example classes                   |
| ---------------------- | ------------------ | --------------------------------- |
| Primary text           | `foreground`       | `text-foreground`                 |
| Secondary / muted text | `muted-foreground` | `text-muted-foreground`           |
| Brand / interactive    | `primary`          | `bg-primary text-primary`         |
| Muted background       | `muted`            | `bg-muted`                        |
| Card surface           | `card`             | `bg-card`                         |
| Page background        | `background`       | `bg-background`                   |
| Borders                | `border`           | `border-border`                   |
| Hover / highlight      | `accent`           | `hover:bg-accent`                 |
| Error / delete         | `destructive`      | `text-destructive bg-destructive` |
| Success / confirm      | `success`          | `text-success bg-success`         |
| Warning / caution      | `warning`          | `text-warning bg-warning`         |
| Info / neutral action  | `info`             | `text-info bg-info`               |
| Social / follow/people | `social`           | `text-social bg-social`           |

**Opacity modifiers** are allowed: `bg-destructive/10`, `border-success/20`, `bg-primary/80`.

**Exceptions** (hardcoded colors permitted):

- Inline JS/config objects passed to third-party libs (e.g., React Joyride `primaryColor`)
- The 15 location-type colors in `LocationTypeColors.ts` (these are brand identity, not UI chrome)
- Admin pages (`/src/app/admin/`, `/src/components/admin/`) — separate design audit pending

#### Typography

Base heading and body styles are defined in `globals.css @layer base` — do not re-declare them per-component:

| Element              | Style                               | Use for               |
| -------------------- | ----------------------------------- | --------------------- |
| `h1`                 | `text-2xl font-bold tracking-tight` | Page titles           |
| `h2`                 | `text-xl font-semibold`             | Section headers       |
| `h3`                 | `text-lg font-semibold`             | Sub-sections          |
| `h4`                 | `text-base font-semibold`           | Labels / card headers |
| `p`                  | `text-sm`                           | Body text             |
| `small` / `.caption` | `text-xs text-muted-foreground`     | Metadata, timestamps  |

**Weight rules:**

- `font-bold` → page titles (`h1`) only
- `font-semibold` → section headers and emphasized labels
- `font-medium` → interactive elements (buttons, tabs, nav links)
- `font-normal` → body text, form inputs, descriptions

#### Spacing

- Use the 4px Tailwind grid: `p-1` (4px), `p-2` (8px), `p-4` (16px), etc.
- **No fractional or non-standard values**: avoid `mt-6.25`, `pt-25`, `m-6.938`
- Nearest standard value: round to closest step (`mt-6.25` → `mt-6`, `pt-25` → `pt-24`)

#### 60-30-10 Color Budget

- **60% Neutral** — `background`, `card`, `muted` (page surfaces, panels)
- **30% Primary** — `foreground`, `muted-foreground`, `border` (text, lines, icons)
- **10% Accent** — `primary`, `destructive`, `success`, `warning`, `social` (calls to action, status)

If a page feels "loud", check whether accent colors exceed ~10% of visible surface area.

## Project Structure

```
src/
├── app/
│   ├── api/              # API routes
│   │   ├── auth/         # Authentication endpoints
│   │   ├── locations/    # Location management
│   │   ├── photos/       # Photo uploads
│   │   ├── users/        # User management
│   │   ├── onboarding/   # Tour completion tracking
│   │   └── admin/        # Admin tools
│   ├── map/              # Main map interface
│   ├── locations/        # Locations grid/list page
│   ├── search/           # People search page
│   ├── profile/          # User profile settings
│   ├── create-with-photo/ # Photo-first location creation
│   ├── support/          # Public support form
│   ├── member-support/   # Authenticated support form
│   ├── admin/            # Admin dashboard
│   ├── [username]/       # Public user profiles
│   └── (auth routes)     # login, register, verify-email
├── components/
│   ├── auth/             # Auth components & route guards
│   ├── maps/             # Google Maps integration
│   ├── locations/        # Location UI components
│   ├── panels/           # SaveLocationPanel, EditLocationPanel, LocationDetailPanel
│   ├── onboarding/       # Tour providers (Map, Locations, People)
│   ├── admin/            # Admin components
│   └── ui/               # shadcn/ui components
├── lib/
│   ├── auth.ts           # JWT generation/verification
│   ├── api-middleware.ts # requireAuth middleware
│   ├── sanitize.ts       # Input sanitization
│   ├── virus-scan.ts     # ClamAV file scanning
│   ├── prisma.ts         # Database client
│   └── email.ts          # Email sending
├── hooks/                # Custom React hooks
└── types/                # TypeScript type definitions

prisma/
└── schema.prisma         # Database schema
```

## Common Patterns

### Next.js Image Component

```typescript
import Image from "next/image";

// For dynamic images with fill container
<div className="relative h-56">
  <Image
    src={imageUrl}
    alt="Description"
    fill
    className="object-cover"
    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
  />
</div>

// For fixed dimensions
<Image
  src={imageUrl}
  alt="Description"
  width={600}
  height={400}
  className="rounded-lg"
/>
```

### Protected API Route

```typescript
import { requireAuth } from "@/lib/api-middleware";

export async function GET(request: Request) {
  const auth = await requireAuth(request);
  if (!auth.authenticated) {
    return Response.json({ error: auth.error }, { status: 401 });
  }

  const user = auth.user; // PublicUser type (no password)

  // Your logic here

  return Response.json({ data: result });
}
```

### Input Sanitization

```typescript
import { sanitizeInput } from "@/lib/sanitize";

// Sanitize single input
const sanitizedCaption = sanitizeInput(userInput.caption);

// Sanitize array of inputs
const sanitizedTags = userInput.tags?.map((tag) => sanitizeInput(tag));
```

### Database Query with Soft Delete Filter

```typescript
import prisma from "@/lib/prisma";

// Always filter out soft-deleted records
const locations = await prisma.location.findMany({
  where: {
    deletedAt: null,
    // ... other conditions
  },
});
```

### Zod Validation

```typescript
import { z } from "zod";

const schema = z.object({
  caption: z.string().max(500).optional(),
  rating: z.number().min(1).max(5).optional(),
  tags: z.array(z.string().max(50)).max(10).optional(),
});

const validated = schema.parse(requestBody);
```

### Client-Side Protected Route

```typescript
import ProtectedRoute from '@/components/auth/ProtectedRoute';

export default function MapPage() {
  return (
    <ProtectedRoute>
      <YourComponent />
    </ProtectedRoute>
  );
}
```

### Form Change Tracking Pattern

```typescript
// Track changes for unsaved changes banner (tags, photos, form fields)
useEffect(() => {
  const changedFields: string[] = [];

  // Check form field changes
  if (dirtyFields.name) {
    changedFields.push(`Name: ${watchedName}`);
  }

  // Check non-form state changes (tags, photos)
  const currentTags = JSON.stringify([...tags].sort());
  const originalTags = JSON.stringify([...originalTags].sort());
  if (currentTags !== originalTags) {
    changedFields.push("Tags updated");
  }

  if (photosToDelete.length > 0) {
    changedFields.push(`${photosToDelete.length} photo(s) marked for deletion`);
  }

  setHasChanges(changedFields.length > 0);
  setChanges(changedFields);
}, [dirtyFields, tags, originalTags, photosToDelete.length]);
```

### Onboarding Tour Pattern

```typescript
// Provider component with local state + parent callback
const [isCompleted, setIsCompleted] = useState(propCompleted);

// Sync with prop changes
useEffect(() => {
  setIsCompleted(propCompleted);
}, [propCompleted]);

// On tour complete
if (status === STATUS.FINISHED) {
  setIsCompleted(true); // Update local state immediately
  fetch("/api/onboarding/complete", {
    method: "POST",
    credentials: "include",
  }).then(() => {
    onTourComplete?.(); // Notify parent
  });
}
```

### Google Maps Libraries (CRITICAL)

```typescript
// MUST be defined at module level as a constant
// If defined inline, useLoadScript will re-initialize on every render
const GOOGLE_MAPS_LIBRARIES: ("places" | "maps")[] = ["places", "maps"];

// In component:
const { isLoaded } = useLoadScript({
  googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
  libraries: GOOGLE_MAPS_LIBRARIES,
});
```

### Centralized Upload Constants

```typescript
import {
  FILE_SIZE_LIMITS,
  PHOTO_LIMITS,
  TEXT_LIMITS,
  FOLDER_PATHS,
  ALLOWED_IMAGE_FORMATS,
} from "@/lib/constants/upload";

// File size validation
const maxBytes = FILE_SIZE_LIMITS.PHOTO * 1024 * 1024; // 10MB
if (file.size > maxBytes) {
  return `File size must be less than ${FILE_SIZE_LIMITS.PHOTO}MB`;
}

// Photo limits
if (photos.length >= PHOTO_LIMITS.MAX_PHOTOS_PER_LOCATION) {
  // 20
  return "Maximum photos reached";
}

// Text field validation with Zod
const schema = z.object({
  caption: z.string().max(TEXT_LIMITS.CAPTION).optional(), // 200
  notes: z.string().max(TEXT_LIMITS.PRODUCTION_NOTES).optional(), // 500
});

// ImageKit folder paths (flat structure)
const folder = FOLDER_PATHS.userPhotos(userId); // /{env}/users/{id}/photos
```

### Photo Cache Manager (Deferred Uploads)

```typescript
import { usePhotoCacheManager } from "@/hooks/usePhotoCacheManager";

// Photos are cached locally until user saves location
const {
  cachedPhotos, // Photos pending upload
  isUploading, // Upload in progress
  addPhotos, // Add files to cache (validates, converts HEIC)
  removePhoto, // Remove from cache by ID
  uploadAllPhotos, // Upload to ImageKit on save
  clearCache, // Clear all cached photos
} = usePhotoCacheManager();

// Add photos to cache (handles HEIC conversion automatically)
await addPhotos(files);

// Upload when user saves location
const uploadedPhotos = await uploadAllPhotos(userId);
```

### Browser-Side Image Conversion

```typescript
import { needsConversion, convertToJpeg } from "@/lib/image-converter";

// Check if file needs conversion (HEIC/TIFF → JPEG)
if (needsConversion(file)) {
  const { blob, exif } = await convertToJpeg(file);
  // blob: converted JPEG, exif: preserved metadata
}
```

### Custom Hooks Reference

- `usePhotoCacheManager` - Manage photos before upload
- `useLocations` - Fetch user's saved locations (TanStack Query)
- `usePublicLocations` - Fetch locations for public profile
- `useSaveLocation` - Save/unsave location mutations
- `useUpdateLocation` - Update location details
- `useDeleteLocation` - Delete location with confirmation
- `useGpsLocation` - Get browser geolocation
- `useReverseGeocode` - Convert coordinates to address
- `useImproveDescription` - AI description improvement
- `useMarkerClusterer` - Google Maps marker clustering

## Database Schema (Key Models)

### User

- Authentication, profile, privacy settings
- Relations: savedLocations, sessions, projects, followers/following

### Location

- Google Maps location data (shared across users)
- Relations: saves (UserSave), photos, contacts

### UserSave

- User-specific location data (ratings, captions, favorites)
- Junction table between User and Location

### Photo

- ImageKit CDN integration with EXIF metadata
- Relations: user (uploader), location

### Session

- JWT sessions with device tracking
- Supports multi-device (web + iOS)

## Key Features Implemented

### Onboarding System

- **Terms Modal**: Mandatory acceptance with scroll-to-bottom requirement
- **Tours**: React Joyride integration for /map, /locations, /search pages
- **State Management**: Local completion tracking + database persistence
- **Tour Steps**: Only target reliable, always-present DOM elements
- **Positioning**: Use `isFixed: true` and CSS transforms for fixed layouts
- **Conditional Attributes**: Only apply `data-tour` to first elements in lists

### Form Change Tracking

- **Independent State**: Track both form fields AND external state (tags, photos)
- **No Early Returns**: Don't skip tag/photo checks when form isn't dirty
- **Display Changes**: Show list of what changed in unsaved changes banner
- **Save Button Activation**: Activate on ANY change (fields, tags, photos)

## Security Checklist

When adding new features, always verify:

- [ ] User inputs are sanitized with `sanitizeInput()`
- [ ] Data is validated with Zod schemas
- [ ] Protected routes use `requireAuth` middleware
- [ ] Never return raw `User` object (use `PublicUser` type)
- [ ] Security events are logged to `SecurityLog` table
- [ ] Rate limiting is implemented for sensitive operations
- [ ] CORS and authentication headers are set correctly
- [ ] **File uploads use secure pipeline** - All 5 entry points (Avatar, Banner, Save Location, Edit Location, Create-with-Photo) go through `/api/photos/upload` with:
  - Server-side virus scanning (ClamAV)
  - Server-side HEIC/TIFF → JPEG conversion (Sharp)
  - Centralized file size limits (10MB max)

## Development Workflow

### Database Changes

1. Edit `prisma/schema.prisma`
2. **Development**: `npm run db:push` (fast, no migration files)
3. **Production**: `npm run db:migrate` (creates migration history)
4. Always regenerate client: `npm run db:generate`

### Adding New Components

1. Use shadcn/ui CLI: `npx shadcn-ui@latest add [component]`
2. Or copy from `/src/components/ui/`
3. Follow Tailwind utility-first approach

### Testing Locally

- **Development Server**: Always check if dev server is running on `http://localhost:3000`, before attempting to start the server.

```bash
npm run dev          # Start dev server (http://localhost:3000)
npm run db:studio    # Open Prisma Studio (database GUI)
```

## Documentation References

- **Documentation Updates**
- When creating a new documentation file or updating an exisiting one always add the Current Date and Time. This helps the human track when the documentation was last updated and if it is still relevant.
- **Setup**: `README.md`
- **Current Status**: `PROJECT_STATUS.md`
- **Production Deployment**: `.agent/workflows/deploy-to-production.md`
- **Features**: `/docs/features/`
- **Guides**: `/docs/guides/`
- **API Docs**: `/docs/api/`
  - **Mobile API Schemas**: `/docs/api/MOBILE_API_SCHEMAS.md` (CRITICAL for iOS compatibility)

## Common Tasks

### Add a New API Endpoint

1. Create file in `/src/app/api/[endpoint]/route.ts`
2. Use `requireAuth` if protected
3. Sanitize and validate inputs
4. Return consistent response format
5. **For mobile endpoints** (`/api/v1/*`):
   - Verify response matches `/docs/api/MOBILE_API_SCHEMAS.md`
   - **Use `lat`/`lng` for coordinates** (NEVER `latitude`/`longitude` — causes iOS silent failures)
   - Use explicit `null` for optional fields (never omit)

### Add a New Database Model

1. Add model to `prisma/schema.prisma`
2. Add relations to existing models
3. Run `npm run db:push`
4. Update TypeScript types if needed

### Add Privacy Controls

- Check user's privacy settings (profileVisibility, showSavedLocations, etc.)
- Filter data based on relationship (public, followers only, private)
- See `/docs/features/PRIVACY_ENFORCEMENT.md`

## Rate Limiting Pattern

```typescript
// Check rate limit (example: password reset)
const recentRequests = await prisma.securityLog.count({
  where: {
    userId: user.id,
    action: "PASSWORD_RESET_REQUEST",
    createdAt: {
      gte: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes
    },
  },
});

if (recentRequests >= 2) {
  return Response.json(
    { error: "Rate limit exceeded. Please try again later." },
    { status: 429 },
  );
}
```

## OpenGraph & Rich Link Previews

### Web App Implementation

Public location pages (`/[username]/locations/[id]`) automatically generate OpenGraph metadata for rich link previews when shared via iOS, social media, or messaging apps.

**Metadata Generation** (Next.js `generateMetadata`):

```typescript
export async function generateMetadata({
  params,
}: PublicLocationPageProps): Promise<Metadata> {
  const ogImage = save.location.photos[0]?.imagekitFilePath
    ? getImageKitUrl(
        save.location.photos[0].imagekitFilePath,
        "w-1200,h-630,c-at_max",
      )
    : undefined;

  return {
    title: `${save.location.name} - ${displayName}'s Location`,
    description:
      save.caption || save.location.address || `View ${save.location.name}`,
    openGraph: {
      title: save.location.name,
      description: save.caption || save.location.address,
      images: ogImage ? [ogImage] : [],
    },
  };
}
```

**Generated HTML meta tags**:

```html
<meta property="og:title" content="Location Name" />
<meta property="og:description" content="Location address or caption" />
<meta
  property="og:image"
  content="https://ik.imagekit.io/rgriola/...?tr=w-1200,h-630,c-at_max"
/>
<meta
  property="og:url"
  content="https://fotolokashen.com/username/locations/123"
/>
```

### iOS Integration

iOS app shares location URLs (not plain text) to enable automatic OpenGraph fetching:

**Correct Sharing Pattern**:

```swift
// ✅ Share URL object - triggers OpenGraph preview
if let username = location.creator?.username,
   let url = URL(string: "https://fotolokashen.com/\(username)/locations/\(location.id)") {
    ShareLink(
        item: url,
        subject: Text(location.name),
        message: Text(location.address ?? "")
    )
}

// ❌ WRONG - Plain text string, no preview
ShareLink(item: "Location Name\nAddress\nhttps://...", ...)
```

### How It Works

1. **User shares location** from iOS app via ShareLink
2. **iOS/iMessage receives URL**: `https://fotolokashen.com/rodczaro/locations/107`
3. **Platform fetches page** and parses OpenGraph meta tags
4. **Rich preview displayed** with:
   - 📷 Primary photo (1200x630, optimized via ImageKit)
   - 📍 Location name (og:title)
   - 📝 Caption or address (og:description)

### URL Format

- **Public location pages**: `/{username}/locations/{locationId}`
- **No @ symbol**: URLs are `/rodczaro/locations/107`, not `/@rodczaro/...`
- **Always use creator username**: Ensures correct public profile routing

### Image Optimization

ImageKit transformations for OpenGraph images:

- **Size**: `w-1200,h-630` (og:image standard dimensions)
- **Fit**: `c-at_max` (maintain aspect ratio, fit within bounds)
- **Format**: Auto (`fo-auto` - WebP/AVIF where supported)

### Debugging Tips

- **Test URL in browser**: View page source to verify meta tags
- **iMessage cache**: Previews cached - append `?v=2` to test changes
- **Fallback behavior**: If no photo, only title/description shown
- **Private locations**: Only public locations (`visibility: "public"`) are accessible via shared URLs

## Important Notes

- **Custom JWT Auth**: We use custom JWT, NOT NextAuth.js
- **Session Management**: Multi-device sessions supported (web + iOS)
- **Email System**: Resend API with custom HTML templates
- **Photo Storage**: ImageKit CDN with flat directory structure: `/{environment}/users/{userId}/photos/`
- **Photo Uploads**: All uploads go through secure server pipeline with virus scanning and format conversion
- **Privacy**: Server-side enforcement, granular controls per feature
- **Database**: Neon (PostgreSQL) with connection pooling for production
- **Monitoring**: Vercel Speed Insights for Core Web Vitals
- **Deployment**: See `.agent/workflows/deploy-to-production.md` for complete Vercel + Neon + Resend setup
