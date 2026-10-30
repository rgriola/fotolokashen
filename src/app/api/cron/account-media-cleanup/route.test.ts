import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "./route";
import { processDueAccountMediaCleanup } from "@/lib/account-deletion";

vi.mock("@/lib/account-deletion", () => ({
  processDueAccountMediaCleanup: vi.fn(),
}));

function request(token?: string) {
  return new NextRequest("https://example.com/api/cron/account-media-cleanup", {
    headers: token ? { authorization: `Bearer ${token}` } : {},
  });
}

describe("media cleanup worker authorization and reporting", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.stubEnv("CRON_SECRET", "test-cron-secret");
  });
  afterEach(() => vi.unstubAllEnvs());

  it("fails closed when the worker secret is missing", async () => {
    vi.stubEnv("CRON_SECRET", "");
    expect((await GET(request())).status).toBe(503);
    expect(processDueAccountMediaCleanup).not.toHaveBeenCalled();
  });

  it.each([undefined, "wrong-secret"])(
    "rejects unauthorized requests",
    async (token) => {
      expect((await GET(request(token))).status).toBe(401);
      expect(processDueAccountMediaCleanup).not.toHaveBeenCalled();
    },
  );

  it("returns only aggregate counters for authorized requests", async () => {
    const counts = { completed: 1, pending: 1, failed: 0, skipped: 0 };
    vi.mocked(processDueAccountMediaCleanup).mockResolvedValueOnce(counts);
    const response = await GET(request("test-cron-secret"));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(counts);
  });

  it("reports storage failures as retryable errors", async () => {
    vi.mocked(processDueAccountMediaCleanup).mockResolvedValueOnce({
      completed: 0,
      pending: 0,
      failed: 1,
      skipped: 0,
    });
    expect((await GET(request("test-cron-secret"))).status).toBe(503);
  });

  it("reports infrastructure failures explicitly", async () => {
    vi.mocked(processDueAccountMediaCleanup).mockRejectedValueOnce(
      new Error("database down"),
    );
    expect((await GET(request("test-cron-secret"))).status).toBe(500);
  });
});
