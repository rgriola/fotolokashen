# User Onboarding Implementation Plan

**Status**: � In Progress  
**Priority**: High  
**Estimated Time**: 11-15 hours (MVP: 4 steps)  
**Created**: January 12, 2026  
**Updated**: February 2, 2026

---

## Overview

Implement an interactive onboarding tour to guide new users through fotolokashen's core features, improving user activation and reducing confusion.

### Goals
- ✅ Increase feature discovery
- ✅ Reduce time to first saved location
- ✅ Improve user retention
- ✅ Decrease support requests
- ✅ Create delightful first experience

---

## Technology Stack Decision

### **Recommended: React Joyride**

**Library**: `react-joyride` v2.8+  
**Size**: ~50kb gzipped  
**License**: MIT  
**Docs**: https://docs.react-joyride.com/

**Why React Joyride:**
- ✅ Battle-tested (100k+ weekly downloads)
- ✅ Built-in spotlight/overlay system
- ✅ Highly customizable styling
- ✅ Progress tracking built-in
- ✅ Mobile responsive
- ✅ TypeScript support
- ✅ Active maintenance

**Alternatives Considered:**
- **Driver.js** - Lighter (5kb) but less customizable
- **Intro.js** - Commercial license required for some features
- **Custom Solution** - Too time-intensive, reinventing wheel

---

## User Flow

### Trigger Points

**Primary Trigger:**
- First login after email verification
- Show welcome modal immediately

**Secondary Triggers:**
- "Start Tour" button in profile dropdown menu
- Help icon (?) in header (always accessible)
- Tour reset after major feature updates (optional)

**Conditions to Show:**
```
Show onboarding IF:
  - User is authenticated
  - User email is verified
  - onboardingCompleted = false
  - onboardingSkipped = false
  - User is on /map page
```

---

## Onboarding Steps

### **Pre-Tour: Welcome Modal**

```
┌─────────────────────────────────────────────┐
│                                             │
│           [fotolokashen Logo]               │
│                                             │
│         Welcome to fotolokashen!            │
│                                             │
│   We'll show you around in 2 minutes.      │
│   You can skip or restart anytime.         │
│                                             │
│   ○ ○ ○ ○ ○ ○  (6 steps)                   │
│                                             │
│   [Maybe Later]        [Let's Go! →]        │
│                                             │
└─────────────────────────────────────────────┘
```

**Actions:**
- "Maybe Later" → Set `onboardingSkipped = true`, close modal
- "Let's Go!" → Start tour, close modal

---

### **Tour Steps** (MVP: 4 Core Steps)

**Note**: Start with 4 essential steps for MVP. Add remaining steps in V2 after validating core experience.

#### Step 1: Search & Discovery
**Target**: `[data-tour="search-button"]` (Map search button)  
**Position**: Bottom  
**Title**: "Search Anywhere"  
**Content**: "Search for any location worldwide using Google Maps. Try searching for your favorite coffee shop!"  
**Action**: None (informational)

#### Step 2: Save Location
**Target**: `[data-tour="save-location-button"]`  
**Position**: Bottom  
**Title**: "Save Locations"  
**Content**: "Found a great spot? Click here to save it to your collection with photos, notes, and ratings."  
**Action**: None (informational)

#### Step 3: My Locations Panel
**Target**: `[data-tour="my-locations-button"]` (MapControls button with pin icon)  
**Position**: Left  
**Title**: "Your Collection"  
**Content**: "View all your saved locations here. Click to see your list and manage your places."  
**Action**: None (informational)

#### Step 4: Profile & Settings
**Target**: `[data-tour="profile-menu"]` (AuthButton)  
**Position**: Bottom-end  
**Title**: "Your Account"  
**Content**: "Access your profile, settings, and restart this tour anytime from here."  
**Action**: None (informational)

---

### **V2 Steps** (Add After MVP Validation)

