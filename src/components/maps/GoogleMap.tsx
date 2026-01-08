'use client';

import { GoogleMap as GoogleMapComponent, GoogleMapProps as GoogleMapComponentProps } from '@react-google-maps/api';
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
}

export function GoogleMap({
    center = defaultCenter,
    zoom = 12,
    onMapLoad,
    onCenterChanged,
    onClick,
    className = '',
    children,
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

    const options: google.maps.MapOptions = {
        disableDefaultUI: true, // Disable all default UI controls first
        zoomControl: true, // Enable zoom controls (+/-)
        panControl: false, // Keep pan control disabled (the diamond control)
        mapTypeControl: true, // Map type control (Map/Satellite/etc)
        scaleControl: true, // Scale bar
        streetViewControl: false, // Disabled - removes the pegman/street view button
        rotateControl: false, // Disabled - removes rotate control
        fullscreenControl: false, // Disabled on mobile - not useful when map is already full-screen

        // Position zoom controls
        zoomControlOptions: {
            position: google.maps.ControlPosition.LEFT_CENTER, // `left` side, vertically centered
        },

        // Position map type controls
        mapTypeControlOptions: {
            position: google.maps.ControlPosition.TOP_LEFT, // Top-left corner
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
