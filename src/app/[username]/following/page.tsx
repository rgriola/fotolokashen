import { notFound } from "next/navigation";
import { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import prisma from "@/lib/prisma";
import { normalizeUsername } from "@/lib/username-utils";
import { FollowersList } from "@/components/social";
import { Button } from "@/components/ui/button";

interface FollowingPageProps {
  params: Promise<{ username: string }>;
}

async function getUserByUsername(username: string) {
  return await prisma.user.findFirst({
    where: {
      username: {
        equals: normalizeUsername(username),
        mode: "insensitive",
      },
    },
    select: {
      id: true,
      username: true,
      firstName: true,
      lastName: true,
      avatar: true,
    },
  });
}

export async function generateMetadata({
  params,
}: FollowingPageProps): Promise<Metadata> {
  const { username } = await params;
  const user = await getUserByUsername(username);

  if (!user) {
    return {
      title: "User Not Found",
    };
  }

  const displayName =
    user.firstName && user.lastName
      ? `${user.firstName} ${user.lastName}`
      : user.username;

  return {
    title: `People ${displayName} (@${user.username}) follows - fotolokashen`,
    description: `View who ${displayName} follows on fotolokashen`,
  };
}

export default async function FollowingPage({ params }: FollowingPageProps) {
  const { username } = await params;
  const user = await getUserByUsername(username);

  if (!user) {
    notFound();
  }

  const displayName =
    user.firstName && user.lastName
      ? `${user.firstName} ${user.lastName}`
      : user.username;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <Link href={`/${user.username}`}>
              <Button variant="ghost" size="sm" className="mb-4">
                <ChevronLeft className="mr-2 h-4 w-4" />
                Back to Profile
              </Button>
            </Link>

            <h1 className="text-3xl font-bold mb-2">Following</h1>
            <p className="text-muted-foreground">
              Friend {displayName} follows
            </p>
          </div>

          {/* Following List */}
          <FollowersList username={user.username} type="following" />
        </div>
      </div>
    </div>
  );
}
