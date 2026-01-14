"use client";

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Copy, 
  Check, 
  Users, 
  Link2, 
  Globe, 
  Lock,
  UserPlus
} from 'lucide-react';
import { toast } from 'sonner';
import type { Location } from '@/types/location';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth-context';

interface ShareLocationDialogProps {
  location: Location | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type VisibilityType = 'public' | 'private' | 'followers';
type ShareMethodType = 'link' | 'users';

export function ShareLocationDialog({ 
  location, 
  open, 
  onOpenChange 
}: ShareLocationDialogProps) {
  const { user } = useAuth();
  // Initialize visibility from the location's current visibility (from userSave)
  const currentVisibility = (location?.userSave?.visibility as VisibilityType) || 'public';
  const [visibility, setVisibility] = useState<VisibilityType>(currentVisibility);
  const [shareMethod, setShareMethod] = useState<ShareMethodType>('link');
  const [copied, setCopied] = useState(false);

  if (!location) return null;

  // Generate shareable link
  const getShareLink = () => {
    if (typeof window === 'undefined' || !user?.username) return '';
    const baseUrl = window.location.origin;
    return `${baseUrl}/@${user.username}/locations/${location.id}`;
  };

  const handleCopyLink = async () => {
    const link = getShareLink();
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      toast.success('Link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy link');
    }
  };

  const handleUpdateVisibility = async () => {
    try {
      // Use UserSave ID (not Location ID) - the API updates the UserSave visibility
      const userSaveId = location.userSave?.id || location.id;
      
      const response = await fetch(`/api/v1/locations/${userSaveId}/visibility`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visibility }),
      });

      if (response.ok) {
        toast.success(`Location visibility updated to ${visibility}`);
        // Reload the page to reflect changes
        window.location.reload();
        onOpenChange(false);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update visibility');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update visibility';
      toast.error(errorMessage);
      console.error('Visibility update error:', error);
    }
  };

  const visibilityOptions = [
    {
      value: 'public' as VisibilityType,
      label: 'Public',
      description: 'Anyone can see this location',
      icon: Globe,
    },
    {
      value: 'followers' as VisibilityType,
      label: 'Followers Only',
      description: 'Only your followers can see this',
      icon: Users,
    },
    {
      value: 'private' as VisibilityType,
      label: 'Private',
      description: 'Only you can see this location',
      icon: Lock,
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Share Location</DialogTitle>
          <DialogDescription>
            Share "{location.name}" with others
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="link" value={shareMethod} onValueChange={(v) => setShareMethod(v as ShareMethodType)} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="link" className="flex items-center gap-2">
              <Link2 className="w-4 h-4" />
              Link
            </TabsTrigger>
            <TabsTrigger value="users" disabled className="flex items-center gap-2 opacity-50 cursor-not-allowed">
              <UserPlus className="w-4 h-4" />
              Friends
            </TabsTrigger>
          </TabsList>

          <TabsContent value="link" className="space-y-4 mt-4">
            <div className="space-y-3">
              <Label>Visibility</Label>
              <div className="space-y-2">
                {visibilityOptions.map((option) => {
                  const Icon = option.icon;
                  const isSelected = visibility === option.value;
                  return (
                    <button
                      key={option.value}
                      onClick={() => setVisibility(option.value)}
                      className={cn(
                        "w-full flex items-start gap-3 p-3 rounded-lg border-2 transition-colors text-left",
                        isSelected 
                          ? "border-primary bg-primary/5" 
                          : "border-border hover:border-primary/50"
                      )}
                    >
                      <Icon className={cn(
                        "w-5 h-5 mt-0.5 flex-shrink-0",
                        isSelected ? "text-primary" : "text-muted-foreground"
                      )} />
                      <div className="flex-1">
                        <div className={cn(
                          "font-medium",
                          isSelected && "text-primary"
                        )}>
                          {option.label}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {option.description}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Share Link</Label>
              <div className="flex gap-2">
                <Input
                  value={getShareLink()}
                  readOnly
                  className="flex-1"
                />
                <Button
                  onClick={handleCopyLink}
                  variant="outline"
                  size="icon"
                  className="flex-shrink-0"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>

            <Button onClick={handleUpdateVisibility} className="w-full">
              Update Visibility & Close
            </Button>
          </TabsContent>

          <TabsContent value="users" className="space-y-4 mt-4">
            <div className="text-center py-8">
              <UserPlus className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold text-lg mb-2">Share with Friends</h3>
              <p className="text-sm text-muted-foreground mb-4">
                This feature will be available in Phase 2C
              </p>
              <p className="text-xs text-muted-foreground">
                Coming soon: Share with individual friends, groups, or teams
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
