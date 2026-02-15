'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/lib/auth-context';
import { UserPlus, Users, Loader2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

interface FriendsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface UserData {
  id: number;
  username: string;
  displayName: string;
  avatar: string | null;
  bio: string | null;
  followedAt?: string;
}

interface ApiResponse {
  following?: UserData[];
  followers?: UserData[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasMore: boolean;
  };
}

export function FriendsDialog({ open, onOpenChange }: FriendsDialogProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'followers' | 'following'>('following');
  const [following, setFollowing] = useState<UserData[]>([]);
  const [followers, setFollowers] = useState<UserData[]>([]);
  const [loadingFollowing, setLoadingFollowing] = useState(false);
  const [loadingFollowers, setLoadingFollowers] = useState(false);
  const [followingTotal, setFollowingTotal] = useState(0);
  const [followersTotal, setFollowersTotal] = useState(0);

  const fetchFollowing = async () => {
    if (!user) return;
    setLoadingFollowing(true);
    try {
      const response = await fetch(`/api/v1/users/${user.username}/following?limit=50`);
      if (response.ok) {
        const data: ApiResponse = await response.json();
        setFollowing(data.following || []);
        setFollowingTotal(data.pagination.total);
      }
    } catch (error) {
      console.error('Error fetching following:', error);
    } finally {
      setLoadingFollowing(false);
    }
  };

  const fetchFollowers = async () => {
    if (!user) return;
    setLoadingFollowers(true);
    try {
      const response = await fetch(`/api/v1/users/${user.username}/followers?limit=50`);
      if (response.ok) {
        const data: ApiResponse = await response.json();
        setFollowers(data.followers || []);
        setFollowersTotal(data.pagination.total);
      }
    } catch (error) {
      console.error('Error fetching followers:', error);
    } finally {
      setLoadingFollowers(false);
    }
  };

  useEffect(() => {
    if (open && user) {
      fetchFollowing();
      fetchFollowers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, user]);

  if (!user) return null;

  const renderUserCard = (userData: UserData) => (
    <Link
      key={userData.id}
      href={`/${userData.username}`}
      onClick={() => onOpenChange(false)}
      className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
    >
      {userData.avatar ? (
        <Image
          src={userData.avatar}
          alt={userData.displayName}
          width={40}
          height={40}
          className="rounded-full"
        />
      ) : (
        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-sm font-semibold">
          {userData.username.charAt(0).toUpperCase()}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="font-medium truncate">{userData.displayName}</div>
        <div className="text-sm text-muted-foreground truncate">@{userData.username}</div>
        {userData.bio && (
          <div className="text-xs text-muted-foreground truncate mt-1">{userData.bio}</div>
        )}
      </div>
    </Link>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-150 h-150 max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Friends & Followers</DialogTitle>
          <DialogDescription>
            View people you follow and those who follow you
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'followers' | 'following')} className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="following" className="flex items-center gap-2">
              <UserPlus className="w-4 h-4" />
              Following {followingTotal > 0 && `(${followingTotal})`}
            </TabsTrigger>
            <TabsTrigger value="followers" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Followers {followersTotal > 0 && `(${followersTotal})`}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="following" className="flex-1 overflow-y-auto mt-4 min-h-0 data-[state=inactive]:hidden">
            {loadingFollowing ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : following.length > 0 ? (
              <div className="space-y-1">
                {following.map(renderUserCard)}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full">
                <UserPlus className="w-12 h-12 text-muted-foreground/50 mb-3" />
                <p className="text-sm text-muted-foreground">
                  You're not following anyone yet
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Start exploring and follow people to see them here
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="followers" className="flex-1 overflow-y-auto mt-4 min-h-0 data-[state=inactive]:hidden">
            {loadingFollowers ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : followers.length > 0 ? (
              <div className="space-y-1">
                {followers.map(renderUserCard)}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full">
                <Users className="w-12 h-12 text-muted-foreground/50 mb-3" />
                <p className="text-sm text-muted-foreground">
                  No followers yet
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Share your profile to get followers
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
