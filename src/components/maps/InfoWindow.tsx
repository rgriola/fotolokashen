'use client';

import { InfoWindow as GoogleInfoWindow } from '@react-google-maps/api';
import { ReactNode } from 'react';

interface InfoWindowProps {
    position: { lat: number; lng: number };
    onClose: () => void;
    children: ReactNode;
}

export function InfoWindow({ position, onClose, children }: InfoWindowProps) {
    return (
        <GoogleInfoWindow
            position={position}
            onCloseClick={onClose}
            options={{
                pixelOffset: new window.google.maps.Size(0, -40), // Move InfoWindow 40px up
            }}
        >
            <div className="p-2 max-w-sm">
                {children}
            </div>
        </GoogleInfoWindow>
    );
}
