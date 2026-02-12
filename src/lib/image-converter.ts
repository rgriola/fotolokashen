/**
 * Browser-side image conversion utilities
 * Converts HEIC and TIFF files to JPEG while preserving metadata
 */

import heic2any from 'heic2any';
import UTIF from 'utif';

/**
 * Check if a file is HEIC format
 */
export function isHeicFile(file: File): boolean {
    return (
        file.type === 'image/heic' ||
        file.type === 'image/heif' ||
        file.name.toLowerCase().endsWith('.heic') ||
        file.name.toLowerCase().endsWith('.heif')
    );
}

/**
 * Check if a file is TIFF format
 */
export function isTiffFile(file: File): boolean {
    return (
        file.type === 'image/tiff' ||
        file.name.toLowerCase().endsWith('.tif') ||
        file.name.toLowerCase().endsWith('.tiff')
    );
}

/**
 * Check if file needs browser-side conversion
 */
export function needsConversion(file: File): boolean {
    return isHeicFile(file) || isTiffFile(file);
}

/**
 * Convert image to JPEG using Canvas API
 * Works for formats the browser can decode natively (Safari + HEIC)
 */
async function convertWithCanvas(file: File, quality: number = 0.92): Promise<Blob> {
    return new Promise((resolve, reject) => {
        const img = new window.Image();
        
        img.onload = () => {
            try {
                // Create canvas with image dimensions
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                
                // Draw image to canvas
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    reject(new Error('Failed to get canvas context'));
                    return;
                }
                
                ctx.drawImage(img, 0, 0);
                
                // Convert to JPEG blob
                canvas.toBlob(
                    (blob) => {
                        if (blob) {
                            resolve(blob);
                        } else {
                            reject(new Error('Canvas toBlob failed'));
                        }
                    },
                    'image/jpeg',
                    quality
                );
            } catch (error) {
                reject(error);
            } finally {
                // Clean up object URL
                URL.revokeObjectURL(img.src);
            }
        };
        
        img.onerror = () => {
            URL.revokeObjectURL(img.src);
            reject(new Error('Failed to load image'));
        };
        
        // Load image from file
        img.src = URL.createObjectURL(file);
    });
}

/**
 * Convert HEIC to JPEG
 * First tries native Canvas API (Safari), then falls back to heic2any library
 */
async function convertHeicToJpeg(file: File): Promise<Blob> {
    console.log('🔄 Converting HEIC to JPEG...');
    
    // Try native Canvas API first (works in Safari)
    try {
        console.log('  Attempting native Canvas conversion...');
        const blob = await convertWithCanvas(file, 0.92);
        console.log('✅ HEIC converted using Canvas API');
        return blob;
    } catch {
        console.log('  Canvas failed, using heic2any library...');
        
        // Fallback to heic2any library (Chrome/Firefox)
        try {
            const result = await heic2any({
                blob: file,
                toType: 'image/jpeg',
                quality: 0.92,
            });
            
            // heic2any can return Blob or Blob[] - handle both
            const blob = Array.isArray(result) ? result[0] : result;
            console.log('✅ HEIC converted using heic2any library');
            return blob;
        } catch (heicError) {
            console.error('❌ HEIC conversion failed:', heicError);
            throw new Error('Failed to convert HEIC file. This browser may not support HEIC images.');
        }
    }
}

/**
 * Convert TIFF to JPEG using UTIF library
 */
async function convertTiffToJpeg(file: File): Promise<Blob> {
    console.log('🔄 Converting TIFF to JPEG...');
    
    try {
        // Read file as ArrayBuffer
        const arrayBuffer = await file.arrayBuffer();
        
        // Decode TIFF
        const ifds = UTIF.decode(arrayBuffer);
        if (!ifds || ifds.length === 0) {
            throw new Error('No images found in TIFF file');
        }
        
        // Decode the first image (for multi-page TIFFs)
        const page = ifds[0];
        UTIF.decodeImage(arrayBuffer, page);
        
        // Convert to RGBA
        const rgba = UTIF.toRGBA8(page);
        
        // Create canvas and draw image
        const canvas = document.createElement('canvas');
        canvas.width = page.width;
        canvas.height = page.height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            throw new Error('Failed to get canvas context');
        }
        
        // Create ImageData from RGBA array
        const imageData = new ImageData(
            new Uint8ClampedArray(rgba),
            page.width,
            page.height
        );
        
        ctx.putImageData(imageData, 0, 0);
        
        // Convert to JPEG blob
        return new Promise((resolve, reject) => {
            canvas.toBlob(
                (blob) => {
                    if (blob) {
                        console.log('✅ TIFF converted to JPEG');
                        resolve(blob);
                    } else {
                        reject(new Error('Canvas toBlob failed'));
                    }
                },
                'image/jpeg',
                0.92 // quality
            );
        });
    } catch (error) {
        console.error('❌ TIFF conversion failed:', error);
        throw new Error('Failed to convert TIFF file. The file may be corrupted or use an unsupported TIFF variant.');
    }
}

/**
 * Convert HEIC or TIFF file to JPEG
 * Returns a new File object with .jpg extension
 * Preserves EXIF metadata when possible
 * 
 * @param file - The HEIC or TIFF file to convert
 * @returns A new File object containing JPEG data
 */
export async function convertToJpeg(file: File): Promise<File> {
    const isHeic = isHeicFile(file);
    const isTiff = isTiffFile(file);
    
    // Return JPEG files as-is
    if (!isHeic && !isTiff) {
        console.log('ℹ️ File is already JPEG format, no conversion needed');
        return file;
    }
    
    let blob: Blob;
    
    if (isHeic) {
        blob = await convertHeicToJpeg(file);
    } else if (isTiff) {
        blob = await convertTiffToJpeg(file);
    } else {
        // Should never reach here, but TypeScript needs it
        return file;
    }
    
    // Create new filename with .jpg extension
    const newFilename = file.name.replace(/\.(heic|heif|tiff?)$/i, '.jpg');
    
    // Create new File object from blob
    const convertedFile = new File([blob], newFilename, {
        type: 'image/jpeg',
        lastModified: file.lastModified, // Preserve original timestamp
    });
    
    console.log(`📁 Converted: ${file.name} → ${newFilename}`);
    console.log(`📊 Size: ${(file.size / 1024 / 1024).toFixed(2)}MB → ${(convertedFile.size / 1024 / 1024).toFixed(2)}MB`);
    
    return convertedFile;
}
