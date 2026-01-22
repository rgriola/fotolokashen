# Dynamic Email Templates System - Implementation Plan

**Date:** January 22, 2026  
**Status:** Planning Phase  
**Priority:** High - Required for Super Admin workflow

---

## 🎯 Problem Statement

**Current State:**
- Email templates are hard-coded in `src/lib/email-templates.ts`
- Template list in `EMAIL_TEMPLATES` is static
- Subject lines, colors, and content cannot be changed without code changes
- Super admins have no way to customize emails without developer access

**Desired State:**
- Super admins can create, edit, and manage email templates via UI
- Template content, subjects, colors stored in database
- Version control for template changes
- Ability to preview templates before saving
- Fallback to default templates if custom ones don't exist

---

## 📊 Database Schema Design

### New Tables Required

#### 1. `EmailTemplate` Table
Stores custom email templates created by super admins.

```prisma
model EmailTemplate {
  id                  Int       @id @default(autoincrement())
  
  // Template Identity
  key                 String    @unique // e.g., 'verification', 'password_reset', 'welcome'
  name                String    // Display name: "Email Verification Template"
  description         String?   // Purpose of this template
  category            String    @default("system") // 'system', 'notification', 'campaign'
  
  // Email Content
  subject             String    // Email subject line
  htmlBody            String    @db.Text // Full HTML template
  textBody            String?   @db.Text // Plain text fallback
  previewText         String?   // Email preview text (first line in inbox)
  
  // Customization
  brandColor          String    @default("#4285f4")
  headerGradientStart String    @default("#4285f4")
  headerGradientEnd   String    @default("#5a67d8")
  buttonColor         String    @default("#4285f4")
  
  // Template Variables
  // JSON array of required variables: ["username", "verificationUrl"]
  requiredVariables   Json      @default("[]")
  
  // Status & Versioning
  isActive            Boolean   @default(true)
  version             Int       @default(1)
  isDefault           Boolean   @default(false) // System default templates
  
  // Metadata
  createdBy           Int?
  updatedBy           Int?
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt
  
  // Relations
  creator             User?     @relation("TemplateCreator", fields: [createdBy], references: [id], onDelete: SetNull)
  updater             User?     @relation("TemplateUpdater", fields: [updatedBy], references: [id], onDelete: SetNull)
  versions            EmailTemplateVersion[]
  usageLogs           EmailLog[]
  
  @@index([key])
  @@index([category])
  @@index([isActive])
}
```

#### 2. `EmailTemplateVersion` Table
Version history for template changes (audit trail).

```prisma
model EmailTemplateVersion {
  id            Int       @id @default(autoincrement())
  templateId    Int
  
  // Version Info
  version       Int
  changeNote    String?   // What changed in this version
  
  // Snapshot of Content
  subject       String
  htmlBody      String    @db.Text
  textBody      String?   @db.Text
  customization Json      // Store all color/style settings
  
  // Metadata
  createdBy     Int?
  createdAt     DateTime  @default(now())
  
  // Relations
  template      EmailTemplate @relation(fields: [templateId], references: [id], onDelete: Cascade)
  creator       User?         @relation("VersionCreator", fields: [createdBy], references: [id], onDelete: SetNull)
  
  @@index([templateId])
  @@index([version])
}
```

#### 3. `EmailLog` Table (Optional - for tracking sent emails)

```prisma
model EmailLog {
  id            Int       @id @default(autoincrement())
  
  // Email Details
  templateId    Int?
  to            String
  subject       String
  status        String    // 'sent', 'failed', 'queued'
  
  // Metadata
  sentAt        DateTime  @default(now())
  errorMessage  String?   @db.Text
  
  // Relations
  template      EmailTemplate? @relation(fields: [templateId], references: [id], onDelete: SetNull)
  
  @@index([templateId])
  @@index([to])
  @@index([sentAt])
}
```

#### 4. Update `User` Model

```prisma
model User {
  // ...existing fields...
  
  // New Relations
  createdTemplates        EmailTemplate[]        @relation("TemplateCreator")
  updatedTemplates        EmailTemplate[]        @relation("TemplateUpdater")
  createdTemplateVersions EmailTemplateVersion[] @relation("VersionCreator")
}
```

---

## 🏗️ Architecture Plan

### 1. **Email Template Service** (`src/lib/email-template-service.ts`)

**Responsibilities:**
- Fetch templates from database
- Fallback to hard-coded defaults if not found
- Render templates with variable substitution
- Cache frequently used templates

**Key Functions:**
```typescript
// Get template by key (e.g., 'verification')
async function getEmailTemplate(key: string): Promise<EmailTemplate | null>

// Render template with variables
function renderTemplate(template: EmailTemplate, variables: Record<string, any>): string

// Get all active templates
async function getAllActiveTemplates(): Promise<EmailTemplate[]>

// Create new template
async function createTemplate(data: CreateTemplateInput, userId: number): Promise<EmailTemplate>

// Update template (creates new version)
async function updateTemplate(id: number, data: UpdateTemplateInput, userId: number): Promise<EmailTemplate>

// Revert to previous version
async function revertToVersion(templateId: number, versionNumber: number, userId: number): Promise<EmailTemplate>
```

