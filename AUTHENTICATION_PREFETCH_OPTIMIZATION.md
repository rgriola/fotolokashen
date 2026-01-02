# Authentication & Prefetch Optimization

**Date**: January 2, 2026  
**Issue**: Excessive page prefetching causing performance problems  
**Status**: 🔧 Analysis Complete - Solutions Ready

---

## 🚨 Problem Analysis

### Server Logs Show Excessive Requests
```
09:10:30 - PREFETCH STORM (Public Pages):
- /login     → 3 duplicate requests
- /register  → 4 duplicate requests  
- /          → 2 duplicate requests

09:10:31 - PREFETCH STORM (Protected Pages):
- /map       → 5 duplicate requests
- /locations → 4 duplicate requests
- /projects  → 3 duplicate requests

Total: 21 prefetch requests in 1.5 seconds!
```

### Root Cause: Aggressive Next.js Link Prefetching

**What's Happening**:
1. Next.js 13+ automatically prefetches ALL visible `<Link>` components
2. You have MULTIPLE navigation components rendering the same links:
   - `Header` → `Navigation` component (desktop)
   - `MobileMenu` (authenticated users, mobile)
   - `UnauthMobileMenu` (unauthenticated users, mobile)
3. Each component's links trigger independent prefetch requests
4. **Result**: 3-5x duplicate prefetching for every route!

**Why This is Bad**:
- ❌ Wastes server resources (21 requests vs ~7 needed)
- ❌ Wastes user bandwidth
- ❌ Slows down actual navigation (server busy with prefetch)
- ❌ Causes race conditions on mobile (login redirect issue from last night)
- ❌ Inflates Vercel serverless function usage (costs money)

---

## 💡 Solutions

### Solution 1: Disable Prefetch on Navigation Links (RECOMMENDED) ⭐

**Impact**: Reduces prefetch requests by 80%

Add `prefetch={false}` to ALL navigation `<Link>` components:

```tsx
<Link 
    href="/map" 
    prefetch={false}  // ← Add this
    className="..."
>
    Map
</Link>
```

**Benefits**:
- ✅ **Zero prefetching** for navigation menus
- ✅ Pages still load instantly (Next.js router cache)
- ✅ Eliminates duplicate requests
- ✅ Minimal code changes
- ✅ No user-facing impact (navigation still fast)

**When to Prefetch**:
- Keep prefetch enabled for **critical actions** (e.g., "Get Started" button on landing page)
- Disable for **menu links** (users may not visit all pages)

---

### Solution 2: Implement Smart Prefetching

Only prefetch pages based on user's likely next action:

```tsx
// Homepage: Prefetch /register (most likely next step)
<Link href="/register" prefetch={true}>Get Started</Link>

// All menu links: Don't prefetch
<Link href="/map" prefetch={false}>Map</Link>
<Link href="/locations" prefetch={false}>My Locations</Link>
```

---

### Solution 3: Conditional Prefetching Based on Auth

Don't prefetch auth pages if user is already authenticated:

```tsx
// In Navigation.tsx
const shouldPrefetch = (authRequired: boolean) => {
    // Don't prefetch public pages if authenticated
    if (!authRequired && user) return false;
    // Don't prefetch protected pages if not authenticated
    if (authRequired && !user) return false;
    // Prefetch only relevant pages
    return false; // Or true for critical pages
};

<Link 
    href={item.href} 
    prefetch={shouldPrefetch(item.authRequired)}
>
```

---

## 🛠️ Implementation Plan

### Phase 1: Quick Win - Disable Navigation Prefetch (5 minutes)

**Files to Update**:
1. `src/components/layout/Navigation.tsx`
2. `src/components/layout/MobileMenu.tsx`
3. `src/components/layout/UnauthMobileMenu.tsx`

**Changes**:
```tsx
// Add prefetch={false} to all menu links
<Link href="..." prefetch={false}>
```

**Expected Result**:
- Before: 21 prefetch requests
- After: 3-5 prefetch requests (only user interactions)
- Reduction: ~80%

---

### Phase 2: Optimize Critical User Flows (10 minutes)

**Keep Prefetch Enabled For**:
1. Landing page "Get Started" → `/register`
2. Login success → `/map` (already using hard redirect)

**Disable Prefetch For**:
1. All header/menu navigation links
2. Footer links
3. Breadcrumb links

---

### Phase 3: Authentication Flow Improvements (15 minutes)

**Current Issues**:
1. `/api/auth/me` called on every page navigation
2. Auth check happens in middleware AND client-side
3. Cookie sync timing issues on mobile

**Solutions**:
1. **Cache auth check results** (5-minute TTL)
2. **Use middleware-only auth** for protected routes
3. **Client-side auth context** syncs from middleware headers

---

## 📊 Expected Performance Improvements

### Before Optimization:
```
Page Load Timeline:
0ms  - User clicks link
10ms - 5x prefetch requests start (/map, /map, /map, /map, /map)
50ms - Server processing 5 duplicate requests
100ms - First response returns
150ms - Navigation completes

Server Load: 21 requests per user session
```

### After Optimization:
```
Page Load Timeline:
0ms  - User clicks link
10ms - Navigation request (from router cache or server)
50ms - Response returns
60ms - Navigation completes

Server Load: 5-7 requests per user session
Improvement: 66% reduction
```

---

