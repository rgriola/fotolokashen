# Email Templates System - Testing Checklist

**Date:** 2026-05-04 00:22:44 EDT  
**Phase:** Phase 6 - Final Testing  
**Tester:** ******\_\_\_******

---

## ✅ Pre-Testing Setup

- [ ] Database has default templates seeded
- [ ] Super admin account created and accessible
- [ ] Development environment running (`npm run dev`)
- [ ] Email service configured (Resend API key or development mode)
- [ ] Browser console open for debugging

---

## 1️⃣ Authentication & Permissions

### Super Admin Access

- [ ] Can access `/admin/email-templates` page
- [ ] See "Email Templates" tab in admin panel
- [ ] All features visible and enabled

### Non-Admin Access

- [ ] Regular users cannot access `/admin/email-templates`
- [ ] Staffers cannot access template management
- [ ] Proper redirect or error message shown

---

## 2️⃣ Template List Page

### Page Load

- [ ] Page loads without errors
- [ ] All 5 default templates displayed
- [ ] Table renders correctly with all columns
- [ ] Navigation tabs work (Users, Email Preview, Email Templates)

### Display & UI

- [ ] Template names display correctly
- [ ] Keys shown in code format
- [ ] Subject lines visible (truncated if long)
- [ ] Categories shown as badges
- [ ] Version numbers display (v1, v2, etc.)
- [ ] Status badges (Active/Inactive) visible
- [ ] Last updated dates formatted correctly
- [ ] "Default" badge appears on system templates

### Search Functionality

- [ ] Search by template name works
- [ ] Search by template key works
- [ ] Search by subject line works
- [ ] Search is case-insensitive
- [ ] Results update in real-time
- [ ] Clear search shows all templates

### Category Filter

- [ ] "All Categories" shows all templates
- [ ] "System" filter shows only system templates
- [ ] "Notification" filter works
- [ ] "Campaign" filter works
- [ ] Filter persists during search

### Actions

- [ ] Edit icon visible on all templates
- [ ] History icon visible on all templates
- [ ] Duplicate icon visible only on custom templates
- [ ] Delete icon visible only on custom templates
- [ ] Duplicate hidden for default templates
- [ ] Delete hidden for default templates

---

## 3️⃣ Create Template

### Navigation

- [ ] "Create Template" button visible
- [ ] Click navigates to `/admin/email-templates/new`
- [ ] Page loads editor interface

### Form Fields

- [ ] Key input is enabled (new template)
- [ ] Name input works
- [ ] Description textarea works
- [ ] Category selector has 3 options
- [ ] Subject input works
- [ ] All fields initially empty

### Validation

- [ ] Cannot save without key
- [ ] Cannot save without name
- [ ] Cannot save without subject
- [ ] Cannot save without HTML body
- [ ] Key validates format (lowercase, alphanumeric, \_/-)
- [ ] Error toast shown for invalid data

### Color Pickers

- [ ] All 4 color pickers display
- [ ] Click color box opens picker
- [ ] Picker updates hex input
- [ ] Hex input updates picker
- [ ] Invalid hex shows error or defaults

### HTML Editor

- [ ] Monaco editor loads
- [ ] Syntax highlighting works
- [ ] Can type HTML code
- [ ] Code formats on paste
- [ ] No errors in browser console

### Save

- [ ] Click "Save" creates template
- [ ] Success toast appears
- [ ] Redirects to template list
- [ ] New template appears in list
- [ ] Template has v1 version

---

## 4️⃣ Edit Template

### Navigation

- [ ] Click Edit icon on any template
- [ ] Navigates to `/admin/email-templates/[id]/edit`
- [ ] Page loads with existing data

### Form Pre-population

- [ ] Key field is disabled (cannot change)
- [ ] Name field shows current value
- [ ] Description shows current value
- [ ] Category selected correctly
- [ ] Subject shows current value
- [ ] Colors show current values
- [ ] HTML body loads in editor

### Editing

- [ ] Can modify name
- [ ] Can modify description
- [ ] Can change category
- [ ] Can edit subject
- [ ] Can change colors
- [ ] Can edit HTML

