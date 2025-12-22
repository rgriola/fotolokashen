"use client";

import React, { createContext, useContext, ReactNode } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { PublicUser, AuthResponse } from "@/types/user";

interface AuthContextType {
    user: PublicUser | null;
    isLoading: boolean;
    isError: boolean;
    login: () => void;
    logout: () => Promise<void>;
    refetchUser: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function fetchCurrentUser(): Promise<PublicUser | null> {
    try {
        const response = await fetch("/api/auth/me", {
            credentials: "include",
        });

        if (!response.ok) {
            if (response.status === 401) {
                return null; // Not authenticated
            }
            throw new Error("Failed to fetch user");
        }

        const data: AuthResponse = await response.json();
        return data.user;
    } catch (error) {
        console.error("Error fetching current user:", error);
        return null;
    }
}

async function logoutUser(): Promise<void> {
    const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
    });

    if (!response.ok) {
        throw new Error("Logout failed");
    }
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const router = useRouter();
    const queryClient = useQueryClient();

    // Fetch current user
    const {
        data: user = null,
        isLoading,
        isError,
        refetch,
    } = useQuery({
        queryKey: ["currentUser"],
        queryFn: fetchCurrentUser,
        retry: false,
        staleTime: 0, // SECURITY FIX: Always check server, never use stale cached data
        gcTime: 0, // SECURITY FIX: Don't cache user data
        refetchOnMount: true, // Always refetch when component mounts
        refetchOnWindowFocus: true, // Refetch when window gains focus
    });

    // Logout mutation
    const logoutMutation = useMutation({
        mutationFn: logoutUser,
        onSuccess: () => {
            queryClient.setQueryData(["currentUser"], null);
            queryClient.clear(); // Clear all cached data
            queryClient.clear(); // Clear all cached data
            toast.success("Logged out successfully");
            router.push("/");
        },
        onError: () => {
            toast.error("Failed to logout");
        },
    });

    const login = () => {
        refetch();
    };

    const logout = async () => {
        await logoutMutation.mutateAsync();
    };

    const refetchUser = () => {
        refetch();
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                isLoading,
                isError,
                login,
                logout,
                refetchUser,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
