'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, X } from 'lucide-react';

interface GpsWelcomeBannerProps {
    onEnable: () => void;
    onDismiss: () => void;
}

export function GpsWelcomeBanner({ onEnable, onDismiss }: GpsWelcomeBannerProps) {
    const [visible, setVisible] = useState(true);

    const handleDismiss = () => {
        setVisible(false);
        onDismiss();
    };

    const handleEnable = () => {
        setVisible(false);
        onEnable();
    };

    if (!visible) return null;

    return (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 max-w-md w-full px-4 animate-in slide-in-from-top">
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 border-blue-300 dark:border-blue-700 shadow-lg">
                <CardContent className="pt-4 pb-4">
                    <div className="flex items-start gap-3">
                        <div className="bg-blue-600 rounded-full p-2">
                            <MapPin className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1">
                            <p className="font-semibold text-sm text-blue-900 dark:text-blue-100">
                                Enable GPS to find your location
                            </p>
                            <p className="text-xs text-blue-800 dark:text-blue-200 mt-1">
                                Quickly navigate to your current position on the map
                            </p>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleDismiss}
                            className="h-auto p-1 hover:bg-blue-100 dark:hover:bg-blue-900"
                        >
                            <X className="w-4 h-4" />
                        </Button>
                    </div>
                    <div className="flex gap-2 mt-3 ml-11">
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={handleDismiss}
                            className="text-xs border-blue-300 dark:border-blue-700"
                        >
                            Maybe Later
                        </Button>
                        <Button
                            size="sm"
                            onClick={handleEnable}
                            className="text-xs bg-blue-600 hover:bg-blue-700 text-white"
                        >
                            Enable GPS
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
