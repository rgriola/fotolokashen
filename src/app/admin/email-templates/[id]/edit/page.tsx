'use client';

import { useState, useEffect, use, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
// import Image from 'next/image'; // Disabled - for header image feature
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AdminRoute } from '@/components/auth/AdminRoute';
import { ArrowLeft, Save, Send, Eye, Settings, Palette, ImageIcon, Monitor, Tablet, Smartphone, Copy, Info, Code } from 'lucide-react';
import { toast } from 'sonner';
import { HexColorPicker } from 'react-colorful';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

// Device sizes for responsive preview
const DEVICE_SIZES = {
  web: { width: 600, label: 'Desktop' },
  tablet: { width: 480, label: 'Tablet' },
  mobile: { width: 320, label: 'Mobile' },
} as const;

type DeviceSize = keyof typeof DEVICE_SIZES;

// Dynamically import Monaco Editor to avoid SSR issues
const Editor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-125 border rounded-md bg-gray-900">
      <p className="text-gray-400">Loading editor...</p>
    </div>
  ),
});

interface TemplateData {
  id?: number;
  key: string;
  name: string;
  description: string;
  category: string;
  subject: string;
  htmlBody: string;
  brandColor: string;
  headerGradientStart: string;
  headerGradientEnd: string;
  buttonColor: string;
  headerImageUrl: string;
  requiredVariables: string[];
  isActive: boolean;
}

