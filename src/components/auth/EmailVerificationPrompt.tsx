'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { TOAST } from '@/lib/constants/messages';
import { Mail, RefreshCw } from 'lucide-react';

interface EmailVerificationPromptProps {
  email: string;
  onClose?: () => void;
}

export function EmailVerificationPrompt({ email, onClose }: EmailVerificationPromptProps) {
  const [isResending, setIsResending] = useState(false);
  const [resentCount, setResentCount] = useState(0);

  const handleResendVerification = async () => {
    setIsResending(true);
    
    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message || TOAST.AUTH.VERIFICATION_SENT);
        setResentCount(prev => prev + 1);
      } else {
        toast.error(data.error || TOAST.AUTH.VERIFICATION_FAILED);
      }
    } catch (error) {
      toast.error(TOAST.AUTH.VERIFICATION_FAILED);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="bg-warning/10 border border-warning/20 rounded-lg p-6 space-y-4">
      <div className="flex items-start gap-3">
        <div className="shrink-0">
          <Mail className="h-6 w-6 text-warning" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-warning">
            Email Verification Required
          </h3>
          <p className="mt-2 text-sm text-warning">
            Please verify your email address before accessing the application. 
            We sent a verification link to <strong>{email}</strong>
          </p>
          <p className="mt-2 text-sm text-warning">
            Check your inbox and spam folder for the verification email.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <Button
          onClick={handleResendVerification}
          disabled={isResending}
          variant="outline"
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isResending ? 'animate-spin' : ''}`} />
          {isResending ? 'Sending...' : 'Resend Verification Email'}
        </Button>

        {resentCount > 0 && (
          <span className="text-sm text-warning">
            ✓ Sent {resentCount} time{resentCount > 1 ? 's' : ''}
          </span>
        )}
      </div>

      <p className="text-xs text-warning pt-2">
        Didn't receive the email? Check your spam folder or click "Resend" above. 
        (Limit: 3 emails per hour)
      </p>
    </div>
  );
}
