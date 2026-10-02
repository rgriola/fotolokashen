"use client";

import Link from "next/link";
import { FollowButton } from "@/components/social";

interface ProfileStatsProps {
  username: string;
  isOwnProfile: boolean;
  allowFollowRequests?: boolean;
  stats: {
    publicLocations: number;
    followers: number;
    following: number;
  };
}

export function ProfileStats({
  username,
  isOwnProfile,
  allowFollowRequests = true,
  stats,
}: ProfileStatsProps) {
  return (
    <div className="space-y-4">
      {/* Follow Button */}
      {!isOwnProfile && (
        <div className="mb-4">
          {allowFollowRequests ? (
            <FollowButton username={username} variant="default" />
          ) : (
            <div className="text-sm text-muted-foreground p-3 bg-muted rounded-md">
              This user is not accepting follow requests
            </div>
          )}
        </div>
      )}

      {/* Stats */}
      <div className="flex gap-6 text-sm">
        <div>
          <span className="font-semibold">{stats.publicLocations}</span>{" "}
          <span className="text-muted-foreground">Public Locations</span>
        </div>

        <Link href={`/${username}/followers`} className="hover:underline">
          <span className="font-semibold">{stats.followers}</span>{" "}
          <span className="text-muted-foreground">Followers</span>
        </Link>

        <Link href={`/${username}/following`} className="hover:underline">
          <span className="font-semibold">{stats.following}</span>{" "}
          <span className="text-muted-foreground">Following</span>
        </Link>
      </div>
    </div>
  );
}
