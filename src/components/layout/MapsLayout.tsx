'use client';

import { GoogleMapsProvider } from '@/lib/GoogleMapsProvider';
import { ReactNode } from 'react';

/**
 * Layout wrapper for pages that need Google Maps.
 * Wrap page content in this component instead of having GoogleMapsProvider
 * in the root layout (which blocked LCP on all pages).
 */
export function MapsLayout({ children }: { children: ReactNode }) {
    return <GoogleMapsProvider>{children}</GoogleMapsProvider>;
}
