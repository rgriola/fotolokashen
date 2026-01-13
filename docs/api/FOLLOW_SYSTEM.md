# Follow System API Documentation

**Phase 2A Day 2 - Backend APIs**  
**Version:** 1.0  
**Base URL:** `/api/v1`

---

## Overview

The Follow System enables users to follow/unfollow each other in an Instagram/Twitter-style one-directional relationship. Users can view their followers and who they're following, with full pagination support.

---

## Authentication

All endpoints except the public list endpoints (`/followers` and `/following`) require authentication via JWT token.

**Methods:**
1. **Cookie:** `auth_token=<jwt>`
2. **Header:** `Authorization: Bearer <jwt>`

**Authentication Errors:**
- `401 UNAUTHORIZED` - No token provided or invalid token
- `401 SESSION_EXPIRED` - Token is valid but session expired in database

---

## Endpoints

### 1. Follow a User

**Endpoint:** `POST /api/v1/users/:username/follow`

**Description:** Create a follow relationship with another user.

**Authentication:** Required ✅

**Parameters:**
- `username` (path) - Username of user to follow (case-insensitive)

**Request:**
```bash
curl -X POST \
  -H "Authorization: Bearer <token>" \
  http://localhost:3000/api/v1/users/johndoe/follow
```

**Response (200 OK):**
```json
{
  "success": true,
  "follower": {
    "id": 1,
    "username": "janedoe"
  },
  "following": {
    "id": 2,
    "username": "johndoe"
  },
  "followedAt": "2026-01-13T14:30:00.000Z"
}
```

**Error Responses:**
- `400 INVALID_OPERATION` - Attempting to follow yourself
- `400 ALREADY_FOLLOWING` - Already following this user
- `404 USER_NOT_FOUND` - Target user doesn't exist
- `401 UNAUTHORIZED` - Not authenticated

---

### 2. Unfollow a User

**Endpoint:** `POST /api/v1/users/:username/unfollow`

**Description:** Remove a follow relationship.

**Authentication:** Required ✅

**Parameters:**
- `username` (path) - Username of user to unfollow (case-insensitive)

**Request:**
```bash
curl -X POST \
  -H "Authorization: Bearer <token>" \
  http://localhost:3000/api/v1/users/johndoe/unfollow
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Unfollowed @johndoe"
}
```

**Error Responses:**
- `400 NOT_FOLLOWING` - Not currently following this user
- `404 USER_NOT_FOUND` - Target user doesn't exist
- `401 UNAUTHORIZED` - Not authenticated

---

### 3. Get Followers List

**Endpoint:** `GET /api/v1/users/:username/followers`

**Description:** Get a paginated list of users who follow the specified user.

**Authentication:** Not required ❌ (Public endpoint)

**Parameters:**
- `username` (path) - Username (case-insensitive)
- `page` (query, optional) - Page number (default: 1)
- `limit` (query, optional) - Items per page (default: 20, max: 100)

**Request:**
```bash
curl "http://localhost:3000/api/v1/users/johndoe/followers?page=1&limit=20"
```

**Response (200 OK):**
```json
{
  "followers": [
    {
      "id": 1,
      "username": "janedoe",
      "displayName": "Jane Doe",
      "avatar": "https://imagekit.io/...",
      "bio": "Travel enthusiast 🌍",
      "followedAt": "2026-01-13T14:30:00.000Z"
    },
    {
      "id": 3,
      "username": "bobsmith",
      "displayName": "Bob Smith",
      "avatar": null,
      "bio": null,
      "followedAt": "2026-01-12T10:15:00.000Z"
    }
  ],
  "pagination": {
    "total": 45,
    "page": 1,
    "limit": 20,
    "totalPages": 3,
    "hasMore": true
  }
}
```

**Error Responses:**
- `404 USER_NOT_FOUND` - Target user doesn't exist

---

### 4. Get Following List

**Endpoint:** `GET /api/v1/users/:username/following`

**Description:** Get a paginated list of users that the specified user follows.

**Authentication:** Not required ❌ (Public endpoint)

**Parameters:**
- `username` (path) - Username (case-insensitive)
- `page` (query, optional) - Page number (default: 1)
- `limit` (query, optional) - Items per page (default: 20, max: 100)

**Request:**
```bash
curl "http://localhost:3000/api/v1/users/johndoe/following?page=1&limit=20"
```

**Response (200 OK):**
```json
{
  "following": [
    {
      "id": 2,
      "username": "travelpro",
      "displayName": "Travel Pro",
      "avatar": "https://imagekit.io/...",
      "bio": "Professional photographer",
      "followedAt": "2026-01-13T14:30:00.000Z"
    }
  ],
  "pagination": {
    "total": 12,
    "page": 1,
    "limit": 20,
    "totalPages": 1,
    "hasMore": false
  }
}
```

**Error Responses:**
- `404 USER_NOT_FOUND` - Target user doesn't exist

---

### 5. Get Follow Status

