# Role-Based Permissions Implementation

**Date:** January 22, 2026  
**Status:** 🔄 In Progress  
**Decision:** Two-tier system with "staffer" role name + ProjectMember table

---

## ✅ Completed Steps

- [x] **Step 1:** Added `role` field to User model in Prisma schema
- [x] **Step 2:** Created ProjectMember model in Prisma schema
- [x] **Step 3:** Created permission helper functions in `src/lib/permissions.ts`
- [x] **Step 4:** Updated `AdminRoute.tsx` to use `canAccessAdminPanel()`

---

## 🔄 Next Steps

### Database Migration

**Note:** Requires `DATABASE_URL` environment variable to be set.

```bash
# When ready to run migration:
npx prisma migrate dev --name add_role_based_permissions
```

The migration will:
1. Add `role` column to `users` table (default: "user")
2. Create `project_members` table
3. Keep `isAdmin` field for backward compatibility during transition

### Manual Data Migration (After Prisma Migration)

You'll need to decide which existing admins should be:
- **`super_admin`** - You (founder) and co-founders
- **`staffer`** - Support team members

**Option 1: Update via SQL (direct database)**
```sql
-- Set your account to super_admin (replace with your user ID)
UPDATE users SET role = 'super_admin' WHERE id = YOUR_USER_ID;

-- Set other admins to staffer
UPDATE users SET role = 'staffer' WHERE "isAdmin" = true AND id != YOUR_USER_ID;
```

**Option 2: Update via Prisma Script** (create `scripts/migrate-roles.ts`)
```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Update your account (replace with your email or ID)
  await prisma.user.update({
    where: { email: 'your-email@example.com' },
    data: { role: 'super_admin' }
  });
  
  console.log('✅ Updated founder to super_admin');
  
  // Update all other admins to staffer
  const result = await prisma.user.updateMany({
    where: {
      isAdmin: true,
      NOT: { email: 'your-email@example.com' }
    },
    data: { role: 'staffer' }
  });
  
  console.log(`✅ Updated ${result.count} admins to staffer`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

---

## 📝 Components to Update

### Priority 1: Admin-Related (13 files found)

1. ✅ **`src/components/auth/AdminRoute.tsx`** - DONE
2. ⏳ **`src/components/admin/UserManagementTable.tsx`** - Update to show/edit roles
3. ⏳ **`src/components/layout/AuthButton.tsx`** - Update admin link check
4. ⏳ **`src/components/locations/LocationList.tsx`** - Update permission check
5. ⏳ **`src/components/locations/SaveLocationForm.tsx`** - Update admin check
6. ⏳ **`src/components/locations/EditLocationForm.tsx`** - Update admin check

### Search for All Usages

```bash
# Find all files using isAdmin
grep -r "isAdmin" --include="*.ts" --include="*.tsx" src/
```

---

## 🎯 Testing Checklist

### Before Migration
- [ ] Backup production database
- [ ] Test migration on development database
- [ ] Verify schema changes with `npx prisma migrate diff`

### After Migration
- [ ] Verify `role` field exists on User table
- [ ] Verify `project_members` table created
- [ ] Confirm your account is `super_admin`
- [ ] Test admin panel access with different roles
- [ ] Verify backward compatibility (isAdmin still works)

### Component Testing
- [ ] Admin panel accessible by staffer and super_admin
- [ ] Regular users cannot access admin panel
- [ ] User management table shows role column
- [ ] Super admin can change user roles
- [ ] Staffers cannot change user roles
- [ ] Location type access works correctly
- [ ] All existing functionality still works

---

## 🚀 Deployment Steps

### Development
1. Run Prisma migration
2. Update your account to super_admin
3. Update other admins to staffer
4. Update all components
5. Test thoroughly
6. Commit changes

### Production
1. Backup database
2. Run migration: `npx prisma migrate deploy`
3. Run role update script
4. Deploy code changes
5. Verify admin access works
6. Monitor for issues

---

## 📊 Permission Matrix Reference

| Action | Regular User | Staffer | Super Admin |
|--------|-------------|---------|-------------|
| Access admin panel | ❌ | ✅ | ✅ |
| View user management | ❌ | ✅ | ✅ |
| Resend verification emails | ❌ | ✅ | ✅ |
| Change user roles | ❌ | ❌ | ✅ |
| Send system emails | ❌ | ❌ | ✅ |
| Edit email templates | ❌ | ❌ | ✅ |
| Delete any user | ❌ | ❌ | ✅ |

---

## 🔍 Files Modified

1. `prisma/schema.prisma` - Added role field, ProjectMember model
2. `src/lib/permissions.ts` - Added role-based permission functions
3. `src/components/auth/AdminRoute.tsx` - Uses canAccessAdminPanel()

---

## 📌 Notes

- **Backward Compatibility:** `isAdmin` field kept during transition
- **Role Names:** Using "staffer" (not "staff") for consistency
- **Project Members:** New table for fine-grained project permissions
- **Migration:** Non-breaking, existing apps continue to work
- **Future:** Can deprecate `isAdmin` field after full migration

---

## 🆘 Troubleshooting

**Issue:** Migration fails with DATABASE_URL error
- **Solution:** Ensure `.env` file has DATABASE_URL set

**Issue:** Can't access admin panel after migration
- **Solution:** Verify your account role is set to 'super_admin' or 'staffer'

**Issue:** Components still checking isAdmin
- **Solution:** Update to use permission helper functions from `src/lib/permissions.ts`

---

**Ready for next step?** Set DATABASE_URL and run the Prisma migration!
