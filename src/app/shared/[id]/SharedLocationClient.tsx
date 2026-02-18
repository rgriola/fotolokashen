'use client';

import { useState } from 'react';
import Image from 'next/image';
import { MapPin, ExternalLink, Smartphone, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface SharedPhoto {
  id: number;
  url: string;
  isPrimary: boolean;
}

interface SharedLocation {
  id: number;
  name: string;
  address: string | null;
  lat: number;
  lng: number;
  type: string | null;
  photos: SharedPhoto[];
}

interface SharedLocationClientProps {
  location: SharedLocation;
  appUrl: string;
}

export default function SharedLocationClient({ location, appUrl }: SharedLocationClientProps) {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [appOpenAttempted, setAppOpenAttempted] = useState(false);

  const hasPhotos = location.photos.length > 0;
  const currentPhoto = hasPhotos ? location.photos[currentPhotoIndex] : null;

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${location.lat},${location.lng}`;
  const deepLinkUrl = `fotolokashen://location/${location.id}`;

  const handleOpenInApp = () => {
    setAppOpenAttempted(true);
    // Try custom URL scheme first
    window.location.href = deepLinkUrl;

    // If the app doesn't open after a delay, the user stays on this page
    // and sees the "Download" / "Continue in browser" options
    setTimeout(() => {
      setAppOpenAttempted(true);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header bar */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image
              src="/images/logo.png"
              alt="fotolokashen"
              width={28}
              height={28}
              className="rounded"
            />
            <span className="font-semibold text-sm">fotolokashen</span>
          </div>
          <Button size="sm" variant="default" onClick={handleOpenInApp}>
            <Smartphone className="h-4 w-4 mr-1" />
            Open in App
          </Button>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-4">
        {/* Photo carousel */}
        {hasPhotos && currentPhoto && (
          <div className="relative rounded-xl overflow-hidden bg-gray-200 dark:bg-gray-800">
            <div className="relative h-64 sm:h-80">
              <Image
                src={currentPhoto.url}
                alt={location.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 512px"
                priority
              />
            </div>

            {/* Photo navigation dots */}
            {location.photos.length > 1 && (
              <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
                {location.photos.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentPhotoIndex(idx)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      idx === currentPhotoIndex
                        ? 'bg-white scale-110'
                        : 'bg-white/50 hover:bg-white/75'
                    }`}
                    aria-label={`Photo ${idx + 1}`}
                  />
                ))}
              </div>
            )}

            {/* Type badge */}
            {location.type && (
              <div className="absolute top-3 left-3">
                <Badge variant="secondary" className="bg-black/50 text-white border-0 text-xs">
                  {location.type}
                </Badge>
              </div>
            )}
          </div>
        )}

        {/* No photos fallback — static map */}
        {!hasPhotos && (
          <div className="relative rounded-xl overflow-hidden h-48 bg-gray-200 dark:bg-gray-800">
            <Image
              src={`https://maps.googleapis.com/maps/api/staticmap?center=${location.lat},${location.lng}&zoom=15&size=600x300&scale=2&markers=color:red%7C${location.lat},${location.lng}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''}`}
              alt={`Map of ${location.name}`}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 512px"
            />
            {location.type && (
              <div className="absolute top-3 left-3">
                <Badge variant="secondary" className="bg-black/50 text-white border-0 text-xs">
                  {location.type}
                </Badge>
              </div>
            )}
          </div>
        )}

        {/* Location info */}
        <div className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-800 space-y-3">
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            {location.name}
          </h1>

          {location.address && (
            <div className="flex items-start gap-2 text-gray-600 dark:text-gray-400">
              <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
              <p className="text-sm">{location.address}</p>
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <Button variant="outline" size="sm" asChild className="flex-1">
              <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-1" />
                Directions
              </a>
            </Button>
          </div>
        </div>

        {/* Open in app / download prompt */}
        <div className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-800 space-y-3">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
            View on fotolokashen
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Save this location, add photos, and collaborate with your crew.
          </p>

          <div className="flex flex-col gap-2">
            <Button onClick={handleOpenInApp} className="w-full">
              <Smartphone className="h-4 w-4 mr-2" />
              Open in App
            </Button>

            {appOpenAttempted && (
              <p className="text-xs text-center text-gray-500 dark:text-gray-400">
                Don&apos;t have the app?{' '}
                <a
                  href={`${appUrl}/login`}
                  className="text-blue-600 dark:text-blue-400 underline"
                >
                  Continue in browser
                </a>
              </p>
            )}

            <Button variant="outline" size="sm" asChild className="w-full">
              <a href={`${appUrl}/login`}>
                <Globe className="h-4 w-4 mr-2" />
                Continue in Browser
              </a>
            </Button>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-gray-400 dark:text-gray-600 py-4">
          <p>Shared via fotolokashen</p>
          <p className="mt-1">Location Scouting Made Simple</p>
        </div>
      </main>
    </div>
  );
}
