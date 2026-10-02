"use client";

import { useState, useEffect } from "react";
import { UserCard } from "./UserCard";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface User {
  id: number;
  username: string;
  displayName: string;
  avatar: string | null;
  bio: string | null;
  followedAt?: string;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore: boolean;
}

interface FollowersListProps {
  username: string;
  type: "followers" | "following";
  currentUsername?: string;
}

export function FollowersList({
  username,
  type,
  currentUsername,
}: FollowersListProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const endpoint = `/api/v1/users/${username}/${type}`;

  // Initial load
  useEffect(() => {
    async function fetchUsers() {
      try {
        setIsLoading(true);
        const response = await fetch(`${endpoint}?page=1&limit=20`);

        if (!response.ok) {
          throw new Error("Failed to fetch users");
        }

        const data = await response.json();
        setUsers(data[type]);
        setPagination(data.pagination);
      } catch (error) {
        console.error(`Error fetching ${type}:`, error);
        setError(
          error instanceof Error ? error.message : "Something went wrong",
        );
      } finally {
        setIsLoading(false);
      }
    }

    fetchUsers();
  }, [username, type, endpoint]);

  // Load more
  const handleLoadMore = async () => {
    if (!pagination || !pagination.hasMore) return;

    try {
      setIsLoadingMore(true);
      const nextPage = pagination.page + 1;
      const response = await fetch(`${endpoint}?page=${nextPage}&limit=20`);

      if (!response.ok) {
        throw new Error("Failed to load more users");
      }

      const data = await response.json();
      setUsers([...users, ...data[type]]);
      setPagination(data.pagination);
    } catch (error) {
      console.error(`Error loading more ${type}:`, error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="text-center py-12 bg-card rounded-lg border">
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

  // Empty state
  if (users.length === 0) {
    return (
      <div className="text-center py-12 bg-card rounded-lg border">
        <p className="text-muted-foreground">
          {type === "followers"
            ? `@${username} doesn't have any followers yet.`
            : `@${username} isn't following anyone yet.`}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* User list */}
      <div className="space-y-3">
        {users.map((user) => (
          <UserCard
            key={user.id}
            user={user}
            showFollowButton={true}
            currentUsername={currentUsername}
          />
        ))}
      </div>

      {/* Load more button */}
      {pagination && pagination.hasMore && (
        <div className="text-center pt-4">
          <Button
            onClick={handleLoadMore}
            disabled={isLoadingMore}
            variant="outline"
          >
            {isLoadingMore ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              `Load more (${pagination.total - users.length} remaining)`
            )}
          </Button>
        </div>
      )}

      {/* Count */}
      {pagination && (
        <p className="text-sm text-muted-foreground text-center pt-2">
          Showing {users.length} of {pagination.total}
        </p>
      )}
    </div>
  );
}
