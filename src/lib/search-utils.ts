/**
 * Search utility functions for user discovery
 * Supports username, bio, location, and geographic search
 */

import prisma from './prisma';
import { Prisma } from '@prisma/client';

export interface SearchResult {
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

export type SearchType = 'username' | 'bio' | 'location' | 'geo' | 'all';

/**
 * Search users by username, first name, or last name using fuzzy matching
 * Requires pg_trgm extension to be enabled for trigram similarity on username
 */
export async function searchByUsername(
  query: string,
  limit: number = 20,
  currentUserId?: number
): Promise<SearchResult[]> {
  if (!query || query.trim().length < 2) {
    return [];
  }

  const normalizedQuery = query.toLowerCase().trim();
  const likePattern = `%${normalizedQuery}%`;

  try {
    // Use raw SQL for trigram similarity search on username + ILIKE on names
    const users = currentUserId
      ? await prisma.$queryRaw<Array<SearchResult & { score: number }>>`
          SELECT 
            id,
            username,
            "firstName",
            "lastName",
            avatar,
            bio,
            city,
            country,
            similarity(username, ${normalizedQuery}) as score
          FROM users
          WHERE 
            (username ILIKE ${likePattern}
             OR "firstName" ILIKE ${likePattern}
             OR "lastName" ILIKE ${likePattern})
            AND "deletedAt" IS NULL
            AND "showInSearch" = true
            AND id != ${currentUserId}
          ORDER BY 
            score DESC,
            username ASC
          LIMIT ${limit}
        `
      : await prisma.$queryRaw<Array<SearchResult & { score: number }>>`
          SELECT 
            id,
            username,
            "firstName",
            "lastName",
            avatar,
            bio,
            city,
            country,
            similarity(username, ${normalizedQuery}) as score
          FROM users
          WHERE 
            (username ILIKE ${likePattern}
             OR "firstName" ILIKE ${likePattern}
             OR "lastName" ILIKE ${likePattern})
            AND "deletedAt" IS NULL
            AND "showInSearch" = true
          ORDER BY 
            score DESC,
            username ASC
          LIMIT ${limit}
        `;

    return users.map(user => ({
      ...user,
      matchType: 'username' as const,
      matchScore: user.score,
    }));
  } catch (error) {
    console.error('Username search error:', error);
    // Fallback to simple ILIKE search if trigram extension not available
    const where: Prisma.UserWhereInput = {
      OR: [
        { username: { contains: normalizedQuery, mode: 'insensitive' } },
        { firstName: { contains: normalizedQuery, mode: 'insensitive' } },
        { lastName: { contains: normalizedQuery, mode: 'insensitive' } },
      ],
      deletedAt: null,
      showInSearch: true,
      ...(currentUserId ? { id: { not: currentUserId } } : {}),
    };

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        avatar: true,
        bio: true,
        city: true,
        country: true,
      },
      take: limit,
      orderBy: {
        username: 'asc',
      },
    });

    return users.map(user => ({
      ...user,
      matchType: 'username' as const,
    }));
  }
}

/**
 * Search users by bio using full-text search
 * Requires GIN index on bio field
 */
export async function searchByBio(
  keywords: string,
  limit: number = 20
): Promise<SearchResult[]> {
  if (!keywords || keywords.trim().length < 3) {
    return [];
  }

  const normalizedKeywords = keywords.toLowerCase().trim();

  try {
    // Use PostgreSQL full-text search
    const users = await prisma.$queryRaw<Array<SearchResult & { score: number }>>`
      SELECT 
        id,
        username,
        "firstName",
        "lastName",
        avatar,
        bio,
        city,
        country,
        ts_rank(
          to_tsvector('english', COALESCE(bio, '')), 
          to_tsquery('english', ${normalizedKeywords.replace(/\s+/g, ' & ')})
        ) as score
      FROM users
      WHERE 
        to_tsvector('english', COALESCE(bio, '')) @@ to_tsquery('english', ${normalizedKeywords.replace(/\s+/g, ' & ')})
        AND "deletedAt" IS NULL
        AND "showInSearch" = true
      ORDER BY score DESC
      LIMIT ${limit}
    `;

    return users.map(user => ({
      ...user,
      matchType: 'bio' as const,
      matchScore: user.score,
    }));
  } catch (error) {
    console.error('Bio search error:', error);
    // Fallback to simple contains search
    const users = await prisma.user.findMany({
      where: {
        bio: {
          contains: normalizedKeywords,
          mode: 'insensitive',
        },
        deletedAt: null,
      },
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        avatar: true,
        bio: true,
        city: true,
        country: true,
      },
      take: limit,
    });

    return users.map(user => ({
      ...user,
      matchType: 'bio' as const,
    }));
  }
}

