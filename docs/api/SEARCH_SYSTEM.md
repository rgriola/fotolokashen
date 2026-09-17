# Search System API Documentation

Phase 2A - Days 4-5: Backend search functionality for user discovery.

## Overview

The search system enables users to discover other users through multiple search methods:

- **Username search**: Fuzzy matching with typo tolerance
- **Bio search**: Full-text search across user biographies
- **Geographic search**: Find users by city/country
- **Location search**: Find users who saved the same places
- **Combined search**: Search across all criteria with intelligent ranking

## Database Setup

> **Status:** Applied to production and the dev branch on September 17, 2026.
> Owned by the `20260113172222_enable_search_extensions` migration — do not run
> these statements by hand on a new environment; run `prisma migrate deploy`.

### PostgreSQL Extensions

The search system requires the `pg_trgm` extension for fuzzy text matching:

```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;
```

Without it, `similarity()` raises Postgres error `42883`
(`function similarity(character varying, text) does not exist`), which
`searchByUsername` catches and silently degrades to an `ILIKE` fallback — so the
failure is invisible in the UI. Check the extension first when fuzzy ranking
looks wrong.

### Indexes

Optimized indexes for fast search queries:

```sql
-- Fuzzy username search (trigram similarity)
CREATE INDEX idx_users_username_trgm ON users USING gin (username gin_trgm_ops);

-- Full-text bio search
CREATE INDEX idx_users_bio_fulltext ON users USING gin (to_tsvector('english', COALESCE(bio, '')));

-- Geographic search
CREATE INDEX idx_users_city ON users (city);
CREATE INDEX idx_users_country ON users (country);
```

To create these indexes:

```bash
npx dotenv -e .env.local -- npx prisma db execute --schema=./prisma/schema.prisma --stdin
```

## API Endpoints

### 1. Search Users

Search for users across multiple criteria with pagination.

**Endpoint:** `GET /api/v1/search/users`

**Query Parameters:**

| Parameter | Type   | Required | Default | Description                                        |
| --------- | ------ | -------- | ------- | -------------------------------------------------- |
| `q`       | string | Yes      | -       | Search query (minimum 2 characters)                |
| `type`    | string | No       | `all`   | Search type: `username`, `bio`, `geo`, `all`       |
| `city`    | string | No       | -       | Filter by city (overrides query for geo search)    |
| `country` | string | No       | -       | Filter by country (overrides query for geo search) |
| `limit`   | number | No       | 20      | Results per page (max 50)                          |
| `offset`  | number | No       | 0       | Pagination offset                                  |

**Response:**

```json
{
  "results": [
    {
      "id": 2,
      "username": "rodczaro",
      "firstName": "Richard",
      "lastName": "Griola",
      "avatar": "https://...",
      "bio": "Photography enthusiast",
      "city": "New York",
      "country": "USA",
      "matchType": "username",
      "matchScore": 0.85,
      "context": "Fuzzy match"
    }
  ],
  "pagination": {
    "limit": 20,
    "offset": 0,
    "hasMore": false,
    "total": 1
  },
  "meta": {
    "query": "rod",
    "type": "username",
    "city": null,
    "country": null
  }
}
```

**Match Types:**

- `username`: Matched on username with fuzzy similarity
- `bio`: Matched on bio content via full-text search
- `geo`: Matched on city/country
- `location`: Matched on saved locations (not yet in public API)

**Examples:**

```bash
# Search usernames for "john"
curl "http://localhost:3000/api/v1/search/users?q=john&type=username"

# Search all fields for "photographer"
curl "http://localhost:3000/api/v1/search/users?q=photographer&type=all"

# Search by bio keywords
curl "http://localhost:3000/api/v1/search/users?q=travel+adventure&type=bio"

# Geographic search
curl "http://localhost:3000/api/v1/search/users?q=test&city=Paris&country=France"

# Paginated search
curl "http://localhost:3000/api/v1/search/users?q=test&limit=10&offset=20"
```

**Error Responses:**

```json
// 400 - Query too short
{
  "error": "Query must be at least 2 characters"
}

// 400 - Invalid type
{
  "error": "Invalid type. Must be one of: username, bio, geo, all"
}

// 500 - Server error
{
  "error": "Internal server error"
}
```

### 2. Username Suggestions (Autocomplete)

Get quick username suggestions for typeahead/autocomplete functionality.

**Endpoint:** `GET /api/v1/search/suggestions`

**Query Parameters:**

| Parameter | Type   | Required | Default | Description                         |
| --------- | ------ | -------- | ------- | ----------------------------------- |
| `q`       | string | Yes      | -       | Search query (minimum 2 characters) |
| `limit`   | number | No       | 10      | Number of suggestions (max 20)      |

**Response:**

```json
{
  "suggestions": ["rodczaro", "robert", "rodrigo"],
  "query": "rod"
}
```

**Examples:**

```bash
# Get username suggestions
curl "http://localhost:3000/api/v1/search/suggestions?q=joh"

# Limit suggestions
curl "http://localhost:3000/api/v1/search/suggestions?q=alex&limit=5"
```

**Error Responses:**

```json
// 400 - Query too short
{
  "error": "Query must be at least 2 characters"
}
```

## Search Utility Functions

The backend uses specialized search functions in `src/lib/search-utils.ts`:

### `searchByUsername(query, limit)`

Fuzzy username search using PostgreSQL trigram similarity.

**Features:**

- Handles typos and partial matches
- Case-insensitive
- Returns similarity score (0-1)
- Falls back to ILIKE if pg_trgm not available

