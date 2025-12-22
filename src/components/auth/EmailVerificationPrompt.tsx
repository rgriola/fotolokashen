'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
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
        toast.success(data.message || 'Verification email sent! Please check your inbox.');
        setResentCount(prev => prev + 1);
      } else {
        toast.error(data.error || 'Failed to resend verification email');
      }
    } catch (error) {
      toast.error('Failed to resend verification email. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 space-y-4">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <Mail className="h-6 w-6 text-amber-600" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-amber-900">
            Email Verification Required
          </h3>
          <p className="mt-2 text-sm text-amber-800">
            Please verify your email address before accessing the application. 
            We sent a verification link to <strong>{email}</strong>
          </p>
          <p className="mt-2 text-sm text-amber-700">
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
          <span className="text-sm text-amber-700">
            ✓ Sent {resentCount} time{resentCount > 1 ? 's' : ''}
          </span>
        )}
      </div>

      <p className="text-xs text-amber-600 pt-2">
        Didn't receive the email? Check your spam folder or click "Resend" above. 
        (Limit: 3 emails per hour)
      </p>
    </div>
  );
}
