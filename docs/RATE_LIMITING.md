# Rate Limiting & Account Security Implementation

**Implemented:** December 24, 2025  
**Status:** ✅ Active

## Overview

Implemented database-based rate limiting and account lockout mechanism to protect against brute force attacks, credential stuffing, and unauthorized access attempts.

## Security Features

### 1. **Rate Limiting Configuration**

- **Max Failed Attempts:** 5 consecutive failures
- **Lockout Duration:** 30 minutes
- **Scope:** Per user account (not IP-based)
- **Storage:** Database (survives server restarts)

### 2. **Database Schema Changes**

Added to `User` model in `prisma/schema.prisma`:

```prisma
failedLoginAttempts Int      @default(0)     // Count of consecutive failed logins
lockedUntil        DateTime?                 // Account locked until this time (null = not locked)
```

### 3. **Login Flow with Rate Limiting**

#### **Successful Login:**
1. Verify credentials
2. Reset `failedLoginAttempts` to 0
3. Set `lockedUntil` to null
4. Update `lastLoginAt` timestamp
5. Create session and return JWT

#### **Failed Login:**
1. Increment `failedLoginAttempts`
2. If attempts ≥ 5:
   - Set `lockedUntil` to 30 minutes in the future
   - Return "Account locked" error (429 status)
3. If attempts < 5:
   - Return "Invalid credentials" with remaining attempts counter
   - Example: "Invalid email or password. 2 attempts remaining before account lockout."

#### **Locked Account:**
- Returns 429 status with minutes remaining
- Example: "Account is temporarily locked due to multiple failed login attempts. Please try again in 15 minutes."
- Lock automatically expires after timeout
- Next successful login resets the counter

### 4. **Enhanced Input Validation**

Using Zod schema with security enhancements:

```typescript
const loginSchema = z.object({
  email: z.string()
    .email('Invalid email address')
    .toLowerCase()  // Normalize to prevent case-based bypasses
    .trim(),        // Remove whitespace
  password: z.string()
    .min(1, 'Password is required')
    .max(255, 'Password is too long'),  // Prevent DOS with huge passwords
  rememberMe: z.boolean().optional(),
});
```

### 5. **Security Best Practices**

✅ **Generic Error Messages** - Prevents email enumeration  
✅ **Bcrypt Password Hashing** - Uses existing auth library  
✅ **Input Sanitization** - Trim, lowercase, and length limits  
✅ **Automatic Unlock** - Expired locks are automatically cleared  
✅ **Success Reset** - Successful login clears failed attempt counter  
✅ **Session Security** - Single-session enforcement remains active  
✅ **Audit Trail** - `lastLoginAt` timestamp for security monitoring  

##Threat Mitigation

| Threat | Mitigation |
|--------|------------|
| **Brute Force Attack** | Max 5 attempts before 30-min lockout |
| **Credential Stuffing** | Rate limiting slows down attack attempts |
| **Account Enumeration** | Generic error messages for invalid credentials |
| **DOS via Login** | Password max length (255 chars) prevents huge payloads |
| **Timing Attacks** | Bcrypt comparison has constant time complexity |

## Error Codes

| Code | Status | Description |
|------|--------|-------------|
| `INVALID_CREDENTIALS` | 401 | Wrong email/password (with attempts counter) |
| `ACCOUNT_LOCKED` | 429 | Too many failed attempts (with unlock time) |
| `EMAIL_NOT_VERIFIED` | 403 | Email verification required |
| `ACCOUNT_DEACTIVATED` | 403 | Account is inactive |
| `VALIDATION_ERROR` | 400 | Invalid input format |

## Admin Features (Future Enhancement)

Potential features to add:

- **Manual Unlock:** Admin can manually unlock accounts
- **View Failed Attempts:** Admin dashboard showing locked accounts
- **Adjustable Limits:** Configure max attempts and lockout duration per environment
- **Email Notifications:** Alert users when account is locked
- **Activity Log:** Track all login attempts (successful and failed) with IP addresses

## Testing

### Test Failed Login Rate Limiting:

```bash
# 1. Make 5 failed login attempts
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"wrong"}'

# Response after attempt 4:
# "Invalid email or password. 1 attempt remaining before account lockout."

# Response after attempt 5:
# "Account locked due to 5 failed login attempts. Please try again in 30 minutes."

# 2. Try logging in with correct password while locked
# Response: "Account is temporarily locked... Please try again in XX minutes."

# 3. Wait 30 minutes OR reset manually in database:
UPDATE users SET failedLoginAttempts = 0, lockedUntil = NULL WHERE email = 'test@example.com';

# 4. Login successfully - counter resets automatically
```

### Test Successful Login Reset:

```bash
# 1. Make 3 failed attempts
# 2. Login successfully with correct password
# 3. Verify failedLoginAttempts = 0 and lockedUntil = NULL in database
```

## Database Queries

### Check Locked Accounts:

```sql
SELECT email, failedLoginAttempts, lockedUntil 
FROM users 
WHERE lockedUntil > NOW();
```

### Manually Unlock Account:

```sql
UPDATE users 
SET failedLoginAttempts = 0, lockedUntil = NULL 
WHERE email = 'user@example.com';
```

### View Accounts with Failed Attempts:

```sql
SELECT email, failedLoginAttempts, lockedUntil, lastLoginAt 
FROM users 
WHERE failedLoginAttempts > 0
ORDER BY failedLoginAttempts DESC;
```

## Configuration

To modify rate limiting parameters, edit `/src/app/api/auth/login/route.ts`:

```typescript
const MAX_FAILED_ATTEMPTS = 5;              // Change to 3, 10, etc.
const LOCKOUT_DURATION_MINUTES = 30;         // Change to 15, 60, etc.
```

**Note:** Restart the dev server after changes.

## Related Files

- `/prisma/schema.prisma` - Database schema with rate limiting fields
- `/src/app/api/auth/login/route.ts` - Login endpoint with rate limiting
- `/src/lib/auth.ts` - Password hashing/comparison (bcrypt)
- `/src/lib/api-middleware.ts` - API response helpers

## Future Improvements

1. **IP-Based Rate Limiting:** Add IP tracking to prevent distributed attacks
2. **Redis Integration:** For high-traffic sites, move rate limiting to Redis
3. **Graduated Lockouts:** Increase lockout duration with repeated violations
4. **CAPTCHA Integration:** Require CAPTCHA after 3 failed attempts
5. **Email Alerts:** Notify users of suspicious login activity
6. **Security Dashboard:** Admin panel to monitor and manage locked accounts

---

**Last Updated:** December 24, 2025
