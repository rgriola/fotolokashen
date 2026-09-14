import { NextRequest } from "next/server";
import { requireAuth, apiResponse, apiError } from "@/lib/api-middleware";
import { canAccessAdminPanel } from "@/lib/permissions";
import prisma from "@/lib/prisma";
import { normalizeEmail, unsuppressEmail } from "@/lib/email-suppression";

/**
 * DELETE /api/admin/email-suppressions/[email]
 * Reinstate a suppressed address. Admin only. Writes a SecurityLog entry.
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ email: string }> },
) {
  const authResult = await requireAuth(req);
  if (!authResult.authorized || !authResult.user) {
    return apiError("Unauthorized", 401);
  }
  if (!canAccessAdminPanel(authResult.user)) {
    return apiError("Admin access required", 403);
  }

  try {
    const { email: rawEmail } = await params;
    const email = normalizeEmail(decodeURIComponent(rawEmail));

    const existing = await prisma.emailSuppression.findUnique({
      where: { email },
    });
    if (!existing) {
      return apiError("Suppression not found", 404);
    }

    await unsuppressEmail(email);

    await prisma.securityLog.create({
      data: {
        userId: authResult.user.id,
        eventType: "ADMIN_EMAIL_SUPPRESSION_REMOVED",
        ipAddress:
          req.headers.get("x-forwarded-for") ||
          req.headers.get("x-real-ip") ||
          "unknown",
        userAgent: req.headers.get("user-agent") || "unknown",
        success: true,
        metadata: {
          email,
          previousReason: existing.reason,
          removedAt: new Date().toISOString(),
        },
      },
    });

    return apiResponse({ success: true, email });
  } catch (error) {
    console.error("Error removing email suppression:", error);
    return apiError("Failed to remove email suppression", 500);
  }
}
