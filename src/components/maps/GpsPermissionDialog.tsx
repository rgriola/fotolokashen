'use client';

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { MapPin, Shield } from 'lucide-react';

interface GpsPermissionDialogProps {
    open: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

export function GpsPermissionDialog({ open, onConfirm, onCancel }: GpsPermissionDialogProps) {
    return (
        <AlertDialog open={open} onOpenChange={(isOpen: boolean) => !isOpen && onCancel()}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-blue-600" />
                        Enable GPS Location?
                    </AlertDialogTitle>
                    <AlertDialogDescription className="space-y-4">
                        <p>
                            This allows Merkel Vision to show your current location on the map
                            and help you navigate to saved locations.
                        </p>

                        <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                            <div className="flex items-start gap-2">
                                <Shield className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                <div className="text-xs text-blue-900 dark:text-blue-100">
                                    <p className="font-semibold mb-1">Your Privacy Matters</p>
                                    <p>
                                        Your location is only used while the app is actively running.
                                        We never track your location in the background or store your
                                        coordinates unless you explicitly save a location.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <p className="text-xs text-muted-foreground">
                            You can change this setting anytime in Profile → Preferences.
                        </p>
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={onCancel}>
                        Not Now
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={onConfirm}
                        className="bg-blue-600 hover:bg-blue-700"
                    >
                        Enable GPS
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
