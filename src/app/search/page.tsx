'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import SearchBar from '@/components/search/SearchBar';
import UserSearchCard from '@/components/search/UserSearchCard';
import SearchFilters from '@/components/search/SearchFilters';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Search, UserPlus, Users, UsersRound, Briefcase } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import Image from 'next/image';
import Link from 'next/link';
import { FollowButton } from '@/components/social';

interface SearchResult {
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

interface SearchResponse {
  results: SearchResult[];
  pagination: {
    limit: number;
    offset: number;
    hasMore: boolean;
    total: number;
  };
  meta: {
    query: string;
    type: string;
    city?: string;
    country?: string;
  };
}

export default function SearchPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const initialTab = searchParams.get('tab') || 'discover';
  
  const [activeTab, setActiveTab] = useState(initialTab);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    limit: 20,
    offset: 0,
    hasMore: false,
    total: 0,
  });
  const [filters, setFilters] = useState({
    type: 'all',
    city: '',
    country: '',
  });
  const [currentQuery, setCurrentQuery] = useState(initialQuery);

  // Following/Followers state
  const [following, setFollowing] = useState<UserData[]>([]);
  const [followers, setFollowers] = useState<UserData[]>([]);
  const [loadingFollowing, setLoadingFollowing] = useState(false);
  const [loadingFollowers, setLoadingFollowers] = useState(false);
  const [followingTotal, setFollowingTotal] = useState(0);
  const [followersTotal, setFollowersTotal] = useState(0);

  const performSearch = async (query: string, offset: number = 0, append: boolean = false) => {
    if (query.length < 2) {
      setError('Please enter at least 2 characters');
      return;
    }

    if (append) {
      setIsLoadingMore(true);
    } else {
      setIsLoading(true);
      setError(null);
    }

    try {
      const params = new URLSearchParams({
        q: query,
        type: filters.type,
        limit: '20',
        offset: offset.toString(),
      });

      if (filters.city) params.append('city', filters.city);
      if (filters.country) params.append('country', filters.country);

      const response = await fetch(`/api/v1/search/users?${params}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Search failed');
      }

      const data: SearchResponse = await response.json();
      
      if (append) {
        setResults((prev) => [...prev, ...data.results]);
      } else {
        setResults(data.results);
      }
      
      setPagination(data.pagination);
      setCurrentQuery(query);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      if (!append) {
        setResults([]);
      }
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

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

  // Initial search on mount
  useEffect(() => {
    if (initialQuery && activeTab === 'discover') {
      performSearch(initialQuery);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Load following/followers when switching tabs
  useEffect(() => {
    if (activeTab === 'following' && user) {
      fetchFollowing();
    } else if (activeTab === 'followers' && user) {
      fetchFollowers();
    }
  }, [activeTab, user]); // eslint-disable-line react-hooks/exhaustive-deps

  // Re-search when filters change
  useEffect(() => {
    if (currentQuery && activeTab === 'discover') {
      performSearch(currentQuery);
    }
  }, [filters]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = (query: string) => {
    performSearch(query);
  };

  const handleLoadMore = () => {
    performSearch(currentQuery, pagination.offset + pagination.limit, true);
  };

  const renderUserCard = (userData: UserData) => (
    <Link
      key={userData.id}
      href={`/${userData.username}`}
      className="flex items-center gap-3 p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
    >
      {userData.avatar ? (
        <Image
          src={userData.avatar}
          alt={userData.displayName}
          width={48}
          height={48}
          className="rounded-full"
        />
      ) : (
        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-sm font-semibold">
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
      <FollowButton username={userData.username} variant="compact" />
    </Link>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold">People</h1>
          <p className="text-muted-foreground">
            Discover new people, manage your connections, and collaborate
          </p>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="discover" className="flex items-center gap-2">
              <Search className="w-4 h-4" />
              <span className="hidden sm:inline">Discover</span>
            </TabsTrigger>
            <TabsTrigger value="following" className="flex items-center gap-2">
              <UserPlus className="w-4 h-4" />
              <span className="hidden sm:inline">Following</span>
              {followingTotal > 0 && <span className="text-xs">({followingTotal})</span>}
            </TabsTrigger>
            <TabsTrigger value="followers" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Followers</span>
              {followersTotal > 0 && <span className="text-xs">({followersTotal})</span>}
            </TabsTrigger>
            <TabsTrigger value="teams" disabled className="flex items-center gap-2 opacity-50">
              <UsersRound className="w-4 h-4" />
              <span className="hidden sm:inline">Teams</span>
            </TabsTrigger>
            <TabsTrigger value="projects" disabled className="flex items-center gap-2 opacity-50">
              <Briefcase className="w-4 h-4" />
              <span className="hidden sm:inline">Projects</span>
            </TabsTrigger>
          </TabsList>

          {/* Discover Tab */}
          <TabsContent value="discover" className="space-y-6">
            {/* Search Bar */}
            <div>
              <SearchBar
                placeholder="Search by username, bio, or location..."
                autoFocus={!initialQuery}
                showFullResults={false}
                onSearch={handleSearch}
              />
            </div>

            {/* Filters */}
            <SearchFilters
              filters={filters}
              onFilterChange={(key: string, value: string) =>
                setFilters((prev) => ({ ...prev, [key]: value }))
              }
            />

            {/* Results */}
            <div>
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : error ? (
                <div className="rounded-lg border border-destructive bg-destructive/10 p-6 text-center">
                  <p className="text-destructive">{error}</p>
                </div>
              ) : results.length === 0 && currentQuery ? (
                <div className="rounded-lg border bg-muted/50 p-12 text-center">
                  <p className="text-lg text-muted-foreground">
                    No users found for &quot;{currentQuery}&quot;
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Try a different search term or adjust your filters
                  </p>
                </div>
              ) : results.length > 0 ? (
                <>
                  <div className="mb-4 text-sm text-muted-foreground">
                    Found {pagination.total}+ user{pagination.total !== 1 ? 's' : ''} for &quot;
                    {currentQuery}&quot;
                  </div>
                  <div className="space-y-3">
                    {results.map((result) => (
                      <UserSearchCard key={result.id} user={result} />
                    ))}
                  </div>
                  
                  {/* Load More */}
                  {pagination.hasMore && (
                    <div className="mt-6 text-center">
                      <Button
                        onClick={handleLoadMore}
                        disabled={isLoadingMore}
                        variant="outline"
                        size="lg"
                      >
                        {isLoadingMore ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Loading...
                          </>
                        ) : (
                          'Load More'
                        )}
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <div className="rounded-lg border bg-muted/50 p-12 text-center">
                  <Search className="mx-auto w-12 h-12 text-muted-foreground/50 mb-3" />
                  <p className="text-lg text-muted-foreground">
                    Start searching to discover people
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Try searching for usernames, interests, or locations
                  </p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Following Tab */}
          <TabsContent value="following" className="space-y-4">
            {!user ? (
              <div className="rounded-lg border bg-muted/50 p-12 text-center">
                <p className="text-lg text-muted-foreground">
                  Please log in to see people you follow
                </p>
              </div>
            ) : loadingFollowing ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : following.length > 0 ? (
              <>
                <div className="mb-4 text-sm text-muted-foreground">
                  You are following {followingTotal} {followingTotal === 1 ? 'person' : 'people'}
                </div>
                <div className="space-y-2">
                  {following.map(renderUserCard)}
                </div>
              </>
            ) : (
              <div className="rounded-lg border bg-muted/50 p-12 text-center">
                <UserPlus className="mx-auto w-12 h-12 text-muted-foreground/50 mb-3" />
                <p className="text-lg text-muted-foreground">
                  You're not following anyone yet
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Start exploring and follow people to see them here
                </p>
                <Button
                  onClick={() => setActiveTab('discover')}
                  className="mt-4"
                  variant="outline"
                >
                  Discover People
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Followers Tab */}
          <TabsContent value="followers" className="space-y-4">
            {!user ? (
              <div className="rounded-lg border bg-muted/50 p-12 text-center">
                <p className="text-lg text-muted-foreground">
                  Please log in to see your followers
                </p>
              </div>
            ) : loadingFollowers ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : followers.length > 0 ? (
              <>
                <div className="mb-4 text-sm text-muted-foreground">
                  {followersTotal} {followersTotal === 1 ? 'person follows' : 'people follow'} you
                </div>
                <div className="space-y-2">
                  {followers.map(renderUserCard)}
                </div>
              </>
            ) : (
              <div className="rounded-lg border bg-muted/50 p-12 text-center">
                <Users className="mx-auto w-12 h-12 text-muted-foreground/50 mb-3" />
                <p className="text-lg text-muted-foreground">
                  No followers yet
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Share your profile to get followers
                </p>
              </div>
            )}
          </TabsContent>

          {/* Teams Tab (Placeholder) */}
          <TabsContent value="teams" className="space-y-4">
            <div className="rounded-lg border bg-muted/50 p-12 text-center">
              <UsersRound className="mx-auto w-12 h-12 text-muted-foreground/50 mb-3" />
              <p className="text-lg text-muted-foreground font-semibold">
                Teams - Coming Soon
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Collaborate with teams to manage shared location collections
              </p>
            </div>
          </TabsContent>

          {/* Projects Tab (Placeholder) */}
          <TabsContent value="projects" className="space-y-4">
            <div className="rounded-lg border bg-muted/50 p-12 text-center">
              <Briefcase className="mx-auto w-12 h-12 text-muted-foreground/50 mb-3" />
              <p className="text-lg text-muted-foreground font-semibold">
                Projects - Coming Soon
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Organize locations into projects for better workflow management
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
