'use client';

import { useState, useEffect, use, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AdminRoute } from '@/components/auth/AdminRoute';
import { ArrowLeft, Save, Copy, Eye, Settings, Palette, ImageIcon, Monitor, Tablet, Smartphone, Info, Code } from 'lucide-react';
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
    <div className="flex items-center justify-center h-[500px] border rounded-md bg-gray-900">
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

export default function DuplicateEmailTemplatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');
  const [sourceTemplateName, setSourceTemplateName] = useState('');
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
  const [keyError, setKeyError] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [subjectError, setSubjectError] = useState<string | null>(null);

  // Validation regex: lowercase letters, numbers, underscores, and hyphens only
  const TEMPLATE_KEY_REGEX = /^[a-z0-9_-]+$/;

  const validateTemplateKey = (key: string): string | null => {
    if (!key) return null;
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

  const fetchSourceTemplate = useCallback(async () => {
    try {
      const response = await fetch(`/api/admin/email-templates/${resolvedParams.id}`);
      if (!response.ok) throw new Error('Failed to fetch template');
      
      const data = await response.json();
      const source = data.template;
      
      // Store original name for display
      setSourceTemplateName(source.name);
      
      // Create duplicate with modified key and name (no id = new template)
      setTemplate({
        key: `${source.key}_copy`,
        name: `${source.name} (Copy)`,
        description: source.description || '',
        category: source.category || 'system',
        subject: source.subject,
        htmlBody: source.htmlBody,
        brandColor: source.brandColor || '#4285f4',
        headerGradientStart: source.headerGradientStart || '#4285f4',
        headerGradientEnd: source.headerGradientEnd || '#5a67d8',
        buttonColor: source.buttonColor || '#4285f4',
        headerImageUrl: source.headerImageUrl || '',
        requiredVariables: source.requiredVariables || [],
        isActive: true,
      });
    } catch (error) {
      console.error('Error fetching template:', error);
      toast.error('Failed to load source template');
      router.push('/admin/email-templates');
    } finally {
      setLoading(false);
    }
  }, [resolvedParams.id, router]);

  useEffect(() => {
    fetchSourceTemplate();
  }, [fetchSourceTemplate]);

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
      
      // Always POST since this is a new template (duplicate)
      const response = await fetch('/api/admin/email-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(template),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create duplicate template');
      }

      toast.success('Template duplicated successfully');
      router.push('/admin/email-templates');
    } catch (error) {
      console.error('Error saving template:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save template');
    } finally {
      setSaving(false);
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
          <p>Loading template...</p>
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
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Copy className="w-7 h-7" />
                Duplicate Template
              </h1>
              <p className="text-muted-foreground mt-1">
                Creating copy of: <span className="font-medium">{sourceTemplateName}</span>
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
                </div>
              </DialogContent>
            </Dialog>
            <Button onClick={handleSave} disabled={saving}>
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Creating...' : 'Create Duplicate'}
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
                  <div className="space-y-1">
                    <Label htmlFor="key" className="text-xs">
                      Template Key <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="key"
                      value={template.key}
                      onChange={(e) => handleKeyChange(e.target.value)}
                      placeholder="e.g., welcome_email"
                      className={`h-8 text-sm ${keyError ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                    />
                    {keyError && (
                      <p className="text-xs text-red-500">{keyError}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Unique identifier. Use a new key for the duplicate.
                    </p>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="name" className="text-xs">
                      Template Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="name"
                      value={template.name}
                      onChange={(e) => handleNameChange(e.target.value)}
                      placeholder="Welcome Email"
                      className={`h-8 text-sm ${nameError ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                    />
                    {nameError && (
                      <p className="text-xs text-red-500">{nameError}</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="description" className="text-xs">
                      Description
                    </Label>
                    <Textarea
                      id="description"
                      value={template.description}
                      onChange={(e) =>
                        setTemplate({ ...template, description: e.target.value })
                      }
                      placeholder="Brief description..."
                      rows={2}
                      className="text-sm resize-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="category" className="text-xs">
                      Category
                    </Label>
                    <Select
                      value={template.category}
                      onValueChange={(value) =>
                        setTemplate({ ...template, category: value })
                      }
                    >
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="system">System</SelectItem>
                        <SelectItem value="marketing">Marketing</SelectItem>
                        <SelectItem value="notification">Notification</SelectItem>
                        <SelectItem value="transactional">Transactional</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="subject" className="text-xs">
                      Subject Line <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="subject"
                      value={template.subject}
                      onChange={(e) => handleSubjectChange(e.target.value)}
                      placeholder="Welcome to {{appName}}!"
                      className={`h-8 text-sm ${subjectError ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                    />
                    {subjectError && (
                      <p className="text-xs text-red-500">{subjectError}</p>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t">
                    <Label htmlFor="isActive" className="text-xs">
                      Active
                    </Label>
                    <input
                      type="checkbox"
                      id="isActive"
                      checked={template.isActive}
                      onChange={(e) =>
                        setTemplate({ ...template, isActive: e.target.checked })
                      }
                      className="h-4 w-4"
                    />
                  </div>
                </TabsContent>

                {/* Colors Tab */}
                <TabsContent value="colors" className="space-y-3 mt-0">
                  {/* Brand Color */}
                  <div className="space-y-1">
                    <Label className="text-xs">Brand Color</Label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setShowColorPicker(showColorPicker === 'brand' ? null : 'brand')}
                        className="w-8 h-8 rounded border-2 border-gray-300 cursor-pointer"
                        style={{ backgroundColor: template.brandColor }}
                      />
                      <Input
                        value={template.brandColor}
                        onChange={(e) => setTemplate({ ...template, brandColor: e.target.value })}
                        className="h-8 text-sm font-mono flex-1"
                      />
                    </div>
                    {showColorPicker === 'brand' && (
                      <div className="pt-2">
                        <HexColorPicker
                          color={template.brandColor}
                          onChange={(color) => setTemplate({ ...template, brandColor: color })}
                          style={{ width: '100%', height: '120px' }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Button Color */}
                  <div className="space-y-1">
                    <Label className="text-xs">Button Color</Label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setShowColorPicker(showColorPicker === 'button' ? null : 'button')}
                        className="w-8 h-8 rounded border-2 border-gray-300 cursor-pointer"
                        style={{ backgroundColor: template.buttonColor }}
                      />
                      <Input
                        value={template.buttonColor}
                        onChange={(e) => setTemplate({ ...template, buttonColor: e.target.value })}
                        className="h-8 text-sm font-mono flex-1"
                      />
                    </div>
                    {showColorPicker === 'button' && (
                      <div className="pt-2">
                        <HexColorPicker
                          color={template.buttonColor}
                          onChange={(color) => setTemplate({ ...template, buttonColor: color })}
                          style={{ width: '100%', height: '120px' }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Header Gradient */}
                  <div className="space-y-2 pt-2 border-t">
                    <Label className="text-xs">Header Gradient</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <span className="text-xs text-muted-foreground">Start</span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setShowColorPicker(showColorPicker === 'gradientStart' ? null : 'gradientStart')}
                            className="w-6 h-6 rounded border cursor-pointer flex-shrink-0"
                            style={{ backgroundColor: template.headerGradientStart }}
                          />
                          <Input
                            value={template.headerGradientStart}
                            onChange={(e) => setTemplate({ ...template, headerGradientStart: e.target.value })}
                            className="h-7 text-xs font-mono"
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <span className="text-xs text-muted-foreground">End</span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setShowColorPicker(showColorPicker === 'gradientEnd' ? null : 'gradientEnd')}
                            className="w-6 h-6 rounded border cursor-pointer flex-shrink-0"
                            style={{ backgroundColor: template.headerGradientEnd }}
                          />
                          <Input
                            value={template.headerGradientEnd}
                            onChange={(e) => setTemplate({ ...template, headerGradientEnd: e.target.value })}
                            className="h-7 text-xs font-mono"
                          />
                        </div>
                      </div>
                    </div>
                    {(showColorPicker === 'gradientStart' || showColorPicker === 'gradientEnd') && (
                      <div className="pt-2">
                        <HexColorPicker
                          color={showColorPicker === 'gradientStart' ? template.headerGradientStart : template.headerGradientEnd}
                          onChange={(color) => {
                            if (showColorPicker === 'gradientStart') {
                              setTemplate({ ...template, headerGradientStart: color });
                            } else {
                              setTemplate({ ...template, headerGradientEnd: color });
                            }
                          }}
                          style={{ width: '100%', height: '120px' }}
                        />
                      </div>
                    )}
                    {/* Gradient Preview */}
                    <div
                      className="h-6 rounded"
                      style={{
                        background: `linear-gradient(135deg, ${template.headerGradientStart}, ${template.headerGradientEnd})`,
                      }}
                    />
                  </div>
                </TabsContent>

                {/* Header Tab - Disabled */}
                <TabsContent value="header" className="mt-0">
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>Header image upload coming soon</p>
                  </div>
                </TabsContent>
              </Tabs>
            </Card>
          </div>

          {/* Right Column - Editor & Preview */}
          <div className="xl:col-span-2">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'editor' | 'preview')}>
              {/* Tab bar with device toggles and Copy HTML */}
              <div className="flex items-center justify-between mb-4">
                <TabsList>
                  <TabsTrigger value="editor" className="gap-2">
                    <Code className="w-4 h-4" />
                    HTML
                  </TabsTrigger>
                  <TabsTrigger value="preview" className="gap-2">
                    <Eye className="w-4 h-4" />
                    Preview
                  </TabsTrigger>
                </TabsList>

                <div className="flex items-center gap-2">
                  {/* Device size toggles - only show in preview mode */}
                  {activeTab === 'preview' && (
                    <div className="flex items-center border rounded-md">
                      {(Object.keys(DEVICE_SIZES) as DeviceSize[]).map((size) => {
                        const Icon = deviceIcons[size];
                        return (
                          <button
                            key={size}
                            onClick={() => setDeviceSize(size)}
                            className={`p-2 transition-colors ${
                              deviceSize === size
                                ? 'bg-primary text-primary-foreground'
                                : 'hover:bg-muted'
                            } ${size === 'web' ? 'rounded-l-md' : ''} ${size === 'mobile' ? 'rounded-r-md' : ''}`}
                            title={DEVICE_SIZES[size].label}
                          >
                            <Icon className="w-4 h-4" />
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Copy HTML button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyHTML}
                    disabled={!template.htmlBody}
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy HTML
                  </Button>
                </div>
              </div>

              <TabsContent value="editor" className="mt-0">
                <Card className="overflow-hidden">
                  <Editor
                    height="500px"
                    defaultLanguage="html"
                    value={template.htmlBody}
                    onChange={(value) =>
                      setTemplate({ ...template, htmlBody: value || '' })
                    }
                    theme="vs-dark"
                    options={{
                      minimap: { enabled: false },
                      fontSize: 14,
                      wordWrap: 'on',
                      lineNumbers: 'on',
                      scrollBeyondLastLine: false,
                    }}
                  />
                </Card>
              </TabsContent>

              <TabsContent value="preview" className="mt-0">
                <Card className="p-4" style={{ minHeight: '560px' }}>
                  <div
                    className="mx-auto transition-all duration-300"
                    style={{ maxWidth: `${DEVICE_SIZES[deviceSize].width}px` }}
                  >
                    <iframe
                      srcDoc={template.htmlBody}
                      className="w-full border rounded-md bg-white"
                      style={{ height: '520px' }}
                      title="Email Preview"
                      sandbox="allow-same-origin"
                    />
                  </div>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </AdminRoute>
  );
}
