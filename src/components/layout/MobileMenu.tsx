"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";

const navItems = [
    { href: "/", label: "Home" },
    { href: "/map", label: "Map" },
    { href: "/my-locations", label: "My Locations" },
];

export function MobileMenu() {
    const [open, setOpen] = useState(false);
    const pathname = usePathname();
    const { user, logout } = useAuth();

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Toggle menu</span>
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] sm:w-[400px]">
                <SheetHeader>
                    <SheetTitle>Menu</SheetTitle>
                </SheetHeader>
                <div className="mt-6 flex flex-col gap-4">
                    <nav className="flex flex-col gap-2">
                        {navItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setOpen(false)}
                                className={cn(
                                    "px-3 py-2 rounded-md text-sm font-medium transition-colors",
                                    pathname === item.href
                                        ? "bg-primary text-primary-foreground"
                                        : "hover:bg-muted"
                                )}
                            >
                                {item.label}
                            </Link>
                        ))}
                    </nav>
                    <Separator />
                    {user ? (
                        <div className="flex flex-col gap-2">
                            <div className="px-3 py-2">
                                <p className="text-sm font-medium">{user.username}</p>
                                <p className="text-xs text-muted-foreground">{user.email}</p>
                            </div>
                            <Button
                                variant="ghost"
                                className="justify-start"
                                asChild
                                onClick={() => setOpen(false)}
                            >
                                <Link href="/profile">Profile</Link>
                            </Button>
                            <Button
                                variant="ghost"
                                className="justify-start"
                                onClick={() => {
                                    setOpen(false);
                                    logout();
                                }}
                            >
                                Log out
                            </Button>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-2">
                            <Button asChild onClick={() => setOpen(false)}>
                                <Link href="/login">Login</Link>
                            </Button>
                            <Button variant="outline" asChild onClick={() => setOpen(false)}>
                                <Link href="/register">Register</Link>
                            </Button>
                        </div>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
}
