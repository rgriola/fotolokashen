import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import prisma from '@/lib/prisma';
import { normalizeUsername } from '@/lib/username-utils';
import Image from 'next/image';
import Link from 'next/link';
import { MapPin, Calendar, Star, ArrowLeft } from 'lucide-react';

interface PublicLocationPageProps {
  params: Promise<{ username: string; id: string }>;
}

async function getUserByUsername(username: string) {
  const cleanUsername = username.startsWith('@') ? username.slice(1) : username;
  
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
    },
  });
}

async function getPublicLocation(userId: number, locationId: number) {
  return await prisma.userSave.findFirst({
    where: {
      userId,
      locationId,
      visibility: 'public',
    },
    include: {
      location: {
        include: {
          photos: {
            orderBy: [
              { isPrimary: 'desc' },
              { uploadedAt: 'asc' }
            ]
          }
        }
      }
    }
  });
}

export async function generateMetadata({ params }: PublicLocationPageProps): Promise<Metadata> {
  const { username, id } = await params;
  const user = await getUserByUsername(username);

  if (!user) {
    return {
      title: 'User Not Found',
    };
  }

  const save = await getPublicLocation(user.id, parseInt(id, 10));
  
  if (!save) {
    return {
      title: 'Location Not Found',
    };
  }

  const displayName = user.firstName && user.lastName 
    ? `${user.firstName} ${user.lastName}` 
    : user.username;

  const ogImage = save.location.photos[0]?.imagekitFilePath
    ? `https://ik.imagekit.io/rgriola${save.location.photos[0].imagekitFilePath}?tr=w-1200,h-630,c-at_max`
    : undefined;

  return {
    title: `${save.location.name} - ${displayName}'s Location`,
    description: save.caption || save.location.address || `View ${save.location.name} on ${displayName}'s profile`,
    openGraph: {
      title: save.location.name,
      description: save.caption || save.location.address || undefined,
      images: ogImage ? [ogImage] : [],
    },
  };
}

export default async function PublicLocationPage({ params }: PublicLocationPageProps) {
  const { username, id } = await params;
  const user = await getUserByUsername(username);

  if (!user) {
    notFound();
  }

  const save = await getPublicLocation(user.id, parseInt(id, 10));

  if (!save) {
    notFound();
  }

  const displayName = user.firstName && user.lastName 
    ? `${user.firstName} ${user.lastName}` 
    : user.username;

  const primaryPhoto = save.location.photos.find(p => p.isPrimary) || save.location.photos[0];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Back Navigation */}
        <div className="mb-6">
          <Link 
            href={`/@${user.username}`}
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to {displayName}'s Profile
          </Link>
        </div>

        {/* Location Header */}
        <div className="mb-6">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">{save.location.name}</h1>
          {save.location.address && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="w-4 h-4" />
              <p>{save.location.address}</p>
            </div>
          )}
        </div>

        {/* User Info */}
        <div className="flex items-center gap-3 mb-6 pb-6 border-b">
          {user.avatar ? (
            <Image
              src={user.avatar}
              alt={displayName}
              width={48}
              height={48}
              className="rounded-full"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-lg font-bold">
              {user.username.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <p className="font-semibold">{displayName}</p>
            <Link 
              href={`/@${user.username}`}
              className="text-sm text-muted-foreground hover:text-primary"
            >
              @{user.username}
            </Link>
          </div>
        </div>

        {/* Primary Photo */}
        {primaryPhoto && (
          <div className="mb-6 rounded-lg overflow-hidden">
            <Image
              src={`https://ik.imagekit.io/rgriola${primaryPhoto.imagekitFilePath}?tr=w-1200,h-800,c-at_max`}
              alt={save.location.name}
              width={1200}
              height={800}
              className="w-full h-auto"
              priority
            />
            {primaryPhoto.caption && (
              <p className="mt-2 text-sm text-muted-foreground italic">
                {primaryPhoto.caption}
              </p>
            )}
          </div>
        )}

        {/* User's Caption */}
        {save.caption && (
          <div className="mb-6 p-4 bg-muted rounded-lg">
            <p className="text-lg">{save.caption}</p>
          </div>
        )}

        {/* Location Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {save.location.indoorOutdoor && (
            <div className="p-4 bg-card border rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Type</p>
              <p className="font-medium capitalize">{save.location.indoorOutdoor}</p>
            </div>
          )}
          
          {save.location.rating && (
            <div className="p-4 bg-card border rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Rating</p>
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <p className="font-medium">{save.location.rating.toFixed(1)}</p>
              </div>
            </div>
          )}

          <div className="p-4 bg-card border rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">Saved</p>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <p className="font-medium">
                {new Date(save.savedAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          {save.visitedAt && (
            <div className="p-4 bg-card border rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Visited</p>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <p className="font-medium">
                  {new Date(save.visitedAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Additional Photos Gallery */}
        {save.location.photos.length > 1 && (
          <div>
            <h2 className="text-2xl font-bold mb-4">More Photos</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {save.location.photos
                .filter(photo => photo.id !== primaryPhoto?.id)
                .map((photo) => (
                  <div key={photo.id} className="relative aspect-square rounded-lg overflow-hidden">
                    <Image
                      src={`https://ik.imagekit.io/rgriola${photo.imagekitFilePath}?tr=w-400,h-400,c-at_max`}
                      alt={photo.caption || save.location.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Map Preview (Optional - can add Google Maps embed later) */}
        <div className="mt-8 p-6 bg-card border rounded-lg text-center">
          <MapPin className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-muted-foreground mb-2">Location Coordinates</p>
          <p className="font-mono text-sm">
            {save.location.lat.toFixed(6)}, {save.location.lng.toFixed(6)}
          </p>
          {save.location.placeId && (
            <a
              href={`https://www.google.com/maps/place/?q=place_id:${save.location.placeId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-4 text-primary hover:underline"
            >
              View on Google Maps →
            </a>
          )}
        </div>

        {/* View All Locations Link */}
        <div className="mt-8 text-center">
          <Link
            href={`/@${user.username}/locations`}
            className="text-primary hover:underline"
          >
            View all locations from {displayName} →
          </Link>
        </div>
      </div>
    </div>
  );
}
