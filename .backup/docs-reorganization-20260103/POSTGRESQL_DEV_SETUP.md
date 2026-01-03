# PostgreSQL Development Setup - Complete Guide

**Date**: December 28, 2025  
**Status**: ✅ PostgreSQL Installed  
**Strategy**: Use PostgreSQL everywhere (Dev, Preview, Production)

---

## ✅ What's Installed

- **PostgreSQL 15** via Homebrew
- **Service**: Running automatically (brew services)
- **Default user**: Your macOS username (no password needed locally)
- **Default database**: `postgres` (created automatically)

---

## 🎯 Next Steps to Complete Setup

### Step 1: Create Development Database

```bash
# Add PostgreSQL to PATH for this session
export PATH="/opt/homebrew/opt/postgresql@15/bin:$PATH"

# Create development database
createdb google_search_me_dev

# Verify it was created
psql -l | grep google_search_me_dev
```

### Step 2: Update Environment Files

Update your `.env` and `.env.local` files to use PostgreSQL:

**`.env`** (for Prisma CLI):
```bash
DATABASE_URL="postgresql://$(whoami)@localhost:5432/google_search_me_dev"
```

**`.env.local`** (for Next.js):
```bash
DATABASE_URL="postgresql://$(whoami)@localhost:5432/google_search_me_dev"
```

### Step 3: Initialize Database Schema

```bash
# Generate Prisma Client
npx prisma generate

# Push schema to your local PostgreSQL database
npx prisma db push

# (Optional) Open Prisma Studio to verify
npx prisma studio
```

---

## 📊 Your New Database Setup

```
Development (Local)
├── Database: PostgreSQL 15
├── Host: localhost:5432
├── DB Name: google_search_me_dev
├── User: Your macOS username
└── Password: (none - trusted local connection)

Preview (Vercel)
├── Database: PostgreSQL on Neon
├── Connection: Use production DB or separate preview branch
└── Env Var: DATABASE_URL (set in Vercel dashboard)

Production (Vercel)
├── Database: PostgreSQL on Neon
├── Host: ep-cool-star-a4dyxqi4.us-east-1.aws.neon.tech
├── DB Name: neondb
└── Env Var: DATABASE_URL (set in Vercel dashboard)
```

---

## 🔧 Useful PostgreSQL Commands

```bash
# Start/Stop PostgreSQL
brew services start postgresql@15
brew services stop postgresql@15
brew services restart postgresql@15

# Check if running
brew services list | grep postgresql

# Connect to database
psql google_search_me_dev

# List all databases
psql -l

# Create database
createdb database_name

# Drop database
dropdb database_name

# Backup database
pg_dump google_search_me_dev > backup.sql

# Restore database
psql google_search_me_dev < backup.sql
```

---

## 🎓 PostgreSQL vs MySQL Differences

### Advantages You Get with PostgreSQL

✅ **Same as production** - No surprises when deploying  
✅ **Better JSON support** - For your `tags` fields  
✅ **More robust** - Better ACID compliance  
✅ **Free hosting** - Neon, Supabase have generous free tiers  
✅ **Better tooling** - pgAdmin, Postico, etc.  

### Migration from MySQL

Your data in the MySQL database (`google_search_me`) is still there and safe. You're creating a fresh PostgreSQL database for development.

**If you need to migrate data**:
1. Export from MySQL: `mysqldump google_search_me > data.sql`
2. Convert to PostgreSQL format (or manually recreate test data)
3. Import to PostgreSQL: `psql google_search_me_dev < data_postgres.sql`

**For development**: It's often cleaner to start with a fresh database and seed test data.

---

## 🚀 Complete Migration Steps

Run these commands in order:

```bash
# 1. Add PostgreSQL to PATH
export PATH="/opt/homebrew/opt/postgresql@15/bin:$PATH"

# 2. Create development database
createdb google_search_me_dev

# 3. Update Prisma schema (already done - using PostgreSQL)
# schema.prisma already has: provider = "postgresql"

# 4. Generate Prisma Client
cd /Users/rgriola/Desktop/01_Vibecode/google-search-me-refactor
npx prisma generate

# 5. Push schema to database
npx prisma db push

# 6. Verify tables were created
psql google_search_me_dev -c "\dt"

# 7. (Optional) Seed with test data
npm run db:seed
```

---

## 📋 Checklist

- [x] PostgreSQL 15 installed via Homebrew
- [x] PostgreSQL service started
- [ ] Development database created (`google_search_me_dev`)
- [ ] `.env` updated with PostgreSQL connection string
- [ ] `.env.local` updated with PostgreSQL connection string
- [ ] Prisma Client generated
- [ ] Database schema pushed
- [ ] Tables verified in database
- [ ] Dev server tested
- [ ] Vercel `DATABASE_URL` environment variable set

---

## 🎯 What This Solves

### Before (MySQL locally, PostgreSQL in production)
```
❌ Development: MySQL
❌ Production: PostgreSQL
❌ Result: Schema differences, type mismatches, deployment surprises
```

### After (PostgreSQL everywhere)
```
✅ Development: PostgreSQL
✅ Preview: PostgreSQL  
✅ Production: PostgreSQL
✅ Result: Consistent, predictable, no surprises!
```

---

## 🔐 Security Notes

**Local PostgreSQL**:
- Uses "trust" authentication for local connections
- No password needed for your macOS user
- Only accessible from localhost (secure)

**Production PostgreSQL (Neon)**:
- Uses SSL/TLS encryption
- Requires password authentication
- Connection pooling for performance

---

## 💡 Pro Tips

1. **Use Prisma Studio** for visual database browsing:
   ```bash
   npx prisma studio
   # Opens http://localhost:5555
   ```

2. **Create database backups** before major changes:
   ```bash
   pg_dump google_search_me_dev > backup_$(date +%Y%m%d).sql
   ```

3. **Use separate databases** for different branches/features:
   ```bash
   createdb google_search_me_feature_x
   # Update DATABASE_URL temporarily
   ```

4. **Add this to your ~/.zshrc** for permanent PATH:
   ```bash
   echo 'export PATH="/opt/homebrew/opt/postgresql@15/bin:$PATH"' >> ~/.zshrc
   ```

---

## 🆘 Troubleshooting

### "createdb: command not found"
```bash
export PATH="/opt/homebrew/opt/postgresql@15/bin:$PATH"
```

### "psql: could not connect to server"
```bash
brew services start postgresql@15
```

### "database already exists"
```bash
# Drop and recreate if needed
dropdb google_search_me_dev
createdb google_search_me_dev
```

### "permission denied"
```bash
# Check PostgreSQL is running as your user
ps aux | grep postgres
```

---

**Ready to complete the setup?** Follow the steps above and you'll have PostgreSQL running locally in 5 minutes!
