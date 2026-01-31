/**
 * Email Templates Admin Page
 * 
 * This page provides a comprehensive interface for managing email templates used
 * throughout the application. Admins can create, edit, duplicate, and delete templates,
 * as well as view version history.
 * 
 * Features:
 * - List all email templates with search and category filtering
 * - Create new templates from scratch
 * - Edit existing templates with live preview
 * - Duplicate templates for quick variations
 * - View version history for each template
 * - Seed default system templates
 * - Protected by AdminRoute (requires admin role)
 * 
 * Related Files:
 * - API: /src/app/api/admin/email-templates/route.ts
 * - Editor: /src/app/admin/email-templates/[id]/edit/page.tsx
 * - Seed API: /src/app/api/admin/email-templates/seed/route.ts
 * 
 * @author fotolokashen
 * @since January 2026
 */
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Users, MailIcon, Plus, Search, Filter, Edit, Copy, History, Trash2, Sparkles } from 'lucide-react';
import { AdminRoute } from '@/components/auth/AdminRoute';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

/**
 * Email Template Interface
 * Represents the structure of an email template record from the database
 */
interface EmailTemplate {
  id: number;              // Unique identifier
  key: string;             // Unique key for programmatic access (e.g., 'email-verification')
  name: string;            // Display name shown in admin interface
  subject: string;         // Email subject line (can include Handlebars variables)
  category: string;        // Category for organization (system, notification, campaign)
  isActive: boolean;       // Whether template is currently active and can be used
  isDefault: boolean;      // Whether this is a default system template (cannot be deleted)
  version: number;         // Current version number for tracking changes
  updatedAt: string;       // ISO timestamp of last update
}

/**
 * Main Email Templates Page Component
 * 
 * Provides the admin interface for managing all email templates in the system.
 * Includes search, filtering, CRUD operations, and default template seeding.
 */
