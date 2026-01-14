'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Shield, Settings, Lock } from 'lucide-react';
import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { AccountSettingsForm } from '@/components/profile/AccountSettingsForm';
import { ChangeUsernameForm } from '@/components/profile/ChangeUsernameForm';
import { ChangePasswordForm } from '@/components/profile/ChangePasswordForm';
import { ChangeEmailForm } from '@/components/profile/ChangeEmailForm';
import { SecurityActivityLog } from '@/components/profile/SecurityActivityLog';
import { DeleteAccountSection } from '@/components/profile/DeleteAccountSection';
import { PreferencesForm } from '@/components/profile/PreferencesForm';
import PrivacySettingsPanel from '@/components/profile/PrivacySettingsPanel';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

function ProfilePageInner() {
    return (
        <div className="container max-w-6xl mx-auto py-8 px-4">
            <div className="mb-6">
                <h1 className="text-3xl font-bold">Member Profile Settings</h1>
                <p className="text-muted-foreground mt-1">
                    Security and Preferences for your account
                </p>
            </div>

            <Tabs defaultValue="account" className="space-y-4">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="account" className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        <span className="hidden sm:inline">Account</span>
                    </TabsTrigger>
                    <TabsTrigger value="privacy" className="flex items-center gap-2">
                        <Lock className="w-4 h-4" />
                        <span className="hidden sm:inline">Privacy</span>
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
                    <div className="max-w-2xl mx-auto space-y-4">
                        <ProfileHeader />
                        <AccountSettingsForm />
                    </div>
                </TabsContent>

                <TabsContent value="privacy" className="space-y-4">
                    <PrivacySettingsPanel />
                </TabsContent>

                <TabsContent value="security" className="space-y-4">
                    <div className="max-w-2xl mx-auto space-y-4">
                        <ChangeUsernameForm />
                        <ChangeEmailForm />
                        <ChangePasswordForm />
                        <SecurityActivityLog />
                        <DeleteAccountSection />
                    </div>
                </TabsContent>

                <TabsContent value="preferences" className="space-y-4">
                    <PreferencesForm />
                </TabsContent>
            </Tabs>
        </div>
    );
}

export default function ProfilePage() {
    return (
        <ProtectedRoute>
            <ProfilePageInner />
        </ProtectedRoute>
    );
}
