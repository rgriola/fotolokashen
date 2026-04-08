'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { RotateCw, ZoomIn, ZoomOut, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { TOAST } from '@/lib/constants/messages';

interface ImageEditorProps {
    open: boolean;
    onClose: () => void;
    imageFile: File | null;
    onSave: (croppedBlob: Blob, fileName: string) => void;
}

export function ImageEditor({ open, onClose, imageFile, onSave }: ImageEditorProps) {
    const [rotation, setRotation] = useState(0);
    const [zoom, setZoom] = useState(1);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const imageRef = useRef<HTMLImageElement | null>(null);
    const rafRef = useRef<number | null>(null);

    const drawCanvas = useCallback(() => {
        if (!canvasRef.current || !imageRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const img = imageRef.current;
        
        // Set canvas size to container size (400x400)
        const size = 400;
        canvas.width = size;
        canvas.height = size;

        // Clear canvas
        ctx.clearRect(0, 0, size, size);

        // Draw dotted grid background
        ctx.save();
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 5]);
        
        // Vertical lines every 50px
        for (let x = 0; x <= size; x += 50) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, size);
            ctx.stroke();
        }
        
        // Horizontal lines every 50px
        for (let y = 0; y <= size; y += 50) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(size, y);
            ctx.stroke();
        }
        
        ctx.restore();

        // Save context state
        ctx.save();

        // Move to center
        ctx.translate(size / 2, size / 2);

        // Apply rotation
        ctx.rotate((rotation * Math.PI) / 180);

        // Apply zoom
        ctx.scale(zoom, zoom);

        // Calculate image dimensions to maintain aspect ratio
        const imgAspect = img.width / img.height;
        let drawWidth = size;
        let drawHeight = size;

        if (imgAspect > 1) {
            drawHeight = size / imgAspect;
        } else {
            drawWidth = size * imgAspect;
        }

        // Draw image centered with crop offset
        ctx.drawImage(
            img,
            -drawWidth / 2 + crop.x,
            -drawHeight / 2 + crop.y,
            drawWidth,
            drawHeight
        );

        // Restore context
        ctx.restore();

        // Draw circular crop guide
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, size / 2 - 10, 0, 2 * Math.PI);
        ctx.stroke();
    }, [rotation, zoom, crop]);

    // Load image when file changes
    useEffect(() => {
        if (imageFile) {
            const url = URL.createObjectURL(imageFile);
            
            // Load image to get dimensions
            const img = new window.Image();
            img.onload = () => {
                imageRef.current = img;
                drawCanvas();
            };
            img.src = url;

            return () => URL.revokeObjectURL(url);
        }
    }, [imageFile, drawCanvas]);

    // Redraw when values change (with RAF for smooth rendering)
    useEffect(() => {
        if (imageRef.current) {
            // Cancel any pending RAF
            if (rafRef.current !== null) {
                cancelAnimationFrame(rafRef.current);
            }
            // Schedule redraw on next animation frame for smooth updates
            rafRef.current = requestAnimationFrame(() => {
                drawCanvas();
                rafRef.current = null;
            });
        }
        
        // Cleanup on unmount
        return () => {
            if (rafRef.current !== null) {
                cancelAnimationFrame(rafRef.current);
            }
        };
    }, [drawCanvas]);

    const handleRotate = () => {
        setRotation((prev) => (prev + 90) % 360);
    };

    const handleZoomChange = (value: number[]) => {
        setZoom(value[0]);
    };

    const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
        e.preventDefault();
        setIsDragging(true);
        setDragStart({ x: e.clientX - crop.x, y: e.clientY - crop.y });
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDragging) return;
        e.preventDefault();
        setCrop({
            x: e.clientX - dragStart.x,
            y: e.clientY - dragStart.y,
        });
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    // Touch event handlers for mobile
    const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
        e.preventDefault();
        const touch = e.touches[0];
        setIsDragging(true);
        setDragStart({ x: touch.clientX - crop.x, y: touch.clientY - crop.y });
    };

    const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
        if (!isDragging) return;
        e.preventDefault();
        const touch = e.touches[0];
        setCrop({
            x: touch.clientX - dragStart.x,
            y: touch.clientY - dragStart.y,
        });
    };

    const handleTouchEnd = () => {
        setIsDragging(false);
    };

    const handleSave = async () => {
        if (!imageRef.current) {
            toast.error(TOAST.PHOTO.NO_IMAGE_TO_SAVE);
            return;
        }

        try {
            // Create a temporary canvas for the final output
            const tempCanvas = document.createElement('canvas');
            const ctx = tempCanvas.getContext('2d');
            if (!ctx) throw new Error('Failed to get canvas context');

            const size = 400;
            tempCanvas.width = size;
            tempCanvas.height = size;

            const img = imageRef.current;

            // Create circular clipping path FIRST
            ctx.beginPath();
            ctx.arc(size / 2, size / 2, size / 2, 0, 2 * Math.PI);
            ctx.closePath();
            ctx.clip();

            // Now draw the image WITH transformations (but WITHOUT the guide)
            ctx.save();
            ctx.translate(size / 2, size / 2);
            ctx.rotate((rotation * Math.PI) / 180);
            ctx.scale(zoom, zoom);

            // Calculate image dimensions to maintain aspect ratio
            const imgAspect = img.width / img.height;
            let drawWidth = size;
            let drawHeight = size;

            if (imgAspect > 1) {
                drawHeight = size / imgAspect;
            } else {
                drawWidth = size * imgAspect;
            }

            // Draw image centered with crop offset
            ctx.drawImage(
                img,
                -drawWidth / 2 + crop.x,
                -drawHeight / 2 + crop.y,
                drawWidth,
                drawHeight
            );

            ctx.restore();

            // Convert to blob
            tempCanvas.toBlob((blob) => {
                if (blob && imageFile) {
                    onSave(blob, imageFile.name);
                    handleClose();
                }
            }, 'image/jpeg', 0.9);
        } catch (error) {
            console.error('Error saving image:', error);
            toast.error(TOAST.PHOTO.SAVE_FAILED);
        }
    };

    const handleClose = () => {
        setRotation(0);
        setZoom(1);
        setCrop({ x: 0, y: 0 });
        onClose();
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[90vw] md:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Edit Your Avatar</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Canvas */}
                    <div className="flex justify-center bg-muted rounded-lg p-4">
                        <canvas
                            ref={canvasRef}
                            width={400}
                            height={400}
                            className="border-2 border-border rounded-lg cursor-move max-w-full h-auto touch-none"
                            style={{ aspectRatio: '1 / 1' }}
                            onMouseDown={handleMouseDown}
                            onMouseMove={handleMouseMove}
                            onMouseUp={handleMouseUp}
                            onMouseLeave={handleMouseUp}
                            onTouchStart={handleTouchStart}
                            onTouchMove={handleTouchMove}
                            onTouchEnd={handleTouchEnd}
                            onTouchCancel={handleTouchEnd}
                        />
                    </div>

                    {/* Controls */}
                    <div className="space-y-4">
                        {/* Zoom Control */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium">Zoom</label>
                                <span className="text-sm text-muted-foreground">{zoom.toFixed(1)}x</span>
                            </div>
                            <div className="flex items-center gap-4">
                                <ZoomOut className="w-4 h-4 text-muted-foreground" />
                                <Slider
                                    value={[zoom]}
                                    onValueChange={handleZoomChange}
                                    min={0.5}
                                    max={3}
                                    step={0.01}
                                    className="flex-1"
                                />
                                <ZoomIn className="w-4 h-4 text-muted-foreground" />
                            </div>
                        </div>

                        {/* Rotate Button */}
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium">Rotation</label>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleRotate}
                                className="gap-2"
                            >
                                <RotateCw className="w-4 h-4" />
                                Rotate 90°
                            </Button>
                        </div>

                        <p className="text-sm text-muted-foreground">
                            Drag the image to reposition • Use slider to zoom • Click rotate to turn
                        </p>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={handleClose}>
                        <X className="w-4 h-4 mr-2" />
                        Cancel
                    </Button>
                    <Button onClick={handleSave}>
                        <Check className="w-4 h-4 mr-2" />
                        Save Avatar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
