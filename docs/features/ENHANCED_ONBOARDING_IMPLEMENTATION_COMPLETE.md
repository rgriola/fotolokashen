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

**Migration Impact**:
- Adds 6 nullable fields to User table
- Existing users will have `NULL` values (will trigger terms modal on next login)
- No data loss or breaking changes

---

## Phase 2: Terms Acceptance Modal

### 1. Create TermsModal Component

**File**: `src/components/onboarding/TermsModal.tsx`

**Requirements**:
- **Full-screen modal** (cannot close or dismiss)
- **Content sections**:
  - Terms of Service (fetched from `/terms` or embedded)
  - Privacy Policy (fetched from `/privacy` or embedded)
- **Scrollable container** with height indicator/progress bar
- **Scroll tracking**: Must scroll to bottom (>90%) before checkbox enables
- **Checkbox**: "I have read and accept the Terms of Service and Privacy Policy"
- **Accept button**: Disabled until checkbox checked
- **API call**: POST to `/api/onboarding/accept-terms` on acceptance
- **Loading state**: Show spinner during API call
- **Error handling**: Display error message if API fails

**UI/UX**:
- Use shadcn/ui Dialog component (with `modal={true}`, no close button)
- Tailwind styling consistent with existing modals
- Mobile-responsive (full-screen on mobile, centered on desktop)

### 2. Create API Route

**File**: `src/app/api/onboarding/accept-terms/route.ts`

**Implementation**:
```typescript
import { requireAuth } from '@/lib/api-middleware';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  const auth = await requireAuth(request);
  if (!auth.authenticated) {
    return Response.json({ error: auth.error }, { status: 401 });
  }

  try {
    const now = new Date();
    const updatedUser = await prisma.user.update({
      where: { id: auth.user.id },
      data: {
        termsAcceptedAt: now,
        termsVersion: '1.0',
        privacyAcceptedAt: now,
        privacyVersion: '1.0',
      },
    });

    // Log to SecurityLog for audit trail
    await prisma.securityLog.create({
      data: {
        userId: auth.user.id,
        action: 'TERMS_ACCEPTED',
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        details: { version: '1.0' },
      },
    });

    return Response.json({ 
      success: true,
      termsAcceptedAt: updatedUser.termsAcceptedAt 
    });
  } catch (error) {
    console.error('Error accepting terms:', error);
    return Response.json(
      { error: 'Failed to record terms acceptance' },
      { status: 500 }
    );
  }
}
```

---

## Phase 3: Modify Map Page Onboarding Flow

### Current Flow
```
WelcomeModal → Tour (9 steps) → CompletionModal
```

### New Flow
```
TermsModal → WelcomeModal → Tour (9 steps) → CompletionModal
```

### 1. Update OnboardingProvider

**File**: `src/components/onboarding/OnboardingProvider.tsx`

**Changes**:
- Add `termsAccepted` to userOnboardingStatus interface
- Add state: `const [showTermsModal, setShowTermsModal] = useState(false)`
- Add effect to check terms acceptance:
  ```typescript
  useEffect(() => {
    if (userOnboardingStatus && !userOnboardingStatus.termsAccepted) {
      setShowTermsModal(true);
    }
  }, [userOnboardingStatus]);
  ```
- Pass `showTermsModal` and `setShowTermsModal` via context
- Update context type to include terms state

### 2. Update Map Page

**File**: `src/app/map/page.tsx`

**Changes**:
- Fetch `termsAcceptedAt` in the user status API call:
  ```typescript
  setUserOnboardingStatus({
    onboardingCompleted: data.user.onboardingCompleted ?? false,
    onboardingSkipped: data.user.onboardingSkipped ?? false,
    onboardingStep: data.user.onboardingStep ?? null,
    termsAccepted: !!data.user.termsAcceptedAt, // NEW
  });
  ```
- Update render order:
  ```tsx
  <OnboardingProvider userOnboardingStatus={userOnboardingStatus ?? undefined}>
    <MapPageInner />
    <TermsModal />           {/* NEW - Shows first */}
    <WelcomeModal />          {/* Shows after terms */}
    <CompletionModal />
    <OnboardingTour />
  </OnboardingProvider>
  ```

### 3. Prevent Skipping

**File**: `src/components/onboarding/WelcomeModal.tsx`

