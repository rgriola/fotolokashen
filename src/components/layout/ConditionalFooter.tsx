'use client';

import { Footer } from './Footer';
import { useAuth } from '@/lib/auth-context';

/**
 * ConditionalFooter - Shows footer only for unauthenticated users
 * Authenticated users get full-height app layout without footer
 */
export function ConditionalFooter() {
    const { user } = useAuth();

    // Hide footer for authenticated users
    if (user) {
        return null;
    }

    // Show footer for unauthenticated users (landing/marketing pages)
    return <Footer />;
}
