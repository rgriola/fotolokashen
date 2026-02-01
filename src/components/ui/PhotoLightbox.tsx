"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, ZoomIn, ZoomOut, RotateCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface PhotoLightboxProps {
    photoUrl: string;
    photoTitle: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function PhotoLightbox({ photoUrl, photoTitle, open, onOpenChange }: PhotoLightboxProps) {
    const [zoom, setZoom] = useState(1);
    const [rotation, setRotation] = useState(0);

    // Reset zoom and rotation when dialog opens
    useEffect(() => {
        if (open) {
            setZoom(1);
            setRotation(0);
        }
    }, [open]);

    const handleZoomIn = () => {
        setZoom((prev) => Math.min(prev + 0.5, 10));
    };

    const handleZoomOut = () => {
        setZoom((prev) => Math.max(prev - 0.5, 0.5));
    };

    const handleRotate = () => {
        setRotation((prev) => (prev + 90) % 360);
    };

    const handleReset = () => {
        setZoom(1);
        setRotation(0);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[95vw] max-h-[95vh] w-auto h-auto p-0 overflow-hidden bg-black/95 border-none">
                {/* Header with controls */}
                <div className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between p-4 bg-gradient-to-b from-black/80 to-transparent">
                    <h3 className="text-white font-medium text-sm truncate max-w-md">
                        {photoTitle}
                    </h3>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onOpenChange(false)}
                        className="text-white hover:bg-white/20"
                    >
                        <X className="w-5 h-5" />
                    </Button>
                </div>

                {/* Zoom controls */}
                <div className="absolute bottom-0 left-0 right-0 z-50 flex items-center justify-center gap-2 p-4 bg-gradient-to-t from-black/80 to-transparent">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleZoomOut}
                        disabled={zoom <= 0.5}
                        className="text-white hover:bg-white/20 disabled:opacity-50"
                        title="Zoom Out"
                    >
                        <ZoomOut className="w-5 h-5" />
                    </Button>
                    
                    <span className="text-white text-sm font-medium min-w-[60px] text-center">
                        {Math.round(zoom * 100)}%
                    </span>
                    
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleZoomIn}
                        disabled={zoom >= 10}
                        className="text-white hover:bg-white/20 disabled:opacity-50"
                        title="Zoom In"
                    >
                        <ZoomIn className="w-5 h-5" />
                    </Button>

                    <div className="w-px h-6 bg-white/20 mx-2" />

                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleRotate}
                        className="text-white hover:bg-white/20"
                        title="Rotate"
                    >
                        <RotateCw className="w-5 h-5" />
                    </Button>

                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleReset}
                        className="text-white hover:bg-white/20 text-xs"
                        title="Reset View"
                    >
                        Reset
                    </Button>
                </div>

                {/* Photo container with overflow scroll for zoomed images */}
                <div className="w-full h-[90vh] overflow-auto">
                    <div 
                        className="flex items-center justify-center"
                        style={{
                            minWidth: `${zoom * 100}%`,
                            minHeight: `${zoom * 100}%`,
                            padding: '20%',
                        }}
                    >
                        <img
                            src={photoUrl}
                            alt={photoTitle}
                            className={cn(
                                "transition-transform duration-200",
                                zoom > 1 ? "cursor-grab active:cursor-grabbing" : "cursor-move"
                            )}
                            style={{
                                transform: `scale(${zoom}) rotate(${rotation}deg)`,
                                transformOrigin: 'center center',
                            }}
                            draggable={false}
                        />
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
