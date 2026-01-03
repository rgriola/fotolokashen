# ImageKit Path Not Updating - Troubleshooting

**Issue**: Photos still uploading to old path structure despite code changes

---

## ✅ What We Fixed

1. **Added Console Logging:**
   - Logs folder path before upload
   - Logs ImageKit response after upload

2. **Cleared Next.js Cache:**
   - Removed `.next` directory
   - Forces complete rebuild

---

## 🔧 Next Steps

### **1. Restart Dev Server:**
```bash
# Stop current server (Ctrl+C)
# Then start fresh:
npm run dev
```

### **2. Hard Refresh Browser:**
- **Chrome/Edge**: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)
- **Firefox**: `Cmd+Shift+R` (Mac) or `Ctrl+F5` (Windows)
- **Safari**: `Cmd+Option+R`

### **3. Upload a Test Photo:**

Watch the browser console for these logs:
```
[ImageKitUploader] Uploading to folder: /development/users/1/photos
[ImageKitUploader] Upload successful! File path: /development/users/1/photos/abc123.jpg
```

Watch the server console for:
```
[Save Location] Creating 1 photo(s) for locationId: 3
```

---

## 🔍 Verification

### **Check Browser Console (Client-Side):**
Should see:
```
[ImageKitUploader] Uploading to folder: /development/users/1/photos
```

If you see `/users/1/locations/...` instead, the old code is still cached.

### **Check Server Console (Server-Side):**
Should see:
```
[Save Location] Creating 1 photo(s) for locationId: 3
[Save Location] Photos created successfully
```

### **Check ImageKit Dashboard:**
Navigate to: https://imagekit.io/dashboard
- Look for folder: `/development/users/1/photos/`
- New photos should be there

---

## 🐛 If Still Using Old Path

### **Option 1: Check Environment Variable**
```bash
# In .env.local, ensure:
NODE_ENV=development  # or leave unset for development
```

### **Option 2: Verify FOLDER_PATHS**
Check `src/lib/constants/upload.ts`:
```typescript
export function getEnvironment(): 'development' | 'production' {
    return process.env.NODE_ENV === 'production' ? 'production' : 'development';
}
```

### **Option 3: Check User ID**
Console should show:
```
[ImageKitUploader] Uploading to folder: /development/users/{YOUR_USER_ID}/photos
```

---

## 📊 Expected Results

### **Before Fix:**
```
ImageKit Path: /users/1/locations/ChIJAbc.../IMG_5687.jpg
```

### **After Fix:**
```
ImageKit Path: /development/users/1/photos/IMG_5687_abc123.jpg
```

---

## 🚀 Quick Test Commands

```bash
# 1. Clear cache (already done)
rm -rf .next

# 2. Restart dev server
npm run dev

# 3. In browser console, check which code is loaded:
localStorage.clear()  # Clear any cached data
location.reload(true) # Hard reload
```

---

## ✅ Success Indicators

When working correctly, you'll see:
1. ✅ Browser console: `Uploading to folder: /development/users/1/photos`
2. ✅ Upload succeeds
3. ✅ Browser console: `Upload successful! File path: /development/users/1/photos/abc123.jpg`
4. ✅ Photo appears on location page
5. ✅ ImageKit dashboard shows file in new structure

---

**Try uploading a photo now and check the console logs!** 🎯
