# Sentry Troubleshooting Guide

**Issue**: Errors not appearing in Sentry dashboard

---

## 🔍 Diagnostic Steps

### **Step 1: Check Browser Console**

1. Open your browser to: `http://localhost:3000/sentry-test`
2. Open Developer Tools (F12 or Cmd+Option+I)
3. Go to the **Console** tab
4. **Look for these messages**:
   ```
   [Sentry Debug] DSN loaded: YES
   [Sentry Debug] Environment: development
   [Sentry Debug] Initialization complete
   ```

5. Click the "Test Client Error" button
6. **Look for**:
   ```
   [Sentry Debug] beforeSend called: { level: 'error', ... }
   [Sentry Debug] Should send? true
   ```

---

### **Step 2: What Each Message Means**

| Message | Meaning | Action if Missing |
|---------|---------|-------------------|
| `DSN loaded: YES` | Environment variable found | Check `.env.local` file |
| `DSN loaded: NO` | ❌ No DSN | Restart dev server: `npm run dev` |
| `beforeSend called` | Error captured | ✅ Sentry is working |
| `Should send? true` | Will send to dashboard | ✅ Should appear in Sentry |
| `Should send? false` | Filtered out | Error level too low |

---

### **Step 3: Common Issues**

#### **A. DSN Not Loading** ❌
**Symptoms**: `DSN loaded: NO`

**Fix**:
```bash
# 1. Check .env.local exists
cat .env.local | grep SENTRY

# 2. Restart dev server
# Stop the server (Ctrl+C)
npm run dev
```

#### **B. beforeSend Not Called** ❌
**Symptoms**: No `beforeSend` message when clicking button

**Fix**:
- Check browser console for JavaScript errors
- Verify Sentry SDK loaded: Look for Sentry errors in console

#### **C. Should Send? false** ❌
**Symptoms**: `Should send? false` in console

**Fix**:
The error level is not 'error' or 'fatal'. This shouldn't happen with our test, but if it does:
```typescript
// The test explicitly triggers an 'error' level
Sentry.captureException(error);  // Always sends as 'error'
```

#### **D. Network Issues** ❌
**Symptoms**: `beforeSend` called but nothing in Sentry dashboard

**Fix**:
1. Check browser **Network** tab
2. Look for requests to `ingest.us.sentry.io`
3. Check if they return 200 OK
4. If 403/401: DSN might be wrong
5. If no request: Check firewall/VPN

---

### **Step 4: Verify Sentry Dashboard**

1. Go to: https://sentry.io
2. Click on your project: **merkel-vision**
3. Check **Issues** tab (left sidebar)
4. **Wait 5-10 seconds** after clicking the test button
5. **Refresh** the Issues page

---

### **Step 5: Test Network Request**

**In Browser Console**, run this:

```javascript
// Test if Sentry SDK is loaded
console.log('Sentry available?', typeof Sentry);

// Manually send a test error
if (typeof Sentry !== 'undefined') {
    Sentry.captureMessage('Manual test from console', 'error');
    console.log('Test message sent to Sentry!');
}
```

**Expected**:
- `Sentry available? object` ✅
- `Test message sent to Sentry!`
- Check Sentry dashboard for "Manual test from console"

---

### **Step 6: Check Sentry Project Settings**

In your Sentry dashboard:

1. Go to **Settings** → **Projects** → **merkel-vision**
2. Click **Client Keys (DSN)**
3. **Verify DSN** matches `.env.local`:
   ```
   https://1e6219bd27e095b18fc73fec018da187@o4510596205838336.ingest.us.sentry.io/4510596233101312
   ```
4. Check **Project is Active** (not disabled)

---

## 🧪 Quick Test Commands

### **Test 1: Environment Variable**
```bash
# In terminal
cd /Users/rgriola/Desktop/01_Vibecode/google-search-me-refactor
grep SENTRY .env.local
```

**Expected**:
```
NEXT_PUBLIC_SENTRY_DSN="https://1e6219bd27e095b18fc73fec018da187@o4510596205838336.ingest.us.sentry.io/4510596233101312"
```

### **Test 2: Restart Dev Server**
```bash
# Stop current server (Ctrl+C in terminal)
npm run dev
```

### **Test 3: Clear Browser Cache**
```
1. Open DevTools (F12)
2. Right-click on reload button
3. Select "Empty Cache and Hard Reload"
4. Try the test again
```

---

## ✅ Success Checklist

After trying the test button, you should see:

- [ ] `[Sentry Debug] DSN loaded: YES` in console
- [ ] `[Sentry Debug] beforeSend called` in console  
- [ ] `[Sentry Debug] Should send? true` in console
- [ ] Alert popup: "Error sent to Sentry!"
- [ ] Network request to `ingest.us.sentry.io` with 200 status
- [ ] Error appears in Sentry dashboard within 10 seconds

---

## 🚨 If Still Not Working

**Share these details**:

1. **Console messages** (copy all `[Sentry Debug]` lines)
2. **Network tab** (any requests to sentry.io?)
3. **Browser** (Chrome, Firefox, Safari?)
4. **Any JavaScript errors** in console?

Then I can help you troubleshoot further!

---

## 💡 Alternative: Test with Production Build

Development mode has filters. Try production mode to bypass them:

```bash
# Stop dev server
# Build for production
npm run build

# Start production server
npm start

# Visit http://localhost:3000/sentry-test
# Try the test buttons
```

In production mode, ALL errors go to Sentry (no filtering).

---

**Next Step**: Open browser console and share what you see! 🔍
