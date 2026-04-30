/**
 * Canonical Zod schemas for `/api/v1/*` mobile API responses.
 *
 * These mirror `/docs/api/MOBILE_API_SCHEMAS.md` and are the single source of
 * truth for what the iOS app expects. Used by:
 *   - Contract tests (`mobileApiV1Contract.test.ts`)
 *   - Future route-handler tests as a serialization sanity check
 *
 * RULES (do not bypass):
 *   1. Coordinates MUST be `lat` / `lng` — never `latitude` / `longitude`.
 *   2. Optional fields use explicit `.nullable()` — never omit.
 *   3. Dates are ISO 8601 strings.
 *   4. Use `.strict()` so unknown keys (including `latitude`/`longitude`)
 *      cause validation failures.
 */

import { z } from 'zod';

// --- ImageKit photo size variants ---

export const photoSizesSchema = z
    .object({
        thumbnail: z.string(),
        card: z.string(),
        gallery: z.string(),
        full: z.string(),
        og: z.string(),
    })
    .strict();

// --- User summary (USER_SUMMARY_SELECT) ---

export const userSummarySchema = z
    .object({
        id: z.number().int(),
        username: z.string(),
        firstName: z.string().nullable(),
        lastName: z.string().nullable(),
        avatar: z.string().nullable(),
    })
    .strict();

// --- Photo (full, used in nested-location responses) ---

export const photoFullSchema = z
    .object({
        id: z.number().int(),
        imagekitFilePath: z.string(),
        isPrimary: z.boolean(),
        caption: z.string().nullable(),
        sizes: photoSizesSchema.nullable(),
    })
    .strict();

// --- Photo (thumbnail-only, used in flattened map responses) ---
// `attachPhotoSizes` preserves all original fields and adds `sizes`.
// `/api/v1/locations/public` selects only `imagekitFilePath`.
// `/api/v1/locations/friends` additionally selects `id` and `isPrimary`.
// We allow either shape but disallow `latitude`/`longitude` and other surprises.

export const photoThumbnailSchema = z
    .object({
        id: z.number().int().optional(),
        imagekitFilePath: z.string(),
        isPrimary: z.boolean().optional(),
        sizes: photoSizesSchema.nullable(),
    })
    .strict();

// --- Nested location (used in /users/{username}/locations) ---

export const nestedLocationSchema = z
    .object({
        id: z.number().int(),
        placeId: z.string(),
        name: z.string(),
        address: z.string().nullable(),
        city: z.string().nullable(),
        state: z.string().nullable(),
        lat: z.number(),
        lng: z.number(),
        type: z.string().nullable(),
        rating: z.number().nullable(),
        photos: z.array(photoFullSchema),
    })
    .strict();

// --- SocialLocation (UserSave wrapper, /users/{username}/locations) ---

export const socialLocationSchema = z
    .object({
        id: z.number().int(),
        caption: z.string().nullable(),
        savedAt: z.string(), // ISO 8601
        visibility: z.string(),
        location: nestedLocationSchema,
    })
    .strict();

// --- MapSocialLocation (flattened, /locations/public & /locations/friends) ---

export const mapSocialLocationSchema = z
    .object({
        id: z.number().int(),
        placeId: z.string(),
        name: z.string(),
        address: z.string().nullable(),
        city: z.string().nullable(),
        state: z.string().nullable(),
        lat: z.number(),
        lng: z.number(),
        type: z.string().nullable(),
        rating: z.number().nullable(),
        caption: z.string().nullable(),
        savedAt: z.string().nullable(),
        photos: z.array(photoThumbnailSchema),
        user: userSummarySchema,
    })
    .strict();

// --- Pagination shapes ---

export const cursorPaginationEnvelopeSchema = z
    .object({
        locations: z.array(mapSocialLocationSchema),
        limit: z.number().int(),
        total: z.number().int(),
        hasMore: z.boolean(),
        nextCursor: z.string().nullable(),
    })
    .strict();

export const offsetPaginationSchema = z
    .object({
        page: z.number().int(),
        limit: z.number().int(),
        total: z.number().int(),
        totalPages: z.number().int(),
        hasMore: z.boolean(),
    })
    .strict();

export const userLocationsEnvelopeSchema = z
    .object({
        locations: z.array(socialLocationSchema),
        pagination: offsetPaginationSchema,
        user: z
            .object({
                username: z.string(),
                profileUrl: z.string(),
            })
            .strict(),
    })
    .strict();

// --- Endpoint → schema registry ---
//
// Used by contract tests to assert each documented endpoint has a schema and
// to provide a single import surface for future route-handler tests.

export const mobileApiV1Schemas = {
    'GET /api/v1/locations/public': cursorPaginationEnvelopeSchema,
    'GET /api/v1/locations/friends': cursorPaginationEnvelopeSchema,
    'GET /api/v1/users/{username}/locations': userLocationsEnvelopeSchema,
} as const;

export type MobileApiV1Endpoint = keyof typeof mobileApiV1Schemas;