**Changes**:
- **Remove "Maybe Later" button** completely
- Keep only "Let's Go! →" button
- Update text to indicate requirement:
  - Before: "Want to take a quick tour?"
  - After: "Let's take a quick tour of fotolokashen!"
- Add text: "This tour will show you all the features you need to get started."

**File**: `src/components/onboarding/OnboardingProvider.tsx`

**Changes**:
- Remove `skipTour()` function from context
- Keep `/api/onboarding/skip` endpoint for backward compatibility (existing users)
- Do NOT expose skip functionality in UI

### 4. Update CompletionModal

**File**: `src/components/onboarding/CompletionModal.tsx`

**Changes**:
- Update message:
  - Before: "You've completed the tour..."
  - After: "You've completed the Map tour! 🎉"
- Add new section:
  ```tsx
  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
    <p className="text-sm text-blue-900">
      💡 <strong>More to explore:</strong> You'll see brief feature tours when 
      you visit the Locations and People pages for the first time.
    </p>
  </div>
  ```
- Keep existing restart tip
- Update button text: "Start Exploring →" (no change needed)

---

## Phase 4: Locations Page Onboarding

### 1. Create Step Definitions

**File**: `src/lib/onboarding/locationsSteps.ts`

**Steps** (to be finalized after inspecting page components):
```typescript
export const LOCATIONS_ONBOARDING_STEPS = [
  {
    target: '[data-tour="locations-search"]',
    content: 'Search your saved locations by name, address, or tags.',
    disableBeacon: true,
  },
  {
    target: '[data-tour="locations-view-toggle"]',
    content: 'Switch between grid and list views to see your locations.',
  },
  {
    target: '[data-tour="locations-filter"]',
    content: 'Filter locations by type, favorites, or custom criteria.',
  },
  {
    target: '[data-tour="locations-sort"]',
    content: 'Sort your locations by date, name, or rating.',
  },
  {
    target: '[data-tour="locations-card"]',
    content: 'Click any location card to view details, photos, and more.',
  },
  {
    target: '[data-tour="locations-edit"]',
    content: 'Edit location details, add tags, or update your rating.',
  },
  {
    target: 'body',
    content: '✅ You're all set! Start managing your saved locations.',
    placement: 'center',
  },
];
```

### 2. Add Data-Tour Attributes

**File**: `src/app/locations/page.tsx`

**Add to components** (exact selectors TBD after code inspection):
- `data-tour="locations-search"` → Search input field
- `data-tour="locations-view-toggle"` → Grid/List toggle buttons
- `data-tour="locations-filter"` → Filter button/panel
- `data-tour="locations-sort"` → Sort dropdown
- `data-tour="locations-card"` → First location card in results
- `data-tour="locations-edit"` → Edit button (in card or panel)

### 3. Create LocationsOnboardingProvider

**File**: `src/components/onboarding/LocationsOnboardingProvider.tsx`

**Similar to OnboardingProvider but**:
- Tracks `locationsOnboardingCompleted` instead
- Uses LOCATIONS_ONBOARDING_STEPS
- Smaller welcome modal: "Quick Tour of Locations"
- No terms check (already done on map page)
- Auto-trigger on first visit if `!locationsOnboardingCompleted`

### 4. Wrap Locations Page

**File**: `src/app/locations/page.tsx`

**Add wrapper**:
```tsx
<LocationsOnboardingProvider>
  {/* existing content */}
</LocationsOnboardingProvider>
```

### 5. Create API Route

**File**: `src/app/api/onboarding/locations/complete/route.ts`

**Implementation**:
```typescript
import { requireAuth } from '@/lib/api-middleware';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  const auth = await requireAuth(request);
  if (!auth.authenticated) {
    return Response.json({ error: auth.error }, { status: 401 });
  }

  await prisma.user.update({
    where: { id: auth.user.id },
    data: {
      locationsOnboardingCompleted: true,
    },
  });

  return Response.json({ success: true });
}
```

---

## Phase 5: People Page Onboarding

### 1. Create Step Definitions

**File**: `src/lib/onboarding/peopleSteps.ts`

