-- Add bannerImage column to users table
ALTER TABLE users ADD COLUMN "bannerImage" TEXT;

-- Optional: Create index for faster queries if needed
-- CREATE INDEX idx_users_banner_image ON users("bannerImage");
