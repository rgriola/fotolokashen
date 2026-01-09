# Email Subdomain Implementation Plan

## 📧 Overview

Resend recommends using a subdomain for sending emails instead of the root domain. This is a best practice for email deliverability, domain reputation protection, and professional email management.

## 🎯 Current vs Recommended Setup

### Current (Not Optimal)
```bash
EMAIL_FROM_ADDRESS="rod@fotolokashen.com"
```
- Uses root domain
- Personal email address
- Could hurt domain reputation if email issues occur
- All email types share same reputation

### Recommended
```bash
EMAIL_FROM_ADDRESS="noreply@mail.fotolokashen.com"
```
- Uses subdomain dedicated to email
- Professional system sender address
- Protects main domain reputation
- Allows segmentation by email purpose

## 💡 Why Use a Subdomain?

### 1. Reputation Segmentation
Different email types can use different subdomains. If one has issues, it won't affect the others:

```
transactional@mail.fotolokashen.com    → Password resets, verifications
marketing@news.fotolokashen.com        → Newsletters, announcements  
notifications@app.fotolokashen.com     → Activity updates, alerts
```

**Example**: If marketing emails get spam complaints, your critical password reset emails remain unaffected!

### 2. Domain Reputation Protection
Your main domain (`fotolokashen.com`) is what users visit in their browser. Email issues (spam complaints, bounces, blacklisting) won't damage your website's domain reputation.

### 3. Clear Purpose Identification
Email providers (Gmail, Outlook, Yahoo) can identify that `mail.fotolokashen.com` is specifically for transactional emails, improving deliverability and reducing spam flagging.

### 4. Better Monitoring & Analytics
Track metrics separately by subdomain:
- Bounce rates for transactional vs marketing
- Open rates by purpose
- Spam complaints by email type
- Deliverability scores per subdomain

### 5. Scalability
Easy to add new subdomains as your needs grow without affecting existing email infrastructure.

## 🏗️ Recommended Subdomain Structure

### For Current Needs
```
mail.fotolokashen.com
├── noreply@mail.fotolokashen.com    → System emails (password resets, verification)
└── hello@mail.fotolokashen.com      → User-facing emails (support, notifications)
```

### Future Expansion (Optional)
```
newsletter.fotolokashen.com          → Marketing emails, updates
alerts.fotolokashen.com              → Push notification emails  
support.fotolokashen.com             → Help desk, customer service
```

## 📋 Implementation Steps

### Step 1: Choose Your Subdomain
**Recommended**: `mail.fotolokashen.com`

**Alternative options**:
- `email.fotolokashen.com`
- `send.fotolokashen.com`
- `app.fotolokashen.com`

### Step 2: Add Subdomain in Resend Dashboard

