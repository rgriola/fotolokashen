"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
    Upload, Camera, MapPin, X, AlertCircle, Info, FileText, 
    Tag, Navigation, Loader2, CheckCircle
} from "lucide-react";
import { toast } from "sonner";
import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";
import { PlacesAutocomplete } from "@/components/maps/PlacesAutocomplete";
import type { LocationData } from "@/lib/maps-utils";

// IMPORTANT: Keep libraries array outside component to prevent Google Maps reload warning
const GOOGLE_MAPS_LIBRARIES: ("places" | "maps")[] = ["places", "maps"];

// Utils and types
import { extractPhotoGPS, reverseGeocodeGPS, formatGPSCoordinates } from "@/lib/photo-utils";
import type { PhotoMetadata } from "@/lib/photo-utils";
import { convertToJpeg, needsConversion } from "@/lib/image-converter";
import { TYPE_COLOR_MAP, getAvailableTypes } from "@/lib/location-constants";
import { indoorOutdoorSchema, DEFAULT_INDOOR_OUTDOOR } from "@/lib/form-constants";
import { useAuth } from "@/lib/auth-context";
import { usePhotoCacheManager } from "@/hooks/usePhotoCacheManager";
import { FILE_SIZE_LIMITS, UPLOAD_SOURCES } from "@/lib/constants/upload";
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from "@/lib/constants/messages";
import type { UploadedPhotoData } from "@/types/photo-cache";

