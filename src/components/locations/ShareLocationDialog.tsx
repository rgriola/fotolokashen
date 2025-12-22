"use client";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";
import { useState } from "react";
import type { Location } from "@/types/location";

interface ShareLocationDialogProps {
    location: Location | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function ShareLocationDialog({
    location,
    open,
    onOpenChange,
}: ShareLocationDialogProps) {
    const [copied, setCopied] = useState(false);

    if (!location) return null;

    const shareUrl = `${window.location.origin}/locations/${location.id}`;

    const handleCopyLink = () => {
        navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Share Location</DialogTitle>
                    <DialogDescription>
                        Share this location with others via link
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Location Info */}
                    <div className="border rounded-lg p-4 space-y-2">
                        <h4 className="font-medium">{location.name}</h4>
                        <p className="text-sm text-muted-foreground">{location.address}</p>
                    </div>

                    {/* Share Link */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Share Link</label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={shareUrl}
                                readOnly
                                className="flex-1 px-3 py-2 text-sm border rounded-md bg-muted"
                            />
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleCopyLink}
                                className="shrink-0"
                            >
                                {copied ? (
                                    <>
                                        <Check className="w-4 h-4 mr-1" />
                                        Copied!
                                    </>
                                ) : (
                                    <>
                                        <Copy className="w-4 h-4 mr-1" />
                                        Copy
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>

                    {/* Future features placeholder */}
                    <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                        <p className="font-medium mb-1">Coming Soon:</p>
                        <ul className="list-disc list-inside space-y-1 text-xs">
                            <li>Share via email</li>
                            <li>Share with team members</li>
                            <li>Add to project collections</li>
                        </ul>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Close
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
