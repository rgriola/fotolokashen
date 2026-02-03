import { Step } from 'react-joyride';

// Complete Tour: All Map Controls (9 Steps)
export const ONBOARDING_STEPS: Step[] = [
  {
    target: '[data-tour="search-button"]',
    content: 'Use Google Maps to search for a specific production location. Try searching for Yankee Stadium.',
    title: 'Google World Wide Search',
    placement: 'right',
    offset: 10,
    disableBeacon: true,
    spotlightClicks: false,
  },
  {
    target: '[data-tour="gps-toggle"]',
    content: 'Show your current GPS location on the map. This is private and only visible to you.',
    title: 'Your GPS Location',
    placement: 'right',
    offset: 10,
  },
  {
    target: '[data-tour="friends-button"]',
    content: 'View locations shared by your friends. Connect with colleagues to discover great production spots.',
    title: 'Friends\' Locations',
    placement: 'right',
    offset: 10,
  },
  {
    target: '[data-tour="view-all-button"]',
    content: 'Instantly view all your saved locations on the map at once. Perfect for planning multi-location shoots.',
    title: 'View All Locations',
    placement: 'right',
    offset: 10,
  },
  {
    target: '[data-tour="public-toggle"]',
    content: 'Explore public locations shared by the fotolokashen community. Toggle off to see only your locations.',
    title: 'Community Locations',
    placement: 'right',
    offset: 10,
  },
  {
    target: '[data-tour="my-locations-button"]',
    content: 'One-click access to your complete production locations collection with search and filters.',
    title: 'Locations Collection',
    placement: 'right',
    offset: 10,
  },
  {
    target: '[data-tour="create-with-photo"]',
    content: 'Have a photo with GPS data? Upload it to automatically create a location with all the details!',
    title: 'Create from Photo',
    placement: 'right',
    offset: 10,
  },
  {
    target: '[data-tour="profile-menu"]',
    content: 'Manage your account profile, privacy settings, projects and preferences here.',
    title: 'Account Settings',
    placement: 'bottom-end',
  },
  {
    target: 'body',
    content: (
      <div className="flex flex-col items-center gap-4">
        <svg width="64" height="76" viewBox="0 0 40 48" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-lg">
          <rect x="0" y="0" width="40" height="40" rx="4" fill="#4F46E5" stroke="white" strokeWidth="2"/>
          <g transform="translate(10, 10)">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" 
                  fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="12" cy="13" r="4" fill="none" stroke="white" strokeWidth="2"/>
          </g>
          <path d="M 20 48 L 12 40 L 28 40 Z" fill="#4F46E5"/>
        </svg>
        <p className="text-center">
          Doing is the best way to learn. Click anywhere on the map and a camera icon will appear for your first save. Add photos, descriptions and share.
        </p>
      </div>
    ),
    title: 'Start Exploring',
    placement: 'center',
  },
];

// V2: Additional Steps (for future enhancement)
export const ONBOARDING_STEPS_V2: Step[] = [
  ...ONBOARDING_STEPS,
  {
    target: '[data-tour="public-toggle"]',
    content: 'This toggle shows all memeber public locations and your friends saved locations.',
    title: 'Share Production Advice',
    placement: 'left',
  },
  {
    target: '[data-tour="create-with-photo"]',
    content: 'Use Photo Data to create locations automatically',
    title: 'Click to Save',
    placement: 'left',
  },
  {
    target: '[data-tour="gps-toggle"]',
    content: 'Show your current location. This is not shared with anyone but you.',
    title: 'Locator',
    placement: 'left',
  },
];
