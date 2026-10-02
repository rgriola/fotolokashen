"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface User {
  id: number;
  email: string;
  username: string;
  firstName: string | null;
  lastName: string | null;
  _count: {
    sessions: number;
    createdLocations: number;
    uploadedPhotos: number;
    savedLocations: number;
  };
}

interface DeleteUserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User;
  onConfirm: () => Promise<void>;
}

export function DeleteUserModal({
  open,
  onOpenChange,
  user,
  onConfirm,
}: DeleteUserModalProps) {
  const [confirmText, setConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const isConfirmValid = confirmText === "DELETE";

  const handleConfirm = async () => {
    if (!isConfirmValid) return;

    setIsDeleting(true);
    try {
      await onConfirm();
    } finally {
      setIsDeleting(false);
      setConfirmText("");
    }
  };

  const handleCancel = () => {
    setConfirmText("");
    onOpenChange(false);
  };

  const getDisplayName = () => {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    if (user.firstName) return user.firstName;
    if (user.lastName) return user.lastName;
    return user.username;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-destructive" />
            <DialogTitle>Delete User Account</DialogTitle>
          </div>
          <DialogDescription>
            You are about to permanently delete this user account. This action
            cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 pt-2">
          <div>
            <p className="text-sm text-muted-foreground mb-2">
              Deleting account for:
            </p>
            <div className="bg-muted p-3 rounded-md space-y-1">
              <p className="font-semibold">{getDisplayName()}</p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>
        </div>

        <div className="space-y-4 py-4">
          <div className="bg-destructive/10 border border-destructive/20 rounded-md p-4">
            <p className="font-semibold text-destructive mb-2">
              ⚠️ This action will permanently delete:
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>
                {user._count.sessions} active session
                {user._count.sessions !== 1 ? "s" : ""}
              </li>
              <li>
                {user._count.createdLocations} location
                {user._count.createdLocations !== 1 ? "s" : ""}
              </li>
              <li>
                {user._count.uploadedPhotos} photo
                {user._count.uploadedPhotos !== 1 ? "s" : ""} (including CDN
                files)
              </li>
              <li>
                {user._count.savedLocations} saved location
                {user._count.savedLocations !== 1 ? "s" : ""}
              </li>
              <li>The user account and all personal data</li>
            </ul>
            <p className="mt-3 text-sm font-medium text-destructive">
              This action cannot be undone. A notification email will be sent to
              the user.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              Type <span className="text-destructive font-bold">DELETE</span> to
              confirm:
            </label>
            <Input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Type DELETE in capital letters"
              className={
                confirmText && !isConfirmValid ? "border-destructive" : ""
              }
              autoComplete="off"
              disabled={isDeleting}
            />
            {confirmText && !isConfirmValid && (
              <p className="text-xs text-destructive">
                Please type DELETE exactly (case-sensitive)
              </p>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={!isConfirmValid || isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete User"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
