# ImageKit Duplicate Token Error Fix

**Date:** January 9, 2026  
**Status:** ✅ FIXED  
**Type:** ImageKit Authentication Token Reuse Bug

---

## 🐛 Problem

When uploading multiple photos in deferred mode, the second photo would fail with an ImageKit error:

```
Failed to load resource: the server responded with a status of 400
Error: "The token with value 'c4cf1ade-6119-4491-a38c-0b782346344a' has been used before."
```

### Symptoms
- First photo uploads successfully
- Second and subsequent photos fail with 400 error
- Error message: "The token with value '...' has been used before"
- ImageKit suggests using "V4 UUIDs, or another random string with enough entropy to avoid collisions"

### Root Cause
The upload function was fetching ImageKit auth parameters **once before the loop**, then reusing the same `token`, `signature`, and `expire` values for ALL photo uploads.

**ImageKit Requirement:** Each upload must use a **unique, fresh authentication token**.

```typescript
// ❌ BEFORE - Auth fetched once, reused for all photos
const authData = await getAuthParams();  // Called once

for (let i = 0; i < cachedPhotos.length; i++) {
    const uploadedPhoto = await uploadPhotoToImageKit(cachedPhoto, authData);
    //                                                              ^^^^^^^^
    //                                                    Same token reused! ❌
}
```

---

## ✅ Solution

Move the `getAuthParams()` call **inside the loop** so each photo gets fresh authentication credentials.

### Code Change
**File:** `src/hooks/usePhotoCacheManager.ts`

**Before:**
```typescript
try {
    console.log('[PhotoCache] Starting upload of', cachedPhotos.length, 'photos...');

    // Get auth params ONCE
    const authData = await getAuthParams();  // ❌ Called outside loop

    // Upload each photo
    for (let i = 0; i < cachedPhotos.length; i++) {
        const cachedPhoto = cachedPhotos[i];
        
        // Upload with REUSED auth
        const uploadedPhoto = await uploadPhotoToImageKit(cachedPhoto, authData);
        //                                                              ^^^^^^^^
        //                                                        Same token! ❌
    }
}
```

**After:**
```typescript
try {
    console.log('[PhotoCache] Starting upload of', cachedPhotos.length, 'photos...');

    // Upload each photo
    for (let i = 0; i < cachedPhotos.length; i++) {
        const cachedPhoto = cachedPhotos[i];
        
        // Update uploading state
        setCachedPhotos((prev) => ...);

        // Get FRESH auth params for EACH photo ✅
        const authData = await getAuthParams();  // ✅ Called inside loop
        
        // Upload with UNIQUE token
        const uploadedPhoto = await uploadPhotoToImageKit(cachedPhoto, authData);
        //                                                              ^^^^^^^^
        //                                                        Fresh token! ✅
    }
}
```

**Lines Changed:** 3 lines moved (auth fetch moved into loop)

---

## 🔍 Why This Happens

### ImageKit Token Structure
Each authentication response contains:
```typescript
{
    token: "c4cf1ade-6119-4491-a38c-0b782346344a",  // UUID v4
    signature: "abc123...",                          // HMAC signature
    expire: 1768004500                               // Unix timestamp
}
```

### Token Validation
ImageKit validates uploads by:
1. **Checking token uniqueness** - Each token can only be used ONCE
2. **Verifying signature** - HMAC of token + expire + privateKey
3. **Checking expiration** - Token must not be expired (typically 1 hour)

When we reused the same token:
- First upload: Token valid, upload succeeds ✅
- Second upload: Token already used, upload fails ❌

---

## 📊 Upload Flow Comparison

### Before (Broken)
```
1. Fetch auth once
   ├─ token: "abc123"
   ├─ signature: "xyz789"
   └─ expire: 1768004500

2. Upload photo 1
   └─ Uses token "abc123" ✅ SUCCESS

3. Upload photo 2
   └─ Uses token "abc123" ❌ FAILURE (token already used)
```

### After (Fixed)
```
1. Upload photo 1
   ├─ Fetch auth
   │  └─ token: "abc123"
   └─ Upload ✅ SUCCESS

2. Upload photo 2
   ├─ Fetch auth (NEW TOKEN)
   │  └─ token: "def456"  ← Different token!
   └─ Upload ✅ SUCCESS
```

---

## 🎯 Performance Impact

### Minimal Additional Latency
- **Before:** 1 auth request for N photos
- **After:** N auth requests for N photos

**Auth Request Performance:**
- Auth endpoint is fast (~50-100ms)
- No external API call (server-side token generation)
- Only generates signature using HMAC

**For 2 photos:**
- Additional latency: ~100ms total
- ImageKit upload time: ~500-1500ms per photo
- Total impact: <5% increase

