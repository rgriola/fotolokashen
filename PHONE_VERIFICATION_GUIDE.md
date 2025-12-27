# Phone Number Verification Implementation Guide

**Date**: 2025-12-27 16:31 EST  
**Feature**: SMS-based phone verification for security and 2FA

---

## 🎯 **Use Cases**

1. **Account Security** - Verify phone number during registration
2. **Two-Factor Authentication (2FA)** - Login verification codes
3. **Password Reset** - Alternative to email recovery
4. **Security Alerts** - Notify users of suspicious activity

---

## 🏗️ **Architecture Overview**

### **Components Needed:**

1. **SMS Service Provider** (choose one):
   - ✅ **Twilio** (Most popular, reliable)
   - ✅ **AWS SNS** (If using AWS)
   - ✅ **Vonage** (formerly Nexmo)
   - ✅ **MessageBird**

2. **Database Changes**:
   - Phone number field (already exists in User table ✅)
   - Phone verification status
   - Verification code storage
   - Code expiry timestamp

3. **API Endpoints**:
   - Send verification code
   - Verify code
   - Resend code

4. **UI Components**:
   - Phone input with country code
   - Verification code input
   - Resend code button

---

## 📊 **Database Schema Changes**

### **Current User Table:**
```prisma
model User {
  // ... existing fields
  phoneNumber String?  // ✅ Already exists
}
```

### **Additions Needed:**
```prisma
model User {
  // ... existing fields
  phoneNumber          String?
  phoneNumberVerified  Boolean   @default(false)  // NEW
  phoneVerifiedAt      DateTime? // NEW
}

// NEW: Verification codes table
model PhoneVerification {
  id          Int      @id @default(autoincrement())
  userId      Int
  phoneNumber String
  code        String   // 6-digit code
  expiresAt   DateTime
  verified    Boolean  @default(false)
  createdAt   DateTime @default(now())
  
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId])
  @@index([phoneNumber])
  @@index([code])
}
```

---

## 🔧 **Implementation Steps**

### **Step 1: Choose SMS Provider**

**Recommended: Twilio** (Most popular, good docs)

**Setup:**
```bash
npm install twilio
```

**Environment Variables:**
```env
# .env.local
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890
```

---

### **Step 2: Create SMS Service**

**File**: `src/lib/sms.ts`

```typescript
import twilio from 'twilio';

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export async function sendSMS(to: string, message: string) {
  try {
    const result = await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: to,
    });
    return { success: true, sid: result.sid };
  } catch (error) {
    console.error('SMS send error:', error);
    return { success: false, error };
  }
}

export function generateVerificationCode(): string {
  // Generate 6-digit code
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function sendVerificationCode(phoneNumber: string, code: string) {
  const message = `Your Merkel Vision verification code is: ${code}. Valid for 10 minutes.`;
  return sendSMS(phoneNumber, message);
}
```

---

### **Step 3: Create API Endpoints**

#### **Send Verification Code**
**File**: `src/app/api/auth/phone/send-code/route.ts`

```typescript
import { NextRequest } from 'next/server';
import { requireAuth, apiResponse, apiError } from '@/lib/api-middleware';
import prisma from '@/lib/prisma';
import { sendVerificationCode, generateVerificationCode } from '@/lib/sms';
import { z } from 'zod';

const schema = z.object({
  phoneNumber: z.string().regex(/^\+[1-9]\d{1,14}$/), // E.164 format
});

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (!authResult.authorized) {
      return apiError('Unauthorized', 401);
    }

    const body = await request.json();
    const validation = schema.safeParse(body);
    
    if (!validation.success) {
      return apiError('Invalid phone number format', 400);
    }

    const { phoneNumber } = validation.data;

    // Rate limiting: Check recent attempts
    const recentAttempt = await prisma.phoneVerification.findFirst({
      where: {
        userId: authResult.user!.id,
        createdAt: {
          gte: new Date(Date.now() - 60 * 1000), // Last minute
        },
      },
    });

    if (recentAttempt) {
      return apiError('Please wait before requesting another code', 429);
    }

    // Generate code
    const code = generateVerificationCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Save to database
    await prisma.phoneVerification.create({
      data: {
        userId: authResult.user!.id,
        phoneNumber,
        code,
        expiresAt,
      },
    });

    // Send SMS
    const result = await sendVerificationCode(phoneNumber, code);

    if (!result.success) {
      return apiError('Failed to send verification code', 500);
    }

    return apiResponse({
      success: true,
      message: 'Verification code sent',
    });
  } catch (error) {
    console.error('Send code error:', error);
    return apiError('Failed to send code', 500);
  }
}
```

#### **Verify Code**
**File**: `src/app/api/auth/phone/verify-code/route.ts`

