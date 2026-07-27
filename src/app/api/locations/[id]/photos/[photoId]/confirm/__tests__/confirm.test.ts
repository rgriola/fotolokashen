import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '../route';

// ── Module mocks ──────────────────────────────────────────────────────────────

vi.mock('@/lib/api-middleware', () => ({
    requireAuth: vi.fn(),
    apiResponse: (data: unknown, status = 200) =>
        new Response(JSON.stringify(data), { status }),
    apiError: (message: string, status = 500, code?: string) =>
        new Response(JSON.stringify({ error: message, code: code ?? `ERROR_${status}` }), { status }),
}));

vi.mock('@/lib/prisma', () => ({
    default: {
        photo: {
            findUnique: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
        },
        securityLog: {
            create: vi.fn(),
        },
    },
}));

vi.mock('@/lib/storage', () => ({
    deleteFromImageKit: vi.fn(),
}));

vi.mock('@/lib/virus-scan', () => ({
    scanFile: vi.fn(),
}));

// ── Imports after mocks ───────────────────────────────────────────────────────

import { requireAuth } from '@/lib/api-middleware';
import prisma from '@/lib/prisma';
import { deleteFromImageKit } from '@/lib/storage';
import { scanFile } from '@/lib/virus-scan';

// ── Helpers ───────────────────────────────────────────────────────────────────

const LOCATION_ID = 10;
const PHOTO_ID = 99;
const IK_FILE_ID = 'ik_file_abc123';
const IK_URL = 'https://ik.imagekit.io/rgriola/development/users/4/photos/test.jpg';

function makeRequest(body: object = {}) {
    return new Request('https://example.com', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
    }) as unknown as import('next/server').NextRequest;
}

function makeParams(locationId = LOCATION_ID, photoId = PHOTO_ID) {
    return { params: Promise.resolve({ id: String(locationId), photoId: String(photoId) }) };
}

const fakeUser = { id: 4, email: 'test@example.com' };

const cleanPhoto = {
    id: PHOTO_ID,
    locationId: LOCATION_ID,
    userId: fakeUser.id,
    imagekitFileId: null,
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('POST /api/locations/[id]/photos/[photoId]/confirm — virus scan', () => {
    beforeEach(() => {
        vi.resetAllMocks();

        // Default: authenticated
        vi.mocked(requireAuth).mockResolvedValue({
            authorized: true,
            user: fakeUser,
        } as never);

        // Default: photo found
        vi.mocked(prisma.photo.findUnique).mockResolvedValue(cleanPhoto as never);

        // Default: fetch returns small valid buffer
        global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
        } as never);
    });

    it('returns 400 SECURITY_VIOLATION and cleans up when file is infected', async () => {
        vi.mocked(scanFile).mockResolvedValue({
            isInfected: true,
            viruses: ['Eicar-Test-Signature'],
            scannerAvailable: true,
        });
        vi.mocked(deleteFromImageKit).mockResolvedValue({ success: true });
        vi.mocked(prisma.photo.delete).mockResolvedValue(cleanPhoto as never);
        vi.mocked(prisma.securityLog.create).mockResolvedValue({} as never);

        const res = await POST(
            makeRequest({ imagekitFileId: IK_FILE_ID, imagekitUrl: IK_URL }),
            makeParams()
        );

        expect(res.status).toBe(400);
        const body = await res.json();
        expect(body.code).toBe('SECURITY_VIOLATION');

        // Infected file must be deleted from storage
        expect(deleteFromImageKit).toHaveBeenCalledWith(IK_FILE_ID);

        // Pending Photo row must be removed
        expect(prisma.photo.delete).toHaveBeenCalledWith({ where: { id: PHOTO_ID } });

        // Security event must be logged
        expect(prisma.securityLog.create).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    userId: fakeUser.id,
                    eventType: 'PHOTO_UPLOAD_BLOCKED',
                    metadata: expect.objectContaining({
                        directUpload: true,
                        locationId: LOCATION_ID,
                        photoId: PHOTO_ID,
                    }),
                }),
            })
        );

        // Photo must NOT be confirmed in the DB
        expect(prisma.photo.update).not.toHaveBeenCalled();
    });

    it('confirms the photo and does NOT call delete when file is clean', async () => {
        vi.mocked(scanFile).mockResolvedValue({ isInfected: false, scannerAvailable: true });
        vi.mocked(prisma.photo.update).mockResolvedValue({
            ...cleanPhoto,
            imagekitFileId: IK_FILE_ID,
            imagekitFilePath: '/development/users/4/photos/test.jpg',
            uploadedAt: new Date(),
        } as never);

        const res = await POST(
            makeRequest({ imagekitFileId: IK_FILE_ID, imagekitUrl: IK_URL }),
            makeParams()
        );

        expect(res.status).toBe(200);
        expect(deleteFromImageKit).not.toHaveBeenCalled();
        expect(prisma.photo.delete).not.toHaveBeenCalled();
        expect(prisma.securityLog.create).not.toHaveBeenCalled();
        expect(prisma.photo.update).toHaveBeenCalled();
    });

    it('deletes the photo and returns 500 when the fetch to scan fails', async () => {
        global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));
        vi.mocked(deleteFromImageKit).mockResolvedValue({ success: true });
        vi.mocked(prisma.photo.delete).mockResolvedValue(cleanPhoto as never);

        const res = await POST(
            makeRequest({ imagekitFileId: IK_FILE_ID, imagekitUrl: IK_URL }),
            makeParams()
        );

        expect(res.status).toBe(500);
        expect(deleteFromImageKit).toHaveBeenCalledWith(IK_FILE_ID);
        expect(prisma.photo.delete).toHaveBeenCalledWith({ where: { id: PHOTO_ID } });
        expect(prisma.photo.update).not.toHaveBeenCalled();
    });

    it('returns 401 when not authenticated', async () => {
        vi.mocked(requireAuth).mockResolvedValue({ authorized: false, error: 'Auth required' } as never);

        const res = await POST(
            makeRequest({ imagekitFileId: IK_FILE_ID, imagekitUrl: IK_URL }),
            makeParams()
        );

        expect(res.status).toBe(401);
        expect(prisma.photo.findUnique).not.toHaveBeenCalled();
    });
});
