import fs from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';

/**
 * GET /api/content/legal
 * Returns the terms of service and privacy policy markdown content.
 * Used by client components (like TermsModal) that can't use fs.readFileSync.
 */
export async function GET() {
    try {
        const termsContent = fs.readFileSync(
            path.join(process.cwd(), 'content', 'terms-of-service.md'),
            'utf-8'
        );
        const privacyContent = fs.readFileSync(
            path.join(process.cwd(), 'content', 'privacy-policy.md'),
            'utf-8'
        );

        return NextResponse.json({ termsContent, privacyContent });
    } catch (error) {
        console.error('Failed to read legal content:', error);
        return NextResponse.json(
            { error: 'Failed to load content' },
            { status: 500 }
        );
    }
}
