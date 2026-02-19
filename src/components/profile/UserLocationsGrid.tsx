"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getImageKitUrl } from "@/lib/imagekit";

interface LocationPhoto {
  id: number;
  imagekitFilePath: string;
  isPrimary: boolean;
  caption?: string;
}

interface Location {
  id: number;
  name: string;
  address?: string;
  latitude: number;
  longitude: number;
  type?: string;
  photos: LocationPhoto[];
}

interface UserSave {
  id: number;
  caption?: string;
  savedAt: string;
  location: Location;
}


interface UserLocationsGridProps {
  username: string;
  displayName: string;
  googleMapsApiKey: string;
}

const PAGE_SIZE = 9;

export function UserLocationsGrid({ username, displayName, googleMapsApiKey }: UserLocationsGridProps) {
  const [page, setPage] = useState(1);
  const [locations, setLocations] = useState<UserSave[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);

  // Initial fetch and load more
  const fetchLocations = async (pageNum: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/users/${username}/locations?page=${pageNum}&limit=${PAGE_SIZE}`);
      if (!res.ok) {
        console.error('Failed to fetch locations:', res.statusText);
        setHasMore(false);
        setLoading(false);
        setInitialLoading(false);
        return;
      }
      const data = await res.json();
      if (data.locations) {
        // Deduplicate locations by save.id to prevent duplicate keys
        setLocations(prev => {
          const existingIds = new Set(prev.map(loc => loc.id));
          const newLocations = data.locations.filter((loc: UserSave) => !existingIds.has(loc.id));
          return [...prev, ...newLocations];
        });
        setHasMore(data.pagination.hasMore);
      }
    } catch (error) {
      console.error('Error fetching locations:', error);
      setHasMore(false);
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  };

  // Initial load
  React.useEffect(() => {
    setLocations([]);
    setPage(1);
    setHasMore(true);
    fetchLocations(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username]);

  // Load more handler
  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchLocations(nextPage);
  };

  if (initialLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
          <div key={i} className="bg-card rounded-lg border overflow-hidden animate-pulse">
            <div className="w-full h-48 bg-muted" />
            <div className="p-4 space-y-2">
              <div className="h-5 bg-muted rounded w-3/4" />
              <div className="h-4 bg-muted rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (locations.length === 0 && !hasMore) {
    return (
      <div className="text-center py-12 bg-card rounded-lg border">
        <p className="text-muted-foreground">
          {displayName} hasn&apos;t shared any locations yet.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {locations.map((save) => {
          // Validate coordinates before creating map URL
          const hasValidCoords = save.location.latitude && save.location.longitude;
          const mapImageUrl = hasValidCoords 
            ? `https://maps.googleapis.com/maps/api/staticmap?center=${save.location.latitude},${save.location.longitude}&zoom=16&size=600x400&scale=2&maptype=roadmap&markers=color:red%7C${save.location.latitude},${save.location.longitude}&key=${googleMapsApiKey}`
            : '';
          const hasValidPhoto = save.location.photos[0]?.imagekitFilePath;
          
          return (
            <Link
              key={save.id}
              href={`/${username}/locations/${save.location.id}`}
              className="group block bg-card rounded-lg border overflow-hidden hover:shadow-lg transition-shadow"
            >
              {/* Location Image */}
              {hasValidPhoto ? (
                <div className="relative w-full h-48 bg-muted">
                  <Image
                    src={getImageKitUrl(save.location.photos[0].imagekitFilePath, 'w-400,h-300,c-at_max')}
                    alt={save.location.name}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover group-hover:scale-105 transition-transform"
                  />
                </div>
              ) : hasValidCoords && mapImageUrl ? (
                <div className="relative w-full h-48 bg-muted overflow-hidden">
                  <Image
                    src={mapImageUrl}
                    alt={`Map of ${save.location.name}`}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover group-hover:scale-105 transition-transform"
                    unoptimized
                  />
                </div>
              ) : (
                <div className="w-full h-48 bg-muted flex items-center justify-center">
                  <div className="text-muted-foreground text-sm">No image</div>
                </div>
              )}
              {/* Location Info */}
              <div className="p-4">
                <h3 className="font-semibold text-lg mb-1 line-clamp-1">
                  {save.location.name}
                </h3>
                {save.caption && (
                  <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                    {save.caption}
                  </p>
                )}
                {save.location.address && (
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {save.location.address}
                  </p>
                )}
              </div>
            </Link>
          );
        })}
      </div>
      {hasMore && (
        <div className="flex justify-center mt-6">
          <Button onClick={handleLoadMore} disabled={loading}>
            {loading ? "Loading..." : "Load More"}
          </Button>
        </div>
      )}
    </div>
  );
}
