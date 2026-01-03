# 🚀 Quick Deployment Reference

## TL;DR - Production Stack

```
Frontend/Backend → Vercel
Database        → PlanetScale  
Email           → Resend
CDN/Images      → ImageKit (already setup ✅)
DNS             → Cloudflare (already setup ✅)
Monitoring      → Sentry (already setup ✅)
```

## Cost: $0/month (Free tiers cover MVP to ~10k users)

---

## Quick Links

| Service | Dashboard | Docs |
|---------|-----------|------|
| **Vercel** | [dashboard](https://vercel.com/dashboard) | [docs](https://vercel.com/docs) |
| **PlanetScale** | [app](https://app.planetscale.com) | [docs](https://planetscale.com/docs) |
| **Resend** | [overview](https://resend.com/overview) | [docs](https://resend.com/docs) |

---

## Deployment Order (30 minutes total)

### Phase 1: Email (5 min)
1. Sign up at resend.com - done RG
2. Add + verify domain in Cloudflare - done RG
3. Generate API key - done RG
4. Save for Vercel setup - done 

### Phase 1.5: Email Receiving (Free)
1. Go to Cloudflare Dashboard > Email
2. Enable "Email Routing"
3. Create custom address `admin@merkelvision.com`
4. Forward it to your personal Gmail (so you can read incoming mail)

### Phase 2: Database (10 min) - UPDATE Jan 1 - USING POSTGRESQL ON NEON INSTEAD
*Note: PlanetScale no longer has a free tier ($39/mo). Alternatives: Railway (MySQL), TiDB (MySQL free tier), or Vercel Postgres (requires schema change).*

1. Sign up at planetscale.com (or alternative)
2. Create database: `google-search-me`
3. Get connection string
### Phase 2: Database (5 min) - Vercel Postgres ⚡️
1. Go to your Vercel Project Dashboard
2. Click **Storage** tab -> **Create Database** -> Select **Postgres**
3. Choose Region (e.g., Washington, D.C. - same as your functions)
4. Click **Connect**
5. **Done!** Vercel automatically adds the env vars (`POSTGRES_PRISMA_URL`, etc.) to your project.

### Phase 3: Deploy App (10 min)
1. Link GitHub to Vercel
2. Project Settings -> Environment Variables
3. Add the *missing* ones (see below)
4. Deploy!

### Phase 4: Custom Domain (5 min)
1. Add domain in Vercel
2. Add CNAME in Cloudflare
3. Wait for SSL (auto)

---

## Environment Variables (Copy-Paste for Vercel)

**Note:** Vercel automatically adds all `POSTGRES_*` variables when you connect the database. You only need to add these:

### 🆕 New for Production:
```bash
# JWT Secret (GENERATE NEW - don't reuse local!)
JWT_SECRET=<run: openssl rand -base64 48>

# Email (from Resend)
EMAIL_SERVICE=resend
EMAIL_API_KEY=re_xxxxxxxxxxxxxxxxxxxxx
EMAIL_FROM_ADDRESS=admin@merkelvision.com
EMAIL_MODE=production

# App URL
NEXT_PUBLIC_APP_URL=https://merkelvision.com
```

### ✅ Same as Local:
```bash
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=<from .env.local>
NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY=<from .env.local>
IMAGEKIT_PRIVATE_KEY=<from .env.local>
IMAGEKIT_URL_ENDPOINT=<from .env.local>
NEXT_PUBLIC_SENTRY_DSN=<from .env.local>
NODE_ENV=production
```

---

## Common Issues & Solutions

### "Email not sending"
- ✅ Domain verified in Resend? (green checkmark)
- ✅ `EMAIL_FROM_ADDRESS` matches verified domain?
- ✅ Check Resend logs in dashboard

### "Database connection failed"
- ✅ Connection string has `?sslaccept=strict`?
- ✅ Branch is `main` (not sleeping)?
- ✅ Copied from PlanetScale dashboard "Connect" tab?

### "Build fails on Vercel"
- ✅ All required env vars added?
- ✅ Check build logs in Vercel dashboard
- ✅ Local build works? (`npm run build`)

---

## Testing Checklist (After Deploy)

- [x] Site loads at Vercel URL
- [x] User can sign up
- [x] Verification email sent (check Resend)
- [x] User can login
- [x] Map loads correctly
- [x] Can save locations
- [ ] Password reset works
- [x] Check Sentry for errors
- [x] Custom domain working (merkelvision.com)
- [ ] Sentry source maps enabled (see SENTRY_SOURCE_MAPS_SETUP.md)

---

## Scaling & Costs

### When to Upgrade?

| Metric | Free Tier Limit | When to Upgrade | Cost |
|--------|-----------------|-----------------|------|
| **Vercel** | 100GB bandwidth | >100GB/mo | $20/mo (Pro) |
| **PlanetScale** | 1B row reads | >1B reads/mo | $39/mo (Scaler) |
| **Resend** | 3k emails/mo | >3k emails/mo | $20/mo |
| **ImageKit** | 20GB | >20GB/mo | $0-49/mo |

**Typical breakpoint:** ~5-10k active users → ~$80-100/mo total

---

## Support

- **Deployment guide**: `.agent/workflows/deploy-to-production.md`
- **Email changes**: `EMAIL_SERVICE_UPDATE.md`
- **Vercel support**: https://vercel.com/help
- **PlanetScale support**: https://support.planetscale.com
- **Resend support**: support@resend.com

---

Ready to deploy? Run: **`/deploy-to-production`** 🚀
