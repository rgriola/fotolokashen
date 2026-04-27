"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";

/**
 * Client-side hero CTA buttons — handles auth-dependent rendering.
 * This is extracted from the landing page so the rest of the hero
 * can be server-rendered for better LCP.
 */
export function HeroCTA() {
  const { user } = useAuth();
  const router = useRouter();

  // Redirect authenticated users to map page
  useEffect(() => {
    if (user) {
      router.push("/map");
    }
  }, [user, router]);

  if (user) {
    return (
      <Button size="lg" asChild className="bg-linear-to-r from-primary to-social hover:from-primary/90 hover:to-social text-white shadow-lg shadow-primary/50 max-w-50 w-full">
        <Link href="/map">
          <MapPin className="mr-2 h-5 w-5" />
          Open Map
        </Link>
      </Button>
    );
  }

  return (
    <>
      <Button size="lg" asChild className="bg-linear-to-r from-primary to-social hover:from-primary/90 hover:to-social text-white shadow-lg shadow-primary/50 max-w-45 w-full">
        <Link href="/register">Get Started</Link>
      </Button>
      <Button size="lg" variant="outline" asChild className="bg-white/10 backdrop-blur-sm text-white border-white/30 hover:bg-white/20 max-w-45 w-full">
        <Link href="/login">Sign In</Link>
      </Button>
    </>
  );
}

/**
 * Client-side CTA section — shown only for unauthenticated users.
 */
export function BottomCTA() {
  const { user } = useAuth();

  if (user) return null;

  return (
    <section className="bg-muted/50">
      <div className="px-4 md:px-6 lg:px-8 py-16 md:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
            Ready to Build Your Location Library?
          </h2>
          <p className="mb-8 text-lg text-muted-foreground">
            Join your crew on fotolokashen. Capture your first location in minutes &mdash; your team&apos;s institutional knowledge starts here.
          </p>
          <Button size="lg" asChild>
            <Link href="/register">Get Started Free</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
