import { randomUUID } from "node:crypto";
import prisma from "@/lib/prisma";
import { getUserRootFolder } from "@/lib/constants/upload";
import {
  deleteFromImageKit,
  deleteImageKitFolder,
  getImageKitUrl,
  getStoragePurgeStatus,
  requestStoragePurge,
} from "@/lib/storage";

const LEASE_MS = 5 * 60 * 1000;
const RETRY_MS = 60 * 60 * 1000;
const FILES_PER_ATTEMPT = 25;
const PURGES_PER_ATTEMPT = 10;
const PURGE_POLL_MS = 60 * 1000;
// ImageKit upload signatures currently default to 30 minutes. Sweep afterwards
// to catch uploads authorized before the account was deleted.
const FINAL_SWEEP_DELAY_MS = 2 * 60 * 60 * 1000;

export async function deleteAccountAndQueueMedia(
  userId: number,
  adminAudit?: { userId: number; ipAddress: string; userAgent: string },
) {
  return prisma.$transaction(
    async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: {
          avatarFileId: true,
          bannerFileId: true,
          avatar: true,
          bannerImage: true,
        },
      });
      if (!user) return null;

      // Location cascades also remove photos uploaded there by other users.
      const photos = await tx.photo.findMany({
        where: { OR: [{ userId }, { location: { createdBy: userId } }] },
        select: { imagekitFileId: true, imagekitFilePath: true },
      });
      const fileIds = [
        ...new Set(
          [
            user.avatarFileId,
            user.bannerFileId,
            ...photos.map((photo) => photo.imagekitFileId),
          ].filter((id): id is string => Boolean(id)),
        ),
      ];
      const folderPath = getUserRootFolder(userId);
      const folderUrl = getImageKitUrl(folderPath);
      const purgeUrls = new Set([`${folderUrl}*`]);
      for (const photo of photos) {
        if (!photo.imagekitFilePath || photo.imagekitFilePath === "/") {
          throw new Error(
            "Cannot snapshot media cache cleanup without a file path",
          );
        }
        const url = getImageKitUrl(photo.imagekitFilePath);
        if (!url.startsWith(folderUrl)) purgeUrls.add(`${url}*`);
      }
      for (const profileUrl of [user.avatar, user.bannerImage]) {
        if (!profileUrl) continue;
        const url = new URL(profileUrl);
        const endpoint = new URL(getImageKitUrl("/"));
        if (
          url.origin !== endpoint.origin ||
          !url.pathname.startsWith(endpoint.pathname)
        ) {
          continue; // External profile images are not stored in our ImageKit account.
        }
        url.search = "";
        url.hash = "";
        if (!url.href.startsWith(folderUrl)) purgeUrls.add(`${url.href}*`);
      }
      const cleanup = await tx.accountMediaCleanup.create({
        data: {
          fileIds,
          folderPath,
          purgeUrls: [...purgeUrls],
          pendingPurgeUrls: [...purgeUrls],
          purgeRequestIds: [],
          sweepAfter: new Date(Date.now() + FINAL_SWEEP_DELAY_MS),
        },
      });
      await tx.user.delete({ where: { id: userId } });
      await tx.securityLog.create({
        data: {
          userId: adminAudit?.userId,
          ipAddress: adminAudit?.ipAddress,
          userAgent: adminAudit?.userAgent,
          eventType: adminAudit
            ? "ADMIN_USER_DELETED"
            : "ACCOUNT_DELETED_MEDIA_QUEUED",
          success: true,
          metadata: { cleanupId: cleanup.id },
        },
      });
      return cleanup.id;
    },
    { isolationLevel: "Serializable" },
  );
}

export type CleanupOutcome = "completed" | "pending" | "failed" | "skipped";

