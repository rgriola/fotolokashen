'use client';

import Link from "next/link";
import { MapPin } from "lucide-react";
import { Navigation } from "./Navigation";
import { AuthButton } from "./AuthButton";
import { MobileMenu } from "./MobileMenu";
import { useAuth } from "@/lib/auth-context";

export function Header() {
    const { user } = useAuth();

    // Authenticated users go to map, unauthenticated to home
    const homeLink = user ? "/map" : "/";

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-16 items-center">
                <MobileMenu />
                <div className="mr-4 flex items-center gap-2">
                    <Link href={homeLink} className="flex items-center gap-2">
                        <MapPin className="h-6 w-6 text-primary" />
                        <span className="font-bold text-lg hidden sm:inline-block">
                            Google Search Me
                        </span>
                    </Link>
                </div>
                <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
                    <Navigation />
                    <AuthButton />
                </div>
            </div>
        </header>
    );
}
