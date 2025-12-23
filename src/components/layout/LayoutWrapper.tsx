'use client';

import { useAuth } from '@/lib/auth-context';
import { ReactNode } from 'react';

interface LayoutWrapperProps {
    children: ReactNode;
}

/**
 * LayoutWrapper - Applies different layout styles based on authentication state
 * - Authenticated users: h-screen overflow-hidden (fixed full-height layout)
 * - Unauthenticated users: min-h-screen (scrollable layout for marketing pages)
 */
export function LayoutWrapper({ children }: LayoutWrapperProps) {
    const { user } = useAuth();

    // Authenticated users get fixed full-height layout (no scrollbar)
    if (user) {
        return (
            <div className="flex h-screen flex-col overflow-hidden">
                {children}
            </div>
        );
    }

    // Unauthenticated users get scrollable layout (for landing/marketing pages)
    return (
        <div className="flex min-h-screen flex-col">
            {children}
        </div>
    );
}
