# External Resources Checklist - fotolokashen Rebranding

**Date**: January 7, 2026  
**Purpose**: Track all external services that need to be updated for the fotolokashen rebrand

---

## 🔐 Authentication & Hosting

### Vercel
**Dashboard**: https://vercel.com/dashboard  
**Status**: ⏳ Needs Update

**Actions Required**:
- [x] Update project name (optional - can keep current)
- [x] Add new domain: `fotolokashen.com` and `www.fotolokashen.com`
- [x] Update environment variables:
  - [x ] `NEXT_PUBLIC_APP_URL=https://fotolokashen.com`
  - [ x] `EMAIL_FROM_ADDRESS=admin@fotolokashen.com`
  - [x ] `EMAIL_FROM_NAME=fotolokashen`
- [ x] Remove old domain `merkelvision.com` (after DNS migration complete)

---

## 📧 Email Service

### Resend
**Dashboard**: https://resend.com/overview  
**Status**: ⏳ Needs Update

**Actions Required**:
- [x ] Add new domain: `fotolokashen.com`
- [x ] Verify domain with DNS records (see Cloudflare section)
- [x ] Update default sender to `admin@fotolokashen.com`
- [x] Test email sending from new domain
- [x ] Remove old domain `merkelvision.com` (after migration complete)

**DNS Records Needed** (add in Cloudflare):
```
Type: TXT
Name: fotolokashen.com
Value: [Get from Resend dashboard]

Type: CNAME
Name: resend._domainkey.fotolokashen.com
Value: [Get from Resend dashboard]
```

---

## 🌐 DNS & Domain Management

### Cloudflare
**Dashboard**: https://dash.cloudflare.com  
**Status**: ⏳ Needs Update

**Actions Required**:
- [ ] Add new domain `fotolokashen.com` to Cloudflare account
- [ ] Configure DNS records for Vercel:
  ```
  Type: CNAME
  Name: @
  Content: cname.vercel-dns.com
  Proxy: Enabled (orange cloud)

  Type: CNAME
  Name: www
  Content: cname.vercel-dns.com
  Proxy: Enabled (orange cloud)
  ```
- [ ] Add Resend email verification DNS records (see above)
- [ ] Configure email routing (optional):
  - [ ] `admin@fotolokashen.com` → forward to personal email
  - [ ] `support@fotolokashen.com` → forward to personal email
- [ ] Wait for DNS propagation (5-30 minutes)
- [ ] Remove old `merkelvision.com` records (after migration complete)

---

## 🗺️ Google Maps API

### Google Cloud Console
**Dashboard**: https://console.cloud.google.com  
**Status**: ⚠️ May Need Update

**Actions Required**:
- [ ] Check if API key has domain restrictions
- [ ] If restricted, add `fotolokashen.com` to allowed domains
- [ ] Test Maps functionality on new domain
- [ ] Remove `merkelvision.com` restriction (after migration complete)

**Current API Key**: `AIzaSyCHQECnK2DXcNXIQR0ZfvIEPrAJWIH8JsM`

---

## 📸 Image CDN

### ImageKit
**Dashboard**: https://imagekit.io/dashboard 
**Status**: ✅ No Action Needed

**Notes**:
- ImageKit uses URL endpoint, not domain-specific
- Current endpoint: `https://ik.imagekit.io/rgriola`
- No changes required for rebranding

---

## 🐛 Error Tracking

### Sentry
**Dashboard**: https://sentry.io  
**Status**: ⏳ Needs Update

**Actions Required**:
- [ ] Update project name to "fotolokashen" (optional)
- [ ] Update allowed domains in project settings
- [ ] Add `fotolokashen.com` to allowed origins
- [ ] Test error tracking on new domain
- [ ] Update alert email preferences if needed

**Current Project**: `merkel-vision`  
**Current DSN**: `https://1e6219bd27e095b18fc73fec018da187@o4510596205838336.ingest.us.sentry.io/4510596233101312`

---

## 💾 Database

