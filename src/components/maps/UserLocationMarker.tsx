"use client";

import { useEffect, useState } from "react";
import { CustomMarker } from "./CustomMarker";

interface UserLocationMarkerProps {
    position: { lat: number; lng: number } | null;
    onClick?: () => void;
}

export function UserLocationMarker({ position, onClick }: UserLocationMarkerProps) {
    if (!position) return null;

    return (
        <CustomMarker
            position={position}
            title="Your Location"
            onClick={onClick}
            icon={{
                path: google.maps.SymbolPath.CIRCLE,
                scale: 10,
                fillColor: "#4285F4",
                fillOpacity: 1,
                strokeColor: "#FFFFFF",
                strokeWeight: 2,
            }}
        />
    );
}
