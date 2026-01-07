# Rebranding Summary: Merkel Vision → fotolokashen

**Date**: January 7, 2026 at 5:52 PM EST  
**Scope**: Documentation files only (code files to be updated separately)

## Changes Made

### Brand Name Changes
- **Old**: Merkel Vision
- **New**: fotolokashen

### Domain Changes
- **Old**: merkelvision.com
- **New**: fotolokashen.com

### Email Changes
- **Old**: admin@merkelvision.com, rod@merkelvision.com
- **New**: admin@fotolokashen.com, rod@fotolokashen.com

### Social Media Changes
- **Old**: @merkelvision
- **New**: @fotolokashen

## Files Updated

### Root Documentation Files
- ✅ `README.md` - Added rebranding note with timestamp, updated all references
- ✅ `DEPLOYMENT.md` - Updated domain and email references
- ✅ `PRODUCTION_CHECKLIST.md` - Updated all domain and branding references
- ✅ `PROJECT_STRUCTURE_REVIEW.md` - Updated references
- ✅ `REORGANIZATION_COMPLETE.md` - Updated references
- ✅ All other `*.md` files in root directory

### Documentation Folder (`/docs`)
- ✅ All markdown files in `/docs/planning/`
- ✅ All markdown files in `/docs/features/`
- ✅ All markdown files in `/docs/guides/`
- ✅ All markdown files in `/docs/development-history/`
- ✅ All markdown files in `/docs/archive/`
- ✅ All markdown files in `/docs/troubleshooting/`

## Still To Do (Code Files)

The following code files still need to be updated:

### Source Code
- `src/lib/env.ts` - Default email name
- `src/lib/email.ts` - Email sender name, welcome messages
- `src/components/layout/MobileMenu.tsx` - Mobile menu branding
- `src/components/layout/Header.tsx` - Header logo text
- `src/app/layout.tsx` - Metadata, OpenGraph, Twitter handles

### Configuration Files
- `next.config.ts` - Sentry project name
- `package.json` - Package name
- `package-lock.json` - Package name references

### Environment Variables (External Resources)
These need to be updated in external services:
- Vercel: `NEXT_PUBLIC_APP_URL`, `EMAIL_FROM_ADDRESS`, `EMAIL_FROM_NAME`
- Resend: Domain verification for fotolokashen.com
- Cloudflare DNS: Add fotolokashen.com domain
- Sentry: Project name/settings
- Google Maps API: Update restrictions if domain-locked

## Next Steps

1. ✅ **Documentation** - COMPLETE
2. ⏳ **Code Files** - Update source code and configuration
3. ⏳ **External Resources** - Update Vercel, Resend, Cloudflare, etc.
4. ⏳ **Testing** - Verify all changes work correctly
5. ⏳ **Deployment** - Deploy with new branding

## Notes

- All documentation now consistently uses "fotolokashen" (lowercase 'f')
- Domain references updated to fotolokashen.com
- Rebranding timestamp added to README.md
- No code files were modified in this phase to avoid breaking the running application
