import { useQuery } from '@tanstack/react-query';

interface PublicLocation {
    id: number;
    locationId: number;
    caption: string | null;
    isFavorite: boolean;
    personalRating: number | null;
    tags: string[] | null;
    color: string | null;
    savedAt: Date;
    location: {
        id: number;
        placeId: string;
        name: string;
        address: string | null;
        lat: number;
        lng: number;
        type: string | null;
        indoorOutdoor: string | null;
        photos: {
            imagekitFilePath: string;
        }[];
    };
    user: {
        id: number;
        username: string;
        firstName: string | null;
        lastName: string | null;
        avatar: string | null;
    };
}

interface UsePublicLocationsParams {
    bounds?: {
        north: number;
        south: number;
        east: number;
        west: number;
    };
    type?: string;
    limit?: number;
    enabled?: boolean; // Allow disabling the query
}

interface PublicLocationsResponse {
    locations: PublicLocation[];
    total: number;
    limit: number;
}

export function usePublicLocations(params?: UsePublicLocationsParams) {
    return useQuery<PublicLocationsResponse>({
        queryKey: ['public-locations', params],
        queryFn: async () => {
            const queryParams = new URLSearchParams();

            if (params?.bounds) {
                queryParams.append('bounds', JSON.stringify(params.bounds));
            }

            if (params?.type) {
                queryParams.append('type', params.type);
            }

            if (params?.limit) {
                queryParams.append('limit', params.limit.toString());
            }

            const url = `/api/v1/locations/public${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
            const response = await fetch(url, {
                credentials: 'include',
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to fetch public locations');
            }

            return response.json();
        },
        enabled: params?.enabled !== false, // Default to enabled unless explicitly disabled
        staleTime: 5 * 60 * 1000, // 5 minutes - public locations don't change as frequently
    });
}
