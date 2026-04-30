# Mobile API Response Schemas (v1)

**Last Updated**: February 23, 2026  
**Purpose**: Define canonical response structures for `/api/v1/*` endpoints consumed by iOS/Android apps

---

## ⚠️ CRITICAL: Coordinate Field Names

> **NEVER use `latitude`/`longitude` in mobile API responses.**
> **ALWAYS use `lat`/`lng`.**
>
> This is the #1 cause of iOS decoding failures. When locations don't appear in the iOS app, check the API response field names first.

---

## 🎯 Core Principles

1. **Field Names**: Use `lat`/`lng` (NOT `latitude`/`longitude`) — matches Prisma schema and iOS models
2. **Null Safety**: Always use explicit `null` instead of omitting fields
3. **Date Format**: ISO 8601 strings (`toISOString()`)
4. **Pagination**: Consistent structure across all paginated endpoints

---

## 📍 Location Coordinate Fields

**❌ WRONG**:

```json
{
  "latitude": 37.7749,
  "longitude": -122.4194
}
```

**✅ CORRECT**:

```json
{
  "lat": 37.7749,
  "lng": -122.4194
}
```

**Rationale**: Matches Prisma schema (`Location.lat`, `Location.lng`) and Google Maps API conventions.

### Request Bodies (POST `/api/locations`)

The legacy web `POST /api/locations` endpoint accepts **either** key pair for backward compatibility:

| Sent by client           | Accepted? | Notes                                                         |
| ------------------------ | --------- | ------------------------------------------------------------- |
| `lat` + `lng`            | ✅ Yes    | **Preferred**. Matches `/api/v1/*` and Prisma schema.         |
| `latitude` + `longitude` | ✅ Yes    | Legacy. Used by older iOS builds and existing `/web` clients. |
| Both pairs present       | ✅ Yes    | `lat`/`lng` win.                                              |

iOS clients SHOULD migrate to `lat`/`lng` for consistency, but no breaking change is required.

---

## 📐 Standard Response Structures

### Location Object (Nested in User Saves)

Used in: `/api/v1/users/{username}/locations`, `/api/v1/locations/public`, `/api/v1/locations/friends`

```typescript
{
  "id": number,           // Location.id
  "placeId": string,
  "name": string,
  "address": string | null,
  "city": string | null,
  "state": string | null,
  "lat": number,          // NOT latitude
  "lng": number,          // NOT longitude
  "type": string | null,
  "rating": number | null,
  "photos": [
    {
      "id": number,
      "imagekitFilePath": string,
      "isPrimary": boolean,
      "caption": string | null,
      "sizes": {              // Pre-computed ImageKit URL variants (additive, may be null if filePath missing)
        "thumbnail": string,  // 200x200 — grids, avatars, marker thumbs
        "card": string,       // 400x300 — list rows, location cards
        "gallery": string,    // 1200x800 — detail view, lightbox
        "full": string,       // 1600w   — high-res download / share
        "og": string          // 1200x630 — Open Graph / social share
      } | null
    }
  ]
}
```

### Social Location Object (User's Public Profile)

Used in: `/api/v1/users/{username}/locations`

```typescript
{
  "id": number,           // UserSave.id (NOT Location.id)
  "caption": string | null,
  "savedAt": string,      // ISO 8601
  "visibility": string,   // "public" (only public locations returned)
  "location": {
    // Location object structure above
  }
}
```

### Map Social Location Object (Friends/Public Map)

Used in: `/api/v1/locations/public`, `/api/v1/locations/friends`

```typescript
{
  "id": number,           // Location.id (flattened)
  "placeId": string,
  "name": string,
  "address": string | null,
  "city": string | null,
  "state": string | null,
  "lat": number,
  "lng": number,
  "type": string | null,
  "rating": number | null,
  "caption": string | null,
  "savedAt": string | null,
  "photos": [             // Primary photo only (for thumbnail)
    {
      "imagekitFilePath": string,
      "sizes": {          // Same shape as Photo.sizes above (or null)
        "thumbnail": string,
        "card": string,
        "gallery": string,
        "full": string,
        "og": string
      } | null
    }
  ],
  "user": {
    "id": number,
    "username": string,
    "firstName": string | null,
    "lastName": string | null,
    "avatar": string | null
  }
}
```

