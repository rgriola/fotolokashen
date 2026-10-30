import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ImageKit from "imagekit";
import {
  deleteFromImageKit,
  deleteImageKitFolder,
  requestStoragePurge,
  getStoragePurgeStatus,
} from "@/lib/storage";

describe("idempotent storage deletion", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY", "test-public-key");
    vi.stubEnv("IMAGEKIT_PRIVATE_KEY", "test-private-key");
  });
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  for (const [label, method, remove] of [
    ["file", "deleteFile", deleteFromImageKit],
    ["folder", "deleteFolder", deleteImageKitFolder],
  ] as const) {
    it(`${label}: accepts an already-deleted resource using SDK status metadata`, async () => {
      vi.spyOn(ImageKit.prototype, method).mockRejectedValueOnce({
        $ResponseMetadata: { statusCode: 404 },
      });
      expect(await remove("test-resource")).toEqual({ success: true });
    });

    it.each([401, 403, 429, 500])(
      `${label}: preserves failure for HTTP %s`,
      async (statusCode) => {
        vi.spyOn(ImageKit.prototype, method).mockRejectedValueOnce({
          $ResponseMetadata: { statusCode },
        });
        expect((await remove("test-resource")).success).toBe(false);
      },
    );

    it(`${label}: does not infer not-found from error text`, async () => {
      vi.spyOn(ImageKit.prototype, method).mockRejectedValueOnce(
        new Error("404 not found"),
      );
      expect((await remove("test-resource")).success).toBe(false);
    });
  }

  it("returns an invalidation request ID, not premature completion", async () => {
    vi.spyOn(ImageKit.prototype, "purgeCache").mockImplementationOnce(
      async () => ({
        requestId: "purge-id",
        $ResponseMetadata: { statusCode: 201, headers: {} },
      }),
    );
    expect(await requestStoragePurge("https://example.com/user/*")).toBe(
      "purge-id",
    );
  });

  it("rejects a purge response without a request ID", async () => {
    vi.spyOn(ImageKit.prototype, "purgeCache").mockImplementationOnce(
      async () => ({
        requestId: "",
        $ResponseMetadata: { statusCode: 201, headers: {} },
      }),
    );
    await expect(
      requestStoragePurge("https://example.com/user/*"),
    ).rejects.toThrow("missing a request ID");
  });

  for (const [status, expected] of [
    ["Pending", "pending"],
    ["Completed", "completed"],
  ] as const) {
    it(`preserves ${status} invalidation status`, async () => {
      vi.spyOn(ImageKit.prototype, "getPurgeCacheStatus").mockResolvedValueOnce(
        {
          status,
          $ResponseMetadata: { statusCode: 200, headers: {} },
        },
      );
      expect(await getStoragePurgeStatus("purge-id")).toBe(expected);
    });
  }
});