```typescript
import { NextRequest } from 'next/server';
import { requireAuth, apiResponse, apiError } from '@/lib/api-middleware';
import prisma from '@/lib/prisma';
import { z } from 'zod';

const schema = z.object({
  code: z.string().length(6),
});

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (!authResult.authorized) {
      return apiError('Unauthorized', 401);
    }

    const body = await request.json();
    const validation = schema.safeParse(body);
    
    if (!validation.success) {
      return apiError('Invalid code format', 400);
    }

    const { code } = validation.data;

    // Find verification record
    const verification = await prisma.phoneVerification.findFirst({
      where: {
        userId: authResult.user!.id,
        code: code,
        verified: false,
        expiresAt: {
          gte: new Date(),
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!verification) {
      return apiError('Invalid or expired code', 400);
    }

    // Mark as verified
    await prisma.phoneVerification.update({
      where: { id: verification.id },
      data: { verified: true },
    });

    // Update user
    await prisma.user.update({
      where: { id: authResult.user!.id },
      data: {
        phoneNumber: verification.phoneNumber,
        phoneNumberVerified: true,
        phoneVerifiedAt: new Date(),
      },
    });

    return apiResponse({
      success: true,
      message: 'Phone number verified',
    });
  } catch (error) {
    console.error('Verify code error:', error);
    return apiError('Failed to verify code', 500);
  }
}
```

---

### **Step 4: Create UI Components**

#### **Phone Verification Component**
**File**: `src/components/profile/PhoneVerification.tsx`

```typescript
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Phone, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/lib/auth-context';

export function PhoneVerification() {
  const { user, refetchUser } = useAuth();
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '');
  const [code, setCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const sendCode = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/phone/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Failed to send code');
        return;
      }

      toast.success('Verification code sent!');
      setCodeSent(true);
    } catch (error) {
      toast.error('An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const verifyCode = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/phone/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Invalid code');
        return;
      }

      toast.success('Phone number verified!');
      await refetchUser();
      setCodeSent(false);
      setCode('');
    } catch (error) {
      toast.error('An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Phone className="w-5 h-5" />
          Phone Verification
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {user?.phoneNumberVerified ? (
          <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 p-4 rounded-lg">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-green-600" />
              <p className="text-sm font-medium text-green-900 dark:text-green-100">
                Phone number verified: {user.phoneNumber}
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+1234567890"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                disabled={codeSent}
              />
              <p className="text-xs text-muted-foreground">
                Include country code (e.g., +1 for US)
              </p>
            </div>

            {!codeSent ? (
              <Button onClick={sendCode} disabled={isLoading || !phoneNumber}>
                {isLoading ? 'Sending...' : 'Send Verification Code'}
              </Button>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="code">Verification Code</Label>
                <Input
                  id="code"
                  type="text"
                  maxLength={6}
                  placeholder="123456"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                />
                <div className="flex gap-2">
                  <Button onClick={verifyCode} disabled={isLoading || code.length !== 6}>
                    {isLoading ? 'Verifying...' : 'Verify Code'}
                  </Button>
                  <Button variant="outline" onClick={sendCode} disabled={isLoading}>
                    Resend Code
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
```

---

## 💰 **Cost Considerations**

### **Twilio Pricing (as of 2024):**
- **US SMS**: ~$0.0079 per message
- **International**: $0.05 - $0.20 per message
- **Free Trial**: $15.50 credit

### **Monthly Estimates:**
- 100 verifications: ~$0.79
- 1,000 verifications: ~$7.90
- 10,000 verifications: ~$79.00

---

## 🔒 **Security Best Practices**

1. **Rate Limiting**:
   - Max 3 code requests per hour per phone
   - Max 5 verification attempts per code

2. **Code Expiry**:
   - 10-minute expiration
   - Single-use codes

3. **Phone Number Validation**:
   - E.164 format required
   - Country code validation

4. **Storage**:
   - Don't store plain codes (hash if needed)
   - Clean up expired codes regularly

---

## 🎯 **Integration Points**

### **Where to Add Phone Verification:**

1. **Profile Settings** ✅
   - Add `PhoneVerification` component to preferences

2. **Registration Flow** (Optional)
   - Verify phone during signup

3. **2FA Login** (Advanced)
   - Require code for login if enabled

4. **Password Reset** (Alternative)
   - SMS-based password recovery

---

## ✅ **Implementation Checklist**

- [ ] Choose SMS provider (Twilio recommended)
- [ ] Create Twilio account and get credentials
- [ ] Add database schema (PhoneVerification table)
- [ ] Run Prisma migration
- [ ] Install twilio npm package
- [ ] Create SMS service (`src/lib/sms.ts`)
- [ ] Create API endpoints (`send-code` and `verify-code`)
- [ ] Create UI component (`PhoneVerification.tsx`)
- [ ] Add to profile page
- [ ] Test with real phone number
- [ ] Set up rate limiting
- [ ] Monitor costs in Twilio dashboard

---

## 📝 **Next Steps**

1. **Get Twilio Account**: https://www.twilio.com/try-twilio
2. **Review Implementation**: This guide
3. **Estimate Costs**: Based on expected usage
4. **Implement in Stages**:
   - Stage 1: Basic verification (profile)
   - Stage 2: 2FA login
   - Stage 3: SMS alerts

---

**Want me to help you implement this? Let me know and I can start with the database schema!** 📱
