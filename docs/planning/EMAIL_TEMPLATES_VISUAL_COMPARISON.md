# Email Templates: Current vs. Proposed System

## 📊 Quick Comparison

| Aspect | Current System | Proposed System |
|--------|----------------|-----------------|
| **Storage** | Hard-coded in TypeScript files | Database (PostgreSQL) |
| **Editability** | Requires code changes | UI-based editing |
| **Who Can Edit** | Developers only | Super admins via web interface |
| **Versioning** | Git commits | Built-in version history |
| **Preview** | Email preview page (static) | Live preview while editing |
| **Variables** | Hard-coded in functions | Defined per template, validated |
| **Customization** | Edit source code | Color pickers, visual editor |
| **Rollback** | Git revert | Click to revert to any version |
| **Testing** | Send from code | "Send Test" button in UI |
| **Audit Trail** | Git history | Database logs with user tracking |

---

## 🎨 Visual Workflow Comparison

### Current Workflow (To Change Email Subject)
```
Developer opens code editor
    ↓
Edit src/lib/email-templates.ts
    ↓
Change hard-coded subject string
    ↓
Save file, commit to Git
    ↓
Deploy to server
    ↓
Wait for deployment
    ↓
Subject changed ✅
```
**Time:** 10-30 minutes  
**Risk:** High (code changes, deployment)  
**Who:** Developer only

---

### Proposed Workflow (To Change Email Subject)
```
Super admin logs into app
    ↓
Navigate to /admin/email-templates
    ↓
Click "Edit" on verification template
    ↓
Change subject field
    ↓
Preview changes in real-time
    ↓
Click "Save"
    ↓
Subject changed ✅
```
**Time:** 1-2 minutes  
**Risk:** Low (no code changes, instant revert)  
**Who:** Any super admin

---

## 🖼️ UI Mockup (Template List Page)

```
┌─────────────────────────────────────────────────────────────────────┐
│  Admin Panel > Email Templates                    [+ New Template]  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  🔍 Search templates...              Category: [All ▼]  Status: [All ▼]  │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │ Name                 Key            Subject              Updated │ │
│  ├─────────────────────────────────────────────────────────────────┤ │
│  │ ✉️ Email Verification verification  Confirm your email  2d ago  │ │
│  │                      [System]        [Edit] [Preview] [Versions]│ │
│  ├─────────────────────────────────────────────────────────────────┤ │
│  │ 🎉 Welcome Email     welcome        Welcome to Fotolokas... 5d  │ │
│  │                      [System]        [Edit] [Preview] [Versions]│ │
│  ├─────────────────────────────────────────────────────────────────┤ │
│  │ 🔐 Password Reset    password_reset Reset your password   1w   │ │
│  │                      [System]        [Edit] [Preview] [Versions]│ │
│  ├─────────────────────────────────────────────────────────────────┤ │
│  │ 📧 Custom Welcome    custom_welcome Welcome! Here's what... 2w  │ │
│  │                      [Custom]        [Edit] [Preview] [Delete]  │ │
│  └─────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🖼️ UI Mockup (Template Editor)

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Email Templates > Edit "Email Verification"                 [← Back]  │
├──────────────────────────────────┬──────────────────────────────────────┤
│                                  │                                      │
│  📝 Template Editor              │  👁️ Live Preview                     │
│                                  │                                      │
│  Template Name:                  │  ┌────────────────────────────────┐ │
│  [Email Verification Template]   │  │  📍 Fotolokashen               │ │
│                                  │  │  Coordinate with Purpose       │ │
│  Subject Line:                   │  ├────────────────────────────────┤ │
│  [Confirm your email address]    │  │                                │ │
│                                  │  │  Hi John Doe,                  │ │
│  Category: [System ▼]            │  │                                │ │
│                                  │  │  You are registered! Click the │ │
│  🎨 Customization                │  │  link to confirm your email.   │ │
│  Brand Color:    [#4285f4 🎨]    │  │                                │ │
│  Button Color:   [#4285f4 🎨]    │  │  [Verify Email Address]        │ │
│  Header Start:   [#4285f4 🎨]    │  │                                │ │
│  Header End:     [#5a67d8 🎨]    │  │  This link expires in 30 min.  │ │
│                                  │  │                                │ │
│  📋 Required Variables:          │  └────────────────────────────────┘ │
│  • username                      │                                      │
│  • verificationUrl               │  Device: [💻 Web][📱 iPad][📱 Mobile]│
│  • expiryMinutes                 │                                      │
│                                  │                                      │
│  ✏️ HTML Body:                   │                                      │
│  ┌──────────────────────────────┐│                                      │
│  │ <h2>Verification Email</h2>  ││                                      │
│  │ <p>Hi {{username}},</p>      ││                                      │
│  │ <p>Click to verify:</p>      ││                                      │
│  │ <a href="{{verificationUrl}}">││                                      │
│  │   Verify Email               ││                                      │
│  │ </a>                         ││                                      │
│  └──────────────────────────────┘│                                      │
│                                  │                                      │
│  [💾 Save Draft] [✉️ Send Test] [✅ Publish]                            │
│                                  │                                      │
└──────────────────────────────────┴──────────────────────────────────────┘
```

---

## 🖼️ UI Mockup (Version History)

