"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";

const navItems = [
    { href: "/", label: "Home", authRequired: false }, // Only show when NOT logged in
    { href: "/map", label: "Map", authRequired: true }, // Only show when logged in
    { href: "/locations", label: "My Locations", authRequired: true }, // Only show when logged in
    { href: "/search", label: "People", authRequired: true }, // Only show when logged in
];

export function Navigation() {
    const pathname = usePathname();
    const { user } = useAuth();

    // Filter nav items based on auth status
    const visibleItems = navItems.filter((item) => {
        if (item.authRequired) {
            return !!user; // Show only if user is authenticated
        } else {
            return !user; // Show only if user is NOT authenticated
        }
    });

    return (
        <nav className="hidden md:flex items-center gap-6">
            {visibleItems.map((item) => (
                <Link
                    key={item.href}
                    href={item.href}
                    prefetch={false}
                    className={cn(
                        "text-sm font-medium transition-colors hover:text-primary relative",
                        pathname === item.href
                            ? "text-primary font-semibold"
                            : "text-muted-foreground"
                    )}
                >
                    {item.label}
                    {/* Active indicator - underline */}
                    {pathname === item.href && (
                        <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-primary rounded-full" />
                    )}
                </Link>
            ))}
        </nav>
    );
}
