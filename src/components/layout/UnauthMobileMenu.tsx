'use client';

import Link from "next/link";
import { Menu, MapPin, LogIn, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";

export function UnauthMobileMenu() {
    return (
        // Floating Hamburger Button - Only visible on mobile when unauthenticated
        // Using high z-index to ensure it's above everything including hero section
        <div className="md:hidden fixed bottom-6 right-6 z-[100]">
            <Sheet>
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
                <SheetContent side="left" className="w-[300px] sm:w-[400px]">
                    <SheetHeader>
                        <SheetTitle className="flex items-center gap-2">
                            <MapPin className="h-5 w-5 text-primary" />
                            Merkel Vision
                        </SheetTitle>
                    </SheetHeader>
                    <div className="flex flex-col gap-4 mt-8">
                        {/* Navigation Links */}
                        <Link 
                            href="/" 
                            className="flex items-center gap-3 p-4 rounded-lg hover:bg-accent transition-colors"
                        >
                            <MapPin className="h-5 w-5 text-blue-600" />
                            <span className="font-medium">Home</span>
                        </Link>
                        
                        <div className="my-2 border-t" />
                        
                        {/* Auth Actions */}
                        <Link 
                            href="/login" 
                            className="flex items-center gap-3 p-4 rounded-lg hover:bg-accent transition-colors"
                        >
                            <LogIn className="h-5 w-5 text-green-600" />
                            <span className="font-medium">Login</span>
                        </Link>
                        
                        <Link 
                            href="/register" 
                            className="flex items-center gap-3 p-4 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 transition-colors"
                        >
                            <UserPlus className="h-5 w-5" />
                            <span className="font-medium">Get Started</span>
                        </Link>
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    );
}
