'use client';

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, MapPin, LogIn, UserPlus, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";

export function UnauthMobileMenu() {
    const [open, setOpen] = useState(false);
    const pathname = usePathname();

    const handleLinkClick = () => {
        setOpen(false); // Close menu when link is clicked
    };

    return (
        // Floating Hamburger Button - Only visible on mobile when unauthenticated
        // Using high z-index to ensure it's above everything including hero section
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
                        <Link 
                            href="/" 
                            prefetch={false}
                            onClick={handleLinkClick}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-accent transition-colors relative",
                                pathname === "/" ? "text-primary font-medium" : "text-muted-foreground"
                            )}
                        >
                            <MapPin className="h-4 w-4" />
                            <span className="text-sm">Home</span>
                            {/* Active indicator - underline */}
                            {pathname === "/" && (
                                <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-primary rounded-full" />
                            )}
                        </Link>
                        
                        <div className="my-1 border-t" />
                        
                        {/* Auth Actions */}
                        <Link 
                            href="/login" 
                            prefetch={false}
                            onClick={handleLinkClick}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-accent transition-colors relative",
                                pathname === "/login" ? "text-primary font-medium" : "text-muted-foreground"
                            )}
                        >
                            <LogIn className="h-4 w-4" />
                            <span className="text-sm">Login</span>
                            {pathname === "/login" && (
                                <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-primary rounded-full" />
                            )}
                        </Link>
                        
                        <Link 
                            href="/register" 
                            prefetch={false}
                            onClick={handleLinkClick}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-md bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 transition-colors"
                        >
                            <UserPlus className="h-4 w-4" />
                            <span className="text-sm font-medium">Register</span>
                        </Link>
                        
                        <Link 
                            href="/forgot-password" 
                            prefetch={false}
                            onClick={handleLinkClick}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-accent transition-colors relative",
                                pathname === "/forgot-password" ? "text-primary font-medium" : "text-muted-foreground"
                            )}
                        >
                            <KeyRound className="h-4 w-4" />
                            <span className="text-sm">Forgot Password</span>
                            {pathname === "/forgot-password" && (
                                <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-primary rounded-full" />
                            )}
                        </Link>
                    </nav>
                </SheetContent>
            </Sheet>
        </div>
    );
}
