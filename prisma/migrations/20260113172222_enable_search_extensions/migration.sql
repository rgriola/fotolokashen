-- Enable pg_trgm extension for fuzzy text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create GIN index on username for faster fuzzy search
CREATE INDEX IF NOT EXISTS idx_users_username_trgm ON users USING GIN (username gin_trgm_ops);

-- Create full-text search index on bio
CREATE INDEX IF NOT EXISTS idx_users_bio_fulltext ON users USING GIN (to_tsvector('english', COALESCE(bio, '')));

-- Create indexes on city and country for geographic search (if not already exist)
CREATE INDEX IF NOT EXISTS idx_users_city ON users (city);
CREATE INDEX IF NOT EXISTS idx_users_country ON users (country);
