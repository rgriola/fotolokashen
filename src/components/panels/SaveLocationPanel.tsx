"use client";

import { useRef } from "react";
import { useSaveLocation } from "@/hooks/useSaveLocation";
import { SaveLocationForm } from "@/components/locations/SaveLocationForm";
import { Loader2 } from "lucide-react";

interface SaveLocationPanelProps {
    initialData?: any;
    onSuccess?: () => void;
    onCancel?: () => void;
    showPhotoUpload?: boolean;
}

export function SaveLocationPanel({
    initialData,
    onSuccess,
    onCancel,
    showPhotoUpload = false,
}: SaveLocationPanelProps) {
    const saveLocation = useSaveLocation();
    const formDataRef = useRef<any>(null);

    const handleSubmit = (data: any) => {
        // Store for quick save
        formDataRef.current = data;

        console.log('[SaveLocationPanel] Submitting data:', data);

        saveLocation.mutate(data, {
            onSuccess: () => {
                onSuccess?.();
            },
        });
    };

    const handleQuickSave = () => {
        if (!formDataRef.current) return;

        const data = formDataRef.current;
        saveLocation.mutate(
            {
                placeId: data.placeId,
                name: data.name,
                address: data.address,
                lat: data.lat,
                lng: data.lng,
                type: data.type,
                isPermanent: false,
            },
            {
                onSuccess: () => {
                    console.log("Quick save successful - reminder email queued");
                    onSuccess?.();
                },
            }
        );
    };

    return (
        <div className="flex flex-col h-full">
            {/* Form - Full height scrollable content */}
            <div className="flex-1 overflow-y-auto p-4 relative">
                <SaveLocationForm
                    initialData={initialData}
                    onSubmit={handleSubmit}
                    isPending={saveLocation.isPending}
                    showPhotoUpload={showPhotoUpload}
                />
                
                {/* Overlay during save - prevents interaction and shows loading state */}
                {saveLocation.isPending && (
                    <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-10 rounded-lg">
                        <div className="text-center space-y-3 p-6 bg-card rounded-lg shadow-lg border">
                            <Loader2 className="w-10 h-10 animate-spin mx-auto text-primary" />
                            <div>
                                <p className="text-lg font-semibold">Saving location...</p>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Please wait while we save your location
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
