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
import { useUpdateLocation } from "@/hooks/useUpdateLocation";
import type { Location } from "@/types/location";
import { EditLocationForm } from "@/components/locations/EditLocationForm";

interface EditLocationDialogProps {
    location: Location | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function EditLocationDialog({
    location,
    open,
    onOpenChange,
}: EditLocationDialogProps) {
    const updateLocation = useUpdateLocation();

    const handleSubmit = (data: any) => {
        if (!location) return;

        updateLocation.mutate(data, {
            onSuccess: () => {
                onOpenChange(false);
            },
        });
    };

    if (!location) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Edit Location</DialogTitle>
                    <DialogDescription>
                        Update location details and notes.
                    </DialogDescription>
                </DialogHeader>

                <EditLocationForm
                    locationId={location.id}
                    location={location}
                    userSave={location.userSave || {
                        id: 0,
                        userId: 0,
                        locationId: location.id,
                        savedAt: new Date(),
                        caption: null,
                        tags: null,
                        isFavorite: false,
                        personalRating: null,
                        visitedAt: null,
                        color: null,
                        visibility: 'private' as const,
                    }}
                    onSubmit={handleSubmit}
                    isPending={updateLocation.isPending}
                />

                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={updateLocation.isPending}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        form="edit-location-form"
                        disabled={updateLocation.isPending}
                    >
                        {updateLocation.isPending ? "Saving..." : "Save Changes"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
