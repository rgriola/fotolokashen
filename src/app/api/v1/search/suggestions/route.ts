/**
 * Username Suggestions API (Autocomplete)
 * 
 * GET /api/v1/search/suggestions
 * Query params:
 *   - q: Search query (required, min 2 chars)
 *   - limit: Number of suggestions (default: 10, max: 20)
 * 
 * Returns a simple array of username suggestions for typeahead/autocomplete
 */

import { getUsernameSuggestions } from '@/lib/search-utils';
import { withAuth, apiResponse, apiError } from '@/lib/api-middleware';

export const GET = withAuth(async (request, user) => {
  const { searchParams } = new URL(request.url);

  const query = searchParams.get('q');
  const limitParam = searchParams.get('limit');

  if (!query || query.trim().length < 2) {
    return apiError('Query must be at least 2 characters', 400);
  }

  const limit = Math.min(parseInt(limitParam || '10', 10), 20);
  const suggestions = await getUsernameSuggestions(query, limit, user.id);

  return apiResponse({ suggestions, query });
});
