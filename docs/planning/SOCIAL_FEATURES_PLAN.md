# Social Features - Implementation Plan

**Date:** January 13, 2026  
**Status:** Planning  
**Timeline:** 2-3 weeks (after Phase 1 complete)

---

## Overview

Building a comprehensive social platform with advanced sharing capabilities that integrate with existing Teams and Projects features.

---

## Architecture Decisions

### Connection Model: Following (One-Directional)

**Like:** Instagram, Twitter, GitHub

**Benefits:**
- ✅ No mutual acceptance required (faster network growth)
- ✅ Asymmetric relationships (you can follow experts who don't follow back)
- ✅ Simpler UX (one-click follow/unfollow)
- ✅ Clear metrics (followers vs following)
- ✅ Easier to implement than mutual friendship

**Database Model:**
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
```

---

## Sharing System Architecture

### Multi-Level Sharing Hierarchy

**1. Visibility Levels** (existing, enhanced):
```typescript
type LocationVisibility = 
  | 'private'        // Only me
  | 'followers'      // Anyone who follows me
  | 'specific'       // Specific users/groups/teams/projects
  | 'unlisted'       // Anyone with link
  | 'public';        // Everyone
```

**2. Sharing Groups** (new):
```prisma
model SharingGroup {
  id          Int                 @id @default(autoincrement())
  name        String              // "Close Friends", "Photography Crew", etc.
  description String?
  ownerId     Int
  createdAt   DateTime            @default(now())
  updatedAt   DateTime            @updatedAt
  
  owner       User                @relation("OwnedGroups", fields: [ownerId], references: [id], onDelete: Cascade)
  members     SharingGroupMember[]
  sharedItems LocationShare[]
  
  @@index([ownerId])
  @@map("sharing_groups")
}

model SharingGroupMember {
  id        Int           @id @default(autoincrement())
  groupId   Int
  userId    Int
  addedAt   DateTime      @default(now())
  addedBy   Int?
  
  group     SharingGroup  @relation(fields: [groupId], references: [id], onDelete: Cascade)
  user      User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  addedByUser User?       @relation("AddedMembers", fields: [addedBy], references: [id])
  
  @@unique([groupId, userId])
  @@index([groupId])
  @@index([userId])
  @@map("sharing_group_members")
}
```

**3. Location Sharing** (new - replaces simple sharedWithIds array):
```prisma
model LocationShare {
  id             Int           @id @default(autoincrement())
  userSaveId     Int           // Which saved location
  sharedBy       Int           // User who shared
  shareType      String        // 'user', 'group', 'team', 'project'
  
  // Polymorphic relationships (only one will be set)
  sharedWithUserId    Int?
  sharedWithGroupId   Int?
  sharedWithTeamId    Int?
  sharedWithProjectId Int?
  
  permissions    String        @default("view") // 'view', 'edit', 'admin'
  sharedAt       DateTime      @default(now())
  expiresAt      DateTime?     // Optional expiration
  
  userSave       UserSave      @relation(fields: [userSaveId], references: [id], onDelete: Cascade)
  sharedByUser   User          @relation("SharedLocations", fields: [sharedBy], references: [id])
  sharedWithUser User?         @relation("ReceivedShares", fields: [sharedWithUserId], references: [id])
  sharedWithGroup SharingGroup? @relation(fields: [sharedWithGroupId], references: [id])
  sharedWithTeam  Team?        @relation(fields: [sharedWithTeamId], references: [id])
  sharedWithProject Project?   @relation(fields: [sharedWithProjectId], references: [id])
  
  @@index([userSaveId])
  @@index([sharedBy])
  @@index([sharedWithUserId])
  @@index([sharedWithGroupId])
  @@index([sharedWithTeamId])
  @@index([sharedWithProjectId])
  @@map("location_shares")
}
```

**4. Update UserSave** (enhanced):
```prisma
model UserSave {
  // ...existing fields...
  visibility     String          @default("private")
  shares         LocationShare[] // New relation
  
  // Remove: sharedWithIds Int[] (replaced by LocationShare table)
}
```

---

## Search System Architecture

### Multi-Criteria Search

**1. User Search API:**
```typescript
GET /api/v1/search/users?q=query&type=username|location|bio|all&limit=20&offset=0

// Examples:
// /api/v1/search/users?q=john&type=username
// /api/v1/search/users?q=paris&type=location
// /api/v1/search/users?q=photographer&type=bio
```

**2. Search Types:**

**a. Username Search** (fuzzy matching):
```sql
-- Using PostgreSQL trigram similarity
SELECT * FROM users 
WHERE username ILIKE '%query%' 
ORDER BY similarity(username, 'query') DESC
LIMIT 20;
```

**b. Location-Based Search** (users who saved same place):
```sql
-- Find users who saved the same location
SELECT DISTINCT u.* FROM users u
JOIN user_saves us ON us.userId = u.id
WHERE us.locationId = ?
  AND us.visibility IN ('public', 'unlisted')
  AND u.id != currentUserId
LIMIT 20;
```

**c. Bio/Interests Search** (full-text):
```sql
-- Using PostgreSQL full-text search
SELECT * FROM users
WHERE to_tsvector('english', bio) @@ to_tsquery('english', 'query')
ORDER BY ts_rank(to_tsvector('english', bio), to_tsquery('english', 'query')) DESC
LIMIT 20;
```

**d. Geographic Search:**
```sql
-- Users in same city/country
SELECT * FROM users
WHERE city = ? OR country = ?
LIMIT 20;
```

**3. Search Indexes** (add to schema):
```prisma
model User {
  // ...existing fields...
  
  @@index([username]) // For ILIKE queries
  @@index([city])
  @@index([country])
  // Add GIN index for full-text search in migration:
  // CREATE INDEX idx_user_bio_fulltext ON users USING GIN (to_tsvector('english', bio));
}
```

---

## Implementation Phases

### Phase 2A: Social Infrastructure (Week 1-2)

**Database (Day 1)**
- [ ] Add `UserFollow` model
- [ ] Add `SharingGroup` model
- [ ] Add `SharingGroupMember` model
- [ ] Add `LocationShare` model
- [ ] Update `UserSave` (remove sharedWithIds, add shares relation)
- [ ] Add search indexes
- [ ] Create migration
- [ ] Run `prisma migrate dev`

**Follow System (Day 2-3)**
- [ ] Create `/api/v1/users/:username/follow` POST (follow user)
- [ ] Create `/api/v1/users/:username/unfollow` POST (unfollow)
- [ ] Create `/api/v1/users/:username/followers` GET (list followers)
- [ ] Create `/api/v1/users/:username/following` GET (list following)
- [ ] Create `/api/v1/users/me/follow-status/:username` GET (am I following?)
- [ ] Add follow/unfollow buttons to profile page
- [ ] Add follower/following count to profile
- [ ] Add followers/following list pages

**Search System (Day 4-5)**
- [ ] Create `/api/v1/search/users` endpoint
- [ ] Implement username search (fuzzy)
- [ ] Implement location-based search
- [ ] Implement bio/keywords search
- [ ] Implement geographic search
- [ ] Add full-text search index to bio field
- [ ] Create search UI component
- [ ] Add search page/modal
- [ ] Add search suggestions (autocomplete)

**Privacy & Visibility (Day 6)**
- [ ] Update `/@username` to show only appropriate locations:
  - Public locations (everyone)
  - Followers-only (if you follow them)
  - Specific shares (if shared with you)
- [ ] Add "followers" visibility option to location save UI
- [ ] Update visibility dropdown on save modal
- [ ] Add visibility indicator icons on location cards

**Testing & Docs (Day 7)**
- [ ] Write comprehensive tests for follow system
- [ ] Write tests for search endpoints
- [ ] Write tests for visibility filtering
- [ ] Create API documentation
- [ ] Create user guide for social features
- [ ] Manual testing with multiple test accounts

### Phase 2B: OAuth2/PKCE (Week 2-3)

**See separate OAuth2 implementation doc** (for iOS app)

### Phase 2C: Advanced Sharing (Week 3-4)

**Sharing Groups (Day 1-2)**
- [ ] Create `/api/v1/sharing-groups` POST (create group)
- [ ] Create `/api/v1/sharing-groups/:id` GET/PATCH/DELETE
- [ ] Create `/api/v1/sharing-groups/:id/members` POST/DELETE (add/remove)
- [ ] Create UI for managing sharing groups
- [ ] Add "Create Group" button to settings
- [ ] Add group member management interface

**Granular Sharing (Day 3-4)**
- [ ] Create `/api/v1/locations/:id/shares` POST (share location)
- [ ] Create `/api/v1/locations/:id/shares/:shareId` DELETE (unshare)
- [ ] Create `/api/v1/locations/:id/shares` GET (list shares)
- [ ] Update location detail page with sharing UI:
  - "Share with..." button
  - Select: Users, Groups, Teams, Projects
  - Set permissions (view/edit)
  - Set expiration date (optional)
- [ ] Add "Shared with me" feed/page
- [ ] Add notifications when someone shares with you

**Team & Project Integration (Day 5-6)**
- [ ] Add LocationShare relation to Team model
- [ ] Add LocationShare relation to Project model
- [ ] Create "Share with Team" option in UI
- [ ] Create "Share with Project" option in UI
- [ ] Update team/project detail pages to show shared locations
- [ ] Add team location collections
- [ ] Add project location collections

**Notifications & Activity (Day 7)**
- [ ] New follower notification
- [ ] Location shared with you notification
- [ ] Added to sharing group notification
- [ ] Activity feed (optional)
- [ ] Email notifications (optional)

---

## API Endpoints Summary

### Follow System
```
POST   /api/v1/users/:username/follow
POST   /api/v1/users/:username/unfollow
GET    /api/v1/users/:username/followers?page=1&limit=20
GET    /api/v1/users/:username/following?page=1&limit=20
GET    /api/v1/users/me/follow-status/:username
```

### Search
```
GET    /api/v1/search/users?q=query&type=username|location|bio|all&limit=20&offset=0
GET    /api/v1/search/locations?q=query&bounds=lat1,lng1,lat2,lng2
GET    /api/v1/search/suggestions?q=query (autocomplete)
```

### Sharing Groups
```
GET    /api/v1/sharing-groups
POST   /api/v1/sharing-groups
GET    /api/v1/sharing-groups/:id
PATCH  /api/v1/sharing-groups/:id
DELETE /api/v1/sharing-groups/:id
POST   /api/v1/sharing-groups/:id/members
DELETE /api/v1/sharing-groups/:id/members/:userId
```

### Location Sharing
```
POST   /api/v1/locations/:id/shares
GET    /api/v1/locations/:id/shares
DELETE /api/v1/locations/:id/shares/:shareId
GET    /api/v1/users/me/shared-locations (locations shared with me)
```

---

## UI Components Needed

### Profile Page Enhancements
- Follow/Unfollow button
- Follower count (clickable)
- Following count (clickable)
- "Followers only" location indicator

### New Pages/Modals
- Search modal/page
- Followers list page
- Following list page
- Sharing groups management page
- Share location modal
- Shared with me page

### New Components
- `FollowButton` - Follow/unfollow with loading state
- `UserSearchBar` - Autocomplete search
- `FollowersList` - Paginated followers
- `FollowingList` - Paginated following
- `SharingGroupCard` - Group display
- `ShareModal` - Share location UI
- `VisibilitySelector` - Dropdown for visibility
- `SharesList` - Who has access to this location

---

## Database Migration Strategy

### Step 1: Add New Tables (Non-Breaking)
```bash
# Create migration for UserFollow, SharingGroup, etc.
npx prisma migrate dev --name add_social_features

# This is safe - only adds new tables, doesn't modify existing
```

### Step 2: Migrate Existing Data (if needed)
```typescript
// If any UserSave has sharedWithIds populated:
// Migrate to LocationShare records
// Run as data migration script
```

### Step 3: Deploy to Production
```bash
# Vercel will auto-run:
npx prisma migrate deploy
```

---

## Privacy & Security Considerations

### Follow System
- ✅ Users can block followers
- ✅ Private profiles (followers only see public info)
- ✅ Hide follower/following lists (user setting)

### Sharing System
- ✅ Share permissions (view vs edit)
- ✅ Expiration dates for shares
- ✅ Revoke access anytime
- ✅ Audit log (who shared what when)

### Search
- ✅ Respect privacy settings (only search public profiles)
- ✅ Rate limiting (prevent scraping)
- ✅ Block/hide from search option

---

## Performance Considerations

### Indexes
```sql
-- Critical indexes for performance
CREATE INDEX idx_user_follows_follower ON user_follows(followerId);
CREATE INDEX idx_user_follows_following ON user_follows(followingId);
CREATE INDEX idx_location_shares_user ON location_shares(sharedWithUserId);
CREATE INDEX idx_location_shares_group ON location_shares(sharedWithGroupId);
CREATE INDEX idx_user_bio_fulltext ON users USING GIN (to_tsvector('english', bio));
```

### Caching Strategy
- Cache follower counts (Redis)
- Cache follow status for current user
- Cache search results (5 min TTL)
- CDN cache public profiles

### Pagination
- All lists paginated (followers, following, shares)
- Default limit: 20 items
- Max limit: 100 items

---

## Testing Strategy

### Unit Tests
- Follow/unfollow logic
- Visibility filtering
- Search ranking algorithms
- Permission checks

### Integration Tests
- Full follow workflow
- Share location with user/group/team
- Search across criteria
- Privacy enforcement

### Manual Testing Scenarios
1. User A follows User B
2. User B's follower-only locations appear for User A
3. User A shares location with User B
4. User B sees shared location in "Shared with me"
5. Search for users by username
6. Search for users who saved "Paris"
7. Create sharing group
8. Share location with group
9. All group members see location

---

## Timeline Summary

**Week 1-2: Phase 2A - Social Infrastructure**
- Days 1-7: Follow system, search, visibility updates

**Week 2-3: Phase 2B - OAuth2/PKCE**
- Days 1-7: Bearer tokens, refresh tokens, mobile auth

**Week 3-4: Phase 2C - Advanced Sharing**
- Days 1-7: Sharing groups, granular permissions, Teams/Projects integration

**Total: 3-4 weeks** (can overlap with iOS app development)

---

## Success Metrics

### Phase 2A
- [ ] Users can follow/unfollow
- [ ] Follower counts display correctly
- [ ] Search finds users by all criteria
- [ ] Visibility filtering works (followers-only locations)
- [ ] No performance degradation

### Phase 2C
- [ ] Users can create sharing groups
- [ ] Locations can be shared with users/groups/teams/projects
- [ ] Shared locations appear in correct feeds
- [ ] Permissions enforced correctly
- [ ] All existing Team/Project features still work

---

## Next Steps

1. ✅ Complete Phase 1 testing (Day 5)
2. ✅ Review and approve this plan
3. ⏳ Start Phase 2A: Social Infrastructure
4. ⏳ Implement in parallel with OAuth2 (Phase 2B)
5. ⏳ Complete advanced sharing (Phase 2C)

---

**Questions? Concerns? Ready to start?** 🚀
