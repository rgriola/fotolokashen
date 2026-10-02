"use client";

import Image from "next/image";
import Link from "next/link";
import { FollowButton } from "./FollowButton";

interface UserCardProps {
  user: {
    username: string;
    displayName: string;
    avatar: string | null;
    bio: string | null;
  };
  showFollowButton?: boolean;
  currentUsername?: string;
}

export function UserCard({
  user,
  showFollowButton = true,
  currentUsername,
}: UserCardProps) {
  const isCurrentUser = currentUsername && currentUsername === user.username;

  return (
    <div className="flex items-start gap-3 p-4 bg-card rounded-lg border hover:shadow-md transition-shadow">
      {/* Avatar */}
      <Link href={`/${user.username}`} className="flex-shrink-0">
        {user.avatar ? (
          <Image
            src={user.avatar}
            alt={user.displayName}
            width={48}
            height={48}
            className="rounded-full"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-lg font-bold text-muted-foreground">
            {user.username.charAt(0).toUpperCase()}
          </div>
        )}
      </Link>

      {/* User Info */}
      <div className="flex-1 min-w-0">
        <Link href={`/${user.username}`} className="hover:underline">
          <h3 className="font-semibold text-base truncate">
            {user.displayName}
          </h3>
          <p className="text-sm text-muted-foreground truncate">
            @{user.username}
          </p>
        </Link>
        {user.bio && (
          <p className="text-sm text-foreground mt-1 line-clamp-2">
            {user.bio}
          </p>
        )}
      </div>

      {/* Follow Button */}
      {showFollowButton && !isCurrentUser && (
        <div className="flex-shrink-0">
          <FollowButton username={user.username} variant="compact" />
        </div>
      )}
    </div>
  );
}
