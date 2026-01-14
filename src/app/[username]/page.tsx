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
import PrivateProfileMessage from '@/components/profile/PrivateProfileMessage';

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
      // Privacy settings
      profileVisibility: true,
      showLocation: true,
      showSavedLocations: true,
      allowFollowRequests: true,
      city: true,
      country: true,
      _count: {
        select: {
          savedLocations: {
            where: {
              visibility: 'public'
            }
          },
          followers: true,
          following: true,
        }
      }
    },
  });
}

// Check if current user can view this profile
async function canViewProfile(
  profileUserId: number,
  currentUserId: number | null,
  profileVisibility: string
): Promise<{ canView: boolean; reason?: 'private' | 'followers' }> {
  // Public profiles are always visible
  if (profileVisibility === 'public') {
    return { canView: true };
  }

  // Not authenticated
  if (!currentUserId) {
    return { 
      canView: false, 
      reason: profileVisibility === 'private' ? 'private' : 'followers' 
    };
  }

  // Viewing own profile
  if (profileUserId === currentUserId) {
    return { canView: true };
  }

  // Private profiles only visible to owner
  if (profileVisibility === 'private') {
    return { canView: false, reason: 'private' };
  }

  // Followers-only: check if current user follows this profile
  if (profileVisibility === 'followers') {
    const isFollowing = await prisma.userFollow.findUnique({
      where: {
        followerId_followingId: {
          followerId: currentUserId,
          followingId: profileUserId,
        },
      },
    });

    if (isFollowing) {
      return { canView: true };
    }

    return { canView: false, reason: 'followers' };
  }

  return { canView: true };
}

// Check if current user can view saved locations
async function canViewLocations(
  profileUserId: number,
  currentUserId: number | null,
  showSavedLocations: string,
  isFollowing: boolean
): Promise<boolean> {
  // Owner can always view own locations
  if (currentUserId === profileUserId) {
    return true;
  }

  // Public locations visible to everyone
  if (showSavedLocations === 'public') {
    return true;
  }

  // Followers-only: check if following
  if (showSavedLocations === 'followers' && isFollowing) {
    return true;
  }

  // Private or not authorized
  return false;
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

  // Check privacy settings
  const { canView, reason } = await canViewProfile(
    user.id,
    currentUserId,
    user.profileVisibility
  );

  // If cannot view, show private profile message
  if (!canView && reason) {
    return (
      <PrivateProfileMessage
        user={{
          username: user.username,
          avatar: user.avatar,
          firstName: user.firstName,
          lastName: user.lastName,
        }}
        visibility={reason}
        isAuthenticated={currentUserId !== null}
      />
    );
  }

  // Check if user is following (for locations privacy)
  const isFollowing = currentUserId
    ? !!(await prisma.userFollow.findUnique({
        where: {
          followerId_followingId: {
            followerId: currentUserId,
            followingId: user.id,
          },
        },
      }))
    : false;

  // Check if current user can view saved locations
  const canViewSavedLocations = await canViewLocations(
    user.id,
    currentUserId,
    user.showSavedLocations,
    isFollowing
  );

  // Only fetch locations if user has permission
  const locations = canViewSavedLocations ? await getUserPublicLocations(user.id) : [];
  
  const displayName = user.firstName && user.lastName 
    ? `${user.firstName} ${user.lastName}` 
    : user.username;

  return (
    <div className="min-h-screen bg-background">
      {/* Banner Image */}
      {user.bannerImage ? (
        <div className="relative w-full h-32 md:h-40 bg-muted">
          <Image
            src={user.bannerImage}
            alt={`${displayName}'s banner`}
            fill
            className="object-cover"
            priority
          />
        </div>
      ) : (
        <div className="w-full h-32 md:h-40 bg-gradient-to-r from-primary/20 to-primary/10" />
      )}

      {/* Profile Content */}
      <div className="container mx-auto px-4 -mt-12 md:-mt-14">
        <div className="max-w-4xl mx-auto">
          {/* Back to Settings Button (only for own profile) */}
          {isOwnProfile && (
            <div className="mb-2">
              <Link href="/profile">
                <Button variant="outline" size="sm" className="gap-2 h-8 text-xs">
                  <Settings className="w-3 h-3" />
                  Back to Settings
                </Button>
              </Link>
            </div>
          )}

          {/* Avatar & Basic Info */}
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-3 mb-4">
            {/* Avatar */}
            <div className="relative">
              {user.avatar ? (
                <Image
                  src={user.avatar}
                  alt={displayName}
                  width={96}
                  height={96}
                  className="rounded-full border-4 border-background shadow-lg md:w-28 md:h-28"
                />
              ) : (
                <div className="w-24 h-24 md:w-28 md:h-28 rounded-full border-4 border-background shadow-lg bg-muted flex items-center justify-center text-3xl md:text-4xl font-bold text-muted-foreground">
                  {user.username.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            {/* Name & Username */}
            <div className="flex-1">
              <h1 className="text-xl md:text-2xl font-bold">{displayName}</h1>
              <p className="text-sm text-muted-foreground">@{user.username}</p>
            </div>
          </div>

          {/* Bio */}
          {user.bio && (
            <div className="mb-4 p-3 bg-card rounded-lg border">
              <p className="text-sm text-foreground whitespace-pre-wrap">{user.bio}</p>
            </div>
          )}

          {/* Stats & Follow Button */}
          <ProfileStats
            username={user.username}
            isOwnProfile={isOwnProfile}
            allowFollowRequests={user.allowFollowRequests}
            stats={{
              publicLocations: user._count.savedLocations,
              followers: user._count.followers,
              following: user._count.following,
            }}
          />

          <div className="mb-6 space-y-1">
            {/* Location (with privacy check) */}
            {user.showLocation && user.city && user.country && (
              <p className="text-sm text-muted-foreground">
                📍 {user.city}, {user.country}
              </p>
            )}
            
            <p className="text-sm text-muted-foreground">
              Joined {new Date(user.createdAt).toLocaleDateString('en-US', { 
                month: 'long', 
                year: 'numeric' 
              })}
            </p>
          </div>

          {/* Locations Grid */}
          {canViewSavedLocations ? (
            locations.length > 0 ? (
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
            )
          ) : (
            <div className="text-center py-12 bg-card rounded-lg border">
              <div className="flex flex-col items-center gap-3">
                <div className="rounded-full bg-muted p-3">
                  <span className="text-2xl">🔒</span>
                </div>
                <div>
                  <p className="font-semibold mb-1">Saved Locations are Private</p>
                  <p className="text-sm text-muted-foreground">
                    {user.showSavedLocations === 'followers' 
                      ? `Follow @${user.username} to see their saved locations`
                      : `@${user.username}'s saved locations are private`
                    }
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