#### Step 5: Explore Public Locations
**Target**: `[data-tour="public-toggle"]` (Purple Map button)  
**Position**: Left  
**Title**: "Discover Public Locations"  
**Content**: "Toggle this to explore locations shared by other users from around the world!"  
**Action**: None (informational)

#### Step 6: Create from Photo
**Target**: `[data-tour="create-with-photo"]` (Green Plus button)  
**Position**: Left  
**Title**: "Upload Photos with GPS"  
**Content**: "Have a photo with GPS data? Upload it to automatically create a location with all the details!"  
**Action**: None (informational)

#### Step 7: GPS Location
**Target**: `[data-tour="gps-toggle"]` (Blue Navigation button)  
**Position**: Left  
**Title**: "Find Your Location"  
**Content**: "Click to show your current GPS location on the map and quickly save nearby places."  
**Action**: None (informational)

---

### **Post-Tour: Completion Modal**

```
┌─────────────────────────────────────────────┐
│                                             │
│               🎉 [Confetti]                 │
│                                             │
│              You're All Set!                │
│                                             │
│   You've completed the tour. Ready to      │
│   start saving your favorite locations?    │
│                                             │
│   💡 Tip: You can restart this tour        │
│   anytime from your profile menu.          │
│                                             │
│              [Start Exploring →]            │
│                                             │
└─────────────────────────────────────────────┘
```

**Actions:**
- "Start Exploring" → Set `onboardingCompleted = true`, close modal
- Optional: Auto-open save location panel as next action

---

## Database Schema Changes

### Migration: Add Onboarding Fields to User Table

```prisma
// prisma/schema.prisma

model User {
  id                    Int       @id @default(autoincrement())
  email                 String    @unique
  username              String    @unique
  // ...existing fields...
  
  // Onboarding Tracking (TypeScript camelCase, DB snake_case)
  onboardingCompleted   Boolean   @default(false) @map("onboarding_completed")
  onboardingStep        Int?      @map("onboarding_step") // Last completed step (0-4 for MVP, 0-7 for full)
  onboardingSkipped     Boolean   @default(false) @map("onboarding_skipped")
  onboardingStartedAt   DateTime? @map("onboarding_started_at")
  onboardingCompletedAt DateTime? @map("onboarding_completed_at")
  onboardingVersion     Int       @default(1) @map("onboarding_version") // Track tour version for updates
  
  // ...rest of schema...
}
```

### Migration File

```sql
-- prisma/migrations/[timestamp]_add_user_onboarding/migration.sql

ALTER TABLE "User" ADD COLUMN "onboarding_completed" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN "onboarding_step" INTEGER;
ALTER TABLE "User" ADD COLUMN "onboarding_skipped" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN "onboarding_started_at" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN "onboarding_completed_at" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN "onboarding_version" INTEGER NOT NULL DEFAULT 1;
```

**Commands:**
```bash
npm run db:generate
npm run db:push  # for development
# OR
npm run db:migrate  # for production
```

---

## File Structure

```
src/
├── components/
│   └── onboarding/
│       ├── OnboardingProvider.tsx        # Context provider for tour state
│       ├── OnboardingTour.tsx            # Main Joyride component wrapper
│       ├── WelcomeModal.tsx              # Initial welcome screen
│       ├── CompletionModal.tsx           # Success/completion screen
│       ├── TourTooltip.tsx               # Custom styled tooltip component
│       └── onboarding-steps.ts           # Step definitions and content
│
├── hooks/
│   └── useOnboarding.ts                  # Hook for onboarding state/actions
│
├── lib/
│   └── onboarding/
│       ├── constants.ts                  # Step IDs, tour version, config
│       └── utils.ts                      # Helper functions
│
└── app/
    └── api/
        └── onboarding/
            ├── start/route.ts            # POST - Start onboarding
            ├── progress/route.ts         # PUT - Update step progress
            ├── complete/route.ts         # POST - Mark complete
            └── skip/route.ts             # POST - Skip tour
```

