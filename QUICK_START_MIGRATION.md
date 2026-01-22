# Quick Start: Run the Migration

**Ready to deploy the role-based permission system!**

---

## 🎯 What You Need to Do

### 1. Ensure DATABASE_URL is Set

Check if your `.env` file has the database connection string:

```bash
cat .env | grep DATABASE_URL
```

If it's not set, add it:

```
DATABASE_URL="postgresql://user:password@host:port/database"
```

### 2. Run the Prisma Migration

```bash
npx prisma migrate dev --name add_role_based_permissions
```

**This will:**
- Add `role` column to users table (default: "user")
- Create `project_members` table
- Update Prisma Client

### 3. Set Your Role to Super Admin

**Find your user ID first:**

```bash
npx prisma studio
```

Or use SQL:

```sql
SELECT id, email, username, "isAdmin", role FROM users WHERE email = 'your-email@example.com';
```

**Then update your role:**

```sql
-- Replace YOUR_USER_ID with your actual ID
UPDATE users SET role = 'super_admin' WHERE id = YOUR_USER_ID;
```

**Or via Prisma Studio:**
1. Run `npx prisma studio`
2. Click on "users" table
3. Find your account
4. Click on the `role` field
5. Change from "user" to "super_admin"
6. Save

### 4. Verify It Works

Try accessing the admin panel at `/admin/users`

You should now see the admin panel! ✅

---

## 🔍 Quick Test

```typescript
// In browser console on any page:
console.log('User role:', user?.role);
```

It should show `"super_admin"` for your account.

---

## ⚡ That's It!

You're now ready to build the email feature with proper permissions!

**Next:** Update the remaining components and build the email campaigns feature.

---

**Questions?** Check `docs/implementation/ROLE_PERMISSIONS_SUMMARY.md` for the full guide.
