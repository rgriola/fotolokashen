"use client";

import { MapPin, List, User, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

interface LeftIconSidebarProps {
    onGPSClick: () => void;
    onSavedLocationsClick: () => void;
    onProfileClick: () => void;
    onAdminClick?: () => void;
    showAdmin?: boolean;
    activePage?: string;
}

export function LeftIconSidebar({
    onGPSClick,
    onSavedLocationsClick,
    onProfileClick,
    onAdminClick,
    showAdmin = false,
    activePage,
}: LeftIconSidebarProps) {
    return (
        <div className="fixed left-4 top-1/2 -translate-y-1/2 z-40 flex flex-col gap-2 bg-background/90 backdrop-blur-sm border rounded-lg p-2 shadow-lg">
            <TooltipProvider>
                {/* Logo */}
                <div className="flex items-center justify-center h-12 text-lg font-bold text-primary mb-2">
                    MERK
                </div>

                <div className="h-px bg-border my-1" />

                {/* GPS / Center Location */}
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onGPSClick}
                            className="hover:bg-primary/10"
                        >
                            <MapPin className="w-5 h-5" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                        <p>Center on my location</p>
                    </TooltipContent>
                </Tooltip>

                {/* Saved Locations */}
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onSavedLocationsClick}
                            className={`hover:bg-primary/10 ${activePage === "saved-locations" ? "bg-primary/20" : ""
                                }`}
                        >
                            <List className="w-5 h-5" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                        <p>Saved Locations</p>
                    </TooltipContent>
                </Tooltip>

                {/* Profile */}
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onProfileClick}
                            className={`hover:bg-primary/10 ${activePage === "profile" ? "bg-primary/20" : ""
                                }`}
                        >
                            <User className="w-5 h-5" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                        <p>Profile</p>
                    </TooltipContent>
                </Tooltip>

                {/* Admin (conditional) */}
                {showAdmin && onAdminClick && (
                    <>
                        <div className="h-px bg-border my-1" />
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={onAdminClick}
                                    className={`hover:bg-destructive/10 ${activePage === "admin" ? "bg-destructive/20" : ""
                                        }`}
                                >
                                    <Settings className="w-5 h-5" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="right">
                                <p>Admin Panel</p>
                            </TooltipContent>
                        </Tooltip>
                    </>
                )}
            </TooltipProvider>
        </div>
    );
}