**New Files to Create**: 11 files  
**Files to Modify**: 5 files
- `src/app/map/page.tsx` - Add OnboardingProvider wrapper
- `src/components/layout/AuthButton.tsx` - Add "Restart Tour" menu item + data-tour attribute
- `src/components/maps/MapControls.tsx` - Add data-tour attributes to buttons
- `src/components/locations/SaveLocationPanel.tsx` - Add data-tour="save-location-button"
- `prisma/schema.prisma` - Add onboarding fields with snake_case mapping

---

## Implementation Phases

### **Phase 1: Setup & Infrastructure** (2 hours)

**Tasks:**
1. Install dependencies
   ```bash
   npm install react-joyride
   npm install --save-dev @types/react-joyride
   ```

2. Create database migration
   ```bash
   # Add fields to schema.prisma
   npx prisma migrate dev --name add_user_onboarding
   ```

3. Create file structure
   - Create all directories
   - Create placeholder files with TypeScript interfaces

4. Set up API routes
   - `/api/onboarding/start`
   - `/api/onboarding/progress`
   - `/api/onboarding/complete`
   - `/api/onboarding/skip`

**Deliverables:**
- ✅ Dependencies installed
- ✅ Database schema updated
- ✅ File structure created
- ✅ API routes scaffolded

---

### **Phase 2: Core Components** (4-6 hours)

**Tasks:**

1. **Create OnboardingProvider** (`OnboardingProvider.tsx`)
   - Manage tour state (running, step, completed)
   - Provide tour control functions (start, skip, next, prev, end)
   - Sync with database via API calls
   - Handle localStorage for offline state

2. **Create OnboardingTour** (`OnboardingTour.tsx`)
   - Wrap react-joyride component
   - Connect to provider state
   - Handle step callbacks
   - Implement custom styling

3. **Define Tour Steps** (`onboarding-steps.ts`)
   - Create MVP step configuration array (4 steps)
   - Define targets, content, positioning
   - Set up step progression logic
   - Prepare V2 steps array for future use

4. **Create WelcomeModal** (`WelcomeModal.tsx`)
   - Design welcome screen
   - Add start/skip buttons
   - Show step count preview
   - Animate entrance

5. **Create CompletionModal** (`CompletionModal.tsx`)
   - Design success screen
   - Add confetti animation (optional: use `canvas-confetti`)
   - Provide next actions
   - Celebrate completion

**Deliverables:**
- ✅ Working provider with state management
- ✅ Joyride integration complete
- ✅ All 6 steps defined
- ✅ Welcome modal functional
- ✅ Completion modal functional

---

### **Phase 3: Custom Styling** (3-4 hours)

**Tasks:**

1. **Style Tooltip Component** (`TourTooltip.tsx`)
   - Match fotolokashen brand colors
   - Add custom arrow styling
   - Responsive sizing
   - Add step counter (e.g., "2 of 6")

2. **Style Modals**
   - Welcome modal design
   - Completion modal design
   - Match existing UI patterns
   - Add animations/transitions

3. **Spotlight & Overlay**
   - Customize overlay opacity
   - Adjust spotlight padding
   - Add custom animations
   - Ensure accessibility (proper z-index)

4. **Mobile Responsiveness**
   - Adjust tooltip positions for mobile
   - Reorder steps if needed for mobile UX
   - Test on various screen sizes
   - Ensure touch targets are large enough

**Deliverables:**
- ✅ Custom styled tooltips
- ✅ Branded modals
- ✅ Smooth animations
- ✅ Mobile responsive design

---

### **Phase 4: Integration** (2-3 hours)

**Tasks:**

1. **Integrate into Map Page**
   - Wrap map page with OnboardingProvider
   - Add data-tour attributes to target elements
   - Trigger tour on first login
   - Handle tour start/end events

2. **Add Tour Restart Option**
   - Add "Take Tour Again" to profile menu (AuthButton)
   - Handle restart logic (reset progress)
   - Confirm before restarting if partial progress