### Preview

- [ ] Click "Show Preview" toggles panel
- [ ] Preview renders HTML correctly
- [ ] Preview updates when HTML changes (after save)
- [ ] Click "Hide Preview" collapses panel

### Save Changes

- [ ] Click "Save" updates template
- [ ] Success toast appears
- [ ] Redirects to template list
- [ ] Version number incremented (v1 → v2)
- [ ] New version created in history

---

## 5️⃣ Send Test Email

### Prerequisites

- [ ] Template must be saved first
- [ ] "Send Test" button appears after save
- [ ] Button disabled while sending

### Test Variables Modal

- [ ] Clicking "Send Test" opens Test Variables modal
- [ ] Required variables are listed with editable values
- [ ] Suggested values are prefilled for required variables
- [ ] Can add custom variable key/value pair
- [ ] Custom key sanitizes to letters, numbers, underscores
- [ ] Custom variable appears in payload list as "custom"
- [ ] Can remove custom variables before sending
- [ ] Required variables cannot be removed
- [ ] Send button in modal triggers test email request

### Development Mode

- [ ] Test email logs to console
- [ ] Console shows email details:
  - To: (current user email)
  - Subject
  - Template name and key
  - Variables used
- [ ] Success toast appears
- [ ] No actual email sent

### Production Mode (if configured)

- [ ] Test email sends to current user
- [ ] Email received in inbox
- [ ] Subject matches template
- [ ] HTML renders correctly
- [ ] Variables populated with test data
- [ ] Success toast appears

### Error Handling

- [ ] If send fails, error toast shown
- [ ] Console shows error details
- [ ] Button re-enables after error

---

## 6️⃣ Version History

### Navigation

- [ ] Click History icon on any template
- [ ] Navigates to `/admin/email-templates/[id]/versions`
- [ ] Page loads version list

### Display

- [ ] All versions shown in table
- [ ] Version numbers correct (v1, v2, v3...)
- [ ] "Current" badge on active version
- [ ] Change notes display (or "No note")
- [ ] Creator usernames shown
- [ ] Timestamps formatted correctly

### Revert Functionality

- [ ] "Revert" button only on old versions
- [ ] No "Revert" on current version
- [ ] Click "Revert" shows confirmation dialog
- [ ] Confirm creates new version
- [ ] Success toast appears
- [ ] Redirects to template list
- [ ] Template content matches old version
- [ ] New version number created (not overwrite)

---

## 7️⃣ Delete Template

### Custom Templates

- [ ] Click Delete icon on custom template
- [ ] Confirmation dialog appears
- [ ] Confirm deletes template
- [ ] Success toast appears
- [ ] Template removed from list
- [ ] Soft delete (deletedAt set in database)

### Default Templates

- [ ] Delete icon hidden for default templates
- [ ] Attempting API delete returns error
- [ ] Default templates always visible

---

## 8️⃣ Template Rendering (Email System)

### Database Templates

- [ ] Send verification email uses database template
- [ ] Send welcome email uses database template
- [ ] Send password reset uses database template
- [ ] Send password changed uses database template
- [ ] Send account deletion uses database template
- [ ] Variables populate correctly
- [ ] Colors render from database
- [ ] Emails log to EmailLog table

### Fallback System

- [ ] If database template missing, uses hard-coded
- [ ] Console warning shown for fallback
- [ ] Email still sends successfully
- [ ] No errors thrown

### Email Logging

- [ ] Successful sends logged with status 'sent'
- [ ] Failed sends logged with status 'failed'
- [ ] Error messages captured in log
- [ ] Template ID referenced in log

---

## 9️⃣ Performance

### Page Load Times

- [ ] Template list loads < 2 seconds
- [ ] Template editor loads < 2 seconds
- [ ] Version history loads < 2 seconds
- [ ] No lag when typing in editor

### Search Performance

- [ ] Search filters instantly (< 100ms)
- [ ] No lag with 10+ templates
- [ ] No lag with 50+ templates

### Template Caching

