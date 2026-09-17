-- CreateTable
CREATE TABLE IF NOT EXISTS "reserved_usernames" (
    "username" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reserved_usernames_pkey" PRIMARY KEY ("username")
);

-- AlterTable: Add fileId columns for ImageKit orphan cleanup
ALTER TABLE "users" 
  ADD COLUMN IF NOT EXISTS "avatarFileId" TEXT,
  ADD COLUMN IF NOT EXISTS "bannerFileId" TEXT;
