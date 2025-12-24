'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Shield, Settings } from 'lucide-react';
import { AccountSettingsForm } from '@/components/profile/AccountSettingsForm';
import { ChangePasswordForm } from '@/components/profile/ChangePasswordForm';
import { SecurityActivityLog } from '@/components/profile/SecurityActivityLog';
import { PreferencesForm } from '@/components/profile/PreferencesForm';

export default function ProfilePage() {
    return (
        <div className="container max-w-6xl mx-auto py-8 px-4">
            <div className="mb-6">
                <h1 className="text-3xl font-bold">Profile Settings</h1>
                <p className="text-muted-foreground mt-1">
                    Manage your account, security, and preferences
                </p>
            </div>

            <Tabs defaultValue="account" className="space-y-4">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="account" className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        <span className="hidden sm:inline">Account</span>
                    </TabsTrigger>
                    <TabsTrigger value="security" className="flex items-center gap-2">
                        <Shield className="w-4 h-4" />
                        <span className="hidden sm:inline">Security</span>
                    </TabsTrigger>
                    <TabsTrigger value="preferences" className="flex items-center gap-2">
                        <Settings className="w-4 h-4" />
                        <span className="hidden sm:inline">Preferences</span>
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="account" className="space-y-4">
                    <AccountSettingsForm />
                </TabsContent>

                <TabsContent value="security" className="space-y-4">
                    <ChangePasswordForm />
                    <SecurityActivityLog />
                </TabsContent>

                <TabsContent value="preferences" className="space-y-4">
                    <PreferencesForm />
                </TabsContent>
            </Tabs>
        </div>
    );
}
