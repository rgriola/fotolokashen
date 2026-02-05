'use client';

import Link from 'next/link';
import Image from 'next/image';
import { MapPin, Search, FileText, Globe } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface UserSearchCardProps {
  user: {
    id: number;
    username: string;
    firstName: string | null;
    lastName: string | null;
    avatar: string | null;
    bio: string | null;
    city: string | null;
    country: string | null;
    matchType: 'username' | 'bio' | 'location' | 'geo';
    matchScore?: number;
    context?: string;
  };
}

export default function UserSearchCard({ user }: UserSearchCardProps) {
  const displayName = user.firstName && user.lastName
    ? `${user.firstName} ${user.lastName}`
    : user.firstName || user.lastName || user.username;

  const location = [user.city, user.country].filter(Boolean).join(', ');

  const getMatchIcon = () => {
    switch (user.matchType) {
      case 'username':
        return <Search className="h-3 w-3" />;
      case 'bio':
        return <FileText className="h-3 w-3" />;
      case 'geo':
        return <Globe className="h-3 w-3" />;
      case 'location':
        return <MapPin className="h-3 w-3" />;
      default:
        return null;
    }
  };

  const getMatchLabel = () => {
    switch (user.matchType) {
      case 'username':
        return 'Username match';
      case 'bio':
        return 'Bio match';
      case 'geo':
        return 'Location match';
      case 'location':
        return user.context || 'Location match';
      default:
        return 'Match';
    }
  };

  return (
    <Link href={`/${user.username}`}>
      <Card data-tour="people-user-card" className="transition-colors hover:bg-accent">
        <div className="flex items-center gap-4 p-4">
          {/* Avatar */}
          <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-full bg-muted">
            {user.avatar ? (
              <Image
                src={user.avatar}
                alt={displayName}
                fill
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-2xl font-semibold text-muted-foreground">
                {displayName[0]?.toUpperCase()}
              </div>
            )}
          </div>

          {/* User Info */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="truncate font-semibold">{displayName}</h3>
              {user.matchScore && user.matchScore > 0.7 && (
                <Badge variant="secondary" className="text-xs">
                  {Math.round(user.matchScore * 100)}% match
                </Badge>
              )}
            </div>
            <p className="truncate text-sm text-muted-foreground">
              @{user.username}
            </p>
            
            {user.bio && (
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                {user.bio}
              </p>
            )}
            
            {location && (
              <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" />
                <span>{location}</span>
              </div>
            )}
          </div>

          {/* Match Type Badge */}
          <div className="flex-shrink-0">
            <Badge variant="outline" className="gap-1">
              {getMatchIcon()}
              <span className="hidden sm:inline">{getMatchLabel()}</span>
            </Badge>
          </div>
        </div>
      </Card>
    </Link>
  );
}
