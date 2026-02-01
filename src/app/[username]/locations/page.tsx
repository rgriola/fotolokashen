import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import prisma from '@/lib/prisma';
import { normalizeUsername } from '@/lib/username-utils';
import { getImageKitUrl } from '@/lib/imagekit';
import Image from 'next/image';
import Link from 'next/link';

// Get Google Maps API key for static images
const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

interface UserLocationsPageProps {
  params: Promise<{ username: string }>;
}

async function getUserByUsername(username: string) {
  const cleanUsername = username.startsWith('@') ? username.slice(1) : username;
  
  return await prisma.user.findUnique({
    where: { username: normalizeUsername(cleanUsername) },
    select: {
      id: true,
      username: true,
      firstName: true,
      lastName: true,
      avatar: true,
    },
  });
}

async function getUserPublicLocations(userId: number) {
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
  });
}

export async function generateMetadata({ params }: UserLocationsPageProps): Promise<Metadata> {
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
    title: `${displayName}'s Locations - fotolokashen`,
    description: `Browse all public locations shared by ${displayName}`,
  };
}

export default async function UserLocationsPage({ params }: UserLocationsPageProps) {
  const { username } = await params;
  const user = await getUserByUsername(username);

  if (!user) {
    notFound();
  }

  const locations = await getUserPublicLocations(user.id);
  const displayName = user.firstName && user.lastName 
    ? `${user.firstName} ${user.lastName}` 
    : user.username;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Link
              href={`/${user.username}`}
              className="hover:opacity-80 transition-opacity"
            >
              {user.avatar ? (
                <Image
                  src={user.avatar}
                  alt={displayName}
                  width={64}
                  height={64}
                  className="rounded-full"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center text-2xl font-bold text-muted-foreground">
                  {user.username.charAt(0).toUpperCase()}
                </div>
              )}
            </Link>
            <div>
              <h1 className="text-3xl font-bold">{displayName}'s Locations</h1>
              <Link
                href={`/${user.username}`}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                @{user.username}
              </Link>
            </div>
          </div>

          {/* Locations Grid */}
          {locations.length > 0 ? (
            <div>
              <p className="text-muted-foreground mb-6">
                {locations.length} {locations.length === 1 ? 'location' : 'locations'}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {locations.map((save) => {
                  // Generate Google Maps Static API URL as fallback
                  const mapImageUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${save.location.lat},${save.location.lng}&zoom=16&size=600x400&scale=2&maptype=roadmap&markers=color:red%7C${save.location.lat},${save.location.lng}&key=${GOOGLE_MAPS_API_KEY}`;
                  
                  return (
                  <Link
                    key={save.id}
                    href={`/${user.username}/locations/${save.location.id}`}
                    className="group block bg-card rounded-lg border overflow-hidden hover:shadow-lg transition-shadow"
                  >
                    {/* Location Image */}
                    {save.location.photos[0] ? (
                      <div className="relative w-full h-48 bg-muted">
                        <Image
                          src={getImageKitUrl(save.location.photos[0].imagekitFilePath, 'w-400,h-300,c-at_max')}
                          alt={save.location.name}
                          fill
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                          className="object-cover group-hover:scale-105 transition-transform"
                        />
                      </div>
                    ) : (
                      <div className="relative w-full h-48 bg-muted overflow-hidden">
                        <img
                          src={mapImageUrl}
                          alt={`Map of ${save.location.name}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
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
                      {save.location.type && (
                        <span className="inline-block mt-2 px-2 py-1 text-xs rounded-full bg-primary/10 text-primary">
                          {save.location.type}
                        </span>
                      )}
                    </div>
                  </Link>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="text-center py-12 bg-card rounded-lg border">
              <p className="text-muted-foreground">
                {displayName} hasn't shared any locations yet.
              </p>
              <Link
                href={`/${user.username}`}
                className="mt-4 inline-block text-primary hover:underline"
              >
                Back to profile
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
