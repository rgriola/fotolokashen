/**
 * Validation Configuration
 * 
 * Centralized validation rules for the application.
 * All max length limits and validation constraints are defined here
 * for easy maintenance and consistency across frontend and backend.
 */

export const VALIDATION_CONFIG = {
    // Location field limits
    location: {
        name: {
            min: 1,
            max: 50,
            label: 'Location Name',
        },
        address: {
            min: 1,
            max: 250, // Updated: More realistic for full addresses
            label: 'Address',
        },
        notes: {
            min: 0,
            max: 500,
            label: 'Notes',
        },
        caption: {
            min: 0,
            max: 20,
            label: 'Photo Caption',
        },
        category: {
            min: 0,
            max: 100,
            label: 'Category',
        },
    },

    // Tags validation
    tags: {
        maxCount: 20,
        maxLength: 25,
        minLength: 1,
        label: 'Tag',
    },

    // User profile limits (for future use)
    user: {
        username: {
            min: 3,
            max: 30,
            label: 'Username',
        },
        firstName: {
            min: 1,
            max: 50,
            label: 'First Name',
        },
        lastName: {
            min: 1,
            max: 50,
            label: 'Last Name',
        },
        bio: {
            min: 0,
            max: 500,
            label: 'Bio',
        },
    },

    // Password rules
    password: {
        min: 8,
        max: 128,
        requireUppercase: true,
        requireLowercase: true,
        requireNumber: true,
        requireSpecial: false,
    },
} as const;

// Helper function to get character counter text
export function getCharCountText(current: number, max: number): string {
    const remaining = max - current;
    return `${current} / ${max}`;
}

// Helper function to check if input is within limits
export function isWithinLimit(value: string, max: number): boolean {
    return value.length <= max;
}

// Helper function to truncate string to max length
export function truncateToLimit(value: string, max: number): string {
    return value.slice(0, max);
}
