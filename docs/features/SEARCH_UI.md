# Search UI Implementation

**Phase 2A - Day 6**: Frontend search interface for user discovery

## Overview

Complete search user interface with autocomplete, filters, and responsive design.

## Components Created

### 1. SearchBar Component

**File:** `src/components/search/SearchBar.tsx`

**Features:**
- Real-time autocomplete with 300ms debounce
- Keyboard navigation (Arrow Up/Down, Enter, Escape)
- Click-outside to close suggestions
- Loading indicator
- Clear button
- Configurable (can be used standalone or embedded)

**Props:**
```typescript
interface SearchBarProps {
  placeholder?: string;           // Default: "Search users..."
  autoFocus?: boolean;             // Auto-focus on mount
  showFullResults?: boolean;       // Show "Search" button (default: true)
  onSearch?: (query: string) => void; // Custom search handler
}
```

**Usage:**
```tsx
// Standalone with navigation to /search page
<SearchBar />

// Embedded with custom handler
<SearchBar
  showFullResults={false}
  onSearch={(query) => console.log(query)}
/>
```

**Autocomplete Flow:**
1. User types (min 2 characters)
2. 300ms debounce delay
3. Fetch suggestions from `/api/v1/search/suggestions`
4. Display dropdown with clickable usernames
5. Click suggestion → Navigate to `/@username`
6. Press Enter → Navigate to `/search?q=...`

### 2. Search Results Page

**File:** `src/app/search/page.tsx`

**Features:**
- URL-based search (supports direct links)
- Real-time filtering
- Pagination with "Load More"
- Empty states and error handling
- Result count display
- Loading states (initial + load more)

**URL Parameters:**
- `?q=query` - Search query (required)

**States:**
- Loading (initial search)
- Loading more (pagination)
- Error (with message)
- Empty results
- Success (with results)
- Initial (no search yet)

### 3. UserSearchCard Component

**File:** `src/components/search/UserSearchCard.tsx`

**Features:**
- User avatar (with fallback to initials)
- Name and username display
- Bio preview (2-line clamp)
- Location display
- Match type badge (Username, Bio, Location, Geo)
- Match score indicator (for high scores)
- Clickable → Navigate to user profile

**Match Type Indicators:**
- 🔍 Username match
- 📄 Bio match
- 🌍 Location match (geographic)
- 📍 Location match (saved same place)

### 4. SearchFilters Component

**File:** `src/components/search/SearchFilters.tsx`

**Features:**
- Search type filter (All, Username, Bio, Location)
- Active filters display
- Clear individual filters
- Clear all filters button
- Badge-based UI

**Filter Types:**
- **All**: Search across all fields
- **Username**: Fuzzy username matching only
- **Bio**: Full-text bio search only
- **Location**: Geographic search only

## Navigation Integration

**File:** `src/components/layout/Navigation.tsx`

Added "Search" link to main navigation (authenticated users only).

**Navigation Items:**
- Home (unauthenticated)
- Map (authenticated)
- My Locations (authenticated)
- **Search** (authenticated) ← NEW

## User Flow

### Scenario 1: Quick Username Lookup

1. User clicks "Search" in navigation
2. Types "rod" in search bar
3. Autocomplete shows "rodczaro"
4. User clicks suggestion
5. Navigates to `/@rodczaro` profile

**Time:** ~2 seconds

### Scenario 2: Full Search with Filters

1. User clicks "Search" in navigation
2. Types "photographer" in search bar
3. Clicks "Search" button
4. Views results (username + bio matches)
5. Changes filter to "Bio" only
6. Results update to bio matches only
7. Scrolls down, clicks "Load More"
8. Views additional results

**Time:** ~10-15 seconds

### Scenario 3: Geographic Search

1. User searches for "Paris"
2. Views results with "Location match" badges
3. Clicks on a result
4. Views user profile from Paris

### Scenario 4: Direct Link

1. User receives link: `fotolokashen.com/search?q=photographer`
2. Opens link → Search page loads with results
3. Can adjust filters or search new query