/**
 * Search users by geographic location (city/country)
 */
export async function searchByGeography(
  city?: string,
  country?: string,
  limit: number = 20,
  currentUserId?: number
): Promise<SearchResult[]> {
  if (!city && !country) {
    return [];
  }

  const orConditions: Prisma.UserWhereInput[] = [];
  
  if (city) {
    orConditions.push({
      city: {
        equals: city,
        mode: 'insensitive' as Prisma.QueryMode,
      },
    });
  }
  
  if (country) {
    orConditions.push({
      country: {
        equals: country,
        mode: 'insensitive' as Prisma.QueryMode,
      },
    });
  }

  const where: Prisma.UserWhereInput = {
    deletedAt: null,
    showInSearch: true,
    OR: orConditions,
    ...(currentUserId ? { id: { not: currentUserId } } : {}),
  };

  const users = await prisma.user.findMany({
    where,
    select: {
      id: true,
      username: true,
      firstName: true,
      lastName: true,
      avatar: true,
      bio: true,
      city: true,
      country: true,
    },
    take: limit,
    orderBy: {
      username: 'asc',
    },
  });

  return users.map(user => ({
    ...user,
    matchType: 'geo' as const,
    context: city && country 
      ? `From ${city}, ${country}`
      : city 
      ? `From ${city}`
      : `From ${country}`,
  }));
}

/**
 * Search users who have saved the same location
 * Useful for finding people interested in the same places
 */
export async function searchByLocation(
  locationId: number,
  currentUserId: number,
  limit: number = 20
): Promise<SearchResult[]> {
  const users = await prisma.user.findMany({
    where: {
      id: { not: currentUserId },
      deletedAt: null,
      savedLocations: {
        some: {
          locationId,
          // Only show users with public or unlisted saves
          // (followers-only and private excluded for privacy)
          visibility: { in: ['public', 'unlisted'] },
        },
      },
    },
    select: {
      id: true,
      username: true,
      firstName: true,
      lastName: true,
      avatar: true,
      bio: true,
      city: true,
      country: true,
      savedLocations: {
        where: { locationId },
        take: 1,
        select: {
          savedAt: true,
        },
      },
    },
    take: limit,
    orderBy: {
      username: 'asc',
    },
  });

  return users.map(user => ({
    id: user.id,
    username: user.username,
    firstName: user.firstName,
    lastName: user.lastName,
    avatar: user.avatar,
    bio: user.bio,
    city: user.city,
    country: user.country,
    matchType: 'location' as const,
    context: 'Saved this location',
  }));
}

/**
 * Combined search across all criteria
 * Returns deduplicated results with best matches first
 */
export async function searchUsers(
  query: string,
  type: SearchType = 'all',
  limit: number = 20,
  currentUserId?: number
): Promise<SearchResult[]> {
  if (!query || query.trim().length < 2) {
    return [];
  }

  let results: SearchResult[] = [];

  // Search by type
  if (type === 'username' || type === 'all') {
    const usernameResults = await searchByUsername(query, limit, currentUserId);
    results = [...results, ...usernameResults];
  }

  if (type === 'bio' || type === 'all') {
    const bioResults = await searchByBio(query, limit);
    results = [...results, ...bioResults];
  }

  if (type === 'geo' || type === 'all') {
    // Try to parse city/country from query
    const parts = query.split(',').map(p => p.trim());
    if (parts.length === 2) {
      const geoResults = await searchByGeography(parts[0], parts[1], limit, currentUserId);
      results = [...results, ...geoResults];
    } else if (parts.length === 1) {
      const geoResults = await searchByGeography(undefined, parts[0], limit, currentUserId);
      results = [...results, ...geoResults];
    }
  }

  // Deduplicate by user ID, keeping highest score
  const deduped = new Map<number, SearchResult>();
  for (const result of results) {
    const existing = deduped.get(result.id);
    if (!existing || (result.matchScore && existing.matchScore && result.matchScore > existing.matchScore)) {
      deduped.set(result.id, result);
    }
  }

  // Sort by score (if available) then username
  const sorted = Array.from(deduped.values()).sort((a, b) => {
    if (a.matchScore && b.matchScore) {
      return b.matchScore - a.matchScore;
    }
    return a.username.localeCompare(b.username);
  });

  return sorted.slice(0, limit);
}

/**
 * Get search suggestions/autocomplete for usernames
 * Returns quick username matches for typeahead
 */
export async function getUsernameSuggestions(
  query: string,
  limit: number = 10,
  currentUserId?: number
): Promise<string[]> {
  if (!query || query.trim().length < 2) {
    return [];
  }

  const users = await searchByUsername(query, limit, currentUserId);
  return users.map(u => u.username);
}