### Pagination Metadata

Two paginations styles are in use. New endpoints SHOULD adopt **cursor-based**.

**Cursor-based** (preferred — used by `/api/v1/locations/friends`, `/api/v1/locations/public`):

```typescript
{
  "locations": [...],          // Page of records (length <= limit)
  "limit": number,             // Page size requested (clamped server-side)
  "total": number,             // Length of THIS page only (legacy field)
  "hasMore": boolean,          // True if another page exists
  "nextCursor": string | null  // Pass back as `?cursor=` to fetch next page
}
```

Client request: `GET /api/v1/locations/public?limit=50&cursor=<previousNextCursor>`

- Cursor is the `UserSave.id` of the last record in the previous page (opaque string).
- When `nextCursor` is `null`, no more pages.
- Ordering is `savedAt DESC, id DESC` (deterministic — safe across cursor jumps).

**Offset-based** (legacy — older endpoints):

```typescript
{
  "page": number,
  "limit": number,
  "total": number,
  "totalPages": number,
  "hasMore": boolean
}
```

---

## 🔍 iOS Model Mapping

iOS uses these `Codable` structs to decode responses:

| Backend Field      | iOS Model Property | Type                     |
| ------------------ | ------------------ | ------------------------ |
| `lat`              | `lat`              | `Double`                 |
| `lng`              | `lng`              | `Double`                 |
| `placeId`          | `placeId`          | `String?`                |
| `savedAt`          | `savedAt`          | `String?` (ISO 8601)     |
| `imagekitFilePath` | `imagekitFilePath` | `String`                 |
| `sizes.thumbnail`  | `sizes.thumbnail`  | `String?` (ImageKit URL) |
| `sizes.card`       | `sizes.card`       | `String?` (ImageKit URL) |
| `sizes.gallery`    | `sizes.gallery`    | `String?` (ImageKit URL) |
| `sizes.full`       | `sizes.full`       | `String?` (ImageKit URL) |

**Key Models**:

- `SocialLocation` - for `/api/v1/users/{username}/locations`
- `MapSocialLocation` - for `/api/v1/locations/public` & `/friends`
- `LocationPhoto` - simplified photo with only `id`, `imagekitFilePath`, `isPrimary`

---

## ✅ Validation Checklist for New Endpoints

When creating a new v1 mobile endpoint:

- [ ] Use `lat`/`lng` (not `latitude`/`longitude`)
- [ ] Return `null` for missing optional fields (don't omit)
- [ ] Use `toISOString()` for all dates
- [ ] Include pagination metadata if returning arrays
- [ ] Match existing pagination structure
- [ ] Test with iOS app to verify decoding
- [ ] Document in this file

---

## 🐛 Common Mistakes

### ❌ Mistake 1: Inconsistent Coordinate Fields

```typescript
// Bug: /api/v1/users/{username}/locations used latitude/longitude
location: {
  latitude: save.location.lat,  // ❌ Wrong key name
  longitude: save.location.lng  // ❌ Wrong key name
}
```

**Fix**: Use `lat`/`lng` consistently

```typescript
location: {
  lat: save.location.lat,  // ✅ Correct
  lng: save.location.lng   // ✅ Correct
}
```

### ❌ Mistake 2: Omitting Null Fields

```typescript
// Don't do this - breaks iOS Codable decoding
address: save.location.address || undefined; // ❌ undefined becomes omitted
```

**Fix**: Always explicitly return `null`

```typescript
address: save.location.address || null; // ✅ Correct
```

### ❌ Mistake 3: Date String Formats

```typescript
savedAt: save.savedAt.toString(); // ❌ Wrong - returns JS date format
```

**Fix**: Use ISO 8601

```typescript
savedAt: save.savedAt.toISOString(); // ✅ Correct
```

---

## 📚 Related Documentation

- [iOS App Models](../../fotolokashen-ios/fotolokashen/fotolokashen/swift-utilities/Models/)
- [Prisma Schema](../../prisma/schema.prisma)
- [Social Features API](./SOCIAL_FEATURES_API.md)
- [Photo Upload API](./PHOTO_UPLOAD_API.md)