### Neon (PostgreSQL)
**Dashboard**: https://neon.tech/dashboard  
**Status**: ✅ No Action Needed

**Notes**:
- Database connection is domain-agnostic
- No changes required for rebranding
- Current connection string remains valid

---

## 📱 Social Media & Branding

### Twitter/X (if applicable)
**Status**: ⏳ Needs Update

**Actions Required**:
- [ ] Update handle from `@merkelvision` to `@fotolokashen`
- [ ] Update profile name to "fotolokashen"
- [ ] Update bio and links to fotolokashen.com

### Other Social Platforms
**Status**: ⏳ Review Needed

**Potential Actions**:
- [ ] Facebook page (if exists)
- [ ] Instagram (if exists)
- [ ] LinkedIn (if exists)
- [ ] GitHub repository description

---

## 🔗 GitHub Repository

### GitHub
**Dashboard**: https://github.com/rgriola  
**Status**: ⏳ Needs Update

**Actions Required**:
- [ ] Update repository name from `merkel-vision` to `fotolokashen`
- [ ] Update repository description
- [ ] Update README.md (already done locally)
- [ ] Update repository topics/tags
- [ ] Update any GitHub Pages settings (if applicable)

**Current Repo**: https://github.com/rgriola/merkel-vision

---

## 📊 Analytics & Monitoring

### Vercel Analytics
**Status**: ✅ Auto-updates with domain

**Notes**:
- Automatically tracks new domain once added
- No manual action required

### Google Analytics (if configured)
**Status**: ⚠️ Check if applicable

**Actions Required** (if using GA):
- [ ] Add fotolokashen.com as new property
- [ ] Update tracking code if needed
- [ ] Configure cross-domain tracking

---

## 🔐 Domain Registrar

### Domain Registrar (Unknown - Check where fotolokashen.com is registered)
**Status**: ⏳ Needs Configuration

**Actions Required**:
- [ ] Ensure fotolokashen.com is registered
- [ ] Point nameservers to Cloudflare
- [ ] Verify domain ownership
- [ ] Configure auto-renewal

**Typical Registrars**:
- GoDaddy
- Namecheap
- Google Domains
- Cloudflare Registrar

---

## 📝 Migration Checklist

### Pre-Migration
- [ ] Backup current database
- [ ] Document current DNS settings
- [ ] Test all features on staging/preview

### During Migration
- [ ] Add fotolokashen.com to all services
- [ ] Update environment variables
- [ ] Configure DNS records
- [ ] Wait for DNS propagation
- [ ] Test all features on new domain

### Post-Migration
- [ ] Monitor error logs (Sentry)
- [ ] Verify email sending (Resend)
- [ ] Check analytics (Vercel)
- [ ] Test all user flows
- [ ] Remove old merkelvision.com references

### Cleanup (After 30 days)
- [ ] Remove merkelvision.com from Vercel
- [ ] Remove merkelvision.com from Resend
- [ ] Remove merkelvision.com from Cloudflare
- [ ] Cancel merkelvision.com domain (if applicable)

---

## 🆘 Support Contacts

| Service | Support |
|---------|---------|
| **Vercel** | https://vercel.com/help |
| **Resend** | support@resend.com |
| **Cloudflare** | https://dash.cloudflare.com/support |
| **Google Cloud** | https://cloud.google.com/support |
| **Sentry** | https://sentry.io/support |
| **Neon** | https://neon.tech/docs |
| **ImageKit** | support@imagekit.io |

---

## ⏱️ Estimated Timeline

| Phase | Duration | Status |
|-------|----------|--------|
| Documentation Update | 30 min | ✅ Complete |
| Code File Updates | 1 hour | ⏳ Pending |
| External Services Setup | 2-3 hours | ⏳ Pending |
| DNS Propagation | 5-30 min | ⏳ Pending |
| Testing & Verification | 1-2 hours | ⏳ Pending |
| **Total** | **4-6 hours** | **In Progress** |

---

**Last Updated**: January 7, 2026 at 5:52 PM EST
