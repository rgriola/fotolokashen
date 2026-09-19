"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MapPinIcon, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";

const navItems = [
  { href: "/", label: "Home", authRequired: false }, // Only show when NOT logged in
  { href: "/map", label: "Map", authRequired: true }, // Only show when logged in
  {
    href: "/locations",
    label: "My Spots",
    authRequired: true,
    icon: MapPinIcon,
  }, // Only show when logged in
  { href: "/search", label: "Friends", authRequired: true, icon: Users }, // Only show when logged in
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
      {visibleItems.map((item) => {
        const Icon = "icon" in item ? item.icon : null;
        return (
          <Link
            key={item.href}
            href={item.href}
            prefetch={false}
            className={cn(
              "text-sm font-medium transition-colors hover:text-primary relative inline-flex items-center gap-1.5",
              pathname === item.href
                ? "text-primary font-semibold"
                : "text-muted-foreground",
            )}
          >
            {Icon && <Icon className="w-4 h-4" />}
            {item.label}
            {/* Active indicator - underline */}
            {pathname === item.href && (
              <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-primary rounded-full" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
