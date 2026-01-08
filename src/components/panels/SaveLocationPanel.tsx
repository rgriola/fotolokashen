"use client";

import { Button } from "@/components/ui/button";
import { useSaveLocation } from "@/hooks/useSaveLocation";
import { Zap } from "lucide-react";
import { SaveLocationForm } from "@/components/locations/SaveLocationForm";
import { useRef } from "react";

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
            <div className="flex-1 overflow-y-auto p-4">
                <SaveLocationForm
                    initialData={initialData}
                    onSubmit={handleSubmit}
                    isPending={saveLocation.isPending}
                    showPhotoUpload={showPhotoUpload}
                />
            </div>
        </div>
    );
}
