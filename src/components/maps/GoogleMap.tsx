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
        disableDefaultUI: false,
        zoomControl: false, // Disabled - users can pinch-to-zoom on mobile, scroll on desktop
        panControl: false, // Disabled - the diamond control
        mapTypeControl: true,
        scaleControl: true,
        streetViewControl: false, // Disabled - removes the pegman/street view button
        rotateControl: false, // Disabled - removes rotate control
        fullscreenControl: false, // Disabled on mobile - not useful when map is already full-screen

        // Position remaining controls
        mapTypeControlOptions: {
            position: google.maps.ControlPosition.TOP_LEFT, // Top-left corner
            style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR, // Show all options at once
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

    // Style the map type control after map loads
    useEffect(() => {
        if (!map) return;

        // Add custom styling to map type control (horizontal bar)
        const styleMapControl = () => {
            // Style map type control buttons
            const allButtons = document.querySelectorAll('button[draggable="false"]');
            
            allButtons.forEach((button) => {
                const btn = button as HTMLElement;
                const text = btn.textContent?.toLowerCase() || '';
                
                // Check if this is a map type button
                if (text.includes('map') || text.includes('satellite') || 
                    text.includes('terrain') || text.includes('hybrid')) {
                    
                    // Find the parent container
                    let container = btn.parentElement;
                    while (container && container.querySelectorAll('button[draggable="false"]').length < 2) {
                        container = container.parentElement;
                    }
                    
                    if (container && container !== document.body) {
                        // Style the container
                        const containerDiv = container as HTMLElement;
                        containerDiv.style.backgroundColor = 'white';
                        containerDiv.style.border = '2px solid #e5e7eb';
                        containerDiv.style.borderRadius = '10px';
                        containerDiv.style.padding = '4px';
                        containerDiv.style.boxShadow = '0 2px 8px rgba(0,0,0,0.12)';
                        containerDiv.style.display = 'flex';
                        containerDiv.style.gap = '4px';
                        containerDiv.style.alignItems = 'center';
                        
                        // Style all buttons in this container
                        const containerButtons = containerDiv.querySelectorAll('button, div[role="button"]');
                        containerButtons.forEach((btn) => {
                            const buttonEl = btn as HTMLElement;
                            
                            // Remove any checkbox-style indicators
                            const checkboxes = buttonEl.querySelectorAll('input[type="checkbox"]');
                            checkboxes.forEach(cb => (cb as HTMLElement).style.display = 'none');
                            
                            // Clean button styling
                            buttonEl.style.borderRadius = '6px';
                            buttonEl.style.padding = '8px 12px';
                            buttonEl.style.fontSize = '13px';
                            buttonEl.style.fontWeight = '500';
                            buttonEl.style.transition = 'all 0.2s';
                            buttonEl.style.border = '1px solid transparent';
                            buttonEl.style.cursor = 'pointer';
                            buttonEl.style.backgroundColor = 'transparent';
                            buttonEl.style.color = '#374151';
                            buttonEl.style.minWidth = '70px';
                            buttonEl.style.textAlign = 'center';
                            
                            // Check if active/selected
                            const isActive = buttonEl.getAttribute('aria-pressed') === 'true' ||
                                           buttonEl.style.fontWeight === 'bold' ||
                                           buttonEl.style.fontWeight === '700' ||
                                           buttonEl.style.fontWeight === '600' ||
                                           buttonEl.getAttribute('aria-checked') === 'true';
                            
                            if (isActive) {
                                buttonEl.style.backgroundColor = '#4f46e5';
                                buttonEl.style.color = 'white';
                                buttonEl.style.fontWeight = '600';
                            }
                            
                            // Hover effects
                            buttonEl.onmouseenter = () => {
                                if (buttonEl.style.backgroundColor !== 'rgb(79, 70, 229)') {
                                    buttonEl.style.backgroundColor = '#f3f4f6';
                                    buttonEl.style.borderColor = '#d1d5db';
                                }
                            };
                            
                            buttonEl.onmouseleave = () => {
                                if (buttonEl.style.backgroundColor !== 'rgb(79, 70, 229)') {
                                    buttonEl.style.backgroundColor = 'transparent';
                                    buttonEl.style.borderColor = 'transparent';
                                }
                            };
                            
                            // Re-style on click
                            buttonEl.onclick = () => {
                                setTimeout(() => styleMapControl(), 100);
                            };
                        });
                    }
                }
            });

            // Reposition the Map Data attribution bar to avoid floating buttons
            // Move it to the left side, away from bottom-right buttons
            const attributionContainers = document.querySelectorAll('.gm-style-cc');
            attributionContainers.forEach((container) => {
                const elem = container as HTMLElement;
                elem.style.left = '0';
                elem.style.right = 'auto';
                elem.style.bottom = '0';
                elem.style.maxWidth = 'calc(100% - 140px)'; // Leave space for right-side buttons
            });

            // Also style the Google logo container
            const logoContainers = document.querySelectorAll('a[href^="https://maps.google.com/maps"]');
            logoContainers.forEach((logo) => {
                const elem = logo as HTMLElement;
                if (elem.parentElement) {
                    elem.parentElement.style.left = '0';
                    elem.parentElement.style.right = 'auto';
                }
            });
        };

        // Initial styling with multiple passes
        setTimeout(styleMapControl, 100);
        setTimeout(styleMapControl, 300);
        setTimeout(styleMapControl, 600);

        // Keep re-styling periodically
        const interval = setInterval(styleMapControl, 1000);

        return () => clearInterval(interval);
    }, [map]);

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
