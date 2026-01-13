'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';

interface SearchFiltersProps {
  filters: {
    type: string;
    city: string;
    country: string;
  };
  onFilterChange: (key: string, value: string) => void;
}

const searchTypes = [
  { value: 'all', label: 'All' },
  { value: 'username', label: 'Username' },
  { value: 'bio', label: 'Bio' },
  { value: 'geo', label: 'Location' },
];

export default function SearchFilters({ filters, onFilterChange }: SearchFiltersProps) {
  const hasActiveFilters = filters.type !== 'all' || filters.city || filters.country;

  const clearAllFilters = () => {
    onFilterChange('type', 'all');
    onFilterChange('city', '');
    onFilterChange('country', '');
  };

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Filters</h3>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="h-auto p-1 text-xs"
          >
            Clear all
          </Button>
        )}
      </div>

      <div className="mt-4 space-y-4">
        {/* Search Type Filter */}
        <div>
          <label className="mb-2 block text-sm font-medium">Search Type</label>
          <div className="flex flex-wrap gap-2">
            {searchTypes.map((type) => (
              <Badge
                key={type.value}
                variant={filters.type === type.value ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => onFilterChange('type', type.value)}
              >
                {type.label}
              </Badge>
            ))}
          </div>
        </div>

        {/* Active Filters Display */}
        {(filters.city || filters.country) && (
          <div>
            <label className="mb-2 block text-sm font-medium">Active Filters</label>
            <div className="flex flex-wrap gap-2">
              {filters.city && (
                <Badge variant="secondary" className="gap-1">
                  City: {filters.city}
                  <button
                    onClick={() => onFilterChange('city', '')}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {filters.country && (
                <Badge variant="secondary" className="gap-1">
                  Country: {filters.country}
                  <button
                    onClick={() => onFilterChange('country', '')}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
