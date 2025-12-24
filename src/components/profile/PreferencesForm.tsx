'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Settings, Bell, Globe, Clock } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

// Validation schema
const preferencesSchema = z.object({
    emailNotifications: z.boolean(),
    language: z.string().optional(),
    timezone: z.string().optional(),
});

type PreferencesFormData = z.infer<typeof preferencesSchema>;

export function PreferencesForm() {
    const { user, refetchUser } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [emailNotifications, setEmailNotifications] = useState(user?.emailNotifications ?? true);
    const [language, setLanguage] = useState(user?.language || 'en');
    const [timezone, setTimezone] = useState(user?.timezone || 'America/New_York');

    const onSubmit = async () => {
        setIsLoading(true);

        try {
            const response = await fetch('/api/auth/profile', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    emailNotifications,
                    language,
                    timezone,
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                toast.error(result.error || 'Failed to update preferences');
                return;
            }

            toast.success('Preferences updated successfully');

            // Refresh user data
            await refetchUser();
        } catch (error) {
            console.error('Update preferences error:', error);
            toast.error('An unexpected error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card>
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

                {/* GPS Permission Status (Read-only) */}
                <div className="bg-muted rounded-lg p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium text-sm">GPS Permission</p>
                            <p className="text-sm text-muted-foreground mt-1">
                                Status: <span className="font-medium capitalize">{user?.gpsPermission || 'not_asked'}</span>
                            </p>
                        </div>
                        {user?.gpsPermissionUpdated && (
                            <p className="text-xs text-muted-foreground">
                                Updated {new Date(user.gpsPermissionUpdated).toLocaleDateString()}
                            </p>
                        )}
                    </div>
                </div>

                <Button
                    onClick={onSubmit}
                    className="w-full"
                    disabled={isLoading}
                >
                    {isLoading ? 'Saving...' : 'Save Preferences'}
                </Button>
            </CardContent>
        </Card>
    );
}
