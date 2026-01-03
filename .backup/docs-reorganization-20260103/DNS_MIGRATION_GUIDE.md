# 🔄 DNS Migration: Render → Vercel

**Quick Reference Guide**

---

## Current State
- **Domain:** merkelvision.com
- **Current Host:** Render
- **Target Host:** Vercel
- **DNS Provider:** Cloudflare

---

## Pre-Migration Commands

### 1. Generate Production JWT Secret
```bash
openssl rand -base64 48
```
Copy output to Vercel environment variables as `JWT_SECRET`

### 2. Test Local Production Build
```bash
npm run build
npm run start
# Visit http://localhost:3000 and test
```

### 3. Check Current DNS Records
```bash
# See what merkelvision.com currently points to
dig merkelvision.com +short

# Check DNS propagation
nslookup merkelvision.com
```

---

## Vercel Deployment

### 1. Deploy to Vercel
```bash
# Option A: Use Vercel CLI
npm i -g vercel
vercel login
vercel --prod

# Option B: Connect GitHub repo in Vercel Dashboard
# Go to: https://vercel.com/new
# Import your GitHub repository
# Vercel will auto-deploy on push to main branch
```

### 2. Add Environment Variables in Vercel
Go to: **Vercel Dashboard → Your Project → Settings → Environment Variables**

**Critical Variables to Add:**
```
EMAIL_MODE=production
NEXT_PUBLIC_APP_URL=https://merkelvision.com
NODE_ENV=production
JWT_SECRET=<your-new-secret-from-step-1>
```

**Copy from .env.local:**
```
DATABASE_URL
EMAIL_SERVICE
EMAIL_API_KEY
EMAIL_FROM_NAME
EMAIL_FROM_ADDRESS
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY
IMAGEKIT_PRIVATE_KEY
IMAGEKIT_URL_ENDPOINT
NEXT_PUBLIC_SENTRY_DSN
```

### 3. Test Vercel Deployment
Your site will be available at: `https://merkel-vision-refactor.vercel.app` (or similar)

**Test Checklist:**
- [ ] Homepage loads
- [ ] User registration works
- [ ] Verification email sends (check Resend dashboard)
- [ ] Login works
- [ ] Google Maps loads
- [ ] Location saving works
- [ ] Photo upload works

---

## DNS Migration Steps

### Step 1: Add Domain in Vercel
1. Go to **Vercel Dashboard → Your Project → Settings → Domains**
2. Click **"Add Domain"**
3. Enter `merkelvision.com`
4. Vercel will show DNS instructions (usually CNAME records)

### Step 2: Current Render DNS Records (to be replaced)
**Before changing anything, document current records:**

Login to Cloudflare → Select "merkelvision.com" → DNS → Records

Current records probably look like:
```
Type  Name  Content                           TTL    Proxy
A     @     <render-ip-like-216.24.57.x>     Auto   Proxied
CNAME www   merkelvision.com                 Auto   Proxied
```

**⚠️ Also check for these (keep them!):**
```
# Email records from Resend - DO NOT DELETE
TXT   @     v=spf1 include:_spf.resend.com
CNAME resend._domainkey  <resend-value>
```

### Step 3: Update to Vercel DNS Records
**Replace Render records with Vercel records:**

**Option A: CNAME (Recommended)**
```
Type  Name  Content                  TTL    Proxy Status
CNAME @     cname.vercel-dns.com    Auto   Proxied (Orange)
CNAME www   cname.vercel-dns.com    Auto   Proxied (Orange)
```

**Option B: A Record (Alternative)**
```
Type  Name  Content        TTL    Proxy Status
A     @     76.76.21.21   Auto   Proxied (Orange)
CNAME www   merkelvision.com    Auto   Proxied (Orange)
```

**Exact steps in Cloudflare:**
1. Click "Edit" on the **A** record for **@**
2. Change **Type** to **CNAME**
3. Change **Content** to **cname.vercel-dns.com**
4. Keep **Proxy status** as **Proxied** (orange cloud)
5. Click **Save**

6. Click "Edit" on the **CNAME** record for **www**
7. Change **Content** to **cname.vercel-dns.com**
8. Keep **Proxy status** as **Proxied**
9. Click **Save**

### Step 4: Verify DNS Propagation
```bash
# Check if DNS has updated (may take 5-10 minutes)
dig merkelvision.com +short
# Should show Cloudflare IPs (because of proxy)

# Check DNS globally
https://www.whatsmydns.net/#CNAME/merkelvision.com
```

### Step 5: Verify SSL Certificate
1. Wait 5-10 minutes for Vercel to provision SSL
2. Visit https://merkelvision.com
3. Check for lock icon (valid SSL)
4. Vercel uses Let's Encrypt (automatic, free)