## Responsive Design

### Desktop (≥768px)
- Full search bar with button
- Multi-column layout ready
- All features visible

### Mobile (<768px)
- Compact search bar
- Stacked layout
- Touch-optimized autocomplete
- Reduced match type labels (icons only)

## Performance Optimizations

### Debouncing
- **300ms debounce** on autocomplete to reduce API calls
- Cancels pending requests on new input

### Lazy Loading
- Results loaded 20 at a time
- "Load More" button for pagination
- Appends new results (doesn't re-fetch existing)

### State Management
- Minimal re-renders
- Proper cleanup on unmount
- Click-outside detection with event listeners

## Accessibility

### Keyboard Navigation
- Tab to search bar
- Type to search
- Arrow keys to navigate suggestions
- Enter to select/search
- Escape to close dropdown

### Screen Readers
- Semantic HTML (nav, main, etc.)
- Alt text on avatars
- Proper heading hierarchy
- Loading states announced

### Focus Management
- Auto-focus on search page (if no query)
- Clear button focuses input
- Suggestions accessible via keyboard

## Testing

### Manual Testing Checklist

- [ ] Autocomplete appears after 2 characters
- [ ] Autocomplete closes on click outside
- [ ] Keyboard navigation works (arrows, enter, escape)
- [ ] Search button navigates to results page
- [ ] Filters update results
- [ ] Load more appends results
- [ ] Empty state shows when no results
- [ ] Error state shows on API failure
- [ ] Match type badges display correctly
- [ ] User cards link to profiles
- [ ] Clear button works
- [ ] Direct URLs work (`/search?q=test`)

### Browser Testing

- [ ] Chrome/Edge (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Mobile Safari (iOS)
- [ ] Mobile Chrome (Android)

## Integration Points

### With Follow System (Day 3)
- Future: Show follow status on search cards
- Future: Filter by followers/following

### With Privacy Settings (Day 7)
- Future: Respect "hide from search" setting
- Future: Show only public profiles (if privacy implemented)

### With Map (Existing)
- Future: Search users who saved nearby locations
- Future: Show user locations on map from search

## Future Enhancements

### Search History
- Store recent searches (localStorage)
- Quick access to previous queries
- Clear history option

### Advanced Filters
- Date range (joined date)
- Activity level
- Has bio / Has location
- Verified users

### Search Analytics
- Track popular searches
- Suggest trending users
- Personalized recommendations

### Social Features
- Show mutual followers in results
- Highlight users in same location
- Show shared saved locations

## API Reference

See [docs/api/SEARCH_SYSTEM.md](../api/SEARCH_SYSTEM.md) for full API documentation.

**Quick Reference:**
```bash
# Autocomplete
GET /api/v1/search/suggestions?q=joh&limit=10

# Search
GET /api/v1/search/users?q=photographer&type=all&limit=20&offset=0
```

## File Structure

```
src/
├── app/
│   └── search/
│       └── page.tsx              # Search results page
└── components/
    └── search/
        ├── SearchBar.tsx          # Autocomplete search input
        ├── SearchFilters.tsx      # Filter badges UI
        └── UserSearchCard.tsx     # Individual result card
```

## Styling

All components use shadcn/ui design system:
- Card, Badge, Button, Input components
- Tailwind CSS for layout
- Lucide icons for visual elements
- Consistent with existing app design

## Status

✅ **Day 6 - COMPLETE**

**Completed:**
- SearchBar component with autocomplete
- Search results page
- UserSearchCard component
- SearchFilters component
- Navigation integration
- Responsive design
- Keyboard navigation
- Error handling
- Loading states
- Empty states

**Next:** Day 7 - Privacy & Visibility Settings

## Related Documentation

- [Search System API](../api/SEARCH_SYSTEM.md) - Backend API
- [Follow System](../api/FOLLOW_SYSTEM.md) - User relationships
- [Phase 2A Planning](../planning/PHASE_2A_PLANNING.md) - Overall timeline
