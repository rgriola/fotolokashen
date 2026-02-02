"use client";

import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, RotateCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { VisuallyHidden } from "@/components/ui/visually-hidden";

interface PhotoLightboxProps {
    photoUrl: string;
    photoTitle: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function PhotoLightbox({ photoUrl, photoTitle, open, onOpenChange }: PhotoLightboxProps) {
    const [isZoomed, setIsZoomed] = useState(false);
    const [rotation, setRotation] = useState(0);
    const [transformOrigin, setTransformOrigin] = useState('center center');
    const [cursorPosition, setCursorPosition] = useState({ x: 50, y: 50 });
    const containerRef = useRef<HTMLDivElement>(null);

    // Reset zoom and rotation when dialog opens
    useEffect(() => {
        if (open) {
            setIsZoomed(false);
            setRotation(0);
            setTransformOrigin('center center');
            setCursorPosition({ x: 50, y: 50 });
        }
    }, [open]);

    const handleImageClick = (e: React.MouseEvent<HTMLImageElement>) => {
        if (!isZoomed) {
            // Calculate click position relative to the image
            const rect = e.currentTarget.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width) * 100;
            const y = ((e.clientY - rect.top) / rect.height) * 100;
            
            setTransformOrigin(`${x}% ${y}%`);
            setCursorPosition({ x, y });
            setIsZoomed(true);
        } else {
            // Zoom out
            setIsZoomed(false);
            setTransformOrigin('center center');
            setCursorPosition({ x: 50, y: 50 });
        }
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLImageElement>) => {
        if (isZoomed) {
            const rect = e.currentTarget.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width) * 100;
            const y = ((e.clientY - rect.top) / rect.height) * 100;
            
            setTransformOrigin(`${x}% ${y}%`);
            setCursorPosition({ x, y });
        }
    };

    const handleRotate = () => {
        setRotation((prev) => (prev + 90) % 360);
    };

    const handleReset = () => {
        setIsZoomed(false);
        setRotation(0);
        setTransformOrigin('center center');
        setCursorPosition({ x: 50, y: 50 });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[95vw] max-h-[95vh] w-auto h-auto p-0 overflow-hidden bg-black/95 border-none">
                <VisuallyHidden>
                    <DialogTitle>{photoTitle}</DialogTitle>
                </VisuallyHidden>
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
                        onClick={handleRotate}
                        className="text-white hover:bg-white/20"
                        title="Rotate"
                    >
                        <RotateCw className="w-5 h-5" />
                    </Button>

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
                    className="w-full h-[90vh] flex items-center justify-center overflow-hidden"
                >
                    <img
                        src={photoUrl}
                        alt={photoTitle}
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
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
}