**Endpoint:** `GET /api/v1/users/me/follow-status/:username`

**Description:** Check the follow relationship between the authenticated user and another user.

**Authentication:** Required ✅

**Parameters:**
- `username` (path) - Username to check (case-insensitive)

**Request:**
```bash
curl -H "Authorization: Bearer <token>" \
  http://localhost:3000/api/v1/users/me/follow-status/johndoe
```

**Response (200 OK):**
```json
{
  "isFollowing": true,
  "isFollowedBy": false,
  "followedAt": "2026-01-13T14:30:00.000Z"
}
```

**Fields:**
- `isFollowing` - True if current user follows target user
- `isFollowedBy` - True if target user follows current user
- `followedAt` - ISO timestamp when current user followed target (null if not following)

**Error Responses:**
- `404 USER_NOT_FOUND` - Target user doesn't exist
- `401 UNAUTHORIZED` - Not authenticated

---

## Data Models

### User (Simplified)

```typescript
interface User {
  id: number;
  username: string;
  displayName: string;  // Computed: "firstName lastName" or username
  avatar: string | null;
  bio: string | null;
  followedAt: string;  // ISO timestamp (only in follower/following lists)
}
```

### Pagination

```typescript
interface Pagination {
  total: number;      // Total number of items
  page: number;       // Current page number
  limit: number;      // Items per page
  totalPages: number; // Total pages available
  hasMore: boolean;   // True if more pages available
}
```

---

## Rate Limiting

**Status:** Not yet implemented ⏳

**Planned Limits:**
- Follow/unfollow: 60 requests per hour per user
- List endpoints: 300 requests per hour per IP
- Follow status: 300 requests per hour per user

---

## Examples

### Follow Flow

```bash
# 1. Check if you're following someone
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/v1/users/me/follow-status/johndoe

# Response: {"isFollowing": false, "isFollowedBy": false, "followedAt": null}

# 2. Follow them
curl -X POST -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/v1/users/johndoe/follow

# Response: {"success": true, "follower": {...}, "following": {...}}

# 3. Verify status
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/v1/users/me/follow-status/johndoe

# Response: {"isFollowing": true, "isFollowedBy": false, "followedAt": "2026-01-13T..."}

# 4. Unfollow them
curl -X POST -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/v1/users/johndoe/unfollow

# Response: {"success": true, "message": "Unfollowed @johndoe"}
```

### Pagination

```bash
# Get first page of followers (default 20 items)
curl http://localhost:3000/api/v1/users/johndoe/followers

# Get page 2 with 50 items per page
curl http://localhost:3000/api/v1/users/johndoe/followers?page=2&limit=50

# Maximum limit is 100
curl http://localhost:3000/api/v1/users/johndoe/followers?limit=100
```

---

## Database Schema

```prisma
model UserFollow {
  id          Int      @id @default(autoincrement())
  followerId  Int      // User who is following
  followingId Int      // User being followed
  createdAt   DateTime @default(now())
  
  follower    User     @relation("Following", fields: [followerId], references: [id], onDelete: Cascade)
  following   User     @relation("Followers", fields: [followingId], references: [id], onDelete: Cascade)
  
  @@unique([followerId, followingId])  // Prevent duplicate follows
  @@index([followerId])                // Fast lookup of who user follows
  @@index([followingId])               // Fast lookup of user's followers
  @@map("user_follows")
}
```

**Constraints:**
- Unique constraint on `[followerId, followingId]` prevents duplicate follows
- Cascade delete: When user deleted, all their follow relationships are removed
- Indexed for fast queries in both directions

---

## Testing

Test script available: `scripts/test-follow-apis.sh`

**Requirements:**
1. Dev server running on localhost:3000
2. Test users: @rodczaro and @bczar
3. Auth tokens exported as environment variables

```bash
# Get auth tokens
export USER1_TOKEN="<rodczaro-token>"
export USER2_TOKEN="<bczar-token>"

# Run tests
chmod +x scripts/test-follow-apis.sh
./scripts/test-follow-apis.sh
```

**Test Coverage:**
- ✅ Unauthenticated request rejection
- ✅ Follow user successfully
- ✅ Prevent duplicate follows
- ✅ Prevent self-follows
- ✅ Get followers list with pagination
- ✅ Get following list with pagination
- ✅ Check follow status (bidirectional)
- ✅ Unfollow user successfully
- ✅ Prevent unfollowing when not following
- ✅ Verify status after unfollow
- ✅ Case-insensitive username handling

---

## Next Steps (Day 3)

**Follow System Frontend:**
1. `FollowButton` component
2. Follower/following count displays
3. Follower/following list pages (`/@username/followers`, `/@username/following`)
4. Optimistic UI updates
5. Loading states and error handling

---

## Changelog

**v1.0 - January 13, 2026**
- Initial release
- 5 endpoints implemented
- Full pagination support
- Case-insensitive username handling
- Comprehensive error handling
