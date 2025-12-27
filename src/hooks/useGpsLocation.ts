'use client';

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/lib/auth-context';

interface UseGpsLocationReturn {
    isRequesting: boolean;
    requestLocation: () => Promise<GeolocationPosition | null>;
    updateUserPermission: (permission: 'granted' | 'denied') => Promise<void>;
}

export function useGpsLocation(): UseGpsLocationReturn {
    const { user, refetchUser } = useAuth();
    const [isRequesting, setIsRequesting] = useState(false);

    const updateUserPermission = useCallback(async (permission: 'granted' | 'denied') => {
        try {
            const response = await fetch('/api/auth/profile', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ gpsPermission: permission }),
            });

            if (response.ok) {
                await refetchUser();
            }
        } catch (error) {
            console.error('Failed to update GPS permission:', error);
        }
    }, [refetchUser]);

    const requestLocation = useCallback(async (): Promise<GeolocationPosition | null> => {
        if (!navigator.geolocation) {
            toast.error('Geolocation is not supported by your browser');
            return null;
        }

        setIsRequesting(true);

        return new Promise((resolve) => {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setIsRequesting(false);
                    toast.success('Location found!');
                    resolve(position);
                },
                (error) => {
                    setIsRequesting(false);

                    if (error.code === 1) { // PERMISSION_DENIED
                        toast.error('GPS permission denied by browser', {
                            description: 'You can enable it in your browser settings',
                        });
                        // Update DB to reflect browser denial
                        updateUserPermission('denied');
                    } else if (error.code === 2) { // POSITION_UNAVAILABLE
                        toast.error('Location unavailable', {
                            description: 'Unable to determine your position',
                        });
                    } else if (error.code === 3) { // TIMEOUT
                        toast.error('Location request timed out', {
                            description: 'Please try again',
                        });
                    } else {
                        toast.error('Unable to get location');
                    }

                    resolve(null);
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0,
                }
            );
        });
    }, [updateUserPermission]);

    return {
        isRequesting,
        requestLocation,
        updateUserPermission,
    };
}
