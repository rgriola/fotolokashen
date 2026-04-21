'use client';

import { useLoadScript } from '@react-google-maps/api';
import { createContext, useContext, ReactNode } from 'react';

const libraries: ('places' | 'geometry' | 'drawing')[] = ['places', 'geometry'];

interface GoogleMapsContextType {
    isLoaded: boolean;
    loadError: Error | undefined;
}

const GoogleMapsContext = createContext<GoogleMapsContextType>({
    isLoaded: false,
    loadError: undefined,
});

export function useGoogleMaps() {
    const context = useContext(GoogleMapsContext);
    if (!context) {
        throw new Error('useGoogleMaps must be used within GoogleMapsProvider');
    }
    return context;
}

interface GoogleMapsProviderProps {
    children: ReactNode;
}

/**
 * GoogleMapsProvider — wraps ONLY pages that need Google Maps.
 * 
 * IMPORTANT: This provider no longer blocks rendering while the SDK loads.
 * It renders children immediately and provides isLoaded/loadError via context.
 * Components that need maps should check `isLoaded` before rendering map UI.
 * 
 * This was moved OUT of the root layout to fix LCP — previously it blocked
 * ALL pages (including auth pages) until the Google Maps SDK finished loading.
 */
export function GoogleMapsProvider({ children }: GoogleMapsProviderProps) {
    const { isLoaded, loadError } = useLoadScript({
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
        libraries,
    });

    return (
        <GoogleMapsContext.Provider value={{ isLoaded, loadError }}>
            {children}
        </GoogleMapsContext.Provider>
    );
}
