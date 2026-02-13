"use client";

import { useRouter } from "next/navigation";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { CreateLocationWithPhoto } from "@/components/locations/CreateLocationWithPhoto";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Camera, Info, ArrowLeft } from "lucide-react";

function CreateWithPhotoPageInner() {
    const router = useRouter();

    return (
        <div className="min-h-screen bg-linear-to-b from-background to-muted/30">
            <div className="container max-w-2xl mx-auto py-6 sm:py-8 px-4">
                {/* Header */}
                <div className="mb-6">
                    <div className="flex items-center gap-3 mb-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="shrink-0"
                            onClick={() => router.back()}
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                        <div className="w-10 h-10 bg-linear-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-md">
                            <Camera className="w-5 h-5 text-white" />
                        </div>
                       
                        <div className="flex-1">
                            <h1 className="text-xl sm:text-2xl font-bold bg-linear-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                                Snap & Save
                            </h1>
                            <p className="text-xs sm:text-sm text-muted-foreground">
                                Upload a photo to create a location
                            </p>
                        </div>
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button variant="outline" size="icon">
                                    <Info className="w-4 h-4" />
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-md">
                                <DialogHeader>
                                    <DialogTitle className="flex items-center gap-2">
                                        <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                                            <span className="text-lg">💡</span>
                                        </div>
                                        How it works
                                    </DialogTitle>
                                    <DialogDescription className="sr-only">
                                        Step-by-step guide for creating a location from a photo
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                    <ol className="list-decimal list-inside space-y-2 text-sm text-foreground">
                                        <li>Upload a photo (we'll extract GPS if available)</li>
                                        <li>If no GPS, select the location on the map</li>
                                        <li>Add location details (name, type, notes)</li>
                                        <li>Save to create your location with the photo</li>
                                    </ol>
                                    <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                                        <p className="text-xs text-blue-700 dark:text-blue-300">
                                            <strong>Note:</strong> Photos with GPS metadata make location creation faster. If your photo doesn't have GPS, you can easily select the location manually.
                                        </p>
                                    </div>
                                    <div className="p-3 bg-orange-50 dark:bg-orange-950 rounded-lg border border-orange-200 dark:border-orange-800">
                                        <p className="text-sm font-semibold text-orange-900 dark:text-orange-100 mb-2 flex items-center gap-1">
                                            💡 Snap & Save Tip
                                        </p>
                                        <p className="text-xs text-orange-700 dark:text-orange-300 mb-2">
                                            <strong>On Mobile Use:</strong> Safari or Firefox<br />
                                            Or download the app.
                                        </p>
                                        <p className="text-xs text-orange-600 dark:text-orange-400">
                                            Chrome on mobile devices doesn't reliably support GPS extraction from photos. Safari and Firefox work best for camera photo uploads with GPS data.
                                        </p>
                                    </div>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>

                {/* Single-Page Form Component */}
                <CreateLocationWithPhoto onSuccess={() => router.push('/locations')} />
            </div>
        </div>
    );
}

export default function CreateWithPhotoPage() {
    return (
        <ProtectedRoute>
            <CreateWithPhotoPageInner />
        </ProtectedRoute>
    );
}
