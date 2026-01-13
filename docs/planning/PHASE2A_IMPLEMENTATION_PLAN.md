# Phase 2A: Social Infrastructure - Implementation Plan

**Start Date:** January 13, 2026 (Ready to begin)  
**Estimated Duration:** 7-10 days  
**Status:** Planning Complete ✅  
**Prerequisites:** Phase 1 Complete ✅

---

## 🎯 Objectives

Build the social foundation layer that enables:
1. Users to discover and connect with each other
2. Follow/unfollow relationships (Instagram/Twitter style)
3. Advanced multi-criteria search
4. Visibility controls based on follower relationships
5. Foundation for Phase 2C sharing features

---

## 📋 Day-by-Day Plan

### Day 1: Database Schema & Models

**Objective:** Add follower system and search infrastructure

**Tasks:**
- [ ] Design `UserFollow` model schema
- [ ] Add indexes for performance
- [ ] Create migration file
- [ ] Test migration on development database
- [ ] Update Prisma Client types
- [ ] Add follower/following count to User model (computed fields)

**Database Changes:**

```prisma
model UserFollow {
  id          Int      @id @default(autoincrement())
  followerId  Int      // User who is following
  followingId Int      // User being followed
  createdAt   DateTime @default(now())
  
  follower    User     @relation("Following", fields: [followerId], references: [id], onDelete: Cascade)
  following   User     @relation("Followers", fields: [followingId], references: [id], onDelete: Cascade)
  
  @@unique([followerId, followingId])
  @@index([followerId])
  @@index([followingId])
  @@map("user_follows")
}

// Add to User model:
model User {
  // ...existing fields...
  following   UserFollow[] @relation("Following")
  followers   UserFollow[] @relation("Followers")
  
  // Add full-text search index in migration SQL:
  // CREATE INDEX idx_user_bio_fulltext ON users USING GIN (to_tsvector('english', COALESCE(bio, '')));
  
  @@index([username]) // Already exists
  @@index([city])
  @@index([country])
}
```

**Deliverables:**
- Migration file: `prisma/migrations/YYYYMMDD_add_user_follows/migration.sql`
- Updated `prisma/schema.prisma`
- Test script to verify relationships work

**Estimated Time:** 4-5 hours

---

### Day 2: Follow System Backend APIs

**Objective:** Implement follow/unfollow functionality

