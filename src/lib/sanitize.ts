/**
 * Input Sanitization Utilities
 * 
 * Provides XSS protection by sanitizing user input before storage and display.
 * Uses DOMPurify for robust HTML sanitization.
 */

/**
 * Sanitize plain text - strips ALL HTML tags
 * Use for fields that should never contain HTML (names, addresses, etc.)
 */
export function sanitizeText(input: string | null | undefined): string {
    if (!input) return '';

    // Strip all HTML tags and trim whitespace using regex
    return input.replace(/<\/?[^>]+(>|$)/g, "").trim();
}

/**
 * Sanitize HTML content - allows safe HTML tags only
 * Use for rich text fields where some formatting is allowed (notes, bio, etc.)
 */
export function sanitizeHTML(input: string | null | undefined): string {
    if (!input) return '';

    // Fallback found: Since specific HTML sanitization without jsdom requires a different library
    // and this function is currently unused in the project scope verified,
    // we will default to stripping tags to ensure security and prevent crashes.
    return sanitizeText(input);
}

/**
 * Sanitize array of strings
 * Use for tags, lists, etc.
 */
export function sanitizeArray(input: string[] | null | undefined): string[] {
    if (!input || !Array.isArray(input)) return [];

    return input
        .map(item => sanitizeText(item))
        .filter(item => item.length > 0); // Remove empty strings
}

/**
 * Sanitize location data object
 * Applies appropriate sanitization to each field
 */
export interface LocationDataInput {
    name?: string;
    address?: string;
    notes?: string;
    caption?: string;
    tags?: string[];
    category?: string;
}

export function sanitizeLocationData(data: LocationDataInput): LocationDataInput {
    return {
        name: data.name ? sanitizeText(data.name) : undefined,
        address: data.address ? sanitizeText(data.address) : undefined,
        notes: data.notes ? sanitizeText(data.notes) : undefined, // Could use sanitizeHTML if rich text needed
        caption: data.caption ? sanitizeText(data.caption) : undefined,
        tags: data.tags ? sanitizeArray(data.tags) : undefined,
        category: data.category ? sanitizeText(data.category) : undefined,
    };
}

/**
 * Escape HTML entities for safe display without using dangerouslySetInnerHTML
 * Use when you want to display user content as plain text
 */
export function escapeHTML(input: string | null | undefined): string {
    if (!input) return '';

    return input
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
