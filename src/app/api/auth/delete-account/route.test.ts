import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { DELETE } from "./route";
import { requireAuth } from "@/lib/api-middleware";
import {
  deleteAccountAndQueueMedia,
  processAccountMediaCleanup,
} from "@/lib/account-deletion";

const { afterCallbacks } = vi.hoisted(() => ({
  afterCallbacks: [] as Array<() => Promise<void>>,
}));
vi.mock("next/server", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next/server")>()),
  after: vi.fn((callback: () => Promise<void>) =>
    afterCallbacks.push(callback),
  ),
}));
vi.mock("@/lib/api-middleware", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/api-middleware")>()),
  requireAuth: vi.fn(),
}));
vi.mock("@/lib/account-deletion", () => ({
  deleteAccountAndQueueMedia: vi.fn(),
  processAccountMediaCleanup: vi.fn(),
}));

function request() {
  return new NextRequest("https://example.com/api/auth/delete-account", {
    method: "DELETE",
  });
}

describe("self account deletion", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    afterCallbacks.length = 0;
  });

  async function authorize() {
    const { USER_PUBLIC_SELECT } = await import("@/lib/api-middleware");
    // The route only uses the authenticated ID; no request-supplied target is accepted.
    const { serializeUser } = await import("@/lib/api-middleware");
    const user = serializeUser({
      ...Object.fromEntries(
        Object.keys(USER_PUBLIC_SELECT).map((key) => [key, null]),
      ),
      id: 42,
      createdAt: new Date(),
    });
    vi.mocked(requireAuth).mockResolvedValue({ authorized: true, user });
  }

  it.each([401, 503])(
    "preserves authentication status %s without deleting",
    async (status) => {
      vi.mocked(requireAuth).mockResolvedValue({
        authorized: false,
        status,
        error: "Unavailable",
      });
      expect((await DELETE(request())).status).toBe(status);
      expect(deleteAccountAndQueueMedia).not.toHaveBeenCalled();
    },
  );

  it("does not report success or schedule media work when the transaction fails", async () => {
    await authorize();
    vi.mocked(deleteAccountAndQueueMedia).mockRejectedValueOnce(
      new Error("database down"),
    );
    expect((await DELETE(request())).status).toBe(500);
    expect(afterCallbacks).toHaveLength(0);
  });

  it("returns not-found when the authenticated account no longer exists", async () => {
    await authorize();
    vi.mocked(deleteAccountAndQueueMedia).mockResolvedValueOnce(null);
    expect((await DELETE(request())).status).toBe(404);
    expect(afterCallbacks).toHaveLength(0);
  });

  it("commits first and schedules cleanup after responding with the existing success contract", async () => {
    await authorize();
    vi.mocked(deleteAccountAndQueueMedia).mockResolvedValueOnce("cleanup-id");
    const response = await DELETE(request());
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      success: true,
      mediaCleanup: "queued",
    });
    expect(deleteAccountAndQueueMedia).toHaveBeenCalledWith(42);
    expect(processAccountMediaCleanup).not.toHaveBeenCalled();
    expect(afterCallbacks).toHaveLength(1);
    await afterCallbacks[0]();
    expect(processAccountMediaCleanup).toHaveBeenCalledWith("cleanup-id");
  });

  it("handles failed post-response execution explicitly without changing the committed response", async () => {
    await authorize();
    vi.mocked(deleteAccountAndQueueMedia).mockResolvedValueOnce("cleanup-id");
    vi.mocked(processAccountMediaCleanup).mockRejectedValueOnce(
      new Error("database down"),
    );
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      expect((await DELETE(request())).status).toBe(200);
      await expect(afterCallbacks[0]()).resolves.toBeUndefined();
      expect(log).toHaveBeenCalled();
    } finally {
      log.mockRestore();
    }
  });
});
