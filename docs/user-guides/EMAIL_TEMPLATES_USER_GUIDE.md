# Email Templates System - User Guide

**Last Updated:** January 22, 2026  
**For:** Super Admins  
**Feature:** Dynamic Email Template Management

---

## 🎯 Overview

The Email Templates System allows super admins to create, edit, and manage email templates without requiring code changes. All email templates are stored in the database with full version control and audit trails.

---

## 📋 Features

- ✅ **Template Management** - Create, edit, delete custom email templates
- ✅ **Live Preview** - See changes in real-time before saving
- ✅ **Version Control** - Track all changes with ability to revert
- ✅ **Brand Customization** - Customize colors for each template
- ✅ **Test Emails** - Send test emails to verify templates
- ✅ **Search & Filter** - Quickly find templates by name, key, or category
- ✅ **Default Protection** - System templates cannot be deleted
- ✅ **Fallback System** - Automatic fallback to hard-coded templates if database unavailable

---

## 🚀 Getting Started

### Accessing Email Templates

1. Log in as a **super_admin**
2. Navigate to **Admin Panel**
3. Click on **"Email Templates"** tab
4. You'll see a list of all email templates

---

## 📝 Managing Templates

### Viewing Templates

The template list shows:

- **Name** - Template display name with "Default" badge for system templates
- **Key** - Unique identifier (e.g., `verification`, `welcome`)
- **Subject** - Email subject line
- **Category** - System, Notification, or Campaign
- **Version** - Current version number
- **Status** - Active or Inactive
- **Updated** - Last modification date
- **Actions** - Edit, Version History, Duplicate, Delete

### Creating a New Template

1. Click **"Create Template"** button
2. Fill in the template details:
   - **Key** - Lowercase letters, numbers, underscores, hyphens only (e.g., `team_invite`)
   - **Name** - Display name (e.g., "Team Invitation Email")
   - **Description** - Purpose of the template (optional)
   - **Category** - System, Notification, or Campaign
   - **Subject** - Email subject line (can use `{{variables}}`)
3. Customize brand colors:
   - Primary Brand Color
   - Button Color
   - Header Gradient Start
   - Header Gradient End
4. Write HTML body in the code editor
   - Use `{{variableName}}` syntax for dynamic content
   - Example: `{{username}}`, `{{verificationUrl}}`
5. Click **"Show Preview"** to see live preview
6. Click **"Save"** to create the template

### Editing a Template

1. Click the **Edit** icon (pencil) on any template
2. Modify any fields except the Key (immutable)
3. Use the live preview to verify changes
4. Click **"Save"** to update
   - This creates a new version automatically
   - Previous version is preserved in history

### Sending Test Emails

1. Save the template first (must have ID)
2. Click **"Send Test"** button
3. Test email will be sent to your email address
4. Check your inbox to verify the template

**Development Mode:**

- In development, emails are logged to console instead of sent
- You'll see the email details in terminal output

---

## 🎨 Using Template Variables

### Standard Variables (Available in All Templates)

```
{{username}}        - User's username
{{email}}           - User's email address
{{firstName}}       - User's first name (if available)
{{lastName}}        - User's last name (if available)
{{appName}}         - Application name (Fotolokashen)
{{appUrl}}          - Application URL
{{currentYear}}     - Current year (e.g., 2026)
{{supportEmail}}    - Support email address
```

### Template-Specific Variables

**Verification Email (`verification`):**

```
{{verificationUrl}} - URL to verify email
```

**Welcome Email (`welcome`):**

```
(Uses standard variables only)
```

**Password Reset (`password_reset`):**

```
{{resetUrl}}        - URL to reset password
```

**Password Changed (`password_changed`):**

```
{{timestamp}}       - When password was changed
{{ipAddress}}       - IP address of change
{{timezone}}        - User's timezone
```

**Account Deletion (`account_deletion`):**

```
(Uses standard variables only)
```

### Variable Syntax

Use double curly braces: `{{variableName}}`

**Example:**

```html
<p>Hi <strong>{{username}}</strong>,</p>
<p>Welcome to {{appName}}!</p>
<p>Click here to verify: <a href="{{verificationUrl}}">Verify Email</a></p>
```

---

## 🔄 Version Control

### Viewing Version History

1. Click the **History** icon on any template
2. See all versions with:
   - Version number
   - Change notes
   - Creator username
   - Creation timestamp
3. Current version is highlighted

### Reverting to Previous Version

1. In version history, find the version you want to restore
2. Click **"Revert"** button
3. Confirm the action
4. A new version is created from the old snapshot
5. You'll be redirected to the template list

**Note:** Reverting doesn't delete history - it creates a new version with the old content.

---

## 🗑️ Deleting Templates

### Custom Templates

- Click the **Delete** icon (trash)
- Confirm deletion
- Template is soft-deleted (marked as inactive)

### Default Templates

- Cannot be deleted
- Delete button is hidden
- These are system-critical templates

**Default Templates:**

- `verification` - Email Verification
- `welcome` - Welcome Email
- `password_reset` - Password Reset
- `password_changed` - Password Changed Notification
- `account_deletion` - Account Deletion Confirmation

