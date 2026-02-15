# 🚨 URGENT: Fix Production Email URLs

## THE PROBLEM
Production emails are showing the old URL: `https://merkelvision.com`
Instead of: `https://fotolokashen.com`

## THE CAUSE
The environment variable `NEXT_PUBLIC_APP_URL` in **Vercel** is still set to the old domain.

## ✅ THE FIX (Do This Now)

### Step 1: Update Vercel Environment Variable
1. Go to: <https://vercel.com/rgriolas-projects/fotolokashen/settings/environment-variables>
2. Find `NEXT_PUBLIC_APP_URL`
3. Click "Edit"
4. Change value to: `https://fotolokashen.com`
5. Ensure it's set for **Production** environment
6. Click "Save"

### Step 2: Verify Other Email Settings
While you're in Vercel environment variables, verify:

| Variable | Should Be | Notes |
|----------|-----------|-------|
| `EMAIL_MODE` | `production` | **NOT** `development` (or emails won't send) |
| `EMAIL_FROM_ADDRESS` | `rod@fotolokashen.com` or `noreply@fotolokashen.com` | Must be verified in Resend |
| `EMAIL_API_KEY` | Your Resend key | Should start with `re_` |
| `EMAIL_FROM_NAME` | `Fotolokashen` | Display name in emails |

### Step 3: Redeploy
1. Go to "Deployments" tab in Vercel
2. Click "..." menu on latest deployment
3. Click "Redeploy"
4. Wait for deployment to complete

### Step 4: Test
1. Go to production site
2. Use "Forgot Password" feature
3. Check email - link should be `https://fotolokashen.com/reset-password?token=...`

## 📋 WHY THIS HAPPENED

### How Environment Variables Work:

**Local Development (.env.local):**
```bash
NEXT_PUBLIC_APP_URL="http://localhost:3000"  ✅ This is correct
```

**Production (Vercel Dashboard):**
```bash
NEXT_PUBLIC_APP_URL="https://merkelvision.com"  ❌ This is wrong!
```

The `.env.local` file is **NOT** used in production. Vercel uses its own environment variables from the dashboard.

## ✨ VERIFICATION

After redeploying, all emails should have correct URLs:
- ✉️ Email verification: `https://fotolokashen.com/verify-email?token=...`
- 🔐 Password reset: `https://fotolokashen.com/reset-password?token=...`
- ❌ Account deletion: References to `https://fotolokashen.com/register`

## 📚 IMPORTANT NOTES

1. **`.env.production.example` is NOT used by Next.js**
   - It's just documentation showing what variables are needed
   - The actual values must be set in Vercel dashboard

2. **Your code is clean** ✅
   - No hardcoded references to `merkelvision.com`
   - All references use `process.env.NEXT_PUBLIC_APP_URL`
   - Just need to update the Vercel environment variable

3. **Files in .gitignore**
   - `.env.local` - Your local config (never committed)
   - `.env.production` - If it exists, it's not used (Vercel ignores it)

## 🔗 Quick Links

- [Vercel Environment Variables](https://vercel.com/docs/projects/environment-variables)
- [Resend Domain Verification](https://resend.com/docs/dashboard/domains/introduction)
- [Project Documentation](../troubleshooting/EMAIL_URL_ISSUE_RESOLUTION.md)

---

**Status**: Action Required  
**Priority**: High  
**Est. Time**: 5 minutes  
**Created**: January 9, 2026
