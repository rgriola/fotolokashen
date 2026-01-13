/**
 * Setup test data for Phase 1 testing
 * Creates/updates locations to be public for testing
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Checking existing users and locations...\n');

  // Get all users with their save counts
  const users = await prisma.user.findMany({
    include: {
      savedLocations: {
        select: {
          id: true,
          visibility: true,
          location: {
            select: {
              name: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 10,
  });

  if (users.length === 0) {
    console.log('❌ No users found in database.');
    console.log('💡 Please register a user first at http://localhost:3000/register\n');
    return;
  }

  console.log('📊 Current Users:\n');
  for (const user of users) {
    const publicCount = user.savedLocations.filter((s) => s.visibility === 'public').length;
    const privateCount = user.savedLocations.filter((s) => s.visibility === 'private').length;
    const totalCount = user.savedLocations.length;

    console.log(`  @${user.username} (${user.email})`);
    console.log(`    Total locations: ${totalCount}`);
    console.log(`    Public: ${publicCount}`);
    console.log(`    Private: ${privateCount}`);
    console.log('');
  }

  // Find a user with saved locations
  const userWithSaves = users.find((u) => u.savedLocations.length > 0);

  if (!userWithSaves) {
    console.log('❌ No users with saved locations found.');
    console.log('💡 Please save some locations first at http://localhost:3000/map\n');
    return;
  }

  const publicSaves = userWithSaves.savedLocations.filter((s) => s.visibility === 'public');

  if (publicSaves.length >= 3) {
    console.log(`✅ User @${userWithSaves.username} already has ${publicSaves.length} public locations!`);
    console.log('✅ Test data is ready!\n');
    console.log('🧪 Test URLs:');
    console.log(`   Profile: http://localhost:3000/@${userWithSaves.username}`);
    console.log(`   API: http://localhost:3000/api/v1/users/${userWithSaves.username}`);
    console.log(`   Locations API: http://localhost:3000/api/v1/users/${userWithSaves.username}/locations\n`);
    return;
  }

  // Update some locations to be public
  const savesToUpdate = userWithSaves.savedLocations
    .filter((s) => s.visibility === 'private')
    .slice(0, 3);

  if (savesToUpdate.length === 0) {
    console.log('❌ No private locations to update.');
    console.log('💡 Please save more locations first.\n');
    return;
  }

  console.log(`🔄 Updating ${savesToUpdate.length} locations to public for @${userWithSaves.username}...\n`);

  for (const save of savesToUpdate) {
    await prisma.userSave.update({
      where: { id: save.id },
      data: {
        visibility: 'public',
        caption: `This is a test public location: ${save.location.name}`,
      },
    });
    console.log(`  ✅ Made "${save.location.name}" public`);
  }

  const updatedUser = await prisma.user.findUnique({
    where: { id: userWithSaves.id },
    include: {
      savedLocations: {
        where: { visibility: 'public' },
        include: {
          location: {
            select: {
              name: true,
              address: true,
            },
          },
        },
      },
    },
  });

  console.log('\n✅ Test data setup complete!\n');
  console.log(`📊 @${updatedUser?.username} now has ${updatedUser?.savedLocations.length} public locations:\n`);

  updatedUser?.savedLocations.forEach((save, i) => {
    console.log(`  ${i + 1}. ${save.location.name}`);
    console.log(`     ${save.location.address || '(no address)'}`);
    console.log(`     Caption: ${save.caption || '(no caption)'}`);
    console.log('');
  });

  console.log('🧪 Test URLs:');
  console.log(`   Profile: http://localhost:3000/@${updatedUser?.username}`);
  console.log(`   API User: http://localhost:3000/api/v1/users/${updatedUser?.username}`);
  console.log(`   API Locations: http://localhost:3000/api/v1/users/${updatedUser?.username}/locations`);
  console.log('');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
