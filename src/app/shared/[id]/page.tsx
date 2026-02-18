import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import SharedLocationClient from './SharedLocationClient';

interface SharedLocationPageProps {
  params: Promise<{ id: string }>;
}

// Generate dynamic metadata for OG/social previews
export async function generateMetadata({ params }: SharedLocationPageProps): Promise<Metadata> {
  const { id } = await params;
  const locationId = parseInt(id, 10);

  if (isNaN(locationId)) {
    return { title: 'Location Not Found | fotolokashen' };
  }

  const location = await prisma.location.findUnique({
    where: { id: locationId },
    include: {
      photos: {
        where: { isPrimary: true },
        take: 1,
      },
    },
  });

  if (!location) {
    return { title: 'Location Not Found | fotolokashen' };
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://fotolokashen.com';
  const photo = location.photos[0];
  const imageUrl = photo
    ? `https://ik.imagekit.io/rgriola${photo.imagekitFilePath}?tr=w-1200,h-630,fo-auto`
    : `${appUrl}/images/og-default.png`;

  return {
    title: `${location.name} | fotolokashen`,
    description: location.address || 'Shared location on fotolokashen',
    openGraph: {
      type: 'website',
      title: location.name,
      description: location.address || 'Shared location on fotolokashen',
      url: `${appUrl}/shared/${location.id}`,
      siteName: 'fotolokashen',
      images: [{ url: imageUrl, width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      title: location.name,
      description: location.address || 'Shared location on fotolokashen',
      images: [imageUrl],
    },
  };
}

export default async function SharedLocationPage({ params }: SharedLocationPageProps) {
  const { id } = await params;
  const locationId = parseInt(id, 10);

  if (isNaN(locationId)) {
    notFound();
  }

  const location = await prisma.location.findUnique({
    where: { id: locationId },
    include: {
      photos: {
        orderBy: [{ isPrimary: 'desc' }, { uploadedAt: 'asc' }],
        take: 10,
      },
    },
  });

  if (!location) {
    notFound();
  }

  // Serialize for client component
  const serializedLocation = {
    id: location.id,
    name: location.name,
    address: location.address,
    lat: location.lat,
    lng: location.lng,
    type: location.type,
    photos: location.photos.map((p) => ({
      id: p.id,
      url: `https://ik.imagekit.io/rgriola${p.imagekitFilePath}`,
      isPrimary: p.isPrimary,
    })),
  };

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://fotolokashen.com';

  return <SharedLocationClient location={serializedLocation} appUrl={appUrl} />;
}
