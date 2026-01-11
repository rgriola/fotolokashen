/**
 * Email Preview Utilities
 * Helpers for email template preview and customization
 */

export interface EmailCustomization {
    brandName: string;
    brandColor: string;
    headerGradientStart: string;
    headerGradientEnd: string;
    buttonColor: string;
    subject: string;
    customMessage?: string;
}

export interface EmailPreviewData {
    username: string;
    email: string;
    timestamp: string;
    ipAddress: string;
    verificationUrl: string;
    resetUrl: string;
}

export const DEFAULT_CUSTOMIZATION: EmailCustomization = {
    brandName: 'Fotolokashen',
    brandColor: '#4285f4',
    headerGradientStart: '#4285f4',
    headerGradientEnd: '#5a67d8',
    buttonColor: '#4285f4',
    subject: '',
    customMessage: '',
};

export const DEVICE_SIZES = {
    web: { width: 600, label: 'Web', icon: '💻' },
    tablet: { width: 768, label: 'iPad', icon: '📱' },
    mobile: { width: 375, label: 'Mobile', icon: '📱' },
} as const;

export type DeviceSize = keyof typeof DEVICE_SIZES;

export const EMAIL_TEMPLATES = [
    { value: 'verification', label: '✉️ Verification Email', subject: 'Please confirm your registration' },
    { value: 'welcomeTo', label: '✉️ Welcome To Fotolokashen', subject: 'Welcome to Fotolokashen' },
    { value: 'passwordReset', label: '🔐 Password Reset Email', subject: 'Reset your password' },
    { value: 'passwordChanged', label: '✅ Password Changed Notification', subject: 'Your Password Was Changed' },
    { value: 'accountDeletion', label: '🗑️ Account Deletion Email', subject: 'We deleted your Fotolokashen account' },
] as const;

export type EmailTemplateType = typeof EMAIL_TEMPLATES[number]['value'];

/**
 * Generate sample preview data from user info
 */
export function generatePreviewData(user: {
    username?: string;
    email?: string;
    firstName?: string | null;
    lastName?: string | null;
}): EmailPreviewData {
    const username = user.firstName && user.lastName
        ? `${user.firstName} ${user.lastName}`
        : user.username || 'John Doe';

    const email = user.email || 'admin@fotolokashen.com';

    const now = new Date();
    const timestamp = now.toLocaleString('en-US', {
        dateStyle: 'long',
        timeStyle: 'short',
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    return {
        username,
        email,
        timestamp,
        ipAddress: '192.168.1.100',
        verificationUrl: `${appUrl}/verify-email?token=sample-token-123`,
        resetUrl: `${appUrl}/reset-password?token=sample-token-456`,
    };
}

/**
 * Apply customizations to email template HTML
 */
export function applyCustomizations(
    html: string,
    customization: EmailCustomization
): string {
    let customized = html;

    // Replace brand name
    customized = customized.replace(/Fotolokashen/g, customization.brandName);

    // Replace brand color
    customized = customized.replace(/#4285f4/g, customization.brandColor);

    // Replace header gradient
    customized = customized.replace(
        /linear-gradient\(135deg, #4285f4 0%, #5a67d8 100%\)/g,
        `linear-gradient(135deg, ${customization.headerGradientStart} 0%, ${customization.headerGradientEnd} 100%)`
    );

    // Replace button color
    if (customization.buttonColor !== customization.brandColor) {
        customized = customized.replace(
            new RegExp(`background-color: ${customization.brandColor}`, 'g'),
            `background-color: ${customization.buttonColor}`
        );
    }

    return customized;
}

/**
 * Export customization settings as JSON
 */
export function exportCustomizations(customization: EmailCustomization): string {
    return JSON.stringify(customization, null, 2);
}

/**
 * Import customization settings from JSON
 */
export function importCustomizations(json: string): EmailCustomization {
    try {
        const parsed = JSON.parse(json);
        return {
            ...DEFAULT_CUSTOMIZATION,
            ...parsed,
        };
    } catch (error) {
        console.error('Failed to import customizations:', error);
        return DEFAULT_CUSTOMIZATION;
    }
}

/**
 * Make email HTML non-interactive (disable links and buttons)
 */
export function makeNonInteractive(html: string): string {
    // Add pointer-events: none to all links and buttons
    return html.replace(
        /<a /g,
        '<a style="pointer-events: none; cursor: default;" '
    ).replace(
        /<button /g,
        '<button disabled style="pointer-events: none; cursor: default;" '
    );
}
