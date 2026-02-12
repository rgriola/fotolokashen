"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useUpdateLocation } from "@/hooks/useUpdateLocation";
import { UserSave, Location } from "@/types/location";
import { EditLocationForm } from "@/components/locations/EditLocationForm";

interface EditLocationPanelProps {
    locationId: number;
    location: Location;
    userSave: UserSave;
    onSuccess?: () => void;
    onCancel?: () => void;
    onSavingChange?: (isSaving: boolean) => void;
    isFavorite?: boolean;
    indoorOutdoor?: "indoor" | "outdoor";
    showPhotoUpload?: boolean;
    onPhotoUploadToggle?: () => void;
}

export function EditLocationPanel({
    locationId,
    location,
    userSave,
    onSuccess,
    onCancel,
    onSavingChange,
    isFavorite,
    indoorOutdoor,
    showPhotoUpload = false,
    onPhotoUploadToggle,
}: EditLocationPanelProps) {
    const updateLocation = useUpdateLocation();

    // Notify parent of saving state changes
    useEffect(() => {
        onSavingChange?.(updateLocation.isPending);
    }, [updateLocation.isPending, onSavingChange]);

    const handleSubmit = (data: any) => {
        console.log('[EditLocationPanel] Updating location:', data);

        // Merge isFavorite and indoorOutdoor from header with form data
        const updateData = {
            ...data,
            isFavorite: isFavorite ?? data.isFavorite,
            indoorOutdoor: indoorOutdoor ?? data.indoorOutdoor,
        };

        updateLocation.mutate(updateData, {
            onSuccess: () => {
                onSuccess?.();
            },
        });
    };

    return (
        <div className="flex flex-col h-full">
            {/* Form - Full height scrollable content */}
            <div className="flex-1 overflow-y-auto px-3 pb-3">
                <EditLocationForm
                    locationId={locationId}
                    location={location}
                    userSave={userSave}
                    onSubmit={handleSubmit}
                    isPending={updateLocation.isPending}
                    showPhotoUpload={showPhotoUpload}
                    onPhotoUploadToggle={onPhotoUploadToggle}
                />
            </div>
        </div>
    );
}
