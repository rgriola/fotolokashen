# Admin User Management - Quick Start Guide

**Date**: 2026-01-02  
**Status**: ✅ Ready to Test

---

## 🚀 Quick Start

### **1. Create an Admin User**

First, you need to grant admin privileges to a user. In your database:

```sql
-- PostgreSQL (Neon)
UPDATE users 
SET "isAdmin" = true 
WHERE email = 'your@email.com';
```

Or using Prisma Studio:
1. Run `npm run prisma:studio`
2. Open `users` table
3. Find your user
4. Set `isAdmin` to `true`
5. Save

### **2. Access the Admin Page**

1. **Log in** as the admin user
2. Click **profile dropdown** (top right, avatar icon)
3. Click **"Admin"** menu item (Shield icon)
4. You'll be taken to `/admin/users`

### **3. Test Features**

**Search Users:**
- Type in the search box to filter by name or email

**Sort Users:**
- Click "Name", "Email", or "Created" column headers
- Click again to reverse order

**Delete a User:**
1. Click the **trash icon** on any row
2. Modal opens with user details
3. Type **DELETE** (must be uppercase)
4. Click **"Delete User"**
5. User is permanently removed

---

## 📁 Files Created

```
src/
├── app/
│   ├── admin/
│   │   └── users/
│   │       └── page.tsx                    (Admin page)
│   └── api/
│       └── admin/
│           └── users/
│               ├── route.ts                (GET all users)
│               └── [id]/
│                   └── route.ts            (DELETE user)
└── components/
    └── admin/
        ├── UserManagementTable.tsx         (Main table)
        └── DeleteUserModal.tsx             (Delete confirmation)
```

**Modified Files:**
```
src/components/layout/AuthButton.tsx        (Added Admin menu item)
```

---

## ✅ What Works

- ✅ Admin-only access (non-admins get redirected)
- ✅ View all users in paginated table (10 per page)
- ✅ Search by name, email, username
- ✅ Sort by name, email, created date
- ✅ See all user fields (18 columns)
- ✅ Delete confirmation with typed "DELETE"
- ✅ Hard delete (user + sessions + locations + photos + saves)
- ✅ ImageKit CDN photo deletion
- ✅ Audit logging (SecurityLog entries)
- ✅ Cannot delete own account
- ✅ Success/error toast notifications
- ✅ Admin menu in profile dropdown (shield icon)

---

## 🧪 Testing Checklist

### **Basic Access**
- [ ] Log in as admin → See "Admin" in profile dropdown
- [ ] Click "Admin" → Go to `/admin/users`
- [ ] Log in as non-admin → No "Admin" in dropdown
- [ ] Try `/admin/users` as non-admin → Redirected to home

### **User Table**
- [ ] Table shows all users
- [ ] All 18 columns display correctly
- [ ] Status badges color-coded (green/red/purple/gray)
- [ ] Counts show correct numbers

### **Search**
- [ ] Search by email → Filters correctly
- [ ] Search by name → Filters correctly
- [ ] Search by username → Filters correctly
- [ ] Clear search → Shows all users

### **Sorting**
- [ ] Click "Name" → Sorts by firstName/lastName/username
- [ ] Click "Email" → Sorts by email
- [ ] Click "Created" → Sorts by createdAt
- [ ] Click again → Reverses order

### **Pagination**
- [ ] Shows "Page 1 of X"
- [ ] Click "Next" → Goes to page 2
- [ ] Click "Previous" → Goes back to page 1
- [ ] Previous disabled on page 1
- [ ] Next disabled on last page

### **Delete User**
- [ ] Click trash icon → Modal opens
- [ ] Modal shows correct user details
- [ ] Modal shows deletion counts
- [ ] Type "delete" (lowercase) → Button stays disabled
- [ ] Type "DELETE" (uppercase) → Button enables
- [ ] Click "Cancel" → Modal closes, no deletion
- [ ] Click "Delete User" → User deleted
- [ ] Success toast appears
- [ ] Table refreshes, user gone
- [ ] Try to delete own account → Error message

### **Delete Verification**
- [ ] Check database → User record deleted
- [ ] Check database → Sessions deleted (cascade)
- [ ] Check database → Locations deleted (cascade)
- [ ] Check database → Photos deleted (cascade)
- [ ] Check database → Saves deleted (cascade)
- [ ] Check ImageKit dashboard → Photos removed from CDN
- [ ] Check security_logs → Audit entry created with admin ID
- [ ] Try to login as deleted user → Fails

---

## 🔧 Environment Variables Needed

Make sure you have:

```bash
# .env.local
DATABASE_URL="postgresql://..."
NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY="..."
IMAGEKIT_PRIVATE_KEY="..."
NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT="..."
```

All should already be set if the app is running.

---

## 🐛 Troubleshooting

**"Admin" menu item not showing?**
- Check user's `isAdmin` field in database
- Log out and log back in
- Clear browser cache

**"Unauthorized" error?**
- Make sure user is admin (`isAdmin = true`)
- Check session is valid
- Try logging out and back in

**Delete button doesn't work?**
- Must type "DELETE" in all capitals
- Case-sensitive validation

**Photos not deleting from ImageKit?**
- Check IMAGEKIT_PRIVATE_KEY is set
- Check ImageKit dashboard for errors
- Database photos will still delete even if CDN fails

**Can't access page?**
- Make sure you're logged in
- Make sure user is admin
- Check browser console for errors

---

## 📊 Database Schema Used

**User Table:**
```typescript
{
  id: number
  email: string
  username: string
  firstName: string | null
  lastName: string | null
  isAdmin: boolean  // ← This enables admin access
  // ... all other fields
}
```

**Cascade Deletions:**
- When user is deleted, Prisma automatically deletes:
  - Sessions (onDelete: Cascade)
  - Locations created (onDelete: Cascade)
  - Photos uploaded (onDelete: Cascade)
  - Saved locations (onDelete: Cascade)
  - Security logs (onDelete: Cascade)

---

## 🎉 You're Ready!

The admin user management feature is fully implemented and ready to use.

**Test it now:**
1. Make yourself admin in the database
2. Log in
3. Click "Admin" in profile dropdown
4. Explore the user management table!

**Need help?** Check `ADMIN_USER_MANAGEMENT_COMPLETE.md` for full details.
