import { NextRequest } from "next/server";
import {
  requireAuth,
  apiError,
  apiResponse,
  authErrorResponse,
} from "@/lib/api-middleware";
import prisma from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> },
) {
  try {
    // Authenticate user
    const authResult = await requireAuth(request);

    if (!authResult.authorized || !authResult.user) {
      return authErrorResponse(authResult);
    }

    const currentUser = authResult.user;

    // Await params (Next.js 15+)
    const { username } = await params;

    // Get target user (case-insensitive)
    const normalizedUsername = username.toLowerCase().trim();
    const targetUser = await prisma.user.findFirst({
      where: {
        username: {
          equals: normalizedUsername,
          mode: "insensitive",
        },
      },
      select: { id: true, username: true },
    });

    if (!targetUser) {
      return apiError("User not found", 404, "USER_NOT_FOUND");
    }

    // Validate: can't follow yourself
    if (currentUser.id === targetUser.id) {
      return apiError("You cannot follow yourself", 400, "INVALID_OPERATION");
    }

    // Check if already following
    const existingFollow = await prisma.userFollow.findUnique({
      where: {
        followerId_followingId: {
          followerId: currentUser.id,
          followingId: targetUser.id,
        },
      },
    });

    if (existingFollow) {
      return apiError(
        "You are already following this user",
        400,
        "ALREADY_FOLLOWING",
      );
    }

    // Create follow relationship
    const follow = await prisma.userFollow.create({
      data: {
        followerId: currentUser.id,
        followingId: targetUser.id,
      },
    });

    return apiResponse({
      success: true,
      follower: {
        id: currentUser.id,
        username: currentUser.username,
      },
      following: {
        id: targetUser.id,
        username: targetUser.username,
      },
      followedAt: follow.createdAt.toISOString(),
    });
  } catch (error) {
    console.error("Error creating follow relationship:", error);
    return apiError("Failed to follow user", 500);
  }
}
