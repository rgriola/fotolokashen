---
description: Deploy to Vercel + Neon production environment
---

# 🚀 Production Deployment Guide: Vercel + Neon + Resend

This guide will walk you through deploying your fotolokashen location discovery platform to production.

## 📋 Prerequisites Checklist

- [ ] GitHub repository with latest code pushed
- [ ] Cloudflare account (for DNS)
- [ ] Credit card for service sign-ups (most have generous free tiers)

---

## Phase 1: Email Setup (Resend)

### 1.1 Create Resend Account
1. Go to https://resend.com
2. Sign up with GitHub (easiest)
3. Verify your email address

### 1.2 Add & Verify Your Domain
1. In Resend dashboard, go to **Domains**
2. Click **Add Domain**
3. Enter your domain (e.g., `yourdomain.com`)
4. Add the DNS records to **Cloudflare**:
   - Go to your Cloudflare dashboard
   - Select your domain
   - Go to **DNS** → **Records**
   - Add the SPF, DKIM, and DMARC records provided by Resend
   - Wait 5-10 minutes for DNS propagation
5. In Resend, click **Verify** - should turn green ✅

### 1.3 Generate API Key
1. In Resend dashboard, go to **API Keys**
2. Click **Create API Key**
3. Name it: `Production - fotolokashen`
4. Select **Full Access** (or **Sending access** only)
5. **COPY THE KEY** - you'll need this for Vercel
6. Format: `re_xxxxxxxxxxxxxxxxxxxxx`

### 1.4 Test Email (Optional)
```bash
curl -X POST 'https://api.resend.com/emails' \
  -H 'Authorization: Bearer YOUR_API_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "from": "noreply@yourdomain.com",
    "to": "your-email@example.com",
    "subject": "Test Email",
    "html": "<p>Hello from Resend!</p>"
  }'
```

**Environment Variables Needed:**
```bash
EMAIL_SERVICE="resend"
EMAIL_API_KEY="re_xxxxxxxxxxxxxxxxxxxxx"  # Your Resend API key
EMAIL_FROM_ADDRESS="noreply@yourdomain.com"  # Must match verified domain
EMAIL_FROM_NAME="fotolokashen"
```

---

## Phase 2: Database Setup (Neon)

### 2.1 Create Neon Account
1. Go to https://neon.tech
2. Sign up with GitHub (recommended)
3. Choose the **Free** plan (FREE - 0.5GB storage, 3GB data transfer)

### 2.2 Create Database
1. Click **Create Project**
2. Project name: `fotolokashen` (or your preferred name)
3. Region: Choose closest to your users (e.g., `US East (Ohio)` or `US West (Oregon)`)
4. PostgreSQL version: 16 (latest)
5. Click **Create Project**

### 2.3 Database Branches
Neon automatically creates a `main` branch for production. You can create additional branches for development:
- `main` - Production database
- `dev` - Development/testing (optional)
- Feature branches - For schema testing (optional)

### 2.4 Get Connection String
1. In your Neon project dashboard, find the **Connection Details**
2. Select **Prisma** connection string format
3. Copy the connection string - it looks like:
   ```
   postgresql://username:password@ep-cool-star-a4dyxqi4.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
4. **IMPORTANT**: Save this securely - it contains credentials!

### 2.5 Set Up Production Database

#### Option A: Push Schema with Prisma (Recommended)
```bash
# 1. Update DATABASE_URL in .env.production.local (create if needed)
DATABASE_URL="postgresql://user:pass@ep-xxx.region.aws.neon.tech/neondb?sslmode=require"

# 2. Push your Prisma schema to Neon
npx prisma db push

# 3. (Optional) Seed with initial data
npm run db:seed
```

#### Option B: Run Migrations (if you have migration files)
```bash
# 1. Update DATABASE_URL
DATABASE_URL="postgresql://user:pass@ep-xxx.region.aws.neon.tech/neondb?sslmode=require"

# 2. Run migrations
npx prisma migrate deploy
```

### 2.6 Enable Connection Pooling (Important for Production)
1. In Neon dashboard, go to your project
2. Click on **Connection pooling**
3. Enable pooling for better performance
4. You'll get a pooled connection string ending in `/neondb?sslmode=require&pgbouncer=true`
5. Use the pooled connection for production

**Environment Variable Needed:**
```bash
DATABASE_URL="postgresql://user:pass@ep-xxx.region.aws.neon.tech/neondb?sslmode=require&pgbouncer=true"
```

---

## Phase 3: Vercel Deployment

### 3.1 Create Vercel Account
1. Go to https://vercel.com
2. Sign up with GitHub (MUST use same account as your repo)
3. Skip any onboarding wizards

### 3.2 Import Project
1. Click **Add New...** → **Project**
2. Find your `fotolokashen` repository
3. Click **Import**

### 3.3 Configure Build Settings
Vercel should auto-detect Next.js. Verify:
- **Framework Preset**: Next.js
- **Root Directory**: `./` (leave default)
- **Build Command**: `next build` (auto-detected)
- **Output Directory**: `.next` (auto-detected)
- **Install Command**: `npm install` (auto-detected)

### 3.4 Add Environment Variables
Click **Environment Variables** and add ALL of these:

```bash
# Node Environment
NODE_ENV=production

