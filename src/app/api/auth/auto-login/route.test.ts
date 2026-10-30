import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "./route";
import prisma from "@/lib/prisma";
import { generateToken } from "@/lib/auth";

vi.mock("@/lib/prisma", () => ({
  default: {
    oAuthClient: { findUnique: vi.fn() },
    user: { findFirst: vi.fn(), updateMany: vi.fn() },
    session: { deleteMany: vi.fn(), create: vi.fn() },
    oAuthRefreshToken: { create: vi.fn() },
  },
}));
vi.mock("@/lib/auth", () => ({
  hashToken: vi.fn(() => "token-hash"),
  generateToken: vi.fn(() => "access-token"),
}));
vi.mock("@/lib/api-middleware", () => ({
  serializeUser: (user: unknown) => user,
  apiResponse: (data: unknown) => Response.json(data),
  apiError: (error: string, status: number, code: string) =>
    Response.json({ error, code }, { status }),
}));

const user = {
  id: 42,
  email: "test@example.com",
  username: "test",
  avatar: null,
  autoLoginTokenExpiry: new Date("2030-01-01"),
};
function request() {
  return new NextRequest("https://example.com/api/auth/auto-login", {
    method: "POST",
    body: JSON.stringify({ token: "one-time-token", client_id: "ios" }),
  });
}

describe("auto-login single-use expiry enforcement", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(prisma.oAuthClient.findUnique).mockResolvedValue({
      clientId: "ios",
    } as Awaited<ReturnType<typeof prisma.oAuthClient.findUnique>>);
    vi.mocked(prisma.user.findFirst).mockResolvedValue(
      user as Awaited<ReturnType<typeof prisma.user.findFirst>>,
    );
    vi.mocked(prisma.user.updateMany).mockResolvedValue({ count: 1 });
    vi.mocked(generateToken).mockReturnValue("access-token");
  });

  it("only issues one credential set for concurrent exchanges", async () => {
    vi.mocked(prisma.user.updateMany)
      .mockResolvedValueOnce({ count: 1 })
      .mockResolvedValueOnce({ count: 0 });
    const responses = await Promise.all([POST(request()), POST(request())]);
    expect(responses.map((response) => response.status).sort()).toEqual([
      200, 400,
    ]);
    expect(prisma.user.updateMany).toHaveBeenCalledTimes(2);
    expect(generateToken).toHaveBeenCalledTimes(1);
    expect(prisma.session.create).toHaveBeenCalledTimes(1);
    expect(prisma.oAuthRefreshToken.create).toHaveBeenCalledTimes(1);
    expect(prisma.user.updateMany).toHaveBeenCalledWith({
      where: {
        id: user.id,
        autoLoginToken: "token-hash",
        autoLoginTokenExpiry: { gt: expect.any(Date) },
        emailVerified: true,
        isActive: true,
      },
      data: {
        autoLoginToken: null,
        autoLoginTokenExpiry: null,
        lastLoginAt: expect.any(Date),
      },
    });
  });

  it.each([null, new Date(0)])("rejects invalid expiry %s", async (expiry) => {
    vi.mocked(prisma.user.findFirst).mockResolvedValue({
      ...user,
      autoLoginTokenExpiry: expiry,
    } as Awaited<ReturnType<typeof prisma.user.findFirst>>);
    expect((await POST(request())).status).toBe(400);
    expect(generateToken).not.toHaveBeenCalled();
    expect(prisma.user.updateMany).toHaveBeenCalledWith({
      where: {
        id: user.id,
        autoLoginToken: "token-hash",
        autoLoginTokenExpiry: expiry,
      },
      data: { autoLoginToken: null, autoLoginTokenExpiry: null },
    });
  });

  it("rejects expiry at the current time", async () => {
    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date("2029-01-01"));
      vi.mocked(prisma.user.findFirst).mockResolvedValue({
        ...user,
        autoLoginTokenExpiry: new Date(),
      } as Awaited<ReturnType<typeof prisma.user.findFirst>>);
      expect((await POST(request())).status).toBe(400);
      expect(generateToken).not.toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });

  it("issues no credentials when atomic consumption fails", async () => {
    vi.mocked(prisma.user.updateMany).mockResolvedValue({ count: 0 });
    expect((await POST(request())).status).toBe(400);
    expect(generateToken).not.toHaveBeenCalled();
    expect(prisma.session.deleteMany).not.toHaveBeenCalled();
    expect(prisma.oAuthRefreshToken.create).not.toHaveBeenCalled();
  });
});
