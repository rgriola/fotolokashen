# Phase 9: Migration Plan - ImageKit & Legacy Data

**Date**: December 30, 2025  
**Status**: 🚀 In Progress  
**Production**: https://merkel-vision.vercel.app ✅ LIVE

---

## 📊 Overview

Now that production is deployed and working, we need to:

1. **Phase 9A**: Migrate ImageKit folder structure to user-first paths
2. **Phase 9B**: Import legacy location/photo data to production database

---

## 🗂️ Phase 9A: ImageKit Folder Structure Migration

### Current State Analysis

**Existing Folder Structure** (Inconsistent):
```
/locations/{placeId}/photo.jpg          ← Old photo uploads
/avatars/user-{userId}.jpg              ← User avatars
/uploads/{random}/photo.jpg             ← Recent uploads (unknown structure)
```

**Target User-First Structure**:
```
/users/{userId}/locations/{placeId}/photo-{timestamp}.jpg
/users/{userId}/avatars/profile.jpg
/users/{userId}/uploads/{filename}
```

### Migration Steps

#### Step 1: Audit Existing Files

**Action**: Query ImageKit API to get all existing files

```typescript
// scripts/audit-imagekit-files.ts
import ImageKit from 'imagekit';

const imagekit = new ImageKit({
  publicKey: process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY!,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY!,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT!,
});

async function auditFiles() {
  // Get all files
  const files = await imagekit.listFiles({
    skip: 0,
    limit: 1000,
  });

  // Group by folder structure
  const byFolder = files.reduce((acc, file) => {
    const folder = file.filePath.split('/').slice(0, -1).join('/');
    if (!acc[folder]) acc[folder] = [];
    acc[folder].push(file);
    return acc;
  }, {} as Record<string, any[]>);

  console.log('Files by folder:', byFolder);
  return { files, byFolder };
}
```

**Questions to Answer**:
- [ ] How many files exist in ImageKit?
- [ ] What folder structures are currently in use?
- [ ] Can we identify userId from existing paths?
- [ ] Are there any orphaned files (no database reference)?

#### Step 2: Create Database Mapping

**Action**: Query production database to map photos to users

```sql
-- Get all photos with their user associations
SELECT 
  p.id,
  p.imagekitFileId,
  p.imagekitFilePath,
  p.placeId,
  p.userId,
  l.name as locationName
FROM photos p
JOIN locations l ON p.placeId = l.placeId
WHERE p.imagekitFileId IS NOT NULL
ORDER BY p.userId, p.uploadedAt;

-- Get all user avatars
SELECT 
  id,
  email,
  avatarImagekitFileId,
  avatarImagekitPath
FROM users
WHERE avatarImagekitFileId IS NOT NULL;
```

**Output**: CSV/JSON mapping of fileId → userId → new path

#### Step 3: Migration Script

**Action**: Move/rename files in ImageKit

```typescript
// scripts/migrate-imagekit-paths.ts
import ImageKit from 'imagekit';
import prisma from '@/lib/prisma';

interface FileMigration {
  fileId: string;
  oldPath: string;
  newPath: string;
  userId: number;
  type: 'photo' | 'avatar';
}

async function migrateFiles() {
  // 1. Get all photos from database
  const photos = await prisma.photo.findMany({
    where: { imagekitFileId: { not: null } },
    include: { user: true },
  });

  // 2. Build migration list
  const migrations: FileMigration[] = photos.map(photo => {
    const timestamp = photo.uploadedAt.getTime();
    const ext = photo.originalFilename?.split('.').pop() || 'jpg';
    return {
      fileId: photo.imagekitFileId!,
      oldPath: photo.imagekitFilePath!,
      newPath: `/users/${photo.userId}/locations/${photo.placeId}/photo-${timestamp}.${ext}`,
      userId: photo.userId,
      type: 'photo',
    };
  });

  // 3. Get all avatars
  const users = await prisma.user.findMany({
    where: { avatarImagekitFileId: { not: null } },
  });

  users.forEach(user => {
    const ext = user.avatarImagekitPath?.split('.').pop() || 'jpg';
    migrations.push({
      fileId: user.avatarImagekitFileId!,
      oldPath: user.avatarImagekitPath!,
      newPath: `/users/${user.id}/avatars/profile.${ext}`,
      userId: user.id,
      type: 'avatar',
    });
  });

  console.log(`Total migrations: ${migrations.length}`);
  
  // 4. Execute migrations (with error handling)
  for (const migration of migrations) {
    try {
      await imagekit.move({
        sourceFilePath: migration.oldPath,
        destinationPath: migration.newPath,
      });
      
      // Update database
      if (migration.type === 'photo') {
        await prisma.photo.update({
          where: { imagekitFileId: migration.fileId },
          data: { imagekitFilePath: migration.newPath },
        });
      } else {
        await prisma.user.update({
          where: { id: migration.userId },
          data: { avatarImagekitPath: migration.newPath },
        });
      }
      
      console.log(`✅ Migrated: ${migration.oldPath} → ${migration.newPath}`);
    } catch (error) {
      console.error(`❌ Failed: ${migration.oldPath}`, error);
    }
  }
}
```

