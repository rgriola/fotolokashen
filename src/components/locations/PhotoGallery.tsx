"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Star, Info, X, ZoomIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { IMAGEKIT_URL_ENDPOINT } from "@/lib/imagekit";

interface Photo {
    id: number;
    imagekitFileId: string;
    imagekitFilePath: string;
    originalFilename: string;
    fileSize: number;
    mimeType: string;
    width?: number;
    height?: number;
    isPrimary?: boolean;
    caption?: string;
    // EXIF data
    gpsLatitude?: number;
    gpsLongitude?: number;
    gpsAltitude?: number;
    hasGpsData?: boolean;
    cameraMake?: string;
    cameraModel?: string;
    dateTaken?: string;
    iso?: number;
    focalLength?: number;
    aperture?: number;
    shutterSpeed?: string;
    uploadedAt: string;
}

interface PhotoGalleryProps {
    photos: Photo[];
    className?: string;
}

export function PhotoGallery({ photos, className }: PhotoGalleryProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [showMetadata, setShowMetadata] = useState(false);
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

    const formatDate = (dateString: string) => {
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
            });
        } catch {
            return dateString;
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
                    <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-muted border">
                        <img
                            src={photoUrl}
                            alt={currentPhoto.caption || currentPhoto.originalFilename}
                            className="w-full h-full object-cover"
                        />

                        {/* Primary Star Badge - Top Right */}
                        {currentPhoto.isPrimary && (
                            <div className="absolute top-2 right-2 bg-amber-500 text-white px-2 py-1 rounded-md flex items-center gap-1 text-xs font-medium">
                                <Star className="w-3 h-3 fill-white" />
                                Primary
                            </div>
                        )}

                        {/* Zoom Button - Top Left */}
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute top-2 left-2 w-8 h-8 bg-black/40 hover:bg-black/60 backdrop-blur-sm transition-all"
                            onClick={() => setShowLightbox(true)}
                            title="View full size"
                        >
                            <ZoomIn className="w-4 h-4 text-white" />
                        </Button>

                        {/* Navigation Arrows (only show if multiple photos) */}
                        {photos.length > 1 && (
                            <>
                                <Button
                                    type="button"
                                    variant="secondary"
                                    size="icon"
                                    className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 opacity-80 hover:opacity-100 transition-opacity"
                                    onClick={goToPrevious}
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                </Button>
                                <Button
                                    type="button"
                                    variant="secondary"
                                    size="icon"
                                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 opacity-80 hover:opacity-100 transition-opacity"
                                    onClick={goToNext}
                                >
                                    <ChevronRight className="w-5 h-5" />
                                </Button>

                                {/* Photo Counter */}
                                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/60 text-white px-3 py-1 rounded-full text-xs font-medium">
                                    {currentIndex + 1} / {photos.length}
                                </div>
                            </>
                        )}

                        {/* Photo Metadata - Bottom Left Corner */}
                        <div className="absolute bottom-2 left-2 flex items-end gap-2">
                            {/* Info Toggle Button */}
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className={cn(
                                    "w-6 h-6 backdrop-blur-sm transition-all",
                                    showMetadata
                                        ? "bg-primary text-primary-foreground hover:bg-primary/90"
                                        : "bg-black/40 hover:bg-black/60 text-white"
                                )}
                                onClick={() => setShowMetadata(!showMetadata)}
                                title={showMetadata ? "Hide photo info" : "Show photo info"}
                            >
                                <Info className="w-3.5 h-3.5" />
                            </Button>

                            {/* Metadata Panel (shown when toggled) */}
                            {showMetadata && (
                                <div className="bg-black/80 backdrop-blur-sm text-white px-3 py-2 rounded-md text-xs space-y-1 max-w-xs">
                                    {/* File Info */}
                                    <p className="truncate">
                                        <span className="font-semibold">📄 File:</span> {currentPhoto.originalFilename}
                                    </p>
                                    <p>
                                        <span className="font-semibold">💾 Size:</span> {formatFileSize(currentPhoto.fileSize)}
                                        {currentPhoto.width && currentPhoto.height && (
                                            <>
                                                {" · "}
                                                <span className="font-semibold">📐</span> {currentPhoto.width} × {currentPhoto.height}
                                            </>
                                        )}
                                    </p>

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
                        </div>
                    </div>

                    {/* Caption */}
                    {currentPhoto.caption && (
                        <div className="mt-2 text-sm text-muted-foreground italic">
                            "{currentPhoto.caption}"
                        </div>
                    )}
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
                                    "relative flex-shrink-0 w-20 h-20 rounded-md overflow-hidden border-2 transition-all",
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

            {/* Lightbox Modal */}
            <Dialog open={showLightbox} onOpenChange={setShowLightbox}>
                <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 overflow-hidden">
                    <div className="relative w-full h-full flex items-center justify-center bg-black">
                        {/* Close Button */}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute top-2 right-2 z-10 bg-black/50 hover:bg-black/70 text-white"
                            onClick={() => setShowLightbox(false)}
                        >
                            <X className="w-5 h-5" />
                        </Button>

                        {/* Navigation in Lightbox */}
                        {photos.length > 1 && (
                            <>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 text-white"
                                    onClick={goToPrevious}
                                >
                                    <ChevronLeft className="w-6 h-6" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 text-white"
                                    onClick={goToNext}
                                >
                                    <ChevronRight className="w-6 h-6" />
                                </Button>

                                {/* Counter in Lightbox */}
                                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-full text-sm font-medium">
                                    {currentIndex + 1} / {photos.length}
                                </div>
                            </>
                        )}

                        {/* Full Size Image */}
                        <img
                            src={photoUrl}
                            alt={currentPhoto.caption || currentPhoto.originalFilename}
                            className="max-w-full max-h-full object-contain"
                        />
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
