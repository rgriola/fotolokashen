import { describe, it, expect, vi, beforeEach } from "vitest";
import crypto from "crypto";
import { POST } from "../route";

// ── Module mocks ──────────────────────────────────────────────────────────────

vi.mock("@/lib/prisma", () => ({
  default: {
    oAuthClient: {
      findUnique: vi.fn(),
    },
    oAuthAuthorizationCode: {
      findUnique: vi.fn(),
      updateMany: vi.fn(),
    },
    oAuthRefreshToken: {
      findUnique: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
    },
    session: {
      updateMany: vi.fn(),
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
  serializeUser: (user: Record<string, unknown>) => user,
}));

vi.mock("@/lib/auth", () => ({
  generateToken: vi.fn(),
  JWT_EXPIRY_SECONDS: 7 * 24 * 60 * 60,
}));

// ── Imports after mocks ───────────────────────────────────────────────────────

import prisma from "@/lib/prisma";
import { generateToken } from "@/lib/auth";

// ── Helpers ───────────────────────────────────────────────────────────────────

const CLIENT_ID = "fotolokashen-ios";
const USER_ID = 42;
const CODE = "auth-code-123";
const CODE_VERIFIER = "test-code-verifier-value";
const REDIRECT_URI = "fotolokashen://oauth-callback";

const codeChallenge = crypto
  .createHash("sha256")
  .update(CODE_VERIFIER)
  .digest("base64url");

const fakeClient = {
  clientId: CLIENT_ID,
  name: "Fotolokashen iOS",
  redirectUris: [REDIRECT_URI],
  scopes: ["read", "write"],
};

const fakeUser = {
  id: USER_ID,
  email: "user@example.com",
  username: "testuser",
};

function makeAuthCode(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    code: CODE,
    clientId: CLIENT_ID,
    userId: USER_ID,
    redirectUri: REDIRECT_URI,
    codeChallenge,
    codeChallengeMethod: "S256",
    scopes: ["read", "write"],
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    used: false,
    usedAt: null,
    user: fakeUser,
    ...overrides,
  };
}

function makeRequest(body: object) {
  return new Request("https://example.com/api/auth/oauth/token", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  }) as unknown as import("next/server").NextRequest;
}

function authCodeGrantBody(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    grant_type: "authorization_code",
    client_id: CLIENT_ID,
    code: CODE,
    code_verifier: CODE_VERIFIER,
    redirect_uri: REDIRECT_URI,
    ...overrides,
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("POST /api/auth/oauth/token — authorization_code grant", () => {
  beforeEach(() => {
    vi.resetAllMocks();

    vi.mocked(prisma.oAuthClient.findUnique).mockResolvedValue(
      fakeClient as never,
    );
    vi.mocked(prisma.oAuthAuthorizationCode.findUnique).mockResolvedValue(
      makeAuthCode() as never,
    );
    vi.mocked(prisma.oAuthAuthorizationCode.updateMany).mockResolvedValue({
      count: 1,
    } as never);
    vi.mocked(prisma.session.updateMany).mockResolvedValue({
      count: 0,
    } as never);
    vi.mocked(prisma.session.create).mockResolvedValue({} as never);
    vi.mocked(prisma.oAuthRefreshToken.create).mockResolvedValue({} as never);
    vi.mocked(generateToken).mockReturnValue("signed.jwt.token");
  });

  it("issues access + refresh tokens on a valid code exchange", async () => {
    const res = await POST(makeRequest(authCodeGrantBody()));

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.access_token).toBe("signed.jwt.token");
    expect(body.token_type).toBe("Bearer");
    expect(typeof body.refresh_token).toBe("string");

    // Code must be atomically claimed before any token is minted
    expect(prisma.oAuthAuthorizationCode.updateMany).toHaveBeenCalledWith({
      where: { code: CODE, used: false },
      data: expect.objectContaining({ used: true }),
    });

    expect(prisma.session.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          token: "signed.jwt.token",
          userId: USER_ID,
          deviceType: "ios",
        }),
      }),
    );
  });

  it("rejects reuse of an already-claimed code even if the initial read looked unused (race condition regression)", async () => {
    // Simulate two concurrent requests racing on the same code: the initial
    // findUnique() read is stale (used: false) for both, but only one
    // atomic updateMany() can actually win the claim.
    vi.mocked(prisma.oAuthAuthorizationCode.updateMany).mockResolvedValue({
      count: 0,
    } as never);

    const res = await POST(makeRequest(authCodeGrantBody()));

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.code).toBe("INVALID_GRANT");
    expect(body.error).toMatch(/already used/i);

    // The losing request must never mint a token or create a session
    expect(generateToken).not.toHaveBeenCalled();
    expect(prisma.session.create).not.toHaveBeenCalled();
  });

  it("rejects a code that is already marked used on the initial read", async () => {
    vi.mocked(prisma.oAuthAuthorizationCode.findUnique).mockResolvedValue(
      makeAuthCode({ used: true, usedAt: new Date() }) as never,
    );

    const res = await POST(makeRequest(authCodeGrantBody()));

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.code).toBe("INVALID_GRANT");
    expect(prisma.oAuthAuthorizationCode.updateMany).not.toHaveBeenCalled();
    expect(generateToken).not.toHaveBeenCalled();
  });

  it("rejects an unknown authorization code", async () => {
    vi.mocked(prisma.oAuthAuthorizationCode.findUnique).mockResolvedValue(
      null as never,
    );

    const res = await POST(makeRequest(authCodeGrantBody()));

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.code).toBe("INVALID_GRANT");
    expect(generateToken).not.toHaveBeenCalled();
  });

  it("rejects an expired authorization code", async () => {
    vi.mocked(prisma.oAuthAuthorizationCode.findUnique).mockResolvedValue(
      makeAuthCode({ expiresAt: new Date(Date.now() - 1000) }) as never,
    );

    const res = await POST(makeRequest(authCodeGrantBody()));

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/expired/i);
    expect(generateToken).not.toHaveBeenCalled();
  });

  it("rejects a redirect_uri mismatch", async () => {
    const res = await POST(
      makeRequest(
        authCodeGrantBody({ redirect_uri: "fotolokashen://wrong-callback" }),
      ),
    );

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/redirect uri/i);
    expect(generateToken).not.toHaveBeenCalled();
  });

  it("rejects an invalid PKCE code_verifier", async () => {
    const res = await POST(
      makeRequest(authCodeGrantBody({ code_verifier: "wrong-verifier" })),
    );

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/code_verifier/i);
    expect(prisma.oAuthAuthorizationCode.updateMany).not.toHaveBeenCalled();
    expect(generateToken).not.toHaveBeenCalled();
  });

  it("rejects an unknown client_id", async () => {
    vi.mocked(prisma.oAuthClient.findUnique).mockResolvedValue(null as never);

    const res = await POST(makeRequest(authCodeGrantBody()));

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.code).toBe("INVALID_CLIENT");
  });

  it("supersedes existing iOS sessions before issuing a new one", async () => {
    await POST(makeRequest(authCodeGrantBody()));

    expect(prisma.session.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userId: USER_ID,
          deviceType: "ios",
        }),
      }),
    );
  });
});

