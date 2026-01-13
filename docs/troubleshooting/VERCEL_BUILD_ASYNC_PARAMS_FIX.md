# Vercel Build Fix: Next.js 15+ Async Params

**Date:** January 13, 2026  
**Issue:** Vercel build failing with TypeScript error  
**Commit:** ad90fd8

---

## Problem

Vercel build failed with this error:

```
Type error: Type 'typeof import("/vercel/path0/src/app/api/v1/users/[username]/follow/route")' 
does not satisfy the constraint 'RouteHandlerConfig<"/api/v1/users/[username]/follow">'.
  Types of property 'POST' are incompatible.
    Type '(request: NextRequest, { params }: { params: { username: string; }; }) => ...' 
    is not assignable to type '(request: NextRequest, context: { params: Promise<{ username: string; }>; }) => ...'.
      Types of parameters '__1' and 'context' are incompatible.
        Type '{ params: Promise<{ username: string; }>; }' is not assignable to type '{ params: { username: string; }; }'.
          Types of property 'params' are incompatible.
            Property 'username' is missing in type 'Promise<{ username: string; }>' but required in type '{ username: string; }'.
```

---

## Root Cause

**Next.js 15+ Breaking Change:** Dynamic route params are now async (wrapped in Promise).

**Old API (Next.js 14):**
```typescript
export async function GET(
  request: NextRequest,
  { params }: { params: { username: string } }
) {
  const username = params.username; // Direct access
}
```

**New API (Next.js 15+):**
```typescript
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params; // Must await
}
```

---

## Solution

Updated all 5 follow API endpoints to use async params:

### Files Modified

1. `src/app/api/v1/users/[username]/follow/route.ts`
2. `src/app/api/v1/users/[username]/unfollow/route.ts`
3. `src/app/api/v1/users/[username]/followers/route.ts`
4. `src/app/api/v1/users/[username]/following/route.ts`
5. `src/app/api/v1/users/me/follow-status/[username]/route.ts`

### Changes Applied

**Before:**
```typescript
{ params }: { params: { username: string } }

const normalizedUsername = params.username.toLowerCase().trim();
```

**After:**
```typescript
{ params }: { params: Promise<{ username: string }> }

const { username } = await params;
const normalizedUsername = username.toLowerCase().trim();
```

---

## Testing

✅ Local build: Working  
✅ TypeScript compilation: No errors  
✅ Vercel deployment: Should now succeed  

---

## Related Resources

- [Next.js 15 Migration Guide](https://nextjs.org/docs/app/building-your-application/upgrading/version-15)
- [Dynamic Route Segments - Next.js Docs](https://nextjs.org/docs/app/api-reference/file-conventions/route#dynamic-segments)

---

## Prevention

When creating new API routes with dynamic segments in Next.js 15+:

1. **Always use async params:**
   ```typescript
   { params }: { params: Promise<{ id: string }> }
   ```

2. **Always await before use:**
   ```typescript
   const { id } = await params;
   ```

3. **Test build locally before pushing:**
   ```bash
   npm run build
   ```

---

## Status

✅ **RESOLVED** - Commit ad90fd8 pushed to main  
⏳ **Vercel Build** - Awaiting automatic deployment
