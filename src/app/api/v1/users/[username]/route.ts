import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { apiError } from "@/lib/api-middleware";
import { normalizeUsername } from "@/lib/username-utils";

/**
 * GET /api/v1/users/:username
 * Get user profile data (mobile-friendly JSON response)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> },
) {
  try {
    const { username } = await params;
    const cleanUsername = username.startsWith("@")
      ? username.slice(1)
      : username;

    // Case-insensitive lookup
    const user = await prisma.user.findFirst({
      where: {
        username: {
          equals: normalizeUsername(cleanUsername),
          mode: "insensitive",
        },
      },
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        avatar: true,
        bannerImage: true,
        bio: true,
        createdAt: true,
        _count: {
          select: {
            savedLocations: {
              where: {
                visibility: "public",
              },
            },
          },
        },
      },
    });

    if (!user) {
      return apiError("User not found", 404, "USER_NOT_FOUND");
    }

    // Format response for mobile
    const responseData = {
      id: user.id,
      username: user.username,
      displayName:
        user.firstName && user.lastName
          ? `${user.firstName} ${user.lastName}`
          : user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      avatar: user.avatar,
      bannerImage: user.bannerImage,
      bio: user.bio,
      publicLocationCount: user._count.savedLocations,
      joinedAt: user.createdAt.toISOString(),
      profileUrl: `/@${user.username}`,
    };

    const response = NextResponse.json(responseData, { status: 200 });
    response.headers.set(
      "Cache-Control",
      "public, s-maxage=60, stale-while-revalidate=120",
    );
    response.headers.set("X-API-Version", "1.0");
    return response;
  } catch (error) {
    console.error("[API v1] Error fetching user:", error);
    return apiError("Failed to fetch user", 500, "INTERNAL_ERROR");
  }
}
