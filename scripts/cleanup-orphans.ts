/**
 * Orphan Cleanup Script
 *
 * Identifies and optionally cleans up orphaned locations and photos
 * Run with: npx tsx scripts/cleanup-orphans.ts [--dry-run]
 */

import { PrismaClient } from "@prisma/client";
import ImageKit from "imagekit";

const prisma = new PrismaClient();

const isDryRun = process.argv.includes("--dry-run");

console.log(
  "================================================================================",
);
console.log("🧹 ORPHAN CLEANUP SCRIPT");
console.log(
  "================================================================================",
);
console.log(
  `Mode: ${isDryRun ? "DRY RUN (no changes)" : "LIVE (will delete data)"}`,
);
console.log("");

async function main() {
  // Initialize ImageKit
  const imagekit = new ImageKit({
    publicKey: process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY || "",
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY || "",
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT || "",
  });

  console.log("📊 Step 1: Identifying orphaned locations...\n");

  // Find locations with no saves
  const orphanedLocations = await prisma.location.findMany({
    where: {
      savedBy: {
        none: {},
      },
    },
    include: {
      photos: true,
      creator: {
        select: {
          id: true,
          email: true,
          username: true,
        },
      },
    },
  });

  console.log(`Found ${orphanedLocations.length} orphaned locations\n`);

  if (orphanedLocations.length === 0) {
    console.log("✅ No orphaned locations found! Database is clean.\n");
    return;
  }

  let totalPhotos = 0;
  let totalFileSize = 0;

  console.log("📋 Orphaned Locations Details:\n");
  console.log("─".repeat(80));

  orphanedLocations.forEach((location, index) => {
    const photoCount = location.photos.length;
    const fileSize = location.photos.reduce(
      (sum, p) => sum + (p.fileSize || 0),
      0,
    );
    totalPhotos += photoCount;
    totalFileSize += fileSize;

    console.log(`${index + 1}. Location ID: ${location.id}`);
    console.log(`   Name: ${location.name}`);
    console.log(
      `   Created By: ${location.creator.email} (ID: ${location.createdBy})`,
    );
    console.log(`   Created At: ${location.createdAt.toISOString()}`);
    console.log(`   Photos: ${photoCount}`);
    console.log(`   Total Size: ${(fileSize / 1024 / 1024).toFixed(2)} MB`);

    if (location.photos.length > 0) {
      console.log(
        `   Photo IDs: ${location.photos.map((p) => p.id).join(", ")}`,
      );
    }

    console.log("");
  });

  console.log("─".repeat(80));
  console.log(`\n📊 Summary:`);
  console.log(`   Total Orphaned Locations: ${orphanedLocations.length}`);
  console.log(`   Total Orphaned Photos: ${totalPhotos}`);
  console.log(
    `   Total File Size: ${(totalFileSize / 1024 / 1024).toFixed(2)} MB`,
  );
  console.log("");

  if (isDryRun) {
    console.log("🔍 DRY RUN MODE - No changes will be made");
    console.log(
      "   Run without --dry-run flag to actually delete orphaned data",
    );
    console.log("");
    return;
  }

  // Confirm deletion
  console.log("⚠️  WARNING: About to delete orphaned locations and photos!");
  console.log("   This will:");
  console.log("   1. Delete photos from ImageKit CDN");
  console.log("   2. Delete photo records from database");
  console.log("   3. Delete location records from database");
  console.log("");
  console.log("   Press Ctrl+C to cancel, or wait 10 seconds to proceed...");
  console.log("");

  await new Promise((resolve) => setTimeout(resolve, 10000));

  console.log("🗑️  Step 2: Deleting orphaned data...\n");

  let deletedLocations = 0;
  let deletedPhotos = 0;
  let failedPhotoDeletes = 0;

  for (const location of orphanedLocations) {
    console.log(`\nProcessing Location ${location.id}: ${location.name}`);

    // Delete photos from ImageKit
    for (const photo of location.photos) {
      try {
        console.log(`   🗑️  Deleting photo ${photo.id} from ImageKit...`);
        await imagekit.deleteFile(photo.imagekitFileId);
        console.log(`   ✅ Deleted photo ${photo.id} from ImageKit`);
        deletedPhotos++;
      } catch (error: any) {
        console.error(
          `   ❌ Failed to delete photo ${photo.id} from ImageKit:`,
          error.message,
        );
        failedPhotoDeletes++;
      }
    }

    // Delete location (cascade will delete photos from DB)
    try {
      console.log(`   🗑️  Deleting location ${location.id} from database...`);
      await prisma.location.delete({
        where: { id: location.id },
      });
      console.log(`   ✅ Deleted location ${location.id} from database`);
      deletedLocations++;
    } catch (error: any) {
      console.error(
        `   ❌ Failed to delete location ${location.id}:`,
        error.message,
      );
    }
  }

  console.log("\n");
  console.log("─".repeat(80));
  console.log("✅ CLEANUP COMPLETE\n");
  console.log("📊 Results:");
  console.log(
    `   Locations Deleted: ${deletedLocations} / ${orphanedLocations.length}`,
  );
  console.log(
    `   Photos Deleted from ImageKit: ${deletedPhotos} / ${totalPhotos}`,
  );
  console.log(`   Photo Deletion Failures: ${failedPhotoDeletes}`);
  console.log(
    `   Freed Storage: ~${(totalFileSize / 1024 / 1024).toFixed(2)} MB`,
  );
  console.log("─".repeat(80));
  console.log("");
}

main()
  .catch((error) => {
    console.error("❌ Error running cleanup script:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