**Steps**:
```typescript
export const PEOPLE_ONBOARDING_STEPS = [
  {
    target: '[data-tour="people-tabs"]',
    content: 'Switch between Discover, Following, and Followers to explore the community.',
    disableBeacon: true,
  },
  {
    target: '[data-tour="people-search"]',
    content: 'Search for users by username, bio, or location.',
  },
  {
    target: '[data-tour="people-filters"]',
    content: 'Use filters to find users by type, city, or country.',
  },
  {
    target: '[data-tour="people-user-card"]',
    content: 'View user profiles to see their public locations and activity.',
  },
  {
    target: '[data-tour="people-follow"]',
    content: 'Follow users to see their shared locations on the map.',
  },
  {
    target: 'body',
    content: '✅ Ready to connect! Start following users and building your network.',
    placement: 'center',
  },
];
```

### 2. Add Data-Tour Attributes

**File**: `src/app/search/page.tsx`

**Add attributes**:
- `data-tour="people-tabs"` → Tab navigation component
- `data-tour="people-search"` → Search input field
- `data-tour="people-filters"` → Filter panel or button
- `data-tour="people-user-card"` → First user card
- `data-tour="people-follow"` → Follow button on user card

### 3. Create PeopleOnboardingProvider

**File**: `src/components/onboarding/PeopleOnboardingProvider.tsx`

**Similar pattern to LocationsOnboardingProvider**:
- Tracks `peopleOnboardingCompleted`
- Uses PEOPLE_ONBOARDING_STEPS
- Welcome modal: "Quick Tour of People & Connections"

### 4. Wrap People Page

**File**: `src/app/search/page.tsx`

**Add wrapper**:
```tsx
<PeopleOnboardingProvider>
  {/* existing content */}
</PeopleOnboardingProvider>
```

### 5. Create API Route

**File**: `src/app/api/onboarding/people/complete/route.ts`

**Implementation**: Same pattern as locations/complete

---

## Phase 6: Enforce Completion & Add Reset Options

### 1. Update ProtectedRoute (Optional)

**File**: `src/components/auth/ProtectedRoute.tsx`

**Option A: Soft enforcement** (Recommended)
- No changes needed
- Terms modal blocks on map page naturally
- Users can navigate but will see modals

**Option B: Hard enforcement**
- Check `termsAcceptedAt` in ProtectedRoute
- Redirect to `/map` if missing
- Prevents any navigation until accepted

**Recommendation**: Use Option A (soft) - less intrusive, same result

### 2. Update Profile Menu

**File**: `src/components/layout/AuthButton.tsx`

**Changes**:
- Line 126-129: Modify existing "Start Tour" menu item:
  ```tsx
  <DropdownMenuItem onClick={handleRestartMapTour}>
    <RotateCw className="mr-2 h-4 w-4" />
    Restart Map Tour
  </DropdownMenuItem>
  ```
- Add new menu items after Map Tour:
  ```tsx
  <DropdownMenuItem onClick={handleRestartLocationsTour}>
    <RotateCw className="mr-2 h-4 w-4" />
    Restart Locations Tour
  </DropdownMenuItem>
  <DropdownMenuItem onClick={handleRestartPeopleTour}>
    <RotateCw className="mr-2 h-4 w-4" />
    Restart People Tour
  </DropdownMenuItem>
  ```

**Add handlers**:
```typescript
const handleRestartLocationsTour = async () => {
  await fetch('/api/onboarding/reset-locations', { method: 'POST' });
  window.location.href = '/locations';
};

const handleRestartPeopleTour = async () => {
  await fetch('/api/onboarding/reset-people', { method: 'POST' });
  window.location.href = '/search';
};
```

### 3. Create Reset Endpoints

**File**: `src/app/api/onboarding/reset-locations/route.ts`
```typescript
import { requireAuth } from '@/lib/api-middleware';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  const auth = await requireAuth(request);
  if (!auth.authenticated) {
    return Response.json({ error: auth.error }, { status: 401 });
  }

  await prisma.user.update({
    where: { id: auth.user.id },
    data: { locationsOnboardingCompleted: false },
  });

  return Response.json({ success: true });
}
```

**File**: `src/app/api/onboarding/reset-people/route.ts`
- Same pattern as reset-locations but for `peopleOnboardingCompleted`

---

## Testing Checklist

