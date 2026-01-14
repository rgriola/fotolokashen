'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
  UserPlus,
  Mail
} from 'lucide-react';
import { toast } from 'sonner';
import type { Location } from '@/types/location';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth-context';

interface ShareLocationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  location: Location | null;
}

type VisibilityType = 'public' | 'private' | 'followers';
type ShareMethodType = 'link' | 'users' | 'email';

export function ShareLocationDialog({ 
  open, 
  onOpenChange, 
  location 
}: ShareLocationDialogProps) {
  const { user } = useAuth();
  const [visibility, setVisibility] = useState<VisibilityType>('public');
  const [shareMethod, setShareMethod] = useState<ShareMethodType>('link');
  const [copied, setCopied] = useState(false);
  const [emailInput, setEmailInput] = useState('');

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
      const response = await fetch(`/api/v1/locations/${location.id}/visibility`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visibility }),
      });

      if (response.ok) {
        toast.success(`Location visibility updated to ${visibility}`);
        onOpenChange(false);
      } else {
        throw new Error('Failed to update visibility');
      }
    } catch (error) {
      toast.error('Failed to update visibility');
      console.error(error);
    }
  };

  const handleShareViaEmail = () => {
    const link = getShareLink();
    const subject = encodeURIComponent(`Check out this location: ${location.name}`);
    const body = encodeURIComponent(
      `I wanted to share this location with you:\n\n${location.name}\n${location.address || 'No address available'}\n\n${link}`
    );
    window.location.href = `mailto:${emailInput}?subject=${subject}&body=${body}`;
    toast.success('Email client opened');
  };

  const visibilityOptions = [
    {
      value: 'public',
      icon: Globe,
      label: 'Public',
      description: 'Anyone can see this location'
    },
    {
      value: 'followers',
      icon: Users,
      label: 'Followers Only',
      description: 'Only people who follow you can see this'
    },
    {
      value: 'private',
      icon: Lock,
      label: 'Private',
      description: 'Only you can see this location'
    }
  ] as const;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Share Location</DialogTitle>
          <DialogDescription>
            Share &quot;{location.name}&quot; with others
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="link" value={shareMethod} onValueChange={(v) => setShareMethod(v as ShareMethodType)} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="link" className="flex items-center gap-2">
              <Link2 className="w-4 h-4" />
              Link
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <UserPlus className="w-4 h-4" />
              Users
            </TabsTrigger>
            <TabsTrigger value="email" className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Email
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
                  className="flex-1 font-mono text-xs"
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
              <p className="text-xs text-muted-foreground">
                Anyone with this link who meets the visibility requirements can view this location
              </p>
            </div>
          </TabsContent>

          <TabsContent value="users" className="space-y-4 mt-4">
            <div className="text-center py-8">
              <Users className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-sm text-muted-foreground mb-2">
                Share with specific users
              </p>
              <p className="text-xs text-muted-foreground">
                This feature will be available in Phase 2C
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                You'll be able to share locations with specific users, groups, or teams
              </p>
            </div>
          </TabsContent>

          <TabsContent value="email" className="space-y-4 mt-4">
            <div className="space-y-3">
              <Label htmlFor="email-input">Recipient Email</Label>
              <Input
                id="email-input"
                type="email"
                placeholder="friend@example.com"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Opens your email client with a pre-filled message containing the location details
              </p>
            </div>
            <Button 
              onClick={handleShareViaEmail} 
              disabled={!emailInput}
              className="w-full"
            >
              <Mail className="w-4 h-4 mr-2" />
              Share via Email
            </Button>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          {shareMethod === 'link' && (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateVisibility}>
                Update Visibility
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
