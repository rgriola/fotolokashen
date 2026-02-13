"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Star, Info, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { IMAGEKIT_URL_ENDPOINT } from "@/lib/imagekit";
import { PhotoLightbox } from "@/components/ui/PhotoLightbox";
import type { Photo } from "@/types/location";

interface PhotoGalleryProps {
    photos: Photo[];
    className?: string;
}

export function PhotoGallery({ photos, className }: PhotoGalleryProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [showMetadata, setShowMetadata] = useState(false);
    const [showCaption, setShowCaption] = useState(true);
    const [showLightbox, setShowLightbox] = useState(false);

    if (!photos || photos.length === 0) {
        return (
            <div className={cn("flex items-center justify-center h-64 bg-muted rounded-lg", className)}>
                <div className="text-center text-muted-foreground">
                    <p className="text-sm">No photos available</p>
                </div>
            </div>
        );
    }

    const currentPhoto = photos[currentIndex];
    const photoUrl = `${IMAGEKIT_URL_ENDPOINT}${currentPhoto.imagekitFilePath}`;

    const goToPrevious = () => {
        setCurrentIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1));
    };

    const goToNext = () => {
        setCurrentIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1));
    };

    const formatDate = (dateInput: string | Date) => {
        try {
            const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
            return date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
            });
        } catch {
            return String(dateInput);
        }
    };

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    return (
        <>
            <div className={cn("space-y-4", className)}>
                {/* Main Carousel Display */}
                <div className="relative">
                    {/* Main Photo */}
                    <div 
                        className="relative aspect-video w-full rounded-lg overflow-hidden bg-muted border cursor-pointer group"
                        onClick={() => setShowLightbox(true)}
                        title="Click to view full size"
                    >
                        <img
                            src={photoUrl}
                            alt={currentPhoto.caption || currentPhoto.originalFilename}
                            className="w-full h-full object-cover"
                        />

                        {/* Expand icon on hover */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                            <div className="bg-black/60 backdrop-blur-sm text-white p-3 rounded-full">
                                <Maximize2 className="w-6 h-6" />
                            </div>
                        </div>

                        {/* Info Toggle Button - Bottom Right */}
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className={cn(
                                "absolute bottom-2 right-2 w-7 h-7 backdrop-blur-sm transition-all z-10",
                                !showCaption
                                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                                    : "bg-black/40 hover:bg-black/60 text-white"
                            )}
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowCaption(!showCaption);
                            }}
                            title={showCaption ? "Show photo info" : "Show caption"}
                        >
                            <Info className="w-4 h-4" />
                        </Button>

                        {/* Metadata Panel - Bottom Right (shown when caption is hidden) */}
                        {!showCaption && (
                            <div className="absolute bottom-11 right-2 bg-black/80 backdrop-blur-sm text-white px-3 py-2 rounded-md text-xs space-y-1 max-w-xs z-10">
                                {/* File Info */}
                                <p className="truncate">
                                    <span className="font-semibold">📄 File:</span> {currentPhoto.originalFilename}
                                </p>
                                {currentPhoto.fileSize && (
                                    <p>
                                        <span className="font-semibold">💾 Size:</span> {formatFileSize(currentPhoto.fileSize)}
                                        {currentPhoto.width && currentPhoto.height && (
                                            <>
                                                {" · "}
                                                <span className="font-semibold">📐</span> {currentPhoto.width} × {currentPhoto.height}
                                            </>
                                        )}
                                    </p>
                                )}

                                {/* Camera Info */}
                                {(currentPhoto.cameraMake || currentPhoto.cameraModel) && (
                                    <p className="truncate">
                                        <span className="font-semibold">📷</span> {currentPhoto.cameraMake} {currentPhoto.cameraModel}
                                    </p>
                                )}

                                {/* Date Taken */}
                                {currentPhoto.dateTaken && (
                                    <p>
                                        <span className="font-semibold">📅</span> {formatDate(currentPhoto.dateTaken)}
                                    </p>
                                )}

                                {/* GPS Data */}
                                {currentPhoto.hasGpsData && currentPhoto.gpsLatitude && currentPhoto.gpsLongitude && (
                                    <p>
                                        <span className="font-semibold">📍 GPS:</span>{" "}
                                        {currentPhoto.gpsLatitude.toFixed(3)}, {currentPhoto.gpsLongitude.toFixed(3)}
                                    </p>
                                )}

                                {/* Camera Settings */}
                                {(currentPhoto.iso || currentPhoto.aperture || currentPhoto.shutterSpeed || currentPhoto.focalLength) && (
                                    <p>
                                        <span className="font-semibold">⚙️</span>{" "}
                                        {currentPhoto.iso && `ISO ${currentPhoto.iso}`}
                                        {currentPhoto.aperture && `, f/${currentPhoto.aperture}`}
                                        {currentPhoto.shutterSpeed && `, ${currentPhoto.shutterSpeed}`}
                                        {currentPhoto.focalLength && `, ${currentPhoto.focalLength}mm`}
                                    </p>
                                )}
                            </div>
                        )}

                        {/* Navigation Arrows (only show if multiple photos) */}
                        {photos.length > 1 && (
                            <>
                                <Button
                                    type="button"
                                    variant="secondary"
                                    size="icon"
                                    className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 opacity-80 hover:opacity-100 transition-opacity z-10"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        goToPrevious();
                                    }}
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                </Button>
                                <Button
                                    type="button"
                                    variant="secondary"
                                    size="icon"
                                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 opacity-80 hover:opacity-100 transition-opacity z-10"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        goToNext();
                                    }}
                                >
                                    <ChevronRight className="w-5 h-5" />
                                </Button>
                            </>
                        )}

                        {/* Caption - Bottom Left Corner */}
                        {currentPhoto.caption && showCaption && (
                            <div className="absolute bottom-2 left-2 bg-black/70 backdrop-blur-sm text-white px-3 py-2 rounded-md text-sm italic max-w-[60%] z-10">
                                "{currentPhoto.caption}"
                            </div>
                        )}
                    </div>
                </div>

                {/* Thumbnail Strip (only show if multiple photos) */}
                {photos.length > 1 && (
                    <div className="flex gap-2 overflow-x-auto pb-2">
                        {photos.map((photo, index) => (
                            <button
                                key={photo.id}
                                type="button"
                                onClick={() => setCurrentIndex(index)}
                                className={cn(
                                    "relative shrink-0 w-20 h-20 rounded-md overflow-hidden border-2 transition-all",
                                    currentIndex === index
                                        ? "border-primary ring-2 ring-primary/20"
                                        : "border-border hover:border-primary/50"
                                )}
                            >
                                <img
                                    src={`${IMAGEKIT_URL_ENDPOINT}${photo.imagekitFilePath}`}
                                    alt={photo.caption || photo.originalFilename}
                                    className="w-full h-full object-cover"
                                />

                                {/* Primary star on thumbnail */}
                                {photo.isPrimary && (
                                    <div className="absolute top-0.5 right-0.5 bg-amber-500 text-white p-0.5 rounded-full">
                                        <Star className="w-2.5 h-2.5 fill-white" />
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Photo Lightbox with Zoom & Rotate */}
            <PhotoLightbox
                photoUrl={photoUrl}
                photoTitle={currentPhoto.caption || currentPhoto.originalFilename}
                open={showLightbox}
                onOpenChange={setShowLightbox}
            />
        </>
    );
}
