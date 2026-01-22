# Role-Based Permissions System Proposal

**Date:** January 22, 2026  
**Status:** 🔄 Proposal / Architecture Decision Required  
**Context:** Email preview feature needs proper permission structure for app-wide vs. team/project-level admin access

---

## 🎯 Problem Statement

You've identified a critical architectural need:

1. **App Founders/Staff** (like you) need **site-wide privileges** to:
   - Manage all users
   - Send system-wide announcements
   - Access admin tools (email preview, user management)
   - Moderate content across all teams/projects

2. **Team/Project Admins** need **scoped privileges** to:
   - Manage their team members
   - Send emails to their team/project members
   - Configure team/project settings
   - Access team/project analytics

3. **Current Limitation:**
   - Simple `isAdmin` boolean doesn't distinguish between levels
   - No concept of "super admin" vs. "team admin"
   - No scoped permissions for teams/projects

---

## 🏗️ Current Database Structure

### User Model (Current)
```prisma
model User {
  isAdmin Boolean @default(false)  // ⚠️ Too simple for your needs
  // ...other fields
}
```

### Team/Project Models (Current)
```prisma
model TeamMember {
  role String @default("viewer")  // ✅ Has role concept, but limited
}

model Project {
  userId Int  // ✅ Has owner concept
}
```

**Current Roles in TeamMember:**
- Likely: "viewer", "editor", "admin" (needs verification)

---

## ✨ Proposed Solution: Multi-Level Role System

### Option 1: Simple Two-Tier System (Recommended)

**Best for:** Quick implementation, clear separation of concerns

```prisma
model User {
  // Global Permissions
  role            String  @default("user")  // "user", "staff", "super_admin"
  
  // Legacy field (keep for backward compatibility during migration)
  isAdmin         Boolean @default(false)
  
  // ...existing fields
}

model TeamMember {
  role String @default("viewer")  // "viewer", "editor", "admin", "owner"
}

model Project {
  userId Int  // Owner
  members ProjectMember[]  // Add new model for project permissions
}

// New model for project-level permissions
model ProjectMember {
  id         Int      @id @default(autoincrement())
  projectId  Int
  userId     Int
  role       String   @default("viewer")  // "viewer", "editor", "admin", "owner"
  addedAt    DateTime @default(now())
  
  project    Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@unique([projectId, userId])
}
```

**Global Roles:**
- `"user"` - Regular user (default)
- `"staff"` - App staff with elevated privileges
- `"super_admin"` - Founder/CTO with full access 

**Team/Project Roles:**
- `"viewer"` - Can view
- `"editor"` - Can edit content
- `"admin"` - Can manage members, send team emails 
- `"owner"` - Full control, can delete team/project 

---

### Option 2: Granular Permissions System

**Best for:** Fine-grained control, enterprise-level needs

```prisma
model User {
  role          String       @default("user")
  permissions   Permission[]
}

model Permission {
  id          Int      @id @default(autoincrement())
  userId      Int
  scope       String   // "global", "team:{teamId}", "project:{projectId}"
  permission  String   // "manage_users", "send_emails", "view_analytics"
  grantedAt   DateTime @default(now())
  grantedBy   Int?
  
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@unique([userId, scope, permission])
}
```

**Permission Examples:**
- Global: `"global:manage_users"`, `"global:send_system_emails"`
- Team: `"team:123:send_emails"`, `"team:123:manage_members"`
- Project: `"project:456:edit_locations"`, `"project:456:invite_members"`

---

## 📊 Comparison Matrix

| Feature |                 Option 1: Two-Tier  | Option 2: Granular |
|---------|                 ------------------- |-------------------|
| **Implementation Time**   | 🟢 2-3 hours      | 🟡 1-2 days |
| **Complexity**            | 🟢 Simple         | 🔴 Complex |
| **Flexibility**           | 🟡 Good enough    | 🟢 Very flexible |
| **Database Queries**      | 🟢 Fast           | 🟡 Slower (joins) |
| **Migration Effort**      | 🟢 Easy           | 🔴 Significant |
| **Future-Proof**          | 🟡 Sufficient     | 🟢 Highly scalable |
| **Maintenance**           | 🟢 Low            | 🔴 Higher |

---

## 🎯 Recommended Approach: Option 1 (Two-Tier)

### Why?

1. **Your Immediate Need:** Distinguish between app staff and team admins
2. **Simple Mental Model:** Easy to understand "global role" vs. "team role"
3. **Quick Implementation:** Can ship email features this week
4. **Future Migration Path:** Can upgrade to granular permissions later if needed

### Implementation Steps

#### Step 1: Database Migration
```prisma
// Add new role field
role String @default("user")

// Keep isAdmin for backward compatibility
// Will deprecate after migration
```

#### Step 2: Migration Script
```typescript
// Set existing isAdmin=true users to "staff" or "super_admin"
// You decide who gets super_admin vs staff
await prisma.user.updateMany({
  where: { isAdmin: true },
  data: { role: 'staff' }  // or 'super_admin' for founders
});
```

