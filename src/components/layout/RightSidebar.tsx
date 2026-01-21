"use client";

import { ReactNode } from "react";
import { X, Heart, Sun, Building, Camera, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type SidebarView =
    | "saved-locations"
    | "save-location"
    | "edit-location"
    | "profile"
    | "admin";

interface RightSidebarProps {
    isOpen: boolean;
    onClose: () => void;
    view: SidebarView;
    children: ReactNode;
    title?: string;
    isFavorite?: boolean;
    onFavoriteToggle?: () => void;
    showFavorite?: boolean;
    indoorOutdoor?: "indoor" | "outdoor";
    onIndoorOutdoorToggle?: (value: "indoor" | "outdoor") => void;
    showIndoorOutdoor?: boolean;
    showPhotoUpload?: boolean;
    onPhotoUploadToggle?: () => void;
    onSave?: () => void;
    isSaving?: boolean;
    showSaveButton?: boolean;
}

export function RightSidebar({
    isOpen,
    onClose,
    view,
    children,
    title,
    isFavorite = false,
    onFavoriteToggle,
    showFavorite = false,
    indoorOutdoor = "outdoor",
    onIndoorOutdoorToggle,
    showIndoorOutdoor = false,
    showPhotoUpload = false,
    onPhotoUploadToggle,
    onSave,
    isSaving = false,
    showSaveButton = false,
}: RightSidebarProps) {
    return (
        <>
            {/* Overlay for mobile */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={onClose}
                />
            )}

            {/* Sidebar */}
            <div
                className={`fixed top-16 right-0 h-[calc(100vh-4rem)] bg-background border-l shadow-lg z-50 transition-transform duration-300 ease-in-out ${isOpen ? "translate-x-0" : "translate-x-full"
                    } w-full sm:w-1/2`}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-3 border-b">
                    {title && <h2 className="text-lg font-semibold">{title}</h2>}
                    {!title && <div />}
                    <div className="flex items-center gap-1">
                        {/* Save Button */}
                        {showSaveButton && onSave && (
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={onSave}
                                disabled={isSaving}
                                className={cn(
                                    "shrink-0 hover:text-white disabled:cursor-not-allowed transition-all",
                                    isSaving 
                                        ? "bg-indigo-400 disabled:opacity-70" 
                                        : "bg-indigo-600 hover:bg-indigo-700"
                                )}
                                title={isSaving ? "Saving..." : "Save location"}
                            >
                                {isSaving ? (
                                    <Loader2 className="w-4 h-4 text-white animate-spin" />
                                ) : (
                                    <Save className="w-4 h-4 text-white" />
                                )}
                            </Button>
                        )}
                        {/* Camera Icon for Photo Upload */}
                        {showPhotoUpload && onPhotoUploadToggle && (
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={onPhotoUploadToggle}
                                className="shrink-0 bg-green-600 hover:bg-green-700 text-white hover:text-white"
                                title="Toggle photo upload"
                            >
                                <Camera className="w-4 h-4 text-white" />
                            </Button>
                        )}
                        {/* Indoor/Outdoor Toggle */}
                        {showIndoorOutdoor && onIndoorOutdoorToggle && (
                            <div className="flex items-center gap-0.5 mr-2">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => onIndoorOutdoorToggle("outdoor")}
                                    className="shrink-0"
                                    title="Outdoor"
                                >
                                    <Sun
                                        className={`w-5 h-5 transition-colors ${indoorOutdoor === "outdoor"
                                            ? "text-amber-500 fill-amber-500"
                                            : "text-muted-foreground"
                                            }`}
                                    />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => onIndoorOutdoorToggle("indoor")}
                                    className="shrink-0"
                                    title="Indoor"
                                >
                                    <Building
                                        className={`w-5 h-5 transition-colors ${indoorOutdoor === "indoor"
                                            ? "text-blue-600 stroke-[2.5]"
                                            : "text-muted-foreground"
                                            }`}
                                        fill={indoorOutdoor === "indoor" ? "#fbbf24" : "none"}
                                        fillOpacity={indoorOutdoor === "indoor" ? 0.2 : 0}
                                    />
                                </Button>
                            </div>
                        )}
                        {/* Favorite Heart Icon */}
                        {showFavorite && onFavoriteToggle && (
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={onFavoriteToggle}
                                className="shrink-0"
                                title={isFavorite ? "Remove from favorites" : "Add to favorites"}
                            >
                                <Heart
                                    className={`w-5 h-5 transition-colors ${isFavorite
                                        ? "fill-red-500 text-red-500"
                                        : "text-muted-foreground hover:text-red-500"
                                        }`}
                                />
                            </Button>
                        )}
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onClose}
                            className="shrink-0"
                        >
                            <X className="w-5 h-5" />
                        </Button>
                    </div>
                </div>

                {/* Content */}
                <div className="h-[calc(100%-4rem)] overflow-y-auto pb-safe">
                    {children}
                </div>
            </div>
        </>
    );
}
