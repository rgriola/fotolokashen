import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { Providers } from "@/components/providers";
import { Header } from "@/components/layout/Header";
import { ConditionalFooter } from "@/components/layout/ConditionalFooter";
import { LayoutWrapper } from "@/components/layout/LayoutWrapper";
import { SpeedInsights } from "@vercel/speed-insights/next";
import Script from "next/script";


const tagline = "Production Location Intelligence";

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
  description: "The location intelligence platform for production crews. Capture locations in the field, annotate with production notes, and share your crew's collective knowledge — searchable on any device.",
  keywords: ["location scouting", "production planning", "media production", "film locations", "photography locations", "crew management", "location intelligence", "field production"],
  authors: [{ name: "fotolokashen" }],

  // Open Graph (Facebook, LinkedIn, Discord, etc.)
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://fotolokashen.com",
    siteName: "fotolokashen",
    title: `fotolokashen | ${tagline}`,
    description: "Your crew's location knowledge, always with you. Capture, annotate, and share production locations — so you never re-learn the same location twice.",
    images: [
      {
        url: "/og-image.png", // Static image in public folder
        width: 1200,
        height: 630,
        alt: "fotolokashen - Production Location Intelligence",
      },
    ],
  },

  // Twitter Card
  twitter: {
    card: "summary_large_image",
    site: "@fotolokashen", // Your Twitter handle if you have one
    creator: "@fotolokashen",
    title: `fotolokashen | ${tagline}`,
    description: "The location intelligence platform for production crews. Capture, annotate, and share your crew's location knowledge — searchable from any device.",
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
        <Providers>
          <LayoutWrapper>
            <Header />
            <main className="flex-1 overflow-hidden">{children}</main>
            <ConditionalFooter />
          </LayoutWrapper>
          <Toaster position="top-center" />
        </Providers>
        <SpeedInsights />
        {process.env.NODE_ENV !== 'production' && (
          <Script src="https://tweakcn.com/live-preview.min.js" strategy="lazyOnload" />
        )}
      </body>
    </html>
  );
}

