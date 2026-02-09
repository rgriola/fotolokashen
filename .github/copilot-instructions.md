# Copilot Instructions for fotolokashen

You are assisting with the **fotolokashen** location discovery platform.

## Tech Stack
- **Framework**: Next.js 16.0.10 (App Router), React 19, TypeScript 5
- **Database**: PostgreSQL (Neon Cloud) with Prisma 6.19.1 ORM
- **Styling**: Tailwind CSS v4, shadcn/ui components
- **APIs**: Google Maps JavaScript API, ImageKit CDN, Resend (email)
- **State**: TanStack Query (React Query)
- **Auth**: Custom JWT-based authentication

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

### 5. UI/UX Standards
- **Mobile-first**: Design for mobile, enhance for desktop
- **Use shadcn/ui**: Components from `/src/components/ui/`
- **Tailwind utility classes**: Avoid custom CSS unless necessary
- **Consistent spacing**: Use Tailwind spacing scale (p-4, m-2, etc.)
- **Image optimization**: Always use Next.js `Image` component, never `<img>` tags
- **Responsive images**: Include `sizes` attribute for proper optimization

## Project Structure

```
src/
├── app/
│   ├── api/              # API routes
│   │   ├── auth/         # Authentication endpoints
│   │   ├── locations/    # Location management
│   │   ├── photos/       # Photo uploads
│   │   ├── users/        # User management
│   │   └── admin/        # Admin tools
│   ├── map/              # Main map interface
│   ├── admin/            # Admin dashboard
│   └── (auth routes)     # login, register, verify-email
├── components/
│   ├── auth/             # Auth components & route guards
│   ├── maps/             # Google Maps integration
│   ├── locations/        # Location UI components
│   ├── admin/            # Admin components
│   └── ui/               # shadcn/ui components
├── lib/
│   ├── auth.ts           # JWT generation/verification
│   ├── api-middleware.ts # requireAuth middleware
│   ├── sanitize.ts       # Input sanitization
│   ├── prisma.ts         # Database client
│   └── email.ts          # Email sending
├── hooks/                # Custom React hooks
└── types/                # TypeScript type definitions

prisma/
└── schema.prisma         # Database schema (14 models)
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
import { requireAuth } from '@/lib/api-middleware';

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
import { sanitizeInput } from '@/lib/sanitize';

// Sanitize single input
const sanitizedCaption = sanitizeInput(userInput.caption);

// Sanitize array of inputs
const sanitizedTags = userInput.tags?.map(tag => sanitizeInput(tag));
```

### Database Query with Soft Delete Filter
```typescript
import prisma from '@/lib/prisma';

// Always filter out soft-deleted records
const locations = await prisma.location.findMany({
  where: { 
    deletedAt: null,
    // ... other conditions
  }
});
```

### Zod Validation
```typescript
import { z } from 'zod';

const schema = z.object({
  caption: z.string().max(500).optional(),
  rating: z.number().min(1).max(5).optional(),
  tags: z.array(z.string().max(50)).max(10).optional()
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
    changedFields.push('Tags updated');
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
  fetch('/api/onboarding/complete', {
    method: 'POST',
    credentials: 'include',
  }).then(() => {
    onTourComplete?.(); // Notify parent
  });
}
```

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
- [ ] **File uploads are virus scanned** with `scanFile()` from `/src/lib/virus-scan.ts`

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
```bash
npm run dev          # Start dev server (http://localhost:3000)
npm run db:studio    # Open Prisma Studio (database GUI)
```

## Documentation References
- **Setup**: `README.md`
- **Current Status**: `PROJECT_STATUS.md`
- **Production Deployment**: `.agent/workflows/deploy-to-production.md`
- **Features**: `/docs/features/`
- **Guides**: `/docs/guides/`
- **API Docs**: `/docs/api/`

## Common Tasks

### Add a New API Endpoint
1. Create file in `/src/app/api/[endpoint]/route.ts`
2. Use `requireAuth` if protected
3. Sanitize and validate inputs
4. Return consistent response format

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
    action: 'PASSWORD_RESET_REQUEST',
    createdAt: { 
      gte: new Date(Date.now() - 15 * 60 * 1000) // 15 minutes
    }
  }
});

if (recentRequests >= 2) {
  return Response.json(
    { error: 'Rate limit exceeded. Please try again later.' }, 
    { status: 429 }
  );
}
```

## Important Notes
- **Custom JWT Auth**: We use custom JWT, NOT NextAuth.js
- **Session Management**: Multi-device sessions supported (web + iOS)
- **Email System**: Resend API with custom HTML templates
- **Photo Storage**: ImageKit CDN with flat directory structure
- **Privacy**: Server-side enforcement, granular controls per feature
- **Database**: Neon (PostgreSQL) with connection pooling for production
- **Deployment**: See `.agent/workflows/deploy-to-production.md` for complete Vercel + Neon + Resend setup