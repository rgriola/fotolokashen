import { useQuery } from '@tanstack/react-query';

interface FriendLocation {
    id: number;
    locationId: number;
    caption: string | null;
    isFavorite: boolean;
    personalRating: number | null;
    tags: string[] | null;
    color: string | null;
    savedAt: Date;
    visibility: string;
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

interface UseFriendsLocationsParams {
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

interface FriendsLocationsResponse {
    locations: FriendLocation[];
    total: number;
    limit: number;
    hasMore: boolean;
}

export function useFriendsLocations(params?: UseFriendsLocationsParams) {
    return useQuery<FriendsLocationsResponse>({
        queryKey: ['friends-locations', params],
        queryFn: async () => {
            const queryParams = new URLSearchParams();

            if (params?.bounds) {
                queryParams.append('bounds', JSON.stringify(params.bounds));
            }

            if (params?.type) {
                queryParams.append('type', params.type);
            }

            if (params?.limit !== undefined) {
                queryParams.append('limit', params.limit.toString());
            }

            const response = await fetch(`/api/v1/locations/friends?${queryParams.toString()}`, {
                credentials: 'include',
            });

            if (!response.ok) {
                throw new Error('Failed to fetch friends locations');
            }

            return response.json();
        },
        enabled: params?.enabled ?? true,
        staleTime: 5 * 60 * 1000, // 5 minutes
        retry: 1,
    });
}