### 2. **Template Variable System**

**Variable Syntax:**
Use `{{variableName}}` for substitution (like Handlebars/Mustache)

**Example:**
```html
<p>Hi <strong>{{username}}</strong>,</p>
<p>Click here to verify: <a href="{{verificationUrl}}">Verify Email</a></p>
```

**Variable Validation:**
- Each template has `requiredVariables` field
- Before sending, validate all required variables are provided
- Show warnings in UI if variables are missing

### 3. **UI Components Needed**

#### A. **Template List Page** (`/admin/email-templates`)
- Table view of all templates
- Columns: Name, Key, Category, Subject, Last Updated, Status
- Actions: Edit, Preview, Duplicate, Delete (if not default)
- Filter by category
- Search by name/key

#### B. **Template Editor** (`/admin/email-templates/[id]/edit`)
- Rich text editor for HTML body (or code editor)
- Subject line input
- Color pickers for brand colors
- Preview pane (live preview as you type)
- Variable helper (list of available variables)
- "Send Test Email" button
- Save as draft / Publish
- Version history sidebar

#### C. **Template Creator** (`/admin/email-templates/new`)
- Choose template key (dropdown or custom)
- Template type selector (System, Notification, Campaign)
- Start from scratch or duplicate existing
- Same editor interface as edit page

#### D. **Version History Modal**
- List all versions with timestamps
- Show what changed (diff view)
- Restore to previous version
- Compare two versions side-by-side

---

## 🔄 Migration Strategy

### Phase 1: Database Setup ✅ (Next Step)
1. Create Prisma schema for new tables
2. Run migration: `npx prisma migrate dev`
3. Seed default templates from hard-coded ones

### Phase 2: Backend Service
1. Create `email-template-service.ts`
2. Build API routes:
   - `GET /api/admin/email-templates` - List all
   - `GET /api/admin/email-templates/:id` - Get one
   - `POST /api/admin/email-templates` - Create new
   - `PUT /api/admin/email-templates/:id` - Update
   - `DELETE /api/admin/email-templates/:id` - Delete
   - `GET /api/admin/email-templates/:id/versions` - Version history
   - `POST /api/admin/email-templates/:id/revert` - Revert to version
   - `POST /api/admin/email-templates/:id/test` - Send test email

### Phase 3: Update Email Sending Functions
1. Modify `src/lib/email.ts` to fetch from database
2. Add fallback to hard-coded templates
3. Add template caching for performance

### Phase 4: UI Implementation
1. Template list page with table
2. Template editor with preview
3. Template creator flow
4. Version history viewer

### Phase 5: Polish & Testing
1. Add permission checks (super_admin only)
2. Add validation (required variables)
3. Add error handling
4. Test email sending with custom templates
5. Documentation for users

---

## 📝 Default Template Keys (System Templates)

**User Authentication:**
- `verification` - Email verification
- `welcome` - Welcome after verification
- `password_reset` - Password reset request
- `password_changed` - Password change notification
- `email_change_verify` - Verify new email
- `email_change_alert` - Alert to old email
- `account_deletion` - Account deleted confirmation

**Future Templates:**
- `team_invite` - Team invitation
- `project_invite` - Project invitation
- `location_shared` - Location shared notification
- `comment_notification` - New comment on location
- `weekly_digest` - Weekly summary email

---

## 🎨 Template Editor Features

### Must-Have:
- ✅ Subject line editor
- ✅ HTML code editor with syntax highlighting
- ✅ Live preview pane
- ✅ Color pickers for brand colors
- ✅ Variable insertion helper
- ✅ Send test email
- ✅ Save draft / Publish

### Nice-to-Have:
- 📋 Drag-and-drop email builder
- 📋 Pre-built content blocks
- 📋 Image uploader for inline images
- 📋 A/B testing support
- 📋 Template analytics (open rate, click rate)
- 📋 Responsive design preview (mobile/tablet/desktop)

---

## 🔒 Permissions & Security

**Who Can Do What:**

| Action | Super Admin | Staffer | User |
|--------|-------------|---------|------|
| View templates | ✅ | ❌ | ❌ |
| Create templates | ✅ | ❌ | ❌ |
| Edit templates | ✅ | ❌ | ❌ |
| Delete custom templates | ✅ | ❌ | ❌ |
| Delete default templates | ❌ | ❌ | ❌ |
| View version history | ✅ | ❌ | ❌ |
| Revert to previous version | ✅ | ❌ | ❌ |
| Send test emails | ✅ | ❌ | ❌ |

**Security Measures:**
1. All template management routes require `super_admin` role
2. Version history tracks who made changes
3. Cannot delete default system templates (only deactivate)
4. HTML sanitization to prevent XSS in emails
5. Rate limiting on test email sending

---

## 💡 Variable System Design

