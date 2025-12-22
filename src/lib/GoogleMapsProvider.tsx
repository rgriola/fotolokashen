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

export function GoogleMapsProvider({ children }: GoogleMapsProviderProps) {
    const { isLoaded, loadError } = useLoadScript({
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
        libraries,
    });

    if (loadError) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-red-50">
                <div className="max-w-md p-8 bg-white rounded-lg shadow-lg">
                    <div className="flex items-center gap-3 text-red-600 mb-4">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                            />
                        </svg>
                        <h2 className="text-xl font-bold">Google Maps Error</h2>
                    </div>
                    <p className="text-gray-700 mb-4">
                        Failed to load Google Maps. Please check your API key configuration.
                    </p>
                    <p className="text-sm text-gray-500">
                        Error: {loadError.message}
                    </p>
                </div>
            </div>
        );
    }

    if (!isLoaded) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
                    <h2 className="text-xl font-semibold text-gray-800">
                        Loading Google Maps...
                    </h2>
                </div>
            </div>
        );
    }

    return (
        <GoogleMapsContext.Provider value={{ isLoaded, loadError }}>
            {children}
        </GoogleMapsContext.Provider>
    );
}