- [ ] First template load fetches from DB
- [ ] Subsequent loads use cache (< 10ms)
- [ ] Cache invalidates on update
- [ ] New version cached immediately

---

## 🔟 Error Handling

### Network Errors

- [ ] API failure shows error toast
- [ ] Console logs error details
- [ ] User-friendly error message
- [ ] Page doesn't crash

### Validation Errors

- [ ] Form validation prevents bad data
- [ ] Clear error messages shown
- [ ] Focus moves to invalid field
- [ ] Correcting error removes message

### Permission Errors

- [ ] Non-admins see 403 error
- [ ] Proper redirect or message
- [ ] No sensitive data exposed

---

## 1️⃣1️⃣ Browser Compatibility

### Desktop Browsers

- [ ] Chrome (latest) ✅
- [ ] Firefox (latest) ✅
- [ ] Safari (latest) ✅
- [ ] Edge (latest) ✅

### Features to Test Per Browser

- [ ] Monaco editor loads
- [ ] Color pickers work
- [ ] Search/filter works
- [ ] Toasts appear
- [ ] All buttons clickable

---

## 1️⃣2️⃣ Responsive Design

### Screen Sizes

- [ ] Desktop (1920x1080) - Full layout
- [ ] Laptop (1366x768) - Comfortable
- [ ] Tablet (768x1024) - Usable
- [ ] Mobile (375x667) - Consider improvements

### Responsive Elements

- [ ] Table scrolls horizontally if needed
- [ ] Editor stays usable
- [ ] Buttons accessible
- [ ] Forms don't overflow

---

## 1️⃣3️⃣ Security

### Access Control

- [ ] super_admin role required for all operations
- [ ] Regular users blocked
- [ ] Staffers blocked
- [ ] Auth middleware working

### Input Sanitization

- [ ] HTML sanitized before rendering
- [ ] XSS attempts blocked
- [ ] SQL injection prevented (Prisma ORM)
- [ ] Template key validated

### API Security

- [ ] All routes require authentication
- [ ] Permission checks on mutations
- [ ] Default template protection enforced
- [ ] Error messages don't leak data

---

## 1️⃣4️⃣ Data Integrity

### Version Control

- [ ] Every update creates new version
- [ ] Old versions preserved
- [ ] Version numbers increment correctly
- [ ] Max 20 versions kept (old ones removed)

### Audit Trail

- [ ] createdBy captured
- [ ] updatedBy captured
- [ ] createdAt timestamp accurate
- [ ] updatedAt timestamp accurate

### Database Consistency

- [ ] No orphaned records
- [ ] Foreign keys intact
- [ ] Indexes working
- [ ] Soft deletes work correctly

---

## ✅ Final Checks

### Documentation

- [ ] User guide created and accessible
- [ ] Testing checklist completed
- [ ] README updated with new features
- [ ] API documentation accurate

### Code Quality

- [ ] No TypeScript errors
- [ ] No ESLint errors (or acceptable)
- [ ] No console errors in browser
- [ ] Code formatted consistently

### Git & Deployment

- [ ] All changes committed
- [ ] Commit messages clear
- [ ] No sensitive data in commits
- [ ] Ready for production deployment

---

## 🐛 Bugs Found

| #   | Issue | Severity | Status | Notes |
| --- | ----- | -------- | ------ | ----- |
| 1   |       |          |        |       |
| 2   |       |          |        |       |
| 3   |       |          |        |       |

---

## 📊 Test Results Summary

**Total Tests:** **\_** / **\_**  
**Passed:** **\_**  
**Failed:** **\_**  
**Blocked:** **\_**

**Pass Rate:** **\_**%

**Tested By:** ******\_\_\_******  
**Date:** ******\_\_\_******  
**Time Spent:** ******\_\_\_******

**Overall Status:** [ ] PASS [ ] FAIL [ ] NEEDS WORK

**Notes:**

```
[Add any additional notes here]
```

---

**Sign-Off:**  
Tester: ******\_\_\_****** Date: ******\_\_\_******  
Reviewer: ******\_\_\_****** Date: ******\_\_\_******  
Product Owner: ******\_\_\_****** Date: ******\_\_\_******
