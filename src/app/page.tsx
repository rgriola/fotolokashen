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
              Your Crew&apos;s Location Knowledge{" "}
            </h1>
            <p className="mb-8 text-lg sm:text-xl text-secondary text-center">
              Capture production locations in the field. Share your crew&apos;s firsthand knowledge — GPS, photos, notes, access points — so every team member knows exactly what worked.</p>
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
              Built for Production Crews
            </h2>
            <p className="text-lg text-muted-foreground">
              Turn every shoot into institutional knowledge your whole team can use
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader>
                <MapPin className="mb-2 h-10 w-10 text-primary" />
                <CardTitle>Interactive Map</CardTitle>
                <CardDescription>
                  See all your crew&apos;s locations at a glance. Discover what&apos;s nearby before you scout.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <Save className="mb-2 h-10 w-10 text-success" />
                <CardTitle>Production Notes</CardTitle>
                <CardDescription>
                  Log parking, access points, contacts, lighting conditions, and crew setup details — attached to the exact GPS pin.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <ImageIcon className="mb-2 h-10 w-10 text-social" />
                <CardTitle>Photo Documentation</CardTitle>
                <CardDescription>
                  Attach field photos with EXIF metadata preserved. Your team sees exactly what you saw.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <Lock className="mb-2 h-10 w-10 text-orange-600" />
                <CardTitle>Access Controls</CardTitle>
                <CardDescription>
                  Share locations with your whole crew, specific teammates, or keep them private to your account.
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