export async function processAccountMediaCleanup(
  id: string,
): Promise<CleanupOutcome> {
  const now = new Date();
  const lockToken = randomUUID();
  const claimed = await prisma.accountMediaCleanup.updateMany({
    where: {
      id,
      nextAttemptAt: { lte: now },
      OR: [{ lockedUntil: null }, { lockedUntil: { lte: now } }],
    },
    data: {
      lockToken,
      lockedUntil: new Date(now.getTime() + LEASE_MS),
      attempts: { increment: 1 },
    },
  });
  if (claimed.count === 0) return "skipped";

  const owned = { id, lockToken };
  try {
    const job = await prisma.accountMediaCleanup.findFirst({ where: owned });
    if (!job) return "skipped";

    let remaining = job.fileIds;
    let pendingPurgeUrls = job.pendingPurgeUrls;
    let purgeRequestIds = job.purgeRequestIds;
    let finalSweepCompleted = job.finalSweepCompleted;
    for (const fileId of job.fileIds.slice(0, FILES_PER_ATTEMPT)) {
      const result = await deleteFromImageKit(fileId);
      if (!result.success) throw new Error("storage_delete_failed");
      remaining = remaining.filter((pending) => pending !== fileId);
      const checkpoint = await prisma.accountMediaCleanup.updateMany({
        where: owned,
        data: { fileIds: remaining },
      });
      if (checkpoint.count === 0) return "skipped";
    }

    if (remaining.length === 0 && !finalSweepCompleted) {
      const result = await deleteImageKitFolder(job.folderPath);
      if (!result.success) throw new Error("storage_delete_failed");
      if (Date.now() >= job.sweepAfter.getTime()) {
        finalSweepCompleted = true;
        pendingPurgeUrls = [
          ...new Set([...pendingPurgeUrls, ...job.purgeUrls]),
        ];
        const checkpoint = await prisma.accountMediaCleanup.updateMany({
          where: owned,
          data: { finalSweepCompleted, pendingPurgeUrls },
        });
        if (checkpoint.count === 0) return "skipped";
      }
    }

    if (remaining.length === 0) {
      for (const requestId of job.purgeRequestIds.slice(
        0,
        PURGES_PER_ATTEMPT,
      )) {
        if ((await getStoragePurgeStatus(requestId)) === "pending") continue;
        purgeRequestIds = purgeRequestIds.filter(
          (pending) => pending !== requestId,
        );
        const checkpoint = await prisma.accountMediaCleanup.updateMany({
          where: owned,
          data: { purgeRequestIds },
        });
        if (checkpoint.count === 0) return "skipped";
      }
      for (const url of pendingPurgeUrls.slice(0, PURGES_PER_ATTEMPT)) {
        const requestId = await requestStoragePurge(url);
        pendingPurgeUrls = pendingPurgeUrls.filter(
          (pending) => pending !== url,
        );
        purgeRequestIds = [...purgeRequestIds, requestId];
        const checkpoint = await prisma.accountMediaCleanup.updateMany({
          where: owned,
          data: { pendingPurgeUrls, purgeRequestIds },
        });
        if (checkpoint.count === 0) return "skipped";
      }
      if (
        finalSweepCompleted &&
        pendingPurgeUrls.length === 0 &&
        purgeRequestIds.length === 0
      ) {
        const deleted = await prisma.accountMediaCleanup.deleteMany({
          where: owned,
        });
        return deleted.count > 0 ? "completed" : "skipped";
      }
    }

    const released = await prisma.accountMediaCleanup.updateMany({
      where: owned,
      data: {
        lockToken: null,
        lockedUntil: null,
        lastError: null,
        nextAttemptAt: remaining.length
          ? new Date()
          : pendingPurgeUrls.length || purgeRequestIds.length
            ? new Date(Date.now() + PURGE_POLL_MS)
            : job.sweepAfter,
      },
    });
    return released.count > 0 ? "pending" : "skipped";
  } catch (error) {
    console.error("[AccountMediaCleanup] Cleanup attempt failed", {
      cleanupId: id,
      reason:
        error instanceof Error && error.message === "storage_delete_failed"
          ? "storage_delete_failed"
          : "cleanup_operation_failed",
    });
    await prisma.accountMediaCleanup.updateMany({
      where: owned,
      data: {
        lockToken: null,
        lockedUntil: null,
        lastError:
          error instanceof Error && error.message === "storage_delete_failed"
            ? "storage_delete_failed"
            : "cleanup_operation_failed",
        nextAttemptAt: new Date(Date.now() + RETRY_MS),
      },
    });
    return "failed";
  }
}

export async function processDueAccountMediaCleanup() {
  const now = new Date();
  const jobs = await prisma.accountMediaCleanup.findMany({
    where: {
      nextAttemptAt: { lte: now },
      OR: [{ lockedUntil: null }, { lockedUntil: { lte: now } }],
    },
    orderBy: { nextAttemptAt: "asc" },
    take: 5,
    select: { id: true },
  });
  const counts = { completed: 0, pending: 0, failed: 0, skipped: 0 };
  for (const job of jobs) {
    counts[await processAccountMediaCleanup(job.id)]++;
  }
  return counts;
}
