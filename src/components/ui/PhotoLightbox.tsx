"use client";

import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { IMAGEKIT_URL_ENDPOINT } from "@/lib/imagekit";

import { VisuallyHidden } from "@/components/ui/visually-hidden";

import Image from "next/image";

interface Photo {
    imagekitFilePath: string;
    caption?: string;
    originalFilename?: string;
}

interface PhotoLightboxProps {
    photos: Photo[];
    locationName: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    initialIndex?: number;
}

export function PhotoLightbox({ photos, locationName, open, onOpenChange, initialIndex = 0 }: PhotoLightboxProps) {
    const [currentIndex, setCurrentIndex] = useState(initialIndex);
    const [isZoomed, setIsZoomed] = useState(false);
    const [rotation, setRotation] = useState(0);
    const [transformOrigin, setTransformOrigin] = useState('center center');
    const containerRef = useRef<HTMLDivElement>(null);

    // Remove useEffect for state resets

    const handleDialogOpenChange = (nextOpen: boolean) => {
        onOpenChange(nextOpen);
        if (nextOpen) {
            setIsZoomed(false);
            setRotation(0);
            setTransformOrigin('center center');
            setCurrentIndex(initialIndex);
        }
    };

    if (!photos || photos.length === 0) {
        return null;
    }
    const currentPhoto = photos[currentIndex];

    // Helper function to get full image URL
    const getImageUrl = (imagekitFilePath: string): string => {
        // If already a full URL (starts with http/https), return as-is
        if (imagekitFilePath.startsWith('http://') || imagekitFilePath.startsWith('https://')) {
            return imagekitFilePath;
        }
        // Otherwise, prepend ImageKit endpoint
        return `${IMAGEKIT_URL_ENDPOINT}${imagekitFilePath}`;
    };

    const imageUrl = getImageUrl(currentPhoto.imagekitFilePath);

    const handleImageClick = (e: React.MouseEvent<HTMLImageElement>) => {
        if (!isZoomed) {
            // Calculate click position relative to the image
            const rect = e.currentTarget.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width) * 100;
            const y = ((e.clientY - rect.top) / rect.height) * 100;
            setTransformOrigin(`${x}% ${y}%`);
            setIsZoomed(true);
        } else {
            // Zoom out
            setIsZoomed(false);
            setTransformOrigin('center center');
        }
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLImageElement>) => {
        if (isZoomed) {
            const rect = e.currentTarget.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width) * 100;
            const y = ((e.clientY - rect.top) / rect.height) * 100;
            setTransformOrigin(`${x}% ${y}%`);
        }
    };

    const handleReset = () => {
        setIsZoomed(false);
        setRotation(0);
        setTransformOrigin('center center');
    };

    return (
        <Dialog open={open} onOpenChange={handleDialogOpenChange}>
            <DialogContent className="max-w-[95vw] max-h-[95vh] w-auto h-auto p-0 overflow-hidden bg-black/95 border-none">
                <VisuallyHidden>
                    <DialogTitle>{locationName}</DialogTitle>
                </VisuallyHidden>
                {/* Header with controls */}
                <div className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between p-4 bg-linear-to-b from-black/80 to-transparent">
                    <div className="flex flex-col">
                        <h3 className="text-white font-semibold text-lg mb-1 truncate max-w-md">
                            {locationName}
                        </h3>
                        {currentPhoto.caption && (
                            <div className="text-white/80 text-xs italic mb-1 max-w-md truncate">
                                {currentPhoto.caption}
                            </div>
                        )}
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onOpenChange(false)}
                        className="text-white hover:bg-white/20"
                    >
                        <X className="w-5 h-5" />
                    </Button>
                </div>

                {/* Zoom controls and photo indicators */}
                <div className="absolute bottom-0 left-0 right-0 z-50 flex flex-col items-center justify-center gap-2 p-4 bg-linear-to-t from-black/80 to-transparent">
                    {/* Photo indicators (dots) */}
                    {photos.length > 1 && (
                        <div className="flex gap-1.5 mb-2">
                            {photos.map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => setCurrentIndex(i)}
                                    className={cn(
                                        "w-2 h-2 rounded-full transition-all",
                                        i === currentIndex ? "bg-white w-6" : "bg-white/40 hover:bg-white/60"
                                    )}
                                    aria-label={`Go to photo ${i + 1}`}
                                />
                            ))}
                        </div>
                    )}
                    {isZoomed && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleReset}
                            className="text-white hover:bg-white/20 text-xs"
                            title="Reset View"
                        >
                            Reset
                        </Button>
                    )}
                </div>

                {/* Photo container */}
                <div 
                    ref={containerRef}
                    className="w-full h-[90vh] flex items-center justify-center overflow-hidden relative"
                >
                    <Image
                        src={imageUrl}
                        alt={currentPhoto.caption || currentPhoto.originalFilename || locationName}
                        onClick={handleImageClick}
                        onMouseMove={handleMouseMove}
                        className={cn(
                            "max-w-full max-h-full object-contain transition-transform duration-100 select-none",
                            isZoomed ? "cursor-zoom-out" : "cursor-zoom-in"
                        )}
                        style={{
                            transform: `scale(${isZoomed ? 4 : 1}) rotate(${rotation}deg)`,
                            transformOrigin: transformOrigin,
                        }}
                        draggable={false}
                        width={1200}
                        height={800}
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        priority
                    />
                    {photos.length > 1 && (
                        <>
                            <button
                                onClick={() => setCurrentIndex((i) => (i === 0 ? photos.length - 1 : i - 1))}
                                className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white rounded-full p-2 z-10 transition-all"
                                aria-label="Previous photo"
                                type="button"
                            >
                                <ChevronLeft className="w-6 h-6" />
                            </button>
                            <button
                                onClick={() => setCurrentIndex((i) => (i === photos.length - 1 ? 0 : i + 1))}
                                className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white rounded-full p-2 z-10 transition-all"
                                aria-label="Next photo"
                                type="button"
                            >
                                <ChevronRight className="w-6 h-6" />
                            </button>
                        </>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