3. **Database Sync**
   - Save progress on each step
   - Update completion status
   - Track skip vs complete
   - Handle interrupted tours (resume capability)

4. **Add Help Access**
   - Add (?) help icon to header (optional)
   - Link to restart tour
   - Link to support/docs

**Deliverables:**
- ✅ Tour integrated into map page
- ✅ Restart option available
- ✅ Database tracking working
- ✅ Help access added

---

### **Phase 5: Testing & Polish** (2-3 hours)

**Tasks:**

1. **Functional Testing**
   - Test complete tour flow
   - Test skip functionality
   - Test resume from interruption
   - Test restart functionality
   - Test conditional steps

2. **Cross-Browser Testing**
   - Chrome/Edge
   - Firefox
   - Safari
   - Mobile browsers (iOS Safari, Chrome Mobile)

3. **Responsive Testing**
   - Desktop (1920px, 1440px, 1024px)
   - Tablet (768px)
   - Mobile (375px, 414px)

4. **Edge Cases**
   - User navigates away mid-tour
   - User refreshes page
   - User logs out during tour
   - Tour conflicts with existing modals
   - Fast clicking through steps

5. **Accessibility**
   - Keyboard navigation
   - Screen reader compatibility
   - Focus management
   - Color contrast

6. **Performance**
   - Check bundle size impact
   - Optimize images/animations
   - Ensure smooth transitions
   - No layout shifts

**Deliverables:**
- ✅ All tests passed
- ✅ Cross-browser compatible
- ✅ Mobile responsive
- ✅ Edge cases handled
- ✅ Accessible
- ✅ Performant

---

## Code Examples

### 1. OnboardingProvider Example

```typescript
// src/components/onboarding/OnboardingProvider.tsx
'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface OnboardingContextType {
  isRunning: boolean;
  currentStep: number;
  isCompleted: boolean;
  isSkipped: boolean;
  startTour: () => void;
  endTour: () => void;
  skipTour: () => void;
  setStep: (step: number) => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [isRunning, setIsRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isSkipped, setIsSkipped] = useState(false);

  const startTour = useCallback(async () => {
    setIsRunning(true);
    setCurrentStep(0);
    // Call API to mark tour started
    await fetch('/api/onboarding/start', { method: 'POST' });
  }, []);

  const endTour = useCallback(async () => {
    setIsRunning(false);
    setIsCompleted(true);
    // Call API to mark tour completed
    await fetch('/api/onboarding/complete', { method: 'POST' });
  }, []);

  const skipTour = useCallback(async () => {
    setIsRunning(false);
    setIsSkipped(true);
    // Call API to mark tour skipped
    await fetch('/api/onboarding/skip', { method: 'POST' });
  }, []);

  const setStep = useCallback(async (step: number) => {
    setCurrentStep(step);
    // Call API to save progress
    await fetch('/api/onboarding/progress', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ step }),
    });
  }, []);

  return (
    <OnboardingContext.Provider
      value={{
        isRunning,
        currentStep,
        isCompleted,
        isSkipped,
        startTour,
        endTour,
        skipTour,
        setStep,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within OnboardingProvider');
  }
  return context;
}
```

### 2. Tour Steps Definition

