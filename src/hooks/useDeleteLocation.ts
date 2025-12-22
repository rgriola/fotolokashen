import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { Location } from '@/types/location';

export function useDeleteLocation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: number) => {
            const response = await fetch(`/api/locations/${id}`, {
                method: 'DELETE',
                credentials: 'include',
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to delete location');
            }

            return response.json();
        },
        onMutate: async (id) => {
            // Cancel outgoing refetches
            await queryClient.cancelQueries({ queryKey: ['locations'] });

            // Snapshot the previous value
            const previousLocations = queryClient.getQueryData(['locations']);

            // Optimistically remove from cache
            queryClient.setQueryData(['locations'], (old: any) => {
                if (!old?.locations) return old;

                return {
                    ...old,
                    locations: old.locations.filter((location: Location) => location.id !== id),
                    total: old.total - 1,
                };
            });

            return { previousLocations };
        },
        onError: (error: Error, variables, context) => {
            // Rollback on error
            if (context?.previousLocations) {
                queryClient.setQueryData(['locations'], context.previousLocations);
            }
            toast.error(error.message || 'Failed to delete location');
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['locations'] });
            toast.success('Location deleted successfully!');
        },
    });
}
