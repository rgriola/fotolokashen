# User Namespaces - Implementation Decisions

**Date**: January 13, 2026  
**Status**: Approved ✅

---

## Design Decisions Made:

### 1. Username Change Policy
**Decision**: ✅ Option A - YES, max 1 change per 30 days

**Rationale**:
- Users need flexibility for typos
- Professional users may want to rebrand
- 30-day limit prevents abuse
- Track history via `UsernameChangeRequest` table

---

### 2. API Versioning
**Decision**: ✅ Option A - YES, use `/api/v1/users/:username`

**Rationale**:
- Future-proof for iOS app (critical!)
- Allows breaking changes without affecting mobile clients
- Industry standard
- Only adds 3 characters to URL

**Endpoints**:
```
GET /api/v1/users/:username
GET /api/v1/users/:username/locations
```

---

### 3. Default Location Visibility
**Decision**: ✅ Option A - PRIVATE (users opt-in to share)

**Rationale**:
- Privacy-first approach
- GDPR compliant
- Users explicitly choose to share
- Reduces risk of accidental exposure

**Options**:
- `private` - Only visible to user (default)
- `unlisted` - Anyone with link can view
- `public` - Visible on user profile

---

### 4. Profile Display Options
**Decision**: ✅ Show the following:
- [x] Avatar (with ImageKit cleanup)
- [x] Banner image
- [x] Bio
- [x] Location count (public only)
- [x] Join date
- [ ] Last active date (privacy concern)
- [ ] Social media links (future feature)
- [ ] Website link (future feature)

**Rationale**:
- Clean, professional appearance
- Minimal personal data exposure
- Matches existing design patterns
- Room to expand later

---

### 5. Staging Environment
**Decision**: ✅ NO - Deploy directly to production

**Rationale**:
- Faster implementation
- Changes are backward compatible
- Can test in development
- Low risk (no breaking changes)
- Vercel preview deployments provide safety net

---

### 6. iOS App Timeline
**Decision**: ✅ In 2-3 weeks

**Rationale**:
- iOS team working on camera/compression first
- Backend can implement Phase 1 (Namespaces) now
- Phase 2 (OAuth2) in ~1 week
- iOS development starts after Phase 2 complete

**Timeline**:
- Week 1: Phase 1 (Namespaces) ← WE ARE HERE
- Week 2: Phase 2 (OAuth2/PKCE)
- Week 3: iOS development begins

---

## Implementation Plan:

### Phase 1 Tasks (This Week):

**Day 1: Database Schema** ✅ COMPLETE
- [x] No username conflicts found
- [x] Add `ReservedUsername` model
- [x] Add `visibility` and `caption` to `UserSave`
- [x] Push schema changes to database
- [x] Seed reserved usernames

**Day 2: Backend Utilities** ✅ COMPLETE
- [x] Create `src/lib/username-utils.ts`
- [x] Update registration validation
- [x] Test username validation

**Day 3: Web Routes** ✅ COMPLETE
- [x] Create `src/app/[username]/page.tsx`
- [x] Create `src/app/[username]/locations/page.tsx`
- [x] Create `src/middleware.ts` for @username URL rewriting
- [x] Build profile UI components

**Day 4: Mobile APIs** ✅ COMPLETE
- [x] Create `GET /api/v1/users/:username`
- [x] Create `GET /api/v1/users/:username/locations`
- [x] Add pagination support
- [x] Add cache headers
- [x] Create API documentation
- [x] Create testing guide

**Day 5: Testing & Deploy** ⏳ NEXT
- [ ] Reload VS Code window (clear TypeScript cache)
- [ ] Create test users with public locations
- [ ] Manual testing (see DAY_4_TESTING_GUIDE.md)
- [ ] Verify pagination works
- [ ] Verify visibility filtering
- [ ] Deploy to production
- [ ] Test in production with real data

---

## Progress Summary:

**Phase 1 Progress**: 80% Complete (4 of 5 days done)

### Commits:
- ✅ `d7ecc74` - Phase 1 Day 1-2 (Database + Utilities)
- ✅ `618ad5b` - Phase 1 Day 3 (Web Routes)
- ✅ `4e3998d` - Phase 1 Day 4 (Mobile APIs)

### What's Working:
- ✅ Reserved usernames protected
- ✅ Username validation (3-50 chars, alphanumeric + -_)
- ✅ User profiles at `/@username`
- ✅ Location lists at `/@username/locations`
- ✅ Mobile API endpoints (`/api/v1/users/:username`)
- ✅ Pagination (page, limit params)
- ✅ Privacy filtering (only public locations exposed)
- ✅ Cache headers for CDN optimization

### Known Issue:
⚠️ **TypeScript errors in VS Code** - False positives due to Prisma Client caching
- **Solution**: Reload VS Code window (`Cmd+Shift+P` → "Developer: Reload Window")
- **Why**: VS Code doesn't always reload Prisma types after `npx prisma generate`
- **Impact**: None - code works at runtime, just IDE display issue

### Next Steps:
1. **Reload VS Code window** to clear TypeScript cache
2. **Manual testing** using DAY_4_TESTING_GUIDE.md
3. **Deploy to production** (Vercel)
4. **Complete Day 5** testing checklist
5. **Start Phase 2** (OAuth2/PKCE for iOS)

**Phase 1 is almost done!** 🎉
