'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import SearchBar from '@/components/search/SearchBar';
import UserSearchCard from '@/components/search/UserSearchCard';
import SearchFilters from '@/components/search/SearchFilters';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

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
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  
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

  // Initial search on mount
  useEffect(() => {
    if (initialQuery) {
      performSearch(initialQuery);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Re-search when filters change
  useEffect(() => {
    if (currentQuery) {
      performSearch(currentQuery);
    }
  }, [filters]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = (query: string) => {
    performSearch(query);
  };

  const handleLoadMore = () => {
    performSearch(currentQuery, pagination.offset + pagination.limit, true);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 py-8">
        {/* Search Bar */}
        <div className="mb-8">
          <h1 className="mb-4 text-3xl font-bold">Search Users</h1>
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
        <div className="mt-6">
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
              <p className="text-lg text-muted-foreground">
                Start searching to discover users
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Try searching for usernames, interests, or locations
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