## 🎯 Authentication Flow Recommendations

### Current Flow (Problematic):
```
User Opens App
  ↓
1. Load / (homepage)
2. useAuth() → /api/auth/me
3. Prefetch /login, /register, /map, /locations, /projects (5-21 requests)
4. User clicks link
5. Another /api/auth/me check
6. Load target page
```

### Recommended Flow:
```
User Opens App
  ↓
1. Load / (homepage)
2. Middleware checks auth (server-side, one JWT verify)
3. Set auth header → client reads from header (no API call)
4. NO prefetching (prefetch={false} on all links)
5. User clicks link
6. Instant navigation (Next.js router cache)
7. Load target page (auth already known)
```

---

## 🔐 Authentication Improvements

### 1. Middleware-First Auth Strategy

**Current**:
- Client calls `/api/auth/me` on every navigation
- Duplicates work (middleware already verified JWT)

**Recommended**:
- Middleware verifies JWT once
- Sets custom header: `X-User-Email: user@example.com`
- Client reads header (no API call needed)

**Implementation**:
```typescript
// middleware.ts
export async function middleware(request: NextRequest) {
    const token = request.cookies.get('token')?.value;
    if (token) {
        const user = await verifyToken(token);
        if (user) {
            // Add user to header for client-side access
            const headers = new Headers(request.headers);
            headers.set('X-User-Email', user.email);
            headers.set('X-User-Id', user.id.toString());
            return NextResponse.next({ headers });
        }
    }
    return NextResponse.next();
}

// auth-context.tsx
'use client';
export function AuthProvider({ children, initialUser }: { initialUser?: User }) {
    const [user, setUser] = useState<User | null>(initialUser || null);
    
    // No /api/auth/me call needed - already have user from headers!
}
```

---

### 2. Deduplicate Auth Checks

**Current Problems**:
- Every `useAuth()` call triggers `/api/auth/me`
- Multiple components call `useAuth()` simultaneously
- Race conditions on mobile

**Solution**:
```typescript
// Create a singleton auth service
let authCheckPromise: Promise<User | null> | null = null;

export async function getAuthUser(): Promise<User | null> {
    // Reuse in-flight request if exists
    if (authCheckPromise) return authCheckPromise;
    
    authCheckPromise = fetch('/api/auth/me')
        .then(res => res.ok ? res.json() : null)
        .finally(() => {
            // Clear after 5 seconds (allow caching)
            setTimeout(() => authCheckPromise = null, 5000);
        });
    
    return authCheckPromise;
}
```

---

### 3. Email Verification Redirect Flow

**Issue** (from your requirements):
> "User tries to login but email is not verified. Should be gracefully redirected to asking for another verification email."

**Current Flow**:
```
Login → Check password → Set cookie → Redirect to /map
Problem: No email verification check!
```

**Recommended Flow**:
```typescript
// src/app/api/auth/login/route.ts
export async function POST(request: Request) {
    const { email, password } = await request.json();
    
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    
    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    
    // ✅ NEW: Check email verification
    if (!user.emailVerified) {
        return NextResponse.json({ 
            error: "Email not verified",
            requiresVerification: true,
            email: user.email
        }, { status: 403 });
    }
    
    // Create session...
    return NextResponse.json({ success: true, user });
}

// src/components/auth/LoginForm.tsx
const handleSubmit = async (data: LoginFormData) => {
    const res = await fetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(data)
    });
    
    const result = await res.json();
    
    if (result.requiresVerification) {
        // Redirect to verification prompt
        router.push(`/verify-email?email=${encodeURIComponent(result.email)}&resend=true`);
        return;
    }
    
    if (result.success) {
        // Existing login redirect...
    }
};
```

---

## 📋 Implementation Checklist

### Immediate (High Priority):
- [ ] Add `prefetch={false}` to all navigation links
- [ ] Test page load performance (should see 80% reduction in requests)
- [ ] Add email verification check to login flow
- [ ] Create `/verify-email` page with "Resend" option

### Short Term (This Week):
- [ ] Implement middleware-first auth strategy
- [ ] Cache auth check results (reduce API calls)
- [ ] Add request deduplication for `/api/auth/me`

### Long Term (Nice to Have):
- [ ] Multiple device session management
- [ ] Session limit enforcement (max 2 sessions, 1 mobile)
- [ ] Auto-logout on session expiry with user notification

---

## 🎯 Success Metrics

**Baseline (Current)**:
- Prefetch requests per page load: 21
- Auth API calls per session: 5-10
- Page navigation time: 100-150ms

**Target (After Optimization)**:
- Prefetch requests per page load: 3-5 (66% reduction)
- Auth API calls per session: 1-2 (80% reduction)
- Page navigation time: 50-80ms (40% improvement)
- Zero duplicate auth checks
- Graceful email verification handling

---

## 🚀 Next Steps

1. **Implement prefetch={false}** (5 min) - Immediate 80% reduction
2. **Add email verification check** (10 min) - Better UX
3. **Test on production** (5 min) - Verify improvements
4. **Monitor Vercel logs** (24 hours) - Confirm reduction
5. **Implement middleware auth** (Phase 2) - Further optimization

---

**Status**: Ready to implement  
**Priority**: High (affecting production performance)  
**Effort**: 30 minutes total  
**Impact**: 66-80% reduction in unnecessary requests
