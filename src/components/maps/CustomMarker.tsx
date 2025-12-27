'use client';

import { Marker, MarkerF } from '@react-google-maps/api';
import { useEffect, useRef, useState, memo } from 'react';

interface CustomMarkerProps {
    position: { lat: number; lng: number };
    title?: string;
    onClick?: () => void;
    isTemporary?: boolean; // New prop to identify temporary markers
    icon?: string | google.maps.Icon | google.maps.Symbol; // Allow custom icons
    color?: string; // Marker color (hex code)
}

export const CustomMarker = memo(function CustomMarker({ position, title, onClick, isTemporary = false, icon, color = '#EF4444' }: CustomMarkerProps) {
    const [marker, setMarker] = useState<google.maps.marker.AdvancedMarkerElement | null>(null);
    const markerRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (!isTemporary || !window.google?.maps?.marker?.AdvancedMarkerElement) {
            // Use default marker for non-temporary or if Advanced Markers not available
            return;
        }

        // Create custom HTML content for temporary markers
        const content = document.createElement('div');
        content.className = 'custom-temp-marker';
        content.innerHTML = `
            <div style="
                position: relative;
                width: 40px;
                height: 48px;
                cursor: pointer;
            ">
                <!-- Square with camera icon -->
                <div style="
                    width: 40px;
                    height: 40px;
                    background: ${color};
                    border-radius: 4px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 2px 6px rgba(0,0,0,0.3);
                    border: 2px solid white;
                ">
                    <!-- Camera SVG Icon -->
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                        <circle cx="12" cy="13" r="4"></circle>
                    </svg>
                </div>
                
                <!-- Pointer/Pin at bottom -->
                <div style="
                    position: absolute;
                    bottom: 0;
                    left: 50%;
                    transform: translateX(-50%);
                    width: 0;
                    height: 0;
                    border-left: 8px solid transparent;
                    border-right: 8px solid transparent;
                    border-top: 8px solid ${color};
                "></div>
            </div>
        `;

        // Create Advanced Marker
        const advancedMarker = new google.maps.marker.AdvancedMarkerElement({
            position,
            content,
            title,
        });

        // Add click listener
        if (onClick) {
            content.addEventListener('click', onClick);
        }

        setMarker(advancedMarker);
        markerRef.current = content;

        return () => {
            if (onClick && content) {
                content.removeEventListener('click', onClick);
            }
            advancedMarker.map = null;
        };
    }, [position, title, onClick, isTemporary, color]);

    // Attach marker to map when it changes
    useEffect(() => {
        if (marker && window.google?.maps) {
            // The map instance will be set by the parent GoogleMap component
            // We need to get it from the context or pass it as a prop
        }
    }, [marker]);

    // Only use standard marker if a custom icon is explicitly provided
    // Otherwise, use the camera marker for all locations (with type-specific colors)
    if (icon) {
        return (
            <MarkerF
                position={position}
                title={title}
                onClick={onClick}
                icon={icon} // Use custom icon if provided
            />
        );
    }

    // Camera marker for all locations (with type-specific colors)
    // Uses custom SVG icon with dynamic color fill
    return (
        <MarkerF
            position={position}
            title={title}
            onClick={onClick}
            icon={{
                url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                    <svg width="40" height="48" viewBox="0 0 40 48" xmlns="http://www.w3.org/2000/svg">
                        <!-- Square with border -->
                        <rect x="0" y="0" width="40" height="40" rx="4" fill="${color}" stroke="white" stroke-width="2"/>
                        
                        <!-- Camera icon -->
                        <g transform="translate(10, 10)">
                            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" 
                                  fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            <circle cx="12" cy="13" r="4" fill="none" stroke="white" stroke-width="2"/>
                        </g>
                        
                        <!-- Pointer/Pin at bottom (pointing down) -->
                        <path d="M 20 48 L 12 40 L 28 40 Z" fill="${color}"/>
                    </svg>
                `),
                scaledSize: new google.maps.Size(40, 48),
                anchor: new google.maps.Point(20, 48), // Anchor at the tip of the pin
            }}
        />
    );
});
