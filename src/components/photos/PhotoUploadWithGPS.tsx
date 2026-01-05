"use client";

import { useState, useCallback, useEffect } from "react";
import { Upload, Camera, MapPin, Calendar, X, AlertCircle, CheckCircle, Info } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { extractPhotoGPS, reverseGeocodeGPS, formatGPSCoordinates } from "@/lib/photo-utils";
import type { PhotoMetadata } from "@/lib/photo-utils";
import { isChrome, isSafari, supportsGeolocationFallback } from "@/lib/browser-utils";
import Image from "next/image";

interface PhotoUploadWithGPSProps {
    onPhotoProcessed: (photoData: {
        file: File;
        preview: string;
        gpsData: PhotoMetadata;
        addressData?: {
            address: string;
            name: string;
            street?: string;
            number?: string;
            city?: string;
            state?: string;
            zipcode?: string;
            placeId?: string;
        };
    }) => void;
    onCancel?: () => void;
}

export function PhotoUploadWithGPS({ onPhotoProcessed, onCancel }: PhotoUploadWithGPSProps) {
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isRequestingLocation, setIsRequestingLocation] = useState(false);
    const [gpsData, setGpsData] = useState<PhotoMetadata | null>(null);
    const [gpsSource, setGpsSource] = useState<'exif' | 'device' | null>(null);
    const [addressData, setAddressData] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [showChromeHint, setShowChromeHint] = useState(false);
    const [browserSupportsGeo, setBrowserSupportsGeo] = useState(true);

    // Detect browser on mount
    useEffect(() => {
        setBrowserSupportsGeo(supportsGeolocationFallback());
        setShowChromeHint(isChrome());
    }, []);

    /**
     * Request device location via Geolocation API
     * Only called on Safari - Chrome hangs on this
     */
    const requestDeviceLocation = useCallback(async (): Promise<{ lat: number; lng: number } | null> => {
        // Safety check: Only run on Safari
        if (!browserSupportsGeo) {
            console.log('📍 Geolocation fallback not supported on this browser');
            return null;
        }

        return new Promise((resolve) => {
            if (!navigator.geolocation) {
                console.warn('📍 Geolocation not supported');
                resolve(null);
                return;
            }

            console.log('📍 [Safari] Requesting device location...');
            setIsRequestingLocation(true);

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setIsRequestingLocation(false);
                    const location = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                    };
                    console.log('✅ Device location obtained:', location);
                    resolve(location);
                },
                (error) => {
                    setIsRequestingLocation(false);
                    console.error('❌ Geolocation error:', error.message);
                    resolve(null);
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0,
                }
            );
        });
    }, [browserSupportsGeo]);

    const handleFileSelect = useCallback(async (selectedFile: File) => {
        // Validate file type
        if (!selectedFile.type.startsWith('image/')) {
            setError('Please select an image file');
            return;
        }

        // Validate file size (max 10MB)
        if (selectedFile.size > 10 * 1024 * 1024) {
            setError('File size must be less than 10MB');
            return;
        }

        setFile(selectedFile);
        setError(null);
        setGpsSource(null);

        // Create preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setPreview(reader.result as string);
        };
        reader.readAsDataURL(selectedFile);

        // Extract GPS data
        setIsProcessing(true);
        try {
            const metadata = await extractPhotoGPS(selectedFile);

            // If GPS found, use it
            if (metadata.hasGPS && metadata.lat && metadata.lng) {
                console.log('✅ Using GPS from photo EXIF');
                setGpsData(metadata);
                setGpsSource('exif');
                setIsProcessing(false);

                const address = await reverseGeocodeGPS(metadata.lat, metadata.lng);
                setAddressData(address);
            } else {
                // No GPS in EXIF - try device location (Safari only)
                console.log('⚠️ No GPS in photo EXIF');
                setIsProcessing(false);

                if (browserSupportsGeo) {
                    // Safari: Request device location
                    console.log('📍 [Safari] Requesting device location fallback...');
                    const deviceLocation = await requestDeviceLocation();

                    if (deviceLocation) {
                        console.log('✅ Using device location');
                        setGpsData({
                            ...metadata,
                            lat: deviceLocation.lat,
                            lng: deviceLocation.lng,
                            hasGPS: true,
                        });
                        setGpsSource('device');

                        const address = await reverseGeocodeGPS(deviceLocation.lat, deviceLocation.lng);
                        setAddressData(address);
                    } else {
                        // Device location failed
                        setGpsData(metadata); // hasGPS: false
                    }
                } else {
                    // Chrome: Skip geolocation, just set no GPS
                    console.log('ℹ️ [Chrome] Geolocation fallback skipped (not supported)');
                    setGpsData(metadata); // hasGPS: false
                }
            }
        } catch (err) {
            console.error('Error processing photo:', err);
            setError('Failed to process photo. Please try again.');
        } finally {
            setIsProcessing(false);
            setIsRequestingLocation(false);
        }
    }, [browserSupportsGeo, requestDeviceLocation]);

    const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile) {
            handleFileSelect(droppedFile);
        }
    }, [handleFileSelect]);

    const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
    }, []);

    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            handleFileSelect(selectedFile);
        }
    }, [handleFileSelect]);

    const handleReset = () => {
        setFile(null);
        setPreview(null);
        setGpsData(null);
        setGpsSource(null);
        setAddressData(null);
        setError(null);
        setIsRequestingLocation(false);
    };

    const handleCreateLocation = () => {
        if (file && gpsData) {
            onPhotoProcessed({
                file,
                preview: preview!,
                gpsData,
                addressData,
            });
        }
    };

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            {/* Upload Area */}
            {!file && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Camera className="w-5 h-5" />
                            Upload Photo
                        </CardTitle>
                        <CardDescription>
                            Upload a photo with GPS data to automatically create a location
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div
                            onDrop={handleDrop}
                            onDragOver={handleDragOver}
                            className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-12 text-center hover:border-primary transition-colors cursor-pointer"
                        >
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleInputChange}
                                className="hidden"
                                id="photo-upload"
                            />
                            <label htmlFor="photo-upload" className="cursor-pointer">
                                <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                                <p className="text-lg font-medium mb-2">
                                    Drag & drop a photo or click to browse
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    Supports: JPG, PNG, HEIC • Max size: 10MB
                                </p>
                            </label>
                        </div>

                        {/* Chrome Browser Hint */}
                        {showChromeHint && !file && (
                            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg flex items-start gap-3">
                                <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                                <div className="flex-1 text-sm">
                                    <p className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                                        💡 Tip for Camera Photos
                                    </p>
                                    <p className="text-blue-700 dark:text-blue-300">
                                        For automatic GPS extraction from camera photos, we recommend using <strong>Safari</strong>.
                                        Chrome can still upload photos, but you'll need to select the location manually.
                                    </p>
                                </div>
                            </div>
                        )}

                        {error && (
                            <div className="mt-4 p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2">
                                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Processing/Preview */}
            {file && (
                <div className="space-y-4">
                    {/* Photo Preview */}
                    <Card>
                        <CardContent className="pt-6">
                            <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-900">
                                {preview && (
                                    <Image
                                        src={preview}
                                        alt="Photo preview"
                                        fill
                                        className="object-contain"
                                    />
                                )}
                                <button
                                    onClick={handleReset}
                                    className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-black/70 rounded-full transition-colors"
                                >
                                    <X className="w-4 h-4 text-white" />
                                </button>
                            </div>
                            <p className="mt-3 text-sm text-muted-foreground text-center">
                                {file.name} • {(file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                        </CardContent>
                    </Card>

                    {/* GPS Data Status */}
                    {isProcessing && (
                        <Card>
                            <CardContent className="pt-6">
                                <div className="text-center">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                                    <p className="text-sm text-muted-foreground">
                                        Extracting GPS data from photo...
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {!isProcessing && gpsData && (
                        <>
                            {gpsData.hasGPS ? (
                                <Card className="border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/50">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-400">
                                            <CheckCircle className="w-5 h-5" />
                                            GPS Data Found!
                                        </CardTitle>
                                        <CardDescription className="text-green-600 dark:text-green-500">
                                            We extracted GPS coordinates from your photo
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {/* GPS Coordinates */}
                                        <div className="flex items-start gap-3">
                                            <MapPin className="w-5 h-5 text-green-600 mt-0.5" />
                                            <div className="flex-1">
                                                <p className="text-sm font-medium">GPS Coordinates</p>
                                                <p className="text-sm text-muted-foreground font-mono">
                                                    {formatGPSCoordinates(gpsData.lat, gpsData.lng)}
                                                </p>
                                                {addressData && (
                                                    <p className="text-sm text-muted-foreground mt-1">
                                                        {addressData.address}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Date Taken */}
                                        {gpsData.dateTaken && (
                                            <div className="flex items-start gap-3">
                                                <Calendar className="w-5 h-5 text-green-600 mt-0.5" />
                                                <div className="flex-1">
                                                    <p className="text-sm font-medium">Photo Taken</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {gpsData.dateTaken.toLocaleString()}
                                                    </p>
                                                </div>
                                            </div>
                                        )}

                                        {/* Camera Info */}
                                        {gpsData.camera?.make && (
                                            <div className="flex items-start gap-3">
                                                <Camera className="w-5 h-5 text-green-600 mt-0.5" />
                                                <div className="flex-1">
                                                    <p className="text-sm font-medium">Camera</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {gpsData.camera.make} {gpsData.camera.model}
                                                    </p>
                                                    {gpsData.focalLength && (
                                                        <p className="text-xs text-muted-foreground">
                                                            {gpsData.focalLength} • {gpsData.aperture} • ISO {gpsData.iso}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            ) : (
                                <Card className="border-yellow-200 dark:border-yellow-800 bg-yellow-50/50 dark:bg-yellow-950/50">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-yellow-700 dark:text-yellow-400">
                                            <AlertCircle className="w-5 h-5" />
                                            No GPS Data Found
                                        </CardTitle>
                                        <CardDescription className="text-yellow-600 dark:text-yellow-500">
                                            This photo doesn't contain GPS coordinates
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm text-muted-foreground">
                                            You can still upload this photo, but you'll need to select the location
                                            manually on the map.
                                        </p>
                                    </CardContent>
                                </Card>
                            )}
                        </>
                    )}

                    {/* Actions */}
                    {!isProcessing && gpsData && (
                        <div className="flex gap-3">
                            {gpsData.hasGPS ? (
                                <Button size="lg" onClick={handleCreateLocation} className="flex-1">
                                    <MapPin className="w-4 h-4 mr-2" />
                                    Create Location from Photo
                                </Button>
                            ) : (
                                <Button size="lg" variant="outline" onClick={handleCreateLocation} className="flex-1">
                                    <Camera className="w-4 h-4 mr-2" />
                                    Upload Photo (Manual Location)
                                </Button>
                            )}
                            <Button size="lg" variant="outline" onClick={handleReset}>
                                <X className="w-4 h-4 mr-2" />
                                Cancel
                            </Button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
