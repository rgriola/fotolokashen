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

import { NextRequest, NextResponse } from 'next/server';
import { getUsernameSuggestions } from '@/lib/search-utils';
import { requireAuth } from '@/lib/api-middleware';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (!auth.authorized || !auth.user) {
      return Response.json({ error: auth.error }, { status: 401 });
    }

    const currentUserId = auth.user.id;
    const { searchParams } = new URL(request.url);
    
    // Get query parameters
    const query = searchParams.get('q');
    const limitParam = searchParams.get('limit');

    // Validate query
    if (!query || query.trim().length < 2) {
      return NextResponse.json(
        { error: 'Query must be at least 2 characters' },
        { status: 400 }
      );
    }

    // Parse limit (default 10, max 20)
    const limit = Math.min(parseInt(limitParam || '10', 10), 20);

    // Get suggestions
    const suggestions = await getUsernameSuggestions(query, limit, currentUserId);

    // Return simple response
    return NextResponse.json({
      suggestions,
      query,
    });

  } catch (error) {
    console.error('Suggestions API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
