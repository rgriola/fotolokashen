'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { AdminRoute } from '@/components/auth/AdminRoute';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
    Monitor,
    Tablet,
    Smartphone,
    Copy,
    RotateCcw,
    Mail,
    Download,
    Users,
    MailIcon,
} from 'lucide-react';
import {
    EMAIL_TEMPLATES,
    DEVICE_SIZES,
    DEFAULT_CUSTOMIZATION,
    generatePreviewData,
    applyCustomizations,
    exportCustomizations,
    makeNonInteractive,
    type EmailTemplateType,
    type DeviceSize,
    type EmailCustomization,
} from '@/lib/email-preview-utils';
import {
    verificationEmailTemplate,
    passwordResetEmailTemplate,
    passwordChangedEmailTemplate,
    accountDeletionEmailTemplate,
} from '@/lib/email-templates';

export default function EmailPreviewPage() {
    const router = useRouter();
    const { user } = useAuth();
    const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplateType>('verification');
    const [deviceSize, setDeviceSize] = useState<DeviceSize>('web');
    const [customization, setCustomization] = useState<EmailCustomization>(DEFAULT_CUSTOMIZATION);

    const previewData = generatePreviewData(user || {});
    const selectedTemplateInfo = EMAIL_TEMPLATES.find((t) => t.value === selectedTemplate)!;

    // Generate email HTML based on selected template
    const generateEmailHTML = (): string => {
        let html = '';

        switch (selectedTemplate) {
            case 'verification':
                html = verificationEmailTemplate(previewData.username, previewData.verificationUrl);
                break;
            case 'welcomeTo':
                html = verificationEmailTemplate(previewData.username, previewData.verificationUrl);
                break;
            case 'passwordReset':
                html = passwordResetEmailTemplate(previewData.username, previewData.resetUrl);
                break;
            case 'passwordChanged':
                html = passwordChangedEmailTemplate(
                    previewData.username,
                    previewData.timestamp,
                    previewData.ipAddress
                );
                break;
            case 'accountDeletion':
                html = accountDeletionEmailTemplate(previewData.username, previewData.email);
                break;
        }

        // Apply customizations
        html = applyCustomizations(html, customization);

        // Make non-interactive
        html = makeNonInteractive(html);

        return html;
    };

    const emailHTML = generateEmailHTML();

    const handleCopyHTML = () => {
        navigator.clipboard.writeText(emailHTML);
        toast.success('Email HTML copied to clipboard!');
    };

    const handleReset = () => {
        setCustomization(DEFAULT_CUSTOMIZATION);
        toast.success('Reset to default settings');
    };

    const handleExport = () => {
        const json = exportCustomizations(customization);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `email-customization-${selectedTemplate}.json`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success('Settings exported!');
    };

    const handleSendTest = async () => {
        toast.info('Test email feature coming soon!');
    };

    const deviceIcons = {
        web: Monitor,
        tablet: Tablet,
        mobile: Smartphone,
    };

    return (
        <AdminRoute>
            <div className="container max-w-7xl mx-auto py-8 px-4">
                {/* Header with Navigation */}
                <div className="mb-6">
                    <h1 className="text-3xl font-bold">Admin Panel</h1>
                    <p className="text-muted-foreground mt-1">
                        Manage users and system settings
                    </p>
                </div>

                {/* Admin Navigation Tabs */}
                <div className="mb-6">
                    <div className="flex gap-2 border-b">
                        <Button
                            variant="ghost"
                            onClick={() => router.push('/admin/users')}
                            className="rounded-b-none"
                        >
                            <Users className="w-4 h-4 mr-2" />
                            Users
                        </Button>
                        <Button
                            variant="ghost"
                            className="rounded-b-none border-b-2 border-primary"
                        >
                            <MailIcon className="w-4 h-4 mr-2" />
                            Email Preview
                        </Button>
                    </div>
                </div>

                {/* Page Title */}
                <div className="mb-6">
                    <h2 className="text-2xl font-bold">📧 Email Template Preview</h2>
                    <p className="text-muted-foreground mt-1">
                        View and customize email templates with live preview
                    </p>
                </div>

                {/* Template & Device Selector */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <Card>
                        <CardContent className="pt-6">
                            <Label>Email Template</Label>
                            <Select value={selectedTemplate} onValueChange={(v) => setSelectedTemplate(v as EmailTemplateType)}>
                                <SelectTrigger className="mt-2">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {EMAIL_TEMPLATES.map((template) => (
                                        <SelectItem key={template.value} value={template.value}>
                                            {template.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-6">
                            <Label>Device Preview</Label>
                            <div className="flex gap-2 mt-2">
                                {(Object.keys(DEVICE_SIZES) as DeviceSize[]).map((size) => {
                                    const Icon = deviceIcons[size];
                                    return (
                                        <Button
                                            key={size}
                                            variant={deviceSize === size ? 'default' : 'outline'}
                                            onClick={() => setDeviceSize(size)}
                                            className="flex-1"
                                        >
                                            <Icon className="w-4 h-4 mr-2" />
                                            {DEVICE_SIZES[size].label}
                                        </Button>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Content */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Panel - Customization */}
                    <div className="lg:col-span-1">
                        <Card>
                            <CardHeader>
                                <CardTitle>Customization</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <Tabs defaultValue="text">
                                    <TabsList className="grid w-full grid-cols-2">
                                        <TabsTrigger value="text">📝 Text</TabsTrigger>
                                        <TabsTrigger value="colors">🎨 Colors</TabsTrigger>
                                    </TabsList>

                                    <TabsContent value="text" className="space-y-4 mt-4">
                                        <div>
                                            <Label htmlFor="brandName">Brand Name</Label>
                                            <Input
                                                id="brandName"
                                                value={customization.brandName}
                                                onChange={(e) =>
                                                    setCustomization({ ...customization, brandName: e.target.value })
                                                }
                                                className="mt-2"
                                            />
                                        </div>

                                        <div>
                                            <Label htmlFor="subject">Email Subject</Label>
                                            <Input
                                                id="subject"
                                                value={customization.subject || selectedTemplateInfo.subject}
                                                onChange={(e) =>
                                                    setCustomization({ ...customization, subject: e.target.value })
                                                }
                                                className="mt-2"
                                                placeholder={selectedTemplateInfo.subject}
                                            />
                                        </div>
                                    </TabsContent>

                                    <TabsContent value="colors" className="space-y-4 mt-4">
                                        <div>
                                            <Label htmlFor="brandColor">Primary Brand Color</Label>
                                            <div className="flex gap-2 mt-2">
                                                <Input
                                                    id="brandColor"
                                                    type="color"
                                                    value={customization.brandColor}
                                                    onChange={(e) =>
                                                        setCustomization({ ...customization, brandColor: e.target.value })
                                                    }
                                                    className="w-20 h-10"
                                                />
                                                <Input
                                                    value={customization.brandColor}
                                                    onChange={(e) =>
                                                        setCustomization({ ...customization, brandColor: e.target.value })
                                                    }
                                                    className="flex-1"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <Label htmlFor="headerStart">Header Gradient Start</Label>
                                            <div className="flex gap-2 mt-2">
                                                <Input
                                                    id="headerStart"
                                                    type="color"
                                                    value={customization.headerGradientStart}
                                                    onChange={(e) =>
                                                        setCustomization({
                                                            ...customization,
                                                            headerGradientStart: e.target.value,
                                                        })
                                                    }
                                                    className="w-20 h-10"
                                                />
                                                <Input
                                                    value={customization.headerGradientStart}
                                                    onChange={(e) =>
                                                        setCustomization({
                                                            ...customization,
                                                            headerGradientStart: e.target.value,
                                                        })
                                                    }
                                                    className="flex-1"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <Label htmlFor="headerEnd">Header Gradient End</Label>
                                            <div className="flex gap-2 mt-2">
                                                <Input
                                                    id="headerEnd"
                                                    type="color"
                                                    value={customization.headerGradientEnd}
                                                    onChange={(e) =>
                                                        setCustomization({
                                                            ...customization,
                                                            headerGradientEnd: e.target.value,
                                                        })
                                                    }
                                                    className="w-20 h-10"
                                                />
                                                <Input
                                                    value={customization.headerGradientEnd}
                                                    onChange={(e) =>
                                                        setCustomization({
                                                            ...customization,
                                                            headerGradientEnd: e.target.value,
                                                        })
                                                    }
                                                    className="flex-1"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <Label htmlFor="buttonColor">Button Color</Label>
                                            <div className="flex gap-2 mt-2">
                                                <Input
                                                    id="buttonColor"
                                                    type="color"
                                                    value={customization.buttonColor}
                                                    onChange={(e) =>
                                                        setCustomization({ ...customization, buttonColor: e.target.value })
                                                    }
                                                    className="w-20 h-10"
                                                />
                                                <Input
                                                    value={customization.buttonColor}
                                                    onChange={(e) =>
                                                        setCustomization({ ...customization, buttonColor: e.target.value })
                                                    }
                                                    className="flex-1"
                                                />
                                            </div>
                                        </div>
                                    </TabsContent>
                                </Tabs>

                                {/* Actions */}
                                <div className="pt-4 border-t space-y-2">
                                    <Button variant="outline" onClick={handleReset} className="w-full">
                                        <RotateCcw className="w-4 h-4 mr-2" />
                                        Reset to Default
                                    </Button>
                                    <Button variant="outline" onClick={handleCopyHTML} className="w-full">
                                        <Copy className="w-4 h-4 mr-2" />
                                        Copy HTML
                                    </Button>
                                    <Button variant="outline" onClick={handleSendTest} className="w-full">
                                        <Mail className="w-4 h-4 mr-2" />
                                        Send Test Email
                                    </Button>
                                    <Button variant="outline" onClick={handleExport} className="w-full">
                                        <Download className="w-4 h-4 mr-2" />
                                        Export Settings
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Panel - Preview */}
                    <div className="lg:col-span-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>
                                    Preview - {selectedTemplateInfo.label}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="bg-muted p-4 rounded-lg flex justify-center">
                                    <div
                                        style={{
                                            width: `${DEVICE_SIZES[deviceSize].width}px`,
                                            maxWidth: '100%',
                                        }}
                                    >
                                        <iframe
                                            srcDoc={emailHTML}
                                            className="w-full border-2 border-border rounded-lg bg-white"
                                            style={{
                                                height: '600px',
                                                pointerEvents: 'none',
                                            }}
                                            title="Email Preview"
                                            sandbox="allow-same-origin"
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AdminRoute>
    );
}
