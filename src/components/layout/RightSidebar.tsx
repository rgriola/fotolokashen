"use client";

import { ReactNode } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

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
}

export function RightSidebar({
    isOpen,
    onClose,
    view,
    children,
    title,
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
                className={`fixed top-0 right-0 h-full bg-background border-l shadow-lg z-50 transition-transform duration-300 ease-in-out ${isOpen ? "translate-x-0" : "translate-x-full"
                    } w-full sm:w-[400px] lg:w-[450px]`}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b">
                    {title && <h2 className="text-lg font-semibold">{title}</h2>}
                    {!title && <div />}
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onClose}
                        className="shrink-0"
                    >
                        <X className="w-5 h-5" />
                    </Button>
                </div>

                {/* Content */}
                <div className="h-[calc(100%-4rem)] overflow-y-auto">{children}</div>
            </div>
        </>
    );
}
