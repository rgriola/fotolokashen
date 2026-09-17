-- Phase 2A: Database Setup
-- Enable extensions and create indexes for social features

-- Enable pg_trgm extension for fuzzy text search (username matching)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create full-text search index on user bio field
CREATE INDEX IF NOT EXISTS idx_user_bio_fulltext 
ON users USING GIN (to_tsvector('english', COALESCE(bio, '')));

-- Create trigram index for fuzzy username search
CREATE INDEX IF NOT EXISTS idx_user_username_trgm 
ON users USING gin (username gin_trgm_ops);

-- Verify extensions
SELECT * FROM pg_extension WHERE extname IN ('pg_trgm');

-- Verify indexes
SELECT 
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'users'
AND (indexname LIKE '%bio%' OR indexname LIKE '%username%' OR indexname LIKE '%city%' OR indexname LIKE '%country%')
ORDER BY indexname;
