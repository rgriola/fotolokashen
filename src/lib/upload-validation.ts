import { scanFile } from '@/lib/virus-scan';
import { FILE_SIZE_LIMITS, ALLOWED_IMAGE_FORMATS } from '@/lib/constants/upload';

export type UploadType = 'location' | 'avatar' | 'banner';

export interface ValidatedUpload {
    buffer: Buffer;
    file: File;
    uploadType: UploadType;
    originalMimeType: string;
    originalExtension: string;
    needsConversion: boolean;
}

/**
 * Validate and virus-scan an uploaded image file.
 *
 * Checks: required fields, file type, file size, virus scan.
 * Returns a ValidatedUpload on success, or a string error message on failure.
 *
 * Usage:
 *   const result = await validateAndScanUpload(formData, userId);
 *   if (typeof result === 'string') return apiError(result, 400);
 *   // result is ValidatedUpload
 */
export async function validateAndScanUpload(
    formData: FormData,
    userId: number,
    options?: { fileField?: string }
): Promise<ValidatedUpload | { error: string; code: string; status: number }> {
    const fileField = options?.fileField ?? 'photo';
    const file = formData.get(fileField) as File | null;
    const uploadType = formData.get('uploadType') as string | null;

    // Required fields
    if (!file) {
        return { error: 'No file provided', code: 'NO_FILE', status: 400 };
    }

    if (!uploadType || !['location', 'avatar', 'banner'].includes(uploadType)) {
        return { error: 'Invalid uploadType', code: 'INVALID_TYPE', status: 400 };
    }

    // File type validation
    const fileExtension = file.name.substring(file.name.lastIndexOf('.'));
    const isValidMimeType = ALLOWED_IMAGE_FORMATS.MIME_TYPES.includes(
        file.type.toLowerCase() as (typeof ALLOWED_IMAGE_FORMATS.MIME_TYPES)[number]
    );
    const isValidExtension = ALLOWED_IMAGE_FORMATS.EXTENSIONS.includes(
        fileExtension as (typeof ALLOWED_IMAGE_FORMATS.EXTENSIONS)[number]
    );

    if (!isValidMimeType && !isValidExtension) {
        console.warn(`[Upload Validation] REJECTED: Invalid file type: ${file.type}, ext: ${fileExtension}`);
        return { error: 'File must be JPEG, HEIC, or TIFF format', code: 'INVALID_FILE_TYPE', status: 400 };
    }

    // File size validation
    const maxSize =
        uploadType === 'location'
            ? FILE_SIZE_LIMITS.PHOTO
            : uploadType === 'banner'
              ? FILE_SIZE_LIMITS.BANNER
              : FILE_SIZE_LIMITS.AVATAR;

    const maxSizeBytes = maxSize * 1024 * 1024;

    if (file.size > maxSizeBytes) {
        console.warn(
            `[Upload Validation] REJECTED: File too large: ${(file.size / 1024 / 1024).toFixed(2)}MB (max ${maxSize}MB)`
        );
        return { error: `File size must be less than ${maxSize}MB`, code: 'FILE_TOO_LARGE', status: 400 };
    }

    // Convert to buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Virus scan
    const scanResult = await scanFile(buffer, file.name);
    if (scanResult.isInfected) {
        console.error(`[Upload Validation] 🚨 INFECTED: ${file.name}`, scanResult.viruses);
        return { error: scanResult.error || 'File failed security scan', code: 'SECURITY_VIOLATION', status: 400 };
    }

    const needsConversion =
        file.type.includes('heic') || file.type.includes('heif') || file.type.includes('tiff');

    return {
        buffer,
        file,
        uploadType: uploadType as UploadType,
        originalMimeType: file.type,
        originalExtension: fileExtension,
        needsConversion,
    };
}

/**
 * Type guard: check if result is an error object.
 */
export function isUploadError(
    result: ValidatedUpload | { error: string; code: string; status: number }
): result is { error: string; code: string; status: number } {
    return 'error' in result;
}
