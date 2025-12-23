import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { Providers } from "@/components/providers";
import { Header } from "@/components/layout/Header";
import { ConditionalFooter } from "@/components/layout/ConditionalFooter";
import { LayoutWrapper } from "@/components/layout/LayoutWrapper";
import { GoogleMapsProvider } from "@/lib/GoogleMapsProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Google Maps Search",
  description: "Save and manage your favorite Google Maps locations",
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
