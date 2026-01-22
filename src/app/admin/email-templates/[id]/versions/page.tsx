'use client';

import { useState, useEffect, use, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AdminRoute } from '@/components/auth/AdminRoute';
import { ArrowLeft, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface TemplateVersion {
  id: number;
  version: number;
  changeNote: string | null;
  createdAt: string;
  creator: {
    username: string;
  } | null;
}

export default function EmailTemplateVersionsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [versions, setVersions] = useState<TemplateVersion[]>([]);
  const [currentVersion, setCurrentVersion] = useState(1);
  const [templateName, setTemplateName] = useState('');

  const fetchVersions = useCallback(async () => {
    try {
      const response = await fetch(`/api/admin/email-templates/${resolvedParams.id}/versions`);
      if (!response.ok) throw new Error('Failed to fetch versions');
      
      const data = await response.json();
      setVersions(data.versions || []);
      setCurrentVersion(data.currentVersion);
      setTemplateName(data.templateName || 'Template');
    } catch (error) {
      console.error('Error fetching versions:', error);
      toast.error('Failed to load version history');
    } finally {
      setLoading(false);
    }
  }, [resolvedParams.id]);

  useEffect(() => {
    fetchVersions();
  }, [fetchVersions]);

  const handleRevert = async (version: number) => {
    if (!confirm(`Are you sure you want to revert to version ${version}? This will create a new version.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/email-templates/${resolvedParams.id}/revert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ version }),
      });

      if (!response.ok) throw new Error('Failed to revert version');

      toast.success(`Reverted to version ${version} successfully`);
      router.push('/admin/email-templates');
    } catch (error) {
      console.error('Error reverting version:', error);
      toast.error('Failed to revert version');
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
        <div className="mb-6 flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/admin/email-templates')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Version History</h1>
            <p className="text-muted-foreground mt-1">
              {templateName} - Current Version: v{currentVersion}
            </p>
          </div>
        </div>

        <Card className="p-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Version</TableHead>
                <TableHead>Change Note</TableHead>
                <TableHead>Created By</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {versions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    No version history available
                  </TableCell>
                </TableRow>
              ) : (
                versions.map((version) => (
                  <TableRow key={version.id}>
                    <TableCell className="font-medium">
                      v{version.version}
                      {version.version === currentVersion && (
                        <span className="ml-2 text-xs bg-primary text-primary-foreground px-2 py-1 rounded">
                          Current
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {version.changeNote || <span className="text-muted-foreground">No note</span>}
                    </TableCell>
                    <TableCell>
                      {version.creator?.username || <span className="text-muted-foreground">System</span>}
                    </TableCell>
                    <TableCell>
                      {new Date(version.createdAt).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      {version.version !== currentVersion && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRevert(version.version)}
                        >
                          <RotateCcw className="w-4 h-4 mr-2" />
                          Revert
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      </div>
    </AdminRoute>
  );
}
