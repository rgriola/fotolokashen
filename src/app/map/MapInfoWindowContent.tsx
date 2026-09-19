"use client";

import Image from "next/image";
import { Navigation, X } from "lucide-react";
import { getPhotoUrl } from "@/lib/storage";
import type { MarkerData } from "./types";

interface MapInfoWindowContentProps {
  marker: MarkerData;
  onViewPublicDetails: () => void;
  onViewSavedDetails: () => void;
  onSaveLocation: () => void;
  onClose: () => void;
}

const BLANK_PHOTO = "/blank-photo.png";

function resolvePhotoUrl(marker: MarkerData): string {
  if (marker.isPublic) {
    const path = marker.publicLocationRaw?.photos?.[0]?.imagekitFilePath;
    return path ? getPhotoUrl(path, "thumbnail") : BLANK_PHOTO;
  }
  if (marker.userSave) {
    const path = marker.userSave.location?.photos?.[0]?.imagekitFilePath;
    return path ? getPhotoUrl(path, "thumbnail") : BLANK_PHOTO;
  }
  return marker.data?.photoUrls?.[0] || BLANK_PHOTO;
}

export function MapInfoWindowContent({
  marker,
  onViewPublicDetails,
  onViewSavedDetails,
  onSaveLocation,
  onClose,
}: MapInfoWindowContentProps) {
  // Public locations and saved (non-public) locations both link to Map + Location Details
  const isPublicWithDetails = marker.isPublic && !!marker.publicLocationRaw;
  const isSavedWithDetails = !!marker.userSave && !marker.isPublic;
  const hasDetails = isPublicWithDetails || isSavedWithDetails;
  const handleViewDetails = isPublicWithDetails
    ? onViewPublicDetails
    : onViewSavedDetails;

  const creatorUsername = marker.isPublic
    ? marker.ownerUsername
    : marker.userSave?.user?.username;

  const photoUrl = resolvePhotoUrl(marker);
  const photoAlt = marker.data?.name || "Location photo";

  const photo = (
    <Image
      src={photoUrl}
      alt={photoAlt}
      width={150}
      height={150}
      className="w-37.5 h-37.5 rounded object-cover"
    />
  );

  return (
    <div className="space-y-2">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-base truncate">
          {marker.data?.name || "Custom Location"}
        </h3>
        <button
          onClick={onClose}
          aria-label="Close"
          className="shrink-0 text-muted-foreground hover:text-foreground"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {hasDetails ? (
        <button onClick={handleViewDetails} className="block">
          {photo}
        </button>
      ) : (
        photo
      )}

      {marker.data?.address &&
        (hasDetails ? (
          <button
            onClick={handleViewDetails}
            className="text-sm text-muted-foreground text-left hover:underline"
          >
            {marker.data.address}
          </button>
        ) : (
          <p className="text-sm text-muted-foreground">{marker.data.address}</p>
        ))}

      {/* GPS coordinates */}
      <div className="flex items-center gap-1.5">
        <Navigation className="w-3 h-3 text-muted-foreground shrink-0" />
        <code className="text-xs text-muted-foreground font-mono">
          {marker.position.lat.toFixed(3)}, {marker.position.lng.toFixed(3)}
        </code>
      </div>

      {/* Location creator - link to profile */}
      {creatorUsername && (
        <a
          href={`/${creatorUsername}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-medium text-social hover:underline"
        >
          @{creatorUsername}
        </a>
      )}

      {/* Temporary (unsaved) markers have no location to link to yet */}
      {marker.isTemporary && (
        <div className="flex gap-2 mt-2">
          <button
            onClick={onSaveLocation}
            className="px-3 py-1 bg-primary text-white text-sm rounded hover:bg-primary/90 transition-colors"
          >
            Save
          </button>
          <button
            disabled
            className="px-3 py-1 bg-muted text-muted-foreground text-sm rounded cursor-not-allowed opacity-60"
            title="Quick save feature temporarily disabled"
          >
            Quick Save
          </button>
        </div>
      )}
    </div>
  );
}