#### Step 4: Verification

**Action**: Verify all images still load

```typescript
// scripts/verify-migration.ts
async function verifyMigration() {
  // Get all photos
  const photos = await prisma.photo.findMany({
    select: { id: true, imagekitFilePath: true, imagekitFileId: true },
  });

  for (const photo of photos) {
    try {
      // Try to get file details
      const file = await imagekit.getFileDetails(photo.imagekitFileId!);
      
      if (file.filePath !== photo.imagekitFilePath) {
        console.warn(`⚠️ Mismatch: DB says ${photo.imagekitFilePath}, ImageKit says ${file.filePath}`);
      } else {
        console.log(`✅ Photo ${photo.id} verified`);
      }
    } catch (error) {
      console.error(`❌ Photo ${photo.id} not found in ImageKit`);
    }
  }
}
```

#### Step 5: Cleanup Old Folders

**Action**: Remove empty old folders (manual or script)

```typescript
// After verifying all files are migrated
async function cleanupOldFolders() {
  const oldFolders = ['/locations', '/avatars', '/uploads'];
  
  for (const folder of oldFolders) {
    const files = await imagekit.listFiles({ path: folder });
    
    if (files.length === 0) {
      console.log(`✅ ${folder} is empty, can be deleted`);
      // Manually delete in ImageKit dashboard
    } else {
      console.warn(`⚠️ ${folder} still has ${files.length} files`);
      files.forEach(f => console.log(`  - ${f.filePath}`));
    }
  }
}
```

### Migration Checklist

- [ ] Run audit script to analyze current state
- [ ] Create database mapping (photos → users)
- [ ] Test migration script on 1-2 files first
- [ ] Run full migration script
- [ ] Verify all images load correctly
- [ ] Update any hardcoded paths in code
- [ ] Clean up old folders
- [ ] Document new structure

### Rollback Plan

**If something goes wrong**:

1. ImageKit allows moving files back
2. Database has old paths stored (add `oldImagekitFilePath` column temporarily)
3. Can restore from backup

**Safety**:
- Test on staging/preview first
- Keep old database values until verified
- ImageKit retains file history

---

## 📦 Phase 9B: Legacy Data Migration

### Current State

**Legacy Database** (SQLite):
- Location: `google-search-me/server/database/google_search_me.db`
- Tables: `users`, `locations`, `user_saves`, `sessions`, etc.

**Target Database** (PostgreSQL on Neon):
- Already has schema (9 tables, 148 fields)
- Currently empty (no production data)

### Migration Steps

#### Step 1: Export Legacy Data

**Action**: Dump SQLite data to JSON

```bash
# Install sqlite3 if needed
brew install sqlite3

# Navigate to legacy database
cd /Users/rgriola/Desktop/01_Vibecode/google-search-me/server/database

# Export to JSON
sqlite3 google_search_me.db <<EOF
.mode json
.output users.json
SELECT * FROM users;
.output locations.json
SELECT * FROM locations;
.output user_saves.json
SELECT * FROM user_saves;
.output photos.json
SELECT * FROM photos;
.output sessions.json
SELECT * FROM sessions;
EOF
```

Or use a script:

```typescript
// scripts/export-legacy-data.ts
import Database from 'better-sqlite3';
import fs from 'fs';

const db = new Database('/path/to/google_search_me.db');

const tables = ['users', 'locations', 'user_saves', 'photos', 'sessions'];

tables.forEach(table => {
  const rows = db.prepare(`SELECT * FROM ${table}`).all();
  fs.writeFileSync(
    `./data-export/${table}.json`,
    JSON.stringify(rows, null, 2)
  );
  console.log(`✅ Exported ${rows.length} rows from ${table}`);
});

db.close();
```

#### Step 2: Transform Data

**Action**: Convert SQLite format → PostgreSQL format

**Key Differences**:
- SQLite uses INTEGER for booleans → PostgreSQL uses BOOLEAN
- SQLite date strings → PostgreSQL TIMESTAMP
- Schema differences (new fields added)

```typescript
// scripts/transform-legacy-data.ts
interface LegacyUser {
  id: number;
  email: string;
  password_hash: string;
  created_at: string;
  // ... other fields
}

interface PostgresUser {
  id: number;
  email: string;
  passwordHash: string;
  createdAt: Date;
  // ... other fields
}

function transformUsers(legacyUsers: LegacyUser[]): PostgresUser[] {
  return legacyUsers.map(user => ({
    id: user.id,
    email: user.email,
    passwordHash: user.password_hash,
    createdAt: new Date(user.created_at),
    emailVerified: !!user.email_verified, // INTEGER → BOOLEAN
    // ... map all fields
  }));
}
```

#### Step 3: Import to Neon

**Action**: Use Prisma to insert data

