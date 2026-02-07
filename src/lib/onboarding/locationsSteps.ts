import { Step } from 'react-joyride';

export const locationsSteps: Step[] = [
  {
    target: '[data-tour="locations-search"]',
    content: 'Search your saved locations by name, address, city, state, or even your custom tags.',
    disableBeacon: true,
    placement: 'bottom',
  },
  {
    target: '[data-tour="locations-view-toggle"]',
    content: 'Switch between grid view (with photos) and compact list view for different browsing experiences.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="locations-filter"]',
    content: 'Click here to filter your locations by type, show only favorites, or change the sort order.',
    placement: 'bottom-start',
  },
  {
    target: '[data-tour="location-card"]',
    content: 'Click any location card to view full details, photos, and all your notes.',
    placement: 'right',
    isFixed: true,
    styles: {
      spotlight: {
        transform: 'translateY(65px)',
      },
    },
  },
  {
    target: '[data-tour="location-share"]',
    content: 'Share your favorite locations with friends via a link, or directly to other fotolokashen users.',
    placement: 'right',
    isFixed: true,
    styles: {
      spotlight: {
        transform: 'translateY(65px)',
      },
    },
  },
];
