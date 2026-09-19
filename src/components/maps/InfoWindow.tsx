"use client";

import { InfoWindow as GoogleInfoWindow } from "@react-google-maps/api";
import { ReactNode } from "react";

interface InfoWindowProps {
  position: { lat: number; lng: number };
  onClose: () => void;
  children: ReactNode;
}

export function InfoWindow({ position, onClose, children }: InfoWindowProps) {
  return (
    <GoogleInfoWindow
      position={position}
      onCloseClick={onClose}
      options={{
        pixelOffset: new window.google.maps.Size(0, -60), // Move InfoWindow up, clear of the marker pin
      }}
    >
      <div className="p-2 w-50">{children}</div>
    </GoogleInfoWindow>
  );
}
