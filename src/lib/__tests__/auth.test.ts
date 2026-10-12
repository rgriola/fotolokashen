import { beforeAll, describe, it, expect } from "vitest";
import jwt from "jsonwebtoken";

const TEST_JWT_SECRET = "a".repeat(32);

// `generateToken` reads `process.env.JWT_SECRET` at module load time, so the
// env var must be set before the module is imported (not just before the
// test runs).
let generateToken: typeof import("@/lib/auth").generateToken;

beforeAll(async () => {
  process.env.JWT_SECRET = TEST_JWT_SECRET;
  ({ generateToken } = await import("@/lib/auth"));
});

const fakeUser = {
  id: 7,
  email: "user@example.com",
  username: "testuser",
  isAdmin: false,
  role: "user",
  avatar: null,
  bannerImage: null,
} as unknown as import("@/types/user").PublicUser;

describe("generateToken", () => {
  it("produces a verifiable JWT containing the expected user claims", () => {
    const token = generateToken(fakeUser);
    const decoded = jwt.verify(token, TEST_JWT_SECRET) as Record<
      string,
      unknown
    >;

    expect(decoded.userId).toBe(fakeUser.id);
    expect(decoded.email).toBe(fakeUser.email);
    expect(decoded.username).toBe(fakeUser.username);
  });

  it("includes a unique jti claim on every call", () => {
    const tokenA = generateToken(fakeUser);
    const tokenB = generateToken(fakeUser);

    const decodedA = jwt.decode(tokenA) as Record<string, unknown>;
    const decodedB = jwt.decode(tokenB) as Record<string, unknown>;

    expect(decodedA.jti).toBeTruthy();
    expect(decodedB.jti).toBeTruthy();
    expect(decodedA.jti).not.toBe(decodedB.jti);
  });

  /**
   * Regression test: before the `jti` claim was added, two tokens signed for
   * the same user within the same second were byte-for-byte identical
   * (same header + payload + signature), which violated the `sessions.token`
   * unique DB constraint whenever two token requests raced (see the iOS
   * "double OAuth callback" bug). Freezing time proves uniqueness no longer
   * depends on the 1-second `iat` resolution.
   */
  it("never produces identical tokens for concurrent requests within the same second", () => {
    const originalNow = Date.now;
    Date.now = () => 1_700_000_000_000; // frozen instant
    try {
      const tokenA = generateToken(fakeUser);
      const tokenB = generateToken(fakeUser);
      expect(tokenA).not.toBe(tokenB);
    } finally {
      Date.now = originalNow;
    }
  });

  it("sets the standard (non-remember-me) expiry by default", () => {
    const token = generateToken(fakeUser);
    const decoded = jwt.verify(token, TEST_JWT_SECRET) as {
      iat: number;
      exp: number;
    };
    expect(decoded.exp - decoded.iat).toBe(7 * 24 * 60 * 60);
  });

  it("extends expiry when rememberMe is true", () => {
    const token = generateToken(fakeUser, true);
    const decoded = jwt.verify(token, TEST_JWT_SECRET) as {
      iat: number;
      exp: number;
    };
    expect(decoded.exp - decoded.iat).toBe(30 * 24 * 60 * 60);
  });
});
