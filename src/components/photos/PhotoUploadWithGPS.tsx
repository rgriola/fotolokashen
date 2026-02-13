"use client";

import { useState, useCallback, useEffect } from "react";
import { Upload, Camera, MapPin, Calendar, X, AlertCircle, Info, FileText, Search } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { extractPhotoGPS, reverseGeocodeGPS, formatGPSCoordinates } from "@/lib/photo-utils";
import type { PhotoMetadata } from "@/lib/photo-utils";
import { isChrome, isChromeMobile, supportsGeolocationFallback } from "@/lib/browser-utils";
import { convertToJpeg, needsConversion } from "@/lib/image-converter";
import Image from "next/image";
import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";
import { PlacesAutocomplete } from "@/components/maps/PlacesAutocomplete";
import type { LocationData } from "@/lib/maps-utils";
import { FILE_SIZE_LIMITS } from "@/lib/constants/upload";

interface PhotoUploadWithGPSProps {
    onPhotoProcessed: (photoData: {
        file: File;
        originalFilename: string;
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

export function PhotoUploadWithGPS({ onPhotoProcessed, onCancel: _onCancel }: PhotoUploadWithGPSProps) {
    const [file, setFile] = useState<File | null>(null);
    const [originalFilename, setOriginalFilename] = useState<string>('');
    const [preview, setPreview] = useState<string | null>(null);
    const [previewError, setPreviewError] = useState(false);
    const [isConverting, setIsConverting] = useState(false);
    const [showMetadata, setShowMetadata] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [_isRequestingLocation, setIsRequestingLocation] = useState(false);
    const [gpsData, setGpsData] = useState<PhotoMetadata | null>(null);
    const [_gpsSource, setGpsSource] = useState<'exif' | 'device' | null>(null);
    const [manualLocation, setManualLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [isManualLocationMode, setIsManualLocationMode] = useState(false);
    const [addressData, setAddressData] = useState<{
        address: string;
        name: string;
        street?: string;
        number?: string;
        city?: string;
        state?: string;
        zipcode?: string;
        placeId?: string;
    } | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [_showChromeHint, setShowChromeHint] = useState(false);
    const [browserSupportsGeo, setBrowserSupportsGeo] = useState(true);

    // Load Google Maps
    const { isLoaded: isMapsLoaded } = useJsApiLoader({
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
        libraries: ["places", "maps"] as const,
    });

    // Detect browser on mount
    useEffect(() => {
        setBrowserSupportsGeo(supportsGeolocationFallback());
        setShowChromeHint(isChrome() && !isChromeMobile()); // Desktop Chrome only
    }, []);

    // Get user's current location for map centering
    useEffect(() => {
        if (isMapsLoaded && navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setUserLocation({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                    });
                },
                (error) => {
                    console.log('📍 Could not get user location for map:', error.message);
                    // Fallback to San Francisco will be used
                },
                {
                    enableHighAccuracy: false,
                    timeout: 5000,
                    maximumAge: 300000, // 5 minutes cache
                }
            );
        }
    }, [isMapsLoaded]);

    // Cleanup object URL on unmount to prevent memory leaks
    useEffect(() => {
        return () => {
            if (preview) {
                URL.revokeObjectURL(preview);
            }
        };
    }, [preview]);

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

        // Validate file size using global constant
        const maxSizeMB = FILE_SIZE_LIMITS.PHOTO;
        if (selectedFile.size > maxSizeMB * 1024 * 1024) {
            setError(`File size must be less than ${maxSizeMB}MB`);
            return;
        }

        // Validate minimum file size (detect corrupted/fake files)
        const MIN_FILE_SIZE = 1024; // 1KB - real photos are much larger
        if (selectedFile.size < MIN_FILE_SIZE) {
            alert(`❌ Invalid Photo File\n\nThis file is only ${selectedFile.size} bytes.\n\nReal photos are typically at least 100KB (most are 1-10MB).\n\nThis might be:\n• A corrupted file\n• A text file renamed as .jpg\n• An incomplete download\n\nPlease select a real photo from your camera.`);
            return;
        }

        setError(null);
        setGpsSource(null);
        setOriginalFilename(selectedFile.name); // Preserve original filename

        // IMPORTANT: Extract GPS from ORIGINAL file BEFORE conversion
        // Converting to JPEG can strip EXIF metadata, so we must extract first
        console.log('📸 Step 1: Extracting metadata from ORIGINAL file...');
        setIsProcessing(true);
        
        let metadata: PhotoMetadata;
        try {
            metadata = await extractPhotoGPS(selectedFile);
            console.log('✅ Metadata extracted from original file');
        } catch (metadataError) {
            console.error('❌ Metadata extraction failed:', metadataError);
            setIsProcessing(false);
            
            const errorMsg = metadataError instanceof Error
                ? metadataError.message
                : 'Failed to read image metadata';
            
            alert(`❌ Unable to Read Photo Metadata\n\n${errorMsg}\n\nThis photo may be:\n• Corrupted or incomplete\n• Not a valid image format\n• Missing required metadata\n\nPlease try:\n1. A different photo\n2. Taking a new photo with your camera`);
            
            return;
        }

        // Convert HEIC/TIFF to JPEG in browser (AFTER extracting metadata)
        console.log('📸 Step 2: Converting image format if needed...');
        let fileToProcess = selectedFile;
        
        if (needsConversion(selectedFile)) {
            try {
                setIsConverting(true);
                console.log('🔄 Converting image to JPEG in browser...');
                
                fileToProcess = await convertToJpeg(selectedFile);
                
                console.log('✅ Conversion complete:', fileToProcess.name);
            } catch (conversionError) {
                console.error('❌ Conversion failed:', conversionError);
                setIsConverting(false);
                setIsProcessing(false);
                
                const errorMsg = conversionError instanceof Error
                    ? conversionError.message
                    : 'Unknown conversion error';
                
                alert(`❌ Image Conversion Failed\n\n${errorMsg}\n\nPlease try:\n1. A different photo\n2. Converting the file to JPEG using another app\n3. Using a different browser (Safari works best for HEIC)`);
                
                return;
            } finally {
                setIsConverting(false);
            }
        }

        console.log('📸 Step 3: Setting up preview...');
        setFile(fileToProcess);

        // Create preview URL using object URL (more efficient than base64)
        const objectUrl = URL.createObjectURL(fileToProcess);
        setPreview(objectUrl);
        setPreviewError(false); // Reset error state

        // Validate image can load
        const img = new window.Image();
        img.onload = () => {
            console.log('✅ Image preview loaded successfully');
        };
        img.onerror = () => {
            console.log('⚠️ Image preview failed to load');
            setPreviewError(true);
            alert(`❌ Unable to Display Image\n\nThis file cannot be loaded as an image.\n\nPossible causes:\n• File is corrupted or incomplete\n• Wrong file type (text file with .jpg extension)\n• Unsupported image format\n\nPlease try:\n1. A different photo\n2. Taking a new photo with your camera\n3. Re-downloading the image if it came from elsewhere`);
            
            // Reset
            URL.revokeObjectURL(objectUrl);
            setFile(null);
            setPreview(null);
            setPreviewError(false);
            setIsProcessing(false);
        };
        img.src = objectUrl;

        // Process GPS data (already extracted from original file)
        console.log('📸 Step 4: Processing GPS data...');
        try {
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
                        setIsManualLocationMode(true);
                    }
                } else {
                    // Chrome: Skip geolocation, just set no GPS
                    console.log('ℹ️ [Chrome] Geolocation fallback skipped (not supported)');
                    setGpsData(metadata); // hasGPS: false
                    setIsManualLocationMode(true);
                }
            }
        } catch (err) {
            console.error('Error processing GPS data:', err);
            
            // Show user-friendly error message
            const errorMessage = err instanceof Error 
                ? err.message 
                : 'Failed to process GPS data';
            
            // Show alert and reset
            alert(`❌ Unable to Process GPS Data\n\n${errorMessage}\n\nPlease try another photo.`);
            
            // Reset to allow user to try again
            handleReset();
        } finally {
            setIsProcessing(false);
            setIsRequestingLocation(false);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        // Revoke object URL to prevent memory leaks
        if (preview) {
            URL.revokeObjectURL(preview);
        }
        setFile(null);
        setOriginalFilename('');
        setPreview(null);
        setPreviewError(false);
        setIsConverting(false);
        setShowMetadata(false);
        setGpsData(null);
        setGpsSource(null);
        setManualLocation(null);
        setIsManualLocationMode(false);
        setAddressData(null);
        setError(null); // Clear any error messages
        // Keep userLocation - it's for map centering, not photo-specific
        setIsProcessing(false);
        setIsRequestingLocation(false);
    };

    const handlePlaceSelected = useCallback(async (place: LocationData) => {
        const coordinates = { lat: place.latitude, lng: place.longitude };
        setManualLocation(coordinates);
        
        // Update GPS data
        setGpsData({
            ...gpsData!,
            hasGPS: true,
            lat: place.latitude,
            lng: place.longitude,
        });
        
        // Update address data
        setAddressData({
            address: place.address || place.name,
            name: place.name,
            street: place.street,
            number: place.number,
            city: place.city,
            state: place.state,
            zipcode: place.zipcode,
            placeId: place.placeId,
        });
        
        setGpsSource('device');
    }, [gpsData]);

    const handleMapClick = useCallback(async (e: google.maps.MapMouseEvent) => {
        if (e.latLng) {
            const lat = e.latLng.lat();
            const lng = e.latLng.lng();
            
            setManualLocation({ lat, lng });
            
            // Reverse geocode to get address
            const address = await reverseGeocodeGPS(lat, lng);
            
            setGpsData({
                ...gpsData!,
                hasGPS: true,
                lat,
                lng,
            });
            
            setAddressData(address);
            setGpsSource('device');
        }
    }, [gpsData]);

    const handleCreateLocation = () => {
        if (file && gpsData) {
            onPhotoProcessed({
                file,
                originalFilename,
                preview: preview!,
                gpsData,
                addressData: addressData ?? undefined,
            });
        }
    };

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            {/* Error Alert - Show at top */}
            {error && (
                <div className="p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                    <div className="flex-1">
                        <p className="text-sm font-medium text-red-900 dark:text-red-100 mb-1">Upload Error</p>
                        <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                    </div>
                    <button
                        onClick={() => setError(null)}
                        className="text-red-400 hover:text-red-600 transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Upload Area */}
            {!file && (
                <Card>
                    <CardHeader>
                        <div className="flex items-start justify-between gap-4">
                            {/* Left: Title & Description */}
                            <div className="flex-1">
                                <CardTitle className="flex items-center gap-2">
                                    <Camera className="w-5 h-5" />
                                    Photo Upload
                                </CardTitle>
                                <CardDescription>
                                    Photo GPS metadata will start a new location
                                </CardDescription>
                            </div>
                            
                            
                        </div>
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
                                    Drag & Drop or Click to Choose.
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    JPEG, HEIC, or TIFF • Max: 10MB <br />
                                    HEIC & TIFF converted to JPEG in browser • Compressed to 2MB on server
                                </p>
                            </label>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Processing/Preview */}
            {file && (
                <div className="space-y-4">
                    {/* GPS Status Section - Show at top */}
                    
                    {/* Converting Status */}
                    {isConverting && (
                        <Card className="border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/50">
                            <CardContent className="pt-6">
                                <div className="text-center">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                                    <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                                        Converting to JPEG...
                                    </p>
                                    <p className="text-xs text-blue-700 dark:text-blue-300">
                                        {file?.name}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* No GPS - Manual Location Selection */}
                    {!isConverting && !isProcessing && gpsData && isManualLocationMode && isMapsLoaded && (
                        <Card className="border-blue-200 dark:border-blue-800">
                            <CardHeader>
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                        <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
                                            <MapPin className="w-5 h-5" />
                                            Select Location
                                        </CardTitle>
                                        <CardDescription className="text-blue-600 dark:text-blue-500">
                                            Search for a place, then click the map to fine-tune the exact spot
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* Address Search */}
                                <div className="flex items-center gap-2 bg-white dark:bg-gray-900 border rounded-lg p-2">
                                    <Search className="w-4 h-4 text-muted-foreground ml-1" />
                                    <PlacesAutocomplete
                                        onPlaceSelected={handlePlaceSelected}
                                        placeholder="Search for an address or place..."
                                    />
                                </div>

                                {/* Map */}
                                <div className="relative h-96 rounded-lg overflow-hidden border">
                                    <GoogleMap
                                        mapContainerStyle={{ width: '100%', height: '100%' }}
                                        center={manualLocation || userLocation || { lat: 37.7749, lng: -122.4194 }}
                                        zoom={manualLocation ? 15 : 11}
                                        onClick={handleMapClick}
                                        options={{
                                            streetViewControl: false,
                                            mapTypeControl: false,
                                            fullscreenControl: true,
                                        }}
                                    >
                                        {manualLocation && (
                                            <Marker
                                                position={manualLocation}
                                                animation={google.maps.Animation.DROP}
                                            />
                                        )}
                                    </GoogleMap>
                                </div>

                                {/* Selected Location Info */}
                                {manualLocation && addressData && (
                                    <div className="p-3 bg-green-50 dark:bg-green-950/50 rounded-lg border border-green-200 dark:border-green-800">
                                        <p className="text-sm font-semibold text-green-900 dark:text-green-100 mb-1">
                                            ✓ Location Selected
                                        </p>
                                        <p className="text-xs text-green-700 dark:text-green-300">
                                            {addressData.address}
                                        </p>
                                        <p className="text-xs text-green-600 dark:text-green-400 mt-1 font-mono">
                                            {manualLocation.lat.toFixed(6)}, {manualLocation.lng.toFixed(6)}
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* Processing */}
                    {!isConverting && isProcessing && (
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

                    {/* GPS Data Found */}
                    {!isConverting && !isProcessing && gpsData && gpsData.hasGPS && (
                        <Card className="border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/50">
                            <CardContent className="pt-6 space-y-4">
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

                                {/* Date Taken & Camera Info (combined row) */}
                                {(gpsData.dateTaken || gpsData.camera?.make) && (
                                    <div className="flex items-start gap-6">
                                        {/* Date Taken */}
                                        {gpsData.dateTaken && (
                                            <div className="flex items-start gap-3 flex-1">
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
                                            <div className="flex items-start gap-3 flex-1">
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
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* Photo Preview */}
                    <Card>
                        <CardContent className="pt-6">
                            <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-900">
                                {preview && !previewError ? (
                                    <Image
                                        src={preview}
                                        alt="Photo preview"
                                        fill
                                        className="object-contain"
                                        onError={() => {
                                            console.log('⚠️ Browser cannot display this image format natively');
                                            setPreviewError(true);
                                        }}
                                    />
                                ) : (
                                    // Fallback for images browsers cannot display natively
                                    <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
                                        <div className="relative w-32 h-32 mb-4">
                                            {/* Generic file icon representation */}
                                            <div className="w-full h-full rounded-lg border-4 border-dashed border-muted-foreground/30 flex items-center justify-center">
                                                <Camera className="w-16 h-16 text-muted-foreground" />
                                            </div>
                                        </div>
                                        <p className="text-sm font-medium text-muted-foreground mb-1">
                                            {file?.name}
                                        </p>
                                        <p className="text-xs text-muted-foreground mb-2">
                                            Image could not be displayed
                                        </p>
                                        <p className="text-xs text-green-600 dark:text-green-400">
                                            ✓ File received successfully
                                        </p>
                                    </div>
                                )}

                                {/* Filename - Top Left */}
                                <div className="absolute top-2 left-2 bg-black/80 backdrop-blur-sm text-white px-3 py-1.5 rounded-md text-xs max-w-[60%] z-10">
                                    <div className="flex items-center gap-1.5 truncate">
                                        <FileText className="w-3.5 h-3.5 shrink-0" />
                                        <span className="truncate">{originalFilename}</span>
                                    </div>
                                </div>

                                {/* Info Button - Bottom Right */}
                                {gpsData && (
                                    <button
                                        onClick={() => setShowMetadata(!showMetadata)}
                                        className="absolute bottom-2 right-2 p-2 bg-black/50 hover:bg-black/70 rounded-full transition-colors z-10"
                                        title="Toggle photo metadata"
                                    >
                                        <Info className="w-4 h-4 text-white" />
                                    </button>
                                )}

                                {/* Metadata Panel - Bottom Right (above info button) */}
                                {showMetadata && gpsData && (
                                    <div className="absolute bottom-14 right-2 bg-black/80 backdrop-blur-sm text-white px-3 py-2 rounded-md text-xs space-y-1 max-w-xs z-10">
                                        {/* GPS Data */}
                                        {gpsData.hasGPS && (
                                            <>
                                                <p>
                                                    <span className="font-semibold">📍 GPS:</span> {gpsData.lat?.toFixed(6)}, {gpsData.lng?.toFixed(6)}
                                                </p>
                                                {gpsData.altitude && (
                                                    <p>
                                                        <span className="font-semibold">⛰️ Altitude:</span> {gpsData.altitude.toFixed(2)}m
                                                    </p>
                                                )}
                                            </>
                                        )}

                                        {/* Image Dimensions */}
                                        {gpsData.width && gpsData.height && (
                                            <p>
                                                <span className="font-semibold">📐 Size:</span> {gpsData.width} × {gpsData.height}
                                            </p>
                                        )}

                                        {/* Camera */}
                                        {gpsData.camera && (gpsData.camera.make || gpsData.camera.model) && (
                                            <p className="truncate">
                                                <span className="font-semibold">📷</span> {gpsData.camera.make} {gpsData.camera.model}
                                            </p>
                                        )}

                                        {/* Date Taken */}
                                        {gpsData.dateTaken && (
                                            <p>
                                                <span className="font-semibold">📅</span> {new Date(gpsData.dateTaken).toLocaleDateString()} {new Date(gpsData.dateTaken).toLocaleTimeString()}
                                            </p>
                                        )}

                                        {/* Camera Settings */}
                                        {(gpsData.iso || gpsData.focalLength || gpsData.aperture || gpsData.exposureTime) && (
                                            <p>
                                                <span className="font-semibold">⚙️ Settings:</span>{" "}
                                                {[
                                                    gpsData.iso && `ISO ${gpsData.iso}`,
                                                    gpsData.focalLength,
                                                    gpsData.aperture,
                                                    gpsData.exposureTime
                                                ].filter(Boolean).join(" · ")}
                                            </p>
                                        )}
                                    </div>
                                )}

                                {/* Close Button */}
                                <button
                                    onClick={handleReset}
                                    className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-black/70 rounded-full transition-colors"
                                >
                                    <X className="w-4 h-4 text-white" />
                                </button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Actions */}
                    {!isProcessing && gpsData && (
                        <div className="flex justify-center">
                            {gpsData.hasGPS ? (
                                <Button 
                                    onClick={handleCreateLocation} 
                                    className="bg-green-600 hover:bg-green-700 text-white"
                                >
                                    <MapPin className="w-4 h-4 mr-2" />
                                    Submit
                                </Button>
                            ) : (
                                <Button 
                                    onClick={handleCreateLocation} 
                                    className="bg-green-600 hover:bg-green-700 text-white"
                                >
                                    <Camera className="w-4 h-4 mr-2" />
                                    Photo (Manual Location)
                                </Button>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
