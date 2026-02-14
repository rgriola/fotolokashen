import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { Providers } from "@/components/providers";
import { Header } from "@/components/layout/Header";
import { ConditionalFooter } from "@/components/layout/ConditionalFooter";
import { LayoutWrapper } from "@/components/layout/LayoutWrapper";
import { GoogleMapsProvider } from "@/lib/GoogleMapsProvider";
import { SentryInit } from "@/components/SentryInit";
import { SpeedInsights } from "@vercel/speed-insights/next";


const tagline = "Locations & Purpose";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover', // Support safe area insets
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://fotolokashen.com'),
  title: `fotolokashen | ${tagline}`,
  description: "Photography crew managment platform. Create Projects, Use location data to be precise and remember the best view. With the best maps available google maps.",
  keywords: ["location management", "location scouting", "media production", "film locations", "photography locations", "google maps"],
  authors: [{ name: "fotolokashen" }],

  // Open Graph (Facebook, LinkedIn, Discord, etc.)
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://fotolokashen.com",
    siteName: "fotolokashen",
    title: `fotolokashen | ${tagline}`,
    description: "Use your photo data to save locations, share the best views, organize projects and team members with fotolokashen.com",
    images: [
      {
        url: "/og-image.png", // Static image in public folder
        width: 1200,
        height: 630,
        alt: "fotolokashen - Purposeful Locations",
      },
    ],
  },

  // Twitter Card
  twitter: {
    card: "summary_large_image",
    site: "@fotolokashen", // Your Twitter handle if you have one
    creator: "@fotolokashen",
    title: `fotolokashen | ${tagline}`,
    description: "Save, organize, and manage your favorite locations for media production. With the best maps available google maps.",
    images: ["/og-image.png"], // Static image in public folder
  },

  // Additional metadata
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  // Favicon and app icons
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <SentryInit />
        <Providers>
          <GoogleMapsProvider>
            <LayoutWrapper>
              <Header />
              <main className="flex-1 overflow-hidden">{children}</main>
              <ConditionalFooter />
            </LayoutWrapper>
            <Toaster position="top-right" />
          </GoogleMapsProvider>
        </Providers>
        <SpeedInsights />
      </body>
    </html>
  );
}
