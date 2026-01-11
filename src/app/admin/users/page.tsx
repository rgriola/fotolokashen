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
            <div className="container max-w-7xl mx-auto py-8 px-4">
                {/* Header */}
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
                            className="rounded-b-none border-b-2 border-primary"
                        >
                            <Users className="w-4 h-4 mr-2" />
                            Users
                        </Button>
                        <Button
                            variant="ghost"
                            onClick={() => router.push('/admin/email-preview')}
                            className="rounded-b-none"
                        >
                            <MailIcon className="w-4 h-4 mr-2" />
                            Email Preview
                        </Button>
                    </div>
                </div>

                {/* Page Title */}
                <div className="mb-6">
                    <h2 className="text-2xl font-bold">Members</h2>
                    <p className="text-muted-foreground mt-1">
                        Manage user accounts and permissions
                    </p>
                </div>

                <UserManagementTable />
            </div>
        </AdminRoute>
    );
}
