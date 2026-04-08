'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { TOAST } from '@/lib/constants/messages';
import { useAuth } from '@/lib/auth-context';

export function DeleteAccountSection() {
    const router = useRouter();
    const { user } = useAuth();
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [confirmText, setConfirmText] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDeleteClick = () => {
        setDeleteModalOpen(true);
        setConfirmText('');
    };

    const handleDeleteConfirm = async () => {
        if (confirmText !== 'DELETE') {
            toast.error(TOAST.PROFILE.DELETE_CONFIRM_REQUIRED);
            return;
        }

        setIsDeleting(true);

        try {
            const response = await fetch('/api/auth/delete-account', {
                method: 'DELETE',
            });

            if (!response.ok) {
                let errorMessage = 'Failed to delete account';
                try {
                    const error = await response.json();
                    errorMessage = error.error || errorMessage;
                } catch {
                    const text = await response.text();
                    console.error('Delete account API error:', text);
                    errorMessage = `Server error (${response.status})`;
                }
                throw new Error(errorMessage);
            }

toast.success(TOAST.PROFILE.ACCOUNT_DELETED);
            
            // Redirect to logout page (no need to call logout API, user is already deleted)
            router.push('/logout');
        } catch (error) {
            console.error('Error deleting account:', error);
                toast.error(error instanceof Error ? error.message : TOAST.PROFILE.ACCOUNT_DELETE_FAILED);
            setIsDeleting(false);
        }
    };

    const userName = user?.firstName && user?.lastName
        ? `${user.firstName} ${user.lastName}`
        : user?.firstName || user?.lastName || user?.username || 'User';

    return (
        <>
            <Card className="border-destructive/50">
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-destructive" />
                        <CardTitle className="text-destructive">Delete Account</CardTitle>
                    </div>
                    <CardDescription>
                        Permanently delete your account and all associated data
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2 text-sm text-muted-foreground">
                        <p>
                            <strong>Warning:</strong> This action cannot be undone. Deleting your account will:
                        </p>
                        <ul className="list-disc list-inside space-y-1 ml-2">
                            <li>Remove your profile and account information</li>
                            <li>Delete all your saved locations</li>
                            <li>Delete all your uploaded photos</li>
                            <li>Remove all your data from our servers and CDN</li>
                            <li>End all your active sessions</li>
                        </ul>
                    </div>
                    <Button 
                        variant="destructive" 
                        onClick={handleDeleteClick}
                        className="w-full sm:w-auto"
                    >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete My Account
                    </Button>
                </CardContent>
            </Card>

            {/* Delete Confirmation Modal */}
            <AlertDialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <div className="flex items-center gap-2 text-destructive">
                            <AlertTriangle className="h-6 w-6" />
                            <AlertDialogTitle>Delete Your Account?</AlertDialogTitle>
                        </div>
                        <AlertDialogDescription>
                            You are about to permanently delete your account. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="space-y-3 py-4">
                        <p className="text-sm text-muted-foreground">
                            You are about to permanently delete the account for:
                        </p>
                        <div className="bg-muted p-3 rounded-md">
                            <p className="font-semibold">{userName}</p>
                            <p className="text-sm text-muted-foreground">{user?.email}</p>
                        </div>
                        <p className="font-semibold text-sm">
                            This will permanently delete:
                        </p>
                        <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-2">
                            <li>Your account and profile</li>
                            <li>All saved locations</li>
                            <li>All uploaded photos</li>
                            <li>All data from our servers and CDN</li>
                        </ul>
                        <p className="font-semibold text-destructive text-sm">
                            This action cannot be undone!
                        </p>
                        <div className="space-y-2 pt-2">
                            <Label htmlFor="confirm-delete">
                                Type <span className="font-mono font-bold">DELETE</span> to confirm:
                            </Label>
                            <Input
                                id="confirm-delete"
                                value={confirmText}
                                onChange={(e) => setConfirmText(e.target.value)}
                                placeholder="Type DELETE"
                                className="font-mono"
                                autoComplete="off"
                            />
                        </div>
                    </div>
                    <AlertDialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setDeleteModalOpen(false)}
                            disabled={isDeleting}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDeleteConfirm}
                            disabled={confirmText !== 'DELETE' || isDeleting}
                        >
                            {isDeleting ? 'Deleting...' : 'Delete Account'}
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
