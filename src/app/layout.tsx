import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { Providers } from "@/components/providers";
import { Header } from "@/components/layout/Header";
import { ConditionalFooter } from "@/components/layout/ConditionalFooter";
import { LayoutWrapper } from "@/components/layout/LayoutWrapper";
import { GoogleMapsProvider } from "@/lib/GoogleMapsProvider";
import { SentryInit } from "@/components/SentryInit";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Merkel Vision | Location Management",
  description: "Save, organize, and manage your favorite locations with Merkel Vision. Professional location scouting and management for media production.",
  keywords: ["location management", "location scouting", "media production", "film locations", "photography locations"],
  authors: [{ name: "Merkel Vision" }],
  
  // Open Graph (Facebook, LinkedIn, Discord, etc.)
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://merkelvision.com",
    siteName: "Merkel Vision",
    title: "Merkel Vision | Professional Location Management",
    description: "Save, organize, and manage your favorite locations. Professional location scouting and management for media production.",
    images: [
      {
        url: "/opengraph-image", // Next.js will auto-generate this
        width: 1200,
        height: 630,
        alt: "Merkel Vision - Location Management Platform",
      },
    ],
  },

  // Twitter Card
  twitter: {
    card: "summary_large_image",
    site: "@merkelvision", // Your Twitter handle if you have one
    creator: "@merkelvision",
    title: "Merkel Vision | Professional Location Management",
    description: "Save, organize, and manage your favorite locations for media production.",
    images: ["/opengraph-image"],
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
            <Toaster />
          </GoogleMapsProvider>
        </Providers>
      </body>
    </html>
  );
}
