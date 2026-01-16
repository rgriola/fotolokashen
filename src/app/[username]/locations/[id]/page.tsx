
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import prisma from '@/lib/prisma';
import { normalizeUsername } from '@/lib/username-utils';
import Image from 'next/image';
import { getImageKitUrl } from '@/lib/imagekit';
import Link from 'next/link';
import { MapPin, Calendar, Star, ExternalLink, Clock, DollarSign, Phone, AlertCircle, Sunrise, ParkingSquare, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

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

// Generate Google Maps Static API URL
function getStaticMapUrl(lat: number, lng: number, width: number = 1200, height: number = 675) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) return null;
  
  return `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=15&size=${width}x${height}&markers=color:red%7C${lat},${lng}&key=${apiKey}&scale=2`;
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
    ? getImageKitUrl(save.location.photos[0].imagekitFilePath, 'w-1200,h-630,c-at_max')
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
  const staticMapUrl = !primaryPhoto ? getStaticMapUrl(save.location.lat, save.location.lng) : null;

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Location Card - Clickable to open in /map */}
        <Link 
          href={`/map?lat=${save.location.lat}&lng=${save.location.lng}&zoom=17&edit=${save.id}`}
          className="block hover:opacity-90 transition-opacity"
        >
          <div className="bg-card border rounded-xl shadow-lg overflow-hidden">
            {/* Primary Photo or Static Map */}
            <div className="relative aspect-video w-full">
              {primaryPhoto ? (
                <Image
                  src={getImageKitUrl(primaryPhoto.imagekitFilePath, 'w-1200,h-675,c-at_max')}
                  alt={save.location.name}
                  fill
                  className="object-cover"
                  priority
                />
              ) : staticMapUrl ? (
                <Image
                  src={staticMapUrl}
                  alt={`Map of ${save.location.name}`}
                  fill
                  className="object-cover"
                  priority
                />
              ) : (
                <div className="w-full h-full bg-muted flex items-center justify-center">
                  <MapPin className="w-16 h-16 text-muted-foreground/30" />
                </div>
              )}
              {save.isFavorite && (
                <div className="absolute top-4 right-4">
                  <Badge variant="secondary" className="bg-yellow-500/90 text-white border-0">
                    <Star className="w-3 h-3 fill-white mr-1" />
                    Favorite
                  </Badge>
                </div>
              )}
            </div>

            {/* Card Content */}
            <div className="p-6 md:p-8">
              {/* Location Header */}
              <div className="mb-6">
                <h1 className="text-2xl md:text-3xl font-bold mb-3">{save.location.name}</h1>
                {save.location.address && (
                  <div className="flex items-start gap-2 text-muted-foreground">
                    <MapPin className="w-4 h-4 mt-1 flex-shrink-0" />
                    <p className="text-sm">{save.location.address}</p>
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
                  <p className="text-sm text-muted-foreground">
                    @{user.username}
                  </p>
                </div>
              </div>

              {/* User's Caption */}
              {save.caption && (
                <div className="mb-6 p-4 bg-muted/50 rounded-lg border">
                  <p className="text-sm text-muted-foreground mb-1">Personal Note</p>
                  <p className="leading-relaxed">{save.caption}</p>
                </div>
              )}

              {/* Location Details Grid */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                {save.personalRating && (
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Personal Rating</p>
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          className={`w-4 h-4 ${
                            i < save.personalRating! 
                              ? 'fill-yellow-400 text-yellow-400' 
                              : 'text-muted-foreground/30'
                          }`} 
                        />
                      ))}
                    </div>
                  </div>
                )}
                
                {save.location.indoorOutdoor && (
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Type</p>
                    <p className="font-medium capitalize text-sm">{save.location.indoorOutdoor}</p>
                  </div>
                )}

                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Saved</p>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    <p className="font-medium text-sm">
                      {new Date(save.savedAt).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric', 
                        year: 'numeric' 
                      })}
                    </p>
                  </div>
                </div>

                {save.visitedAt && (
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Visited</p>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      <p className="font-medium text-sm">
                        {new Date(save.visitedAt).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric', 
                          year: 'numeric' 
                        })}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Tags */}
              {save.tags && Array.isArray(save.tags) && save.tags.length > 0 && (
                <div className="mb-6">
                  <p className="text-xs text-muted-foreground mb-2">Tags</p>
                  <div className="flex flex-wrap gap-2">
                    {(save.tags as string[]).map((tag, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Additional Location Information */}
              {(save.location.productionNotes || save.location.entryPoint) && (
                <div className="mb-6 p-4 bg-muted/50 rounded-lg border">
                  <div className="flex items-center gap-2 mb-2">
                    <Info className="w-4 h-4 text-muted-foreground" />
                    <p className="text-sm font-semibold">Production Information</p>
                  </div>
                  {save.location.productionNotes && (
                    <p className="text-sm mb-2">{save.location.productionNotes}</p>
                  )}
                  {save.location.entryPoint && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">Entry Point: </span>
                      {save.location.entryPoint}
                    </div>
                  )}
                </div>
              )}

              {/* Access & Parking */}
              {(save.location.access || save.location.parking) && (
                <div className="mb-6 p-4 bg-muted/50 rounded-lg border">
                  <div className="flex items-center gap-2 mb-2">
                    <ParkingSquare className="w-4 h-4 text-muted-foreground" />
                    <p className="text-sm font-semibold">Access & Parking</p>
                  </div>
                  {save.location.access && (
                    <div className="text-sm mb-2">
                      <span className="text-muted-foreground">Access: </span>
                      {save.location.access}
                    </div>
                  )}
                  {save.location.parking && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">Parking: </span>
                      {save.location.parking}
                    </div>
                  )}
                </div>
              )}

              {/* Operating Hours & Best Time */}
              {(save.location.operatingHours || save.location.bestTimeOfDay) && (
                <div className="mb-6 p-4 bg-muted/50 rounded-lg border">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <p className="text-sm font-semibold">Hours & Timing</p>
                  </div>
                  {save.location.operatingHours && (
                    <div className="text-sm mb-2">
                      <span className="text-muted-foreground">Hours: </span>
                      {save.location.operatingHours}
                    </div>
                  )}
                  {save.location.bestTimeOfDay && (
                    <div className="text-sm flex items-center gap-1">
                      <Sunrise className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-muted-foreground">Best Time: </span>
                      {save.location.bestTimeOfDay}
                    </div>
                  )}
                </div>
              )}

              {/* Contact Information */}
              {(save.location.contactPerson || save.location.contactPhone) && (
                <div className="mb-6 p-4 bg-muted/50 rounded-lg border">
                  <div className="flex items-center gap-2 mb-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <p className="text-sm font-semibold">Contact Information</p>
                  </div>
                  {save.location.contactPerson && (
                    <div className="text-sm mb-2">
                      <span className="text-muted-foreground">Contact: </span>
                      {save.location.contactPerson}
                    </div>
                  )}
                  {save.location.contactPhone && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">Phone: </span>
                      <a href={`tel:${save.location.contactPhone}`} className="hover:underline">
                        {save.location.contactPhone}
                      </a>
                    </div>
                  )}
                </div>
              )}

              {/* Permit Requirements */}
              {(save.location.permitRequired || save.location.permitCost) && (
                <div className="mb-6 p-4 bg-muted/50 rounded-lg border">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-4 h-4 text-muted-foreground" />
                    <p className="text-sm font-semibold">Permit Information</p>
                  </div>
                  {save.location.permitRequired && (
                    <div className="text-sm mb-2 flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">Permit Required</Badge>
                    </div>
                  )}
                  {save.location.permitCost !== null && save.location.permitCost !== undefined && (
                    <div className="text-sm flex items-center gap-1">
                      <DollarSign className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-muted-foreground">Cost: </span>
                      ${save.location.permitCost}
                    </div>
                  )}
                </div>
              )}

              {/* Restrictions */}
              {save.location.restrictions && (
                <div className="mb-6 p-4 bg-muted/50 rounded-lg border">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-4 h-4 text-muted-foreground" />
                    <p className="text-sm font-semibold">Restrictions</p>
                  </div>
                  <p className="text-sm">{save.location.restrictions}</p>
                </div>
              )}

              {/* Additional Photos Gallery */}
              {save.location.photos.length > 1 && (
                <div className="border-t pt-6">
                  <h2 className="text-lg font-semibold mb-4">More Photos</h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {save.location.photos
                      .filter(photo => photo.id !== primaryPhoto?.id)
                      .map((photo) => (
                        <div key={photo.id} className="relative aspect-square rounded-lg overflow-hidden border">
                          <Image
                            src={getImageKitUrl(photo.imagekitFilePath, 'w-400,h-400,c-at_max')}
                            alt={photo.caption || save.location.name}
                            fill
                            className="object-cover hover:scale-105 transition-transform duration-200"
                          />
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Photo Caption */}
              {primaryPhoto && primaryPhoto.caption && (
                <div className="mt-6 pt-6 border-t">
                  <p className="text-xs text-muted-foreground mb-1">Photo Caption</p>
                  <p className="text-sm italic text-muted-foreground">{primaryPhoto.caption}</p>
                </div>
              )}
            </div>
          </div>
        </Link>

        {/* External Action Buttons (Outside clickable card) */}
        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <Button 
            asChild
            variant="outline"
            size="lg"
            className="flex-1"
          >
            <Link href={`/@${user.username}`}>
              View {displayName}'s Profile
            </Link>
          </Button>
          {save.location.placeId && (
            <Button 
              asChild
              variant="outline"
              size="lg"
              className="flex-1"
            >
              <a
                href={`https://www.google.com/maps/place/?q=place_id:${save.location.placeId}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Google Maps
              </a>
            </Button>
          )}
        </div>

        {/* Hint Text */}
        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            Click the card to view this location on the map
          </p>
        </div>
      </div>
    </div>
  );
}