```typescript
// src/components/onboarding/onboarding-steps.ts
import { Step } from 'react-joyride';

// MVP: 4 Core Steps
export const ONBOARDING_STEPS: Step[] = [
  {
    target: '[data-tour="search-button"]',
    content: 'Search for any location worldwide using Google Maps. Try searching for your favorite coffee shop!',
    title: 'Search Anywhere',
    placement: 'bottom',
    disableBeacon: true, // No initial beacon, start immediately
    spotlightClicks: false, // Prevent clicks on highlighted element during tour
  },
  {
    target: '[data-tour="save-location-button"]',
    content: 'Found a great spot? Click here to save it to your collection with photos, notes, and ratings.',
    title: 'Save Locations',
    placement: 'bottom',
  },
  {
    target: '[data-tour="my-locations-button"]',
    content: 'View all your saved locations here. Click to see your list and manage your places.',
    title: 'Your Collection',
    placement: 'left',
  },
  {
    target: '[data-tour="profile-menu"]',
    content: 'Access your profile, settings, and restart this tour anytime from here.',
    title: 'Your Account',
    placement: 'bottom-end',
  },
];

// V2: Additional Steps (add after MVP validation)
export const ONBOARDING_STEPS_V2: Step[] = [
  ...ONBOARDING_STEPS,
  {
    target: '[data-tour="public-toggle"]',
    content: 'Toggle this to explore locations shared by other users from around the world!',
    title: 'Discover Public Locations',
    placement: 'left',
  },
  {
    target: '[data-tour="create-with-photo"]',
    content: 'Have a photo with GPS data? Upload it to automatically create a location with all the details!',
    title: 'Upload Photos with GPS',
    placement: 'left',
  },
  {
    target: '[data-tour="gps-toggle"]',
    content: 'Click to show your current GPS location on the map and quickly save nearby places.',
    title: 'Find Your Location',
    placement: 'left',
  },
];
```

### 3. OnboardingTour Component

```typescript
// src/components/onboarding/OnboardingTour.tsx
'use client';

import Joyride, { CallBackProps, STATUS, EVENTS } from 'react-joyride';
import { useOnboarding } from './OnboardingProvider';
import { ONBOARDING_STEPS } from './onboarding-steps';
import { TourTooltip } from './TourTooltip';

export function OnboardingTour() {
  const { isRunning, currentStep, endTour, setStep } = useOnboarding();

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status, action, index, type } = data;

    // Update step on each step change
    if (type === EVENTS.STEP_AFTER) {
      setStep(index + 1);
    }

    // Handle tour completion
    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      endTour();
    }
  };

  return (
    <Joyride
      steps={ONBOARDING_STEPS}
      run={isRunning}
      stepIndex={currentStep}
      continuous
      showProgress
      showSkipButton
      callback={handleJoyrideCallback}
      tooltipComponent={TourTooltip}
      styles={{
        options: {
          zIndex: 10000,
          primaryColor: '#4F46E5', // Indigo-600
          backgroundColor: '#ffffff',
          textColor: '#1F2937',
          overlayColor: 'rgba(0, 0, 0, 0.5)',
          spotlightShadow: '0 0 15px rgba(79, 70, 229, 0.5)',
        },
      }}
      floaterProps={{
        disableAnimation: false,
      }}
    />
  );
}
```

### 4. API Route Example

```typescript
// src/app/api/onboarding/complete/route.ts
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/api-middleware';

export async function POST(request: Request) {
  const auth = await requireAuth(request);
  if (!auth.authenticated) {
    return Response.json({ error: auth.error }, { status: 401 });
  }

  const user = auth.user; // PublicUser type (no password)

  try {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        onboardingCompleted: true,
        onboardingCompletedAt: new Date(),
        onboardingStep: 4, // MVP: 4 steps (or 7 for full version)
      },
    });

    return Response.json({
      success: true,
      message: 'Onboarding completed',
    });
  } catch (error) {
    console.error('Onboarding completion error:', error);
    return Response.json(
      { error: 'Failed to complete onboarding' },
      { status: 500 }
    );
  }
}
```

### 5. Data Tour Attributes

**IMPORTANT**: No data-tour attributes currently exist. These must be added to components.

Add these attributes to your existing components:

```tsx
// MapControls.tsx - Search button (desktop)
<Button
  data-tour="search-button"
  onClick={onSearchClick}
  className="bg-white hover:bg-gray-50..."
>
  <Search className="w-5 h-5" />
</Button>

// MapControls.tsx - My Locations button (desktop)
<Button
  data-tour="my-locations-button"
  onClick={onMyLocationsClick}
  className="bg-white hover:bg-gray-50..."
>
  <MapPinIcon className="w-5 h-5" />
  {savedLocationsCount > 0 && <span>...</span>}
</Button>

// AuthButton.tsx - Profile button/avatar
<Button
  data-tour="profile-menu"
  variant="ghost"
  // ...other props
>
  {/* Avatar or menu trigger */}
</Button>

// When implementing save location panel, add:
<Button
  data-tour="save-location-button"
  onClick={handleSave}
>
  Save Location
</Button>

// V2 Attributes (for additional steps):
// - data-tour="public-toggle" (Purple Map button in MapControls)
// - data-tour="create-with-photo" (Green Plus button in MapControls)
// - data-tour="gps-toggle" (Blue Navigation button in MapControls)
```

---

## Configuration Constants

```typescript
// src/lib/onboarding/constants.ts

export const ONBOARDING_CONFIG = {
  VERSION: 1, // Increment when tour changes significantly
  TOTAL_STEPS: 4, // MVP (7 for full V2)
  ESTIMATED_DURATION_MINUTES: 1, // MVP is faster
  
  // Feature flags
  ENABLE_WELCOME_MODAL: true,
  ENABLE_COMPLETION_MODAL: true,
  ENABLE_CONFETTI: true,
  
  // Behavior
  AUTO_START_ON_FIRST_LOGIN: true,
  ALLOW_SKIP: true,
  SAVE_PROGRESS: true,
  RESUME_ON_RETURN: true,
  
  // Timing
  STEP_DELAY_MS: 300, // Delay before showing next step
  TOOLTIP_ANIMATION_MS: 200,
};

export const TOUR_STEP_IDS = {
  SEARCH: 'search',
  SAVE_LOCATION: 'save-location',
  SAVED_PANEL: 'saved-panel',
  PHOTO_UPLOAD: 'photo-upload',
  MAP_CONTROLS: 'map-controls',
  PROFILE_MENU: 'profile-menu',
} as const;
```

---

## Analytics & Metrics

### Events to Track (Optional)

```typescript
// Track these events for insights
const ONBOARDING_EVENTS = {
  TOUR_STARTED: 'onboarding_started',
  TOUR_COMPLETED: 'onboarding_completed',
  TOUR_SKIPPED: 'onboarding_skipped',
  STEP_VIEWED: 'onboarding_step_viewed',
  STEP_SKIPPED: 'onboarding_step_skipped',
  TOUR_RESTARTED: 'onboarding_restarted',
};

// Example tracking function
function trackOnboardingEvent(event: string, data?: any) {
  // Send to your analytics service (GA4, Mixpanel, etc.)
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', event, data);
  }
}
```

### Metrics to Monitor

- **Completion Rate**: % users who complete tour
- **Drop-off Points**: Which step users abandon
- **Skip Rate**: % users who skip tour
- **Time to Complete**: Average duration
- **Restart Rate**: % users who restart tour
- **Feature Adoption**: Usage of features shown in tour

---

## User Experience Best Practices

### ✅ DO:
- Keep steps concise (max 2-3 sentences)
- Use action-oriented language
- Show progress indicator
- Allow skipping at any time
- Celebrate completion
- Make tour re-accessible
- Test on mobile thoroughly
- Use clear visual indicators

### ❌ DON'T:
- Force users through tour
- Block critical functionality
- Make steps too long/wordy
- Use technical jargon
- Overwhelm with too many steps (max 8)
- Forget mobile experience
- Auto-advance without user action
- Lose user progress on refresh

---

## Accessibility Considerations

1. **Keyboard Navigation**
   - Tab through tour controls
   - Escape key to close/skip
   - Enter to advance

2. **Screen Readers**
   - Proper ARIA labels
   - Announce step changes
   - Describe highlighted elements

3. **Focus Management**
   - Trap focus within tooltip
   - Restore focus after tour ends
   - Clear focus indicators