```typescript
// scripts/import-to-production.ts
import prisma from '@/lib/prisma';
import fs from 'fs';

async function importData() {
  // 1. Import users first (foreign key dependencies)
  const users = JSON.parse(fs.readFileSync('./data-export/users-transformed.json', 'utf-8'));
  
  for (const user of users) {
    await prisma.user.upsert({
      where: { id: user.id },
      update: user,
      create: user,
    });
  }
  console.log(`✅ Imported ${users.length} users`);

  // 2. Import locations
  const locations = JSON.parse(fs.readFileSync('./data-export/locations-transformed.json', 'utf-8'));
  
  for (const location of locations) {
    await prisma.location.upsert({
      where: { placeId: location.placeId },
      update: location,
      create: location,
    });
  }
  console.log(`✅ Imported ${locations.length} locations`);

  // 3. Import user_saves (junction table)
  const userSaves = JSON.parse(fs.readFileSync('./data-export/user_saves-transformed.json', 'utf-8'));
  
  for (const save of userSaves) {
    await prisma.userSave.create({ data: save });
  }
  console.log(`✅ Imported ${userSaves.length} user saves`);

  // 4. Import photos
  const photos = JSON.parse(fs.readFileSync('./data-export/photos-transformed.json', 'utf-8'));
  
  for (const photo of photos) {
    await prisma.photo.create({ data: photo });
  }
  console.log(`✅ Imported ${photos.length} photos`);
}
```

#### Step 4: Verification

**Action**: Verify data integrity

```typescript
// scripts/verify-import.ts
async function verifyImport() {
  // Count records
  const counts = {
    users: await prisma.user.count(),
    locations: await prisma.location.count(),
    userSaves: await prisma.userSave.count(),
    photos: await prisma.photo.count(),
  };

  console.log('Production database counts:', counts);
  
  // Check relationships
  const usersWithSaves = await prisma.user.findMany({
    include: { userSaves: true },
  });
  
  usersWithSaves.forEach(user => {
    console.log(`User ${user.email} has ${user.userSaves.length} saved locations`);
  });

  // Verify photos have valid placeIds
  const orphanedPhotos = await prisma.photo.findMany({
    where: {
      location: null, // No matching location
    },
  });
  
  if (orphanedPhotos.length > 0) {
    console.warn(`⚠️ ${orphanedPhotos.length} orphaned photos found`);
  }
}
```

### Migration Checklist

- [ ] Export all tables from SQLite to JSON
- [ ] Create transformation scripts for each table
- [ ] Test import on Neon development branch first
- [ ] Run import on production database
- [ ] Verify record counts match
- [ ] Verify relationships (foreign keys)
- [ ] Test login with existing users
- [ ] Test viewing locations in production
- [ ] Backup production database

### Data Mapping

| SQLite Table | PostgreSQL Table | Notes |
|--------------|------------------|-------|
| `users` | `users` | Map `password_hash` → `passwordHash`, dates |
| `locations` | `locations` | Add new GPS/EXIF fields (default null) |
| `user_saves` | `user_saves` | Map snake_case → camelCase |
| `photos` | `photos` | Add 20 new EXIF fields (default null) |
| `sessions` | `sessions` | May need to regenerate tokens |

---

## 🎯 Success Criteria

### Phase 9A: ImageKit Migration
- ✅ All photos migrated to `/users/{userId}/locations/...`
- ✅ All avatars migrated to `/users/{userId}/avatars/...`
- ✅ Database `imagekitFilePath` updated
- ✅ All images still load correctly
- ✅ No 404 errors on production

### Phase 9B: Data Migration
- ✅ All users imported (login works)
- ✅ All locations imported (map shows pins)
- ✅ All user_saves imported (users see their locations)
- ✅ All photos imported (images display)
- ✅ Record counts match legacy database
- ✅ No orphaned records

---

## ⚠️ Risk Mitigation

### Backup Strategy
1. **Before migration**: Snapshot Neon database
2. **During migration**: Keep legacy SQLite database intact
3. **After migration**: Export PostgreSQL dump

### Testing Strategy
1. **Test on development branch** before production
2. **Import small batch** (10 users) first
3. **Verify functionality** before full import
4. **Monitor Vercel logs** for errors

### Rollback Plan
1. Neon supports point-in-time recovery
2. Can restore from backup
3. Legacy app still functional as fallback

---

## 📅 Timeline

**Estimated**: 2-4 hours total

1. **ImageKit Migration**: 1-2 hours
   - Audit: 15 min
   - Script: 30 min
   - Execute: 30 min
   - Verify: 15 min

2. **Data Migration**: 1-2 hours
   - Export: 15 min
   - Transform: 30 min
   - Import: 30 min
   - Verify: 15 min

---

## 🚀 Next Steps

1. Start with **Phase 9A** (ImageKit) - less risky
2. Test thoroughly on development
3. Proceed to **Phase 9B** (Data import)
4. Final verification in production

**Ready to start?** Let me know which phase you want to tackle first! 🎯
