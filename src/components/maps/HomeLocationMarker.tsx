"use client";

import { OverlayView } from "@react-google-maps/api";
import { HOME_MARKER_COLOR } from "@/lib/map-icon-colors";

interface HomeLocationMarkerProps {
  position: { lat: number; lng: number };
  name?: string;
  onClick?: () => void;
  color?: string;
}

export function HomeLocationMarker({
  position,
  onClick,
  color = HOME_MARKER_COLOR,
}: HomeLocationMarkerProps) {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent map click event
    onClick?.();
  };

  return (
    <OverlayView
      position={position}
      mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
    >
      <div className="relative" style={{ transform: "translate(-50%, -100%)" }}>
        <svg
          onClick={handleClick}
          width="32"
          height="32"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
          className={`drop-shadow-md transition-transform ${
            onClick ? "cursor-pointer hover:scale-110 active:scale-95" : ""
          }`}
        >
          {/* House body filled with color; door path stays white so it stays visible against any fill */}
          <path
            d="M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"
            fill={color}
            stroke="#fff"
            strokeWidth={1}
          />
          <path
            d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"
            fill="none"
            stroke="#fff"
            strokeWidth={1}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </OverlayView>
  );
}
