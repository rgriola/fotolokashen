# User Account Deletion Feature

## Overview
Implemented user self-deletion feature with the same security measures as admin user deletion, plus admin protection to prevent admins from deleting their own accounts.

## Implementation Details

### 1. `/logout` Page
**File**: `src/app/logout/page.tsx`

- Clean logout landing page with confirmation message
- Auto-redirects to home after 5 seconds
- Manual buttons for Home or Sign In Again
- Uses existing `/api/auth/logout` endpoint

### 2. Self-Deletion API Endpoint
**File**: `src/app/api/auth/delete-account/route.ts`

**Features**:
- Requires authentication (users can only delete their own account)
- Deletes all user data from database (cascade):
  - User account
  - Sessions
  - Locations (created by user)
  - Photos (uploaded by user)
  - UserSaves
- Deletes all files from ImageKit CDN:
  - Individual photo files
  - Entire user folder (`/development/users/{userId}/` or `/production/users/{userId}/`)
- Creates security audit log entry (`USER_SELF_DELETED`)
- Returns success response

**Deletion Flow**:
1. Authenticate user
2. Fetch user data with counts
3. Delete photos from ImageKit CDN
4. Delete user folder from ImageKit
5. Delete user from database (cascade handles relations)
6. Create audit log
7. Return success

### 3. Delete Account Section Component
**File**: `src/components/profile/DeleteAccountSection.tsx`

**Features**:
- Warning card with red border and alert icon
- Lists exactly what will be deleted:
  - Profile and account information
  - All saved locations
  - All uploaded photos
  - All data from servers and CDN
  - All active sessions
- "Delete My Account" button opens confirmation dialog

**Confirmation Dialog**:
- Shows user's name and email
- Lists all data that will be deleted
- Requires typing "DELETE" (exact match) to confirm
- Same UX as admin user deletion
- Disables buttons while deleting
- Shows "Deleting..." state
- On success:
  - Shows success toast
  - Calls `/api/auth/logout`
  - Redirects to `/logout` page

### 4. Profile Page Integration
**File**: `src/app/profile/page.tsx`

**Changes**:
- Imported `DeleteAccountSection`
- Added component to Security tab (at the bottom)
- Appears after:
  - Change Password Form
  - Security Activity Log
  - **Delete Account Section** ← NEW

### 5. Admin User Management Protection
**File**: `src/components/admin/UserManagementTable.tsx`

**Features**:
- Imports `useAuth` to get current admin user
- Checks if row is current user: `isCurrentUser = currentUser?.id === user.id`
- Greys out admin's own row:
  - Adds `opacity-60 bg-muted/30` classes
  - Makes row visually distinct
- Disables delete button for admin's own account:
  - Sets `disabled={isCurrentUser}`
  - Changes styling to `cursor-not-allowed opacity-40`
  - Adds tooltip: "Cannot delete your own account"
- Backend protection already exists in `/api/admin/users/[id]/route.ts`:
  ```typescript
  if (userId === adminUser.id) {
      return apiError('Cannot delete your own account', 400);
  }
  ```

## Security Features

### User Self-Deletion
✅ Requires authentication (session token)
✅ Users can only delete their own account
✅ Requires typing "DELETE" to confirm
✅ Warning dialog with all consequences listed
✅ Audit logging for compliance
✅ All data permanently removed from database and CDN

### Admin Protection
✅ Admins cannot delete themselves via admin panel (UI disabled)
✅ Admins cannot delete themselves via API (backend validation)
✅ Visual feedback in admin panel (greyed out row)
✅ Admins CAN delete their own account via Profile → Security if they choose

### Data Deletion
✅ Database cascade handles all relations
✅ ImageKit CDN files deleted (photos)
✅ ImageKit folders deleted (user root folder)
✅ Environment-aware deletion (production vs development)
✅ Continues even if CDN deletion fails
✅ Audit trail maintained

## User Flow

### Self-Deletion Flow
1. User goes to **Profile → Security**
2. Scrolls to bottom and sees "Delete Account" section
3. Reads warning about permanent deletion
4. Clicks "Delete My Account" button
5. Confirmation dialog opens
6. User sees their name, email, and what will be deleted
7. User types "DELETE" in input field
8. "Delete Account" button becomes enabled
9. User clicks "Delete Account"
10. API deletes all data from database and CDN
11. Success toast shows
12. User is logged out
13. Redirected to `/logout` page
14. Can go home or sign in again

### Admin Trying to Delete Self (Prevented)
1. Admin goes to **Admin → Users**
2. Sees their own row in the table
3. Row is greyed out (60% opacity, muted background)
4. Delete button is disabled and greyed
5. Hovering shows tooltip: "Cannot delete your own account"
6. Clicking does nothing (button disabled)
7. If admin wants to delete their account, they must use Profile → Security

## Files Modified

### Created
- `src/app/logout/page.tsx`
- `src/app/api/auth/delete-account/route.ts`
- `src/components/profile/DeleteAccountSection.tsx`

### Modified
- `src/app/profile/page.tsx` (added DeleteAccountSection to Security tab)
- `src/components/admin/UserManagementTable.tsx` (added admin self-deletion protection)

## Testing Checklist

### User Self-Deletion
- [ ] Visit Profile → Security
- [ ] See "Delete Account" section at bottom
- [ ] Click "Delete My Account"
- [ ] Confirmation dialog opens
- [ ] Shows correct user name and email
- [ ] Type "DELET" → button still disabled
- [ ] Type "DELETE" → button enabled
- [ ] Click "Delete Account"
- [ ] Success toast appears
- [ ] Redirected to `/logout` page
- [ ] All user data deleted from database
- [ ] All user files deleted from ImageKit
- [ ] Security log entry created

### Admin Protection
- [ ] Login as admin
- [ ] Go to Admin → Users
- [ ] Find your own row in the table
- [ ] Row is greyed out (visually distinct)
- [ ] Delete button is disabled
- [ ] Hover shows tooltip
- [ ] Cannot delete own account via admin panel
- [ ] CAN still delete via Profile → Security

## Security Audit Events

### New Event Types
- `USER_SELF_DELETED` - User deleted their own account successfully
- `USER_SELF_DELETE_FAILED` - User attempted to delete account but failed

### Existing Event Types (Admin)
- `ADMIN_USER_DELETED` - Admin deleted another user
- `ADMIN_USER_DELETE_FAILED` - Admin deletion failed

## Notes

1. **Admin Self-Deletion**:
   - Admins are prevented from deleting themselves via the admin panel (greyed out)
   - Admins CAN still delete their account via Profile → Security if desired
   - This prevents accidental admin account loss while still allowing intentional deletion

2. **Email Notifications**:
   - Admin deletions send email to deleted user
   - Self-deletions do NOT send email (user initiated it)

3. **Session Handling**:
   - Self-deletion calls logout API after deletion
   - Redirects to `/logout` page
   - User cannot log back in (account deleted)

4. **Data Permanence**:
   - Deletion is PERMANENT and IRREVERSIBLE
   - All warnings clearly state this
   - User must type "DELETE" to confirm understanding

5. **Audit Trail**:
   - Security logs are created BEFORE user deletion
   - Logs stored with userId for compliance
   - Failed attempts also logged

## Environment Variables Required
- `NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY`
- `IMAGEKIT_PRIVATE_KEY`
- `IMAGEKIT_URL_ENDPOINT`
- Database connection (Prisma/PostgreSQL)

## Dependencies
- ImageKit SDK (for CDN deletion)
- Prisma (for database operations)
- Next.js App Router
- Auth middleware (`requireAuth`)
- Toast notifications (Sonner)
