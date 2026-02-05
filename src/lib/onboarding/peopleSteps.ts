import { Step } from 'react-joyride';

export const peopleSteps: Step[] = [
  {
    target: '[data-tour="people-tabs"]',
    content: 'Navigate between Discover, Following, and Followers tabs to explore different views of your connections.',
    disableBeacon: true,
    placement: 'bottom',
  },
  {
    target: '[data-tour="people-search"]',
    content: 'Search for people by username, bio, or location. Results update as you type.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="people-filters"]',
    content: 'Filter search results by location (city, country) or search type to find exactly who you\'re looking for.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="people-user-card"]',
    content: 'Click any user card to view their full profile, saved locations, and activity.',
    placement: 'top',
  },
  {
    target: '[data-tour="people-follow"]',
    content: 'Follow users to see their public locations on the map and stay updated with their activity.',
    placement: 'left',
  },
  {
    target: '[data-tour="people-following-tab"]',
    content: 'View all the people you follow in one place. You can manage your connections here.',
    placement: 'bottom',
  },
];
