# Permission System Visual Guide

## Current System (Simple Boolean)

```
┌─────────────────────────────────────┐
│           All Users                 │
│  isAdmin: false (can use app)       │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│         App Admins                  │
│  isAdmin: true (full access)        │
└─────────────────────────────────────┘
```

**Problem:** You (founder) and team admins have same privileges! ❌

---

## Proposed System (Two-Tier Roles)

```
┌──────────────────────────────────────────────────────────┐
│                    GLOBAL SCOPE                          │
│                                                          │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────┐│
│  │  Regular User  │  │   App Staff    │  │Super Admin ││
│  │  role: "user"  │  │ role: "staff"  │  │role: "SA"  ││
│  │                │  │                │  │            ││
│  │ • Use app      │  │ • Admin panel  │  │ • Manage   ││
│  │ • Save locs    │  │ • View users   │  │   ALL users││
│  │ • Upload photos│  │ • Resend emails│  │ • System   ││
│  │ • Join teams   │  │ • Moderate     │  │   emails   ││
│  │                │  │   content      │  │ • Edit     ││
│  │                │  │                │  │   templates││
│  └────────────────┘  └────────────────┘  └────────────┘│
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│                  TEAM/PROJECT SCOPE                      │
│                                                          │
│  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────────┐   │
│  │ Viewer │  │ Editor │  │ Admin  │  │   Owner    │   │
│  │        │  │        │  │        │  │            │   │
│  │ • View │  │ • Edit │  │ • Invite│ │ • Full ctrl│   │
│  │   only │  │   locs │  │   members│ │ • Delete   │   │
│  │        │  │        │  │ • Send │  │   team     │   │
│  │        │  │        │  │   emails│ │            │   │
│  └────────┘  └────────┘  └────────┘  └────────────┘   │
└──────────────────────────────────────────────────────────┘
```

---

## Real-World Examples

### Scenario 1: You (Founder)
```
👤 Your Account
├─ Global Role: "super_admin" ✅
│  └─ Can: Manage all users, send system emails, edit templates
│
└─ Also a regular user ✅
   └─ Can: Save locations, upload photos, create projects
```

### Scenario 2: App Support Staff
```
👤 Support Team Member
├─ Global Role: "staff" ✅
│  └─ Can: View admin panel, help users, resend verification emails
│
└─ Cannot: Send system-wide emails, change user roles ❌
```

### Scenario 3: Team Leader (No App Staff Role)
```
👤 Film Production Team Leader
├─ Global Role: "user" (regular user)
│  └─ Cannot access app admin panel ❌
│
└─ Team "Awesome Productions" ✅
   ├─ Team Role: "owner"
   └─ Can: 
      • Send emails to team members ✅
      • Invite/remove team members ✅
      • Manage team projects ✅
      • Access team analytics ✅
```

### Scenario 4: Project Collaborator
```
👤 Photographer Hired for Project
├─ Global Role: "user"
│  └─ Regular app access
│
├─ Team "Awesome Productions"
│  └─ Team Role: "viewer" (can see team, can't edit)
│
└─ Project "Summer Fashion Shoot"
   └─ Project Role: "editor"
       └─ Can:
          • Add photos to project ✅
          • Edit location notes ✅
          • Cannot: Delete project ❌
          • Cannot: Send emails to project members ❌
```

---

## Email Permission Matrix

| Email Type                                | Super Admin   | Staff     | Team Admin        | Project Admin         | Regular User |
|------------                               |------------   |-------    |------------       |---------------        |--------------|
| **System Announcement** (to all users)    | ✅ Yes        | ❌ No     | ❌ No             | ❌ No                 | ❌ No |
| **Resend Verification**                   | ✅ Yes        | ✅ Yes    | ❌ No             | ❌ No                 | ❌ No |
| **Team Notification**                     | ✅ Yes*       | ❌ No     | ✅ Yes (own team) | ❌ No                 | ❌ No |
| **Project Update**                        | ✅ Yes*       | ❌ No     | ❌ No             | ✅ Yes (own project)  | ❌ No |
| **Edit Email Templates**                  | ✅ Yes        | ❌ No     | ❌ No             | ❌ No                 | ❌ No |

*Super admin can send to any team/project (emergency use only)

---

## Database Changes Summary

### Before
```sql
users
├─ id
├─ email
├─ username
└─ isAdmin (boolean)  ← Only field for permissions
```

### After
```sql
users
├─ id
├─ email
├─ username
├─ isAdmin (boolean)  ← Keep for backward compatibility
└─ role (string)      ← NEW! "user" | "staff" | "super_admin"

team_members
├─ userId
├─ teamId
└─ role (string)      ← Already exists! "viewer" | "editor" | "admin" | "owner"

project_members (NEW TABLE)
├─ userId
├─ projectId
└─ role (string)      ← NEW! "viewer" | "editor" | "admin" | "owner"
```

---

## Migration Impact

### Low Risk ✅
- Adding `role` field with default value "user"
- Existing `isAdmin` stays functional during transition
- No breaking changes to current features

### Changes Required
- [ ] Update 13 components that check `isAdmin`
- [ ] Add permission helper functions
- [ ] Update admin panel navigation
- [ ] Add role selector in user management (super admin only)

### Estimated Time
- Database migration: 15 minutes
- Permission helpers: 30 minutes
- Component updates: 1-2 hours
- Testing: 1 hour
- **Total: ~3-4 hours**

---

## Your Decision Points

### 1. Role Names
Choose your preferred terminology:

**Option A (Recommended):**
- `"user"` (regular)
- `"staff"` (app team)
- `"super_admin"` (founder/CTO)

**Option B (Corporate):**
- `"user"` (regular)
- `"moderator"` (app team)
- `"administrator"` (founder/CTO)

**Option C (Simple):**
- `"user"` (regular)
- `"admin"` (app team)
- `"owner"` (founder/CTO)

### 2. Your Initial Setup
- Make yourself: `"super_admin"` ✅
- Current admins become: `"staff"` (unless they're also founders)

### 3. Team Roles (Already Good!)
Current `TeamMember.role` probably already has:
- `"viewer"`, `"editor"`, `"admin"`, `"owner"`

### 4. Project Roles (New)
Should we add `ProjectMember` table for project-level permissions?
- 👍 **Yes** - Better for team projects with multiple collaborators
- 👎 **No** - Keep simple, just `Project.userId` as owner

---

## Quick Start Implementation

Want to proceed? Here's the fast path:

1. **I'll create the migration** (add `role` field)
2. **I'll update your account** to `"super_admin"`
3. **I'll add permission helpers** (`canAccessAdminPanel`, etc.)
4. **I'll update all 13 components** that use `isAdmin`
5. **Ready to build email feature!** 🚀

**Estimated time: 3-4 hours of development work**

Ready to proceed? Let me know your preferences! 🎯
