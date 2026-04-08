'use client';

import type { MarkerData } from './types';

interface MapInfoWindowContentProps {
    marker: MarkerData;
    onViewPublicDetails: () => void;
    onViewSavedDetails: () => void;
    onSaveLocation: () => void;
}

export function MapInfoWindowContent({
    marker,
    onViewPublicDetails,
    onViewSavedDetails,
    onSaveLocation,
}: MapInfoWindowContentProps) {
    return (
        <div className="space-y-2">
            <h3 className="font-semibold text-lg">
                {marker.data?.name || 'Custom Location'}
            </h3>
            {marker.data?.address && (
                <p className="text-sm text-muted-foreground">
                    {marker.data.address}
                </p>
            )}
            {/* Display coordinates */}
            <p className="text-xs text-muted-foreground font-mono">
                {marker.position.lat.toFixed(3)}, {marker.position.lng.toFixed(3)}
            </p>
            {/* Show owner for public locations */}
            {marker.isPublic && marker.ownerUsername && (
                <div className="flex items-center gap-2 mt-2 p-2 bg-social/10 rounded border border-social/20">
                    <div className="text-sm">
                        <span className="text-muted-foreground">Shared by </span>
                        <a
                            href={`/${marker.ownerUsername}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-social hover:text-social hover:underline"
                        >
                            @{marker.ownerUsername}
                        </a>
                    </div>
                </div>
            )}
            {marker.data?.rating && (
                <div className="flex items-center gap-1">
                    <svg className="w-4 h-4 text-warning" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span className="text-sm font-medium">{marker.data.rating}</span>
                </div>
            )}
            <div className="flex gap-2 mt-2">
                {/* View Details button for public locations */}
                {marker.isPublic && marker.publicLocationRaw && (
                    <button
                        onClick={onViewPublicDetails}
                        className="px-3 py-1 bg-social text-white text-sm rounded hover:bg-social/90 transition-colors"
                    >
                        View Details
                    </button>
                )}
                {/* View button for saved locations (not public) */}
                {marker.userSave && !marker.isPublic && (
                    <button
                        onClick={onViewSavedDetails}
                        className="px-3 py-1 bg-primary text-white text-sm rounded hover:bg-primary/90 transition-colors"
                    >
                        View
                    </button>
                )}
                {/* Save button for temporary markers */}
                {marker.isTemporary && (
                    <button
                        onClick={onSaveLocation}
                        className="px-3 py-1 bg-primary text-white text-sm rounded hover:bg-primary/90 transition-colors"
                    >
                        Save
                    </button>
                )}
                {/* Quick Save button - disabled (feature in development) */}
                {marker.isTemporary && (
                    <button
                        disabled
                        className="px-3 py-1 bg-muted text-muted-foreground text-sm rounded cursor-not-allowed opacity-60"
                        title="Quick save feature temporarily disabled"
                    >
                        Quick Save
                    </button>
                )}
            </div>
        </div>
    );
}
