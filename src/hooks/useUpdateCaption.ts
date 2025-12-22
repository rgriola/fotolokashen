import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { Location } from '@/types/location';

interface UpdateCaptionData {
    id: number;
    caption: string;
}

export function useUpdateCaption() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, caption }: UpdateCaptionData) => {
            const response = await fetch(`/api/locations/${id}/caption`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ caption }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to update caption');
            }

            return response.json();
        },
        onMutate: async ({ id, caption }) => {
            // Cancel outgoing refetches
            await queryClient.cancelQueries({ queryKey: ['locations'] });

            // Snapshot the previous value
            const previousLocations = queryClient.getQueryData(['locations']);

            // Optimistically update
            queryClient.setQueryData(['locations'], (old: any) => {
                if (!old?.locations) return old;

                return {
                    ...old,
                    locations: old.locations.map((location: Location) =>
                        location.id === id
                            ? { ...location, userSave: { ...location.userSave, caption } }
                            : location
                    ),
                };
            });

            return { previousLocations };
        },
        onError: (error: Error, variables, context) => {
            // Rollback on error
            if (context?.previousLocations) {
                queryClient.setQueryData(['locations'], context.previousLocations);
            }
            toast.error(error.message || 'Failed to update caption');
        },
        onSuccess: () => {
            // Don't show toast for caption updates (inline editing)
            queryClient.invalidateQueries({ queryKey: ['locations'] });
        },
    });
}
