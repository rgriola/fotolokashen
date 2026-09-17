# Vercel Migration Fix - Baseline Strategy

> **⚠️ SUPERSEDED — September 17, 2026.** The baseline described here was never
> carried out as written. Production was instead baselined on September 17, 2026
> with a generated `0_init` migration, and the build no longer runs migrations at
> all. See [DATABASE_DEPLOYMENT_GUIDE.md](./DATABASE_DEPLOYMENT_GUIDE.md#migration-history-baseline).

**Issue**: Production database has no migration history (was created with `db push`)

---

## Option 1: Baseline with Empty Migration (RECOMMENDED)

This tells Prisma "treat the current database state as the starting point":

1. **Create an initial migration** that represents your current database state:

```bash
# This creates a migration from your current schema
npx dotenv -e .env.local -- npx prisma migrate dev --name init --create-only
```

2. **Mark it as applied** to production (without running it):

Create a file: `.github/workflows/baseline-production.sh`

```bash
#!/bin/bash
# Run this ONCE to baseline production database
# This marks migrations as applied without running them

npx prisma migrate resolve --applied 20260113_add_file_ids
```

**Better approach**: Use Prisma's baseline feature in production.

---

## Option 2: Use db push for Production (QUICK FIX)

Since you're already using `db push` locally, keep using it:

**Update package.json:**

```json
{
  "scripts": {
    "build:production": "prisma db push --accept-data-loss && prisma generate && next build"
  }
}
```

**Pros**:

- Simple, works immediately
- No migration files needed
- Matches your current workflow

**Cons**:

- Not ideal for production (no migration history)
- Can't rollback schema changes

---

## Option 3: Properly Initialize Migrations (BEST LONG-TERM)

This is the "do it right" approach:

### Step 1: Create a baseline migration

```bash
# Generate a migration that represents your ENTIRE current schema
npx dotenv -e .env.local -- npx prisma migrate dev --name baseline_entire_schema --create-only
```

This creates: `prisma/migrations/TIMESTAMP_baseline_entire_schema/migration.sql`

### Step 2: Manually mark it as applied to production

You need to tell production "this migration is already applied":

**Add to vercel.json:**

```json
{
  "buildCommand": "npm run build:production:baseline"
}
```

**Add to package.json:**

```json
{
  "scripts": {
    "build:production": "prisma migrate deploy && prisma generate && next build",
    "build:production:baseline": "prisma migrate resolve --applied baseline_entire_schema && prisma migrate deploy && prisma generate && next build"
  }
}
```

**Then after ONE successful deployment, change back to:**

```json
{
  "buildCommand": "npm run build:production"
}
```

---

## IMMEDIATE FIX (Choose One):

### Quick Fix (Use db push):

```bash
# 1. Update package.json
# Change build:production to use db push

# 2. Commit and push
git add package.json
git commit -m "fix: use db push for production deployments"
git push origin main
```

### Proper Fix (Baseline migrations):

```bash
# 1. Remove the partial migration
rm -rf prisma/migrations/20260113_add_file_ids

# 2. Create a complete baseline
npx dotenv -e .env.local -- npx prisma migrate dev --name init

# 3. This creates a migration with ALL tables
# 4. Deploy will skip it for production (already exists)

# 5. Commit and push
git add prisma/migrations
git commit -m "chore: initialize migration history"
git push origin main
```

---

## My Recommendation: Quick Fix for Now

Since you need to deploy ASAP and you're already using `db push`:

1. Switch to `db push` for production (Option 2)
2. Plan to properly migrate later when you have time
3. Before implementing namespaces (Phase 1), switch to proper migrations

---

## Commands to Run Now:

```bash
# Update build command to use db push
# (I'll help you edit package.json)
```

Want me to implement the quick fix (Option 2)?
