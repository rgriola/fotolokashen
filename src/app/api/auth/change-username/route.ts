import { NextRequest } from "next/server";
import { z } from "zod";
import { requireAuth, apiResponse, apiError } from "@/lib/api-middleware";
import { comparePassword } from "@/lib/auth";
import {
  logSecurityEvent,
  SecurityEventType,
  getClientIP,
} from "@/lib/security";
import prisma from "@/lib/prisma";

// STRICT RATE LIMITING for usernames
const MAX_USERNAME_CHANGES_PER_MONTH = 1;
const MAX_USERNAME_CHANGES_PER_YEAR = 3;

// Username validation regex (3-50 chars, alphanumeric + hyphens/underscores)
const USERNAME_REGEX = /^[a-zA-Z0-9_-]{3,50}$/;

// Reserved usernames
const RESERVED_USERNAMES = [
  "admin",
  "api",
  "app",
  "auth",
  "blog",
  "help",
  "login",
  "logout",
  "map",
  "profile",
  "register",
  "settings",
  "teams",
  "verify-email",
  "reset-password",
  "forgot-password",
  "share",
  "support",
  "contact",
  "about",
  "privacy",
  "terms",
  "legal",
  "security",
  "status",
];

// Username validation schema
const changeUsernameSchema = z.object({
  newUsername: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(50, "Username must be 50 characters or less")
    .regex(
      USERNAME_REGEX,
      "Username can only contain letters, numbers, hyphens, and underscores",
    )
    .toLowerCase()
    .trim(),
  currentPassword: z.string().min(1, "Current password is required"),
});

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (!authResult.authorized || !authResult.user) {
      return apiError("Unauthorized", 401, "UNAUTHORIZED");
    }

    const body = await request.json();

    // BACKEND VALIDATION
    const validation = changeUsernameSchema.safeParse(body);
    if (!validation.success) {
      return apiError(
        validation.error.issues[0].message,
        400,
        "VALIDATION_ERROR",
      );
    }

    const { newUsername, currentPassword } = validation.data;

    // Get full user data
    const user = await prisma.user.findUnique({
      where: { id: authResult.user.id },
      select: {
        id: true,
        username: true,
        email: true,
        passwordHash: true,
      },
    });

    if (!user) {
      return apiError("User not found", 404, "USER_NOT_FOUND");
    }

    // Check if new username is same as current
    if (newUsername === user.username.toLowerCase()) {
      return apiError(
        "New username is the same as your current username",
        400,
        "SAME_USERNAME",
      );
    }

    // Check if username is reserved
    if (RESERVED_USERNAMES.includes(newUsername)) {
      return apiError(
        "This username is reserved and cannot be used",
        409,
        "USERNAME_RESERVED",
      );
    }

    // CHECK IF USERNAME ALREADY EXISTS
    const usernameTaken = await prisma.user.findUnique({
      where: { username: newUsername },
    });

    if (usernameTaken) {
      return apiError("This username is already taken", 409, "USERNAME_TAKEN");
    }

    // Verify current password
    const passwordValid = await comparePassword(
      currentPassword,
      user.passwordHash,
    );
    if (!passwordValid) {
      await logSecurityEvent({
        userId: user.id,
        eventType: SecurityEventType.PASSWORD_CHANGE,
        request,
        success: false,
        metadata: { reason: "incorrect_password_for_username_change" },
      });
      return apiError("Current password is incorrect", 401, "INVALID_PASSWORD");
    }

    // STRICT RATE LIMITING - 1 PER 30 DAYS
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentChanges = await prisma.usernameChangeRequest.count({
      where: {
        userId: user.id,
        createdAt: { gte: thirtyDaysAgo },
        completedAt: { not: null },
      },
    });

    if (recentChanges >= MAX_USERNAME_CHANGES_PER_MONTH) {
      await logSecurityEvent({
        userId: user.id,
        eventType: SecurityEventType.PASSWORD_CHANGE,
        request,
        success: false,
        metadata: { reason: "username_change_rate_limited_monthly" },
      });
      return apiError(
        "You can only change your username once per 30 days. Please try again later.",
        429,
        "RATE_LIMITED_MONTHLY",
      );
    }

    // STRICT RATE LIMITING - 3 PER YEAR
    const oneYearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
    const yearlyChanges = await prisma.usernameChangeRequest.count({
      where: {
        userId: user.id,
        createdAt: { gte: oneYearAgo },
        completedAt: { not: null },
      },
    });

    if (yearlyChanges >= MAX_USERNAME_CHANGES_PER_YEAR) {
      await logSecurityEvent({
        userId: user.id,
        eventType: SecurityEventType.PASSWORD_CHANGE,
        request,
        success: false,
        metadata: {
          reason: "username_change_rate_limited_yearly",
          yearlyCount: yearlyChanges,
        },
      });
      return apiError(
        "You have reached the maximum of 3 username changes per year. Please contact support if you need assistance.",
        429,
        "RATE_LIMITED_YEARLY",
      );
    }

    // Update username
    await prisma.user.update({
      where: { id: user.id },
      data: { username: newUsername },
    });

    // Log the change
    const ipAddress = getClientIP(request);
    const userAgent = request.headers.get("user-agent");

    await prisma.usernameChangeRequest.create({
      data: {
        userId: user.id,
        oldUsername: user.username,
        newUsername,
        ipAddress,
        userAgent,
        completedAt: new Date(),
      },
    });

    // Log security event
    await logSecurityEvent({
      userId: user.id,
      eventType: SecurityEventType.PASSWORD_CHANGE,
      request,
      success: true,
      metadata: {
        action: "username_changed",
        oldUsername: user.username,
        newUsername,
        yearlyCount: yearlyChanges + 1,
      },
    });

    return apiResponse({
      success: true,
      message: "Username changed successfully",
      username: newUsername,
    });
  } catch (error: any) {
    console.error("Username change error:", error);
    return apiError("Failed to change username", 500, "SERVER_ERROR");
  }
}
