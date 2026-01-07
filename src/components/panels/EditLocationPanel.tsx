"use client";

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
    isFavorite?: boolean;
    indoorOutdoor?: "indoor" | "outdoor";
    showPhotoUpload?: boolean;
}

export function EditLocationPanel({
    locationId,
    location,
    userSave,
    onSuccess,
    onCancel,
    isFavorite,
    indoorOutdoor,
    showPhotoUpload = false,
}: EditLocationPanelProps) {
    const updateLocation = useUpdateLocation();

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
            {/* Form - Scrollable content */}
            <div className="flex-1 overflow-y-auto p-3 pb-20">
                <EditLocationForm
                    locationId={locationId}
                    location={location}
                    userSave={userSave}
                    onSubmit={handleSubmit}
                    isPending={updateLocation.isPending}
                    showPhotoUpload={showPhotoUpload}
                />
            </div>

            {/* Footer with Actions - Fixed at bottom with safe area padding */}
            <div className="sticky bottom-0 p-3 pb-6 border-t bg-background shadow-lg">
                <div className="flex gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onCancel}
                        disabled={updateLocation.isPending}
                        className="flex-1"
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        form="edit-location-form"
                        disabled={updateLocation.isPending}
                        className="flex-1"
                    >
                        {updateLocation.isPending ? "Updating..." : "Update"}
                    </Button>
                </div>
            </div>
        </div>
    );
}
