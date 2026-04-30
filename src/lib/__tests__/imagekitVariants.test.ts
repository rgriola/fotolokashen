import { describe, it, expect } from 'vitest';
import {
    getPhotoVariants,
    attachPhotoSizes,
    IMAGEKIT_URL_ENDPOINT,
} from '@/lib/imagekit';

describe('getPhotoVariants', () => {
    const filePath = '/development/users/123/photos/abc.jpg';

    it('returns null for empty/missing filePath', () => {
        expect(getPhotoVariants(null)).toBeNull();
        expect(getPhotoVariants(undefined)).toBeNull();
        expect(getPhotoVariants('')).toBeNull();
    });

    it('returns all five size variants', () => {
        const sizes = getPhotoVariants(filePath);
        expect(sizes).not.toBeNull();
        expect(Object.keys(sizes!).sort()).toEqual(
            ['card', 'full', 'gallery', 'og', 'thumbnail'].sort(),
        );
    });

    it('builds URLs against the configured ImageKit endpoint', () => {
        const sizes = getPhotoVariants(filePath)!;
        expect(sizes.thumbnail.startsWith(IMAGEKIT_URL_ENDPOINT)).toBe(true);
        expect(sizes.gallery.startsWith(IMAGEKIT_URL_ENDPOINT)).toBe(true);
    });

    it('encodes the expected ImageKit transforms per variant', () => {
        const sizes = getPhotoVariants(filePath)!;
        // Each variant must include its size + auto format
        expect(sizes.thumbnail).toContain('w-200');
        expect(sizes.thumbnail).toContain('h-200');
        expect(sizes.card).toContain('w-400');
        expect(sizes.gallery).toContain('w-1200');
        expect(sizes.full).toContain('w-1600');
        expect(sizes.og).toContain('w-1200');
        expect(sizes.og).toContain('h-630');

        // All variants should request auto format for WebP/AVIF where supported
        Object.values(sizes).forEach((url) => {
            expect(url).toContain('fo-auto');
        });
    });

    it('handles paths without leading slash', () => {
        const sizes = getPhotoVariants('production/users/1/photos/x.jpg');
        expect(sizes).not.toBeNull();
        expect(sizes!.thumbnail).toContain('/production/users/1/photos/x.jpg');
    });
});

describe('attachPhotoSizes', () => {
    it('preserves existing photo fields and adds sizes', () => {
        const photo = {
            id: 42,
            imagekitFilePath: '/development/users/1/photos/abc.jpg',
            isPrimary: true,
            caption: 'A photo',
        };

        const result = attachPhotoSizes(photo);

        expect(result.id).toBe(42);
        expect(result.imagekitFilePath).toBe(photo.imagekitFilePath);
        expect(result.isPrimary).toBe(true);
        expect(result.caption).toBe('A photo');
        expect(result.sizes).not.toBeNull();
        expect(result.sizes!.thumbnail).toContain('w-200');
    });

    it('returns sizes: null when imagekitFilePath is missing', () => {
        const photo = { id: 1, imagekitFilePath: '' };
        const result = attachPhotoSizes(photo);
        expect(result.sizes).toBeNull();
    });

    it('does not mutate the input photo', () => {
        const photo = {
            id: 1,
            imagekitFilePath: '/development/users/1/photos/abc.jpg',
        };
        attachPhotoSizes(photo);
        expect(Object.prototype.hasOwnProperty.call(photo, 'sizes')).toBe(false);
    });
});
