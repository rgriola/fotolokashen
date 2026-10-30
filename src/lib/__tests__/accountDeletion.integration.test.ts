import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { PrismaClient } from "@prisma/client";
import {
  deleteFromImageKit,
  deleteImageKitFolder,
  getImageKitUrl,
  requestStoragePurge,
  getStoragePurgeStatus,
} from "@/lib/storage";

vi.mock("@/lib/storage", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/storage")>()),
  deleteFromImageKit: vi.fn(),
  deleteImageKitFolder: vi.fn(),
  requestStoragePurge: vi.fn(),
  getStoragePurgeStatus: vi.fn(),
}));

const databaseUrl = process.env.ACCOUNT_DELETION_TEST_DATABASE_URL;

describe.skipIf(!databaseUrl)("account deletion (isolated PostgreSQL)", () => {
  let db: PrismaClient;
  let deletion: typeof import("@/lib/account-deletion");

  beforeAll(async () => {
    const url = new URL(databaseUrl!);
    if (
      url.hostname !== "127.0.0.1" ||
      url.pathname !== "/fotolokashen_account_deletion_test"
    ) {
      throw new Error(
        "Account deletion tests require a disposable loopback database",
      );
    }
    db = new PrismaClient({ datasourceUrl: databaseUrl });
    vi.doMock("@/lib/prisma", () => ({ default: db }));
    deletion = await import("@/lib/account-deletion");
  });

  beforeEach(async () => {
    vi.resetAllMocks();
    vi.mocked(deleteFromImageKit).mockResolvedValue({ success: true });
    vi.mocked(deleteImageKitFolder).mockResolvedValue({ success: true });
    vi.mocked(requestStoragePurge).mockResolvedValue("purge-request");
    vi.mocked(getStoragePurgeStatus).mockResolvedValue("completed");
    await db.user.deleteMany();
    await db.accountMediaCleanup.deleteMany();
    await db.securityLog.deleteMany();
    await db.oAuthClient.deleteMany();
  });

  afterAll(async () => {
    await db?.$disconnect();
    vi.doUnmock("@/lib/prisma");
  });

  function createUser(username = "deletion-test") {
    return db.user.create({
      data: {
        email: `${username}@example.com`,
        username,
        passwordHash: "test-only-hash",
        avatarFileId: "avatar-file",
        bannerFileId: "banner-file",
      },
    });
  }

  async function createJob(fileIds: string[] = ["photo-file"]) {
    return db.accountMediaCleanup.create({
      data: {
        fileIds,
        folderPath: "/development/users/123/",
        purgeUrls: [],
        pendingPurgeUrls: [],
        purgeRequestIds: [],
        sweepAfter: new Date(0),
        nextAttemptAt: new Date(0),
      },
    });
  }

  it("atomically preserves all cascaded media, revokes credentials and hard-deletes the user", async () => {
    const user = await createUser();
    const other = await createUser("other-user");
    const location = await db.location.create({
      data: {
        placeId: "place",
        name: "Test",
        lat: 1,
        lng: 1,
        createdBy: user.id,
      },
    });
    await db.photo.createMany({
      data: [
        {
          locationId: location.id,
          placeId: "place",
          userId: user.id,
          imagekitFileId: "own-photo",
          imagekitFilePath: "/legacy/photo.jpg",
        },
        {
          locationId: location.id,
          placeId: "place",
          userId: other.id,
          imagekitFileId: "cascade-photo",
          imagekitFilePath: "/legacy/other.jpg",
        },
        {
          locationId: location.id,
          placeId: "place",
          userId: null,
          imagekitFileId: "unowned-photo",
          imagekitFilePath: "/legacy/unowned.jpg",
        },
      ],
    });
    await db.session.create({
      data: {
        userId: user.id,
        token: "test-session",
        expiresAt: new Date(Date.now() + 100000),
      },
    });
    await db.oAuthClient.create({
      data: {
        clientId: "test-client",
        name: "Test",
        redirectUris: ["test://callback"],
        scopes: [],
        grantTypes: ["authorization_code", "refresh_token"],
      },
    });
    await db.oAuthAuthorizationCode.create({
      data: {
        clientId: "test-client",
        userId: user.id,
        code: "test-code",
        redirectUri: "test://callback",
        codeChallenge: "test-challenge",
        codeChallengeMethod: "S256",
        scopes: [],
        expiresAt: new Date(Date.now() + 100000),
      },
    });
    await db.oAuthRefreshToken.create({
      data: {
        clientId: "test-client",
        userId: user.id,
        token: "test-refresh",
        scopes: [],
        expiresAt: new Date(Date.now() + 100000),
      },
    });
    const cleanupId = await deletion.deleteAccountAndQueueMedia(user.id);
    expect(await db.user.findUnique({ where: { id: user.id } })).toBeNull();
    expect(await db.session.count({ where: { userId: user.id } })).toBe(0);
    expect(await db.oAuthAuthorizationCode.count()).toBe(0);
    expect(await db.oAuthRefreshToken.count()).toBe(0);
    expect(await db.photo.count()).toBe(0);
    expect(await db.location.count()).toBe(0);
    expect(
      await db.user.findUnique({ where: { id: other.id } }),
    ).not.toBeNull();
    const job = await db.accountMediaCleanup.findUniqueOrThrow({
      where: { id: cleanupId! },
    });
    expect(job.fileIds.sort()).toEqual([
      "avatar-file",
      "banner-file",
      "cascade-photo",
      "own-photo",
      "unowned-photo",
    ]);
    expect(job.folderPath).toBe(`/development/users/${user.id}/`);
    expect(job.purgeUrls.sort()).toEqual(
      [
        getImageKitUrl(`/development/users/${user.id}/`) + "*",
        getImageKitUrl("/legacy/photo.jpg") + "*",
        getImageKitUrl("/legacy/other.jpg") + "*",
        getImageKitUrl("/legacy/unowned.jpg") + "*",
      ].sort(),
    );
    expect(job.sweepAfter.getTime()).toBeGreaterThan(
      Date.now() + 60 * 60 * 1000,
    );
    const audit = await db.securityLog.findFirstOrThrow();
    expect(audit.userId).toBeNull();
    expect(audit.metadata).toEqual({ cleanupId });
    expect(deleteFromImageKit).not.toHaveBeenCalled();
  });

  it("rolls back both account deletion and the queue when deletion cannot commit", async () => {
    const user = await createUser();
    await db.$executeRawUnsafe(
      "CREATE TABLE deletion_test_guard (user_id INTEGER REFERENCES users(id) ON DELETE RESTRICT)",
    );
    try {
      await db.$executeRaw`INSERT INTO deletion_test_guard (user_id) VALUES (${user.id})`;
      await expect(
        deletion.deleteAccountAndQueueMedia(user.id),
      ).rejects.toThrow();
      expect(
        await db.user.findUnique({ where: { id: user.id } }),
      ).not.toBeNull();
      expect(await db.accountMediaCleanup.count()).toBe(0);
      expect(await db.securityLog.count()).toBe(0);
    } finally {
      await db.$executeRawUnsafe("DROP TABLE deletion_test_guard");
    }
  });

  it("queues a folder sweep even with no photos, avatar or banner", async () => {
    const user = await createUser();
    await db.user.update({
      where: { id: user.id },
      data: { avatarFileId: null, bannerFileId: null },
    });
    const id = await deletion.deleteAccountAndQueueMedia(user.id);
    const job = await db.accountMediaCleanup.findUniqueOrThrow({
      where: { id: id! },
    });
    expect(job.fileIds).toEqual([]);
    expect(await deletion.processAccountMediaCleanup(job.id)).toBe("pending");
    expect(deleteImageKitFolder).toHaveBeenCalledWith(job.folderPath);
    const pending = await db.accountMediaCleanup.findUniqueOrThrow({
      where: { id: job.id },
    });
    expect(pending.nextAttemptAt.getTime()).toBeLessThan(
      job.sweepAfter.getTime(),
    );
    await db.accountMediaCleanup.update({
      where: { id: job.id },
      data: { nextAttemptAt: new Date(0) },
    });
    expect(await deletion.processAccountMediaCleanup(job.id)).toBe("pending");
    expect(
      (
        await db.accountMediaCleanup.findUniqueOrThrow({
          where: { id: job.id },
        })
      ).nextAttemptAt,
    ).toEqual(job.sweepAfter);
  });

  it("returns not-found without enqueuing any media", async () => {
    expect(await deletion.deleteAccountAndQueueMedia(-1)).toBeNull();
    expect(await db.accountMediaCleanup.count()).toBe(0);
  });

  it("retains the job on storage failure and retries successfully later", async () => {
    const job = await createJob();
    vi.mocked(deleteFromImageKit).mockResolvedValueOnce({
      success: false,
      error: "outage",
    });
    expect(await deletion.processAccountMediaCleanup(job.id)).toBe("failed");
    const failed = await db.accountMediaCleanup.findUniqueOrThrow({
      where: { id: job.id },
    });
    expect(failed.fileIds).toEqual(job.fileIds);
    expect(failed.lastError).toBe("storage_delete_failed");
    expect(failed.lockToken).toBeNull();
    expect(failed.nextAttemptAt.getTime()).toBeGreaterThan(Date.now());
    expect(await deletion.processAccountMediaCleanup(job.id)).toBe("skipped");
    await db.accountMediaCleanup.update({
      where: { id: job.id },
      data: { nextAttemptAt: new Date(0) },
    });
    expect(await deletion.processAccountMediaCleanup(job.id)).toBe("completed");
    expect(await db.accountMediaCleanup.count()).toBe(0);
  });

  it("checkpoints successful files so a later failure does not restart the batch", async () => {
    const job = await createJob(["first", "second"]);
    vi.mocked(deleteFromImageKit)
      .mockResolvedValueOnce({ success: true })
      .mockResolvedValueOnce({ success: false });
    expect(await deletion.processAccountMediaCleanup(job.id)).toBe("failed");
    expect(
      (
        await db.accountMediaCleanup.findUniqueOrThrow({
          where: { id: job.id },
        })
      ).fileIds,
    ).toEqual(["second"]);
    expect(deleteImageKitFolder).not.toHaveBeenCalled();
  });

  it("retains a failed folder cleanup even after all tracked files are removed", async () => {
    const job = await createJob();
    vi.mocked(deleteImageKitFolder).mockResolvedValueOnce({ success: false });
    expect(await deletion.processAccountMediaCleanup(job.id)).toBe("failed");
    expect(
      (
        await db.accountMediaCleanup.findUniqueOrThrow({
          where: { id: job.id },
        })
      ).fileIds,
    ).toEqual([]);
  });

  it("allows only one concurrent worker to claim a job", async () => {
    const job = await createJob();
    const outcomes = await Promise.all([
      deletion.processAccountMediaCleanup(job.id),
      deletion.processAccountMediaCleanup(job.id),
    ]);
    expect(outcomes.sort()).toEqual(["completed", "skipped"]);
    expect(deleteFromImageKit).toHaveBeenCalledTimes(1);
  });

  it("recovers a terminated worker after its lease expires", async () => {
    const job = await createJob();
    await db.accountMediaCleanup.update({
      where: { id: job.id },
      data: { lockToken: "terminated-worker", lockedUntil: new Date(0) },
    });
    expect(await deletion.processAccountMediaCleanup(job.id)).toBe("completed");
  });

  it("does not overwrite a newer worker's lease or checkpoint", async () => {
    const job = await createJob();
    vi.mocked(deleteFromImageKit).mockImplementationOnce(async () => {
      await db.accountMediaCleanup.update({
        where: { id: job.id },
        data: {
          lockToken: "new-worker",
          lockedUntil: new Date(Date.now() + 300000),
        },
      });
      return { success: true };
    });
    expect(await deletion.processAccountMediaCleanup(job.id)).toBe("skipped");
    const pending = await db.accountMediaCleanup.findUniqueOrThrow({
      where: { id: job.id },
    });
    expect(pending.lockToken).toBe("new-worker");
    expect(pending.fileIds).toEqual(job.fileIds);
    expect(deleteImageKitFolder).not.toHaveBeenCalled();
  });

  it("bounds each batch and preserves remaining work", async () => {
    const ids = Array.from({ length: 26 }, (_, index) => `file-${index}`);
    const job = await createJob(ids);
    expect(await deletion.processAccountMediaCleanup(job.id)).toBe("pending");
    expect(deleteFromImageKit).toHaveBeenCalledTimes(25);
    expect(
      (
        await db.accountMediaCleanup.findUniqueOrThrow({
          where: { id: job.id },
        })
      ).fileIds,
    ).toEqual(["file-25"]);
    expect(deleteImageKitFolder).not.toHaveBeenCalled();
    expect(await deletion.processAccountMediaCleanup(job.id)).toBe("completed");
  });

  it("does not discard a job on an unexpected storage exception", async () => {
    const job = await createJob();
    vi.mocked(deleteFromImageKit).mockRejectedValueOnce(
      new Error("network disconnected"),
    );
    expect(await deletion.processAccountMediaCleanup(job.id)).toBe("failed");
    expect(await db.accountMediaCleanup.count()).toBe(1);
  });

  it("reports failed work instead of a success-shaped worker result", async () => {
    await createJob();
    vi.mocked(deleteFromImageKit).mockResolvedValueOnce({ success: false });
    expect(await deletion.processDueAccountMediaCleanup()).toEqual({
      completed: 0,
      pending: 0,
      failed: 1,
      skipped: 0,
    });
  });

  it("waits for confirmed CDN purge completion before removing the job", async () => {
    const job = await createJob([]);
    await db.accountMediaCleanup.update({
      where: { id: job.id },
      data: {
        purgeUrls: ["https://example.com/media.jpg*"],
        pendingPurgeUrls: ["https://example.com/media.jpg*"],
      },
    });
    expect(await deletion.processAccountMediaCleanup(job.id)).toBe("pending");
    let pending = await db.accountMediaCleanup.findUniqueOrThrow({
      where: { id: job.id },
    });
    expect(pending.pendingPurgeUrls).toEqual([]);
    expect(pending.purgeRequestIds).toEqual(["purge-request"]);
    vi.mocked(getStoragePurgeStatus).mockResolvedValueOnce("pending");
    await db.accountMediaCleanup.update({
      where: { id: job.id },
      data: { nextAttemptAt: new Date(0) },
    });
    expect(await deletion.processAccountMediaCleanup(job.id)).toBe("pending");
    pending = await db.accountMediaCleanup.findUniqueOrThrow({
      where: { id: job.id },
    });
    expect(pending.purgeRequestIds).toEqual(["purge-request"]);
    await db.accountMediaCleanup.update({
      where: { id: job.id },
      data: { nextAttemptAt: new Date(0) },
    });
    expect(await deletion.processAccountMediaCleanup(job.id)).toBe("completed");
    expect(requestStoragePurge).toHaveBeenCalledTimes(1);
  });

  it("retains purge URLs on an invalidation outage", async () => {
    const job = await createJob([]);
    await db.accountMediaCleanup.update({
      where: { id: job.id },
      data: { pendingPurgeUrls: ["https://example.com/media.jpg*"] },
    });
    vi.mocked(requestStoragePurge).mockRejectedValueOnce(
      new Error("quota exceeded"),
    );
    expect(await deletion.processAccountMediaCleanup(job.id)).toBe("failed");
    const pending = await db.accountMediaCleanup.findUniqueOrThrow({
      where: { id: job.id },
    });
    expect(pending.pendingPurgeUrls).toEqual([
      "https://example.com/media.jpg*",
    ]);
    expect(pending.lastError).toBe("cleanup_operation_failed");
  });

  it("reissues cache invalidation after the late-upload folder sweep", async () => {
    const job = await createJob([]);
    await db.accountMediaCleanup.update({
      where: { id: job.id },
      data: {
        purgeUrls: ["https://example.com/user/*"],
        purgeRequestIds: ["initial-purge"],
      },
    });
    expect(await deletion.processAccountMediaCleanup(job.id)).toBe("pending");
    expect(deleteImageKitFolder).toHaveBeenCalledWith(job.folderPath);
    expect(requestStoragePurge).toHaveBeenCalledWith(
      "https://example.com/user/*",
    );
    const pending = await db.accountMediaCleanup.findUniqueOrThrow({
      where: { id: job.id },
    });
    expect(pending.finalSweepCompleted).toBe(true);
    expect(pending.purgeRequestIds).toEqual(["purge-request"]);
  });

  it("includes legacy profile URLs without retaining query strings", async () => {
    const user = await createUser();
    await db.user.update({
      where: { id: user.id },
      data: {
        avatar: getImageKitUrl("/legacy/avatar.jpg") + "?tr=w-32",
        bannerImage: getImageKitUrl(`/development/users/${user.id}/banner.jpg`),
      },
    });
    const id = await deletion.deleteAccountAndQueueMedia(user.id);
    const job = await db.accountMediaCleanup.findUniqueOrThrow({
      where: { id: id! },
    });
    expect(job.purgeUrls.sort()).toEqual(
      [
        getImageKitUrl(`/development/users/${user.id}/`) + "*",
        getImageKitUrl("/legacy/avatar.jpg") + "*",
      ].sort(),
    );
  });

  it("records administrative deletion inside the same transaction without retaining deleted profile PII", async () => {
    const user = await createUser();
    const admin = await createUser("admin-user");
    const cleanupId = await deletion.deleteAccountAndQueueMedia(user.id, {
      userId: admin.id,
      ipAddress: "127.0.0.1",
      userAgent: "test-agent",
    });
    const audit = await db.securityLog.findFirstOrThrow();
    expect(audit.eventType).toBe("ADMIN_USER_DELETED");
    expect(audit.userId).toBe(admin.id);
    expect(audit.metadata).toEqual({ cleanupId });
  });
});