export default function EmailTemplateEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);
  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');
  const [template, setTemplate] = useState<TemplateData>({
    key: '',
    name: '',
    description: '',
    category: 'system',
    subject: '',
    htmlBody: '',
    brandColor: '#4285f4',
    headerGradientStart: '#4285f4',
    headerGradientEnd: '#5a67d8',
    buttonColor: '#4285f4',
    headerImageUrl: '',
    requiredVariables: [],
    isActive: true,
  });
  const [showColorPicker, setShowColorPicker] = useState<string | null>(null);
  const [settingsTab, setSettingsTab] = useState<'settings' | 'colors' | 'header'>('settings');
  const [deviceSize, setDeviceSize] = useState<DeviceSize>('web');
  // Header image feature disabled - uncomment when ready
  // const [uploadingImage, setUploadingImage] = useState(false);
  // const fileInputRef = useRef<HTMLInputElement>(null);
  const [keyError, setKeyError] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [subjectError, setSubjectError] = useState<string | null>(null);

  // Validation regex: lowercase letters, numbers, underscores, and hyphens only
  const TEMPLATE_KEY_REGEX = /^[a-z0-9_-]+$/;

  const validateTemplateKey = (key: string): string | null => {
    if (!key) return null; // Don't show error for empty (will be caught on save)
    if (!TEMPLATE_KEY_REGEX.test(key)) {
      return 'Only lowercase letters, numbers, underscores, and hyphens allowed';
    }
    if (key.length < 2) {
      return 'Key must be at least 2 characters';
    }
    if (key.length > 50) {
      return 'Key must be 50 characters or less';
    }
    return null;
  };

  const validateTemplateName = (name: string): string | null => {
    if (!name) return null;
    if (name.length < 2) {
      return 'Name must be at least 2 characters';
    }
    if (name.length > 100) {
      return 'Name must be 100 characters or less';
    }
    return null;
  };

  const validateSubject = (subject: string): string | null => {
    if (!subject) return null;
    if (subject.length < 2) {
      return 'Subject must be at least 2 characters';
    }
    if (subject.length > 200) {
      return 'Subject must be 200 characters or less';
    }
    return null;
  };

  const handleKeyChange = (value: string) => {
    // Auto-convert to lowercase and replace spaces with underscores
    const sanitized = value.toLowerCase().replace(/\s+/g, '_');
    setTemplate({ ...template, key: sanitized });
    setKeyError(validateTemplateKey(sanitized));
  };

  const handleNameChange = (value: string) => {
    setTemplate({ ...template, name: value });
    setNameError(validateTemplateName(value));
  };

  const handleSubjectChange = (value: string) => {
    setTemplate({ ...template, subject: value });
    setSubjectError(validateSubject(value));
  };

  // Header image upload feature disabled - uncomment when ready
  /*
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be less than 2MB');
      return;
    }

    try {
      setUploadingImage(true);

      // Get upload auth from server
      const authResponse = await fetch('/api/imagekit/auth');
      if (!authResponse.ok) throw new Error('Failed to get upload authorization');
      const authData = await authResponse.json();

      // Upload to ImageKit
      const formData = new FormData();
      formData.append('file', file);
      formData.append('fileName', `email-header-${Date.now()}`);
      formData.append('folder', '/email-templates/headers');
      formData.append('publicKey', authData.publicKey);
      formData.append('signature', authData.signature);
      formData.append('expire', authData.expire.toString());
      formData.append('token', authData.token);

      const uploadResponse = await fetch('https://upload.imagekit.io/api/v1/files/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) throw new Error('Failed to upload image');
      
      const uploadResult = await uploadResponse.json();
      setTemplate({ ...template, headerImageUrl: uploadResult.url });
      toast.success('Header image uploaded successfully');
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image');
    } finally {
      setUploadingImage(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveImage = () => {
    setTemplate({ ...template, headerImageUrl: '' });
    toast.success('Header image removed');
  };
  */

  const fetchTemplate = useCallback(async () => {
    try {
      const response = await fetch(`/api/admin/email-templates/${resolvedParams.id}`);
      if (!response.ok) throw new Error('Failed to fetch template');
      
      const data = await response.json();
      setTemplate(data.template);
    } catch (error) {
      console.error('Error fetching template:', error);
      toast.error('Failed to load template');
    } finally {
      setLoading(false);
    }
  }, [resolvedParams.id]);

  useEffect(() => {
    if (resolvedParams.id !== 'new') {
      fetchTemplate();
    } else {
      setLoading(false);
    }
  }, [resolvedParams.id, fetchTemplate]);

  const handleSave = async () => {
    // Check for specific missing required fields
    const missingFields: string[] = [];
    
    if (!template.key?.trim()) {
      missingFields.push('Template Key');
      setKeyError('Template Key is required');
    }
    if (!template.name?.trim()) {
      missingFields.push('Template Name');
      setNameError('Template Name is required');
    }
    if (!template.subject?.trim()) {
      missingFields.push('Subject Line');
      setSubjectError('Subject Line is required');
    }
    if (!template.htmlBody?.trim()) {
      missingFields.push('HTML Body');
    }

    if (missingFields.length > 0) {
      if (missingFields.length === 1) {
        toast.error(`${missingFields[0]} is required`);
      } else {
        toast.error(`Missing required fields: ${missingFields.join(', ')}`);
      }
      
      // Switch to editor tab if HTML body is missing
      if (!template.htmlBody?.trim()) {
        setActiveTab('editor');
      }
      return;
    }

    // Validate all fields for format/length
    const keyValidationError = validateTemplateKey(template.key);
    const nameValidationError = validateTemplateName(template.name);
    const subjectValidationError = validateSubject(template.subject);

    if (keyValidationError) {
      toast.error(`Template Key: ${keyValidationError}`);
      setKeyError(keyValidationError);
      return;
    }

    if (nameValidationError) {
      toast.error(`Template Name: ${nameValidationError}`);
      setNameError(nameValidationError);
      return;
    }

    if (subjectValidationError) {
      toast.error(`Subject Line: ${subjectValidationError}`);
      setSubjectError(subjectValidationError);
      return;
    }

    try {
      setSaving(true);
      const isNew = resolvedParams.id === 'new';
      const url = isNew
        ? '/api/admin/email-templates'
        : `/api/admin/email-templates/${resolvedParams.id}`;
      const method = isNew ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(template),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save template');
      }

      toast.success(isNew ? 'Template created successfully' : 'Template updated successfully');
      router.push('/admin/email-templates');
    } catch (error) {
      console.error('Error saving template:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save template');
    } finally {
      setSaving(false);
    }
  };

  const handleSendTest = async () => {
    if (!template.id) {
      toast.error('Please save the template first');
      return;
    }

    // Confirm with user that test email goes to their account
    const confirmed = window.confirm(
      'This will send a test email to your account email address.\n\nDo you want to continue?'
    );
    if (!confirmed) return;

    try {
      setSendingTest(true);
      const response = await fetch(`/api/admin/email-templates/${template.id}/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ variables: {} }),
      });

      if (!response.ok) throw new Error('Failed to send test email');

      toast.success('Test email sent to your account');
    } catch (error) {
      console.error('Error sending test email:', error);
      toast.error('Failed to send test email');
    } finally {
      setSendingTest(false);
    }
  };

  const handleCopyHTML = () => {
    navigator.clipboard.writeText(template.htmlBody);
    toast.success('HTML copied to clipboard');
  };

  // Device icons mapping
  const deviceIcons = {
    web: Monitor,
    tablet: Tablet,
    mobile: Smartphone,
  };

  if (loading) {
    return (
      <AdminRoute>
        <div className="container max-w-7xl mx-auto py-8 px-4">
          <p>Loading...</p>
        </div>
      </AdminRoute>
    );
  }

  return (
    <AdminRoute>
      <div className="container max-w-7xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/admin/email-templates')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold">
                {resolvedParams.id === 'new' ? 'Create Template' : 'Edit Template'}
              </h1>
              <p className="text-muted-foreground mt-1">
                {resolvedParams.id === 'new'
                  ? 'Create a new email template'
                  : `Editing: ${template.name}`}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {/* Info Dialog */}
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="icon" title="Editor Help">
                  <Info className="w-4 h-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Code className="w-5 h-5" />
                    Email Template Editor
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 text-sm">
                  <div>
                    <h4 className="font-semibold mb-1">Dynamic Variables</h4>
                    <p className="text-muted-foreground">
                      Use <code className="bg-muted px-1 rounded">{`{{variableName}}`}</code> syntax to insert dynamic content that will be replaced when the email is sent.
                    </p>
                    <div className="mt-2 bg-muted p-2 rounded text-xs font-mono">
                      {`{{username}}`} • {`{{verificationUrl}}`} • {`{{resetUrl}}`}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Settings Tab</h4>
                    <p className="text-muted-foreground">
                      Configure template key (unique identifier), name, description, category, and subject line.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Colors Tab</h4>
                    <p className="text-muted-foreground">
                      Customize brand colors, button colors, and header gradient. Click color swatches to open the color picker.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Preview</h4>
                    <p className="text-muted-foreground">
                      Test how your email looks on different devices (Desktop, Tablet, Mobile). Use Copy HTML to export the template.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Send Test</h4>
                    <p className="text-muted-foreground">
                      Sends a test email to your account email address with sample data.
                    </p>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            {template.id && (
              <Button
                variant="outline"
                onClick={handleSendTest}
                disabled={sendingTest}
              >
                <Send className="w-4 h-4 mr-2" />
                {sendingTest ? 'Sending...' : 'Send Test'}
              </Button>
            )}
            <Button onClick={handleSave} disabled={saving}>
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Left Column - Settings, Colors & Header Image */}
          <div className="xl:col-span-1">
            <Card className="p-4">
              <Tabs value={settingsTab} onValueChange={(v) => setSettingsTab(v as 'settings' | 'colors' | 'header')}>
                <TabsList className="grid w-full grid-cols-3 mb-3">
                  <TabsTrigger value="settings" className="gap-1 text-xs">
                    <Settings className="w-3 h-3" />
                    <span className="hidden sm:inline">Settings</span>
                  </TabsTrigger>
                  <TabsTrigger value="colors" className="gap-1 text-xs">
                    <Palette className="w-3 h-3" />
                    <span className="hidden sm:inline">Colors</span>
                  </TabsTrigger>
                  <TabsTrigger value="header" className="gap-1 text-xs" disabled>
                    <ImageIcon className="w-3 h-3" />
                    <span className="hidden sm:inline text-muted-foreground">Header</span>
                  </TabsTrigger>
                </TabsList>

                {/* Settings Tab */}
                <TabsContent value="settings" className="space-y-3 mt-0">
                  <div>
                    <Label htmlFor="key" className="text-xs">Template Key *</Label>
                    <Input
                      id="key"
                      value={template.key}
                      onChange={(e) => handleKeyChange(e.target.value)}
                      placeholder="e.g., verification, welcome"
                      disabled={resolvedParams.id !== 'new'}
                      className={`h-8 text-sm ${keyError ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                    />
                    {keyError ? (
                      <p className="text-[10px] text-red-500 mt-0.5">{keyError}</p>
                    ) : (
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        Lowercase, numbers, underscores, hyphens only
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="name" className="text-xs">Template Name *</Label>
                    <Input
                      id="name"
                      value={template.name}
                      onChange={(e) => handleNameChange(e.target.value)}
                      placeholder="e.g., Email Verification"
                      maxLength={100}
                      className={`h-8 text-sm ${nameError ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                    />
                    {nameError ? (
                      <p className="text-[10px] text-red-500 mt-0.5">{nameError}</p>
                    ) : (
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {template.name.length}/100
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="description" className="text-xs">Description</Label>
                    <Textarea
                      id="description"
                      value={template.description}
                      onChange={(e) => setTemplate({ ...template, description: e.target.value })}
                      placeholder="Purpose of this template"
                      rows={2}
                      maxLength={500}
                      className="text-sm resize-none"
                    />
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {template.description.length}/500
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="category" className="text-xs">Category</Label>
                    <Select
                      value={template.category}
                      onValueChange={(value) => setTemplate({ ...template, category: value })}
                    >
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="system">System</SelectItem>
                        <SelectItem value="notification">Notification</SelectItem>
                        <SelectItem value="campaign">Campaign</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="subject" className="text-xs">Subject Line *</Label>
                    <Input
                      id="subject"
                      value={template.subject}
                      onChange={(e) => handleSubjectChange(e.target.value)}
                      placeholder="e.g., Please verify your email"
                      maxLength={200}
                      className={`h-8 text-sm ${subjectError ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                    />
                    {subjectError ? (
                      <p className="text-[10px] text-red-500 mt-0.5">{subjectError}</p>
                    ) : (
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        Use {`{{var}}`} for dynamic content ({template.subject.length}/200)
                      </p>
                    )}
                  </div>
                </TabsContent>

                {/* Colors Tab */}
                <TabsContent value="colors" className="space-y-3 mt-0">
                  {[
                    { key: 'brandColor', label: 'Primary Brand' },
                    { key: 'buttonColor', label: 'Button' },
                    { key: 'headerGradientStart', label: 'Header Start' },
                    { key: 'headerGradientEnd', label: 'Header End' },
                  ].map(({ key, label }) => (
                    <div key={key}>
                      <Label className="text-xs">{label}</Label>
                      <div className="flex gap-2 mt-0.5">
                        <div
                          className="w-8 h-8 rounded border cursor-pointer shrink-0 transition-transform hover:scale-105"
                          style={{ backgroundColor: template[key as keyof TemplateData] as string }}
                          onClick={() => setShowColorPicker(showColorPicker === key ? null : key)}
                        />
                        <Input
                          value={template[key as keyof TemplateData] as string}
                          onChange={(e) => setTemplate({ ...template, [key]: e.target.value })}
                          placeholder="#4285f4"
                          className="h-8 text-sm font-mono"
                        />
                      </div>
                      {showColorPicker === key && (
                        <div className="mt-2 color-picker-wide">
                          <HexColorPicker
                            color={template[key as keyof TemplateData] as string}
                            onChange={(color) => setTemplate({ ...template, [key]: color })}
                            style={{ width: '100%', height: '150px' }}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </TabsContent>

                {/* Header Image Tab - Disabled for now */}
                <TabsContent value="header" className="space-y-3 mt-0">
                  <div className="text-center py-8 text-muted-foreground">
                    <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Header image upload coming soon</p>
                  </div>
                </TabsContent>
              </Tabs>
            </Card>
          </div>

          {/* Middle Column - HTML Editor with Tabs */}
          <div className="xl:col-span-2 space-y-6">
            <Card className="p-6">
              {/* Tab Headers with Device Preview and Copy HTML */}
              <div className="flex items-center justify-between border-b mb-4">
                {/* Left: Editor/Preview Tabs */}
                <div className="flex">
                  <button
                    className={`px-4 py-2 font-semibold transition-colors flex items-center gap-2 ${
                      activeTab === 'editor'
                        ? 'border-b-2 border-blue-600 text-blue-600'
                        : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
                    }`}
                    onClick={() => setActiveTab('editor')}
                  >
                    <Code className="w-4 h-4" />
                    HTML
                  </button>
                  <button
                    className={`px-4 py-2 font-semibold transition-colors flex items-center gap-2 ${
                      activeTab === 'preview'
                        ? 'border-b-2 border-blue-600 text-blue-600'
                        : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
                    }`}
                    onClick={() => setActiveTab('preview')}
                  >
                    <Eye className="w-4 h-4" />
                    Preview
                  </button>
                </div>

                {/* Right: Device Toggles and Copy HTML */}
                <div className="flex items-center gap-2 pb-1">
                  {/* Device Preview Buttons (styled as mini tabs) */}
                  <div className="flex border rounded-md overflow-hidden">
                    {(Object.keys(DEVICE_SIZES) as DeviceSize[]).map((size) => {
                      const Icon = deviceIcons[size];
                      return (
                        <button
                          key={size}
                          onClick={() => setDeviceSize(size)}
                          className={`px-2 py-1.5 transition-colors ${
                            deviceSize === size
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                          }`}
                          title={`${DEVICE_SIZES[size].label} (${DEVICE_SIZES[size].width}px)`}
                        >
                          <Icon className="w-4 h-4" />
                        </button>
                      );
                    })}
                  </div>
                  
                  {/* Copy HTML Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyHTML}
                    className="h-8"
                  >
                    <Copy className="w-4 h-4 mr-1" />
                    Copy
                  </Button>
                </div>
              </div>

              {/* Tab Content */}
              {activeTab === 'editor' ? (
                <>
                  <div className="border rounded-md overflow-hidden" style={{ height: '600px' }}>
                    {!loading && (
                      <Editor
                        key={`editor-${resolvedParams.id}`}
                        height="600px"
                        defaultLanguage="html"
                        defaultValue={template.htmlBody}
                        onChange={(value) => setTemplate({ ...template, htmlBody: value || '' })}
                        onMount={(editor) => {
                          console.log('Monaco editor mounted');
                          editor.setValue(template.htmlBody);
                        }}
                        onValidate={(markers) => {
                          if (markers.length > 0) {
                            console.log('Monaco validation markers:', markers);
                          }
                        }}
                        theme="vs-dark"
                        options={{
                          minimap: { enabled: false },
                          fontSize: 14,
                          wordWrap: 'on',
                          formatOnPaste: true,
                          formatOnType: true,
                          automaticLayout: true,
                          scrollBeyondLastLine: false,
                          renderWhitespace: 'selection',
                        }}
                      />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Use {`{{variableName}}`} for dynamic content. Click the <Info className="w-3 h-3 inline" /> button above for help.
                  </p>
                </>
              ) : (
                <div>
                  {/* Preview Iframe */}
                  <div 
                    className="border rounded-md bg-muted p-4 flex justify-center overflow-auto" 
                    style={{ height: '600px' }}
                  >
                    <div
                      style={{
                        width: `${DEVICE_SIZES[deviceSize].width}px`,
                        maxWidth: '100%',
                        transition: 'width 0.2s ease-in-out',
                      }}
                    >
                      <iframe
                        srcDoc={template.htmlBody || '<p style="text-align: center; color: #888; padding: 2rem;">No content to preview. Start typing in the HTML editor.</p>'}
                        className="w-full border-2 border-border rounded-lg bg-white"
                        style={{
                          height: '560px',
                          pointerEvents: 'none',
                        }}
                        title="Email Preview"
                        sandbox="allow-same-origin"
                      />
                    </div>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </AdminRoute>
  );
}
