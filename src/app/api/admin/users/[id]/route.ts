import { after, NextRequest } from "next/server";
import { requireAdmin, apiResponse, apiError } from "@/lib/api-middleware";
import prisma from "@/lib/prisma";
import { sendAccountDeletionEmail } from "@/lib/email";
import {
  deleteAccountAndQueueMedia,
  processAccountMediaCleanup,
} from "@/lib/account-deletion";

// Runtime config for edge/node
export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * DELETE /api/admin/users/[id]
 * Delete a user and all associated data
 * Admin only
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  console.log("[DeleteUser] Starting deletion request");

  // Check admin authorization
  const authResult = await requireAdmin(req);
  console.log("[DeleteUser] Auth result:", authResult.authorized);

  if (!authResult.authorized) {
    console.log("[DeleteUser] Unauthorized:", authResult.error);
    return apiError(authResult.error || "Unauthorized", 401);
  }

  const adminUser = authResult.user!;
  const { id } = await params;
  const userId = parseInt(id);

  console.log(
    "[DeleteUser] Admin user:",
    adminUser.email,
    "Deleting user ID:",
    userId,
  );

  if (isNaN(userId)) {
    console.log("[DeleteUser] Invalid user ID:", id);
    return apiError("Invalid user ID", 400);
  }

  // Prevent self-deletion
  if (userId === adminUser.id) {
    console.log("[DeleteUser] Attempted self-deletion");
    return apiError("Cannot delete your own account", 400);
  }

  try {
    // Fetch user with all related data
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
      },
    });

    if (!user) {
      return apiError("User not found", 404);
    }

    const cleanupId = await deleteAccountAndQueueMedia(userId, {
      userId: adminUser.id,
      ipAddress:
        req.headers.get("x-forwarded-for") ||
        req.headers.get("x-real-ip") ||
        "unknown",
      userAgent: req.headers.get("user-agent") || "unknown",
    });
    if (!cleanupId) return apiError("User not found", 404);
    after(async () => {
      try {
        await processAccountMediaCleanup(cleanupId);
      } catch {
        console.error("[DeleteUser] Queued media cleanup could not run", {
          cleanupId,
        });
      }
    });

    // Send deletion notification email to user
    const userName =
      user.firstName && user.lastName
        ? `${user.firstName} ${user.lastName}`
        : user.firstName || user.lastName || user.username;

    try {
      await sendAccountDeletionEmail(user.email, userName);
      console.log(
        `[DeleteUser] Deletion notification email sent to ${user.email}`,
      );
    } catch (error) {
      console.error(
        `[DeleteUser] Failed to send deletion email to ${user.email}:`,
        error,
      );
      // Continue even if email fails - user is already deleted
    }

    console.log(
      `[DeleteUser] User ${user.email} deleted by admin ${adminUser.email}`,
    );

    return apiResponse({
      success: true,
      message: `User ${user.email} deleted successfully`,
      mediaCleanup: "queued",
      deletedUser: {
        id: user.id,
        email: user.email,
        username: user.username,
      },
    });
  } catch (error) {
    console.error("Error deleting user:", error);

    // Log failed deletion attempt
    try {
      await prisma.securityLog.create({
        data: {
          userId: adminUser.id,
          eventType: "ADMIN_USER_DELETE_FAILED",
          ipAddress:
            req.headers.get("x-forwarded-for") ||
            req.headers.get("x-real-ip") ||
            "unknown",
          userAgent: req.headers.get("user-agent") || "unknown",
          success: false,
          metadata: {
            targetUserId: userId,
            error: error instanceof Error ? error.message : "Unknown error",
          },
        },
      });
    } catch (logError) {
      console.error("[DeleteUser] Failed to record deletion failure", logError);
    }

    return apiError("Failed to delete user", 500);
  }
}