```
┌─────────────────────────────────────────────────────────────┐
│  Version History - Email Verification Template       [✕]   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Current Version: v4 (Active)                               │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ v4 • 2 days ago • Updated by John Admin              │ │
│  │ Changed subject line and button color                │ │
│  │                                    [View] [Current]   │ │
│  ├───────────────────────────────────────────────────────┤ │
│  │ v3 • 1 week ago • Updated by Jane Admin              │ │
│  │ Added expiry time to message                         │ │
│  │                                    [View] [Restore]   │ │
│  ├───────────────────────────────────────────────────────┤ │
│  │ v2 • 2 weeks ago • Updated by John Admin             │ │
│  │ Updated brand colors                                 │ │
│  │                                    [View] [Restore]   │ │
│  ├───────────────────────────────────────────────────────┤ │
│  │ v1 • 1 month ago • Created by System                 │ │
│  │ Initial template from migration                      │ │
│  │                                    [View] [Restore]   │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│                                            [Close]          │
└─────────────────────────────────────────────────────────────┘
```

---

## 💾 Database vs. File System

### Current (File-based)
```
src/lib/
├── email.ts                    ← Functions to send emails
├── email-templates.ts          ← Hard-coded HTML templates
└── email-preview-utils.ts      ← Static template list

Changes require:
❌ Code editor access
❌ Git commit
❌ Server deployment
❌ Developer knowledge
```

### Proposed (Database-driven)
```
Database:
├── email_templates table       ← All templates stored here
├── email_template_versions     ← Version history
└── email_logs (optional)       ← Sent email tracking

Code:
├── src/lib/email.ts            ← Fetches from DB (with fallback)
├── src/lib/email-templates.ts  ← Defaults (fallback only)
└── src/lib/email-template-service.ts ← New service layer

Admin can:
✅ Edit via web UI
✅ Preview instantly
✅ Revert anytime
✅ No technical skills needed
```

---

## 🔄 Migration Path (Zero Downtime)

**Step 1:** Add new tables (email_templates, email_template_versions)

**Step 2:** Seed defaults from hard-coded templates
```sql
INSERT INTO email_templates (key, name, subject, htmlBody, isDefault)
VALUES (
  'verification',
  'Email Verification Template',
  'Confirm your email address',
  '<html>... current template HTML ...</html>',
  true
);
```

**Step 3:** Update email.ts to check database first, fallback to code
```typescript
async function getTemplate(key: string) {
  // Try database first
  const dbTemplate = await db.emailTemplate.findUnique({ where: { key } });
  if (dbTemplate) return dbTemplate;
  
  // Fallback to hard-coded
  return getHardCodedTemplate(key);
}
```

**Step 4:** Build admin UI (no impact on existing emails)

**Step 5:** Super admins can now customize!

**Result:** Existing emails keep working, new system ready when you are.

---

## 🎯 Real-World Use Cases

### Use Case 1: Brand Refresh
**Scenario:** Company rebrands, changes primary color from blue to purple

**Current System:**
1. Request developer to update colors
2. Developer edits multiple template files
3. Test locally
4. Commit, deploy
5. Wait 10-30 minutes

**Proposed System:**
1. Super admin opens template editor
2. Changes brand color to purple (color picker)
3. Sees instant preview
4. Clicks "Save"
5. Done in 2 minutes ✅

---

### Use Case 2: A/B Testing Subject Lines
**Scenario:** Want to test if "Verify Your Email" performs better than "Confirm Your Email"

**Current System:**
- Can't easily A/B test without complex code changes

**Proposed System:**
1. Duplicate "verification" template
2. Create "verification_test" with new subject
3. Send 50% to each template (future feature)
4. Compare open rates in email logs
5. Keep winning template ✅

---

### Use Case 3: Emergency Content Update
**Scenario:** Verification link has wrong domain, users can't verify

**Current System:**
1. Find developer (might be off-hours)
2. Make code change
3. Emergency deployment
4. High stress, 30+ minutes

**Proposed System:**
1. Super admin logs in
2. Edits verification template
3. Fixes URL
4. Saves
5. Fixed in 2 minutes ✅

---

## 🤔 Your Decision Points

### Question 1: Editor Type
**Option A: Code Editor** (Monaco/VS Code-style)
- Pros: Full control, familiar to technical users
- Cons: Requires HTML knowledge

**Option B: WYSIWYG Builder** (Drag & drop)
- Pros: No code needed, visual
- Cons: Less flexibility, more complex to build

**Option C: Both** (Toggle between code/visual)
- Pros: Best of both worlds
- Cons: More work to implement

**My Recommendation:** Start with Code Editor (Option A), add WYSIWYG later if needed.

---

### Question 2: Version Limits
**Option A: Unlimited versions**
- Keep all changes forever

**Option B: Keep last 10 versions**
- Save database space

**My Recommendation:** Keep last 20 versions, configurable in settings.

---

### Question 3: Template Deletion
**Option A: Soft delete** (mark as inactive)
- Can restore if needed

**Option B: Hard delete** (permanently remove)
- Cleaner database

**My Recommendation:** Soft delete for custom templates, prevent deletion of system templates.

---

### Question 4: Test Email Recipients
**Option A: Current user only**
- Simple, safe

**Option B: Any email address**
- More flexible, needs rate limiting

**My Recommendation:** Current user only to start, add custom recipient later with rate limiting.

---

## ✅ Approval Checklist

Before we start implementation:

- [ ] Approve database schema design
- [ ] Choose editor type (Code / WYSIWYG / Both)
- [ ] Decide on version limit (unlimited / 10 / 20)
- [ ] Decide on deletion policy (soft / hard)
- [ ] Decide on test email recipients (self / custom)
- [ ] Confirm implementation timeline works
- [ ] Any other features you want to add?

---

## 🚀 Ready to Start?

Once you approve the plan, I can:
1. Create the Prisma migration (5 min)
2. Build the email template service (30 min)
3. Create API routes (30 min)
4. Build the UI (2-3 hours)

Let me know your preferences on the decision points and we'll get started! 🎉