### New User Flow
- [ ] Register new account
- [ ] Verify email
- [ ] Login redirects to `/map`
- [ ] TermsModal appears (cannot skip)
- [ ] Accept terms → WelcomeModal appears
- [ ] Complete map tour → CompletionModal shows with multi-page hint
- [ ] Navigate to `/locations` → LocationsWelcomeModal + tour triggers
- [ ] Complete locations tour
- [ ] Navigate to `/search` → PeopleWelcomeModal + tour triggers
- [ ] Complete people tour
- [ ] All tours marked complete in database

### Existing User Flow
- [ ] Login with existing account (no termsAcceptedAt)
- [ ] TermsModal appears
- [ ] Accept terms → Can access app normally
- [ ] If onboardingCompleted=true, no map tour
- [ ] First visit to Locations triggers tour
- [ ] First visit to People triggers tour

### Restart Tours
- [ ] Open profile menu → "Restart Map Tour" works
- [ ] Open profile menu → "Restart Locations Tour" works
- [ ] Open profile menu → "Restart People Tour" works

### Edge Cases
- [ ] Cannot skip terms modal (no close button)
- [ ] Cannot skip map tour (no "Maybe Later")
- [ ] Cannot access app without accepting terms
- [ ] Completing tour twice doesn't cause errors
- [ ] Mobile responsiveness of all modals
- [ ] API errors handled gracefully (network issues)

### Database Verification
- [ ] Terms acceptance timestamp recorded
- [ ] Terms version "1.0" saved
- [ ] SecurityLog entry created for terms acceptance
- [ ] Map onboarding completion tracked
- [ ] Locations onboarding completion tracked
- [ ] People onboarding completion tracked

---

## Security & Data Privacy

### Security Measures
1. **API Protection**: All endpoints use `requireAuth` middleware
2. **Input Validation**: No user inputs in terms acceptance (just timestamp)
3. **Audit Trail**: SecurityLog records terms acceptance with IP/user agent
4. **Version Tracking**: termsVersion/privacyVersion allow future updates
5. **CSRF Protection**: POST endpoints inherit Next.js CSRF protection

### Privacy Considerations
1. **Explicit Consent**: Users must actively check box and click accept
2. **Scroll Requirement**: Must view full terms before accepting
3. **Timestamp Recording**: Legally defensible proof of acceptance
4. **Version Control**: Can identify which terms version user accepted
5. **Accessibility**: Modals are keyboard navigable, screen reader friendly

### Future Terms Updates
When terms change (e.g., version 2.0):
1. Update terms/privacy page content
2. Update API to check for current version
3. Show re-acceptance modal if user has older version
4. Record new acceptance timestamp and version

---

## Implementation Timeline

### Phase 1: Database & Terms (Week 1)
- **Day 1-2**: Schema updates, migration
- **Day 3-4**: TermsModal component
- **Day 5**: Terms API endpoint + testing

### Phase 2: Map Onboarding Modifications (Week 1-2)
- **Day 6-7**: Update OnboardingProvider and Map page
- **Day 8**: Remove skip functionality, update modals
- **Day 9**: Testing and refinement

### Phase 3: Locations Onboarding (Week 2)
- **Day 10-11**: LocationsOnboardingProvider + steps
- **Day 12**: Add data-tour attributes
- **Day 13**: API endpoint + testing

### Phase 4: People Onboarding (Week 2-3)
- **Day 14-15**: PeopleOnboardingProvider + steps
- **Day 16**: Add data-tour attributes
- **Day 17**: API endpoint + testing

### Phase 5: Polish & Deployment (Week 3)
- **Day 18**: Profile menu updates, reset endpoints
- **Day 19**: Comprehensive testing (all flows)
- **Day 20**: Bug fixes, mobile optimization
- **Day 21**: Deploy to production

**Total**: ~3 weeks for full implementation

---

## Expected Outcomes

### User Experience
✅ **Clarity**: Users understand terms and all features before first use  
✅ **Guidance**: Progressive onboarding prevents overwhelming on day 1  
✅ **Reference**: Can restart tours anytime for feature review  
✅ **Compliance**: Legal protection with documented terms acceptance

### Business Impact
✅ **Reduced Support**: Users learn features proactively  
✅ **Engagement**: Complete onboarding → higher feature adoption  
✅ **Legal Protection**: Audit trail for terms acceptance  
✅ **Retention**: Users who complete onboarding are more likely to stay

