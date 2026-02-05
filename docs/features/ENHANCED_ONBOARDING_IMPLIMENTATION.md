# Enhanced Multi-Page Onboarding with Terms Acceptance

**Implementation Plan: Mandatory onboarding flow that requires users to accept terms and complete all tours before accessing the app.**

---

## Executive Summary

This plan transforms the current single-page onboarding into a comprehensive multi-page system that:

1. **Requires terms acceptance** before any app usage (with database audit trail)
2. **Enforces completion** of the main map tour (no skipping allowed)
3. **Adds contextual tours** for Locations and People pages
4. **Tracks completion** per page for progressive disclosure
5. **Allows tour restarts** from profile menu for user reference

**Key Changes**:
- Database: +6 new User fields (terms tracking + per-page onboarding)
- Components: 1 new TermsModal, modify 3 existing components
- API Routes: +5 new endpoints (terms accept + page completions + resets)
- Pages: Wrap Locations and People pages with tour providers

---

## Phase 1: Database Schema Updates

### 1. Add terms acceptance fields to User model

**File**: `prisma/schema.prisma`

```prisma
// Add to User model
termsAcceptedAt      DateTime?  @map("terms_accepted_at")
termsVersion         String?    @map("terms_version")  // "1.0"
privacyAcceptedAt    DateTime?  @map("privacy_accepted_at")
privacyVersion       String?    @map("privacy_version")
```

### 2. Add page-specific onboarding tracking

```prisma
// Add to User model
locationsOnboardingCompleted  Boolean  @default(false) @map("locations_onboarding_completed")
peopleOnboardingCompleted     Boolean  @default(false) @map("people_onboarding_completed")
```

### 3. Run migration

```bash
npm run db:migrate
```

---

## Agent Prompt: Implementation Guide

Use this prompt to implement the enhanced onboarding system systematically.

### Context
- **Tech Stack**: Next.js 16 (App Router), React 19, TypeScript, Prisma ORM, PostgreSQL (Neon)
- **Current System**: Single-page map onboarding using react-joyride v2.9.3
- **Existing Components**: OnboardingProvider, OnboardingTour, WelcomeModal, CompletionModal in `src/components/onboarding/`
- **Current API**: 4 endpoints in `/api/onboarding/` (start, complete, skip, reset)

### Requirements

**Phase 1: Database Schema**
1. Add to User model in `prisma/schema.prisma`:
   - `termsAcceptedAt DateTime?` (mapped to terms_accepted_at)
   - `termsVersion String?` (mapped to terms_version)
   - `privacyAcceptedAt DateTime?` (mapped to privacy_accepted_at)
   - `privacyVersion String?` (mapped to privacy_version)
   - `locationsOnboardingCompleted Boolean @default(false)` (mapped)
   - `peopleOnboardingCompleted Boolean @default(false)` (mapped)
2. Run `npm run db:migrate` to create migration

**Phase 2: Terms Acceptance Modal**
1. Create `src/components/onboarding/TermsModal.tsx`:
   - Full-screen modal (cannot dismiss, no close button)
   - Scrollable content with Terms of Service and Privacy Policy
   - Track scroll position (must reach 90% before checkbox enables)
   - Checkbox: "I have read and accept the Terms of Service and Privacy Policy"
   - "Accept & Continue" button (disabled until checkbox checked)
   - Call POST `/api/onboarding/accept-terms` on acceptance
   - Show loading state and error handling

2. Create `src/app/api/onboarding/accept-terms/route.ts`:
   - Use `requireAuth` middleware
   - Update user: set `termsAcceptedAt`, `termsVersion: "1.0"`, `privacyAcceptedAt`, `privacyVersion: "1.0"`
   - Create SecurityLog entry with action 'TERMS_ACCEPTED'
   - Return success with timestamp

**Phase 3: Map Page Onboarding (Modify Existing)**
1. Update `src/components/onboarding/OnboardingProvider.tsx`:
   - Add `termsAccepted: boolean` to userOnboardingStatus interface
   - Add state: `showTermsModal`, `setShowTermsModal`
   - Check if terms accepted, show modal if not
   - Pass terms state via context
   - Remove `skipTour()` function from context (keep API endpoint for backwards compatibility)

2. Update `src/app/map/page.tsx`:
   - Fetch `termsAcceptedAt` in user status API call
   - Pass `termsAccepted: !!data.user.termsAcceptedAt` to OnboardingProvider
   - Render: `<TermsModal />` → `<WelcomeModal />` → `<OnboardingTour />` → `<CompletionModal />`

3. Modify `src/components/onboarding/WelcomeModal.tsx`:
   - Remove "Maybe Later" button completely
   - Change text from "Want to take a quick tour?" to "Let's take a quick tour of fotolokashen!"
   - Add text: "This tour will show you all the features you need to get started."

4. Modify `src/components/onboarding/CompletionModal.tsx`:
   - Change title to "You've completed the Map tour! 🎉"
   - Add blue info box with text: "💡 More to explore: You'll see brief feature tours when you visit the Locations and People pages for the first time."

**Phase 4: Locations Page Onboarding**
1. Create `src/lib/onboarding/locationsSteps.ts`:
   - Export LOCATIONS_ONBOARDING_STEPS array (7 steps)
   - Steps target: search, view-toggle, filter, sort, card, edit, final (center)

2. Add data-tour attributes to `src/app/locations/page.tsx`:
   - `data-tour="locations-search"` on search input
   - `data-tour="locations-view-toggle"` on grid/list toggle
   - `data-tour="locations-filter"` on filter button/panel
   - `data-tour="locations-sort"` on sort dropdown
   - `data-tour="locations-card"` on first location card
   - `data-tour="locations-edit"` on edit button

