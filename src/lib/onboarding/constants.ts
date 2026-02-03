export const ONBOARDING_CONFIG = {
  VERSION: 1,
  TOTAL_STEPS: 9, // Complete tour: all map controls
  ESTIMATED_DURATION_MINUTES: 2,
  
  // Feature flags
  ENABLE_WELCOME_MODAL: true,
  ENABLE_COMPLETION_MODAL: true,
  ENABLE_CONFETTI: false, // Can enable with canvas-confetti later
  
  // Behavior
  AUTO_START_ON_FIRST_LOGIN: true,
  ALLOW_SKIP: true,
  SAVE_PROGRESS: true,
  RESUME_ON_RETURN: true,
  
  // Timing
  STEP_DELAY_MS: 300,
  TOOLTIP_ANIMATION_MS: 200,
} as const;

export const TOUR_STEP_IDS = {
  SEARCH: 'search',
  SAVE_LOCATION: 'save-location',
  MY_LOCATIONS: 'my-locations',
  PROFILE_MENU: 'profile-menu',
} as const;
