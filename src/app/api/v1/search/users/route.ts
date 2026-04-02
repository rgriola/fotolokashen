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

import { NextRequest, NextResponse } from 'next/server';
import { searchUsers, searchByGeography, type SearchType } from '@/lib/search-utils';
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
    const type = (searchParams.get('type') || 'all') as SearchType;
    const city = searchParams.get('city');
    const country = searchParams.get('country');
    const limitParam = searchParams.get('limit');
    const offsetParam = searchParams.get('offset');

    // Validate query
    if (!query || query.trim().length < 2) {
      return NextResponse.json(
        { error: 'Query must be at least 2 characters' },
        { status: 400 }
      );
    }

    // Validate type
    const validTypes: SearchType[] = ['username', 'bio', 'geo', 'all'];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: `Invalid type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // Parse pagination params
    const limit = Math.min(parseInt(limitParam || '20', 10), 50);
    const offset = parseInt(offsetParam || '0', 10);

    // Perform search
    let results;
    
    // If city or country specified, use geographic search
    if (city || country) {
      results = await searchByGeography(city || undefined, country || undefined, limit, currentUserId);
    } else {
      // Regular search by query and type
      results = await searchUsers(query, type, limit + offset + 1, currentUserId);
      
      // Apply offset and check if there are more results
      results = results.slice(offset);
    }

    // Separate current page and check for next page
    const hasMore = results.length > limit;
    const pageResults = results.slice(0, limit);

    // Build response
    return NextResponse.json({
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

  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
