'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/lib/auth-context';
import { UserPlus, Users } from 'lucide-react';

interface FriendsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FriendsDialog({ open, onOpenChange }: FriendsDialogProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'followers' | 'following'>('following');

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Friends & Followers</DialogTitle>
          <DialogDescription>
            View people you follow and those who follow you
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'followers' | 'following')} className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="following" className="flex items-center gap-2">
              <UserPlus className="w-4 h-4" />
              Following
            </TabsTrigger>
            <TabsTrigger value="followers" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Followers
            </TabsTrigger>
          </TabsList>

          <TabsContent value="following" className="flex-1 overflow-y-auto mt-4">
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground text-center py-8">
                View your following list on your{' '}
                <a 
                  href={`/@${user.username}/following`}
                  className="text-primary hover:underline font-medium"
                  onClick={() => onOpenChange(false)}
                >
                  profile page
                </a>
              </p>
            </div>
          </TabsContent>

          <TabsContent value="followers" className="flex-1 overflow-y-auto mt-4">
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground text-center py-8">
                View your followers on your{' '}
                <a 
                  href={`/@${user.username}/followers`}
                  className="text-primary hover:underline font-medium"
                  onClick={() => onOpenChange(false)}
                >
                  profile page
                </a>
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
