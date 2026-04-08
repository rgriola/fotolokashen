/**
 * User Search API
 * 
 * GET /api/v1/search/users
 * Query params:
 *   - q: Search query (required, min 2 chars)
 *   - type: Search type (username, bio, geo, all) - default: all
 *   - city: Filter by city
 *   - country: Filter by country
 *   - limit: Results per page (default: 20, max: 50)
 *   - offset: Pagination offset (default: 0)
 */

import { searchUsers, searchByGeography, type SearchType } from '@/lib/search-utils';
import { withAuth, apiResponse, apiError } from '@/lib/api-middleware';

export const GET = withAuth(async (request, user) => {
  const { searchParams } = new URL(request.url);

  const query = searchParams.get('q');
  const type = (searchParams.get('type') || 'all') as SearchType;
  const city = searchParams.get('city');
  const country = searchParams.get('country');
  const limitParam = searchParams.get('limit');
  const offsetParam = searchParams.get('offset');

  if (!query || query.trim().length < 2) {
    return apiError('Query must be at least 2 characters', 400);
  }

  const validTypes: SearchType[] = ['username', 'bio', 'geo', 'all'];
  if (!validTypes.includes(type)) {
    return apiError(`Invalid type. Must be one of: ${validTypes.join(', ')}`, 400);
  }

  const limit = Math.min(parseInt(limitParam || '20', 10), 50);
  const offset = parseInt(offsetParam || '0', 10);

  let results;

  if (city || country) {
    results = await searchByGeography(city || undefined, country || undefined, limit, user.id);
  } else {
    results = await searchUsers(query, type, limit + offset + 1, user.id);
    results = results.slice(offset);
  }

  const hasMore = results.length > limit;
  const pageResults = results.slice(0, limit);

  return apiResponse({
    results: pageResults,
    pagination: {
      limit,
      offset,
      hasMore,
      total: hasMore ? offset + limit + 1 : offset + pageResults.length,
    },
    meta: {
      query,
      type,
      city: city || undefined,
      country: country || undefined,
    },
  });
});
