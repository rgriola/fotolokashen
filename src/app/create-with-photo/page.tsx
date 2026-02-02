"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { PhotoUploadWithGPS } from "@/components/photos/PhotoUploadWithGPS";
import { PhotoLocationForm } from "@/components/locations/PhotoLocationForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ArrowLeft, Camera, MapPin, Info } from "lucide-react";
import type { PhotoMetadata } from "@/lib/photo-utils";

function CreateWithPhotoPageInner() {
    const router = useRouter();
    const [step, setStep] = useState<'upload' | 'location'>('upload');
    const [photoData, setPhotoData] = useState<{
        file: File;
        preview: string;
        gpsData: PhotoMetadata;
        addressData?: Record<string, unknown>;
    } | null>(null);

    // Generate stable placeId once on mount
    // eslint-disable-next-line react-hooks/purity
    const fallbackPlaceIdRef = useRef(`photo-${Date.now()}`);

    const handlePhotoProcessed = (data: {
        file: File;
        preview: string;
        gpsData: PhotoMetadata;
        addressData?: Record<string, unknown>;
    }) => {
        setPhotoData(data);
        setStep('location');
    };

    const handleLocationSaved = () => {
        // Success! Navigate to locations page
        router.push('/locations');
    };

    const handleBack = () => {
        if (step === 'location') {
            setStep('upload');
            setPhotoData(null);
        } else {
            router.push('/map');
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
            <div className="container max-w-4xl mx-auto py-6 sm:py-8 px-4">
                {/* Header */}
                <div className="mb-4 sm:mb-6">
                    <div className="flex items-center justify-between mb-3">
                        <Button
                            variant="ghost"
                            onClick={handleBack}
                            className="-ml-2 hover:bg-muted"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            {step === 'upload' ? 'Back to Map' : 'Back to Upload'}
                        </Button>

                        <Dialog>
                            <DialogTrigger asChild>
                                <Button variant="outline" size="sm" className="gap-2">
                                    <Info className="w-4 h-4" />
                                    <span className="hidden sm:inline">How it works</span>
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
                                        <li>Upload a photo with GPS EXIF data</li>
                                        <li>We automatically extract the GPS coordinates</li>
                                        <li>Preview the location and add details</li>
                                        <li>Save to your locations with the photo attached</li>
                                    </ol>
                                    <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                                        <p className="text-xs text-blue-700 dark:text-blue-300">
                                            <strong>Note:</strong> If your photo doesn't have GPS data, you'll need to select the location manually on the map.
                                        </p>
                                    </div>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>

                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-md">
                            <Camera className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                            <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                                Snap & Save
                            </h1>
                            <p className="text-xs sm:text-sm text-muted-foreground">
                                {step === 'upload'
                                    ? 'Upload a photo with GPS data to get started'
                                    : 'Review and complete location details'}
                            </p>
                        </div>
                    </div>

                    {/* Progress Steps */}
                    <div className="flex items-center gap-3 sm:gap-4">
                        <div className={`flex items-center gap-2 transition-colors ${step === 'upload' ? 'text-primary' : 'text-green-600'}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm shadow-md transition-all ${step === 'upload' ? 'bg-primary text-white scale-110' : 'bg-green-600 text-white'}`}>
                                {step === 'location' ? '✓' : '1'}
                            </div>
                            <span className="text-xs sm:text-sm font-medium hidden sm:inline">Upload Photo</span>
                        </div>
                        <div className="flex-1 h-1 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 rounded-full relative overflow-hidden">
                            {step === 'location' && (
                                <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-600 animate-in slide-in-from-left duration-500" />
                            )}
                        </div>
                        <div className={`flex items-center gap-2 transition-colors ${step === 'location' ? 'text-primary' : 'text-muted-foreground'}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm shadow-md transition-all ${step === 'location' ? 'bg-primary text-white scale-110' : 'bg-gray-200 dark:bg-gray-800'}`}>
                                2
                            </div>
                            <span className="text-xs sm:text-sm font-medium hidden sm:inline">Location Details</span>
                        </div>
                    </div>
                </div>

            {/* Content */}
            {step === 'upload' && (
                <PhotoUploadWithGPS
                    onPhotoProcessed={handlePhotoProcessed}
                    onCancel={() => router.push('/map')}
                />
            )}

            {step === 'location' && photoData && (
                <div className="space-y-6">
                    {/* Photo Summary */}
                    <Card className="border-2 hover:border-green-200 dark:hover:border-green-800 transition-colors">
                        <CardHeader className="pb-4">
                            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                                <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                                    <Camera className="w-4 h-4 text-green-600 dark:text-green-400" />
                                </div>
                                Photo Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="grid md:grid-cols-2 gap-6">
                            <div className="relative w-full h-48 sm:h-64 md:h-56 rounded-xl overflow-hidden shadow-md border border-gray-200 dark:border-gray-800">
                                <Image
                                    src={photoData.preview}
                                    alt="Location photo"
                                    fill
                                    className="object-cover"
                                />
                            </div>
                            <div className="space-y-4">
                                {photoData.gpsData.hasGPS && (
                                    <>
                                        <div className="p-3 bg-green-50 dark:bg-green-950/50 rounded-lg border border-green-200 dark:border-green-800">
                                            <p className="text-sm font-semibold flex items-center gap-2 text-green-900 dark:text-green-100 mb-1">
                                                <MapPin className="w-4 h-4 text-green-600 dark:text-green-400" />
                                                GPS Coordinates
                                            </p>
                                            <p className="text-sm text-green-700 dark:text-green-300 font-mono">
                                                {photoData.gpsData.lat.toFixed(6)}, {photoData.gpsData.lng.toFixed(6)}
                                            </p>
                                        </div>
                                        {photoData.addressData && (
                                            <div className="p-3 bg-muted/50 rounded-lg border">
                                                <p className="text-sm font-semibold mb-1">Address</p>
                                                <p className="text-sm text-muted-foreground">
                                                    {photoData.addressData.address as string}
                                                </p>
                                            </div>
                                        )}
                                    </>
                                )}
                                {photoData.gpsData.dateTaken && (
                                    <div className="p-3 bg-muted/50 rounded-lg border">
                                        <p className="text-sm font-semibold mb-1">Photo Taken</p>
                                        <p className="text-sm text-muted-foreground">
                                            {photoData.gpsData.dateTaken.toLocaleString()}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Location Form */}
                    <Card className="border-2">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-lg sm:text-xl">Location Details</CardTitle>
                            <CardDescription className="text-sm">
                                Complete the information below to save this location
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <PhotoLocationForm
                                initialData={{
                                    placeId: (photoData.addressData?.placeId as string) || fallbackPlaceIdRef.current,
                                    name: (photoData.addressData?.name as string) || 'Photo Location',
                                    address: photoData.addressData?.address as string,
                                    lat: photoData.gpsData.lat,
                                    lng: photoData.gpsData.lng,
                                    street: photoData.addressData?.street as string,
                                    number: photoData.addressData?.number as string,
                                    city: photoData.addressData?.city as string,
                                    state: photoData.addressData?.state as string,
                                    zipcode: photoData.addressData?.zipcode as string,
                                }}
                                photoMetadata={photoData.gpsData}
                                photoFile={photoData.file}
                                onSuccess={handleLocationSaved}
                                onCancel={() => setStep('upload')}
                            />
                        </CardContent>
                    </Card>
                </div>
            )}

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
