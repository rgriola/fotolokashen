'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface FollowButtonProps {
  username: string;
  initialFollowStatus?: boolean;
  variant?: 'default' | 'compact';
  className?: string;
}

export function FollowButton({ 
  username, 
  initialFollowStatus = false,
  variant = 'default',
  className = ''
}: FollowButtonProps) {
  const router = useRouter();
  const [isFollowing, setIsFollowing] = useState(initialFollowStatus);
  const [isLoading, setIsLoading] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Check follow status on mount
  useEffect(() => {
    async function checkFollowStatus() {
      try {
        const response = await fetch(`/api/v1/users/me/follow-status/${username}`);
        
        if (response.ok) {
          const data = await response.json();
          setIsFollowing(data.isFollowing);
        }
      } catch (error) {
        // Silently fail - user might not be logged in
        console.error('Error checking follow status:', error);
      }
    }

    checkFollowStatus();
  }, [username]);

  const handleFollow = async () => {
    setIsLoading(true);

    try {
      const endpoint = isFollowing 
        ? `/api/v1/users/${username}/unfollow`
        : `/api/v1/users/${username}/follow`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle errors
        if (response.status === 401) {
          toast.error('Please log in to follow users');
          router.push('/login');
          return;
        }

        throw new Error(data.error || 'Failed to update follow status');
      }

      // Optimistic update
      setIsFollowing(!isFollowing);

      // Show success message
      toast.success(
        isFollowing 
          ? `Unfollowed @${username}` 
          : `Following @${username}`
      );

      // Refresh the page to update follower counts
      router.refresh();

    } catch (error) {
      console.error('Error updating follow status:', error);
      toast.error(error instanceof Error ? error.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  // Compact variant for list views
  if (variant === 'compact') {
    return (
      <Button
        data-tour="people-follow"
        onClick={handleFollow}
        disabled={isLoading}
        size="sm"
        variant={isFollowing ? 'outline' : 'default'}
        className={className}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <span>{isFollowing ? 'Following' : 'Follow'}</span>
        )}
      </Button>
    );
  }

  // Default variant for profile pages
  return (
    <Button
      onClick={handleFollow}
      disabled={isLoading}
      variant={isFollowing ? 'outline' : 'default'}
      className={className}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          <span>Loading...</span>
        </>
      ) : (
        <span>
          {isFollowing 
            ? (isHovered ? 'Unfollow' : 'Following')
            : 'Follow'
          }
        </span>
      )}
    </Button>
  );
}