# Database (from Neon - Step 2.4)
DATABASE_URL=postgresql://user:pass@ep-xxx.region.aws.neon.tech/neondb?sslmode=require&pgbouncer=true

# JWT Secret (GENERATE A NEW ONE FOR PRODUCTION!)
JWT_SECRET=<GENERATE_NEW_SECRET_SEE_BELOW>

# Google Maps API Key
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=YOUR_GOOGLE_MAPS_KEY

# ImageKit
NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY=YOUR_IMAGEKIT_PUBLIC_KEY
IMAGEKIT_PRIVATE_KEY=YOUR_IMAGEKIT_PRIVATE_KEY
IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/YOUR_ID

# Email (from Resend - Step 1.3)
EMAIL_SERVICE=resend
EMAIL_API_KEY=re_xxxxxxxxxxxxxxxxxxxxx
EMAIL_FROM_ADDRESS=noreply@yourdomain.com
EMAIL_FROM_NAME=fotolokashen

# Application URL (will update after first deploy)
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app

# Sentry (optional - for error tracking)
NEXT_PUBLIC_SENTRY_DSN=YOUR_SENTRY_DSN
```

#### 🔐 Generate New JWT Secret for Production:
```bash
# Run this in your terminal:
openssl rand -base64 48
```
Copy the output and use it as `JWT_SECRET`

### 3.5 Deploy!
1. Click **Deploy**
2. Wait 2-3 minutes for build
3. You'll get a URL like: `https://fotolokashen.vercel.app`

### 3.6 Test Your Deployment
1. Visit your Vercel URL
2. Test authentication (sign up/login)
3. Test map features
4. Check that emails are sent (via Resend)
5. Check Sentry for any errors

---

## Phase 4: Custom Domain Setup (Cloudflare DNS)

### 4.1 Add Domain to Vercel
1. In Vercel dashboard, select your project
2. Go to **Settings** → **Domains**
3. Add your domain (e.g., `app.yourdomain.com`)
4. Vercel will provide DNS records

### 4.2 Configure Cloudflare DNS
1. Go to Cloudflare dashboard
2. Select your domain
3. Go to **DNS** → **Records**
4. Add the CNAME record Vercel provided:
   ```
   Type: CNAME
   Name: app (or @, or www)
   Target: cname.vercel-dns.com
   Proxy status: Proxied (orange cloud)
   ```
5. Wait 5-10 minutes for DNS propagation

### 4.3 Update Environment Variable
1. In Vercel, go to **Settings** → **Environment Variables**
2. Update `NEXT_PUBLIC_APP_URL` to your custom domain:
   ```
   NEXT_PUBLIC_APP_URL=https://app.yourdomain.com
   ```
3. Click **Save**
4. Redeploy (Settings → Deployments → Click ⋯ → Redeploy)

### 4.4 Enable Automatic HTTPS
- Vercel + Cloudflare will automatically provision SSL certificates
- Your site will be HTTPS within 5-10 minutes

---

## Phase 5: Verify Email Configuration

### 5.1 Email Service Setup
Fotolokashen uses Resend for email delivery. Your codebase is already configured:

**Production**: Uses Resend API (configured in Phase 1)
**Development**: Logs emails to console (no external service needed)

#### Verify your email utility (`src/lib/email.ts`):