---

## 🔍 Search & Filters

### Search

- Type in search box to filter by:
  - Template name
  - Template key
  - Subject line
- Search is real-time (updates as you type)

### Category Filter

- Select category from dropdown:
  - **All Categories** - Show everything
  - **System** - User authentication emails
  - **Notification** - User notifications
  - **Campaign** - Marketing emails

---

## 🎨 Color Customization

Each template has 4 customizable colors:

1. **Primary Brand Color** - Main theme color
2. **Button Color** - Call-to-action button color
3. **Header Gradient Start** - Top of gradient header
4. **Header Gradient End** - Bottom of gradient header

### Using Color Pickers

1. Click the colored box next to the hex input
2. Visual color picker appears
3. Click anywhere on the picker to choose color
4. Or type hex code directly (e.g., `#4285f4`)
5. Color updates immediately

---

## 💡 Best Practices

### Template Keys

- Use lowercase letters only
- Separate words with underscores: `team_invite`
- Keep keys short and descriptive
- Never change key after creation

### Subject Lines

- Keep under 50 characters when possible
- Use variables for personalization: `Welcome, {{username}}!`
- Avoid ALL CAPS
- Be descriptive and clear

### HTML Content

- Test with multiple email clients
- Use inline CSS (most email clients don't support `<style>` tags)
- Keep width under 600px for better mobile display
- Use tables for layout (better email client support)
- Always include alt text for images
- Provide plain text fallback

### Colors

- Ensure good contrast for accessibility
- Test colors on light and dark backgrounds
- Stick to brand guidelines
- Use web-safe colors when possible

### Variables

- Only use variables that are actually provided
- Check required variables for each template type
- Provide default values in template when possible
- Test with real data before going live

---

## ⚠️ Troubleshooting

### Template Not Sending

- **Check:** Is template marked as Active?
- **Check:** Are all required variables provided in code?
- **Check:** Is email service configured (Resend API key)?
- **Fix:** Review console logs for error messages

### Variables Not Rendering

- **Check:** Correct syntax `{{variable}}` not `{variable}`
- **Check:** Variable name matches exactly (case-sensitive)
- **Check:** Variable is available for this template type
- **Fix:** Review available variables list above

### Preview Not Showing

- **Check:** HTML is valid (no unclosed tags)
- **Check:** Browser console for errors
- **Fix:** Use Monaco editor's format feature
- **Fix:** Validate HTML in external tool

### Can't Delete Template

- **Reason:** Default templates cannot be deleted
- **Alternative:** Create custom version and deactivate default
- **Note:** Deletion is soft delete (can be recovered by dev)

### Test Email Not Arriving

- **Check:** Development mode logs to console, not email
- **Check:** Production mode requires EMAIL_API_KEY
- **Check:** Spam/junk folder
- **Wait:** Can take 1-2 minutes in production

---

## 🔒 Permissions

**Super Admin Only:**

- ✅ View all templates
- ✅ Create new templates
- ✅ Edit existing templates
- ✅ Delete custom templates
- ✅ View version history
- ✅ Revert to previous versions
- ✅ Send test emails

**Staffers & Users:**

- ❌ No access to template management
- ❌ Cannot view admin panel

---

## 📊 Performance Tips

### For Best Performance:

1. **Keep HTML concise** - Larger templates take longer to load
2. **Use caching** - Templates are cached for 5 minutes automatically
3. **Optimize images** - Use compressed images or external CDN
4. **Test thoroughly** - Prevent frequent edits by testing first

### Cache Invalidation:

- Cache is automatically cleared when template is updated
- No manual action needed
- New version is cached immediately

---

## 🆘 Getting Help

### Support Channels:

- **Technical Issues:** Contact development team
- **Template Design:** Contact design team
- **Email Delivery:** Check email service status (Resend)

### Common Resources:

- **HTML Email Guide:** [Really Good Emails](https://reallygoodemails.com/)
- **Email Testing:** [Litmus](https://litmus.com/) or [Email on Acid](https://www.emailonacid.com/)
- **Handlebars Docs:** [handlebarsjs.com](https://handlebarsjs.com/)

---

## 📈 Future Enhancements

**Planned Features:**

- 📋 Drag-and-drop email builder
- 📋 Pre-built content blocks library
- 📋 Image uploader for inline images
- 📋 A/B testing support
- 📋 Template analytics (open rate, click rate)
- 📋 Multi-language support
- 📋 Responsive preview (mobile/tablet/desktop)

---

## ✅ Quick Reference

| Task            | Steps                             |
| --------------- | --------------------------------- |
| Create Template | Click "Create" → Fill form → Save |
| Edit Template   | Click Edit icon → Modify → Save   |
| Send Test       | Save first → Click "Send Test"    |
| View History    | Click History icon → See versions |
| Revert Version  | History → Select version → Revert |
| Delete Template | Click Delete icon → Confirm       |
| Search          | Type in search box                |
| Filter          | Select category dropdown          |

---

**Need Help?** Contact your system administrator or development team.

**Version:** 1.0  
**Last Updated:** January 22, 2026