describe("POST /api/auth/oauth/token — refresh_token grant", () => {
  const REFRESH_TOKEN = "refresh-token-abc";

  function makeRefreshRecord(overrides: Partial<Record<string, unknown>> = {}) {
    return {
      token: REFRESH_TOKEN,
      clientId: CLIENT_ID,
      userId: USER_ID,
      scopes: ["read", "write"],
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      revoked: false,
      deviceType: "ios",
      user: fakeUser,
      ...overrides,
    };
  }

  beforeEach(() => {
    vi.resetAllMocks();

    vi.mocked(prisma.oAuthClient.findUnique).mockResolvedValue(
      fakeClient as never,
    );
    vi.mocked(prisma.oAuthRefreshToken.findUnique).mockResolvedValue(
      makeRefreshRecord() as never,
    );
    vi.mocked(prisma.oAuthRefreshToken.update).mockResolvedValue({} as never);
    vi.mocked(prisma.session.updateMany).mockResolvedValue({
      count: 0,
    } as never);
    vi.mocked(prisma.session.create).mockResolvedValue({} as never);
    vi.mocked(generateToken).mockReturnValue("new.signed.jwt");
  });

  it("issues a new access token for a valid refresh token", async () => {
    const res = await POST(
      makeRequest({
        grant_type: "refresh_token",
        client_id: CLIENT_ID,
        refresh_token: REFRESH_TOKEN,
      }),
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.access_token).toBe("new.signed.jwt");
    expect(prisma.session.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ token: "new.signed.jwt" }),
      }),
    );
  });

  it("rejects a revoked refresh token", async () => {
    vi.mocked(prisma.oAuthRefreshToken.findUnique).mockResolvedValue(
      makeRefreshRecord({ revoked: true }) as never,
    );

    const res = await POST(
      makeRequest({
        grant_type: "refresh_token",
        client_id: CLIENT_ID,
        refresh_token: REFRESH_TOKEN,
      }),
    );

    expect(res.status).toBe(400);
    expect(generateToken).not.toHaveBeenCalled();
  });

  it("rejects an expired refresh token", async () => {
    vi.mocked(prisma.oAuthRefreshToken.findUnique).mockResolvedValue(
      makeRefreshRecord({ expiresAt: new Date(Date.now() - 1000) }) as never,
    );

    const res = await POST(
      makeRequest({
        grant_type: "refresh_token",
        client_id: CLIENT_ID,
        refresh_token: REFRESH_TOKEN,
      }),
    );

    expect(res.status).toBe(400);
    expect(generateToken).not.toHaveBeenCalled();
  });

  it("rejects an unknown refresh token", async () => {
    vi.mocked(prisma.oAuthRefreshToken.findUnique).mockResolvedValue(
      null as never,
    );

    const res = await POST(
      makeRequest({
        grant_type: "refresh_token",
        client_id: CLIENT_ID,
        refresh_token: "does-not-exist",
      }),
    );

    expect(res.status).toBe(400);
    expect(generateToken).not.toHaveBeenCalled();
  });
});

describe("POST /api/auth/oauth/token — common validation", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("rejects requests missing grant_type or client_id", async () => {
    const res = await POST(makeRequest({ code: CODE }));

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.code).toBe("INVALID_REQUEST");
  });

  it("rejects an unsupported grant_type", async () => {
    vi.mocked(prisma.oAuthClient.findUnique).mockResolvedValue(
      fakeClient as never,
    );

    const res = await POST(
      makeRequest({ grant_type: "password", client_id: CLIENT_ID }),
    );

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.code).toBe("UNSUPPORTED_GRANT_TYPE");
  });
});
