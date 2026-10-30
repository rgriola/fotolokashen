import { after, NextRequest } from "next/server";
import {
  requireAuth,
  apiResponse,
  apiError,
  authErrorResponse,
} from "@/lib/api-middleware";
import {
  deleteAccountAndQueueMedia,
  processAccountMediaCleanup,
} from "@/lib/account-deletion";

export const runtime = "nodejs";
export const maxDuration = 60;

/** DELETE /api/auth/delete-account — authenticated self-deletion only. */
export async function DELETE(req: NextRequest) {
  const authResult = await requireAuth(req);
  if (!authResult.authorized || !authResult.user) {
    return authErrorResponse(authResult);
  }

  let cleanupId: string | null;
  try {
    cleanupId = await deleteAccountAndQueueMedia(authResult.user.id);
  } catch {
    console.error("[DeleteAccount] Account deletion transaction failed");
    return apiError("Failed to delete account", 500);
  }
  if (!cleanupId) return apiError("User not found", 404);

  // The committed queue survives failed/terminated post-response work.
  after(async () => {
    try {
      await processAccountMediaCleanup(cleanupId);
    } catch {
      console.error("[DeleteAccount] Queued media cleanup could not run", {
        cleanupId,
      });
    }
  });
  return apiResponse({
    success: true,
    message: "Account deleted. Media removal queued for automatic cleanup.",
    mediaCleanup: "queued",
  });
}
