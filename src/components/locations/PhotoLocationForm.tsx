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
    });

    const handleSubmit = useCallback(async (data: LocationFormData): Promise<void> => {
        if (!user) {
            toast.error(ERROR_MESSAGES.AUTH.NOT_AUTHENTICATED);
            return;
        }

        setIsSaving(true);

        try {
            // Step 1: Upload photo to ImageKit
            const authResponse = await fetch('/api/imagekit/auth');
            if (!authResponse.ok) {
                throw new Error(ERROR_MESSAGES.IMAGEKIT.AUTH_FAILED);
            }
            const authData: ImageKitAuthData = await authResponse.json();

            // Upload to ImageKit
            const formData = new FormData();
            formData.append('file', photoFile);
            formData.append('fileName', photoFile.name.replace(/\s+/g, '-'));
            formData.append('folder', FOLDER_PATHS.userLocation(user.id, initialData.placeId));
            formData.append('publicKey', authData.publicKey);
            formData.append('signature', authData.signature);
            formData.append('expire', authData.expire.toString());
            formData.append('token', authData.token);

            const uploadResponse = await fetch('https://upload.imagekit.io/api/v1/files/upload', {
                method: 'POST',
                body: formData,
            });

            if (!uploadResponse.ok) {
                const error = await uploadResponse.text();
                console.error('ImageKit upload failed:', error);
                throw new Error(ERROR_MESSAGES.IMAGEKIT.UPLOAD_FAILED);
            }

            const uploadResult: ImageKitUploadResponse = await uploadResponse.json();

            // Step 2: Prepare photo data with GPS/EXIF metadata
            const photoData: PhotoUploadData = {
                fileId: uploadResult.fileId,
                filePath: uploadResult.filePath,
                name: photoFile.name,
                size: photoFile.size,
                type: photoFile.type,
                width: uploadResult.width,
                height: uploadResult.height,
                url: uploadResult.url,
                thumbnailUrl: uploadResult.thumbnailUrl,
                // GPS/EXIF metadata
                gpsLatitude: photoMetadata.hasGPS && photoMetadata.lat ? Number(photoMetadata.lat) : null,
                gpsLongitude: photoMetadata.hasGPS && photoMetadata.lng ? Number(photoMetadata.lng) : null,
                gpsAltitude: photoMetadata.altitude ? Number(photoMetadata.altitude) : null,
                hasGpsData: Boolean(photoMetadata.hasGPS),
                cameraMake: photoMetadata.camera?.make || null,
                cameraModel: photoMetadata.camera?.model || null,
                lensMake: photoMetadata.lens?.make || null,
                lensModel: photoMetadata.lens?.model || null,
                dateTaken: photoMetadata.dateTaken ? photoMetadata.dateTaken.toISOString() : null,
                iso: photoMetadata.iso ? Number(photoMetadata.iso) : null,
                focalLength: photoMetadata.focalLength || null,
                aperture: photoMetadata.aperture || null,
                shutterSpeed: photoMetadata.exposureTime || null,
                exposureMode: photoMetadata.exposureMode || null,
                whiteBalance: photoMetadata.whiteBalance || null,
                flash: photoMetadata.flash || null,
                orientation: photoMetadata.orientation ? Number(photoMetadata.orientation) : null,
                colorSpace: photoMetadata.colorSpace || null,
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
                hidePhotoUpload={true} // ✅ Hide photo upload since we already have the GPS photo
            />

            <div className="flex gap-3">
                <button
                    type="submit"
                    form="save-location-form"
                    disabled={isSaving}
                    className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                    {isSaving ? 'Saving Location...' : 'Save Location with GPS Photo'}
                </button>
                <button
                    type="button"
                    onClick={onCancel}
                    disabled={isSaving}
                    className="px-4 py-2 border border-input rounded-md hover:bg-accent disabled:opacity-50 transition-colors"
                >
                    Cancel
                </button>
            </div>
        </div>
    );
}
