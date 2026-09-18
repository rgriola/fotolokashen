"use client";

import { useEffect, useRef } from "react";
import { MarkerClusterer } from "@googlemaps/markerclusterer";
import { getClusterColor, DEFAULT_MARKER_COLOR } from "@/lib/map-icon-colors";

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

function getClusterWidth(count: number): number {
  const digits = count.toString().length;
  if (digits === 1) return 65;
  if (digits === 2) return 74.19;
  return 85;
}

// Illustrator-exported single-location pin artwork
function createLocationMarkerSvg(color: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="43.08" height="53.7" viewBox="0 0 43.08 53.7">
  <path d="M38.71.41H4.37C2.18.41.41,3.09.41,6.41v28c0,3.31,1.77,6,3.96,6h13.21l3.96,12,3.96-12h13.21c2.19,0,3.96-2.69,3.96-6V6.41c0-3.31-1.77-6-3.96-6Z" style="fill: ${color}; stroke: #fff; stroke-width: 1px;"/>
  <g>
    <path d="M32.54,25.99c0,1.1-.9,2-2,2H12.54c-1.1,0-2-.9-2-2v-11c0-1.1.9-2,2-2h4l2-3h6l2,3h4c1.1,0,2,.9,2,2v11Z" style="fill: none; stroke: #fff; stroke-linecap: round; stroke-linejoin: round; stroke-width: 2px;"/>
    <circle cx="21.54" cy="19.99" r="4" style="fill: none; stroke: #fff; stroke-width: 2px;"/>
  </g>
</svg>`;
}

// Illustrator-exported cluster badge artwork, one fixed template per digit tier
function createClusterSvg(count: number, color: string): string {
  const digits = count.toString().length;

  if (digits === 1) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="65" height="53.62" viewBox="0 0 65 53.62">
  <path d="M58.5.5H6.5C3.19.5.5,3.19.5,6.5v28c0,3.31,2.69,6,6,6h20l6,12,6-12h20c3.31,0,6-2.69,6-6V6.5c0-3.31-2.69-6-6-6Z" style="fill: ${color}; stroke: #fff; stroke-width: 1px;"/>
  <g>
    <path d="M32.5,26.93c0,1.1-.9,2-2,2H12.5c-1.1,0-2-.9-2-2v-11c0-1.1.9-2,2-2h4l2-3h6l2,3h4c1.1,0,2,.9,2,2v11Z" style="fill: none; stroke: #fff; stroke-linecap: round; stroke-linejoin: round; stroke-width: 2px;"/>
    <circle cx="21.5" cy="20.93" r="4" style="fill: none; stroke: #fff; stroke-width: 2px;"/>
  </g>
  <text transform="translate(41.35 27.63)" style="fill: #fff; font-family: Arial, sans-serif; font-size: 22px; font-weight: 700;"><tspan x="0" y="0">${count}</tspan></text>
</svg>`;
  }

  if (digits === 2) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="74.19" height="53.61" viewBox="0 0 74.19 53.61">
  <path d="M66.8.53H7.39C3.6.53.53,3.22.53,6.53v28c0,3.31,3.07,6,6.86,6h22.85l6.86,12,6.86-12h22.85c3.79,0,6.86-2.69,6.86-6V6.53c0-3.31-3.07-6-6.86-6Z" style="fill: ${color}; stroke: #fff; stroke-width: 1px;"/>
  <g>
    <path d="M32.53,26.97c0,1.1-.9,2-2,2H12.53c-1.1,0-2-.9-2-2v-11c0-1.1.9-2,2-2h4l2-3h6l2,3h4c1.1,0,2,.9,2,2v11Z" style="fill: none; stroke: #fff; stroke-linecap: round; stroke-linejoin: round; stroke-width: 2px;"/>
    <circle cx="21.53" cy="20.97" r="4" style="fill: none; stroke: #fff; stroke-width: 2px;"/>
  </g>
  <text transform="translate(40.16 27.66)" style="fill: #fff; font-family: Arial, sans-serif; font-size: 22px; font-weight: 700;"><tspan x="0" y="0">${count}</tspan></text>
</svg>`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="85" height="53.62" viewBox="0 0 85 53.62">
  <path d="M76.56.57H8.43C4.09.57.57,3.26.57,6.57v28c0,3.31,3.52,6,7.86,6h26.2l7.86,12,7.86-12h26.2c4.34,0,7.86-2.69,7.86-6V6.57c0-3.31-3.52-6-7.86-6Z" style="fill: ${color}; stroke: #fff; stroke-width: 1px;"/>
  <g>
    <path d="M32.57,27c0,1.1-.9,2-2,2H12.57c-1.1,0-2-.9-2-2v-11c0-1.1.9-2,2-2h4l2-3h6l2,3h4c1.1,0,2,.9,2,2v11Z" style="fill: none; stroke: #fff; stroke-linecap: round; stroke-linejoin: round; stroke-width: 2px;"/>
    <circle cx="21.57" cy="21" r="4" style="fill: none; stroke: #fff; stroke-width: 2px;"/>
  </g>
  <text transform="translate(40.2 27.7)" style="fill: #fff; font-family: Arial, sans-serif; font-size: 22px; font-weight: 700;"><tspan x="0" y="0">${count}</tspan></text>
</svg>`;
}

/**
 * Component that renders markers with automatic clustering
 * Uses @googlemaps/markerclusterer for intelligent marker grouping
 */
export function ClusteredMarkers({
  map,
  markers: markerData,
}: ClusteredMarkersProps) {
  const clustererRef = useRef<MarkerClusterer | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);

  useEffect(() => {
    if (!map || !window.google?.maps) return;

    // Clean up existing markers and clusterer
    if (clustererRef.current) {
      clustererRef.current.clearMarkers();
    }
    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];

    // Create new markers
    const newMarkers = markerData.map((data) => {
      const color = data.color || DEFAULT_MARKER_COLOR;
      const svg = createLocationMarkerSvg(color);
      const marker = new google.maps.Marker({
        position: data.position,
        title: data.title,
        icon: data.icon || {
          url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
          scaledSize: new google.maps.Size(43.08, 53.7),
          anchor: new google.maps.Point(21.54, 53.7),
        },
      });

      // Add click listener
      if (data.onClick) {
        marker.addListener("click", data.onClick);
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
          const color = getClusterColor(count);
          const width = getClusterWidth(count);
          const svg = createClusterSvg(count, color);

          return new google.maps.Marker({
            position,
            icon: {
              url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
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
      markersRef.current.forEach((marker) => marker.setMap(null));
      markersRef.current = [];
    };
  }, [map, markerData]);

  // This component doesn't render anything itself
  // The markers are directly added to the map
  return null;
}
