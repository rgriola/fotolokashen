'use client';

import { GoogleMap as GoogleMapComponent } from '@react-google-maps/api';
import { ReactNode, useCallback, useState } from 'react';
import { useGoogleMaps } from '@/lib/GoogleMapsProvider';

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
    const { isLoaded, loadError } = useGoogleMaps();
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
        disableDefaultUI: true, // Disable all default UI controls
        zoomControl: false, // Disable default zoom controls (we'll use custom ones)
        panControl: false, // Keep pan control disabled
        mapTypeControl: false, // Disable default map type control (we'll use custom one)
        scaleControl: true, // Keep scale bar
        streetViewControl: false, // Disabled
        rotateControl: false, // Disabled
        fullscreenControl: false, // Disabled

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


    if (loadError) {
        return (
            <div className={`relative ${className} flex items-center justify-center bg-muted`}>
                <p className="text-destructive text-sm">Failed to load Google Maps</p>
            </div>
        );
    }

    if (!isLoaded) {
        return (
            <div className={`relative ${className} flex items-center justify-center bg-muted`}>
                <div className="animate-pulse text-muted-foreground text-sm">Loading map…</div>
            </div>
        );
    }

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
