# Username Normalization Fix

**Date:** January 13, 2026  
**Issue:** Mixed-case usernames in database causing API lookup failures

---

## 🐛 Problem Discovered

User "Benglish" (with capital B) was stored in database, but API calls with lowercase "benglish" were failing with 404 errors.

### Root Cause
1. **Registration Form**: Did not force lowercase usernames
2. **API Endpoints**: Used case-sensitive lookups
3. **Existing Data**: Database contained mixed-case usernames

---

## ✅ Solution Implemented

### 1. Frontend Validation (RegisterForm.tsx)
```typescript
// BEFORE:
username: z
  .string()
  .min(3, 'Username must be at least 3 characters')
  .max(50, 'Username must be less than 50 characters')
  .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens'),

// AFTER:
username: z
  .string()
  .min(3, 'Username must be at least 3 characters')
  .max(50, 'Username must be less than 50 characters')
  .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens')
  .toLowerCase()  // ← Forces lowercase
  .trim(),        // ← Removes whitespace
```

### 2. Backend Validation (register/route.ts)
```typescript
// Same .toLowerCase().trim() added to backend schema
const registerSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(50, 'Username must be less than 50 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens')
    .toLowerCase()  // ← Forces lowercase
    .trim(),
  // ...
});
```

### 3. API Endpoints - Case-Insensitive Lookups

#### User Profile API (/api/v1/users/[username]/route.ts)
```typescript
// BEFORE:
const user = await prisma.user.findUnique({
  where: { username: normalizeUsername(cleanUsername) },
  // ...
});

// AFTER:
const user = await prisma.user.findFirst({
  where: { 
    username: {
      equals: normalizeUsername(cleanUsername),
      mode: 'insensitive'  // ← Case-insensitive lookup
    }
  },
  // ...
});
```

#### Locations API (/api/v1/users/[username]/locations/route.ts)
```typescript
// Same case-insensitive lookup pattern applied
const user = await prisma.user.findFirst({
  where: { 
    username: {
      equals: normalizeUsername(cleanUsername),
      mode: 'insensitive'
    }
  },
  select: { id: true, username: true },
});
```

---

## 🧪 Testing Results

### Before Fix:
```bash
curl "http://localhost:3000/api/v1/users/benglish/locations?limit=5"
# Result: {"error":"User not found","code":"USER_NOT_FOUND"}
```

### After Fix:
```bash
curl "http://localhost:3000/api/v1/users/benglish/locations?limit=5"
# Result: Success! Returns Benglish's public locations

curl "http://localhost:3000/api/v1/users/Benglish/locations?limit=5"
# Result: Also works! (case-insensitive)

curl "http://localhost:3000/api/v1/users/BENGLISH/locations?limit=5"
# Result: Also works! (case-insensitive)
```

---

## 📊 Impact

### Existing Users
- **No Migration Needed**: Case-insensitive lookups handle existing mixed-case usernames
- Users like "Benglish", "RGriola" will work with any case variation in API calls

### Future Users
- **All New Usernames**: Automatically stored as lowercase
- **Profile URLs**: Consistent (@username always lowercase)
- **API Calls**: Accept any case but return canonical lowercase

---

## 🔒 Related Files Modified

1. **src/components/auth/RegisterForm.tsx** - Frontend validation
2. **src/app/api/auth/register/route.ts** - Backend validation
3. **src/app/api/v1/users/[username]/route.ts** - User profile API
4. **src/app/api/v1/users/[username]/locations/route.ts** - Locations API

---

## 📝 Additional Context

### Why This Matters
1. **URLs**: `/@benglish` and `/@Benglish` should work identically
2. **API Consistency**: Mobile apps can query without case sensitivity
3. **User Experience**: Less confusion about username capitalization
4. **Database Integrity**: Future usernames stored consistently

### Why We Keep Existing Usernames
- **No Breaking Changes**: Existing users keep their capitalization in display
- **Backward Compatible**: API works with all case variations
- **Gradual Migration**: Could add a migration later if needed

---

## ✅ Checklist

- [x] Frontend form forces lowercase
- [x] Backend API forces lowercase
- [x] Mobile APIs use case-insensitive lookups
- [x] Tested with existing mixed-case username (Benglish)
- [x] Tested with lowercase username (rgriola)
- [x] Build succeeds
- [x] Changes committed to git
- [x] Changes pushed to GitHub

---

## 🚀 Next Steps

Optional future improvements:
- [ ] Add migration to normalize existing usernames in database
- [ ] Update username change form to show lowercase preview
- [ ] Add UI hint: "Username will be saved as lowercase"

---

**Status:** ✅ **RESOLVED**

**Commit:** `97113f3` - "fix(username): Force lowercase usernames in registration and add case-insensitive API lookups"
