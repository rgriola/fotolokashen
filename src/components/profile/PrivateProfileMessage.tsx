"use client";

import { Lock, UserPlus, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";

interface PrivateProfileMessageProps {
  user: {
    username: string;
    avatar: string | null;
    firstName?: string | null;
    lastName?: string | null;
  };
  visibility: "private" | "followers";
  isAuthenticated: boolean;
}

export default function PrivateProfileMessage({
  user,
  visibility,
  isAuthenticated,
}: PrivateProfileMessageProps) {
  const displayName =
    user.firstName && user.lastName
      ? `${user.firstName} ${user.lastName}`
      : user.username;

  return (
    <div className="container mx-auto max-w-2xl px-4 py-12">
      <Card className="border-2">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          {/* Avatar */}
          <div className="relative mb-6 h-24 w-24 overflow-hidden rounded-full bg-muted">
            {user.avatar ? (
              <Image
                src={user.avatar}
                alt={displayName}
                fill
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-3xl font-semibold text-muted-foreground">
                {displayName[0]?.toUpperCase()}
              </div>
            )}
          </div>

          {/* Username */}
          <h1 className="mb-2 text-2xl font-bold">@{user.username}</h1>

          {/* Lock Icon and Message */}
          <div className="mb-6 flex flex-col items-center gap-4">
            <div className="rounded-full bg-muted p-4">
              <Lock className="h-8 w-8 text-muted-foreground" />
            </div>

            {visibility === "private" ? (
              <div className="space-y-2">
                <h2 className="text-xl font-semibold">
                  This Account is Private
                </h2>
                <p className="text-muted-foreground">
                  Only the account owner can view this profile
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <h2 className="text-xl font-semibold">
                  This Account is Private
                </h2>
                <p className="text-muted-foreground">
                  Follow @{user.username} to see their profile, saved locations,
                  and activity
                </p>
              </div>
            )}
          </div>

          {/* CTA Buttons */}
          {visibility === "followers" && isAuthenticated && (
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button size="lg" className="gap-2">
                <UserPlus className="h-4 w-4" />
                Follow
              </Button>
              <Button size="lg" variant="outline" className="gap-2" asChild>
                <Link href="/search">
                  <Users className="h-4 w-4" />
                  Discover Users
                </Link>
              </Button>
            </div>
          )}

          {visibility === "followers" && !isAuthenticated && (
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button size="lg" asChild>
                <Link href="/login">Sign In to Follow</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/register">Create Account</Link>
              </Button>
            </div>
          )}

          {visibility === "private" && (
            <Button size="lg" variant="outline" asChild>
              <Link href="/search">
                <Users className="h-4 w-4 mr-2" />
                Discover Other Users
              </Link>
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Additional Info */}
      <div className="mt-6 text-center text-sm text-muted-foreground">
        <p>
          Looking for someone else?{" "}
          <Link href="/search" className="text-primary hover:underline">
            Search for users
          </Link>
        </p>
      </div>
    </div>
  );
}