### Technical Benefits
✅ **Scalable**: Easy to add tours for future pages  
✅ **Maintainable**: Consistent pattern across all tours  
✅ **Trackable**: Database fields enable analytics on completion rates  
✅ **Flexible**: Version tracking allows future terms updates

---

## Current System Reference

### Existing Components
- `src/components/onboarding/OnboardingProvider.tsx` - Context provider managing tour state
- `src/components/onboarding/OnboardingTour.tsx` - React Joyride wrapper component
- `src/components/onboarding/WelcomeModal.tsx` - Initial welcome screen
- `src/components/onboarding/CompletionModal.tsx` - Tour completion celebration
- `src/lib/onboarding/steps.ts` - Step definitions (9 steps configured)

### Existing API Routes
- `POST /api/onboarding/start` - Starts onboarding
- `POST /api/onboarding/complete` - Marks complete
- `POST /api/onboarding/skip` - Skips tour (will keep but not expose in UI)
- `POST /api/onboarding/reset` - Resets tour

### Current User Model Fields (Onboarding)
```prisma
onboardingCompleted     Boolean   @default(false) @map("onboarding_completed")
onboardingStep          Int?      @map("onboarding_step")
onboardingSkipped       Boolean   @default(false) @map("onboarding_skipped")
onboardingStartedAt     DateTime? @map("onboarding_started_at")
onboardingCompletedAt   DateTime? @map("onboarding_completed_at")
onboardingVersion       Int       @default(1) @map("onboarding_version")
```

### Library Used
**react-joyride v2.9.3** - Tour/walkthrough library
- Docs: https://docs.react-joyride.com/
- GitHub: https://github.com/gilbarbara/react-joyride

### Current Map Tour Steps (9 steps)
All use `data-tour` attributes in `src/components/maps/MapControls.tsx` and `src/components/layout/AuthButton.tsx`:

1. **Search Button** - "Google World Wide Search" - `data-tour="search-button"`
2. **GPS Toggle** - "Your GPS Location" - `data-tour="gps-toggle"`
3. **Friends Button** - "Friends' Locations" - `data-tour="friends-button"`
4. **View All Button** - "View All Locations" - `data-tour="view-all-button"`
5. **Public Toggle** - "Community Locations" - `data-tour="public-toggle"`
6. **My Locations Button** - "Locations Collection" - `data-tour="my-locations-button"`
7. **Create with Photo** - "Create from Photo" - `data-tour="create-with-photo"`
8. **Profile Menu** - "Account Settings" - `data-tour="profile-dropdown"`
9. **Final Step** - "Start Exploring" - Center placement with custom SVG camera icon

### Pages Needing Onboarding

#### Locations Page (`/locations`)
**File**: `src/app/locations/page.tsx`

**Features to highlight**:
- Search bar (by name, address, tags)
- Grid/List view toggle
- Filter panel (by type, favorites)
- Sort dropdown (recent, oldest, name, rating)
- Location cards (click for details)
- Edit location panel
- Share/delete actions

**Current status**: No onboarding exists

#### People Page (`/search`)
**File**: `src/app/search/page.tsx`

**Features to highlight**:
- 5 tabs (Discover, Following, Followers, Teams, Projects)
- Search users (username, bio, location)
- Advanced filters (type, city, country)
- User cards (profile preview)
- Follow/unfollow buttons
- Profile links

**Current status**: No onboarding exists

---

## Risk Assessment & Mitigation

### Potential Risks

#### Risk 1: Terms Modal Blocks Existing Users
**Impact**: Medium - Existing users see unexpected modal on next login  
**Mitigation**: 
- Add migration script to set `termsAcceptedAt` for users with `onboardingCompleted=true`
- Or: Accept minor friction as one-time event for legal compliance  
**Recommendation**: Migration script for users created before [deployment date]

#### Risk 2: Users Frustrated by Mandatory Tours
**Impact**: Low-Medium - Some users prefer exploring independently  
**Mitigation**:
- Keep tours short (6-7 steps each)
- Use clear, concise language
- Provide visual indicators of progress
- Allow restart from menu if accidentally dismissed  
**Recommendation**: Monitor analytics for drop-off rates

#### Risk 3: Mobile UX Issues
**Impact**: Medium - Complex modals on small screens  
**Mitigation**:
- Test extensively on mobile devices
- Use full-screen modals on mobile (< 768px)
- Ensure touch targets are >44px
- Test on iOS Safari, Chrome mobile  
**Recommendation**: Mobile-first testing before deployment

