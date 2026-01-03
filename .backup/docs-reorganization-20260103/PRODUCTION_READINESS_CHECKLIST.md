# 🚀 Production Readiness Checklist

**Date:** January 1, 2026  
**Domain:** merkelvision.com  
**Current Host:** Render  
**Target Host:** Vercel  

---

## ✅ Pre-Deployment Checklist

### 1. Environment Variables - Production

#### ✅ Already Configured (in .env.local)
- [x] `DATABASE_URL` - Neon PostgreSQL (production ready)
- [x] `JWT_SECRET` - Secure 256-bit key
- [x] `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` - All required APIs enabled
- [x] `NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY` - CDN configured
- [x] `IMAGEKIT_PRIVATE_KEY` - Server-side key
- [x] `IMAGEKIT_URL_ENDPOINT` - CDN endpoint
- [x] `EMAIL_SERVICE` - "resend"
- [x] `EMAIL_API_KEY` - Resend API key present
- [x] `EMAIL_FROM_ADDRESS` - rod@merkelvision.com
- [x] `EMAIL_FROM_NAME` - Merkel Vision
- [x] `NEXT_PUBLIC_SENTRY_DSN` - Error tracking configured

#### ⚠️ NEEDS UPDATE for Production
- [ x] `EMAIL_MODE` - **CHANGE FROM "development" TO "production"**
- [x ] `NEXT_PUBLIC_APP_URL` - **CHANGE FROM "http://localhost:3000" TO "https://merkelvision.com"**
- [x ] `EMAIL_FROM_ADDRESS` - Consider changing to "admin@merkelvision.com" (more professional)
- [x ] `NODE_ENV` - **SET TO "production"** (currently commented out)

#### 📋 For Vercel Environment Variables
Copy these to Vercel Dashboard → Your Project → Settings → Environment Variables:

```bash
# Critical - Must Update for Production
EMAIL_MODE=production
NEXT_PUBLIC_APP_URL=https://merkelvision.com
NODE_ENV=production

# Database (Vercel Postgres auto-adds these when you connect)
# POSTGRES_PRISMA_URL=<auto-added>
# POSTGRES_URL_NON_POOLING=<auto-added>
# Or use your Neon DB:
DATABASE_URL=postgresql://neondb_owner:npg_NleqRP7KmjQ0@ep-cool-star-a4dyxqi4-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require

# Security (GENERATE NEW FOR PRODUCTION!)
JWT_SECRET=<run: openssl rand -base64 48>

# Email (Resend)
EMAIL_SERVICE=resend
EMAIL_API_KEY=re_RdrdiRUi_CkQx4pPcrMVxvC71pvqng6u1
EMAIL_FROM_NAME=Merkel Vision
EMAIL_FROM_ADDRESS=admin@merkelvision.com

# Google Maps
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyCHQECnK2DXcNXIQR0ZfvIEPrAJWIH8JsM

# ImageKit CDN
NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY=public_O/9pxeXVXghCIZD8o8ySi04JvK4=
IMAGEKIT_PRIVATE_KEY=private_z98e1q+JMejEDabjjvzijXlKH84=
IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/rgriola

# Sentry Error Tracking
NEXT_PUBLIC_SENTRY_DSN=https://1e6219bd27e095b18fc73fec018da187@o4510596205838336.ingest.us.sentry.io/4510596233101312
```

---

### 2. Code Readiness

#### ✅ Completed Features
- [x] User authentication (register, login, logout)
- [x] Email verification system
- [x] Password reset functionality
- [x] Google Maps integration
- [x] Location saving/editing/deleting
- [x] Photo upload with GPS extraction
- [x] Image CDN (ImageKit)
- [x] Mobile responsive design
- [x] Error tracking (Sentry)
- [x] Database migrations

#### ✅ Security Features
- [x] Password hashing (bcryptjs)
- [x] JWT authentication
- [x] Email verification
- [x] HTTPS-only in production
- [x] Input validation (Zod)
- [x] SQL injection protection (Prisma)

#### ✅ Build Test
```bash
# Run this locally to verify production build works
npm run build
```
- [ ] Build completes without errors
- [ ] No TypeScript errors
- [ ] No ESLint errors

---

### 3. Database Readiness

#### Current Setup
- **Provider:** Neon PostgreSQL
- **Connection:** Pooled connection string
- **SSL:** Required (sslmode=require)
- **Branch:** Production branch at ep-cool-star-a4dyxqi4

#### ✅ Checklist
- [x] Production database exists
- [x] Connection string secured
- [ ] Run migrations on production DB:
  ```bash
  # Make sure DATABASE_URL points to production
  npx prisma migrate deploy
  ```
