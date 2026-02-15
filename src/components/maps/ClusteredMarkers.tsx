'use client';

import { useEffect, useRef } from 'react';
import { MarkerClusterer } from '@googlemaps/markerclusterer';

interface ClusteredMarkersProps {
    map: google.maps.Map | null;
    markers: Array<{
        position: { lat: number; lng: number };
        title?: string;
        color?: string;
        onClick?: () => void;
        icon?: google.maps.Icon | google.maps.Symbol;
    }>;
}

/**
 * Component that renders markers with automatic clustering
 * Uses @googlemaps/markerclusterer for intelligent marker grouping
 */
export function ClusteredMarkers({ map, markers: markerData }: ClusteredMarkersProps) {
    const clustererRef = useRef<MarkerClusterer | null>(null);
    const markersRef = useRef<google.maps.Marker[]>([]);

    useEffect(() => {
        if (!map || !window.google?.maps) return;

        // Clean up existing markers and clusterer
        if (clustererRef.current) {
            clustererRef.current.clearMarkers();
        }
        markersRef.current.forEach(marker => marker.setMap(null));
        markersRef.current = [];

        // Create new markers
        const newMarkers = markerData.map(data => {
            const marker = new google.maps.Marker({
                position: data.position,
                title: data.title,
                icon: data.icon || {
                    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
                        <svg width="40" height="48" viewBox="0 0 40 48" xmlns="http://www.w3.org/2000/svg">
                            <!-- Square with border -->
                            <rect x="0" y="0" width="40" height="40" rx="4" fill="${data.color || '#EF4444'}" stroke="white" stroke-width="2"/>
                            
                            <!-- Camera icon -->
                            <g transform="translate(10, 10)">
                                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" 
                                      fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                <circle cx="12" cy="13" r="4" fill="none" stroke="white" stroke-width="2"/>
                            </g>
                            
                            <!-- Pointer/Pin at bottom (pointing down) -->
                            <path d="M 20 48 L 12 40 L 28 40 Z" fill="${data.color || '#EF4444'}"/>
                        </svg>
                    `)}`,
                    scaledSize: new google.maps.Size(40, 48),
                    anchor: new google.maps.Point(20, 48),
                },
            });

            // Add click listener
            if (data.onClick) {
                marker.addListener('click', data.onClick);
            }

            return marker;
        });

        markersRef.current = newMarkers;

        // Create clusterer with custom styling
        clustererRef.current = new MarkerClusterer({
            map,
            markers: newMarkers,
            renderer: {
                render: ({ count, position }) => {
                    // Color-coded clusters based on count
                    const color = count > 20 ? '#DC2626' : count > 10 ? '#F59E0B' : count > 5 ? '#8B5CF6' : '#3B82F6';
                    
                    // Calculate width based on count digits (wider for larger numbers)
                    const countStr = count.toString();
                    const width = countStr.length === 1 ? 68 : countStr.length === 2 ? 76 : 84;

                    return new google.maps.Marker({
                        position,
                        icon: {
                            url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
                                <svg width="${width}" height="54" viewBox="0 0 ${width} 54" xmlns="http://www.w3.org/2000/svg">
                                    <!-- Container with rounded corners -->
                                    <rect x="2" y="2" width="${width - 4}" height="40" rx="6" fill="${color}" stroke="white" stroke-width="3"/>
                                    
                                    <!-- Camera icon on left -->
                                    <g transform="translate(8, 10)">
                                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" 
                                              fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                        <circle cx="12" cy="13" r="4" fill="none" stroke="white" stroke-width="2"/>
                                    </g>
                                    
                                    <!-- Count number on right -->
                                    <text x="${width - 16}" y="28" text-anchor="middle" fill="white" font-size="18" font-weight="bold" font-family="Arial, sans-serif">
                                        ${count}
                                    </text>
                                    
                                    <!-- Pointer/Pin at bottom center -->
                                    <path d="M ${width/2} 54 L ${width/2 - 6} 42 L ${width/2 + 6} 42 Z" fill="${color}"/>
                                </svg>
                            `)}`,
                            scaledSize: new google.maps.Size(width, 54),
                            anchor: new google.maps.Point(width / 2, 54),
                        },
                        zIndex: Number(google.maps.Marker.MAX_ZINDEX) + count,
                    });
                },
            },
        });

        // Cleanup function
        return () => {
            if (clustererRef.current) {
                clustererRef.current.clearMarkers();
                clustererRef.current.setMap(null);
            }
            markersRef.current.forEach(marker => marker.setMap(null));
            markersRef.current = [];
        };
    }, [map, markerData]);

    // This component doesn't render anything itself
    // The markers are directly added to the map
    return null;
}
