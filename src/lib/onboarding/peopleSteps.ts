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
    target: '[data-tour="people-following-tab"]',
    content: 'View all the people you follow in one place. You can manage your connections here.',
    placement: 'bottom',
  },
];
