import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, POST } from "../route";
import { DELETE } from "../[email]/route";

// ── Module mocks ──────────────────────────────────────────────────────────────

vi.mock("@/lib/api-middleware", () => ({
  requireAuth: vi.fn(),
  apiResponse: (data: unknown, status = 200) =>
    new Response(JSON.stringify(data), { status }),
  apiError: (message: string, status = 500, code?: string) =>
    new Response(
      JSON.stringify({ error: message, code: code ?? `ERROR_${status}` }),
      { status },
    ),
}));

vi.mock("@/lib/permissions", () => ({
  canAccessAdminPanel: vi.fn(),
}));

vi.mock("@/lib/prisma", () => {
  const mockPrisma = {
    emailSuppression: {
      count: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      upsert: vi.fn(),
      deleteMany: vi.fn(),
    },
    securityLog: {
      create: vi.fn(),
    },
  };
  return { default: mockPrisma, prisma: mockPrisma };
});

vi.mock("@/lib/env", () => ({
  env: {
    EMAIL_REPLY_TO: "support@example.com",
  },
}));

// ── Imports after mocks ───────────────────────────────────────────────────────

import { requireAuth } from "@/lib/api-middleware";
import { canAccessAdminPanel } from "@/lib/permissions";
import prisma from "@/lib/prisma";

const adminUser = { id: 1, email: "admin@example.com" };

function makeRequest(url: string, init?: RequestInit) {
  return new Request(url, init) as unknown as import("next/server").NextRequest;
}

function makeEmailParams(email: string) {
  return { params: Promise.resolve({ email }) };
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(requireAuth).mockResolvedValue({
    authorized: true,
    user: adminUser,
  } as never);
  vi.mocked(canAccessAdminPanel).mockReturnValue(true);
});

describe("GET /api/admin/email-suppressions", () => {
  it("returns 401 when not authenticated", async () => {
    vi.mocked(requireAuth).mockResolvedValue({ authorized: false } as never);

    const res = await GET(
      makeRequest("https://example.com/api/admin/email-suppressions"),
    );

    expect(res.status).toBe(401);
  });

  it("returns 403 when not an admin", async () => {
    vi.mocked(canAccessAdminPanel).mockReturnValue(false);

    const res = await GET(
      makeRequest("https://example.com/api/admin/email-suppressions"),
    );

    expect(res.status).toBe(403);
  });

  it("filters by reason when provided", async () => {
    vi.mocked(prisma.emailSuppression.count).mockResolvedValue(1 as never);
    vi.mocked(prisma.emailSuppression.findMany).mockResolvedValue([
      {
        id: 1,
        email: "bounced@example.com",
        reason: "hard_bounce",
        detail: null,
        source: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ] as never);

    const res = await GET(
      makeRequest(
        "https://example.com/api/admin/email-suppressions?reason=hard_bounce",
      ),
    );

    expect(res.status).toBe(200);
    expect(prisma.emailSuppression.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { reason: "hard_bounce" } }),
    );
    expect(prisma.emailSuppression.count).toHaveBeenCalledWith(
      expect.objectContaining({ where: { reason: "hard_bounce" } }),
    );
  });

  it("ignores an invalid reason filter", async () => {
    vi.mocked(prisma.emailSuppression.count).mockResolvedValue(0 as never);
    vi.mocked(prisma.emailSuppression.findMany).mockResolvedValue([] as never);

    await GET(
      makeRequest(
        "https://example.com/api/admin/email-suppressions?reason=not_a_reason",
      ),
    );

    expect(prisma.emailSuppression.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: {} }),
    );
  });
});

describe("POST /api/admin/email-suppressions", () => {
  it("returns 400 for a malformed email", async () => {
    const res = await POST(
      makeRequest("https://example.com/api/admin/email-suppressions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: "not-an-email" }),
      }),
    );

    expect(res.status).toBe(400);
  });

  it("returns 400 when targeting the configured support address", async () => {
    const res = await POST(
      makeRequest("https://example.com/api/admin/email-suppressions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: "support@example.com" }),
      }),
    );

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.code).toBe("PROTECTED_ADDRESS");
    expect(prisma.emailSuppression.upsert).not.toHaveBeenCalled();
  });

  it("creates a manual suppression for a valid, unprotected address", async () => {
    vi.mocked(prisma.emailSuppression.findUnique).mockResolvedValue(
      null as never,
    );
    vi.mocked(prisma.emailSuppression.upsert).mockResolvedValue({} as never);

    const res = await POST(
      makeRequest("https://example.com/api/admin/email-suppressions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: "problem-user@example.com",
          detail: "requested by user",
        }),
      }),
    );

    expect(res.status).toBe(200);
    expect(prisma.emailSuppression.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          email: "problem-user@example.com",
          reason: "manual",
          source: `admin:${adminUser.id}`,
        }),
      }),
    );
  });
});

describe("DELETE /api/admin/email-suppressions/[email]", () => {
  it("returns 404 when the suppression does not exist", async () => {
    vi.mocked(prisma.emailSuppression.findUnique).mockResolvedValue(
      null as never,
    );

    const res = await DELETE(
      makeRequest(
        "https://example.com/api/admin/email-suppressions/nobody@example.com",
        {
          method: "DELETE",
        },
      ),
      makeEmailParams("nobody@example.com"),
    );

    expect(res.status).toBe(404);
    expect(prisma.emailSuppression.deleteMany).not.toHaveBeenCalled();
  });

  it("removes the row and writes a SecurityLog entry", async () => {
    vi.mocked(prisma.emailSuppression.findUnique).mockResolvedValue({
      id: 1,
      email: "bounced@example.com",
      reason: "hard_bounce",
      detail: null,
      source: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as never);
    vi.mocked(prisma.emailSuppression.deleteMany).mockResolvedValue({
      count: 1,
    } as never);
    vi.mocked(prisma.securityLog.create).mockResolvedValue({} as never);

    const res = await DELETE(
      makeRequest(
        "https://example.com/api/admin/email-suppressions/bounced@example.com",
        {
          method: "DELETE",
        },
      ),
      makeEmailParams("bounced@example.com"),
    );

    expect(res.status).toBe(200);
    expect(prisma.emailSuppression.deleteMany).toHaveBeenCalledWith({
      where: { email: "bounced@example.com" },
    });
    expect(prisma.securityLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: adminUser.id,
          eventType: "ADMIN_EMAIL_SUPPRESSION_REMOVED",
          metadata: expect.objectContaining({
            email: "bounced@example.com",
            previousReason: "hard_bounce",
          }),
        }),
      }),
    );
  });
});