### Standard Variables (Available to All Templates)

```typescript
interface StandardVariables {
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  appName: string;
  appUrl: string;
  currentYear: number;
  supportEmail: string;
}
```

### Template-Specific Variables

**Verification Email:**
```typescript
{
  verificationUrl: string;
  expiryMinutes: number;
}
```

**Password Reset:**
```typescript
{
  resetUrl: string;
  expiryMinutes: number;
}
```

**Password Changed:**
```typescript
{
  timestamp: string;
  ipAddress: string | null;
  timezone: string;
}
```

### Variable Helper UI
Show in sidebar during editing:
```
Available Variables:
┌─────────────────────────────┐
│ Standard                    │
│ • {{username}}              │
│ • {{email}}                 │
│ • {{appName}}               │
│                             │
│ Template Specific           │
│ • {{verificationUrl}}       │
│ • {{expiryMinutes}}         │
└─────────────────────────────┘
```

---

## 🧪 Testing Strategy

### Unit Tests:
- Template variable substitution
- Template validation (required variables)
- HTML sanitization
- Fallback to defaults

### Integration Tests:
- CRUD operations via API
- Version creation on update
- Template rendering with real data
- Email sending with custom templates

### Manual Testing:
- Create new template via UI
- Edit existing template
- Preview in different devices
- Send test emails
- Revert to previous version
- Delete custom template

---

## 📦 Dependencies Needed

**Frontend:**
```json
{
  "@monaco-editor/react": "^4.6.0", // Code editor
  "react-colorful": "^5.6.1", // Color picker
  "handlebars": "^4.7.8", // Template engine
  "html-react-parser": "^5.1.1" // Preview rendering
}
```

**Backend:**
```json
{
  "handlebars": "^4.7.8", // Template rendering
  "dompurify": "^3.0.8", // HTML sanitization
  "isomorphic-dompurify": "^2.0.0" // Server-side sanitization
}
```

---

## 🚀 Implementation Timeline

**Week 1: Foundation (4-6 hours)**
- ✅ Create database schema
- ✅ Run migration
- ✅ Seed default templates
- ✅ Create email-template-service.ts
- ✅ Build API routes

**Week 2: Backend Integration (3-4 hours)**
- ✅ Update email.ts to use database templates
- ✅ Add template caching
- ✅ Add variable validation
- ✅ Test email sending

**Week 3: UI - List & View (4-5 hours)**
- ✅ Template list page
- ✅ Template detail view
- ✅ Version history modal
- ✅ Permission checks

**Week 4: UI - Editor (6-8 hours)**
- ✅ Template editor page
- ✅ Code editor integration
- ✅ Live preview
- ✅ Color customization
- ✅ Send test email

**Week 5: Polish (2-3 hours)**
- ✅ Error handling
- ✅ Loading states
- ✅ User feedback (toasts)
- ✅ Documentation

**Total Estimated Time:** 19-26 hours

---

## 🎯 Success Criteria

- [ ] Super admin can create new email template via UI
- [ ] Super admin can edit existing templates
- [ ] Changes create new version (audit trail)
- [ ] Live preview shows real-time changes
- [ ] Can revert to previous versions
- [ ] Send test emails to verify templates
- [ ] Email system falls back to defaults if DB template not found
- [ ] All template operations logged
- [ ] Performance: Template loading < 100ms (with cache)
- [ ] Zero breaking changes to existing email functionality

---

## 🤔 Open Questions for Discussion

1. **Template Versioning:**
   - Should we keep unlimited versions or cap at N versions?
   - Auto-save drafts vs. manual save only?

2. **Editor Type:**
   - Code editor (full HTML control) vs. WYSIWYG builder?
   - Both options with toggle?

3. **Template Categories:**
   - Should we add more categories beyond 'system', 'notification', 'campaign'?
   - Custom categories?

4. **Variable System:**
   - Strict validation (error if variable missing)?
   - Soft validation (warning but allow sending)?
   - Default values for optional variables?

5. **Test Emails:**
   - Send to current user only?
   - Allow custom recipient (with rate limiting)?

6. **Template Deletion:**
   - Soft delete (mark as inactive)?
   - Hard delete (if no emails sent)?
   - Archive system?

7. **Performance:**
   - Cache all templates on app start?
   - Cache on first use?
   - Invalidate cache on update?

8. **Multi-language Support:**
   - Future consideration?
   - Different templates per language?

---

## 📚 Next Steps

**Immediate Actions:**
1. ✅ Review this plan
2. ✅ Discuss open questions
3. ✅ Approve schema design
4. ⏳ Create Prisma migration
5. ⏳ Build email-template-service.ts
6. ⏳ Create API routes

**Ready to proceed?** Let me know which approach you prefer for the open questions, and I'll start implementing!

---

## 💬 Notes

- Keep existing hard-coded templates as fallback
- Add feature flag to enable/disable custom templates
- Consider adding template approval workflow (draft → review → published)
- Think about template sharing between environments (dev → staging → prod)

