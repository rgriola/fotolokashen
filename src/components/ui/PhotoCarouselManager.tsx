"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Star, Trash2, Info, Maximize2, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PhotoLightbox } from "@/components/ui/PhotoLightbox";

interface Photo {
    id?: number;
    imagekitFileId: string;
    imagekitFilePath: string;
    originalFilename: string;
    fileSize: number;
    mimeType: string;
    width?: number;
    height?: number;
    url: string;
    isPrimary?: boolean;
    caption?: string;
}

interface PhotoCarouselManagerProps {
    photos: Photo[];
    onPhotosChange: (photos: Photo[]) => void;
    onRemovePhoto: (index: number) => void;
    maxPhotos?: number;
    photosToDelete?: number[]; // IDs of photos marked for deletion
}

export function PhotoCarouselManager({
    photos,
    onPhotosChange,
    onRemovePhoto,
    photosToDelete = [],
}: PhotoCarouselManagerProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isDeleteHovered, setIsDeleteHovered] = useState(false);
    const [showMetadata, setShowMetadata] = useState(false);
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [imageLoadError, setImageLoadError] = useState(false);

    const handleSetPrimary = (index: number) => {
        const newPhotos = photos.map((photo, i) => ({
            ...photo,
            isPrimary: i === index,
        }));
        onPhotosChange(newPhotos);
    };

    const handleCaptionChange = (index: number, caption: string) => {
        const newPhotos = [...photos];
        newPhotos[index] = { ...newPhotos[index], caption };
        onPhotosChange(newPhotos);
    };

    const goToPrevious = () => {
        setCurrentIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1));
    };

    const goToNext = () => {
        setCurrentIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1));
    };

    // Reset currentIndex if it's out of bounds after photo deletion
    useEffect(() => {
        if (currentIndex >= photos.length && photos.length > 0) {
            setCurrentIndex(photos.length - 1);
        }
    }, [photos.length, currentIndex]);

    // Reset image load error when photo changes
    useEffect(() => {
        setImageLoadError(false);
    }, [currentIndex]);

    if (photos.length === 0) {
        return null;
    }

    const currentPhoto = photos[currentIndex];
    
    // Safety check: if currentPhoto is undefined (race condition during deletion), return null
    if (!currentPhoto) {
        return null;
    }
    
    const isCurrentPhotoMarkedForDeletion = currentPhoto.id && photosToDelete.includes(currentPhoto.id);

    return (
        <div className="space-y-4">
            {/* Main Carousel Display */}
            <div className="relative">
                {/* Main Photo */}
                <div 
                    className="relative aspect-video w-full rounded-lg overflow-hidden bg-muted border cursor-pointer group"
                    onClick={() => setLightboxOpen(true)}
                    title="Click to view full size"
                >
                    {!imageLoadError ? (
                        <img
                            src={currentPhoto.url}
                            alt={currentPhoto.originalFilename}
                            className={cn(
                                "w-full h-full object-cover transition-all",
                                isCurrentPhotoMarkedForDeletion && "opacity-50"
                            )}
                            onError={() => setImageLoadError(true)}
                        />
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center">
                            <Camera className="w-16 h-16 text-muted-foreground mb-4" />
                            <p className="text-sm font-medium text-foreground mb-1">
                                {currentPhoto.originalFilename}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                Preview not available • Will convert on upload
                            </p>
                            <p className="text-xs text-muted-foreground mt-2">
                                {currentPhoto.mimeType} • {(currentPhoto.fileSize / 1024 / 1024).toFixed(2)} MB
                            </p>
                        </div>
                    )}

                    {/* Expand icon on hover */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                        <div className="bg-black/60 backdrop-blur-sm text-white p-3 rounded-full">
                            <Maximize2 className="w-6 h-6" />
                        </div>
                    </div>

                    {/* Deletion Badge */}
                    {isCurrentPhotoMarkedForDeletion && (
                        <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-red-600 text-white px-3 py-1.5 rounded-md font-semibold text-xs shadow-lg z-20 pointer-events-none">
                            Pending Delete
                        </div>
                    )}

                    {/* Primary Star Button - Top Right */}
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2 w-8 h-8 bg-black/40 hover:bg-black/60 backdrop-blur-sm transition-all z-5"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleSetPrimary(currentIndex);
                        }}
                        disabled={currentPhoto.isPrimary}
                        title={currentPhoto.isPrimary ? "Primary Photo" : "Set as Primary"}
                    >
                        <Star
                            className={cn(
                                "w-4 h-4 transition-all",
                                currentPhoto.isPrimary
                                    ? "fill-amber-500 text-amber-500"
                                    : "fill-none text-white stroke-2"
                            )}
                        />
                    </Button>

                    {/* Delete Overlay (darkens photo by 20% on hover) */}
                    {isDeleteHovered && (
                        <div className="absolute inset-0 bg-black/20 pointer-events-none transition-opacity" />
                    )}

                    {/* Delete Button with Trash Icon */}
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 left-2 w-8 h-8 bg-black/40 hover:bg-red-600/80 backdrop-blur-sm transition-all z-5"
                        onMouseEnter={() => setIsDeleteHovered(true)}
                        onMouseLeave={() => setIsDeleteHovered(false)}
                        onClick={(e) => {
                            e.stopPropagation();
                            onRemovePhoto(currentIndex);
                            setIsDeleteHovered(false);
                        }}
                        title={isCurrentPhotoMarkedForDeletion ? "Unmark Photo (Keep)" : "Mark Photo for Deletion"}
                    >
                        <Trash2
                            className={cn(
                                "w-4 h-4 transition-colors",
                                isDeleteHovered ? "text-white" : "text-white/80"
                            )}
                        />
                    </Button>

                    {/* Navigation Arrows (only show if multiple photos) */}
                    {photos.length > 1 && (
                        <>
                            <Button
                                type="button"
                                variant="secondary"
                                size="icon"
                                className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 opacity-80 hover:opacity-100 transition-opacity z-5"
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
                                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 opacity-80 hover:opacity-100 transition-opacity z-5"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    goToNext();
                                }}
                            >
                                <ChevronRight className="w-5 h-5" />
                            </Button>
                        </>
                    )}

                    {/* Photo Metadata - Bottom Right Corner */}
                    <div className="absolute bottom-2 right-2 flex items-end gap-2">
                        {/* Metadata Panel (shown when toggled) */}
                        {showMetadata && (
                            <div className="bg-black/70 backdrop-blur-sm text-white px-3 py-2 rounded-md text-xs space-y-1 max-w-xs">
                                <p className="truncate">
                                    <span className="font-semibold">File:</span> {currentPhoto.originalFilename}
                                </p>
                                <p>
                                    <span className="font-semibold">Size:</span> {(currentPhoto.fileSize / 1024).toFixed(0)} KB
                                    {currentPhoto.width && currentPhoto.height && (
                                        <>
                                            {" · "}
                                            <span className="font-semibold">Dimensions:</span> {currentPhoto.width} × {currentPhoto.height}
                                        </>
                                    )}
                                </p>
                            </div>
                        )}

                        {/* Info Toggle Button */}
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="w-6 h-6 bg-black/40 hover:bg-black/60 backdrop-blur-sm transition-all z-5"
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowMetadata(!showMetadata);
                            }}
                            title={showMetadata ? "Hide photo info" : "Show photo info"}
                        >
                            <Info className="w-3.5 h-3.5 text-white" />
                        </Button>
                    </div>
                </div>

                {/* Caption Input */}
                <div className="mt-2">
                    <input
                        type="text"
                        placeholder="Add caption (100 chars max)"
                        value={currentPhoto.caption || ""}
                        onChange={(e) => handleCaptionChange(currentIndex, e.target.value)}
                        maxLength={100}
                        className="w-full text-sm px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                </div>
            </div>

            {/* Thumbnail Strip (only show if multiple photos) */}
            {photos.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-2">
                    {photos.map((photo, index) => {
                        const isMarkedForDeletion = photo.id && photosToDelete.includes(photo.id);
                        return (
                            <button
                                key={index}
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
                                    src={photo.url}
                                    alt={photo.originalFilename}
                                    className={cn(
                                        "w-full h-full object-cover transition-all",
                                        isMarkedForDeletion && "opacity-50"
                                    )}
                                    onError={(e) => {
                                        // Hide broken thumbnail images
                                        e.currentTarget.style.display = 'none';
                                        // Show file icon fallback
                                        const parent = e.currentTarget.parentElement;
                                        if (parent && !parent.querySelector('.thumbnail-fallback')) {
                                            const fallback = document.createElement('div');
                                            fallback.className = 'thumbnail-fallback absolute inset-0 flex items-center justify-center bg-muted';
                                            fallback.innerHTML = '<svg class="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>';
                                            parent.appendChild(fallback);
                                        }
                                    }}
                                />
                                
                                {/* Deletion badge for marked photos */}
                                {isMarkedForDeletion && (
                                    <div className="absolute top-0 left-0 right-0 bg-red-600 text-white text-[9px] font-semibold text-center py-0.5 pointer-events-none">
                                        DELETE
                                    </div>
                                )}
                                
                                {/* Primary star on thumbnail */}
                                {photo.isPrimary && (
                                    <div className="absolute top-0.5 right-0.5 bg-amber-500 text-white p-0.5 rounded-full">
                                        <Star className="w-2.5 h-2.5 fill-white" />
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>
            )}

            {/* Photo Lightbox */}
            <PhotoLightbox
                photoUrl={currentPhoto.url}
                photoTitle={currentPhoto.originalFilename}
                open={lightboxOpen}
                onOpenChange={setLightboxOpen}
            />
        </div>
    );
}
