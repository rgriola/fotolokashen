"use client";

import { useState, useCallback } from "react";
import { SaveLocationForm } from "./SaveLocationForm";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { GoogleMap, useJsApiLoader, Marker } from "@react-google-maps/api";
import type { PhotoMetadata, ImageKitAuthData, ImageKitUploadResponse, PhotoUploadData, LocationFormData, LocationSubmitData } from "@/types/photo";
import { FOLDER_PATHS, UPLOAD_SOURCES } from "@/lib/constants/upload";
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from "@/lib/constants/messages";

interface PhotoLocationFormProps {
    initialData: {
        placeId: string;
        name: string;
        address?: string;
        lat: number;
        lng: number;
        street?: string;
        number?: string;
        city?: string;
        state?: string;
        zipcode?: string;
    };
    photoFile: File;
    photoMetadata: PhotoMetadata;
    onSuccess: () => void;
    onCancel: () => void;
}

/**
 * Wrapper around SaveLocationForm for photo-based location creation
 * Pre-fills form with GPS/EXIF data from photo
 * Uploads photo to ImageKit when user saves
 */
export function PhotoLocationForm({
    initialData,
    photoFile,
    photoMetadata,
    onSuccess,
    onCancel,
}: PhotoLocationFormProps) {
    const { user } = useAuth();
    const [isSaving, setIsSaving] = useState(false);

    // Load Google Maps API
    const { isLoaded } = useJsApiLoader({
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
        libraries: ["places", "maps"] as const,
    });

    const handleSubmit = useCallback(async (data: LocationFormData): Promise<void> => {
        if (!user) {
            toast.error(ERROR_MESSAGES.AUTH.NOT_AUTHENTICATED);
            return;
        }

        setIsSaving(true);

        try {
            // Step 1: Upload photo to secure endpoint (VIRUS SCAN + FORMAT VALIDATION)
            console.log('[PhotoLocationForm] Uploading photo via secure endpoint...');
            
            const uploadFormData = new FormData();
            uploadFormData.append('photo', photoFile);
            uploadFormData.append('uploadType', 'location');
            
            // Include GPS/EXIF metadata for server-side sanitization
            const metadata = {
                hasGPS: photoMetadata.hasGPS,
                lat: photoMetadata.lat,
                lng: photoMetadata.lng,
                altitude: photoMetadata.altitude,
                dateTaken: photoMetadata.dateTaken,
                camera: photoMetadata.camera,
                lens: photoMetadata.lens,
                iso: photoMetadata.iso,
                focalLength: photoMetadata.focalLength,
                aperture: photoMetadata.aperture,
                exposureTime: photoMetadata.exposureTime,
                exposureMode: photoMetadata.exposureMode,
                whiteBalance: photoMetadata.whiteBalance,
                flash: photoMetadata.flash,
                orientation: photoMetadata.orientation,
                colorSpace: photoMetadata.colorSpace,
            };
            uploadFormData.append('metadata', JSON.stringify(metadata));

            const uploadResponse = await fetch('/api/photos/upload', {
                method: 'POST',
                credentials: 'include',
                body: uploadFormData,
            });

            if (!uploadResponse.ok) {
                const error = await uploadResponse.json();
                console.error('Secure upload failed:', error);
                throw new Error(error.error || ERROR_MESSAGES.IMAGEKIT.UPLOAD_FAILED);
            }

            const secureUploadResult = await uploadResponse.json();
            console.log('[PhotoLocationForm] Photo uploaded securely! Path:', secureUploadResult.upload.filePath);

            // Step 2: Prepare photo data from secure upload result
            const photoData: PhotoUploadData = {
                fileId: secureUploadResult.upload.fileId,
                filePath: secureUploadResult.upload.filePath,
                name: secureUploadResult.file.originalFilename,
                size: secureUploadResult.file.size,
                type: secureUploadResult.file.mimeType,
                width: secureUploadResult.upload.width,
                height: secureUploadResult.upload.height,
                url: secureUploadResult.upload.url,
                thumbnailUrl: secureUploadResult.upload.thumbnailUrl,
                // GPS/EXIF metadata (SANITIZED by server)
                gpsLatitude: secureUploadResult.metadata?.gpsLatitude,
                gpsLongitude: secureUploadResult.metadata?.gpsLongitude,
                gpsAltitude: secureUploadResult.metadata?.gpsAltitude,
                hasGpsData: secureUploadResult.metadata?.hasGPS || false,
                cameraMake: secureUploadResult.metadata?.cameraMake,
                cameraModel: secureUploadResult.metadata?.cameraModel,
                lensMake: secureUploadResult.metadata?.lensMake,
                lensModel: secureUploadResult.metadata?.lensModel,
                dateTaken: secureUploadResult.metadata?.dateTaken,
                iso: secureUploadResult.metadata?.iso,
                focalLength: secureUploadResult.metadata?.focalLength,
                aperture: secureUploadResult.metadata?.aperture,
                shutterSpeed: secureUploadResult.metadata?.exposureTime,
                exposureMode: secureUploadResult.metadata?.exposureMode,
                whiteBalance: secureUploadResult.metadata?.whiteBalance,
                flash: secureUploadResult.metadata?.flash,
                orientation: secureUploadResult.metadata?.orientation,
                colorSpace: secureUploadResult.metadata?.colorSpace,
                uploadSource: UPLOAD_SOURCES.PHOTO_GPS,
            };

            // Step 3: Save location with photo data
            // Transform LocationFormData to LocationSubmitData (lat/lng → latitude/longitude)
            const { lat, lng, ...rest } = data;
            const apiData: LocationSubmitData = {
                ...rest,
                latitude: lat,
                longitude: lng,
                photos: [photoData],
            };

            const response = await fetch('/api/locations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(apiData),
            });

            if (!response.ok) {
                const error = await response.json();
                console.error('API Error:', error);
                throw new Error(error.error || ERROR_MESSAGES.LOCATION.SAVE_FAILED);
            }

            const result = await response.json();

            toast.success(SUCCESS_MESSAGES.LOCATION.CREATED_FROM_PHOTO);
            onSuccess();
        } catch (error: any) {
            console.error('Failed to save location:', error);
            toast.error(`${ERROR_MESSAGES.LOCATION.SAVE_FAILED}: ${error.message}`);
        } finally {
            setIsSaving(false);
        }
    }, [user, photoFile, photoMetadata, initialData.placeId, onSuccess]); // useCallback dependencies

    return (
        <div className="space-y-4">

            {/* Street-Level Map Preview */}
            <div className="space-y-3">
                <h3 className="text-sm font-semibold">Location Preview</h3>
                {isLoaded ? (
                    <div className="rounded-lg overflow-hidden border h-64">
                        <GoogleMap
                            mapContainerStyle={{ width: '100%', height: '100%' }}
                            center={{ lat: initialData.lat, lng: initialData.lng }}
                            zoom={17} // Street level
                            options={{
                                streetViewControl: false,
                                mapTypeControl: false,
                                fullscreenControl: false,
                                zoomControl: true,
                            }}
                        >
                            {/* Red marker at GPS location */}
                            <Marker
                                position={{ lat: initialData.lat, lng: initialData.lng }}
                                icon={{
                                    path: google.maps.SymbolPath.CIRCLE,
                                    scale: 8,
                                    fillColor: "#EF4444",
                                    fillOpacity: 1,
                                    strokeColor: "#FFFFFF",
                                    strokeWeight: 2,
                                }}
                            />
                        </GoogleMap>
                    </div>
                ) : (
                    <div className="rounded-lg border h-64 flex items-center justify-center bg-muted">
                        <p className="text-sm text-muted-foreground">Loading map...</p>
                    </div>
                )}
                <p className="text-xs text-muted-foreground">
                    📍 Verify this is the correct location before saving
                </p>
            </div>

            {/* Use existing SaveLocationForm (without ImageKitUploader section) */}
            <SaveLocationForm
                initialData={initialData}
                onSubmit={handleSubmit}
                isPending={isSaving}
                showPhotoUpload={false} // ✅ Hide photo upload since we already have the GPS photo
            />
        </div>
    );
}
