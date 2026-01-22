'use client';

import { useState, useEffect, use, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { AdminRoute } from '@/components/auth/AdminRoute';
import { ArrowLeft, Save, Send, Eye } from 'lucide-react';
import { toast } from 'sonner';
import Editor from '@monaco-editor/react';
import { HexColorPicker } from 'react-colorful';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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
  const [showPreview, setShowPreview] = useState(false);
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
    requiredVariables: [],
    isActive: true,
  });
  const [showColorPicker, setShowColorPicker] = useState<string | null>(null);

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
    if (!template.key || !template.name || !template.subject || !template.htmlBody) {
      toast.error('Please fill in all required fields');
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

    try {
      setSendingTest(true);
      const response = await fetch(`/api/admin/email-templates/${template.id}/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ variables: {} }),
      });

      if (!response.ok) throw new Error('Failed to send test email');

      toast.success('Test email sent successfully');
    } catch (error) {
      console.error('Error sending test email:', error);
      toast.error('Failed to send test email');
    } finally {
      setSendingTest(false);
    }
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
            <Button
              variant="outline"
              onClick={() => setShowPreview(!showPreview)}
            >
              <Eye className="w-4 h-4 mr-2" />
              {showPreview ? 'Hide' : 'Show'} Preview
            </Button>
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Editor Panel */}
          <div className="space-y-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Template Settings</h3>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="key">Template Key *</Label>
                  <Input
                    id="key"
                    value={template.key}
                    onChange={(e) => setTemplate({ ...template, key: e.target.value })}
                    placeholder="e.g., verification, welcome"
                    disabled={resolvedParams.id !== 'new'}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Lowercase letters, numbers, underscores, and hyphens only
                  </p>
                </div>

                <div>
                  <Label htmlFor="name">Template Name *</Label>
                  <Input
                    id="name"
                    value={template.name}
                    onChange={(e) => setTemplate({ ...template, name: e.target.value })}
                    placeholder="e.g., Email Verification"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={template.description}
                    onChange={(e) => setTemplate({ ...template, description: e.target.value })}
                    placeholder="Purpose of this template"
                    rows={2}
                  />
                </div>

                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={template.category}
                    onValueChange={(value) => setTemplate({ ...template, category: value })}
                  >
                    <SelectTrigger>
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
                  <Label htmlFor="subject">Subject Line *</Label>
                  <Input
                    id="subject"
                    value={template.subject}
                    onChange={(e) => setTemplate({ ...template, subject: e.target.value })}
                    placeholder="e.g., Please verify your email"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Use {`{{variableName}}`} for dynamic content
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Brand Colors</h3>
              
              <div className="grid grid-cols-2 gap-4">
                {[
                  { key: 'brandColor', label: 'Primary Brand Color' },
                  { key: 'buttonColor', label: 'Button Color' },
                  { key: 'headerGradientStart', label: 'Header Gradient Start' },
                  { key: 'headerGradientEnd', label: 'Header Gradient End' },
                ].map(({ key, label }) => (
                  <div key={key}>
                    <Label>{label}</Label>
                    <div className="flex gap-2 mt-1">
                      <div
                        className="w-10 h-10 rounded border cursor-pointer"
                        style={{ backgroundColor: template[key as keyof TemplateData] as string }}
                        onClick={() => setShowColorPicker(showColorPicker === key ? null : key)}
                      />
                      <Input
                        value={template[key as keyof TemplateData] as string}
                        onChange={(e) => setTemplate({ ...template, [key]: e.target.value })}
                        placeholder="#4285f4"
                      />
                    </div>
                    {showColorPicker === key && (
                      <div className="mt-2">
                        <HexColorPicker
                          color={template[key as keyof TemplateData] as string}
                          onChange={(color) => setTemplate({ ...template, [key]: color })}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">HTML Body *</h3>
              <div className="border rounded-md overflow-hidden" style={{ height: '500px' }}>
                <Editor
                  height="500px"
                  defaultLanguage="html"
                  value={template.htmlBody}
                  onChange={(value) => setTemplate({ ...template, htmlBody: value || '' })}
                  theme="vs-dark"
                  options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    wordWrap: 'on',
                    formatOnPaste: true,
                    formatOnType: true,
                  }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Use {`{{variableName}}`} for dynamic content. Available variables will depend on the template type.
              </p>
            </Card>
          </div>

          {/* Preview Panel */}
          {showPreview && (
            <div className="space-y-6">
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Live Preview</h3>
                <div className="border rounded-md p-4 bg-gray-50 min-h-[600px]">
                  <div className="bg-white rounded shadow-sm max-w-xl mx-auto">
                    <div
                      className="p-6"
                      dangerouslySetInnerHTML={{ __html: template.htmlBody }}
                    />
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>
    </AdminRoute>
  );
}
