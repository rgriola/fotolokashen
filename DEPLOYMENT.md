# 🚀 Fotolokashen - Deployment Guide

**Last Updated:** January 13, 2026  
**Project:** Fotolokashen  
**Status:** Production Ready ✅

---

## 📋 Production Stack

```
Frontend/Backend → Vercel (Preview → Production workflow)
Database         → Neon Postgres (via Vercel Storage)
Email            → Resend
CDN/Images       → ImageKit
DNS              → Cloudflare
Monitoring       → Sentry
```

**Monthly Cost:** $0 (Free tiers support ~10k users)

---

## 🔗 Quick Links

| Service | URL |
|---------|-----|
| **App** | [fotolokashen.com](https://fotolokashen.com) |
| **Vercel** | [Dashboard](https://vercel.com/dashboard) • [Docs](https://vercel.com/docs) |
| **Neon** | [Dashboard](https://neon.tech/dashboard) • [Docs](https://neon.tech/docs) |
| **ImageKit** | [Dashboard](https://imagekit.io/dashboard) • [Docs](https://docs.imagekit.io) |
| **Resend** | [Dashboard](https://resend.com/overview) • [Docs](https://resend.com/docs) |
| **Sentry** | [Dashboard](https://sentry.io) • [Docs](https://docs.sentry.io) |
| **Cloudflare** | [Dashboard](https://dash.cloudflare.com) • [Docs](https://developers.cloudflare.com) |

---

## 🚀 Daily Workflow

### Standard Deployment Process

```bash
# 1. Make changes locally, test with npm run dev

# 2. Push to GitHub (triggers automatic preview deployment)
git add .
git commit -m "feat: your changes"
git push origin main

# 3. Vercel auto-creates preview at merkelvision.com
# 4. Test preview (uses production database)
# 5. Promote to production via Vercel Dashboard
```

**Note:** Vercel always pulls from GitHub. There is no CLI deployment as of Jan 2026.

### Automatic Database Migrations ✨

**When you push schema changes, Vercel automatically:**

1. Detects migration files in `prisma/migrations/`
2. Runs `npm run build:production` (custom build command)
3. Applies migrations to production database
4. Generates Prisma Client
5. Builds your app

**No manual database updates needed!** Just commit your migrations and push.

**Build commands:**
- **Local:** `npm run build` (no migrations, for testing)
- **Vercel:** `npm run build:production` (with migrations)

Configured in `vercel.json`:
```json
{
  "buildCommand": "npm run build:production"
}
```

---

---

## ⚙️ Initial Setup (One-Time Only)

> **Status:** ✅ Completed for fotolokashen.com

### Environment Variables

Add these to Vercel Dashboard → Project → Settings → Environment Variables (select Production, Preview, Development):

```bash
# Security
JWT_SECRET=<generate with: openssl rand -base64 48>

# Email (Resend)
EMAIL_SERVICE=resend
EMAIL_API_KEY=re_xxxxxxxxxxxxxxxxxxxxx
EMAIL_FROM_ADDRESS=admin@fotolokashen.com
EMAIL_MODE=production

# Google Maps
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=<from .env.local>

# ImageKit CDN
NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY=<from .env.local>
IMAGEKIT_PRIVATE_KEY=<from .env.local>
IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/rgriola

# Sentry Error Tracking
NEXT_PUBLIC_SENTRY_DSN=<from .env.local>
SENTRY_AUTH_TOKEN=<from .env.local>

# App
NEXT_PUBLIC_APP_URL=https://fotolokashen.com
NODE_ENV=production
```

**Note:** `DATABASE_URL` is auto-added by Vercel Storage.

---

---

## 🗄️ Database Schema Changes

### Quick Reference

```bash
# For development/prototyping (fast, no migration files)
npm run db:push

# For production-bound changes (creates migration files)
npm run db:migrate -- --name descriptive_name

# Verify schema
npx prisma studio

# Regenerate Prisma Client if TypeScript errors
npx prisma generate
```

---

### Full Workflow: Dev → Production

**1. Update Schema**

Edit `prisma/schema.prisma`:

```prisma
model User {
  // ...existing fields...
  avatarFileId    String?  // NEW FIELD
  bannerFileId    String?  // NEW FIELD
}
```

**2. Apply to Development**

Choose one approach:

| Command | Use Case | Creates Migration File? |
|---------|----------|------------------------|
| `npm run db:push` | Quick prototyping, dev-only | ❌ No |
| `npm run db:migrate` | Production changes | ✅ Yes |

**3. Test Locally**

```bash
npm run dev
# Test your changes thoroughly
```

**4. Deploy to Production**

```bash
git add prisma/
git commit -m "feat: add new database fields"
git push origin main
```

Vercel **automatically** runs during build:

```bash
prisma migrate deploy  # Applies pending migrations to production DB
prisma generate        # Regenerates Prisma Client
next build            # Builds the app
```

✅ **Production database is automatically updated!**

**5. Verify Production**

Check via Prisma Studio or Vercel Dashboard → Storage → Query tab.

---

### Troubleshooting

**"Migration history out of sync"**

```bash
npm run db:migrate -- resolve --applied "0_init"
npm run db:migrate -- --name your_change
```

**"Prisma Client out of sync"** (TypeScript errors)

```bash
rm -rf node_modules/.prisma
npx prisma generate
# Then restart VS Code TypeScript server
```

**Dropping columns with data**

```bash
# Create migration without applying
npm run db:migrate -- --create-only --name remove_column

# Edit migration SQL file to handle data migration
# Then apply
npm run db:migrate
```

---

---

## 👤 Admin User Management

### Create Admin User

**Via Prisma Studio** (Recommended):

```bash
npm run prisma:studio
# Navigate to users table → Set isAdmin = true
```

**Via SQL Query**:

```sql
UPDATE users SET "isAdmin" = true WHERE email = 'your@email.com';
```

### Access Admin Dashboard

1. Log in as admin
2. Click profile dropdown (top right)
3. Click "Admin" (shield icon)
4. Access `/admin/users`

### Admin Capabilities

- View/search/sort all users
- Delete users (with confirmation)
- View user stats (locations, photos, saves)
- Automatic cleanup: sessions, locations, photos, saves, security logs

**Protections:**
- Cannot delete own account
- Requires typing "DELETE" to confirm
- All actions logged to security_logs

---

## 🔧 Common Issues

| Issue | Solution |
|-------|----------|
| **Email not sending** | Verify domain in Resend • Check `EMAIL_MODE=production` |
| **Database connection failed** | Check Vercel Storage connection • Verify `DATABASE_URL` |
| **Build fails** | Check build logs • Verify all env vars added • Run `npm run build` locally |
| **Admin menu not showing** | Set `isAdmin=true` in database • Log out/in • Clear cache |
| **Photos not uploading** | Check ImageKit env vars • Verify `IMAGEKIT_PRIVATE_KEY` |

---

## 📊 Monitoring

### Service Dashboards

- **Vercel**: Analytics, performance, errors (100k events/month free)
- **Sentry**: Real-time error tracking (5k events/month free)
- **Resend**: Email delivery rates (3k emails/month free)
- **ImageKit**: Bandwidth/storage usage (20GB bandwidth/month free)

---

## 💰 Scaling Costs

### Current Free Tier Usage

| Service | Free Limit | ~1k Users | Upgrade At | Cost |
|---------|------------|-----------|------------|------|
| Vercel | 100GB bandwidth | 10-20GB | >100GB/mo | $20/mo |
| Neon | 256MB storage | 50-100MB | >256MB | $10/mo |
| Resend | 3k emails | 500-1k | >3k/mo | $20/mo |
| ImageKit | 20GB bandwidth | 5-10GB | >20GB/mo | $49/mo |
| Sentry | 5k events | 1-2k | >5k/mo | Free |

**Estimated upgrade point:** ~5-10k active users = ~$100/mo total

---

## 🔐 Security Checklist

### Production Requirements

- [x] Unique JWT_SECRET (not from .env.local)
- [x] API routes protected with auth middleware
- [x] Rate limiting enabled
- [x] SQL injection prevention (Prisma ORM)
- [x] XSS prevention (React escaping)
- [x] HTTPS enforced (Vercel automatic)
- [x] Environment variables secured

### Ongoing Maintenance

- [ ] Monitor Sentry for errors weekly
- [ ] Review security_logs monthly
- [ ] Update dependencies (`npm audit`) monthly
- [ ] Rotate JWT_SECRET quarterly

---

## 📝 Deployment Checklist

### Pre-Deploy

- [ ] Tests passing (`npm test`)
- [ ] Build succeeds (`npm run build`)
- [ ] TypeScript valid (`npm run type-check`)
- [ ] Linting clean (`npm run lint`)
- [ ] Schema tested in dev (`npm run db:push`)
- [ ] Prisma Client updated (`npx prisma generate`)

### Deploy

```bash
git add .
git commit -m "feat: description"
git push origin main
# → Auto-deploys to preview at merkelvision.com
# → Test preview
# → Promote via Vercel Dashboard
```

---

## 🎯 Quick Commands

```bash
# Development
npm run dev                    # Start dev server
npm run build                  # Test production build locally
npm run type-check             # Check TypeScript
npm run lint                   # Run linter

# Database
npm run db:push                # Quick schema sync (dev only)
npm run db:migrate             # Create migration (production)
npm run prisma:studio          # Open database GUI
npx prisma generate            # Regenerate Prisma Client

# Deployment (Vercel only)
git push origin main           # Auto-deploy to preview
# Vercel runs: npm run build:production (includes migrations)
# Then promote via Vercel Dashboard → Deployments → Promote to Production
```

---

## 🆘 Support Resources

**Vercel**: [Support](https://vercel.com/help) • [Community](https://github.com/vercel/next.js/discussions)  
**Neon**: [Docs](https://neon.tech/docs) • [Discord](https://discord.gg/neon)  
**Prisma**: [Docs](https://www.prisma.io/docs) • [Discord](https://pris.ly/discord)  
**Resend**: [Docs](https://resend.com/docs) • [Support](mailto:support@resend.com)  
**ImageKit**: [Docs](https://docs.imagekit.io) • [Support](mailto:support@imagekit.io)  
**Sentry**: [Docs](https://docs.sentry.io) • [Support](https://sentry.io/support)

---

## ✅ Production Status

**Live:** https://fotolokashen.com  
**Preview:** https://merkelvision.com  
**Database:** Neon Postgres (via Vercel Storage)  
**CDN:** ImageKit  
**Email:** Resend  
**Monitoring:** Sentry

**Last Updated:** January 13, 2026  
**Status:** ✅ Production Ready

---

**Need help?** Check the support resources above or review the related docs:
- `IMAGEKIT_CLEANUP_IMPLEMENTATION.md` - Image orphan cleanup
- `docs/deployment/` - Detailed deployment guides
