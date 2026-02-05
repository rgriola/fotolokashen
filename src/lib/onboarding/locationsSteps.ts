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
    content: 'Filter your locations by type (Nature, Urban, Indoor/Outdoor), show only favorites, or change the sort order.',
    placement: 'bottom-start',
  },
  {
    target: '[data-tour="locations-sort"]',
    content: 'Sort your locations by most recent, oldest, name (A-Z or Z-A), or by your personal rating.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="location-card"]',
    content: 'Click any location card to view full details, photos, and all your notes. Use the action buttons to edit, share, or delete.',
    placement: 'top',
  },
  {
    target: '[data-tour="location-edit"]',
    content: 'Edit any location to add your personal rating, caption, tags, or mark it as a favorite. You can also upload photos!',
    placement: 'left',
  },
  {
    target: '[data-tour="location-share"]',
    content: 'Share your favorite locations with friends via a link, or directly to other fotolokashen users.',
    placement: 'left',
  },
];
