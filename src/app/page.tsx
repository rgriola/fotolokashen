import Image from "next/image";
import { MapPin, Save, Image as ImageIcon, Lock } from "lucide-react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { HeroCTA, BottomCTA } from "@/components/landing/HeroCTA";

/**
 * Landing page — Server Component for fast LCP.
 * 
 * The hero image, heading, and description are server-rendered (visible
 * in the initial HTML). Only the CTA buttons and auth-dependent redirect
 * are client-side (HeroCTA, BottomCTA).
 */
export default function Home() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden h-screen flex flex-col">
        {/* Background Image Layer */}
        <div className="absolute inset-0 opacity-90">
          <Image
            src="/images/landing/hero/hero-background.jpg"
            alt="Hero background"
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
        </div>
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-linear-to-br from-primary/80 via-social/80 to-primary/80" />

        {/* Content - 100px from top */}
        <div className="relative z-10 w-full px-4 md:px-6 lg:px-8 pt-24">
          <div className="mx-auto max-w-3xl text-center w-full">
            {/* Logo */}
            <div className="mb-6 flex justify-center">
              <Image
                src="/logo.png"
                alt="fotolokashen"
                width={1200}
                height={196}
                className="w-auto"
                priority
              />
            </div>
            <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-6xl text-white">
              Coordinate with Purpose{" "}
            </h1>
            <p className="mb-8 text-lg sm:text-xl text-muted-foreground text-center">
              Use Fotolokashen with Google Maps to organize your Photos, Locations, Projects, and Teams.</p>
            {/* Buttons — client component for auth state */}
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center items-center">
              <HeroCTA />
            </div>
          </div>
        </div>

        {/* Animated Gradient Blur Effects */}
        <div className="absolute -top-24 right-0 h-96 w-96 rounded-full bg-primary/20 blur-3xl animate-pulse" />
        <div className="absolute bottom-0 left-0 h-96 w-96 rounded-full bg-social/20 blur-3xl animate-pulse" />
      </section>

      {/* Features Section */}
      <section className="px-4 md:px-6 lg:px-8 py-6 -mt-[calc(100vh-25px)]">
        <div className="mx-auto max-w-5xl">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
              Everything You Need
            </h2>
            <p className="text-lg text-muted-foreground">
              Purposeful locations for your crew
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader>
                <MapPin className="mb-2 h-10 w-10 text-primary" />
                <CardTitle>Google Maps Integration</CardTitle>
                <CardDescription>
                  Search and discover locations using Google Maps Places API
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <Save className="mb-2 h-10 w-10 text-success" />
                <CardTitle>Save Locations</CardTitle>
                <CardDescription>
                  Save your favorite places with custom captions and notes
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <ImageIcon className="mb-2 h-10 w-10 text-social" />
                <CardTitle>Photo Uploads</CardTitle>
                <CardDescription>
                  Add photos to your saved locations using ImageKit
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <Lock className="mb-2 h-10 w-10 text-orange-600" />
                <CardTitle>Secure & Private</CardTitle>
                <CardDescription>
                  Your data is protected with industry-standard security
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section — client component for auth state */}
      <BottomCTA />
    </div>
  );
}
