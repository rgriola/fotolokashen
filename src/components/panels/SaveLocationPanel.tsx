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
            {/* Form - Scrollable content */}
            <div className="flex-1 overflow-y-auto p-4 pb-32">
                <SaveLocationForm
                    initialData={initialData}
                    onSubmit={handleSubmit}
                    isPending={saveLocation.isPending}
                    showPhotoUpload={showPhotoUpload}
                />
            </div>

            {/* Footer with Actions - Fixed at bottom with safe area padding */}
            <div className="sticky bottom-0 p-4 pb-6 border-t space-y-2 bg-background shadow-lg">
                <div className="flex gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onCancel}
                        disabled={saveLocation.isPending}
                        className="flex-1"
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        form="save-location-form"
                        disabled={saveLocation.isPending}
                        className="flex-1"
                    >
                        {saveLocation.isPending ? "Saving..." : "Save"}
                    </Button>
                </div>

                {/* Quick Save Button */}
                <Button
                    type="button"
                    variant="secondary"
                    onClick={handleQuickSave}
                    disabled={saveLocation.isPending || !initialData?.name}
                    className="w-full"
                >
                    <Zap className="w-4 h-4 mr-2" />
                    Quick Save (Complete Later)
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                    Quick save stores basic info. You'll get a reminder email to complete details.
                </p>
            </div>
        </div>
    );
}
