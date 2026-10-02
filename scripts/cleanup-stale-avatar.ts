/**
 * Cleanup Script: Remove Stale Avatar Path
 *
 * This script clears the avatar field from users where the ImageKit file doesn't exist.
 * The error handling we added will show fallback (initials/icon) until user re-uploads.
 */

import prisma from "../src/lib/prisma";

async function cleanupStaleAvatar() {
  console.log("🧹 Starting stale avatar cleanup...\n");

  try {
    // Find user with the stale avatar path
    const userId = 1; // Your user ID
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        avatar: true,
      },
    });

    if (!user) {
      console.log("❌ User not found");
      return;
    }

    console.log("👤 User found:");
    console.log(`   ID: ${user.id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Current Avatar: ${user.avatar || "None"}\n`);

    if (!user.avatar) {
      console.log("✅ No avatar set, nothing to clean up");
      return;
    }

    // Clear the stale avatar
    await prisma.user.update({
      where: { id: userId },
      data: { avatar: null },
    });

    console.log("✅ Avatar field cleared successfully!");
    console.log("\n📝 Next steps:");
    console.log("   1. The UI will now show fallback (initials/icon) ✅");
    console.log(
      "   2. User can re-upload avatar to create file in correct ImageKit location",
    );
    console.log(
      "   3. New path will be: /development/users/1/avatars/avatar-1-{timestamp}\n",
    );
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupStaleAvatar();
