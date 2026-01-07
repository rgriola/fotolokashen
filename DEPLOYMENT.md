# 🚀 Fotolokashen - Deployment & Admin Guide

**Last Updated:** January 7, 2026  
**Project:** Fotolokashen

---

## 📋 **Production Stack**

```
Frontend/Backend → Vercel (with Preview → Production workflow)
Database         → Vercel Postgres (Neon)
Email            → Resend
CDN/Images       → ImageKit ✅
DNS              → Cloudflare ✅
Monitoring       → Sentry ✅
```

**Cost:** $0/month (Free tiers cover MVP to ~10k users)

---

## 🔗 **Quick Links**

| Service | Dashboard | Docs |
|---------|-----------|------|
| **Vercel** | [dashboard](https://vercel.com/dashboard) | [docs](https://vercel.com/docs) |
| **Resend** | [overview](https://resend.com/overview) | [docs](https://resend.com/docs) |
| **ImageKit** | [dashboard](https://imagekit.io/dashboard) | [docs](https://docs.imagekit.io) |
| **Cloudflare** | [dashboard](https://dash.cloudflare.com) | [docs](https://developers.cloudflare.com) |
| **Sentry** | [dashboard](https://sentry.io) | [docs](https://docs.sentry.io) |
| **Neon** | [dashboard](https://neon.tech/dashboard) | [docs](https://neon.tech/docs) |
---

## 🚀 **Deployment Workflow**

### **Your Current Process:**

```
VERCEL ALWAYS PULLS FROM GITHUB

1. Push to GitHub
   ↓
2. npx vercel (preview deployment) -> promote to production
   ↓
3. Test preview deployment
   ↓
4. Promote to Production (if tests pass)

Alt Deployment Workflow:
```
1. Push to GitHub
   ↓
2. vervel --prod (direct to production)

```

### **Commands:**

```bash
# Deploy to preview
git push origin main

# Or manual preview deploy
npx vercel

# Promote preview to production (via Vercel dashboard)
# Dashboard → Deployments → Click preview → "Promote to Production"
```

---

## ⚙️ **Initial Setup** (One-Time)

### **Phase 1: Email Service** (5 min) ✅ Done

1. ✅ Sign up at [resend.com](https://resend.com). XXX
2. ✅ Add domain `fotolokashen.com`
3. ✅ Verify domain in Cloudflare DNS
4. ✅ Generate API key
5. ✅ Save for Vercel environment variables

**Email Receiving (Optional):**
1. Cloudflare Dashboard → Email → Enable "Email Routing"
2. Create `admin@fotolokashen.com` → Forward to personal Gmail

---

### **Phase 2: Database** (5 min) ✅ Done

**Using Vercel Postgres (Neon):**

1. Go to Vercel Project Dashboard
2. Click **Storage** tab → **Create Database** → **Postgres**
3. Choose Region (e.g., Washington, D.C.)
4. Click **Connect**
5. **Done!** Vercel auto-adds env vars:
   - `DATABASE_URL`

**No manual connection string needed!**

---

### **Phase 3: Environment Variables** (10 min)

Vercel automatically adds `DATABASE_URL` variable. You only need to add these manually:

#### **Required for Production:**

```bash
# JWT Secret (GENERATE NEW - don't reuse local!)
JWT_SECRET=<run: openssl rand -base64 48>

# Email (from Resend)
EMAIL_SERVICE=resend
EMAIL_API_KEY=re_xxxxxxxxxxxxxxxxxxxxx
EMAIL_FROM_ADDRESS=admin@fotolokashen.com
EMAIL_MODE=production

# App URL
NEXT_PUBLIC_APP_URL=https://fotolokashen.com
```

#### **Copy from Local `.env.local`:**

```bash
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=<from .env.local>
NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY=<from .env.local>
IMAGEKIT_PRIVATE_KEY=<from .env.local>
IMAGEKIT_URL_ENDPOINT=<from .env.local>
NEXT_PUBLIC_SENTRY_DSN=<from .env.local>
SENTRY_AUTH_TOKEN=<from .env.local>
NODE_ENV=production
```

**How to Add:**
1. Vercel Dashboard → Project → Settings → Environment Variables
2. Add each variable
3. Select environments: **Production**, **Preview**, **Development**

---

### **Phase 4: Custom Domain** (5 min) ✅ Done

1. ✅ Vercel Dashboard → Project → Settings → Domains
2. ✅ Add `fotolokashen.com` and `www.fotolokashen.com`
3. ✅ Add CNAME in Cloudflare DNS
4. ✅ Wait for SSL (auto-provisioned)


---

## 🧪 **Testing Checklist**

### **After Preview Deployment:**

- [ ] Preview URL loads correctly
- [ ] User can sign up
- [ ] Verification email sent (check Resend dashboard)
- [ ] User can log in
- [ ] Map loads with Google Maps
- [ ] Can save locations
- [ ] Can upload photos (ImageKit)
- [ ] Password reset works
- [ ] Check Sentry for errors
- [ ] Mobile responsive (test on phone)

### **After Production Promotion:**

- [ ] Custom domain loads (`fotolokashen.com`)
- [ ] SSL certificate valid (green padlock)
- [ ] All features work on production
- [ ] Check Sentry production environment
- [ ] Monitor Vercel Analytics
- [ ] Test social sharing (OG images)

---

## 👤 **Admin User Management**

### **1. Create an Admin User**

**Option A: Database Query (Recommended)**

```sql
-- PostgreSQL (Vercel Postgres)
UPDATE users 
SET "isAdmin" = true 
WHERE email = 'your@email.com';
```

**Option B: Prisma Studio**

```bash
# Run locally
npm run prisma:studio

# Or on Vercel Postgres
npx prisma studio --url="<DATABASE_URL>"
```

1. Open `users` table
2. Find your user
3. Set `isAdmin` to `true`
4. Save

---

### **2. Access Admin Dashboard**

1. **Log in** as admin user
2. Click **profile dropdown** (top right, avatar icon)
3. Click **"Admin"** (Shield icon)
4. Navigate to `/admin/users`

---

### **3. Admin Features**

**User Management:**
- ✅ View all users (paginated, 10 per page)
- ✅ Search by name, email, username
- ✅ Sort by name, email, created date
- ✅ Delete users (with confirmation)
- ✅ View user stats (locations, photos, saves)

**Delete User Process:**
1. Click trash icon on user row
2. Modal shows user details + deletion counts
3. Type **DELETE** (uppercase, case-sensitive)
4. Click "Delete User"
5. User + all data permanently removed:
   - Sessions (cascade)
   - Locations (cascade)
   - Photos (cascade + ImageKit CDN)
   - Saves (cascade)
   - Security logs (audit trail)

**Protections:**
- ❌ Cannot delete your own account
- ✅ Audit logging (security_logs table)
- ✅ Confirmation required

---

## 🔧 **Common Issues & Solutions**

### **Email Not Sending**

- ✅ Domain verified in Resend? (green checkmark)
- ✅ `EMAIL_FROM_ADDRESS` matches verified domain?
- ✅ `EMAIL_MODE=production` set?
- ✅ Check Resend logs in dashboard

### **Database Connection Failed**

- ✅ Vercel Postgres connected in Storage tab?
- ✅ `POSTGRES_PRISMA_URL` env var exists?
- ✅ Database not sleeping? (Neon free tier)

### **Build Fails on Vercel**

- ✅ All required env vars added?
- ✅ Check build logs in Vercel dashboard
- ✅ Local build works? (`npm run build`)
- ✅ TypeScript errors? (`npm run type-check`)

### **"Admin" Menu Not Showing**

- ✅ User's `isAdmin` field is `true` in database?
- ✅ Log out and log back in
- ✅ Clear browser cache
- ✅ Check session is valid

### **Photos Not Uploading**

- ✅ ImageKit env vars set correctly?
- ✅ `IMAGEKIT_PRIVATE_KEY` in Vercel?
- ✅ Check ImageKit dashboard for errors
- ✅ Check browser console for CORS errors

---

## 📊 **Monitoring & Analytics**

### **Vercel Analytics**

- Dashboard → Project → Analytics
- Monitor page views, performance, errors
- Free tier: 100k events/month

### **Sentry Error Tracking**

- [sentry.io](https://sentry.io) dashboard
- Monitor errors in real-time
- Set up alerts for critical errors
- Free tier: 5k events/month

### **Email Delivery (Resend)**

- [resend.com/overview](https://resend.com/overview)
- Monitor email delivery rates
- Check bounce/spam rates
- Free tier: 3k emails/month

### **ImageKit CDN**

- [imagekit.io/dashboard](https://imagekit.io/dashboard)
- Monitor bandwidth usage
- Check storage usage
- Free tier: 20GB bandwidth/month

---

## 💰 **Scaling & Costs**

### **Current Free Tier Limits:**

| Service | Free Limit | Typical Usage (1k users) |
|---------|------------|--------------------------|
| **Vercel** | 100GB bandwidth | ~10-20GB |
| **Vercel Postgres** | 256MB storage | ~50-100MB |
| **Resend** | 3k emails/month | ~500-1k emails |
| **ImageKit** | 20GB bandwidth | ~5-10GB |
| **Sentry** | 5k events/month | ~1-2k events |


### **When to Upgrade?**

| Metric | Upgrade Trigger | Cost |
|--------|-----------------|------|
| **Vercel** | >100GB bandwidth/mo | $20/mo (Pro) |
| **Vercel Postgres** | >256MB storage | $10/mo (Hobby) |
| **Resend** | >3k emails/mo | $20/mo |
| **ImageKit** | >20GB bandwidth/mo | $49/mo |

**Estimated breakpoint:** ~5-10k active users → ~$100/mo total

---

## 🔐 **Security Checklist**

### **Before Production:**

- [x] JWT_SECRET is unique (not from .env.local)
- [x] All API routes have auth middleware
- [x] CORS configured correctly
- [x] Rate limiting enabled
- [x] SQL injection prevention (Prisma)
- [x] XSS prevention (React escaping)
- [x] CSRF protection (SameSite cookies)
- [x] Secure headers (Next.js config)
- [x] HTTPS enforced (Vercel auto)
- [x] Environment variables not exposed

### **Ongoing:**

- [ ] Monitor Sentry for security errors 
- [ ] Review security_logs table weekly
- [ ] Update dependencies monthly (`npm audit`)
- [ ] Rotate JWT_SECRET quarterly 
- [ ] Review admin user list monthly

---

## 📝 **Deployment Checklist**

### **Pre-Deploy:**

- [ ] All tests passing (`npm test`)
- [ ] Build succeeds locally (`npm run build`)
- [ ] TypeScript checks pass (`npm run type-check`)
- [ ] Lint checks pass (`npm run lint`)
- [ ] Environment variables documented
- [ ] Database migrations ready (if any)

### **Deploy to Preview:**

```bash
git add .
git commit -m "feat: description of changes"
git push origin main
```

- [ ] Wait for Vercel preview deployment
- [ ] Click preview URL in GitHub PR or Vercel dashboard
- [ ] Run full testing checklist
- [ ] Check Sentry for preview errors

### **Promote to Production:**

1. Vercel Dashboard → Deployments
2. Find successful preview deployment
3. Click "⋯" menu → **"Promote to Production"**
4. Confirm promotion
5. Wait for production deployment (~30 seconds)
6. Test production URL
7. Monitor Sentry production environment

---

## 🎯 **Quick Commands Reference**

```bash
# Local development
npm run dev

# Build locally
npm run build

# Type checking
npm run type-check

# Linting
npm run lint

# Database
npm run prisma:studio          # Open Prisma Studio
npm run prisma:generate        # Generate Prisma Client
npm run prisma:migrate         # Run migrations

# Deploy to preview
npx vercel

# Deploy to production (use dashboard instead)
# Vercel Dashboard → Promote Preview → Production
```

---

## 📚 **Related Documentation**

- `00_SOCIAL_COLLABORATION_IMPLEMENTATION.md` - Social features roadmap
- `13_SECURITY_IMPLEMENTATION.md` - Security architecture
- `06_ICON_MANAGEMENT_GUIDE.md` - Icon system guide
- `.agent/workflows/deploy-to-production.md` - Deployment workflow

---

## 🆘 **Support**

### **Vercel Issues:**
- [Vercel Support](https://vercel.com/help)
- [Vercel Community](https://github.com/vercel/next.js/discussions)

### **Database Issues:**
- [Neon Docs](https://neon.tech/docs)
- [Prisma Docs](https://www.prisma.io/docs)

### **Email Issues:**
- [Resend Support](mailto:support@resend.com)
- [Resend Docs](https://resend.com/docs)

### **Other Services:**
- ImageKit: [support@imagekit.io](mailto:support@imagekit.io)
- Sentry: [Sentry Support](https://sentry.io/support)

---

## ✅ **You're Ready to Deploy!**

**Current Status:**
- ✅ Database: Vercel Postgres (Neon)
- ✅ Email: Resend
- ✅ CDN: ImageKit
- ✅ Monitoring: Sentry
- ✅ Domain: fotolokashen.com

**Next Steps:**
1. Push to GitHub → Auto-deploy to preview
2. Test preview deployment
3. Promote to production
4. Monitor Sentry for errors
5. Celebrate! 🎉


---

**Ready to deploy?** Push to GitHub and watch the magic happen! ✨
