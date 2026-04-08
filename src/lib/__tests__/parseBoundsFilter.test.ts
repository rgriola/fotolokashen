import { describe, it, expect } from 'vitest';
import { parseBoundsFilter } from '@/lib/api-middleware';

describe('parseBoundsFilter', () => {
    it('returns null when no bounds param present', () => {
        const params = new URLSearchParams();
        expect(parseBoundsFilter(params)).toBeNull();
    });

    it('parses JSON bounds format', () => {
        const params = new URLSearchParams({
            bounds: JSON.stringify({ south: 40.0, north: 41.0, west: -74.0, east: -73.0 }),
        });
        const result = parseBoundsFilter(params);
        expect(result).toEqual({
            lat: { gte: 40.0, lte: 41.0 },
            lng: { gte: -74.0, lte: -73.0 },
        });
    });

    it('parses CSV bounds format', () => {
        const params = new URLSearchParams({ bounds: '40,-74,41,-73' });
        const result = parseBoundsFilter(params);
        expect(result).toEqual({
            lat: { gte: 40, lte: 41 },
            lng: { gte: -74, lte: -73 },
        });
    });

    it('handles reversed CSV coords (min/max swap)', () => {
        const params = new URLSearchParams({ bounds: '41,-73,40,-74' });
        const result = parseBoundsFilter(params);
        expect(result).toEqual({
            lat: { gte: 40, lte: 41 },
            lng: { gte: -74, lte: -73 },
        });
    });

    it('throws on invalid JSON bounds', () => {
        const params = new URLSearchParams({ bounds: '{bad json' });
        expect(() => parseBoundsFilter(params)).toThrow();
    });

    it('throws on JSON missing required fields', () => {
        const params = new URLSearchParams({
            bounds: JSON.stringify({ south: 40, north: 41 }),
        });
        expect(() => parseBoundsFilter(params)).toThrow();
    });

    it('throws on invalid CSV bounds (not enough values)', () => {
        const params = new URLSearchParams({ bounds: '40,-74,41' });
        expect(() => parseBoundsFilter(params)).toThrow();
    });

    it('throws on non-numeric CSV values', () => {
        const params = new URLSearchParams({ bounds: '40,abc,41,-73' });
        expect(() => parseBoundsFilter(params)).toThrow();
    });
});
