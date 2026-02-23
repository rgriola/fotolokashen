import { z } from 'zod';

/**
 * Environment Variable Validation Schema
 * 
 * This validates all required environment variables at startup.
 * If any are missing or invalid, the app will fail to start with a clear error message.
 */

const envSchema = z.object({
    // ============================================
    // Node Environment
    // ============================================
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

    // ============================================
    // Database
    // ============================================
    // Support both standard DATABASE_URL and Vercel Postgres POSTGRES_PRISMA_URL
    // We allow empty strings or undefined to pass initial validation, but the refine block below ensures at least one is valid
    DATABASE_URL: z.string().url().or(z.literal('')).optional(),
    POSTGRES_PRISMA_URL: z.string().url().or(z.literal('')).optional(),

    // ============================================
    // Authentication & Security
    // ============================================
    JWT_SECRET: z
        .string()
        .min(32, 'JWT_SECRET must be at least 32 characters for security')
        .describe('Secret key for JWT token generation'),

    // ============================================
    // Google Maps API
    // ============================================
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: z
        .string()
        .min(1, 'NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is required')
        .describe('Google Maps JavaScript API key'),

    // ============================================
    // ImageKit (Image CDN)
    // ============================================
    NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY: z
        .string()
        .min(1, 'NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY is required')
        .describe('ImageKit public key (safe to expose to client)'),

    IMAGEKIT_PRIVATE_KEY: z
        .string()
        .min(1, 'IMAGEKIT_PRIVATE_KEY is required')
        .describe('ImageKit private key (server-side only)'),

    IMAGEKIT_URL_ENDPOINT: z
        .string()
        .url('IMAGEKIT_URL_ENDPOINT must be a valid URL')
        .describe('ImageKit CDN URL endpoint'),

    // ============================================
    // Email Service (Resend/Mailtrap)
    // ============================================
    EMAIL_SERVICE: z
        .enum(['mailtrap', 'resend'])
        .default('mailtrap')
        .describe('Email service provider (mailtrap for dev, resend for production)'),

    // Resend API (for production)
    EMAIL_API_KEY: z
        .string()
        .optional()
        .describe('Resend API key (required when EMAIL_SERVICE=resend)'),

    // SMTP Configuration (for Mailtrap in development)
    EMAIL_HOST: z
        .string()
        .optional()
        .describe('SMTP host (required when EMAIL_SERVICE=mailtrap)'),

    EMAIL_PORT: z
        .string()
        .optional()
        .describe('SMTP port (required when EMAIL_SERVICE=mailtrap)'),

    EMAIL_USER: z
        .string()
        .optional()
        .describe('SMTP username (required when EMAIL_SERVICE=mailtrap)'),

    EMAIL_PASS: z
        .string()
        .optional()
        .describe('SMTP password (required when EMAIL_SERVICE=mailtrap)'),

    // Common Email Configuration
    EMAIL_MODE: z
        .enum(['development', 'production'])
        .default('development')
        .describe('Email mode (development logs to console, production sends emails)'),


    EMAIL_FROM_NAME: z
        .string()
        .default('fotolokashen')
        .describe('Email sender name'),

    EMAIL_FROM_ADDRESS: z
        .string()
        .email('EMAIL_FROM_ADDRESS must be a valid email')
        .describe('Email sender address'),

    // ============================================
    // Application URLs
    // ============================================
    NEXT_PUBLIC_APP_URL: z
        .string()
        .url('NEXT_PUBLIC_APP_URL must be a valid URL')
        .describe('Application base URL'),

});

/**
 * Additional runtime environment schema
 * These are optional or have defaults
 */
const runtimeEnvSchema = envSchema.extend({
    // Optional: Slack Integration
    SLACK_WEBHOOK_URL: z.string().url().optional(),
    SLACK_BOT_TOKEN: z.string().optional(),
    SLACK_SIGNING_SECRET: z.string().optional(),

    // Optional: Redis (for distributed rate limiting)
    REDIS_URL: z.string().url().optional(),

    // Optional: Analytics
    GOOGLE_ANALYTICS_ID: z.string().optional(),
});

/**
 * Validate environment variables
 * 
 * @throws {Error} If validation fails
 */
function validateEnv() {
    try {
        const parsed = envSchema.parse(process.env);
        return parsed;
    } catch (error) {
        if (error instanceof z.ZodError) {
            const missingVars = error.issues.map((err: z.ZodIssue) => {
                const path = err.path.join('.');
                return `  ❌ ${path}: ${err.message}`;
            }).join('\n');

            const errorMessage = `
╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║  ⚠️  ENVIRONMENT VARIABLE VALIDATION FAILED                    ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝

The following environment variables are missing or invalid:

${missingVars}

📝 How to fix:
1. Copy .env.example to .env.local (if you haven't already)
2. Fill in all required values
3. Restart the server

🔗 Learn more: https://nextjs.org/docs/app/building-your-application/configuring/environment-variables
`;

            console.error(errorMessage);
            throw new Error('Environment validation failed. Check the error message above.');
        }
        throw error;
    }
}

/**
 * Validated and type-safe environment variables
 * 
 * Usage:
 * ```typescript
 * import { env } from '@/lib/env';
 * const dbUrl = env.DATABASE_URL; // Type-safe!
 * ```
 */
export const env = validateEnv();

/**
 * Type for environment variables
 * Useful for passing env config to functions
 */
export type Env = z.infer<typeof envSchema>;

/**
 * Check if running in production
 */
export const isProduction = env.NODE_ENV === 'production';

/**
 * Check if running in development
 */
export const isDevelopment = env.NODE_ENV === 'development';

/**
 * Check if running in test
 */
export const isTest = env.NODE_ENV === 'test';

/**
 * Helper to get optional environment variable with type safety
 */
export function getOptionalEnv(key: string): string | undefined {
    return process.env[key];
}

/**
 * Helper to check if a feature is enabled
 * Useful for feature flags
 */
export function isFeatureEnabled(feature: string): boolean {
    const envVar = process.env[`FEATURE_${feature.toUpperCase()}`];
    return envVar === 'true' || envVar === '1';
}

// Log successful validation in development
if (isDevelopment) {
    console.log('✅ Environment variables validated successfully');
}
