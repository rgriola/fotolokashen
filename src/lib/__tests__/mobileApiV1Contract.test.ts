/**
 * Contract tests for `/api/v1/*` mobile API responses.
 *
 * Two layers of protection:
 *
 *   1. **Schema validation** — Representative golden fixtures (one per
 *      documented endpoint) are validated against the canonical Zod schemas
 *      from `mobileApiV1.ts`. The schemas use `.strict()` so unknown keys
 *      (most notably `latitude` / `longitude`) cause failures.
 *
 *   2. **Source scan** — A regex sweep of every `route.ts` under
 *      `src/app/api/v1/` rejects the forbidden response keys
 *      `latitude:` / `longitude:`. This catches mistakes the unit fixtures
 *      cannot exercise (e.g., a new endpoint added without a fixture).
 *
 * See: docs/api/MOBILE_API_SCHEMAS.md
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import {
    mobileApiV1Schemas,
    cursorPaginationEnvelopeSchema,
    userLocationsEnvelopeSchema,
    mapSocialLocationSchema,
    socialLocationSchema,
    photoSizesSchema,
} from '@/lib/schemas/mobileApiV1';

// --- Fixtures (mirror real serializer output) -------------------------------

const sampleSizes = {
    thumbnail: 'https://ik.example/path?tr=w-200,h-200',
    card: 'https://ik.example/path?tr=w-400,h-300',
    gallery: 'https://ik.example/path?tr=w-1200,h-800',
    full: 'https://ik.example/path?tr=w-1600',
    og: 'https://ik.example/path?tr=w-1200,h-630',
};

const sampleUserSummary = {
    id: 7,
    username: 'rodczaro',
    firstName: 'Rod',
    lastName: null,
    avatar: null,
};

const samplePublicResponse = {
    locations: [
        {
            id: 107,
            placeId: 'ChIJabc123',
            name: 'Brooklyn Bridge',
            address: '123 Front St',
            city: 'Brooklyn',
            state: 'NY',
            lat: 40.7061,
            lng: -73.9969,
            type: 'BROLL',
            rating: null,
            caption: 'Magic hour',
            savedAt: '2026-04-19T12:34:56.000Z',
            photos: [
                {
                    imagekitFilePath: '/prod/users/7/photos/abc.jpg',
                    sizes: sampleSizes,
                },
            ],
            user: sampleUserSummary,
        },
        {
            // Minimal record — every nullable field actually null,
            // photos array empty.
            id: 108,
            placeId: 'ChIJxyz999',
            name: 'Empty fixture',
            address: null,
            city: null,
            state: null,
            lat: 0,
            lng: 0,
            type: null,
            rating: null,
            caption: null,
            savedAt: null,
            photos: [],
            user: { ...sampleUserSummary, firstName: null, avatar: null },
        },
    ],
    limit: 100,
    total: 2,
    hasMore: false,
    nextCursor: null,
};

const sampleFriendsResponse = {
    locations: [
        {
            id: 200,
            placeId: 'ChIJfriend1',
            name: 'Friend Spot',
            address: null,
            city: null,
            state: null,
            lat: 37.7749,
            lng: -122.4194,
            type: 'STORY',
            rating: 4,
            caption: null,
            savedAt: '2026-04-18T08:00:00.000Z',
            photos: [
                {
                    id: 55,
                    imagekitFilePath: '/prod/users/12/photos/x.jpg',
                    isPrimary: true,
                    sizes: sampleSizes,
                },
            ],
            user: sampleUserSummary,
        },
    ],
    limit: 500,
    total: 1,
    hasMore: true,
    nextCursor: '200',
};

const sampleUserLocationsResponse = {
    locations: [
        {
            id: 9001,
            caption: 'Loved this',
            savedAt: '2026-04-15T10:00:00.000Z',
            visibility: 'public',
            location: {
                id: 42,
                placeId: 'ChIJloc42',
                name: 'Cafe Roma',
                address: '500 Mission St',
                city: 'San Francisco',
                state: 'CA',
                lat: 37.7891,
                lng: -122.3987,
                type: 'INTERVIEW',
                rating: 5,
                photos: [
                    {
                        id: 1,
                        imagekitFilePath: '/prod/users/7/photos/cafe.jpg',
                        isPrimary: true,
                        caption: null,
                        sizes: sampleSizes,
                    },
                ],
            },
        },
    ],
    pagination: {
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1,
        hasMore: false,
    },
    user: {
        username: 'rodczaro',
        profileUrl: '/@rodczaro',
    },
};

// --- Tests ------------------------------------------------------------------

describe('Mobile API v1 — schema contract', () => {
    it('photoSizes accepts complete shape and rejects extras', () => {
        expect(() => photoSizesSchema.parse(sampleSizes)).not.toThrow();
        expect(() =>
            photoSizesSchema.parse({ ...sampleSizes, extra: 'x' }),
        ).toThrow();
    });

    it('GET /api/v1/locations/public matches cursor envelope', () => {
        const result = cursorPaginationEnvelopeSchema.safeParse(samplePublicResponse);
        if (!result.success) {
            // Surface zod issues for easier debugging on failure
            throw new Error(JSON.stringify(result.error.issues, null, 2));
        }
        expect(result.success).toBe(true);
    });

    it('GET /api/v1/locations/friends matches cursor envelope', () => {
        const result = cursorPaginationEnvelopeSchema.safeParse(sampleFriendsResponse);
        if (!result.success) {
            throw new Error(JSON.stringify(result.error.issues, null, 2));
        }
        expect(result.success).toBe(true);
    });

    it('GET /api/v1/users/{username}/locations matches offset envelope', () => {
        const result = userLocationsEnvelopeSchema.safeParse(sampleUserLocationsResponse);
        if (!result.success) {
            throw new Error(JSON.stringify(result.error.issues, null, 2));
        }
        expect(result.success).toBe(true);
    });

    it('rejects latitude/longitude on flattened map locations', () => {
        const bad = {
            ...samplePublicResponse.locations[0],
            latitude: 40.7061,
            longitude: -73.9969,
        };
        expect(() => mapSocialLocationSchema.parse(bad)).toThrow();
    });

    it('rejects latitude/longitude on nested locations', () => {
        const bad = {
            ...sampleUserLocationsResponse.locations[0],
            location: {
                ...sampleUserLocationsResponse.locations[0].location,
                latitude: 37.7891,
                longitude: -122.3987,
            },
        };
        expect(() => socialLocationSchema.parse(bad)).toThrow();
    });

    it('every documented endpoint has a registered schema', () => {
        const keys = Object.keys(mobileApiV1Schemas);
        expect(keys).toContain('GET /api/v1/locations/public');
        expect(keys).toContain('GET /api/v1/locations/friends');
        expect(keys).toContain('GET /api/v1/users/{username}/locations');
    });
});

// --- Source-level guard -----------------------------------------------------

const V1_ROOT = join(process.cwd(), 'src/app/api/v1');

function findRouteFiles(dir: string): string[] {
    const out: string[] = [];
    for (const entry of readdirSync(dir)) {
        const full = join(dir, entry);
        const stat = statSync(full);
        if (stat.isDirectory()) {
            out.push(...findRouteFiles(full));
        } else if (entry === 'route.ts') {
            out.push(full);
        }
    }
    return out;
}

describe('Mobile API v1 — source guard against latitude/longitude', () => {
    const routeFiles = findRouteFiles(V1_ROOT);

    it('finds at least one v1 route file', () => {
        expect(routeFiles.length).toBeGreaterThan(0);
    });

    // Match `latitude:` or `longitude:` used as a JS object key.
    // This catches `{ latitude: ... }` / `{ longitude: ... }` in serializer
    // payloads while ignoring incidental mentions in comments or strings.
    const FORBIDDEN_KEY = /(^|[\s{,(])(latitude|longitude)\s*:/m;

    for (const file of routeFiles) {
        const rel = file.replace(process.cwd() + '/', '');
        it(`${rel} does not emit latitude/longitude as a response key`, () => {
            const content = readFileSync(file, 'utf-8');
            // Strip line comments + block comments before scanning so docs
            // referencing `latitude:` cannot trip the guard.
            const stripped = content
                .replace(/\/\*[\s\S]*?\*\//g, '')
                .replace(/\/\/.*$/gm, '');
            const match = stripped.match(FORBIDDEN_KEY);
            if (match) {
                throw new Error(
                    `${rel} contains forbidden key '${match[2]}:' — mobile API ` +
                        `MUST use lat/lng. See docs/api/MOBILE_API_SCHEMAS.md`,
                );
            }
            expect(match).toBeNull();
        });
    }
});
