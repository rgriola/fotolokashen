"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, LogOut, Shield, FolderKanban } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getOptimizedAvatarUrl } from "@/lib/imagekit";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function AuthButton() {
    const { user, isLoading, logout } = useAuth();
    const router = useRouter();
    const [avatarError, setAvatarError] = useState(false);

    if (isLoading) {
        return (
            <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
            </div>
        );
    }

    if (!user) {
        return (
            <div className="hidden md:flex items-center gap-3">
                <Button variant="ghost" asChild className="min-w-[90px]">
                    <Link href="/login">Login</Link>
                </Button>
                <Button asChild className="min-w-[100px]">
                    <Link href="/register">Register</Link>
                </Button>
            </div>
        );
    }

    const initials = user.username
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                        {user.avatar && !avatarError ? (
                            <AvatarImage
                                src={getOptimizedAvatarUrl(user.avatar, 32) || user.avatar}
                                alt={user.username}
                                onError={() => setAvatarError(true)}
                            />
                        ) : null}
                        <AvatarFallback>{initials}</AvatarFallback>
                    </Avatar>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{user.username}</p>
                        <p className="text-xs leading-none text-muted-foreground">
                            {user.email}
                        </p>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push("/profile")}>
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/projects")}>
                    <FolderKanban className="mr-2 h-4 w-4" />
                    <span>My Projects</span>
                </DropdownMenuItem>
                {user.isAdmin && (
                    <DropdownMenuItem onClick={() => router.push("/admin/users")}>
                        <Shield className="mr-2 h-4 w-4" />
                        <span>Admin</span>
                    </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => logout()}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
