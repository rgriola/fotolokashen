'use client';

import { GoogleMap as GoogleMapComponent } from '@react-google-maps/api';
import { ReactNode, useCallback, useState, useEffect } from 'react';

const containerStyle = {
    width: '100%',
    height: '100%',
};

const defaultCenter = {
    lat: 40.7128,
    lng: -74.006, // NYC
};

interface GoogleMapProps {
    center?: { lat: number; lng: number };
    zoom?: number;
    onMapLoad?: (map: google.maps.Map) => void;
    onCenterChanged?: (center: { lat: number; lng: number }) => void;
    onClick?: (event: google.maps.MapMouseEvent) => void;
    className?: string;
    children?: ReactNode;
    rightPanelOpen?: boolean; // New prop to control positioning
}

export function GoogleMap({
    center = defaultCenter,
    zoom = 12,
    onMapLoad,
    onCenterChanged,
    onClick,
    className = '',
    children,
    rightPanelOpen = false,
}: GoogleMapProps) {
    const [map, setMap] = useState<google.maps.Map | null>(null);

    const handleLoad = useCallback(
        (mapInstance: google.maps.Map) => {
            setMap(mapInstance);
            onMapLoad?.(mapInstance);
        },
        [onMapLoad]
    );

    const handleUnmount = useCallback(() => {
        setMap(null);
    }, []);

    const handleCenterChanged = useCallback(() => {
        if (map && onCenterChanged) {
            const center = map.getCenter();
            if (center) {
                onCenterChanged({
                    lat: center.lat(),
                    lng: center.lng(),
                });
            }
        }
    }, [map, onCenterChanged]);

    const handleClick = useCallback(
        (event: google.maps.MapMouseEvent) => {
            onClick?.(event);
        },
        [onClick]
    );

    // Dynamically adjust control positions when panel opens/closes
    useEffect(() => {
        if (map) {
            const zoomPosition = rightPanelOpen 
                ? google.maps.ControlPosition.LEFT_CENTER 
                : google.maps.ControlPosition.RIGHT_CENTER;
            
            const mapTypePosition = rightPanelOpen
                ? google.maps.ControlPosition.TOP_LEFT
                : google.maps.ControlPosition.TOP_RIGHT;

            map.setOptions({
                zoomControlOptions: {
                    position: zoomPosition,
                },
                mapTypeControlOptions: {
                    position: mapTypePosition,
                    style: google.maps.MapTypeControlStyle.DROPDOWN_MENU,
                    mapTypeIds: [
                        google.maps.MapTypeId.ROADMAP,
                        google.maps.MapTypeId.SATELLITE,
                        google.maps.MapTypeId.HYBRID,
                        google.maps.MapTypeId.TERRAIN
                    ]
                },
            });
        }
    }, [map, rightPanelOpen]);

    const options: google.maps.MapOptions = {
        disableDefaultUI: true, // Disable all default UI controls first
        zoomControl: true, // Enable zoom controls (+/-)
        panControl: false, // Keep pan control disabled (the diamond control)
        mapTypeControl: true, // Map type control (Map/Satellite/etc)
        scaleControl: true, // Scale bar
        streetViewControl: false, // Disabled - removes the pegman/street view button
        rotateControl: false, // Disabled - removes rotate control
        fullscreenControl: false, // Disabled on mobile - not useful when map is already full-screen

        // Position zoom controls - will be updated dynamically
        zoomControlOptions: {
            position: google.maps.ControlPosition.RIGHT_CENTER, // Default: right side, vertically centered
        },

        // Position map type controls - will be updated dynamically
        mapTypeControlOptions: {
            position: google.maps.ControlPosition.TOP_RIGHT, // Default: Top-right corner
            style: google.maps.MapTypeControlStyle.DROPDOWN_MENU, // Show all options at once
            mapTypeIds: [
                google.maps.MapTypeId.ROADMAP,    // Standard road map
                google.maps.MapTypeId.SATELLITE,  // Satellite imagery
                google.maps.MapTypeId.HYBRID,     // Satellite with labels/roads
                google.maps.MapTypeId.TERRAIN     // Topographic with elevation
            ]
        },

        // Better user experience
        clickableIcons: true,
        gestureHandling: 'greedy', // Better for mobile - allows pan/zoom without two fingers

        styles: [
            {
                featureType: 'poi',
                elementType: 'labels',
                stylers: [{ visibility: 'on' }],
            },
        ],
    };


    return (
        <div className={`relative ${className}`}>
            <GoogleMapComponent
                mapContainerStyle={containerStyle}
                center={center}
                zoom={zoom}
                onLoad={handleLoad}
                onUnmount={handleUnmount}
                onCenterChanged={handleCenterChanged}
                onClick={handleClick}
                options={options}
            >
                {children}
            </GoogleMapComponent>
        </div>
    );
}