**Trade-off:** Slight latency increase vs. reliable uploads ✅

---

## ✅ Testing Checklist

### Single Photo Upload
- [x] Upload 1 photo
- [x] Verify: Upload succeeds
- [x] Verify: Photo appears in ImageKit dashboard

### Multiple Photos Upload (Primary Test Case)
- [x] Select 2 photos
- [x] Click Save
- [x] Verify: Both photos upload successfully
- [x] Verify: No "token has been used before" error
- [x] Verify: Console shows fresh auth for each photo
- [x] Verify: Both photos saved to database
- [x] Verify: Both photos visible in location

### Edge Cases
- [x] Upload 3+ photos
- [x] Upload photos with different sizes
- [x] Test with slow network connection
- [x] Verify error handling if auth fails

---

## 🔍 Console Log Evidence

### Before (Error)
```
[PhotoCache] Starting upload of 2 photos...
[PhotoCache] Uploading to ImageKit: /development/users/1/photos
[PhotoCache] Uploaded 1/2: /development/users/1/photos/_DSC1819.jpg
[PhotoCache] Uploading to ImageKit: /development/users/1/photos
❌ Failed to load resource: 400
❌ Error: "The token with value '...' has been used before"
```

### After (Success)
```
[PhotoCache] Starting upload of 2 photos...
[PhotoCache] Uploading to ImageKit: /development/users/1/photos
[PhotoCache] Uploaded 1/2: /development/users/1/photos/_DSC1819.jpg
[PhotoCache] Uploading to ImageKit: /development/users/1/photos
✅ [PhotoCache] Uploaded 2/2: /development/users/1/photos/San-Diego-Love.jpg
✅ [PhotoCache] All photos uploaded successfully
```

---

## 🚨 Why This Wasn't Caught Earlier

### Single Photo Testing
During Phase 3 implementation, most testing was done with:
- Single photo uploads ✅ (worked fine)
- Photo display and preview ✅ (worked fine)
- File size validation ✅ (worked fine)

The bug only manifests when uploading **2 or more photos in sequence**.

### Token Reuse Pattern
This is a common mistake when:
- Optimizing for performance (reduce API calls)
- Not reading ImageKit's token uniqueness requirement
- Assuming tokens work like API keys (reusable)

---

## 💡 Lessons Learned

### Best Practices for Authentication Tokens

1. **Read the docs** - ImageKit explicitly requires unique tokens per upload
2. **Test with multiple items** - Edge cases appear with N>1
3. **Don't optimize prematurely** - Extra auth requests are cheap
4. **Fresh credentials per operation** - Never reuse auth tokens

### When to Fetch Auth
```typescript
// ❌ DON'T: Fetch once for batch operation
const auth = await getAuth();
for (const item of items) {
    await upload(item, auth);  // Reusing auth
}

// ✅ DO: Fetch fresh for each operation
for (const item of items) {
    const auth = await getAuth();  // Fresh auth
    await upload(item, auth);
}
```

---

## 🔗 Related Documentation

- `DEFERRED_PHOTO_UPLOAD_FIX.md` - File size limit fix
- `PHASE_3_COMPLETE.md` - Original implementation
- ImageKit Docs: https://docs.imagekit.io/api-reference/upload-file-api/client-side-file-upload

---

## 📝 Code Pattern Reference

### Correct Pattern for Multiple Uploads
```typescript
async function uploadMultiplePhotos(photos: File[]) {
    for (const photo of photos) {
        // ✅ Get fresh auth for EACH upload
        const authData = await getAuthParams();
        
        // Upload with unique token
        await uploadToImageKit(photo, authData);
    }
}
```

### Auth Endpoint Implementation
```typescript
// /api/imagekit/auth/route.ts
export async function GET() {
    const imagekit = new ImageKit({...});
    
    // Generates NEW token each time
    const authParams = imagekit.getAuthenticationParameters();
    
    return {
        token: "unique-uuid-v4",      // ← Always different
        signature: "hmac-signature",
        expire: timestamp,
        publicKey: "...",
        urlEndpoint: "..."
    };
}
```

---

## ✅ Verification

After fix, verify in console:
```javascript
// Should see DIFFERENT tokens for each upload
[PhotoCache] Auth token: abc123  // Photo 1
[PhotoCache] Auth token: def456  // Photo 2 ← Different!
```

In Network tab:
- Each upload request should have unique `token` value
- All uploads should return 200 (not 400)

---

**Status:** ✅ FIXED & TESTED  
**Priority:** HIGH (Blocking multiple photo uploads)  
**Breaking Change:** NO  
**Performance Impact:** Minimal (~100ms per additional photo)  
**Root Cause:** Token reuse violation of ImageKit requirements  
**Solution:** Fetch fresh auth inside upload loop
