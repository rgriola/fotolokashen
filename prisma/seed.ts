import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...\n");

  // Seed reserved usernames
  const reservedUsernames = [
    { username: "admin", reason: "System route" },
    { username: "api", reason: "System route" },
    { username: "app", reason: "System route" },
    { username: "auth", reason: "System route" },
    { username: "blog", reason: "Future feature" },
    { username: "help", reason: "System route" },
    { username: "login", reason: "System route" },
    { username: "logout", reason: "System route" },
    { username: "map", reason: "System route" },
    { username: "profile", reason: "System route" },
    { username: "register", reason: "System route" },
    { username: "settings", reason: "System route" },
    { username: "teams", reason: "Future feature (Phase 3)" },
    { username: "share", reason: "System route" },
    { username: "projects", reason: "Future feature (Phase 3)" },
    { username: "locations", reason: "System route" },
    { username: "verify-email", reason: "System route" },
    { username: "reset-password", reason: "System route" },
    { username: "forgot-password", reason: "System route" },
    { username: "cancel-email-change", reason: "System route" },
    { username: "verify-email-change", reason: "System route" },
    { username: "sentry-test", reason: "System route" },
    { username: "create-with-photo", reason: "System route" },
    { username: "not-found", reason: "System route" },
    { username: "favicon.ico", reason: "System route" },
  ];

  for (const reserved of reservedUsernames) {
    await prisma.reservedUsername.upsert({
      where: { username: reserved.username },
      update: {},
      create: reserved,
    });
  }

  console.log(`✅ Seeded ${reservedUsernames.length} reserved usernames`);
  console.log("\n🎉 Seeding complete!\n");
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:");
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