- [ ] Verify tables exist:
  ```bash
  npx prisma studio
  ```

---

### 4. Email Readiness (Resend)

#### Current Status
- **Service:** Resend
- **API Key:** Present (re_RdrdiRUi_CkQx4pPcrMVxvC71pvqng6u1)
- **From Address:** rod@merkelvision.com
- **Domain:** merkelvision.com

#### ✅ Resend Dashboard Checklist
1. [ ] Login to https://resend.com/overview
2. [ ] Verify domain "merkelvision.com" shows **green checkmark**
3. [ ] Verify DNS records in Cloudflare:
   - `resend._domainkey.merkelvision.com` (CNAME)
   - `merkelvision.com` TXT record with Resend verification
4. [ ] Test send email from Resend dashboard
5. [ ] Check email delivery logs

#### ⚠️ Action Required
- [ ] **Change `EMAIL_MODE` to "production"** in Vercel environment variables
- [ ] Consider using "admin@merkelvision.com" instead of "rod@" for professionalism

---

### 5. Domain & DNS Configuration

#### Current DNS Setup (Cloudflare)
**Domain:** merkelvision.com  
**Current Pointing:** Render (old deployment)  
**Target:** Vercel (new deployment)

#### 🔄 DNS Migration Steps

##### Step 1: Prepare Vercel
1. [ ] Deploy to Vercel first (get deployment URL)
2. [ ] Test at Vercel URL (e.g., `merkel-vision.vercel.app`)
3. [ ] Verify all features work at Vercel URL

##### Step 2: Add Domain in Vercel
1. [ ] Go to Vercel Dashboard → Your Project → Settings → Domains
2. [ ] Click "Add Domain"
3. [ ] Enter "merkelvision.com"
4. [ ] Also add "www.merkelvision.com"
5. [ ] Vercel will show DNS instructions

##### Step 3: Update Cloudflare DNS
**⚠️ Do this AFTER Vercel is ready and tested!**

1. [ ] Login to Cloudflare Dashboard
2. [ ] Select "merkelvision.com" domain
3. [ ] Go to DNS → Records

**Current Records (Render):**
```
Type  Name  Content                         Proxy
A     @     <render-ip-address>            Proxied
CNAME www   merkelvision.com               Proxied
```

**New Records (Vercel):**
```
Type  Name  Content                         Proxy
A     @     76.76.21.21                    Proxied (Vercel's IP)
CNAME www   cname.vercel-dns.com           Proxied
```

**Or (Recommended - Dynamic):**
```
Type  Name  Content                         Proxy
CNAME @     cname.vercel-dns.com           Proxied
CNAME www   cname.vercel-dns.com           Proxied
```

