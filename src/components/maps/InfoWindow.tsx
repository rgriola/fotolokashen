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
        <GoogleInfoWindow position={position} onCloseClick={onClose}>
            <div className="p-2 max-w-sm">
                {children}
            </div>
        </GoogleInfoWindow>
    );
}