---

## Post-Migration Verification

### 1. Test Production Site
```bash
# Visit your site
open https://merkelvision.com

# Test critical paths:
- Registration
- Email verification (check inbox)
- Login
- Map functionality
- Location CRUD
- Photo upload
- Password reset
```

### 2. Monitor Errors
**Sentry Dashboard:**
https://sentry.io/organizations/rod-griola/issues/

**Vercel Logs:**
Vercel Dashboard → Your Project → Logs

**Resend Email Logs:**
https://resend.com/emails

### 3. Check Email Delivery
**Test sending an email:**
1. Register a new user at https://merkelvision.com
2. Check Resend Dashboard → Emails
3. Verify email was sent
4. Check spam folder if not in inbox

---

## Rollback Plan (If Needed)

### Quick Rollback to Render
If something goes wrong, revert DNS in Cloudflare:

1. Go to Cloudflare → DNS → Records
2. Change **CNAME @** back to Render's IP or CNAME
3. Save
4. Wait 5-10 minutes for propagation

**Keep Render running for 48 hours** after migration as a safety net.

---

## DNS Commands Cheat Sheet

```bash
# Check current DNS
dig merkelvision.com
dig www.merkelvision.com

# Check DNS with specific nameserver
dig @1.1.1.1 merkelvision.com

# Check DNS propagation globally
# Visit: https://www.whatsmydns.net

# Flush local DNS cache (if testing)
# macOS:
sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder

# Check SSL certificate
openssl s_client -connect merkelvision.com:443 -servername merkelvision.com
```

---

## Timeline Example

### T-1 hour (Preparation)
```
✓ Deploy to Vercel
✓ Add environment variables
✓ Test at vercel.app URL
✓ Backup production database
✓ Document current DNS records
```

### T-0 (Migration Start - 09:00 AM)
```
09:00 - Update Cloudflare DNS to Vercel
09:05 - DNS propagating (some users old, some new)
09:10 - Test https://merkelvision.com
09:15 - Most traffic on Vercel
09:30 - DNS fully propagated
```

### T+30 min (Verification)
```
09:30 - Test all critical features
09:35 - Check Sentry for errors
09:40 - Verify email sending
09:45 - Monitor Vercel Analytics
```

### T+2 hours (Stability Check)
```
11:00 - Confirm no critical errors
11:15 - Traffic stable
11:30 - All features working
```

### T+48 hours (Cleanup)
```
Day 3 - Shut down Render
      - Remove Render from billing
      - Archive Render deployment
```

---

## Common Issues & Fixes

### "Site shows old version"
```bash
# Clear browser cache
CMD+SHIFT+R (Chrome/Firefox)

# Or try incognito mode
```

### "DNS not updating"
```bash
# Check Cloudflare Proxy Status
# Make sure it's "Proxied" (orange cloud)

# Wait longer - full propagation can take up to 24 hours
# But usually 5-10 minutes
```

### "SSL Certificate Error"
```
# Vercel usually auto-provisions in 5-10 minutes
# If not, check Vercel Dashboard → Domains → SSL status
# May need to click "Refresh" or "Retry"
```

### "Email not sending"
```
# Check Vercel environment variables:
✓ EMAIL_MODE=production (not development!)
✓ EMAIL_API_KEY matches Resend dashboard
✓ EMAIL_FROM_ADDRESS matches verified domain

# Check Resend dashboard:
✓ Domain verified (green checkmark)
✓ Check email logs for errors
```

---

## Quick Reference Links

| Service | Dashboard | Purpose |
|---------|-----------|---------|
| **Vercel** | https://vercel.com/dashboard | Hosting, deployments |
| **Cloudflare** | https://dash.cloudflare.com | DNS, CDN, SSL |
| **Resend** | https://resend.com/overview | Email delivery |
| **Sentry** | https://sentry.io | Error monitoring |
| **Neon** | https://console.neon.tech | Database |
| **ImageKit** | https://imagekit.io/dashboard | Image CDN |

---

## Success Criteria

✅ **Migration Complete When:**
- [ ] https://merkelvision.com loads from Vercel
- [ ] SSL certificate is valid (lock icon)
- [ ] User registration works
- [ ] Verification emails send and deliver
- [ ] Login works
- [ ] Google Maps loads correctly
- [ ] Locations can be saved/edited/deleted
- [ ] Photo uploads work
- [ ] No critical errors in Sentry
- [ ] Traffic visible in Vercel Analytics

---

**Ready to migrate?** Start with Step 1: Deploy to Vercel! 🚀
