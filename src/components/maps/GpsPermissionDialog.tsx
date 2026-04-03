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
                        <MapPin className="w-5 h-5 text-primary" />
                        Enable GPS Location?
                    </AlertDialogTitle>
                    <AlertDialogDescription className="space-y-4" asChild>
                        <div className="text-muted-foreground text-sm space-y-4">
                            <p>
                                Fotolokashen uses your GPS data to be precises in creating your location markers.
                            </p>

                            <div className="bg-primary/10 dark:bg-primary/10 border border-primary/20 dark:border-primary rounded-lg p-3">
                                <div className="flex items-start gap-2">
                                    <Shield className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                                    <div className="text-xs text-primary dark:text-primary-foreground">
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
                        </div>
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={onCancel}>
                        Not Now
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={onConfirm}
                        className="bg-primary hover:bg-primary/90"
                    >
                        Enable GPS
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
