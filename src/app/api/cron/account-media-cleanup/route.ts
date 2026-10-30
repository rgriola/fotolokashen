import { NextRequest } from "next/server";
import { apiError, apiResponse } from "@/lib/api-middleware";
import { processDueAccountMediaCleanup } from "@/lib/account-deletion";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.error("[AccountMediaCleanup] CRON_SECRET is not configured");
    return apiError("Cleanup worker is not configured", 503);
  }
  if (req.headers.get("authorization") !== `Bearer ${secret}`) {
    return apiError("Unauthorized cron request", 401, "CRON_UNAUTHORIZED");
  }
  try {
    const counts = await processDueAccountMediaCleanup();
    console.info("[AccountMediaCleanup] Worker results", counts);
    if (counts.failed > 0) {
      return apiResponse(
        { ...counts, error: "Media cleanup requires retry" },
        503,
      );
    }
    return apiResponse(counts);
  } catch {
    console.error("[AccountMediaCleanup] Worker execution failed");
    return apiError("Failed to execute media cleanup", 500);
  }
}
