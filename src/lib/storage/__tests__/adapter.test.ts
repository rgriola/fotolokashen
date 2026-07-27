import { describe, it, expect } from 'vitest';
import { imagekitAdapter, getPhotoUrl, getPhotoVariants, IMAGEKIT_URL_ENDPOINT } from '@/lib/storage';
import type { StorageAdapter } from '@/lib/storage';

describe('imagekitAdapter (StorageAdapter contract)', () => {
    it('implements the full StorageAdapter interface shape', () => {
        expect(typeof imagekitAdapter.upload).toBe('function');
        expect(typeof imagekitAdapter.delete).toBe('function');
        expect(typeof imagekitAdapter.getUrl).toBe('function');
        expect(typeof imagekitAdapter.getPhotoUrl).toBe('function');
        expect(typeof imagekitAdapter.getPhotoVariants).toBe('function');
        expect(typeof imagekitAdapter.generateSignedUploadUrl).toBe('function');
    });

    it('satisfies the StorageAdapter type at compile time', () => {
        // This assignment fails to typecheck if imagekitAdapter drifts from the interface.
        const adapter: StorageAdapter = imagekitAdapter;
        expect(adapter).toBe(imagekitAdapter);
    });

    it('getUrl matches the standalone getImageKitUrl-equivalent output', () => {
        const filePath = '/development/users/1/photos/abc.jpg';
        expect(imagekitAdapter.getUrl(filePath)).toBe(`${IMAGEKIT_URL_ENDPOINT}${filePath}`);
    });

    it('getPhotoUrl matches the standalone getPhotoUrl helper', () => {
        const filePath = '/development/users/1/photos/abc.jpg';
        expect(imagekitAdapter.getPhotoUrl(filePath, 'card')).toBe(getPhotoUrl(filePath, 'card'));
    });

    it('getPhotoVariants matches the standalone getPhotoVariants helper', () => {
        const filePath = '/development/users/1/photos/abc.jpg';
        expect(imagekitAdapter.getPhotoVariants(filePath)).toEqual(getPhotoVariants(filePath));
    });

    it('getPhotoVariants returns null for a missing file path, same as the standalone helper', () => {
        expect(imagekitAdapter.getPhotoVariants(null)).toBeNull();
    });
});