#### Risk 4: API Failures During Acceptance
**Impact**: Low - Network issues could prevent terms acceptance  
**Mitigation**:
- Show clear error message with retry button
- Don't close modal on failure
- Log errors to Sentry for monitoring
- Add timeout handling (10s)  
**Recommendation**: Implement retry logic with exponential backoff

---

## Analytics & Monitoring

### Metrics to Track

**Completion Rates**:
- % of users who accept terms
- % who complete map tour
- % who complete locations tour
- % who complete people tour
- Time to complete each tour

**Engagement**:
- Feature usage before/after onboarding
- User retention (D1, D7, D30) by completion status
- Tour restart frequency

**Drop-off Points**:
- Which tour step has highest exit rate
- Time spent on terms modal
- Skip attempts (if any button clicked)

### Implementation
Add to existing analytics (Google Analytics, Mixpanel, etc.):
```typescript
// Track tour completion
analytics.track('Onboarding Completed', {
  type: 'map' | 'locations' | 'people',
  duration: timeInSeconds,
  stepsCompleted: 9,
});

// Track terms acceptance
analytics.track('Terms Accepted', {
  version: '1.0',
  scrolledToBottom: true,
});
```

---

## Future Enhancements

### Phase 7: Advanced Features (Post-MVP)

1. **Interactive Tutorials**
   - Actual task completion (e.g., "Create your first location")
   - Gamification with progress badges
   - Achievement system for feature mastery

2. **Contextual Help**
   - Inline tooltips on hover (first 3 times)
   - "?" icon next to complex features
   - Help center integration

3. **Video Tutorials**
   - Embedded YouTube/Vimeo walkthroughs
   - Screen recordings for complex workflows
   - Alternative for users who prefer video

4. **Onboarding Analytics Dashboard (Admin)**
   - Real-time completion rates
   - Drop-off visualization
   - A/B testing different tour flows

5. **Personalized Onboarding**
   - Different tours for different user types
   - Skip certain steps based on user role
   - Dynamic content based on usage patterns

---

## Appendix

### A. Terms Modal Scroll Tracking Implementation

```typescript
const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);

const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
  const target = e.currentTarget;
  const scrollPercentage = 
    (target.scrollTop + target.clientHeight) / target.scrollHeight;
  
  if (scrollPercentage > 0.9 && !hasScrolledToBottom) {
    setHasScrolledToBottom(true);
  }
};

return (
  <div 
    onScroll={handleScroll}
    className="max-h-96 overflow-y-auto"
  >
    {/* Terms content */}
  </div>
);
```

### B. Tour Step Best Practices

**Do**:
✅ Keep messages under 100 characters  
✅ Use action verbs ("Click", "Explore", "View")  
✅ Highlight benefits, not just features  
✅ Use emojis sparingly for visual interest  
✅ Show keyboard shortcuts when relevant

**Don't**:
❌ Overwhelm with technical jargon  
❌ Include more than 10 steps per tour  
❌ Block critical functionality during tour  
❌ Use confusing or ambiguous language  
❌ Skip testing on actual devices

### C. Database Query Examples

**Check if user needs terms acceptance**:
```sql
SELECT id, email, termsAcceptedAt, termsVersion
FROM users
WHERE termsAcceptedAt IS NULL
  AND emailVerified = true
LIMIT 100;
```

**Find users who completed all onboarding**:
```sql
SELECT id, email, createdAt
FROM users
WHERE onboardingCompleted = true
  AND locationsOnboardingCompleted = true
  AND peopleOnboardingCompleted = true;
```

**Analytics: Onboarding completion rate**:
```sql
SELECT 
  COUNT(*) FILTER (WHERE onboardingCompleted) * 100.0 / COUNT(*) as map_completion_rate,
  COUNT(*) FILTER (WHERE locationsOnboardingCompleted) * 100.0 / COUNT(*) as locations_completion_rate,
  COUNT(*) FILTER (WHERE peopleOnboardingCompleted) * 100.0 / COUNT(*) as people_completion_rate
FROM users
WHERE emailVerified = true;
```

---

## Document Version History

- **v1.0** - February 5, 2026 - Initial comprehensive plan
- Created from onboarding research and user requirements
- Covers database schema, components, API routes, testing, and deployment
