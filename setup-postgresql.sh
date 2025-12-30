#!/bin/bash

# PostgreSQL Development Setup Script
# This script completes your PostgreSQL local development setup

set -e  # Exit on error

echo "🚀 Setting up PostgreSQL for local development..."
echo ""

# Step 1: Add PostgreSQL to PATH
echo "📌 Step 1: Adding PostgreSQL to PATH..."
export PATH="/opt/homebrew/opt/postgresql@15/bin:$PATH"
echo "✅ PostgreSQL added to PATH"
echo ""

# Step 2: Create development database
echo "📌 Step 2: Creating development database..."
if createdb google_search_me_dev 2>/dev/null; then
    echo "✅ Database 'google_search_me_dev' created successfully"
else
    echo "⚠️  Database 'google_search_me_dev' already exists (that's OK!)"
fi
echo ""

# Step 3: Get macOS username for connection string
USER=$(whoami)
DB_URL="postgresql://${USER}@localhost:5432/google_search_me_dev"

echo "📌 Step 3: Your DATABASE_URL:"
echo "   $DB_URL"
echo ""

# Step 4: Update .env file
echo "📌 Step 4: Updating .env file..."
cd /Users/rgriola/Desktop/01_Vibecode/google-search-me-refactor

# Backup current .env
cp .env .env.backup.$(date +%Y%m%d_%H%M%S)

# Update DATABASE_URL in .env
sed -i.bak 's|DATABASE_URL="mysql://.*"|DATABASE_URL="'"$DB_URL"'"|g' .env
rm .env.bak

echo "✅ .env updated (backup created)"
echo ""

# Step 5: Update .env.local file  
echo "📌 Step 5: Updating .env.local file..."
sed -i.bak 's|DATABASE_URL="mysql://.*"|DATABASE_URL="'"$DB_URL"'"|g' .env.local
rm .env.local.bak

echo "✅ .env.local updated"
echo ""

# Step 6: Generate Prisma Client
echo "📌 Step 6: Generating Prisma Client..."
npx prisma generate
echo "✅ Prisma Client generated"
echo ""

# Step 7: Push schema to database
echo "📌 Step 7: Pushing schema to database..."
npx prisma db push --accept-data-loss
echo "✅ Schema pushed to database"
echo ""

# Step 8: Verify tables
echo "📌 Step 8: Verifying database tables..."
psql $DB_URL -c "\dt" | head -20
echo "✅ Tables created successfully"
echo ""

echo "🎉 Setup Complete!"
echo ""
echo "Your PostgreSQL development environment is ready!"
echo ""
echo "Quick commands:"
echo "  • Start dev server:    npm run dev"
echo "  • Database browser:    npx prisma studio"
echo "  • Connect to DB:       psql google_search_me_dev"
echo "  • View DATABASE_URL:   echo \$DATABASE_URL"
echo ""
echo "📝 Your DATABASE_URL has been updated in both .env and .env.local"
echo "   $DB_URL"
echo ""
echo "Next step: Test your app with 'npm run dev'"