4. **Color Contrast**
   - Ensure WCAG AA compliance
   - Don't rely solely on color
   - Test with color blindness simulators

---

## Rollout Strategy

### Phase A: Internal Testing (1-2 days)
- Test with team members
- Gather feedback
- Fix obvious issues

### Phase B: Beta Testing (3-5 days)
- Enable for 10% of new users
- Monitor completion rates
- Collect user feedback
- Fix issues

### Phase C: Gradual Rollout (1 week)
- 25% of new users
- 50% of new users
- 75% of new users
- 100% of new users

### Phase D: Iteration
- Analyze metrics
- Refine copy/steps
- A/B test variations
- Update based on feedback

---

## Future Enhancements

### V2 Features (Post-Launch)
- [ ] Contextual hints (persistent tooltips on first use)
- [ ] Feature-specific mini-tours (e.g., "Photo Upload Tour")
- [ ] Video tutorials in tooltips
- [ ] Interactive challenges (e.g., "Save your first location!")
- [ ] Gamification (badges, progress rewards)
- [ ] Personalized tours based on use case
- [ ] Multi-language support
- [ ] Tour analytics dashboard (admin)

---

## Dependencies

### NPM Packages to Install

```json
{
  "dependencies": {
    "react-joyride": "^2.8.0"
  },
  "devDependencies": {
    "@types/react-joyride": "^2.0.5"
  },
  "optionalDependencies": {
    "canvas-confetti": "^1.9.0"  // For completion celebration
  }
}
```

### Bundle Size Impact
- **react-joyride**: ~50kb gzipped
- **canvas-confetti**: ~8kb gzipped
- **Total**: ~58kb (acceptable for feature value)

---

## Success Criteria

### Must Have (MVP)
- ✅ 4 core steps functional (search, save, my locations, profile)
- ✅ Welcome modal works
- ✅ Skip functionality works
- ✅ Progress saved to database
- ✅ Mobile responsive
- ✅ No critical bugs
- ✅ data-tour attributes added to components

### Should Have
- ✅ Completion modal with celebration
- ✅ Restart tour from profile menu
- ✅ Resume interrupted tour
- ✅ Custom styling matches brand
- ✅ Smooth animations

### Nice to Have
- ✅ Analytics tracking
- ✅ A/B testing capability
- ✅ Video tutorials in steps
- ✅ Interactive challenges

---

## Risks & Mitigation

### Risk 1: User Skips Tour Immediately
**Impact**: Low feature discovery  
**Mitigation**: 
- Make tour valuable (show time investment upfront)
- Allow restart anytime
- Add contextual hints as fallback

### Risk 2: Tour Breaks on UI Changes
**Impact**: Poor user experience  
**Mitigation**:
- Use stable data attributes (data-tour)
- Version tours (update when UI changes)
- Add fallback for missing targets

### Risk 3: Mobile Experience Poor
**Impact**: Frustrated mobile users  
**Mitigation**:
- Test thoroughly on mobile first
- Adjust step order for mobile
- Use bottom positioning for mobile tooltips

### Risk 4: Performance Impact
**Impact**: Slow page load  
**Mitigation**:
- Lazy load Joyride library
- Optimize images in modals
- Code split onboarding components

---

## Maintenance Plan

### Regular Tasks
- **Monthly**: Review completion metrics
- **Quarterly**: Update tour for new features
- **Annually**: Major tour revision/redesign

### When to Update Tour
- Major UI redesign
- New core features added
- User feedback indicates confusion
- Completion rate drops below 60%

---

## Deployment Checklist

### Pre-Deployment
- [ ] All code reviewed
- [ ] Tests passing
- [ ] Database migration tested
- [ ] Mobile tested on real devices
- [ ] Accessibility audit completed
- [ ] Performance impact assessed

### Deployment
- [ ] Run database migration
- [ ] Deploy backend changes
- [ ] Deploy frontend changes
- [ ] Enable feature flag (if using)
- [ ] Monitor error logs

