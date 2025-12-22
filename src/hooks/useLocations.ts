import { useQuery } from '@tanstack/react-query';
import type { Location } from '@/types/location';

interface UseLocationsParams {
    search?: string;
    type?: string;
    bounds?: {
        north: number;
        south: number;
        east: number;
        west: number;
    };
}

interface LocationsResponse {
    locations: Location[];
    total: number;
}

export function useLocations(params?: UseLocationsParams) {
    return useQuery<LocationsResponse>({
        queryKey: ['locations', params],
        queryFn: async () => {
            const queryParams = new URLSearchParams();

            if (params?.search) {
                queryParams.append('search', params.search);
            }

            if (params?.type) {
                queryParams.append('type', params.type);
            }

            if (params?.bounds) {
                queryParams.append('bounds', JSON.stringify(params.bounds));
            }

            const url = `/api/locations${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
            const response = await fetch(url, {
                credentials: 'include',
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to fetch locations');
            }

            return response.json();
        },
    });
}
