'use client';

import { Marker, MarkerProps } from '@react-google-maps/api';

interface CustomMarkerProps {
    position: { lat: number; lng: number };
    title?: string;
    icon?: string | google.maps.Icon | google.maps.Symbol;
    onClick?: () => void;
    draggable?: boolean;
    onDragEnd?: (event: google.maps.MapMouseEvent) => void;
}

export function CustomMarker({
    position,
    title,
    icon,
    onClick,
    draggable = false,
    onDragEnd,
}: CustomMarkerProps) {
    const markerOptions: MarkerProps['options'] = {
        animation: google.maps.Animation.DROP,
    };

    return (
        <Marker
            position={position}
            title={title}
            icon={icon}
            onClick={onClick}
            draggable={draggable}
            onDragEnd={onDragEnd}
            options={markerOptions}
        />
    );
}
