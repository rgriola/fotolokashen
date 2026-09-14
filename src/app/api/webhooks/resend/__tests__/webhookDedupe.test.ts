import { describe, it, expect, vi, beforeEach } from "vitest";
import { Prisma } from "@prisma/client";

// ── Module mocks ──────────────────────────────────────────────────────────────

const { verifyMock } = vi.hoisted(() => ({ verifyMock: vi.fn() }));

vi.mock("resend", () => ({
  Resend: class {
    webhooks = { verify: verifyMock };
    emails = { send: vi.fn(), receiving: { get: vi.fn() } };
  },
}));

vi.mock("@/lib/api-middleware", () => ({
  apiResponse: (data: unknown, status = 200) =>
    new Response(JSON.stringify(data), { status }),
  apiError: (message: string, status = 500, code?: string) =>
    new Response(
      JSON.stringify({ error: message, code: code ?? `ERROR_${status}` }),
      { status },
    ),
}));

vi.mock("@/lib/env", () => ({
  env: {
    EMAIL_API_KEY: "test-api-key",
    RESEND_WEBHOOK_SECRET: "test-webhook-secret",
    RESEND_INBOUND_FORWARD_TO: "",
    RESEND_INBOUND_FORWARD_FROM: "",
    EMAIL_FROM_ADDRESS: "noreply@example.com",
  },
}));

vi.mock("@/lib/email-suppression", () => ({
  suppressEmail: vi.fn(),
  suppressionFromEvent: vi.fn(() => null),
}));

vi.mock("@/lib/prisma", () => {
  const mockPrisma = {
    emailWebhookEvent: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    emailLog: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    inboundEmail: { upsert: vi.fn() },
  };
  return { default: mockPrisma, prisma: mockPrisma };
});

// ── Imports after mocks ───────────────────────────────────────────────────────

import { POST } from "../route";
import prisma from "@/lib/prisma";

const WEBHOOK_ID = "msg_webhook_123";
const PROVIDER_EMAIL_ID = "resend-email-abc";

function makeRequest() {
  return new Request("https://example.com/api/webhooks/resend", {
    method: "POST",
    headers: {
      "svix-id": WEBHOOK_ID,
      "svix-timestamp": "1700000000",
      "svix-signature": "v1,signature",
    },
    body: JSON.stringify({ type: "email.delivered" }),
  }) as unknown as import("next/server").NextRequest;
}

function mockVerifiedEvent(type = "email.delivered") {
  verifyMock.mockReturnValue({
    type,
    created_at: "2026-09-13T12:00:00.000Z",
    data: {
      email_id: PROVIDER_EMAIL_ID,
      to: ["user@example.com"],
      subject: "Hello",
    },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockVerifiedEvent();
  vi.mocked(prisma.emailWebhookEvent.findUnique).mockResolvedValue(null as never);
  vi.mocked(prisma.emailWebhookEvent.findFirst).mockResolvedValue(null as never);
  vi.mocked(prisma.emailWebhookEvent.create).mockResolvedValue({} as never);
  vi.mocked(prisma.emailLog.findFirst).mockResolvedValue(null as never);
  vi.mocked(prisma.emailLog.create).mockResolvedValue({} as never);
  vi.mocked(prisma.emailLog.update).mockResolvedValue({} as never);
});

describe("Resend webhook — duplicate detection", () => {
  it("short-circuits when the same delivery id was already processed", async () => {
    vi.mocked(prisma.emailWebhookEvent.findUnique).mockResolvedValue({
      id: 1,
    } as never);

    const res = await POST(makeRequest());

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({ duplicate: true });
    expect(prisma.emailLog.create).not.toHaveBeenCalled();
    expect(prisma.emailLog.update).not.toHaveBeenCalled();
  });

  it("short-circuits when the same message + event type was already recorded", async () => {
    vi.mocked(prisma.emailWebhookEvent.findFirst).mockResolvedValue({
      id: 2,
    } as never);

    const res = await POST(makeRequest());

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({ duplicate: true });
    expect(prisma.emailLog.create).not.toHaveBeenCalled();
  });

  it("looks up duplicates on indexed columns, never by scanning errorMessage", async () => {
    await POST(makeRequest());

    expect(prisma.emailWebhookEvent.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { webhookEventId: WEBHOOK_ID } }),
    );
    expect(prisma.emailWebhookEvent.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          providerEmailId: PROVIDER_EMAIL_ID,
          eventType: "email.delivered",
        },
      }),
    );

    const emailLogQueries = vi.mocked(prisma.emailLog.findFirst).mock.calls;
    for (const [args] of emailLogQueries) {
      expect(JSON.stringify(args)).not.toContain("contains");
    }
  });
});

describe("Resend webhook — EmailLog correlation", () => {
  it("finds the existing log by providerEmailId and updates it", async () => {
    vi.mocked(prisma.emailLog.findFirst).mockResolvedValue({
      id: 42,
      errorMessage: "provider=resend; messageId=resend-email-abc",
    } as never);

    const res = await POST(makeRequest());

    expect(prisma.emailLog.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { providerEmailId: PROVIDER_EMAIL_ID },
      }),
    );
    expect(prisma.emailLog.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 42 } }),
    );
    await expect(res.json()).resolves.toMatchObject({ updated: true });
  });

  it("stores providerEmailId when creating a log for an unknown message", async () => {
    const res = await POST(makeRequest());

    expect(prisma.emailLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ providerEmailId: PROVIDER_EMAIL_ID }),
      }),
    );
    await expect(res.json()).resolves.toMatchObject({ created: true });
  });

  it("records the processed delivery so a retry is deduped", async () => {
    await POST(makeRequest());

    expect(prisma.emailWebhookEvent.create).toHaveBeenCalledWith({
      data: {
        webhookEventId: WEBHOOK_ID,
        providerEmailId: PROVIDER_EMAIL_ID,
        eventType: "email.delivered",
      },
    });
  });

  it("still returns 200 when a concurrent retry already recorded the delivery", async () => {
    vi.mocked(prisma.emailWebhookEvent.create).mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
        code: "P2002",
        clientVersion: "6.19.3",
      }) as never,
    );

    const res = await POST(makeRequest());

    expect(res.status).toBe(200);
  });
});