**Tasks:**
- [ ] Create `POST /api/v1/users/:username/follow` endpoint
- [ ] Create `POST /api/v1/users/:username/unfollow` endpoint
- [ ] Create `GET /api/v1/users/:username/followers` endpoint (paginated)
- [ ] Create `GET /api/v1/users/:username/following` endpoint (paginated)
- [ ] Create `GET /api/v1/users/me/follow-status/:username` endpoint
- [ ] Add authentication middleware (require login)
- [ ] Add validation (can't follow yourself, etc.)
- [ ] Add error handling
- [ ] Write API tests

**API Specifications:**

```typescript
// POST /api/v1/users/:username/follow
Request: { } // Authentication via JWT
Response: {
  success: true,
  follower: { id, username },
  following: { id, username },
  followedAt: "2026-01-13T..."
}

// POST /api/v1/users/:username/unfollow
Request: { } // Authentication via JWT
Response: {
  success: true,
  message: "Unfollowed @username"
}

// GET /api/v1/users/:username/followers?page=1&limit=20
Response: {
  followers: [
    {
      id: 1,
      username: "johndoe",
      displayName: "John Doe",
      avatar: "https://...",
      bio: "...",
      followedAt: "2026-01-13T..."
    }
  ],
  pagination: {
    total: 45,
    page: 1,
    limit: 20,
    totalPages: 3,
    hasMore: true
  }
}

// GET /api/v1/users/:username/following
// Same structure as followers

// GET /api/v1/users/me/follow-status/:username
Response: {
  isFollowing: true,
  isFollowedBy: false,
  followedAt: "2026-01-13T..."
}
```

**Files to Create:**
- `src/app/api/v1/users/[username]/follow/route.ts`
- `src/app/api/v1/users/[username]/unfollow/route.ts`
- `src/app/api/v1/users/[username]/followers/route.ts`
- `src/app/api/v1/users/[username]/following/route.ts`
- `src/app/api/v1/users/me/follow-status/[username]/route.ts`

**Deliverables:**
- 5 API endpoints fully functional
- API test suite
- Documentation in `docs/api/FOLLOW_SYSTEM.md`

**Estimated Time:** 6-8 hours

---

### Day 3: Follow System Frontend

**Objective:** Build UI components for follow functionality

**Tasks:**
- [ ] Create `FollowButton` component
  - Shows "Follow" / "Following" / "Unfollow" states
  - Loading states during API calls
  - Error handling with toast notifications
- [ ] Update profile page to show follow button
- [ ] Add follower/following counts to profile
- [ ] Make counts clickable (link to lists)
- [ ] Create follower list page (`/@username/followers`)
- [ ] Create following list page (`/@username/following`)
- [ ] Add infinite scroll or pagination to lists
- [ ] Style components to match existing design

**Components to Create:**

```typescript
// src/components/social/FollowButton.tsx
interface FollowButtonProps {
  username: string;
  initialFollowStatus?: boolean;
  variant?: 'default' | 'compact';
}

// src/components/social/FollowersList.tsx
interface FollowersListProps {
  username: string;
  type: 'followers' | 'following';
}

// src/components/social/UserCard.tsx
interface UserCardProps {
  user: {
    username: string;
    displayName: string;
    avatar: string | null;
    bio: string | null;
  };
  showFollowButton?: boolean;
}
```

**Pages to Create:**
- `src/app/[username]/followers/page.tsx`
- `src/app/[username]/following/page.tsx`

**UI Features:**
- Optimistic updates (instant UI feedback)
- Toast notifications for success/error
- Loading skeletons
- Empty states ("No followers yet")
- Responsive design (mobile-friendly)

**Deliverables:**
- 3 new React components
- 2 new pages
- Updated profile page with follow functionality
- Storybook stories (if using Storybook)

**Estimated Time:** 6-8 hours

---

### Day 4-5: Search System Backend

**Objective:** Implement advanced multi-criteria search

**Tasks:**
- [ ] Create search utility functions
- [ ] Implement username search (fuzzy matching)
- [ ] Implement location-based search
- [ ] Implement bio/keywords full-text search
- [ ] Implement geographic search
- [ ] Add search ranking/scoring
- [ ] Create combined search endpoint
- [ ] Add rate limiting to prevent abuse
- [ ] Optimize queries with indexes
- [ ] Write search tests

**Search Implementation:**

```typescript
// src/lib/search-utils.ts

// Username fuzzy search using PostgreSQL trigram similarity
async function searchByUsername(query: string, limit: number) {
  // Uses pg_trgm extension
  return await prisma.$queryRaw`
    SELECT id, username, "firstName", "lastName", avatar, bio,
           similarity(username, ${query}) as score
    FROM users
    WHERE username ILIKE ${'%' + query + '%'}
    ORDER BY score DESC, username ASC
    LIMIT ${limit}
  `;
}

// Location-based: Users who saved same places
async function searchByLocation(locationId: number, currentUserId: number) {
  return await prisma.user.findMany({
    where: {
      savedLocations: {
        some: {
          locationId,
          visibility: { in: ['public', 'unlisted'] }
        }
      },
      id: { not: currentUserId }
    },
    include: {
      savedLocations: {
        where: { locationId },
        take: 1
      }
    },
    take: 20
  });
}

// Full-text bio search
async function searchByBio(keywords: string) {
  return await prisma.$queryRaw`
    SELECT id, username, "firstName", "lastName", avatar, bio,
           ts_rank(to_tsvector('english', COALESCE(bio, '')), 
                   to_tsquery('english', ${keywords})) as score
    FROM users
    WHERE to_tsvector('english', COALESCE(bio, '')) @@ to_tsquery('english', ${keywords})
    ORDER BY score DESC
    LIMIT 20
  `;
}

// Geographic search
async function searchByGeography(city?: string, country?: string) {
  return await prisma.user.findMany({
    where: {
      OR: [
        { city: { equals: city, mode: 'insensitive' } },
        { country: { equals: country, mode: 'insensitive' } }
      ]
    },
    take: 20
  });
}
```

**API Endpoint:**

```typescript
// GET /api/v1/search/users?q=query&type=username|location|bio|geo|all&limit=20&offset=0

Response: {
  results: [
    {
      id: 1,
      username: "johndoe",
      displayName: "John Doe",
      avatar: "https://...",
      bio: "...",
      matchType: "username", // or "location", "bio", "geo"
      matchScore: 0.85, // relevance score
      context: "Saved 3 locations near you" // Helpful context
    }
  ],
  pagination: {
    total: 150,
    offset: 0,
    limit: 20,
    hasMore: true
  },
  suggestions: ["john", "johnny", "johnsmith"] // Autocomplete
}
```

**Files to Create:**
- `src/lib/search-utils.ts`
- `src/app/api/v1/search/users/route.ts`
- `src/app/api/v1/search/suggestions/route.ts` (autocomplete)

**Database Setup:**
- Enable pg_trgm extension for fuzzy matching
- Create full-text search index on bio field
- Add GIN indexes for performance

**Deliverables:**
- Search utility library
- 2 API endpoints (search + suggestions)
- Database indexes and extensions
- Search test suite
- Performance benchmarks

**Estimated Time:** 10-12 hours (2 days)

---

### Day 6: Search System Frontend

**Objective:** Build search UI and autocomplete

**Tasks:**
- [ ] Create search bar component with autocomplete
- [ ] Create search results page
- [ ] Add search filters (by type)
- [ ] Implement debounced search
- [ ] Add search history (localStorage)
- [ ] Create search result cards
- [ ] Add "Load more" pagination
- [ ] Add empty states
- [ ] Mobile-responsive design

**Components to Create:**

```typescript
// src/components/search/SearchBar.tsx
interface SearchBarProps {
  onSearch: (query: string, type: SearchType) => void;
  placeholder?: string;
  autoFocus?: boolean;
}

// src/components/search/SearchResults.tsx
interface SearchResultsProps {
  results: SearchResult[];
  isLoading: boolean;
  onLoadMore: () => void;
  hasMore: boolean;
}

// src/components/search/SearchFilters.tsx
interface SearchFiltersProps {
  activeType: SearchType;
  onTypeChange: (type: SearchType) => void;
}
```

**Pages to Create:**
- `src/app/search/page.tsx` - Main search page
- Optional: Search modal overlay for quick access

**Features:**
- Real-time autocomplete (debounced to 300ms)
- Search history with clear option
- Keyboard navigation (arrow keys, enter)
- Filter chips (Username, Location, Bio, All)
- Highlighted search terms in results
- "No results" state with suggestions

**Deliverables:**
- Search bar component
- Search results page
- Filter components
- Autocomplete functionality
- Mobile-responsive design

**Estimated Time:** 6-8 hours

---

### Day 7: Visibility & Privacy Enhancements

**Objective:** Implement followers-only visibility

**Tasks:**
- [ ] Update `UserSave` visibility logic
- [ ] Add "followers" to visibility enum
- [ ] Update profile page to check follow status
- [ ] Hide follower-only locations from non-followers
- [ ] Update location detail pages with privacy checks
- [ ] Add visibility selector to save location UI
- [ ] Update API endpoints to respect visibility
- [ ] Add privacy indicator icons
- [ ] Write privacy tests

**Visibility Logic:**

```typescript
// src/lib/visibility-utils.ts

async function canViewLocation(
  location: UserSave,
  viewerId: number | null,
  ownerId: number
): Promise<boolean> {
  // Owner can always see their own locations
  if (viewerId === ownerId) return true;
  
  switch (location.visibility) {
    case 'public':
      return true;
      
    case 'unlisted':
      return true; // Anyone with link
      
    case 'followers':
      if (!viewerId) return false;
      return await isFollowing(viewerId, ownerId);
      
    case 'private':
      return false;
      
    default:
      return false;
  }
}

async function isFollowing(
  followerId: number,
  followingId: number
): Promise<boolean> {
  const follow = await prisma.userFollow.findUnique({
    where: {
      followerId_followingId: {
        followerId,
        followingId
      }
    }
  });
  return !!follow;
}
```

**UI Updates:**

```typescript
// Visibility dropdown in save modal
<select name="visibility">
  <option value="private">🔒 Private (Only me)</option>
  <option value="followers">👥 Followers</option>
  <option value="unlisted">🔗 Unlisted (Anyone with link)</option>
  <option value="public">🌐 Public</option>
</select>

// Visibility indicators on location cards
{location.visibility === 'followers' && (
  <Badge>👥 Followers only</Badge>
)}
```

**Files to Modify:**
- `src/app/[username]/page.tsx` - Filter by visibility
- `src/app/[username]/locations/[id]/page.tsx` - Check access
- `src/app/api/v1/users/[username]/locations/route.ts` - Filter API
- `src/components/map/SaveLocationModal.tsx` - Add visibility selector

**Deliverables:**
- Visibility utility functions
- Updated privacy logic across app
- UI components for visibility selection
- Privacy indicator badges
- Comprehensive tests

**Estimated Time:** 6-8 hours

---

### Day 8-9: Integration & Testing

**Objective:** Ensure all features work together seamlessly

**Tasks:**
- [ ] Integration testing across all features
- [ ] Test follow → visibility flow
- [ ] Test search → profile → follow flow
- [ ] Performance testing (search queries)
- [ ] Load testing (follow endpoints)
- [ ] Mobile device testing
- [ ] Cross-browser testing
- [ ] Accessibility audit
- [ ] Fix bugs discovered
- [ ] Optimize slow queries

**Test Scenarios:**

**1. Follow Flow:**
- User A searches for User B
- User A views User B's profile
- User A follows User B
- User B's follower-only locations appear for User A
- User A unfollows User B
- Follower-only locations disappear

**2. Search Flow:**
- Search by username finds exact and fuzzy matches
- Search by location finds users who saved same place
- Search by bio keywords finds relevant users
- Autocomplete suggests relevant usernames

**3. Privacy Flow:**
- Public locations visible to everyone
- Follower-only locations visible only to followers
- Private locations never visible to others
- Unlisted locations accessible via direct link

**Performance Benchmarks:**
- Follow/unfollow: <100ms
- Search query: <200ms
- Followers list: <150ms
- Profile page: <200ms

**Deliverables:**
- Full integration test suite
- Performance report
- Bug fixes
- Optimized queries
- Cross-browser compatibility confirmed

**Estimated Time:** 10-12 hours (2 days)

---

### Day 10: Documentation & Deployment

**Objective:** Document everything and deploy to production

**Tasks:**
- [ ] Write API documentation
- [ ] Write user guide for social features
- [ ] Update README with new features
- [ ] Create migration guide for production
- [ ] Write deployment checklist
- [ ] Test migration on staging/preview
- [ ] Deploy to production
- [ ] Verify in production
- [ ] Monitor error logs
- [ ] Announce new features

**Documentation to Create:**

1. **API Documentation** (`docs/api/SOCIAL_FEATURES.md`)
   - Follow endpoints
   - Search endpoints
   - Code examples
   - Rate limits

2. **User Guide** (`docs/guides/SOCIAL_FEATURES_USER_GUIDE.md`)
   - How to follow users
   - How to search for users
   - Understanding visibility settings
   - Managing followers

3. **Migration Guide** (`docs/deployment/PHASE2A_DEPLOYMENT.md`)
   - Database migration steps
   - Environment variables needed
   - Deployment checklist
   - Rollback procedure

**Deployment Checklist:**
- [ ] Database migration tested in development
- [ ] All tests passing
- [ ] Performance benchmarks met
- [ ] Documentation complete
- [ ] Code reviewed
- [ ] Merged to main branch
- [ ] Vercel auto-deploy triggered
- [ ] Production database migrated
- [ ] Production smoke tests passed
- [ ] Error monitoring configured
- [ ] Feature announced to users

**Deliverables:**
- Complete documentation
- Production deployment
- Monitoring dashboard
- Feature announcement

**Estimated Time:** 4-6 hours

---

## 📊 Summary

### Total Timeline: 7-10 Days

| Day | Focus | Hours | Status |
|-----|-------|-------|--------|
| 1 | Database schema | 4-5h | ✅ Complete |
| 2 | Follow APIs | 6-8h | ✅ Complete |
| 3 | Follow UI | 6-8h | ⏳ Planned |
| 4-5 | Search backend | 10-12h | ⏳ Planned |
| 6 | Search UI | 6-8h | ⏳ Planned |
| 7 | Visibility & privacy | 6-8h | ⏳ Planned |
| 8-9 | Integration & testing | 10-12h | ⏳ Planned |
| 10 | Documentation & deploy | 4-6h | ⏳ Planned |
| **Total** | **Full feature set** | **52-67h** | **7-10 days** |

### Deliverables

**Code:**
- 1 new database model (`UserFollow`)
- 5 follow API endpoints
- 2 search API endpoints
- 3 new React components
- 2 new pages (followers, following)
- 1 search page
- Visibility utilities
- ~1,500 lines of new code

**Documentation:**
- API documentation
- User guide
- Deployment guide
- Test documentation

**Tests:**
- API endpoint tests
- Integration tests
- Privacy/visibility tests
- Search tests

---

## 🎯 Success Criteria

### Functionality
- [ ] Users can follow/unfollow each other
- [ ] Follower/following counts display correctly
- [ ] Follower/following lists are accessible
- [ ] Search finds users by username (fuzzy)
- [ ] Search finds users by location
- [ ] Search finds users by bio keywords
- [ ] Autocomplete suggestions work
- [ ] Followers-only visibility works correctly
- [ ] Privacy settings respected across app

### Performance
- [ ] All API endpoints respond in <200ms
- [ ] Search queries return in <300ms
- [ ] Pages load in <500ms
- [ ] No N+1 query problems
- [ ] Database indexes optimized

### User Experience
- [ ] Follow button is intuitive
- [ ] Search is fast and responsive
- [ ] Results are relevant
- [ ] Mobile experience is smooth
- [ ] Error messages are helpful
- [ ] Loading states prevent confusion

### Quality
- [ ] 100% test coverage on critical paths
- [ ] No security vulnerabilities
- [ ] Accessibility standards met
- [ ] Code reviewed and approved
- [ ] Documentation complete

---

## 🚀 Ready to Start?

**Prerequisites Met:**
- ✅ Phase 1 complete and tested
- ✅ Development environment working
- ✅ Database access confirmed
- ✅ Team aligned on approach

**First Steps:**
1. Review this plan
2. Approve approach
3. Start Day 1: Database schema
4. Create feature branch: `feature/phase2a-social`

**Command to begin:**
```bash
# Create feature branch
git checkout -b feature/phase2a-social

# Start Day 1
# Open prisma/schema.prisma and add UserFollow model
```

---

**Phase 2A Plan:** COMPLETE ✅  
**Ready to implement:** YES ✅  
**Estimated completion:** January 23-27, 2026

Let's build something amazing! 🚀
