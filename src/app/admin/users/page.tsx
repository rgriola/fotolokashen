'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Users, MailIcon } from 'lucide-react';
import { AdminRoute } from '@/components/auth/AdminRoute';
import { UserManagementTable } from '@/components/admin/UserManagementTable';

export default function AdminUsersPage() {
    const router = useRouter();

    return (
        <AdminRoute>
            <div className="container max-w-7xl mx-auto py-6 px-4">
                {/* Compact Header - Breadcrumb style */}
                <div className="mb-4 flex items-center gap-2 text-sm">
                    <span className="font-semibold text-muted-foreground">Admin Panel</span>
                    <span className="text-muted-foreground">/</span>
                    <span className="font-semibold">Members</span>
                    <span className="text-muted-foreground">—</span>
                    <span className="text-muted-foreground">Manage user accounts and permissions</span>
                </div>

                {/* Admin Navigation Tabs */}
                <div className="mb-4">
                    <div className="flex gap-2 border-b">
                        <Button
                            variant="ghost"
                            className="rounded-b-none border-b-2 border-primary"
                        >
                            <Users className="w-4 h-4 mr-2" />
                            Users
                        </Button>
                        <Button
                            variant="ghost"
                            onClick={() => router.push('/admin/email-templates')}
                            className="rounded-b-none"
                        >
                            <MailIcon className="w-4 h-4 mr-2" />
                            Email Templates
                        </Button>
                    </div>
                </div>

                <UserManagementTable />
            </div>
        </AdminRoute>
    );
}
