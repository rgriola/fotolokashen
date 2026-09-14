import { NextRequest } from "next/server";
import { z } from "zod";
import { requireAuth, apiResponse, apiError } from "@/lib/api-middleware";
import { canAccessAdminPanel } from "@/lib/permissions";
import prisma from "@/lib/prisma";
import {
  isProtectedAddress,
  normalizeEmail,
  suppressEmail,
} from "@/lib/email-suppression";

const REASON_VALUES = new Set([
  "hard_bounce",
  "complaint",
  "provider_suppressed",
  "manual",
]);

const createSuppressionSchema = z.object({
  email: z.string().email("Invalid email address"),
  detail: z.string().max(500).optional(),
});

/**
 * GET /api/admin/email-suppressions
 * Paginated list of suppressed addresses, newest first, filterable by reason.
 * Admin only.
 */
export async function GET(req: NextRequest) {
  const authResult = await requireAuth(req);
  if (!authResult.authorized || !authResult.user) {
    return apiError("Unauthorized", 401);
  }
  if (!canAccessAdminPanel(authResult.user)) {
    return apiError("Admin access required", 403);
  }

  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const perPage = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("perPage") || "20", 10)),
    );
    const reasonParam = searchParams.get("reason");
    const reason =
      reasonParam && REASON_VALUES.has(reasonParam) ? reasonParam : undefined;

    const where = reason ? { reason } : {};

    const [totalItems, items] = await Promise.all([
      prisma.emailSuppression.count({ where }),
      prisma.emailSuppression.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
    ]);

    return apiResponse({
      data: items.map((item) => ({
        ...item,
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
      })),
      pagination: {
        page,
        perPage,
        totalItems,
        totalPages: Math.max(1, Math.ceil(totalItems / perPage)),
      },
    });
  } catch (error) {
    console.error("Error listing email suppressions:", error);
    return apiError("Failed to list email suppressions", 500);
  }
}

/**
 * POST /api/admin/email-suppressions
 * Manually suppress an address. Admin only.
 */
export async function POST(req: NextRequest) {
  const authResult = await requireAuth(req);
  if (!authResult.authorized || !authResult.user) {
    return apiError("Unauthorized", 401);
  }
  if (!canAccessAdminPanel(authResult.user)) {
    return apiError("Admin access required", 403);
  }

  try {
    const body = await req.json();
    const validation = createSuppressionSchema.safeParse(body);
    if (!validation.success) {
      return apiError(
        validation.error.issues[0].message,
        400,
        "VALIDATION_ERROR",
      );
    }

    const { email, detail } = validation.data;
    const normalized = normalizeEmail(email);

    if (isProtectedAddress(normalized)) {
      return apiError(
        "Cannot suppress a protected address",
        400,
        "PROTECTED_ADDRESS",
      );
    }

    await suppressEmail({
      email: normalized,
      reason: "manual",
      detail,
      source: `admin:${authResult.user.id}`,
    });

    const record = await prisma.emailSuppression.findUnique({
      where: { email: normalized },
    });

    return apiResponse({
      data: record
        ? {
            ...record,
            createdAt: record.createdAt.toISOString(),
            updatedAt: record.updatedAt.toISOString(),
          }
        : null,
    });
  } catch (error) {
    console.error("Error creating email suppression:", error);
    return apiError("Failed to create email suppression", 500);
  }
}
