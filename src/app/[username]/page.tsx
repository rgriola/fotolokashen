import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import prisma from '@/lib/prisma';
import { normalizeUsername } from '@/lib/username-utils';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';
import { ProfileStats } from '@/components/profile/ProfileStats';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-for-development';

async function getCurrentUserId(): Promise<number | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    
    if (!token) return null;
    
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
    return decoded.userId;
  } catch {
    return null;
  }
}

interface UserProfilePageProps {
  params: Promise<{ username: string }>;
}

async function getUserByUsername(username: string) {
  // Remove @ prefix if present
  const cleanUsername = username.startsWith('@') ? username.slice(1) : username;
  
  // Case-insensitive lookup
  return await prisma.user.findFirst({
    where: { 
      username: {
        equals: normalizeUsername(cleanUsername),
        mode: 'insensitive'
      }
    },
    select: {
      id: true,
      username: true,
      firstName: true,
      lastName: true,
      avatar: true,
      bannerImage: true,
      bio: true,
      createdAt: true,
      _count: {
        select: {
          savedLocations: {
            where: {
              visibility: 'public'
            }
          }
        }
      }
    },
  });
}

async function getUserPublicLocations(userId: number, limit: number = 6) {
  return await prisma.userSave.findMany({
    where: {
      userId,
      visibility: 'public',
    },
    include: {
      location: {
        select: {
          id: true,
          name: true,
          address: true,
          lat: true,
          lng: true,
          type: true,
          photos: {
            where: {
              isPrimary: true,
            },
            take: 1,
            select: {
              imagekitFilePath: true,
            },
          },
        },
      },
    },
    orderBy: {
      savedAt: 'desc',
    },
    take: limit,
  });
}

export async function generateMetadata({ params }: UserProfilePageProps): Promise<Metadata> {
  const { username } = await params;
  const user = await getUserByUsername(username);

  if (!user) {
    return {
      title: 'User Not Found',
    };
  }

  const displayName = user.firstName && user.lastName 
    ? `${user.firstName} ${user.lastName}` 
    : user.username;

  return {
    title: `${displayName} (@${user.username}) - fotolokashen`,
    description: user.bio || `View ${displayName}'s public locations on fotolokashen`,
    openGraph: {
      title: `${displayName} (@${user.username})`,
      description: user.bio || `View ${displayName}'s public locations`,
      images: user.avatar ? [user.avatar] : [],
    },
  };
}

export default async function UserProfilePage({ params }: UserProfilePageProps) {
  const { username } = await params;
  const user = await getUserByUsername(username);

  if (!user) {
    notFound();
  }

  // Get current logged-in user to check if viewing own profile
  const currentUserId = await getCurrentUserId();
  const isOwnProfile = currentUserId === user.id;

  const locations = await getUserPublicLocations(user.id);
  const displayName = user.firstName && user.lastName 
    ? `${user.firstName} ${user.lastName}` 
    : user.username;

  return (
    <div className="min-h-screen bg-background">
      {/* Banner Image */}
      {user.bannerImage ? (
        <div className="relative w-full h-48 md:h-64 bg-muted">
          <Image
            src={user.bannerImage}
            alt={`${displayName}'s banner`}
            fill
            className="object-cover"
            priority
          />
        </div>
      ) : (
        <div className="w-full h-48 md:h-64 bg-gradient-to-r from-primary/20 to-primary/10" />
      )}

      {/* Profile Content */}
      <div className="container mx-auto px-4 -mt-16 md:-mt-20">
        <div className="max-w-4xl mx-auto">
          {/* Back to Settings Button (only for own profile) */}
          {isOwnProfile && (
            <div className="mb-4">
              <Link href="/profile">
                <Button variant="outline" size="sm" className="gap-2">
                  <Settings className="w-4 h-4" />
                  Back to Settings
                </Button>
              </Link>
            </div>
          )}

          {/* Avatar & Basic Info */}
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 mb-6">
            {/* Avatar */}
            <div className="relative">
              {user.avatar ? (
                <Image
                  src={user.avatar}
                  alt={displayName}
                  width={128}
                  height={128}
                  className="rounded-full border-4 border-background shadow-lg"
                />
              ) : (
                <div className="w-32 h-32 rounded-full border-4 border-background shadow-lg bg-muted flex items-center justify-center text-4xl font-bold text-muted-foreground">
                  {user.username.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            {/* Name & Username */}
            <div className="flex-1">
              <h1 className="text-3xl font-bold">{displayName}</h1>
              <p className="text-muted-foreground">@{user.username}</p>
            </div>
          </div>

          {/* Bio */}
          {user.bio && (
            <div className="mb-6 p-4 bg-card rounded-lg border">
              <p className="text-foreground whitespace-pre-wrap">{user.bio}</p>
            </div>
          )}

          {/* Stats & Follow Button */}
          <ProfileStats
            username={user.username}
            isOwnProfile={isOwnProfile}
            stats={{
              publicLocations: user._count.savedLocations,
              followers: 0, // TODO: Add to query
              following: 0, // TODO: Add to query
            }}
          />

          <div className="mb-8">
            <p className="text-sm text-muted-foreground">
              Joined {new Date(user.createdAt).toLocaleDateString('en-US', { 
                month: 'long', 
                year: 'numeric' 
              })}
            </p>
          </div>

          {/* Locations Grid */}
          {locations.length > 0 ? (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">Public Locations</h2>
                {user._count.savedLocations > 6 && (
                  <Link
                    href={`/@${user.username}/locations`}
                    className="text-primary hover:underline"
                  >
                    View all ({user._count.savedLocations})
                  </Link>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {locations.map((save) => (
                  <Link
                    key={save.id}
                    href={`/@${user.username}/locations/${save.location.id}`}
                    className="group block bg-card rounded-lg border overflow-hidden hover:shadow-lg transition-shadow"
                  >
                    {/* Location Image */}
                    {save.location.photos[0] ? (
                      <div className="relative w-full h-48 bg-muted">
                        <Image
                          src={`https://ik.imagekit.io/rgriola${save.location.photos[0].imagekitFilePath}?tr=w-400,h-300,c-at_max`}
                          alt={save.location.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform"
                        />
                      </div>
                    ) : (
                      <div className="w-full h-48 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                        <span className="text-4xl">📍</span>
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
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-12 bg-card rounded-lg border">
              <p className="text-muted-foreground">
                {displayName} hasn't shared any locations yet.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
