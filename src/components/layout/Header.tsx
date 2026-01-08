'use client';

import Link from "next/link";
import { MapPin } from "lucide-react";
import { Navigation } from "./Navigation";
import { AuthButton } from "./AuthButton";
import { MobileMenu } from "./MobileMenu";
import { UnauthMobileMenu } from "./UnauthMobileMenu";
import { useAuth } from "@/lib/auth-context";
import { ReactNode } from "react";

interface HeaderProps {
    centerContent?: ReactNode;
}

export function Header({ centerContent }: HeaderProps = {}) {
    const { user } = useAuth();

    // Authenticated users go to map, unauthenticated to home
    const homeLink = user ? "/map" : "/";

    return (
        <>
            <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="flex h-16 items-center px-4 md:px-6 lg:px-8 max-w-7xl mx-auto justify-between gap-4">
                    {/* Left side - Logo */}
                    <div className="flex items-center gap-3 flex-shrink-0">
                        <Link href={homeLink} className="flex items-center gap-2">
                            <MapPin className="h-6 w-6 text-primary" />
                            <span className="font-bold text-lg">
                                fotolokashen
                            </span>
                        </Link>
                    </div>

                    {/* Center - Optional content (e.g., search bar on map page) */}
                    {centerContent && (
                        <div className="hidden lg:flex flex-1 max-w-2xl">
                            {centerContent}
                        </div>
                    )}

                    {/* Right side - Navigation and Auth */}
                    <div className="flex items-center gap-6 flex-shrink-0">
                        <Navigation />
                        <AuthButton />
                    </div>
                </div>
            </header>

            {/* Floating Hamburger for Mobile Users - Outside header */}
            {user ? <MobileMenu /> : <UnauthMobileMenu />}
        </>
    );
}
