'use client';

import { useEffect, useRef } from 'react';
import { MarkerClusterer } from '@googlemaps/markerclusterer';

interface UseMarkerClustererOptions {
    map: google.maps.Map | null;
    markers: google.maps.Marker[];
}

/**
 * Custom hook to manage marker clustering
 * Automatically creates/updates a MarkerClusterer when map or markers change
 */
export function useMarkerClusterer({ map, markers }: UseMarkerClustererOptions) {
    const clustererRef = useRef<MarkerClusterer | null>(null);

    useEffect(() => {
        if (!map) return;

        // Clean up existing clusterer
        if (clustererRef.current) {
            clustererRef.current.clearMarkers();
        }

        // Create new clusterer with custom styling
        clustererRef.current = new MarkerClusterer({
            map,
            markers,
            renderer: {
                render: ({ count, position }) => {
                    // Custom cluster marker styling
                    const color = count > 10 ? '#DC2626' : count > 5 ? '#F59E0B' : '#3B82F6';
                    
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
                        label: undefined,
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
        };
    }, [map, markers]);

    // Return the clusterer instance - safe to access after effect runs
    return clustererRef;
}