**Example:**

```typescript
const results = await searchByUsername("joh", 20);
// Finds: john, johnny, johan, etc.
```

### `searchByBio(keywords, limit)`

Full-text search across user biographies.

**Features:**

- Uses PostgreSQL `ts_rank` for relevance scoring
- Supports multiple keywords (AND operation)
- English language stemming
- Falls back to simple contains if index not available

**Example:**

```typescript
const results = await searchByBio("travel photography", 20);
// Finds users with bio containing travel-related photography content
```

### `searchByGeography(city?, country?, limit)`

Geographic search by city and/or country.

**Features:**

- Case-insensitive matching
- OR operation (matches either city or country)
- Sorted by username

**Example:**

```typescript
const results = await searchByGeography("Paris", "France", 20);
// Finds users from Paris, France
```

### `searchByLocation(locationId, currentUserId, limit)`

Find users who saved the same location (for future use).

**Features:**

- Excludes current user
- Only shows public/unlisted saves (respects privacy)
- Includes save date context

**Example:**

```typescript
const results = await searchByLocation(123, 456, 20);
// Finds users who saved location #123
```

### `searchUsers(query, type, limit)`

Combined search with intelligent ranking and deduplication.

**Features:**

- Runs multiple search types in parallel
- Deduplicates results by user ID
- Prioritizes higher match scores
- Combines username, bio, and geo searches

**Example:**

```typescript
const results = await searchUsers("photographer paris", "all", 20);
// Searches username, bio, and geography simultaneously
```

### `getUsernameSuggestions(query, limit)`

Fast autocomplete for usernames.

**Features:**

- Optimized for low latency (<50ms target)
- Prefix matching with ILIKE
- Returns just usernames (not full objects)

**Example:**

```typescript
const suggestions = await getUsernameSuggestions("joh", 10);
// Returns: ['john', 'johnny', 'jonathan', ...]
```

## Performance Considerations

### Database Indexes

All search queries use database indexes for optimal performance:

- **Username search**: GIN trigram index enables sub-50ms fuzzy searches
- **Bio search**: Full-text GIN index with ts_rank scoring
- **Geographic search**: B-tree indexes on city/country columns
- **Location search**: Composite index on savedLocations(locationId, visibility)

### Query Optimization

- Limit results to reasonable page sizes (max 50)
- Use offset-based pagination (consider cursor-based for large datasets)
- Fuzzy search falls back to simpler ILIKE if pg_trgm unavailable
- Combined searches run in parallel for speed

### Caching Opportunities (Future)

For high-traffic scenarios, consider caching:

- Popular search queries (Redis)
- Username autocomplete results
- Geographic filter combinations

## Testing

Run the comprehensive test suite:

```bash
# Make sure dev server is running on port 3000
npm run dev

# In another terminal:
./scripts/test-search-apis.sh
```

The test suite covers:

- ✅ Username search
- ✅ Combined search
- ✅ Pagination
- ✅ Validation (short queries, invalid types)
- ✅ Geographic filtering
- ✅ Username suggestions/autocomplete
- ✅ Error handling

## Privacy & Security

### Current Implementation

- All user searches are public (no authentication required)
- Only non-deleted users appear in results (`deletedAt IS NULL`)
- Location-based search respects visibility settings (public/unlisted only)

### Future Enhancements (Day 7)

- Authenticated search with follow status context
- Privacy settings: "hide from search" option
- Visibility controls: public, followers-only, private
- Block list integration

## Integration with UI (Day 6)

The search API is designed to integrate with:

1. **SearchBar component**: Autocomplete dropdown using `/suggestions`
2. **Search results page**: Full search using `/users` with filters
3. **User cards**: Display results with match type indicators
4. **Infinite scroll**: Offset-based pagination for "load more"

## Common Use Cases

### 1. Find users by username

```bash
curl "http://localhost:3000/api/v1/search/users?q=john&type=username&limit=10"
```

### 2. Search bios for interests

```bash
curl "http://localhost:3000/api/v1/search/users?q=photography+travel&type=bio"
```

### 3. Find users in a city

```bash
curl "http://localhost:3000/api/v1/search/users?q=test&city=Tokyo"
```

### 4. Autocomplete in search bar

```bash
# User types "joh"
curl "http://localhost:3000/api/v1/search/suggestions?q=joh&limit=5"
# Returns: ["john", "johnny", "johnson"]
```

### 5. Combined search

```bash
curl "http://localhost:3000/api/v1/search/users?q=photographer&type=all"
# Searches username, bio, and location simultaneously
```

## Migration to Production

**Completed September 17, 2026.**

1. ~~**Enable pg_trgm extension** on production database~~ ✅
2. ~~**Create search indexes** using provided SQL~~ ✅
3. **Test performance** with production data volume
4. **Monitor query times** and optimize if needed
5. **Consider caching** for popular searches

The trigram index is declared in `schema.prisma` so Prisma does not treat it as
drift:

```prisma
@@index([username(ops: raw("gin_trgm_ops"))], map: "idx_users_username_trgm", type: Gin)
```

## Related Documentation

- [Follow System API](./FOLLOW_SYSTEM.md) - User relationships
- [Phase 2A Planning](../planning/PHASE_2A_PLANNING.md) - Overall timeline
- [Database Schema](../database/SCHEMA.md) - Data models

## Status

- ✅ Day 4-5: Backend search (COMPLETE)
- ⏳ Day 6: Search UI
- ⏳ Day 7: Privacy & visibility settings
