import { describe, it, expect } from 'vitest';
import { apiResponse, apiError, serializeUser } from '@/lib/api-middleware';

describe('apiResponse', () => {
    it('returns JSON with default 200 status', async () => {
        const res = apiResponse({ foo: 'bar' });
        expect(res.status).toBe(200);
        const body = await res.json();
        expect(body).toEqual({ foo: 'bar' });
    });

    it('returns JSON with custom status', async () => {
        const res = apiResponse({ created: true }, 201);
        expect(res.status).toBe(201);
    });
});

describe('apiError', () => {
    it('returns error JSON with default 500 status', async () => {
        const res = apiError('Something broke');
        expect(res.status).toBe(500);
        const body = await res.json();
        expect(body.error).toBe('Something broke');
        expect(body.code).toBe('ERROR_500');
    });

    it('returns error with custom status and code', async () => {
        const res = apiError('Not found', 404, 'RESOURCE_NOT_FOUND');
        expect(res.status).toBe(404);
        const body = await res.json();
        expect(body.error).toBe('Not found');
        expect(body.code).toBe('RESOURCE_NOT_FOUND');
    });
});

describe('serializeUser', () => {
    it('converts Date fields to ISO strings', () => {
        const date = new Date('2025-01-01T00:00:00Z');
        const user = {
            id: 1,
            email: 'test@example.com',
            username: 'test',
            createdAt: date,
            gpsPermissionUpdated: date,
            homeLocationUpdated: date,
        };
        const result = serializeUser(user);
        expect(result.createdAt).toBe('2025-01-01T00:00:00.000Z');
        expect(result.gpsPermissionUpdated).toBe('2025-01-01T00:00:00.000Z');
        expect(result.homeLocationUpdated).toBe('2025-01-01T00:00:00.000Z');
    });

    it('handles null date fields', () => {
        const user = {
            createdAt: new Date('2025-01-01'),
            gpsPermissionUpdated: null,
            homeLocationUpdated: null,
        };
        const result = serializeUser(user);
        expect(result.gpsPermissionUpdated).toBeNull();
        expect(result.homeLocationUpdated).toBeNull();
    });
});
