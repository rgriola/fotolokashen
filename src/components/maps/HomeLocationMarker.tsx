'use client';

import { OverlayView } from '@react-google-maps/api';
import { Home } from 'lucide-react';

interface HomeLocationMarkerProps {
    position: { lat: number; lng: number };
    name?: string;
}

export function HomeLocationMarker({ position, name }: HomeLocationMarkerProps) {
    return (
        <OverlayView
            position={position}
            mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
        >
            <div className="relative" style={{ transform: 'translate(-50%, -100%)' }}>
                {/* House Icon */}
                <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-full p-3 shadow-xl border-4 border-white dark:border-gray-800">
                    <Home className="w-6 h-6" />
                </div>

                {/* Label */}
                {name && (
                    <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 whitespace-nowrap">
                        <div className="bg-white dark:bg-gray-800 px-3 py-1.5 rounded-lg shadow-lg border border-orange-200 dark:border-orange-800">
                            <p className="text-xs font-medium text-orange-900 dark:text-orange-100">
                                🏠 Home
                            </p>
                            <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                                {name}
                            </p>
                        </div>
                    </div>
                )}

                {/* Pulsing Circle */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                    <div className="w-16 h-16 bg-orange-500/30 rounded-full animate-ping" />
                </div>
            </div>
        </OverlayView>
    );
}
