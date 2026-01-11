"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MapPin, Save, Image as ImageIcon, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/auth-context";

export default function Home() {
  const { user } = useAuth();
  const router = useRouter();

  // Redirect authenticated users to map page
  useEffect(() => {
    if (user) {
      router.push("/map");
    }
  }, [user, router]);

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden h-screen flex flex-col">
        {/* Background Image Layer */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-90"
          style={{ backgroundImage: 'url(/images/landing/hero/hero-background.jpg)' }}
        />
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/80 via-purple-900/80 to-indigo-900/80" />

        {/* Content - 100px from top */}
        <div className="relative z-10 w-full px-4 md:px-6 lg:px-8 pt-[100px]">
          <div className="mx-auto max-w-3xl text-center w-full">
            <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-6xl text-white">
              Coordinate with Purpose{" "}
            </h1>
            <p className="mb-8 text-lg sm:text-xl text-gray-200">
            Use Fotolokashen with Google Maps to orginize your Photos, Locations, Projects, and Teams.</p>
            {/* Buttons - Reduced width by ~50% */}
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center items-center">
              {user ? (
                <Button size="lg" asChild className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg shadow-blue-500/50 max-w-[200px] w-full">
                  <Link href="/map">
                    <MapPin className="mr-2 h-5 w-5" />
                    Open Map
                  </Link>
                </Button>
              ) : (
                <>
                  <Button size="lg" asChild className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg shadow-blue-500/50 max-w-[180px] w-full">
                    <Link href="/register">Get Started</Link>
                  </Button>
                  <Button size="lg" variant="outline" asChild className="bg-white/10 backdrop-blur-sm text-white border-white/30 hover:bg-white/20 max-w-[180px] w-full">
                    <Link href="/login">Sign In</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Animated Gradient Blur Effects */}
        <div className="absolute -top-24 right-0 h-96 w-96 rounded-full bg-blue-400/20 blur-3xl animate-pulse" />
        <div className="absolute bottom-0 left-0 h-96 w-96 rounded-full bg-purple-400/20 blur-3xl animate-pulse" />
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
                <MapPin className="mb-2 h-10 w-10 text-blue-600" />
                <CardTitle>Google Maps Integration</CardTitle>
                <CardDescription>
                  Search and discover locations using Google Maps Places API
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <Save className="mb-2 h-10 w-10 text-green-600" />
                <CardTitle>Save Locations</CardTitle>
                <CardDescription>
                  Save your favorite places with custom captions and notes
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <ImageIcon className="mb-2 h-10 w-10 text-purple-600" />
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

      {/* CTA Section */}
      {!user && (
        <section className="bg-muted/50">
          <div className="px-4 md:px-6 lg:px-8 py-16 md:py-24">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
                Ready to Get Started?
              </h2>
              <p className="mb-8 text-lg text-muted-foreground">
                Create your free account today and start organizing your favorite locations.
              </p>
              <Button size="lg" asChild>
                <Link href="/register">Create Free Account</Link>
              </Button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