1. Go to: [Resend Dashboard → Domains](https://resend.com/domains)
2. Click "Add Domain"
3. Enter: `mail.fotolokashen.com` (NOT `fotolokashen.com`)
4. Resend will provide DNS records to add

### Step 3: Add DNS Records

Resend will give you records like these to add to your DNS provider (where `fotolokashen.com` is hosted):

```dns
# Domain Verification
TXT  mail.fotolokashen.com  →  resend-domain-verification-xxxxxxxxxxxxxxxx

# MX Record (for bounce handling)
MX   mail.fotolokashen.com  →  feedback-smtp.us-east-1.amazonses.com  (Priority: 10)

# DKIM (Email Authentication)
TXT  resend._domainkey.mail.fotolokashen.com  →  p=MIGfMA0GCSqGSIb3DQEBAQUAA4GN...

# SPF (Sender Policy Framework) - Optional, may be auto-configured
TXT  mail.fotolokashen.com  →  v=spf1 include:amazonses.com ~all

# DMARC (Domain-based Message Authentication) - Recommended
TXT  _dmarc.mail.fotolokashen.com  →  v=DMARC1; p=none; rua=mailto:dmarc@fotolokashen.com
```

**Where to add these**:
- If using Cloudflare: DNS tab → Add records
- If using Namecheap: Advanced DNS → Add new records
- If using GoDaddy: DNS Management → Add records
- If using Vercel domains: Domains → DNS settings

### Step 4: Verify Domain in Resend

1. After adding DNS records, return to Resend Dashboard
2. Click "Verify" on your `mail.fotolokashen.com` domain
3. Verification usually takes 5-15 minutes (sometimes up to 48 hours for DNS propagation)
4. You'll see a green checkmark when verified

**Tip**: Use [DNS Checker](https://dnschecker.org/) to verify DNS propagation globally.

### Step 5: Update Environment Variables

#### Local Development (`.env.local`)
```bash
# Email Configuration - RESEND
EMAIL_API_KEY="re_YourResendAPIKey"
EMAIL_MODE="development"  # Logs emails to console
EMAIL_FROM_NAME="Fotolokashen"
EMAIL_FROM_ADDRESS="noreply@mail.fotolokashen.com"  # ← UPDATED

# Application URLs
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

#### Production (Vercel Dashboard)

1. Go to: [Vercel → Settings → Environment Variables](https://vercel.com/rgriolas-projects/fotolokashen/settings/environment-variables)
2. Find `EMAIL_FROM_ADDRESS`
3. Update value to: `noreply@mail.fotolokashen.com`
4. Ensure it's set for **Production** environment
5. Click "Save"

**Other variables to verify**:
```bash
EMAIL_MODE=production                           # Send real emails
EMAIL_FROM_NAME=Fotolokashen                   # Display name
EMAIL_FROM_ADDRESS=noreply@mail.fotolokashen.com  # ← NEW SUBDOMAIN
EMAIL_API_KEY=re_YourProductionResendKey       # Your Resend key
```

### Step 6: Redeploy Application

After updating environment variables in Vercel:

1. Go to "Deployments" tab
2. Click "..." menu on latest deployment  
3. Select "Redeploy"
4. Wait for deployment to complete

### Step 7: Test Email Sending

1. Go to production site: `https://fotolokashen.com`
2. Use "Forgot Password" feature
3. Check your email
4. Verify the email:
   - From address shows: `Fotolokashen <noreply@mail.fotolokashen.com>`
   - Link works: `https://fotolokashen.com/reset-password?token=...`
   - Lands in inbox (not spam)

### Step 8: Monitor & Optimize

**Check Resend Analytics**:
- Delivery rate (should be >95%)
- Bounce rate (should be <5%)
- Spam complaint rate (should be <0.1%)

**Gmail Postmaster Tools** (Optional but recommended):
1. Visit: [Google Postmaster Tools](https://postmaster.google.com/)
2. Add domain: `mail.fotolokashen.com`
3. Monitor: Reputation, spam rate, delivery errors

## 📊 Benefits Comparison

| Aspect | Root Domain | Subdomain |
|--------|-------------|-----------|
| **Main Domain Protection** | ❌ Direct impact from email issues | ✅ Email issues isolated |
| **Reputation Segmentation** | ❌ Single reputation bucket | ✅ Separate by purpose |
| **Email Deliverability** | ⚠️ Moderate | ✅ Better (best practice) |
| **Professional Appearance** | ⚠️ Personal email | ✅ System/brand email |
| **Scalability** | ❌ Limited | ✅ Easy to expand |
| **Spam Protection** | ❌ All emails affected | ✅ Isolated by subdomain |
| **Monitoring** | ⚠️ Combined metrics | ✅ Separate metrics |
| **Industry Standard** | ❌ Not recommended | ✅ Best practice |

## 🔒 Security & Authentication

### DKIM (DomainKeys Identified Mail)
- **What**: Cryptographic signature proving email authenticity
- **Status**: Automatically configured by Resend
- **Benefit**: Prevents email spoofing

### SPF (Sender Policy Framework)
- **What**: List of authorized email servers for your domain
- **Status**: Automatically configured by Resend
- **Benefit**: Reduces spam, improves deliverability

### DMARC (Domain-based Message Authentication)
- **What**: Policy for handling failed authentication
- **Status**: Recommended to configure manually
- **Benefit**: Instructs email providers how to handle suspicious emails

**Recommended DMARC record**:
```dns
TXT  _dmarc.mail.fotolokashen.com  →  v=DMARC1; p=quarantine; rua=mailto:dmarc-reports@fotolokashen.com; pct=100; adkim=s; aspf=s
```

Explanation:
- `p=quarantine` - Quarantine suspicious emails (start with `p=none` to monitor)
- `rua=mailto:...` - Send aggregate reports here
- `pct=100` - Apply policy to 100% of emails
- `adkim=s` - Strict DKIM alignment
- `aspf=s` - Strict SPF alignment

## 🚨 Common Issues & Solutions

### Issue: DNS Records Not Propagating
**Solution**: 
- Wait 24-48 hours for global DNS propagation
- Use [DNS Checker](https://dnschecker.org/) to verify
- Clear DNS cache: `sudo dscacheutil -flushcache` (macOS)

### Issue: Emails Still Going to Spam
**Solutions**:
- Verify all DNS records (DKIM, SPF, DMARC) are correct
- Check domain reputation: [SenderScore](https://senderscore.org/)
- Warm up domain by sending gradually increasing volumes
- Avoid spam trigger words in subject/content
- Include unsubscribe link (required for bulk emails)

### Issue: Bounces or Delivery Failures
**Solutions**:
- Check Resend dashboard for specific error messages
- Verify recipient email addresses are valid
- Ensure MX record is correctly configured
- Check if domain is blacklisted: [MXToolbox](https://mxtoolbox.com/blacklists.aspx)

### Issue: "From" Name Not Displaying
**Solution**:
- Verify `EMAIL_FROM_NAME` is set in environment variables
- Check that name doesn't contain special characters
- Some email clients may override display name

## 📝 Code Changes Required

### None! ✅

Your code already uses environment variables correctly:

**`src/lib/email.ts`** (already correct):
```typescript
const fromName = process.env.EMAIL_FROM_NAME || 'Fotolokashen';
const fromAddress = process.env.EMAIL_FROM_ADDRESS || 'noreply@fotolokashen.com';
```

Just update the environment variable values, no code changes needed!

## 🎓 Best Practices

### Do's ✅
- Use descriptive subdomain names (`mail`, `email`, `send`)
- Keep separate subdomains for different email purposes
- Monitor email metrics regularly
- Set up DMARC policy (start with `p=none`, then `p=quarantine`)
- Use professional sender addresses (`noreply@`, `hello@`, `support@`)
- Keep email content relevant and valuable
- Honor unsubscribe requests immediately

### Don'ts ❌
- Don't send marketing emails from transactional subdomain
- Don't buy email lists (hurts reputation permanently)
- Don't send without proper authentication (DKIM, SPF, DMARC)
- Don't use personal email addresses for system emails
- Don't ignore bounce and complaint rates
- Don't send emails too frequently (causes spam complaints)

## 📅 Implementation Timeline

| Task | Estimated Time | Priority |
|------|----------------|----------|
| Choose subdomain | 5 minutes | High |
| Add domain in Resend | 5 minutes | High |
| Configure DNS records | 15 minutes | High |
| Wait for verification | 5 mins - 48 hours | High |
| Update environment variables | 10 minutes | High |
| Redeploy application | 5 minutes | High |
| Test email sending | 10 minutes | High |
| Monitor for 1 week | Ongoing | Medium |
| Set up DMARC reporting | 30 minutes | Medium |
| Configure Google Postmaster | 20 minutes | Low |

**Total Active Time**: ~1.5 hours  
**Total Wait Time**: Up to 48 hours for DNS propagation

## ✅ Checklist

### Pre-Implementation
- [ ] Review current email setup
- [ ] Choose subdomain name (`mail.fotolokashen.com`)
- [ ] Access to DNS provider (where fotolokashen.com is hosted)
- [ ] Access to Resend dashboard
- [ ] Access to Vercel dashboard

### Implementation
- [ ] Add subdomain in Resend dashboard
- [ ] Copy DNS records from Resend
- [ ] Add DNS records to DNS provider
- [ ] Wait for DNS propagation (5 mins - 48 hours)
- [ ] Verify domain in Resend (green checkmark)
- [ ] Update `.env.local` → `EMAIL_FROM_ADDRESS`
- [ ] Update Vercel environment variables
- [ ] Redeploy application

### Testing
- [ ] Send test password reset email
- [ ] Verify email received
- [ ] Check "From" address shows subdomain
- [ ] Click password reset link (works correctly)
- [ ] Check email doesn't land in spam
- [ ] Send test verification email
- [ ] Test account deletion email

### Monitoring (First Week)
- [ ] Check Resend analytics daily
- [ ] Monitor delivery rate (target: >95%)
- [ ] Monitor bounce rate (target: <5%)
- [ ] Monitor spam complaints (target: <0.1%)
- [ ] Check emails arrive in inbox (not spam)

### Optional (But Recommended)
- [ ] Set up DMARC policy (start with `p=none`)
- [ ] Configure DMARC reporting email
- [ ] Register with Google Postmaster Tools
- [ ] Set up weekly analytics review
- [ ] Document any issues and solutions

## 🔗 Resources

### Documentation
- [Resend Domains Guide](https://resend.com/docs/dashboard/domains/introduction)
- [Resend DNS Configuration](https://resend.com/docs/dashboard/domains/dns-providers)
- [DMARC Guide](https://dmarc.org/overview/)
- [Email Authentication Best Practices](https://www.cloudflare.com/learning/email-security/dmarc-dkim-spf/)

### Tools
- [DNS Checker](https://dnschecker.org/) - Verify DNS propagation
- [MXToolbox](https://mxtoolbox.com/) - Email diagnostics
- [Mail Tester](https://www.mail-tester.com/) - Test email spam score
- [Google Postmaster](https://postmaster.google.com/) - Gmail deliverability
- [SenderScore](https://senderscore.org/) - Email reputation

### Support
- Resend Support: support@resend.com
- Resend Discord: [Join Community](https://resend.com/discord)
- Project Documentation: `/docs/troubleshooting/EMAIL_URL_ISSUE_RESOLUTION.md`

---

## 📌 Quick Reference

**Current Setup**:
```bash
EMAIL_FROM_ADDRESS="rod@fotolokashen.com"  # Root domain
```

**New Setup**:
```bash
EMAIL_FROM_ADDRESS="noreply@mail.fotolokashen.com"  # Subdomain
```

**Where to Update**:
1. **Local**: `.env.local` file
2. **Production**: Vercel Dashboard → Environment Variables
3. **Code**: No changes needed! ✅

**When to Redeploy**:
After updating Vercel environment variables

**How to Test**:
Use "Forgot Password" on production site

---

**Created**: January 9, 2026  
**Status**: Ready to Implement  
**Priority**: High (Improves deliverability and protects domain reputation)  
**Estimated Effort**: 1.5 hours active work + up to 48 hours DNS wait