```typescript
import { Resend } from 'resend';

// Initialize Resend
const resend = process.env.EMAIL_API_KEY 
  ? new Resend(process.env.EMAIL_API_KEY) 
  : null;

export async function sendEmail(options: {
  to: string;
  subject: string;
  html: string;
}) {
  if (process.env.NODE_ENV === 'production' && resend) {
    // Production: Use Resend
    return await resend.emails.send({
      from: `${process.env.EMAIL_FROM_NAME} <${process.env.EMAIL_FROM_ADDRESS}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
    });
  } else {
    // Development: Log to console
    console.log('📧 Email (Development Mode):', {
      to: options.to,
      subject: options.subject,
      preview: options.html.substring(0, 100) + '...',
    });
  }
}
```

### 5.2 Environment Variables
Your `.env.local` (development):
```bash
NODE_ENV=development
EMAIL_FROM_ADDRESS=noreply@fotolokashen.com
EMAIL_FROM_NAME=fotolokashen
# No EMAIL_API_KEY needed - uses console logging
```

Your Vercel production environment variables (already set in Phase 3.4):
```bash
NODE_ENV=production
EMAIL_API_KEY=re_xxxxxxxxxxxxxxxxxxxxx
EMAIL_FROM_ADDRESS=noreply@yourdomain.com
EMAIL_FROM_NAME=fotolokashen
```

---

## Phase 6: Post-Deployment Checklist

### 6.1 Monitoring Setup
- [ ] Check Vercel dashboard for build errors
- [ ] Review Vercel Analytics (auto-enabled)
- [ ] Check Sentry dashboard for runtime errors
- [ ] Monitor Neon Metrics for database performance and slow queries

### 6.2 Performance Optimization
- [ ] Enable Vercel Speed Insights (free)
- [ ] Review Lighthouse scores
- [ ] Check Core Web Vitals in Vercel dashboard
- [ ] Test from different locations (use https://webpagetest.org)

### 6.3 Security
- [ ] Review Vercel Firewall settings
- [ ] Enable Neon IP Allow lists (if needed for additional security)
- [ ] Check Cloudflare security settings
- [ ] Verify HTTPS is working
- [ ] Test authentication flows

### 6.4 Backup Strategy
- [ ] Neon automatically backs up your database (point-in-time recovery available)
- [ ] Export manual backup: `pg_dump DATABASE_URL > backup.sql`
- [ ] Set up branch-based backups for critical changes
- [ ] Free tier: 7 days of backup history
- [ ] Paid plans: 30 days of backup history + point-in-time recovery

---

## 📊 Cost Breakdown (Estimated)

| Service | Plan | Cost | Limits |
|---------|------|------|--------|
| **Vercel** | Hobby | $0 | Unlimited deployments, 100GB bandwidth |
| **Neon** | Free | $0 | 0.5GB storage, 3GB data transfer/month |
| **Resend** | Free | $0 | 3,000 emails/month, 100/day |
| **Cloudflare** | Free | $0 | Unlimited bandwidth |
| **ImageKit** | Free | $0 | 20GB bandwidth, 20GB storage |
| **Sentry** | Free | $0 | 5K errors/month |
| **TOTAL** | | **$0/month** | Great for MVP/startup! |

### When You'll Need to Upgrade:
- **Vercel Pro ($20/mo)**: Custom domains, analytics, more team members
- **Neon Pro ($19/mo)**: 10GB storage, unlimited compute hours, more data transfer
- **Resend Email ($20/mo)**: 50k emails/month
- **Total at scale**: ~$60-80/month for serious traffic

---

## 🚨 Troubleshooting

### Build Fails on Vercel
```bash
# Check build logs in Vercel dashboard
# Common issues:
# 1. Missing environment variables
# 2. TypeScript errors
# 3. Database connection issues (use Vercel preview DB_URL)
```

### Database Connection Errors
```bash
# Ensure Neon connection string is correct
# Check SSL settings: ?sslmode=require
# Verify compute endpoint is running (auto-suspends after 5 min inactivity on free tier)
# Enable connection pooling: &pgbouncer=true
# Check Neon dashboard for compute status
```

### Emails Not Sending
```bash
# Verify Resend domain is verified (green checkmark)
# Check EMAIL_FROM_ADDRESS matches verified domain
# Review Resend logs in dashboard
```

### Custom Domain Not Working
```bash
# DNS propagation can take up to 48 hours (usually 5-10 min)
# Check DNS with: dig app.yourdomain.com
# Verify Cloudflare proxy is enabled (orange cloud)
```

---

## 🎯 Next Steps After Deployment

1. **Set up continuous deployment**: Every push to `main` auto-deploys
2. **Create preview environments**: Use Vercel preview deployments for PRs
3. **Database branching**: Use Neon branches for schema testing and development
4. **Monitoring alerts**: Set up Sentry alerts for critical errors
5. **Performance monitoring**: Review Vercel Analytics and Neon Metrics weekly
6. **Configure autoscaling**: Set compute autoscaling limits in Neon dashboard

---

## 📚 Useful Links

- [Vercel Dashboard](https://vercel.com/dashboard)
- [Neon Console](https://console.neon.tech)
- [Resend Dashboard](https://resend.com/overview)
- [Cloudflare Dashboard](https://dash.cloudflare.com)
- [Vercel Docs](https://vercel.com/docs)
- [Neon Docs](https://neon.tech/docs)
- [Resend Docs](https://resend.com/docs)
- [Prisma with Neon Guide](https://neon.tech/docs/guides/prisma)

---

**Good luck with your deployment!** 🚀

If you run into issues, check the troubleshooting section or reach out for help.