### Post-Deployment
- [ ] Verify tour works in production
- [ ] Monitor completion rates
- [ ] Watch for error spikes
- [ ] Collect user feedback
- [ ] Document issues/learnings

---

## Documentation Needed

### Developer Docs
- [ ] Setup instructions
- [ ] How to add new steps
- [ ] How to update tour version
- [ ] API documentation
- [ ] Troubleshooting guide

### User Docs
- [ ] How to restart tour
- [ ] How to skip tour
- [ ] FAQ about onboarding

---

## Questions to Answer Before Starting

1. **Do we want to make the tour mandatory for new users?**
   - Recommendation: No, always allow skip

2. **Should we re-show tour after major updates?**
   - Recommendation: Yes, with "What's New" variant

3. **Do we need analytics tracking?**
   - Recommendation: Yes, basic metrics at minimum

4. **Should we A/B test different tour flows?**
   - Recommendation: Start simple, iterate based on data

5. **Do we want video tutorials in tooltips?**
   - Recommendation: Phase 2 enhancement

---

## Estimated Costs

### Development Time

**MVP (4 Steps):**
- **Setup**: 2 hours
- **Core Development**: 4-5 hours
- **Styling**: 2-3 hours
- **Integration**: 2 hours
- **Testing**: 1-2 hours
- **Total MVP**: 11-14 hours

**Full Version (7 Steps):**
- **MVP**: 11-14 hours
- **Additional Steps**: 2-3 hours
- **Extra Testing**: 1-2 hours
- **Total Full**: 14-19 hours

### Third-Party Costs
- **react-joyride**: Free (MIT license)
- **canvas-confetti**: Free (ISC license)
- **No additional costs**

---

## Next Steps

### To Start Implementation:

1. **Review this plan** with team/stakeholders
2. **Get approval** on approach and scope
3. **Schedule time** (1-2 focused days or 1 sprint)
4. **Set up development environment**
   ```bash
   git checkout -b feature/user-onboarding
   npm install react-joyride @types/react-joyride
   ```
5. **Begin Phase 1** (Setup & Infrastructure)

### Before Starting:
- [ ] Confirm tour steps content
- [ ] Approve welcome/completion modal designs
- [ ] Decide on analytics tracking approach
- [ ] Review accessibility requirements
- [ ] Set success metrics/KPIs

---

## Resources

### Documentation
- React Joyride Docs: https://docs.react-joyride.com/
- Driver.js (alternative): https://driverjs.com/
- Intro.js (alternative): https://introjs.com/

### Design Inspiration
- Product tours: https://www.appcues.com/tour-examples
- Onboarding patterns: https://www.useronboard.com/

### Accessibility
- WCAG Guidelines: https://www.w3.org/WAI/WCAG21/quickref/
- Keyboard navigation: https://webaim.org/techniques/keyboard/

---

## Contact

**Questions about this plan?**
- Review with development team
- Consult UX designer for modal designs
- Test with actual users before full rollout

---

**Status**: 🚧 Starting implementation February 3, 2026  
**Last Updated**: February 2, 2026

---

## Implementation Notes (Feb 2, 2026)

### Current State
- No data-tour attributes exist yet in codebase
- Current auth uses requireAuth from @/lib/api-middleware (returns PublicUser)
- Database uses snake_case columns with @@map in Prisma
- Mobile UI uses Sheet (bottom drawer) for map controls
- /create-with-photo is dedicated page (not inline modal)

### MVP Strategy
- Start with 4 essential steps to validate approach
- Build V2 steps after user feedback
- Focus on desktop first, then mobile responsiveness
- Use existing shadcn/ui Dialog components for modals

### Before You Start
- [ ] Read through updated plan
- [ ] Install react-joyride and types
- [ ] Create feature branch: `git checkout -b feature/user-onboarding`
- [ ] Add onboarding fields to schema.prisma
- [ ] Run database migration
- [ ] Create file structure from Phase 1
