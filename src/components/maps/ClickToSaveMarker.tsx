"use client";

import { InfoWindow } from "./InfoWindow";
import { Button } from "@/components/ui/button";
import { MapPin, X } from "lucide-react";

interface ClickToSaveMarkerProps {
    position: { lat: number; lng: number };
    onSave: () => void;
    onCancel: () => void;
}

export function ClickToSaveMarker({
    position,
    onSave,
    onCancel,
}: ClickToSaveMarkerProps) {
    return (
        <InfoWindow position={position} onClose={onCancel}>
            <div className="space-y-3 min-w-[200px]">
                <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-primary" />
                    <h3 className="font-semibold">Save this location?</h3>
                </div>

                <p className="text-sm text-muted-foreground">
                    Click Save to add this location to your collection
                </p>

                <div className="flex gap-2">
                    <Button onClick={onSave} size="sm" className="flex-1">
                        <MapPin className="w-4 h-4 mr-1" />
                        Save
                    </Button>
                    <Button onClick={onCancel} variant="outline" size="sm">
                        <X className="w-4 h-4" />
                    </Button>
                </div>
            </div>
        </InfoWindow>
    );
}
