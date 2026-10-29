import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "../route";

vi.mock("@/lib/prisma", () => ({
  default: {
    oAuthClient: {
      findUnique: vi.fn(),
    },
    oAuthAuthorizationCode: {
      create: vi.fn(),
    },
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
  requireAuth: vi.fn(),
}));

import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/api-middleware";

const CLIENT_ID = "fotolokashen-ios";
const REDIRECT_URI = "fotolokashen://oauth-callback";

function makeRequest(body: object) {
  return new Request("https://example.com/api/auth/oauth/authorize", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  }) as unknown as import("next/server").NextRequest;
}

function requestBody(overrides: Record<string, unknown> = {}) {
  return {
    client_id: CLIENT_ID,
    response_type: "code",
    redirect_uri: REDIRECT_URI,
    code_challenge: "valid-code-challenge",
    code_challenge_method: "S256",
    scope: "read write",
    ...overrides,
  };
}

describe("POST /api/auth/oauth/authorize state passthrough", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(requireAuth).mockResolvedValue({
      authorized: true,
      user: { id: 42 },
    } as never);
    vi.mocked(prisma.oAuthClient.findUnique).mockResolvedValue({
      clientId: CLIENT_ID,
      redirectUris: [REDIRECT_URI],
      scopes: ["read", "write"],
    } as never);
    vi.mocked(prisma.oAuthAuthorizationCode.create).mockResolvedValue(
      {} as never,
    );
  });

  it("echoes a valid state value unchanged", async () => {
    const state = "opaque-state_value-123";
    const response = await POST(makeRequest(requestBody({ state })));

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ state });
  });

  it("keeps state optional for existing clients", async () => {
    const response = await POST(makeRequest(requestBody()));

    expect(response.status).toBe(200);
    expect(await response.json()).not.toHaveProperty("state");
  });

  it.each([null, 42, [], ""])("rejects malformed state: %s", async (state) => {
    const response = await POST(makeRequest(requestBody({ state })));

    expect(response.status).toBe(400);
    expect(prisma.oAuthAuthorizationCode.create).not.toHaveBeenCalled();
  });

  it("rejects state values longer than 512 characters", async () => {
    const response = await POST(
      makeRequest(requestBody({ state: "s".repeat(513) })),
    );

    expect(response.status).toBe(400);
    expect(prisma.oAuthAuthorizationCode.create).not.toHaveBeenCalled();
  });
});
