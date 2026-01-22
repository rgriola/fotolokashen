'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, ChevronLeft, ChevronRight, Trash2, ArrowUpDown } from 'lucide-react';
import { toast } from 'sonner';
import { DeleteUserModal } from '@/components/admin/DeleteUserModal';
import { useAuth } from '@/lib/auth-context';

interface User {
    id: number;
    email: string;
    username: string;
    firstName: string | null;
    lastName: string | null;
    emailVerified: boolean;
    isActive: boolean;
    isAdmin: boolean;
    role: string;
    createdAt: string;
    updatedAt: string;
    lastLoginAt: string | null;
    phoneNumber: string | null;
    city: string | null;
    country: string | null;
    language: string | null;
    timezone: string | null;
    gpsPermission: string | null;
    homeLocationName: string | null;
    bio: string | null;
    avatar: string | null;
    emailNotifications: boolean;
    _count: {
        sessions: number;
        createdLocations: number;
        uploadedPhotos: number;
        savedLocations: number;
    };
}

interface UsersResponse {
    users: User[];
    totalUsers: number;
    totalPages: number;
    currentPage: number;
}

type SortField = 'firstName' | 'lastName' | 'email' | 'createdAt';
type SortOrder = 'asc' | 'desc';

export function UserManagementTable() {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [totalUsers, setTotalUsers] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortField, setSortField] = useState<SortField>('firstName');
    const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
    const [loading, setLoading] = useState(true);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState<User | null>(null);

    const perPage = 10;

    // Fetch users
    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: currentPage.toString(),
                perPage: perPage.toString(),
                search: searchQuery,
                sortField,
                sortOrder,
            });

            const response = await fetch(`/api/admin/users?${params}`);
            if (!response.ok) {
                throw new Error('Failed to fetch users');
            }

            const data: UsersResponse = await response.json();
            setUsers(data.users);
            setTotalUsers(data.totalUsers);
            setTotalPages(data.totalPages);
        } catch (error) {
            console.error('Error fetching users:', error);
            toast.error('Failed to load users');
        } finally {
            setLoading(false);
        }
    }, [currentPage, searchQuery, sortField, sortOrder]);

    // Fetch users on mount and when filters change
    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    // Handle search with debounce
    useEffect(() => {
        const timer = setTimeout(() => {
            setCurrentPage(1); // Reset to page 1 on search
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Handle sort
    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortOrder('asc');
        }
        setCurrentPage(1);
    };

    // Handle delete
    const handleDeleteClick = (user: User) => {
        setUserToDelete(user);
        setDeleteModalOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!userToDelete) return;

        try {
            const response = await fetch(`/api/admin/users/${userToDelete.id}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                // Try to parse JSON error, but fallback to text if it fails
                let errorMessage = 'Failed to delete user';
                try {
                    const error = await response.json();
                    errorMessage = error.error || errorMessage;
                } catch {
                    const text = await response.text();
                    console.error('Delete user API error:', text);
                    errorMessage = `Server error (${response.status})`;
                }
                throw new Error(errorMessage);
            }

            toast.success(`User ${userToDelete.email} deleted successfully`);
            setDeleteModalOpen(false);
            setUserToDelete(null);
            fetchUsers(); // Refresh the list
        } catch (error) {
            console.error('Error deleting user:', error);
            toast.error(error instanceof Error ? error.message : 'Failed to delete user');
        }
    };

    // Format date
    const formatDate = (dateString: string | null) => {
        if (!dateString) return 'Never';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    // Get display name
    const getDisplayName = (user: User) => {
        if (user.firstName && user.lastName) {
            return `${user.firstName} ${user.lastName}`;
        }
        if (user.firstName) return user.firstName;
        if (user.lastName) return user.lastName;
        return user.username;
    };

    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <CardTitle>All Users</CardTitle>
                            <CardDescription>
                                {totalUsers} total user{totalUsers !== 1 ? 's' : ''}
                            </CardDescription>
                        </div>
                        <div className="relative w-full sm:w-64">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by name or email..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-8"
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="border-b">
                                    <th className="text-left p-2 font-semibold">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleSort('firstName')}
                                            className="hover:bg-muted"
                                        >
                                            Name
                                            <ArrowUpDown className="ml-1 h-3 w-3" />
                                        </Button>
                                    </th>
                                    <th className="text-left p-2 font-semibold">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleSort('email')}
                                            className="hover:bg-muted"
                                        >
                                            Email
                                            <ArrowUpDown className="ml-1 h-3 w-3" />
                                        </Button>
                                    </th>
                                    <th className="text-left p-2 font-semibold whitespace-nowrap">Username</th>
                                    <th className="text-left p-2 font-semibold whitespace-nowrap">Phone</th>
                                    <th className="text-left p-2 font-semibold whitespace-nowrap">Location</th>
                                    <th className="text-left p-2 font-semibold whitespace-nowrap">Verified</th>
                                    <th className="text-left p-2 font-semibold whitespace-nowrap">Role</th>
                                    <th className="text-left p-2 font-semibold whitespace-nowrap">Active</th>
                                    <th className="text-left p-2 font-semibold whitespace-nowrap">Language</th>
                                    <th className="text-left p-2 font-semibold whitespace-nowrap">Timezone</th>
                                    <th className="text-left p-2 font-semibold whitespace-nowrap">GPS</th>
                                    <th className="text-left p-2 font-semibold whitespace-nowrap">Locations</th>
                                    <th className="text-left p-2 font-semibold whitespace-nowrap">Photos</th>
                                    <th className="text-left p-2 font-semibold whitespace-nowrap">Saves</th>
                                    <th className="text-left p-2 font-semibold whitespace-nowrap">Sessions</th>
                                    <th className="text-left p-2 font-semibold">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleSort('createdAt')}
                                            className="hover:bg-muted"
                                        >
                                            Created
                                            <ArrowUpDown className="ml-1 h-3 w-3" />
                                        </Button>
                                    </th>
                                    <th className="text-left p-2 font-semibold whitespace-nowrap">Last Login</th>
                                    <th className="text-right p-2 font-semibold whitespace-nowrap">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan={18} className="text-center py-8 text-muted-foreground">
                                            Loading users...
                                        </td>
                                    </tr>
                                ) : users.length === 0 ? (
                                    <tr>
                                        <td colSpan={18} className="text-center py-8 text-muted-foreground">
                                            No users found
                                        </td>
                                    </tr>
                                ) : (
                                    users.map((user) => {
                                        const isCurrentUser = currentUser?.id === user.id;
                                        return (
                                            <tr 
                                                key={user.id} 
                                                className={`border-b hover:bg-muted/50 ${isCurrentUser ? 'opacity-60 bg-muted/30' : ''}`}
                                            >
                                                <td className="p-2 whitespace-nowrap">{getDisplayName(user)}</td>
                                                <td className="p-2">{user.email}</td>
                                                <td className="p-2 whitespace-nowrap">{user.username}</td>
                                                <td className="p-2 whitespace-nowrap">{user.phoneNumber || '-'}</td>
                                                <td className="p-2 whitespace-nowrap">
                                                    {user.city && user.country
                                                        ? `${user.city}, ${user.country}`
                                                        : user.city || user.country || '-'}
                                                </td>
                                                <td className="p-2">
                                                    <span
                                                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                                            user.emailVerified
                                                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                                                : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                                                        }`}
                                                    >
                                                        {user.emailVerified ? 'Yes' : 'No'}
                                                    </span>
                                                </td>
                                                <td className="p-2">
                                                    <span
                                                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                                            user.role === 'super_admin'
                                                                ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
                                                                : user.role === 'staffer'
                                                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                                                                : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
                                                        }`}
                                                    >
                                                        {user.role === 'super_admin' ? 'Super Admin' : user.role === 'staffer' ? 'Staff' : 'User'}
                                                    </span>
                                                </td>
                                                <td className="p-2">
                                                    <span
                                                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                                            user.isActive
                                                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                                                : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                                                        }`}
                                                    >
                                                        {user.isActive ? 'Yes' : 'No'}
                                                    </span>
                                                </td>
                                                <td className="p-2 whitespace-nowrap">{user.language || '-'}</td>
                                                <td className="p-2 whitespace-nowrap text-xs">{user.timezone || '-'}</td>
                                                <td className="p-2 whitespace-nowrap">
                                                    {user.gpsPermission === 'granted' ? '✓' : user.gpsPermission === 'denied' ? '✗' : '-'}
                                                </td>
                                                <td className="p-2 text-center">{user._count.createdLocations}</td>
                                                <td className="p-2 text-center">{user._count.uploadedPhotos}</td>
                                                <td className="p-2 text-center">{user._count.savedLocations}</td>
                                                <td className="p-2 text-center">{user._count.sessions}</td>
                                                <td className="p-2 whitespace-nowrap text-xs">{formatDate(user.createdAt)}</td>
                                                <td className="p-2 whitespace-nowrap text-xs">{formatDate(user.lastLoginAt)}</td>
                                                <td className="p-2 text-right">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleDeleteClick(user)}
                                                        disabled={isCurrentUser}
                                                        className={`${
                                                            isCurrentUser 
                                                                ? 'cursor-not-allowed opacity-40' 
                                                                : 'text-destructive hover:text-destructive hover:bg-destructive/10'
                                                        }`}
                                                        title={isCurrentUser ? 'Cannot delete your own account' : 'Delete user'}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {!loading && totalPages > 1 && (
                        <div className="flex items-center justify-between mt-4 pt-4 border-t">
                            <div className="text-sm text-muted-foreground">
                                Page {currentPage} of {totalPages}
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage(currentPage - 1)}
                                    disabled={currentPage === 1}
                                >
                                    <ChevronLeft className="h-4 w-4 mr-1" />
                                    Previous
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                >
                                    Next
                                    <ChevronRight className="h-4 w-4 ml-1" />
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Delete Modal */}
            {userToDelete && (
                <DeleteUserModal
                    open={deleteModalOpen}
                    onOpenChange={setDeleteModalOpen}
                    user={userToDelete}
                    onConfirm={handleDeleteConfirm}
                />
            )}
        </>
    );
}
