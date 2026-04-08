import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { TOAST } from '@/lib/constants/messages';
import type { Location } from '@/types/location';

interface UpdateLocationData {
    id: number;
    name?: string;
    address?: string;
    type?: string;
    indoorOutdoor?: string;
    street?: string;
    number?: string;
    city?: string;
    state?: string;
    zipcode?: string;
    productionNotes?: string;
    entryPoint?: string;
    parking?: string;
    access?: string;
    isPermanent?: boolean;
    caption?: string;
    tags?: string[];
    isFavorite?: boolean;
    personalRating?: number;
    color?: string;
    photos?: any[];
}

export function useUpdateLocation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, ...data }: UpdateLocationData) => {
            const response = await fetch(`/api/locations/${id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to update location');
            }

            return response.json();
        },
        onMutate: async ({ id, ...newData }) => {
            // Cancel outgoing refetches
            await queryClient.cancelQueries({ queryKey: ['locations'] });

            // Snapshot the previous value
            const previousLocations = queryClient.getQueryData(['locations']);

            // Optimistically update to the new value
            queryClient.setQueryData(['locations'], (old: any) => {
                if (!old?.locations) return old;

                return {
                    ...old,
                    locations: old.locations.map((location: Location) =>
                        location.id === id ? { ...location, ...newData } : location
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
            toast.error(error.message || TOAST.LOCATION.UPDATE_FAILED);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['locations'] });
            toast.success(TOAST.LOCATION.UPDATED);
        },
    });
}