4. [ ] **Delete old Render DNS records**
5. [ ] **Add new Vercel DNS records** (from Vercel dashboard)
6. [ ] Keep Proxy Status as "Proxied" (orange cloud) for DDoS protection
7. [ ] Keep all Resend email DNS records (don't delete these!)

##### Step 4: Verify SSL
1. [ ] Wait 5-10 minutes for DNS propagation
2. [ ] Visit https://merkelvision.com
3. [ ] Check for valid SSL certificate (lock icon in browser)
4. [ ] Vercel auto-provisions SSL via Let's Encrypt

##### Step 5: Test Production
1. [ ] Test user registration
2. [ ] Check if verification email arrives (from admin@merkelvision.com)
3. [ ] Test login
4. [ ] Test Google Maps
5. [ ] Test location saving
6. [ ] Test photo upload
7. [ ] Test password reset

---

### 6. Monitoring & Analytics

#### ✅ Sentry (Error Tracking)
- [x] DSN configured
- [ ] Verify errors appear in Sentry dashboard
- [ ] Set up email alerts for critical errors

#### Vercel Analytics (Built-in)
- [ ] Enable in Vercel Dashboard → Analytics
- [ ] Free tier: Core Web Vitals tracking

---

## 🚨 Pre-Migration Safety Steps

### Backup Current Data
```bash
# Export production database from Neon
# (Neon has automatic backups, but good to have local copy)
pg_dump <DATABASE_URL> > backup_$(date +%Y%m%d).sql
```

### Test Local Build
```bash
# Ensure production build works locally
npm run build
npm run start

# Visit http://localhost:3000
# Test critical features
```

### Gradual Migration Strategy
1. **Deploy to Vercel** (test at vercel.app subdomain)
2. **Test thoroughly** at Vercel URL
3. **Update DNS** (point to Vercel)
4. **Monitor errors** in Sentry
5. **Keep Render running** for 24-48 hours (rollback option)
6. **Shut down Render** after confirming stability

---

## 📋 DNS Migration Detailed Steps

### Before Migration
- [ ] Current site at merkelvision.com is working on Render
- [ ] New site deployed to Vercel (different URL)
- [ ] Both are tested and working

### During Migration (5-10 minutes downtime)
1. [ ] **8:00 AM** - Change Cloudflare DNS to point to Vercel
2. [ ] **8:05 AM** - DNS propagates (some users see old, some see new)
3. [ ] **8:10 AM** - Most users on new Vercel deployment
4. [ ] **8:30 AM** - All users on Vercel (DNS fully propagated)

### After Migration
- [ ] Monitor Sentry for errors
- [ ] Check Vercel Analytics for traffic
- [ ] Test all critical features
- [ ] Keep Render active for 48 hours (rollback option)
- [ ] After 48 hours: Shut down Render to save costs

---

## 🎯 Quick DNS Change Reference

### Current (Render)
```
merkelvision.com → Render IP
```

### New (Vercel)
```
merkelvision.com → cname.vercel-dns.com
www.merkelvision.com → cname.vercel-dns.com
```

### Cloudflare Dashboard Steps
1. DNS → Records
2. Edit "A" record for "@" (root domain)
   - Change to: CNAME → cname.vercel-dns.com
3. Edit "CNAME" record for "www"
   - Change to: CNAME → cname.vercel-dns.com
4. Save
5. Wait 5-10 minutes

---

## ✅ Final Pre-Launch Checklist

### Environment
- [ ] `EMAIL_MODE=production` set in Vercel
- [ ] `NEXT_PUBLIC_APP_URL=https://merkelvision.com` in Vercel
- [ ] All environment variables added to Vercel
- [ ] Production JWT_SECRET generated (different from local!)

### Testing
- [ ] Build succeeds locally (`npm run build`)
- [ ] Build succeeds on Vercel
- [ ] Site works at Vercel preview URL
- [ ] Registration works
- [ ] Email sends (check Resend logs)
- [ ] Login works
- [ ] Map loads
- [ ] Location features work

### DNS
- [ ] Domain added in Vercel
- [ ] Cloudflare DNS records updated
- [ ] SSL certificate issued (https works)
- [ ] www redirects to non-www (or vice versa)

### Monitoring
- [ ] Sentry receiving errors
- [ ] Vercel Analytics enabled
- [ ] Email alerts configured

---

## 🚀 Migration Day Timeline

### T-minus 1 day
- [ ] Complete all checklist items above
- [ ] Test Vercel deployment thoroughly
- [ ] Notify users of potential brief downtime (optional)

### T-minus 1 hour
- [ ] Final test of Vercel deployment
- [ ] Backup production database
- [ ] Have rollback plan ready (Render DNS records saved)

### T = 0 (Migration Start)
- [ ] Update Cloudflare DNS records
- [ ] Monitor DNS propagation: `dig merkelvision.com`
- [ ] Watch Vercel Analytics for incoming traffic
- [ ] Monitor Sentry for errors

### T + 30 minutes
- [ ] Verify HTTPS works
- [ ] Test all critical features
- [ ] Check email sending
- [ ] Monitor error rates

### T + 2 hours
- [ ] Confirm traffic stable
- [ ] All features working
- [ ] No critical errors

### T + 48 hours
- [ ] Shut down Render deployment
- [ ] Remove Render from billing
- [ ] Celebrate! 🎉

---

## 📞 Emergency Rollback

If something goes wrong:

1. **Immediate:** Change Cloudflare DNS back to Render
2. **Investigate:** Check Vercel logs, Sentry errors
3. **Fix:** Resolve issues on Vercel
4. **Retry:** Try migration again when ready

**Rollback Time:** 5-10 minutes (DNS propagation)

---

## 📊 Current Status Summary

### ✅ Ready
- Code is production-ready
- Database is configured (Neon PostgreSQL)
- Email service ready (Resend)
- CDN configured (ImageKit)
- Error tracking ready (Sentry)
- SSL/Domain setup (Cloudflare)

### ⚠️ Needs Action
1. **Change `EMAIL_MODE` to "production"** in .env.local (for Vercel)
2. **Change `NEXT_PUBLIC_APP_URL` to "https://merkelvision.com"**
3. **Deploy to Vercel** and test
4. **Update Cloudflare DNS** to point to Vercel
5. **Test production site**

### Estimated Time to Go Live
**1-2 hours** (mostly waiting for DNS propagation)

---

**Ready to proceed?** Start with deploying to Vercel and testing at the preview URL! 🚀
