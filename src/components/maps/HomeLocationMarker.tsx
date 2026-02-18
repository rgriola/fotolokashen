'use client';

import { OverlayView } from '@react-google-maps/api';
import { Home } from 'lucide-react';

interface HomeLocationMarkerProps {
    position: { lat: number; lng: number };
    name?: string;
    onClick?: () => void;
}

export function HomeLocationMarker({ position, onClick }: HomeLocationMarkerProps) {
    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent map click event
        onClick?.();
    };

    return (
        <OverlayView
            position={position}
            mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
        >
            <div className="relative" style={{ transform: 'translate(-50%, -100%)' }}>
                {/* Perfect circle with centered house icon - now clickable */}
                <div
                    onClick={handleClick}
                    className={`w-12 h-12 rounded-full bg-linear-to-br from-orange-500 to-orange-600 shadow-xl border-4 border-white dark:border-gray-800 flex items-center justify-center transition-all ${onClick ? 'cursor-pointer hover:scale-110 hover:shadow-2xl active:scale-95' : ''
                        }`}
                >
                    <Home className="w-6 h-6 text-white" />
                </div>
            </div>
        </OverlayView>
    );
}
