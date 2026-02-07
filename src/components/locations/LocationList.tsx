"use client";

import { LocationCard } from "./LocationCard";
import { Skeleton } from "@/components/ui/skeleton";
import type { Location } from "@/types/location";
import { useAuth } from "@/lib/auth-context";

interface LocationListProps {
    locations: Location[];
    isLoading?: boolean;
    onEdit?: (location: Location) => void;
    onDelete?: (id: number) => void;
    onShare?: (location: Location) => void;
    onClick?: (location: Location) => void;
}

export function LocationList({
    locations,
    isLoading,
    onEdit,
    onDelete,
    onShare,
    onClick,
}: LocationListProps) {
    const { user } = useAuth();

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="space-y-3">
                        <Skeleton className="h-48 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                ))}
            </div>
        );
    }

    if (!locations || locations.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                    <svg
                        className="w-8 h-8 text-muted-foreground"
                        fill="none"
                        strokeWidth="2"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
                        />
                    </svg>
                </div>
                <h3 className="text-lg font-semibold mb-2">No locations saved yet</h3>
                <p className="text-muted-foreground max-w-sm">
                    Start by saving your first location using the map or search feature.
                </p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {locations.map((location, index) => {
                // Check if user can edit (creator, admin, or staffer)
                const canEdit =
                    user?.isAdmin ||
                    user?.role === 'staffer' ||
                    user?.role === 'super_admin' ||
                    location.createdBy === user?.id;

                return (
                    <LocationCard
                        key={location.id}
                        location={location}
                        onEdit={onEdit}
                        onDelete={onDelete}
                        onShare={onShare}
                        onClick={onClick}
                        canEdit={canEdit}
                        isFirstCard={index === 0}
                    />
                );
            })}
        </div>
    );
}