3. Create `src/components/onboarding/LocationsOnboardingProvider.tsx`:
   - Similar to OnboardingProvider but track `locationsOnboardingCompleted`
   - Use LOCATIONS_ONBOARDING_STEPS
   - Smaller welcome modal: "Quick Tour of Locations"
   - Auto-trigger on first visit if not completed

4. Wrap `src/app/locations/page.tsx` with `<LocationsOnboardingProvider>`

5. Create `src/app/api/onboarding/locations/complete/route.ts`:
   - Use `requireAuth`
   - Set `locationsOnboardingCompleted: true`

**Phase 5: People Page Onboarding**
1. Create `src/lib/onboarding/peopleSteps.ts`:
   - Export PEOPLE_ONBOARDING_STEPS array (6 steps)
   - Steps target: tabs, search, filters, user-card, follow, final (center)

2. Add data-tour attributes to `src/app/search/page.tsx`:
   - `data-tour="people-tabs"` on tab navigation
   - `data-tour="people-search"` on search input
   - `data-tour="people-filters"` on filter panel
   - `data-tour="people-user-card"` on first user card
   - `data-tour="people-follow"` on follow button

3. Create `src/components/onboarding/PeopleOnboardingProvider.tsx`:
   - Similar to LocationsOnboardingProvider but for people
   - Track `peopleOnboardingCompleted`
   - Welcome modal: "Quick Tour of People & Connections"

4. Wrap `src/app/search/page.tsx` with `<PeopleOnboardingProvider>`

5. Create `src/app/api/onboarding/people/complete/route.ts`:
   - Set `peopleOnboardingCompleted: true`

**Phase 6: Profile Menu Restart Options**
1. Update `src/components/layout/AuthButton.tsx`:
   - Change existing "Start Tour" text to "Restart Map Tour"
   - Add "Restart Locations Tour" menu item (calls `/api/onboarding/reset-locations`, redirects to `/locations`)
   - Add "Restart People Tour" menu item (calls `/api/onboarding/reset-people`, redirects to `/search`)

2. Create `src/app/api/onboarding/reset-locations/route.ts`:
   - Set `locationsOnboardingCompleted: false`

3. Create `src/app/api/onboarding/reset-people/route.ts`:
   - Set `peopleOnboardingCompleted: false`

### Implementation Requirements

**Security**:
- All API routes use `requireAuth` middleware from `@/lib/api-middleware`
- Log terms acceptance to SecurityLog table
- Include IP address and user agent in security log

**UI/UX**:
- Use shadcn/ui components (Dialog, Button, Checkbox)
- Follow existing modal styling patterns
- Mobile-responsive (full-screen modals on <768px)
- Consistent with Tailwind design system

**Error Handling**:
- Show error messages if API calls fail
- Retry buttons for failed requests
- Loading states during API calls
- Don't close modals on error

**Testing**:
- Verify new user flow: Terms → Map Tour → Locations Tour → People Tour
- Test existing users see terms modal on next login
- Confirm restart functionality works from profile menu
- Check mobile responsiveness
- Verify database fields updated correctly

### Expected Flow

**New User**:
1. Register → Verify Email → Login
2. TermsModal appears (must accept)
3. WelcomeModal appears (no skip option)
4. Complete 9-step map tour
5. CompletionModal shows with multi-page hint
6. Visit Locations → Auto-trigger locations tour
7. Visit People → Auto-trigger people tour

**Existing User** (no termsAcceptedAt):
1. Login → TermsModal appears
2. Accept terms → Access app normally
3. First visit to Locations/People triggers tours

### Files to Create (10 new files)
- `src/components/onboarding/TermsModal.tsx`
- `src/components/onboarding/LocationsOnboardingProvider.tsx`
- `src/components/onboarding/PeopleOnboardingProvider.tsx`
- `src/lib/onboarding/locationsSteps.ts`
- `src/lib/onboarding/peopleSteps.ts`
- `src/app/api/onboarding/accept-terms/route.ts`
- `src/app/api/onboarding/locations/complete/route.ts`
- `src/app/api/onboarding/people/complete/route.ts`
- `src/app/api/onboarding/reset-locations/route.ts`
- `src/app/api/onboarding/reset-people/route.ts`

### Files to Modify (8 files)
- `prisma/schema.prisma` (add 6 fields)
- `src/components/onboarding/OnboardingProvider.tsx` (add terms logic)
- `src/components/onboarding/WelcomeModal.tsx` (remove skip button)
- `src/components/onboarding/CompletionModal.tsx` (update message)
- `src/app/map/page.tsx` (fetch terms status, render TermsModal)
- `src/app/locations/page.tsx` (wrap with provider, add data-tour)
- `src/app/search/page.tsx` (wrap with provider, add data-tour)
- `src/components/layout/AuthButton.tsx` (add restart menu items)

### Success Criteria
✅ Users cannot access app without accepting terms  
✅ Users cannot skip map tour  
✅ Locations and People pages have contextual tours  
✅ All completion tracked in database  
✅ Tours can be restarted from profile menu  
✅ Mobile-responsive  
✅ Secure (requireAuth on all endpoints)  
✅ Audit trail for terms acceptance

### Implementation Order
1. Database schema (Phase 1)
2. Terms modal + API (Phase 2)
3. Map page modifications (Phase 3)
4. Locations onboarding (Phase 4)
5. People onboarding (Phase 5)
6. Profile menu updates (Phase 6)
7. Testing & refinement

**Start with Phase 1 and proceed sequentially. After each phase, verify functionality before moving to the next phase.**