// Security: Regex to prevent XSS and SQL injection in text fields
const safeTextRegex = /^[a-zA-Z0-9\s\-.,!?&'"()]+$/;
const productionNotesRegex = /^[a-zA-Z0-9\s\-.,!?&'"();:@\n\r]+$/;

const createLocationSchema = z.object({
    placeId: z.string().min(1, "Place ID is required").max(255),
    name: z.string()
        .min(1, "Location name is required")
        .max(200, "Name must be 200 characters or less")
        .regex(safeTextRegex, "Invalid characters detected"),
    address: z.string().max(500).optional(),
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
    type: z.string().min(1, "Type is required"),
    indoorOutdoor: indoorOutdoorSchema,
    street: z.string().max(200).optional(),
    number: z.string().max(50).optional(),
    city: z.string().max(100).optional(),
    state: z.string().max(100).optional(),
    zipcode: z.string().max(20).optional(),
    productionNotes: z.string().optional()
        .refine((val) => !val || val.length <= 500, "Production notes must be 500 characters or less")
        .refine((val) => !val || productionNotesRegex.test(val), "Invalid characters detected"),
    entryPoint: z.string().optional()
        .refine((val) => !val || val.length <= 200, "Entry point must be 200 characters or less"),
    parking: z.string().optional()
        .refine((val) => !val || val.length <= 200, "Parking info must be 200 characters or less"),
    access: z.string().optional()
        .refine((val) => !val || val.length <= 200, "Access info must be 200 characters or less"),
    isFavorite: z.boolean().optional(),
    personalRating: z.number().min(0).max(5).optional(),
    color: z.string().max(20).optional(),
});

type CreateLocationFormData = z.infer<typeof createLocationSchema>;

interface AddressData {
    address: string;
    name: string;
    street?: string;
    number?: string;
    city?: string;
    state?: string;
    zipcode?: string;
    placeId?: string;
}

interface CreateLocationWithPhotoProps {
    onSuccess?: () => void;
}

export function CreateLocationWithPhoto({ onSuccess }: CreateLocationWithPhotoProps) {
    const router = useRouter();
    const { user } = useAuth();
    const isAdmin = user?.isAdmin === true || user?.role === 'staffer' || user?.role === 'super_admin';
    const availableTypes = getAvailableTypes(isAdmin);

    // Photo state
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [originalFilename, setOriginalFilename] = useState<string>('');
    const [preview, setPreview] = useState<string | null>(null);
    const [previewError, setPreviewError] = useState(false);
    const [isConverting, setIsConverting] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [showMetadata, setShowMetadata] = useState(false);

    // GPS/Location state
    const [gpsData, setGpsData] = useState<PhotoMetadata | null>(null);
    const [gpsSource, setGpsSource] = useState<'exif' | 'device' | 'manual' | null>(null);
    const [manualLocation, setManualLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [isManualLocationMode, setIsManualLocationMode] = useState(false);
    const [addressData, setAddressData] = useState<AddressData | null>(null);

    // Form state
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [tags, setTags] = useState<string[]>([]);
    const [tagInput, setTagInput] = useState("");

    // Photo cache manager for deferred upload
    const photoCacheManager = usePhotoCacheManager();
    const uploadPhotosRef = useRef<(() => Promise<UploadedPhotoData[]>) | null>(null);

    // Store upload function reference
    useEffect(() => {
        uploadPhotosRef.current = photoCacheManager.uploadAllToImageKit;
    }, [photoCacheManager.uploadAllToImageKit]);

    // Generate stable placeId
    const fallbackPlaceIdRef = useRef(`photo-${Date.now()}`);

    // Load Google Maps
    const { isLoaded: isMapsLoaded } = useJsApiLoader({
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
        libraries: GOOGLE_MAPS_LIBRARIES,
    });

    // Form setup
    const form = useForm<CreateLocationFormData>({
        resolver: zodResolver(createLocationSchema),
        defaultValues: {
            placeId: "",
            name: "",
            address: "",
            lat: 0,
            lng: 0,
            type: "",
            indoorOutdoor: DEFAULT_INDOOR_OUTDOOR,
            isFavorite: false,
            personalRating: 0,
        },
    });

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
                },
                { enableHighAccuracy: false, timeout: 5000, maximumAge: 300000 }
            );
        }
    }, [isMapsLoaded]);

    // Cleanup object URL on unmount
    useEffect(() => {
        return () => {
            if (preview) {
                URL.revokeObjectURL(preview);
            }
        };
    }, [preview]);

    // Computed: Is location ready (GPS from photo or manual selection)?
    const hasLocation = Boolean(
        (gpsData?.hasGPS && gpsData.lat && gpsData.lng) || 
        manualLocation
    );

    // Computed: Final coordinates
    const finalLat = manualLocation?.lat ?? gpsData?.lat ?? 0;
    const finalLng = manualLocation?.lng ?? gpsData?.lng ?? 0;

    // Computed: Is form ready to save?
    const canSave = Boolean(photoFile && hasLocation && form.watch("name") && form.watch("type"));

    /**
     * Handle file selection
     */
    const handleFileSelect = useCallback(async (file: File) => {
        // Validate file type
        if (!file.type.startsWith('image/')) {
            setError('Please select an image file');
            return;
        }

        // Validate file size
        const maxBytes = FILE_SIZE_LIMITS.PHOTO * 1024 * 1024;
        if (file.size > maxBytes) {
            setError(`File size must be less than ${FILE_SIZE_LIMITS.PHOTO}MB`);
            return;
        }

        // Minimum size check (detect fake files)
        if (file.size < 1024) {
            setError('File appears to be invalid (too small)');
            return;
        }

        setError(null);
        setIsProcessing(true);
        setOriginalFilename(file.name);

        try {
            // Step 1: Extract GPS from ORIGINAL file (before conversion strips EXIF)
            console.log('📸 Step 1: Extracting metadata from ORIGINAL file...');
            const metadata = await extractPhotoGPS(file);
            setGpsData(metadata);

            // Step 2: Convert HEIC/TIFF to JPEG if needed
            let fileToProcess = file;
            if (needsConversion(file)) {
                console.log('🔄 Converting', file.type, 'to JPEG...');
                setIsConverting(true);
                toast.info(`Converting ${file.name} to JPEG...`);
                
                try {
                    const convertedBlob = await convertToJpeg(file);
                    const newFilename = file.name.replace(/\.(heic|heif|tif|tiff)$/i, '.jpg');
                    fileToProcess = new File([convertedBlob], newFilename, { type: 'image/jpeg' });
                    console.log('✅ Conversion complete:', newFilename);
                } catch (conversionError) {
                    console.error('❌ Conversion failed:', conversionError);
                    toast.error('Failed to convert image format');
                    setIsProcessing(false);
                    setIsConverting(false);
                    return;
                }
                setIsConverting(false);
            }

            // Step 3: Create preview
            const objectUrl = URL.createObjectURL(fileToProcess);
            setPreview(objectUrl);
            setPhotoFile(fileToProcess);

            // Step 4: Add to photo cache for deferred upload
            await photoCacheManager.addPhoto(fileToProcess);

            // Step 5: Process GPS data
            if (metadata.hasGPS && metadata.lat && metadata.lng) {
                console.log('✅ GPS found in photo EXIF');
                setGpsSource('exif');
                
                // Reverse geocode
                const address = await reverseGeocodeGPS(metadata.lat, metadata.lng);
                setAddressData(address);

                // Update form with GPS data
                form.setValue('lat', metadata.lat);
                form.setValue('lng', metadata.lng);
                form.setValue('placeId', address?.placeId || fallbackPlaceIdRef.current);
                form.setValue('name', address?.name || 'Photo Location');
                form.setValue('address', address?.address || `Location at ${metadata.lat.toFixed(6)}, ${metadata.lng.toFixed(6)}`);
                form.setValue('street', address?.street || '');
                form.setValue('city', address?.city || '');
                form.setValue('state', address?.state || '');
                form.setValue('zipcode', address?.zipcode || '');
            } else {
                console.log('⚠️ No GPS in photo EXIF - enabling manual location mode');
                setIsManualLocationMode(true);
                form.setValue('placeId', fallbackPlaceIdRef.current);
            }

        } catch (err) {
            console.error('Error processing photo:', err);
            setError('Failed to process photo. Please try another image.');
        } finally {
            setIsProcessing(false);
        }
    }, [form, photoCacheManager]);

    /**
     * Handle drag and drop
     */
    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file) {
            handleFileSelect(file);
        }
    }, [handleFileSelect]);

    /**
     * Handle manual location selection from Places Autocomplete
     */
    const handlePlaceSelected = useCallback(async (place: LocationData) => {
        const coordinates = { lat: place.latitude, lng: place.longitude };
        setManualLocation(coordinates);
        setGpsSource('manual');

        // Update GPS data
        setGpsData((prev) => ({
            ...prev!,
            hasGPS: true,
            lat: place.latitude,
            lng: place.longitude,
        }));

        // Update address data
        const newAddress: AddressData = {
            address: place.address || place.name,
            name: place.name,
            street: place.street,
            number: place.number,
            city: place.city,
            state: place.state,
            zipcode: place.zipcode,
            placeId: place.placeId,
        };
        setAddressData(newAddress);

        // Update form
        form.setValue('lat', place.latitude);
        form.setValue('lng', place.longitude);
        form.setValue('placeId', place.placeId || fallbackPlaceIdRef.current);
        form.setValue('name', place.name || 'Photo Location');
        form.setValue('address', place.address || place.name);
        form.setValue('street', place.street || '');
        form.setValue('city', place.city || '');
        form.setValue('state', place.state || '');
        form.setValue('zipcode', place.zipcode || '');
    }, [form]);

    /**
     * Handle map click for manual location
     */
    const handleMapClick = useCallback(async (e: google.maps.MapMouseEvent) => {
        if (e.latLng) {
            const lat = e.latLng.lat();
            const lng = e.latLng.lng();

            setManualLocation({ lat, lng });
            setGpsSource('manual');

            // Reverse geocode
            const address = await reverseGeocodeGPS(lat, lng);
            setAddressData(address);

            // Update GPS data
            setGpsData((prev) => ({
                ...prev!,
                hasGPS: true,
                lat,
                lng,
            }));

            // Update form
            form.setValue('lat', lat);
            form.setValue('lng', lng);
            form.setValue('placeId', address?.placeId || fallbackPlaceIdRef.current);
            form.setValue('name', address?.name || 'Photo Location');
            form.setValue('address', address?.address || `Location at ${lat.toFixed(6)}, ${lng.toFixed(6)}`);
            form.setValue('street', address?.street || '');
            form.setValue('city', address?.city || '');
            form.setValue('state', address?.state || '');
            form.setValue('zipcode', address?.zipcode || '');
        }
    }, [form]);

    /**
     * Clear photo and reset
     */
    const handleClearPhoto = useCallback(() => {
        if (preview) {
            URL.revokeObjectURL(preview);
        }
        setPhotoFile(null);
        setOriginalFilename('');
        setPreview(null);
        setPreviewError(false);
        setGpsData(null);
        setGpsSource(null);
        setManualLocation(null);
        setIsManualLocationMode(false);
        setAddressData(null);
        setError(null);
        photoCacheManager.clearCache();
        form.reset();
    }, [preview, form, photoCacheManager]);

    /**
     * Handle tag add
     */
    const handleAddTag = () => {
        const trimmedTag = tagInput.trim();
        if (trimmedTag && tags.length < 10 && !tags.includes(trimmedTag)) {
            setTags([...tags, trimmedTag]);
            setTagInput("");
        }
    };

    /**
     * Handle form submission with deferred upload
     */
    const handleSubmit = async (data: CreateLocationFormData) => {
        if (!user) {
            toast.error(ERROR_MESSAGES.AUTH.NOT_AUTHENTICATED);
            return;
        }

        if (!hasLocation) {
            toast.error('Please select a location on the map');
            return;
        }

        if (!photoFile) {
            toast.error('Please upload a photo');
            return;
        }

        setIsSaving(true);

        try {
            // Step 1: Upload photo via deferred upload (secure endpoint)
            console.log('[CreateLocationWithPhoto] Uploading photo via secure endpoint...');
            toast.info('Uploading photo...');

            let uploadedPhotos: UploadedPhotoData[] = [];
            if (uploadPhotosRef.current) {
                uploadedPhotos = await uploadPhotosRef.current();
            }

            if (uploadedPhotos.length === 0) {
                throw new Error('Photo upload failed');
            }

            const uploadedPhoto = uploadedPhotos[0];
            console.log('[CreateLocationWithPhoto] Photo uploaded:', uploadedPhoto);

            // Step 2: Prepare photo data for API
            const photoData = {
                fileId: uploadedPhoto.imagekitFileId,
                filePath: uploadedPhoto.imagekitFilePath,
                name: uploadedPhoto.originalFilename,
                size: uploadedPhoto.fileSize,
                type: uploadedPhoto.mimeType,
                width: uploadedPhoto.width,
                height: uploadedPhoto.height,
                url: uploadedPhoto.url,
                // GPS/EXIF metadata
                gpsLatitude: gpsData?.lat,
                gpsLongitude: gpsData?.lng,
                gpsAltitude: gpsData?.altitude,
                hasGpsData: gpsData?.hasGPS || false,
                cameraMake: gpsData?.camera?.make,
                cameraModel: gpsData?.camera?.model,
                dateTaken: gpsData?.dateTaken,
                iso: gpsData?.iso,
                focalLength: gpsData?.focalLength,
                aperture: gpsData?.aperture,
                shutterSpeed: gpsData?.exposureTime,
                uploadSource: UPLOAD_SOURCES.PHOTO_GPS,
            };

            // Step 3: Save location with photo
            const { lat, lng, ...rest } = data;
            const apiData = {
                ...rest,
                latitude: lat,
                longitude: lng,
                tags: tags.length > 0 ? tags : undefined,
                photos: [photoData],
            };

            const response = await fetch('/api/locations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(apiData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('API Error:', errorData);
                throw new Error(errorData.error || ERROR_MESSAGES.LOCATION.SAVE_FAILED);
            }

            toast.success(SUCCESS_MESSAGES.LOCATION.CREATED_FROM_PHOTO);
            
            if (onSuccess) {
                onSuccess();
            } else {
                router.push('/locations');
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            console.error('Failed to save location:', err);
            toast.error(`${ERROR_MESSAGES.LOCATION.SAVE_FAILED}: ${errorMessage}`);
        } finally {
            setIsSaving(false);
        }
    };

    const productionNotesCount = form.watch("productionNotes")?.length || 0;

    return (
        <div className="space-y-6">
            {/* Error Alert */}
            {error && (
                <div className="p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                    <div className="flex-1">
                        <p className="text-sm font-medium text-red-900 dark:text-red-100 mb-1">Error</p>
                        <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                    </div>
                    <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Photo Upload Section */}
            <Card>
                <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                        <Camera className="w-5 h-5 text-green-600" />
                        <CardTitle className="text-lg">Photo</CardTitle>
                        {isConverting && (
                            <Badge variant="secondary" className="ml-auto">
                                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                Converting...
                            </Badge>
                        )}
                        {isProcessing && !isConverting && (
                            <Badge variant="secondary" className="ml-auto">
                                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                Extracting GPS...
                            </Badge>
                        )}
                    </div>
                </CardHeader>
                <CardContent>
                    {!photoFile ? (
                        /* Upload Drop Zone */
                        <label
                            className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer hover:border-green-500 hover:bg-green-50/50 dark:hover:bg-green-950/20 transition-colors"
                            onDrop={handleDrop}
                            onDragOver={(e) => e.preventDefault()}
                        >
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <Upload className="w-10 h-10 mb-3 text-muted-foreground" />
                                <p className="mb-2 text-sm text-muted-foreground">
                                    <span className="font-semibold">Click to upload</span> or drag and drop
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    JPEG, HEIC, TIFF up to {FILE_SIZE_LIMITS.PHOTO}MB
                                </p>
                            </div>
                            <input
                                type="file"
                                className="hidden"
                                accept="image/*"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handleFileSelect(file);
                                }}
                            />
                        </label>
                    ) : (
                        /* Photo Preview */
                        <div className="space-y-4">
                            <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
                                {preview && !previewError && (
                                    <Image
                                        src={preview}
                                        alt="Photo preview"
                                        fill
                                        className="object-contain"
                                        onError={() => setPreviewError(true)}
                                    />
                                )}
                                {previewError && (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <Camera className="w-12 h-12 text-muted-foreground" />
                                    </div>
                                )}
                                
                                {/* Filename overlay */}
                                <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm rounded px-2 py-1">
                                    <p className="text-xs text-white flex items-center gap-1">
                                        <FileText className="w-3 h-3" />
                                        {originalFilename}
                                    </p>
                                </div>

                                {/* Clear button */}
                                <button
                                    onClick={handleClearPhoto}
                                    className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 backdrop-blur-sm rounded-full p-1.5 transition-colors"
                                >
                                    <X className="w-4 h-4 text-white" />
                                </button>

                                {/* GPS Status Badge */}
                                <div className="absolute bottom-2 left-2">
                                    {gpsSource === 'exif' && (
                                        <Badge className="bg-green-600">
                                            <MapPin className="w-3 h-3 mr-1" />
                                            GPS from photo
                                        </Badge>
                                    )}
                                    {gpsSource === 'manual' && (
                                        <Badge className="bg-blue-600">
                                            <MapPin className="w-3 h-3 mr-1" />
                                            Location selected
                                        </Badge>
                                    )}
                                    {!gpsSource && !isProcessing && (
                                        <Badge variant="secondary" className="bg-yellow-600 text-white">
                                            <AlertCircle className="w-3 h-3 mr-1" />
                                            No GPS - select below
                                        </Badge>
                                    )}
                                </div>

                                {/* Metadata toggle */}
                                {gpsData && (
                                    <button
                                        onClick={() => setShowMetadata(!showMetadata)}
                                        className="absolute bottom-2 right-2 bg-black/60 hover:bg-black/80 backdrop-blur-sm rounded-full p-1.5 transition-colors"
                                    >
                                        <Info className="w-4 h-4 text-white" />
                                    </button>
                                )}
                            </div>

                            {/* Metadata panel */}
                            {showMetadata && gpsData && (
                                <div className="p-3 bg-muted rounded-lg text-xs space-y-1">
                                    {gpsData.camera?.make && (
                                        <p><span className="text-muted-foreground">Camera:</span> {gpsData.camera.make} {gpsData.camera.model}</p>
                                    )}
                                    {gpsData.dateTaken && (
                                        <p><span className="text-muted-foreground">Taken:</span> {new Date(gpsData.dateTaken).toLocaleString()}</p>
                                    )}
                                    {gpsData.hasGPS && gpsData.lat && gpsData.lng && (
                                        <p><span className="text-muted-foreground">GPS:</span> {formatGPSCoordinates(gpsData.lat, gpsData.lng)}</p>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Manual Location Selection (shown when no GPS) */}
            {photoFile && isManualLocationMode && isMapsLoaded && (
                <Card>
                    <CardHeader className="pb-3">
                        <div className="flex items-center gap-2">
                            <MapPin className="w-5 h-5 text-blue-600" />
                            <CardTitle className="text-lg">Select Location</CardTitle>
                        </div>
                        <CardDescription>
                            Search for an address or click on the map to set the location
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Address Search */}
                        <PlacesAutocomplete onPlaceSelected={handlePlaceSelected} />

                        {/* Interactive Map */}
                        <div className="h-64 rounded-lg overflow-hidden border">
                            <GoogleMap
                                mapContainerStyle={{ width: '100%', height: '100%' }}
                                center={manualLocation || userLocation || { lat: 37.7749, lng: -122.4194 }}
                                zoom={manualLocation ? 15 : 11}
                                onClick={handleMapClick}
                                options={{
                                    fullscreenControl: true,
                                    streetViewControl: false,
                                    mapTypeControl: false,
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

                        {/* Location Selected Confirmation */}
                        {manualLocation && addressData && (
                            <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                                <p className="text-sm font-medium text-green-800 dark:text-green-200 flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4" />
                                    Location Selected
                                </p>
                                <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                                    {addressData.address}
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Location Preview Map (when location is set) */}
            {hasLocation && isMapsLoaded && !isManualLocationMode && (
                <Card>
                    <CardHeader className="pb-3">
                        <div className="flex items-center gap-2">
                            <MapPin className="w-5 h-5 text-green-600" />
                            <CardTitle className="text-lg">Location Preview</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="h-48 rounded-lg overflow-hidden border">
                            <GoogleMap
                                mapContainerStyle={{ width: '100%', height: '100%' }}
                                center={{ lat: finalLat, lng: finalLng }}
                                zoom={15}
                                options={{
                                    disableDefaultUI: true,
                                    zoomControl: true,
                                }}
                            >
                                <Marker position={{ lat: finalLat, lng: finalLng }} />
                            </GoogleMap>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Location Details Form */}
            <Card className={!photoFile ? 'opacity-50 pointer-events-none' : ''}>
                <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                        <Tag className="w-5 h-5 text-green-600" />
                        <CardTitle className="text-lg">Location Details</CardTitle>
                    </div>
                </CardHeader>
                <CardContent>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                        {/* Name */}
                        <div>
                            <Label htmlFor="name">Location Name *</Label>
                            <Input
                                id="name"
                                {...form.register("name")}
                                placeholder="e.g., Central Park"
                                className="mt-1"
                            />
                            {form.formState.errors.name && (
                                <p className="text-sm text-destructive mt-1">{form.formState.errors.name.message}</p>
                            )}
                        </div>

                        {/* Type and Rating */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label htmlFor="type">Type *</Label>
                                <Select
                                    onValueChange={(value) => {
                                        form.setValue("type", value);
                                        form.setValue("color", TYPE_COLOR_MAP[value] || "");
                                    }}
                                    value={form.watch("type") || ""}
                                >
                                    <SelectTrigger className="mt-1">
                                        <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {availableTypes.map((type) => (
                                            <SelectItem key={type} value={type}>
                                                <div className="flex items-center gap-2">
                                                    <div
                                                        className="w-3 h-3 rounded-full"
                                                        style={{ backgroundColor: TYPE_COLOR_MAP[type] }}
                                                    />
                                                    <span>{type}</span>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {form.formState.errors.type && (
                                    <p className="text-xs text-destructive mt-1">{form.formState.errors.type.message}</p>
                                )}
                            </div>

                            <div>
                                <Label htmlFor="personalRating">Rating</Label>
                                <Select
                                    onValueChange={(value) => form.setValue("personalRating", parseInt(value))}
                                    defaultValue="0"
                                >
                                    <SelectTrigger className="mt-1">
                                        <SelectValue placeholder="Rate" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="0">No rating</SelectItem>
                                        <SelectItem value="1">⭐</SelectItem>
                                        <SelectItem value="2">⭐⭐</SelectItem>
                                        <SelectItem value="3">⭐⭐⭐</SelectItem>
                                        <SelectItem value="4">⭐⭐⭐⭐</SelectItem>
                                        <SelectItem value="5">⭐⭐⭐⭐⭐</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Address Display */}
                        {addressData && (
                            <div className="p-3 rounded-lg border bg-muted/30">
                                <div className="flex items-start gap-2">
                                    <MapPin className="w-4 h-4 mt-0.5 text-primary shrink-0" />
                                    <div className="flex-1">
                                        <p className="text-sm font-medium">{addressData.address}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <Navigation className="w-3 h-3 text-muted-foreground" />
                                            <code className="text-xs font-mono text-muted-foreground">
                                                {finalLat.toFixed(6)}, {finalLng.toFixed(6)}
                                            </code>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Tags */}
                        <div>
                            <Label>Tags</Label>
                            <div className="flex gap-2 mt-1">
                                <Input
                                    value={tagInput}
                                    onChange={(e) => setTagInput(e.target.value)}
                                    placeholder="Add a tag"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            handleAddTag();
                                        }
                                    }}
                                />
                                <Button type="button" variant="outline" onClick={handleAddTag}>
                                    Add
                                </Button>
                            </div>
                            {tags.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {tags.map((tag) => (
                                        <Badge key={tag} variant="secondary" className="gap-1">
                                            {tag}
                                            <button
                                                type="button"
                                                onClick={() => setTags(tags.filter((t) => t !== tag))}
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </Badge>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Production Notes */}
                        <div>
                            <div className="flex justify-between items-center">
                                <Label htmlFor="productionNotes">Production Notes</Label>
                                <span className="text-xs text-muted-foreground">
                                    {productionNotesCount}/500
                                </span>
                            </div>
                            <Textarea
                                id="productionNotes"
                                {...form.register("productionNotes")}
                                placeholder="Special considerations..."
                                className="mt-1"
                            />
                        </div>

                        {/* Submit Button */}
                        <Button
                            type="submit"
                            className="w-full bg-green-600 hover:bg-green-700"
                            disabled={!canSave || isSaving}
                        >
                            {isSaving ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Save Location
                                </>
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