#### Step 3: Create Permission Helpers
```typescript
// src/lib/permissions.ts

export type GlobalRole = 'user' | 'staff' | 'super_admin';
export type TeamRole = 'viewer' | 'editor' | 'admin' | 'owner';
export type ProjectRole = 'viewer' | 'editor' | 'admin' | 'owner';

export function canAccessAdminPanel(user: User): boolean {
  return user.role === 'staff' || user.role === 'super_admin';
}

export function canSendSystemEmails(user: User): boolean {
  return user.role === 'super_admin';
}

export function canManageAllUsers(user: User): boolean {
  return user.role === 'super_admin';
}

export function canSendTeamEmails(user: User, teamRole: TeamRole): boolean {
  return teamRole === 'admin' || teamRole === 'owner';
}

export function canManageTeamMembers(user: User, teamRole: TeamRole): boolean {
  return teamRole === 'admin' || teamRole === 'owner';
}
```

#### Step 4: Update Components
```typescript
// Replace isAdmin checks with role checks

// OLD:
if (user.isAdmin) { ... }

// NEW:
import { canAccessAdminPanel } from '@/lib/permissions';
if (canAccessAdminPanel(user)) { ... }
```

---

## 📧 Email Feature Permission Structure

### Email Types & Required Permissions

| Email Type | Permission Required | Description |
|------------|-------------------|-------------|
| **System Announcements** | `role: 'super_admin'` | Site-wide emails to all users |
| **Team Notifications** | Team `role: 'admin'` or `'owner'` | Emails to team members |
| **Project Updates** | Project `role: 'admin'` or `'owner'` | Emails to project collaborators |
| **User Re-verification** | `role: 'staff'` or `'super_admin'` | Resend verification emails |
| **Template Editing** | `role: 'super_admin'` | Modify global email templates |

### Admin Panel Structure

```
/admin
├── /users              # Staff + Super Admin
├── /email-preview      # Staff + Super Admin (view only)
├── /email-templates    # Super Admin only (edit)
└── /email-campaigns    # New feature
    ├── /system         # Super Admin only
    └── /team/:teamId   # Team Admin only (for their team)
```

---

## 🚀 Migration Checklist

- [ ] **Step 1:** Add `role` field to User model in Prisma schema
- [ ] **Step 2:** Create migration: `npx prisma migrate dev --name add_user_roles`
- [ ] **Step 3:** Run data migration script to set existing admins
- [ ] **Step 4:** Create `src/lib/permissions.ts` helper file
- [ ] **Step 5:** Update `AdminRoute.tsx` to use new permission system
- [ ] **Step 6:** Replace all `isAdmin` checks in components
- [ ] **Step 7:** Update auth context to include role
- [ ] **Step 8:** Add role selector in User Management table (super admin only)
- [ ] **Step 9:** Test all admin features
- [ ] **Step 10:** Deploy to production

---

## 🔐 Security Considerations

1. **Role Assignment:**
   - Only super_admin can change user roles
   - Prevent users from elevating their own role
   - Log all role changes in SecurityLog

2. **API Endpoints:**
   - Server-side validation of permissions
   - Never trust client-side role checks
   - Return 403 Forbidden for unauthorized access

3. **Team/Project Scoping:**
   - Verify user has role in specific team/project
   - Don't leak data across team boundaries
   - Team admins can only see their team's data

---

## 💡 Example: Email Feature with Permissions

```typescript
// src/app/api/admin/send-email/route.ts

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const user = await prisma.user.findUnique({
    where: { id: session.user.id }
  });

  const { emailType, recipients, teamId, projectId } = await req.json();

  // Check permissions based on email type
  if (emailType === 'system_announcement') {
    if (user.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Super admin access required' },
        { status: 403 }
      );
    }
  }

  if (emailType === 'team_notification') {
    const teamMember = await prisma.teamMember.findFirst({
      where: { userId: user.id, teamId }
    });
    
    if (!teamMember || !['admin', 'owner'].includes(teamMember.role)) {
      return NextResponse.json(
        { error: 'Team admin access required' },
        { status: 403 }
      );
    }
  }

  // Send email...
}
```

---

## 📝 Your Decision Needed

**Questions to answer:**

1. **Role Names:** Do you like `"staff"` and `"super_admin"`, or prefer different names?
   - Alternatives: `"moderator"`, `"administrator"`, `"owner"`

2. **Your Role:** Should you be `"super_admin"` since you're the founder?

3. **Staff Members:** How many app staff members do you have who need `"staff"` role?

4. **Timeline:** Can we implement this before building the email feature?

5. **Project Members:** Do you need `ProjectMember` model, or is `Project.userId` (owner) sufficient for now?

---

## 🎬 Next Steps

Once you decide:

1. I'll implement the chosen permission system
2. Create migration scripts
3. Update all components to use new permissions
4. Build the email feature with proper permission checks

**Let me know which option you prefer and any naming preferences!**
