"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, MapPin, User, LogOut, Home, Map, FolderKanban } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";

const navItems = [
    { href: "/", label: "Home", icon: Home, authRequired: false },
    { href: "/map", label: "Map", icon: Map, authRequired: true },
    { href: "/locations", label: "My Locations", icon: MapPin, authRequired: true },
    { href: "/projects", label: "My Projects", icon: FolderKanban, authRequired: true },
];

export function MobileMenu() {
    const [open, setOpen] = useState(false);
    const pathname = usePathname();
    const { user, logout } = useAuth();

    const handleLinkClick = () => {
        setOpen(false); // Close menu when link is clicked
    };

    // Filter nav items based on auth status (same as desktop navigation)
    const visibleItems = navItems.filter((item) => {
        if (item.authRequired) {
            return !!user; // Show only if user is authenticated
        } else {
            return !user; // Show only if user is NOT authenticated
        }
    });

    return (
        // Floating Hamburger Button - Only visible on mobile
        // Using high z-index to ensure it's above everything
        <div className="md:hidden fixed bottom-6 right-6 z-[100]">
            <Sheet open={open} onOpenChange={setOpen}>
                <SheetTrigger asChild>
                    <Button 
                        variant="default" 
                        size="icon"
                        className="h-14 w-14 rounded-full shadow-2xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                        aria-label="Open menu"
                    >
                        <Menu className="h-6 w-6 text-white" />
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[280px] sm:w-[320px]">
                    <SheetHeader className="mb-4">
                        <SheetTitle className="flex items-center gap-2 text-base">
                            <MapPin className="h-5 w-5 text-primary" />
                            Merkel Vision
                        </SheetTitle>
                    </SheetHeader>
                    
                    <nav className="flex flex-col gap-1">
                        {/* Navigation Links */}
                        {visibleItems.map((item) => {
                            const Icon = item.icon;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={handleLinkClick}
                                    className={cn(
                                        "flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-accent transition-colors relative",
                                        pathname === item.href ? "text-primary font-medium" : "text-muted-foreground"
                                    )}
                                >
                                    <Icon className="h-4 w-4" />
                                    <span className="text-sm">{item.label}</span>
                                    {/* Active indicator - underline */}
                                    {pathname === item.href && (
                                        <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-primary rounded-full" />
                                    )}
                                </Link>
                            );
                        })}
                        
                        <div className="my-1 border-t" />
                        
                        {/* User Section */}
                        {user ? (
                            <>
                                {/* Profile Link */}
                                <Link
                                    href="/profile"
                                    onClick={handleLinkClick}
                                    className={cn(
                                        "flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-accent transition-colors relative",
                                        pathname === "/profile" ? "text-primary font-medium" : "text-muted-foreground"
                                    )}
                                >
                                    <User className="h-4 w-4" />
                                    <span className="text-sm">Profile</span>
                                    {pathname === "/profile" && (
                                        <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-primary rounded-full" />
                                    )}
                                </Link>
                                
                                {/* Logout Button */}
                                <button
                                    onClick={() => {
                                        handleLinkClick();
                                        logout();
                                    }}
                                    className="flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-accent transition-colors text-muted-foreground text-left w-full"
                                >
                                    <LogOut className="h-4 w-4" />
                                    <span className="text-sm">Log out</span>
                                </button>
                                
                                {/* User Info Footer */}
                                <div className="mt-4 px-3 py-2 bg-muted/50 rounded-md">
                                    <p className="text-xs font-medium truncate">{user.username}</p>
                                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                                </div>
                            </>
                        ) : null}
                    </nav>
                </SheetContent>
            </Sheet>
        </div>
    );
}