export default function EmailTemplatesPage() {
  const router = useRouter();
  
  // State Management
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);  // All fetched templates
  const [loading, setLoading] = useState(true);                     // Loading state for initial fetch
  const [seeding, setSeeding] = useState(false);                    // Loading state for seed operation
  const [searchQuery, setSearchQuery] = useState('');               // User's search input
  const [categoryFilter, setCategoryFilter] = useState('all');      // Selected category filter

  /**
   * Fetches email templates from the API
   * 
   * Supports optional category filtering via query parameters.
   * Called on component mount and when categoryFilter changes.
   * 
   * @async
   */
  const fetchTemplates = useCallback(async () => {
    try {
      setLoading(true);
      
      // Build query parameters for category filtering
      const params = new URLSearchParams();
      if (categoryFilter !== 'all') {
        params.append('category', categoryFilter);
      }
      
      const response = await fetch(`/api/admin/email-templates?${params}`);
      if (!response.ok) throw new Error('Failed to fetch templates');
      
      const data = await response.json();
      setTemplates(data.templates || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast.error('Failed to load email templates');
    } finally {
      setLoading(false);
    }
  }, [categoryFilter]);

  // Fetch templates when component mounts or category filter changes
  // Fetch templates when component mounts or category filter changes
  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  /**
   * Handles template deletion
   * 
   * Prevents deletion of default templates (system-critical templates).
   * Shows confirmation dialog before deleting.
   * Refreshes the template list after successful deletion.
   * 
   * @param {number} id - The template ID to delete
   * @param {boolean} isDefault - Whether this is a default template
   * @async
   */
  const handleDelete = async (id: number, isDefault: boolean) => {
    // Prevent deletion of default templates
    if (isDefault) {
      toast.error('Default templates cannot be deleted');
      return;
    }

    // Confirm deletion with user
    if (!confirm('Are you sure you want to delete this template?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/email-templates/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete template');

      toast.success('Template deleted successfully');
      fetchTemplates(); // Refresh the list
    } catch (error) {
      console.error('Error deleting template:', error);
      toast.error('Failed to delete template');
    }
  };

  /**
   * Seeds default email templates into the database
   * 
   * This is a one-time setup operation that creates all the default system templates:
   * - Email Verification
   * - Welcome Email
   * - Password Reset
   * - Password Changed
   * - Account Deletion Confirmation
   * 
   * The seed endpoint is production-safe (won't overwrite existing templates).
   * Shows confirmation dialog before executing.
   * 
   * @async
   */
  const handleSeedTemplates = async () => {
    // Confirm with user before seeding
    if (!confirm('This will create the default email templates. Continue?')) {
      return;
    }

    try {
      setSeeding(true);
      const response = await fetch('/api/admin/email-templates/seed', {
        method: 'POST',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to seed templates');
      }

      const data = await response.json();
      toast.success(data.summary || 'Templates seeded successfully');
      fetchTemplates(); // Refresh the list to show new templates
    } catch (error) {
      console.error('Error seeding templates:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to seed templates');
    } finally {
      setSeeding(false);
    }
  };

  /**
   * Client-side filtering of templates
   * 
   * Filters templates based on search query across multiple fields:
   * - Template name
   * - Template key
   * - Email subject
   * 
   * Case-insensitive search.
   */
  const filteredTemplates = templates.filter((template) =>
    template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.subject.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AdminRoute>
      <div className="container max-w-7xl mx-auto py-6 px-4">
        {/* ===== HEADER SECTION ===== */}
        {/* Compact breadcrumb-style header showing current location in admin panel */}
        <div className="mb-4 flex items-center gap-2 text-sm">
          <span className="font-semibold text-muted-foreground">Admin Panel</span>
          <span className="text-muted-foreground">/</span>
          <span className="font-semibold">Email Templates</span>
          <span className="text-muted-foreground">—</span>
          <span className="text-muted-foreground">Manage templates with version control</span>
        </div>

        {/* ===== ADMIN NAVIGATION TABS ===== */}
        {/* Horizontal tab navigation for switching between admin sections */}
        <div className="mb-4">
          <div className="flex gap-2 border-b">
            {/* Users Tab */}
            <Button
              variant="ghost"
              onClick={() => router.push('/admin/users')}
              className="rounded-b-none"
            >
              <Users className="w-4 h-4 mr-2" />
              Users
            </Button>
            {/* Email Templates Tab (Active) */}
            <Button
              variant="ghost"
              className="rounded-b-none border-b-2 border-primary"
            >
              <MailIcon className="w-4 h-4 mr-2" />
              Email Templates
            </Button>
          </div>
        </div>

        {/* ===== SEARCH, FILTERS & ACTIONS ROW ===== */}
        {/* Compact single-row toolbar for all controls */}
        <div className="mb-4 flex items-center gap-3">
          {/* Search Input */}
          <div className="relative w-80">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-9"
            />
          </div>
          
          {/* Category Filter Dropdown */}
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[180px] h-9">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="system">System</SelectItem>
              <SelectItem value="notification">Notification</SelectItem>
              <SelectItem value="campaign">Campaign</SelectItem>
            </SelectContent>
          </Select>
          
          {/* Spacer to push Create button to the right */}
          <div className="flex-1" />
          
          {/* Create New Template Button */}
          <Button
            onClick={() => router.push('/admin/email-templates/new')}
            className="gap-2 h-9"
          >
            <Plus className="w-4 h-4" />
            Create Template
          </Button>
        </div>

        {/* ===== TEMPLATES TABLE ===== */}
        {/* Main data table showing all email templates */}
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Key</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Version</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* ===== LOADING STATE ===== */}
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    Loading templates...
                  </TableCell>
                </TableRow>
              
              /* ===== EMPTY STATE ===== */
              /* Shows when no templates match search/filter or database is empty */
              ) : filteredTemplates.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12">
                    <div className="flex flex-col items-center gap-4">
                      <MailIcon className="w-12 h-12 text-muted-foreground" />
                      <div>
                        <p className="font-medium">No templates found</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {templates.length === 0 
                            ? 'Get started by seeding the default templates'
                            : 'Try adjusting your search or filters'}
                        </p>
                      </div>
                      {/* Show seed button only if database is truly empty */}
                      {templates.length === 0 && (
                        <Button onClick={handleSeedTemplates} disabled={seeding} className="gap-2">
                          <Sparkles className="w-4 h-4" />
                          {seeding ? 'Seeding...' : 'Seed Default Templates'}
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              
              /* ===== TEMPLATE ROWS ===== */
              /* Maps through filtered templates and displays each as a table row */
              ) : (
                filteredTemplates.map((template) => (
                  <TableRow key={template.id}>
                    {/* Template Name with Default Badge */}
                    <TableCell className="font-medium">
                      {template.name}
                      {template.isDefault && (
                        <Badge variant="secondary" className="ml-2">
                          Default
                        </Badge>
                      )}
                    </TableCell>
                    
                    {/* Template Key (unique identifier) */}
                    <TableCell>
                      <code className="text-xs bg-muted px-2 py-1 rounded">
                        {template.key}
                      </code>
                    </TableCell>
                    
                    {/* Email Subject (truncated if too long) */}
                    <TableCell className="max-w-xs truncate">
                      {template.subject}
                    </TableCell>
                    
                    {/* Category Badge */}
                    <TableCell>
                      <Badge variant="outline">{template.category}</Badge>
                    </TableCell>
                    
                    {/* Version Number */}
                    <TableCell>v{template.version}</TableCell>
                    
                    {/* Active/Inactive Status */}
                    <TableCell>
                      {template.isActive ? (
                        <Badge variant="default">Active</Badge>
                      ) : (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </TableCell>
                    
                    {/* Last Updated Date */}
                    <TableCell>
                      {new Date(template.updatedAt).toLocaleDateString()}
                    </TableCell>
                    
                    {/* Action Buttons */}
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Edit Button - Always available */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/admin/email-templates/${template.id}/edit`)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        
                        {/* Version History Button - Always available */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/admin/email-templates/${template.id}/versions`)}
                        >
                          <History className="w-4 h-4" />
                        </Button>
                        
                        {/* Duplicate and Delete - Only for non-default templates */}
                        {!template.isDefault && (
                          <>
                            {/* Duplicate Button */}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => router.push(`/admin/email-templates/${template.id}/duplicate`)}
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                            
                            {/* Delete Button (red destructive style) */}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(template.id, template.isDefault)}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </AdminRoute>
  );
}
