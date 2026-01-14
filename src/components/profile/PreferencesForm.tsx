'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Settings, Bell, Globe, Clock, MapPin, AlertCircle } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { HomeLocationSettings } from '@/components/profile/HomeLocationSettings';

export function PreferencesForm() {
    const { user, refetchUser } = useAuth();
    const [isLoading, setIsLoading] = useState(false);

    // Current values
    const [emailNotifications, setEmailNotifications] = useState(user?.emailNotifications ?? true);
    const [language, setLanguage] = useState(user?.language || 'en');
    const [timezone, setTimezone] = useState(user?.timezone || 'America/New_York');
    const [gpsPermission, setGpsPermission] = useState(user?.gpsPermission || 'not_asked');

    // Original values from server
    const [originalValues, setOriginalValues] = useState({
        emailNotifications: user?.emailNotifications ?? true,
        language: user?.language || 'en',
        timezone: user?.timezone || 'America/New_York',
        gpsPermission: user?.gpsPermission || 'not_asked',
    });

    // Track changes
    const [hasChanges, setHasChanges] = useState(false);
    const [changes, setChanges] = useState<string[]>([]);

    // Update original values when user data changes
    useEffect(() => {
        if (user) {
            const newOriginalValues = {
                emailNotifications: user?.emailNotifications ?? true,
                language: user?.language || 'en',
                timezone: user?.timezone || 'America/New_York',
                gpsPermission: user?.gpsPermission || 'not_asked',
            };
            setOriginalValues(newOriginalValues);
            setEmailNotifications(newOriginalValues.emailNotifications);
            setLanguage(newOriginalValues.language);
            setTimezone(newOriginalValues.timezone);
            setGpsPermission(newOriginalValues.gpsPermission);
        }
    }, [user]);

    // Detect changes
    useEffect(() => {
        const changedFields: string[] = [];

        if (emailNotifications !== originalValues.emailNotifications) {
            changedFields.push(`Email Notifications: ${emailNotifications ? 'Enabled' : 'Disabled'}`);
        }
        if (gpsPermission !== originalValues.gpsPermission) {
            const statusMap: any = { not_asked: 'Not Asked', granted: 'Granted', denied: 'Denied' };
            changedFields.push(`GPS Permission: ${statusMap[gpsPermission]}`);
        }
        if (language !== originalValues.language) {
            changedFields.push(`Language: ${language}`);
        }
        if (timezone !== originalValues.timezone) {
            changedFields.push(`Timezone: ${timezone}`);
        }

        setChanges(changedFields);
        setHasChanges(changedFields.length > 0);
    }, [emailNotifications, gpsPermission, language, timezone, originalValues]);

    const handleSave = async () => {
        setIsLoading(true);

        try {
            const response = await fetch('/api/auth/profile', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    emailNotifications,
                    language,
                    timezone,
                    gpsPermission,
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                toast.error(result.error || 'Failed to update preferences');
                return;
            }

            toast.success('Preferences saved successfully');

            // Update original values to current
            setOriginalValues({
                emailNotifications,
                language,
                timezone,
                gpsPermission,
            });

            // Refresh user data
            await refetchUser();
        } catch (error) {
            console.error('Update preferences error:', error);
            toast.error('An unexpected error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDiscard = () => {
        // Revert to original values
        setEmailNotifications(originalValues.emailNotifications);
        setGpsPermission(originalValues.gpsPermission);
        setLanguage(originalValues.language);
        setTimezone(originalValues.timezone);
        toast.info('Changes discarded');
    };

    return (
        <>
            {/* Home Location Settings - At Top */}
            <div className="max-w-2xl mx-auto">
                <HomeLocationSettings />
            </div>

            <Card className="max-w-2xl mx-auto">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Settings className="w-5 h-5" />
                        Preferences
                    </CardTitle>
                    <CardDescription>
                        Customize your experience and notifications
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Email Notifications */}
                    <div className="flex items-center justify-between space-x-2">
                        <div className="flex-1">
                            <div className="flex items-center gap-2">
                                <Bell className="w-4 h-4 text-muted-foreground" />
                                <Label htmlFor="emailNotifications" className="cursor-pointer">
                                    Email Notifications
                                </Label>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                                Receive email notifications for security alerts and important updates
                            </p>
                        </div>
                        <Switch
                            id="emailNotifications"
                            checked={emailNotifications}
                            onCheckedChange={setEmailNotifications}
                            disabled={isLoading}
                        />
                    </div>

                    {/* Language */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <Globe className="w-4 h-4 text-muted-foreground" />
                            <Label htmlFor="language">Language</Label>
                        </div>
                        <Select
                            value={language}
                            onValueChange={setLanguage}
                            disabled={isLoading}
                        >
                            <SelectTrigger id="language">
                                <SelectValue placeholder="Select language" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="en">English</SelectItem>
                                <SelectItem value="es">Español</SelectItem>
                                <SelectItem value="fr">Français</SelectItem>
                                <SelectItem value="de">Deutsch</SelectItem>
                                <SelectItem value="it">Italiano</SelectItem>
                                <SelectItem value="pt">Português</SelectItem>
                                <SelectItem value="ja">日本語</SelectItem>
                                <SelectItem value="zh">中文</SelectItem>
                            </SelectContent>
                        </Select>
                        <p className="text-sm text-muted-foreground">
                            Choose your preferred language for the interface
                        </p>
                    </div>

                    {/* Timezone */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-muted-foreground" />
                            <Label htmlFor="timezone">Timezone</Label>
                        </div>
                        <Select
                            value={timezone}
                            onValueChange={setTimezone}
                            disabled={isLoading}
                        >
                            <SelectTrigger id="timezone">
                                <SelectValue placeholder="Select timezone" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                                <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                                <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                                <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                                <SelectItem value="America/Anchorage">Alaska Time (AKT)</SelectItem>
                                <SelectItem value="Pacific/Honolulu">Hawaii Time (HT)</SelectItem>
                                <SelectItem value="Europe/London">London (GMT)</SelectItem>
                                <SelectItem value="Europe/Paris">Paris (CET)</SelectItem>
                                <SelectItem value="Europe/Berlin">Berlin (CET)</SelectItem>
                                <SelectItem value="Asia/Tokyo">Tokyo (JST)</SelectItem>
                                <SelectItem value="Asia/Shanghai">Shanghai (CST)</SelectItem>
                                <SelectItem value="Australia/Sydney">Sydney (AEDT)</SelectItem>
                            </SelectContent>
                        </Select>
                        <p className="text-sm text-muted-foreground">
                            Your timezone for displaying dates and times
                        </p>
                    </div>

                    {/* GPS Permission Toggle */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between space-x-2">
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <MapPin className="w-4 h-4 text-muted-foreground" />
                                    <Label htmlFor="gpsPermission" className="cursor-pointer">
                                        GPS Permission
                                    </Label>
                                </div>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Allow access to device GPS location
                                </p>
                            </div>
                            <Switch
                                id="gpsPermission"
                                checked={gpsPermission === 'granted'}
                                onCheckedChange={(checked) => setGpsPermission(checked ? 'granted' : 'denied')}
                                disabled={isLoading}
                            />
                        </div>
                        <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                            <p className="text-xs text-blue-900 dark:text-blue-100">
                                <span className="font-semibold">Privacy Note:</span> Device GPS data is only used while the app is actively running. We never track your location in the background.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Unsaved Changes Banner */}
            {hasChanges && (
                <div className="fixed bottom-0 left-0 right-0 bg-amber-50 dark:bg-amber-950/20 border-t-2 border-amber-500 p-4 shadow-lg z-50 animate-in slide-in-from-bottom">
                    <div className="container max-w-6xl mx-auto">
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                    <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-500" />
                                    <p className="font-semibold text-amber-900 dark:text-amber-100">
                                        You have unsaved changes
                                    </p>
                                </div>
                                <ul className="text-sm text-amber-800 dark:text-amber-200 space-y-1">
                                    {changes.map((change, i) => (
                                        <li key={i}>• {change}</li>
                                    ))}
                                </ul>
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleDiscard}
                                    disabled={isLoading}
                                    className="border-amber-300 dark:border-amber-700"
                                >
                                    Discard
                                </Button>
                                <Button
                                    size="sm"
                                    onClick={handleSave}
                                    disabled={isLoading}
                                    className="bg-green-600 hover:bg-green-700 text-white"
                                >
                                    {isLoading ? 'Saving...' : 'Save Changes'}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
