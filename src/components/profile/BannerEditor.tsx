'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { RotateCw, ZoomIn } from 'lucide-react';

interface BannerEditorProps {
    isOpen: boolean;
    onClose: () => void;
    imageUrl: string;
    onSave: (blob: Blob) => void;
}

export default function BannerEditor({ isOpen, onClose, imageUrl, onSave }: BannerEditorProps) {
    const [zoom, setZoom] = useState(1);
    const [rotation, setRotation] = useState(0);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const imageRef = useRef<HTMLImageElement | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const drawCanvas = useCallback(() => {
        const canvas = canvasRef.current;
        const image = imageRef.current;
        
        if (!canvas || !image) {
            console.log('Canvas or image not ready:', { canvas: !!canvas, image: !!image });
            return;
        }

        const ctx = canvas.getContext('2d');
        if (!ctx) {
            console.error('Could not get canvas context');
            return;
        }

        console.log('Drawing canvas:', {
            canvasSize: { w: canvas.width, h: canvas.height },
            imageSize: { w: image.width, h: image.height },
            zoom,
            rotation,
            position
        });

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Save context state
        ctx.save();

        // Move to center for transformations
        ctx.translate(canvas.width / 2, canvas.height / 2);
        
        // Apply rotation
        ctx.rotate((rotation * Math.PI) / 180);
        
        // Apply zoom
        ctx.scale(zoom, zoom);
        
        // Apply position offset (scaled by zoom for better control)
        ctx.translate(position.x / zoom, position.y / zoom);

        // Calculate dimensions to cover the banner area while maintaining aspect ratio
        const imgAspect = image.width / image.height;
        const canvasAspect = canvas.width / canvas.height;
        
        let drawWidth, drawHeight;
        
        // Always cover the banner area (no letterboxing)
        if (imgAspect > canvasAspect) {
            // Image is wider than banner - fit to height and crop sides
            drawHeight = canvas.height;
            drawWidth = drawHeight * imgAspect;
        } else {
            // Image is taller than banner - fit to width and crop top/bottom
            drawWidth = canvas.width;
            drawHeight = drawWidth / imgAspect;
        }

        console.log('Drawing dimensions:', { drawWidth, drawHeight });

        // Draw image centered
        ctx.drawImage(
            image,
            -drawWidth / 2,
            -drawHeight / 2,
            drawWidth,
            drawHeight
        );

        ctx.restore();
    }, [zoom, rotation, position]);

    // Load image
    useEffect(() => {
        if (!imageUrl) return;
        
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = imageUrl;
        img.onload = () => {
            imageRef.current = img;
            // Force a small delay to ensure canvas is ready
            setTimeout(() => {
                drawCanvas();
            }, 10);
        };
        img.onerror = (e) => {
            console.error('Failed to load image:', e);
        };
    }, [imageUrl, drawCanvas]);

    // Redraw canvas when zoom, rotation, or position changes
    useEffect(() => {
        if (imageRef.current) {
            drawCanvas();
        }
    }, [drawCanvas]);

    const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
        setIsDragging(true);
        setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDragging) return;
        setPosition({
            x: e.clientX - dragStart.x,
            y: e.clientY - dragStart.y,
        });
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleRotate = () => {
        setRotation((prev) => (prev + 90) % 360);
    };

    const handleSave = async () => {
        const canvas = canvasRef.current;
        const image = imageRef.current;
        if (!canvas || !image) return;

        // Create a new canvas for the final output at full resolution
        const outputCanvas = document.createElement('canvas');
        const outputCtx = outputCanvas.getContext('2d');
        if (!outputCtx) return;

        // Set output size to 1200x400 (banner dimensions)
        outputCanvas.width = 1200;
        outputCanvas.height = 400;

        // Clear canvas
        outputCtx.clearRect(0, 0, outputCanvas.width, outputCanvas.height);

        // Save context state
        outputCtx.save();

        // Apply same transformations at higher resolution (scale factor = 1200/800 = 1.5)
        const scaleFactor = outputCanvas.width / canvas.width;
        
        outputCtx.translate(outputCanvas.width / 2, outputCanvas.height / 2);
        outputCtx.rotate((rotation * Math.PI) / 180);
        outputCtx.scale(zoom, zoom);
        outputCtx.translate((position.x / zoom) * scaleFactor, (position.y / zoom) * scaleFactor);

        // Calculate dimensions to cover banner area
        const imgAspect = image.width / image.height;
        const canvasAspect = outputCanvas.width / outputCanvas.height;
        
        let drawWidth, drawHeight;
        if (imgAspect > canvasAspect) {
            drawHeight = outputCanvas.height;
            drawWidth = drawHeight * imgAspect;
        } else {
            drawWidth = outputCanvas.width;
            drawHeight = drawWidth / imgAspect;
        }

        // Draw image
        outputCtx.drawImage(
            image,
            -drawWidth / 2,
            -drawHeight / 2,
            drawWidth,
            drawHeight
        );

        outputCtx.restore();

        // Convert to blob
        outputCanvas.toBlob(
            (blob) => {
                if (blob) {
                    onSave(blob);
                }
            },
            'image/jpeg',
            0.9
        );
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[50vw]">
                <DialogHeader>
                    <DialogTitle>Edit Cover Photo</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Canvas */}
                    <div
                        ref={containerRef}
                        className="relative bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden mx-auto"
                        style={{ width: '100%', aspectRatio: '3 / 1', maxWidth: '1200px' }}
                    >
                        <canvas
                            ref={canvasRef}
                            width={1200}
                            height={400}
                            onMouseDown={handleMouseDown}
                            onMouseMove={handleMouseMove}
                            onMouseUp={handleMouseUp}
                            onMouseLeave={handleMouseUp}
                            className="cursor-move w-full h-full"
                        />
                        <div className="absolute bottom-2 left-2 text-xs text-gray-600 dark:text-gray-400 bg-white/80 dark:bg-black/80 px-2 py-1 rounded">
                            Drag to reposition
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="space-y-4">
                        {/* Zoom */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium flex items-center gap-2">
                                    <ZoomIn className="h-4 w-4" />
                                    Zoom: {zoom.toFixed(1)}x
                                </label>
                            </div>
                            <Slider
                                value={[zoom]}
                                onValueChange={([value]) => setZoom(value)}
                                min={0.5}
                                max={3}
                                step={0.1}
                                className="w-full"
                            />
                        </div>

                        {/* Rotate */}
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium flex items-center gap-2">
                                <RotateCw className="h-4 w-4" />
                                Rotation: {rotation}°
                            </label>
                            <Button
                                onClick={handleRotate}
                                variant="outline"
                                size="sm"
                            >
                                Rotate 90°
                            </Button>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-2 pt-4 border-t">
                        <Button onClick={onClose} variant="outline">
                            Cancel
                        </Button>
                        <Button onClick={handleSave}>
                            Save Cover Photo
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
