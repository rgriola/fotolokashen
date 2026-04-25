'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { TOAST } from '@/lib/constants/messages';
import { Eye, EyeOff } from 'lucide-react';

// Validation schema
const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

interface LoginFormProps {
  returnUrl?: string;
  message?: string;
}

export function LoginForm({ returnUrl, message }: LoginFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [oauthDebug, setOauthDebug] = useState('');
  
  // OAuth parameters from URL
  const [oauthParams, setOauthParams] = useState<{
    clientId?: string;
    redirectUri?: string;
    codeChallenge?: string;
    codeChallengeMethod?: string;
    scope?: string;
    responseType?: string;
  }>({});

  useEffect(() => {
    // Capture OAuth parameters from URL
    setOauthParams({
      clientId: searchParams.get('client_id') || undefined,
      redirectUri: searchParams.get('redirect_uri') || undefined,
      codeChallenge: searchParams.get('code_challenge') || undefined,
      codeChallengeMethod: searchParams.get('code_challenge_method') || undefined,
      scope: searchParams.get('scope') || undefined,
      responseType: searchParams.get('response_type') || undefined,
    });
  }, [searchParams]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      rememberMe: false,
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        // Check if email verification is required
        if (result.requiresVerification && result.email) {
          // Check if a new verification email was sent
          if (result.code === 'EMAIL_NOT_VERIFIED_RESENT' || result.tokenResent) {
            toast.success(TOAST.AUTH.VERIFICATION_RESENT);
            // Redirect to verify-email page with resent=true
            setTimeout(() => {
              router.push(`/verify-email?email=${encodeURIComponent(result.email)}&resent=true`);
            }, 1000);
            return;
          } else if (result.code === 'EMAIL_RATE_LIMITED') {
            toast.error(result.error || TOAST.AUTH.VERIFICATION_RATE_LIMITED);
            // Still redirect to verify-email page
            setTimeout(() => {
              router.push(`/verify-email?email=${encodeURIComponent(result.email)}`);
            }, 1000);
            return;
          } else {
            // Original verification link still valid
            toast.error(result.error || TOAST.AUTH.VERIFICATION_REQUIRED);
            // Redirect to verify-email page
            setTimeout(() => {
              router.push(`/verify-email?email=${encodeURIComponent(result.email)}`);
            }, 1000);
            return;
          }
        }
        
        toast.error(result.error || TOAST.AUTH.LOGIN_FAILED);
        return;
      }

      toast.success(TOAST.AUTH.LOGIN_SUCCESS);

      // Check if this is an OAuth login (mobile app)
      if (oauthParams.clientId && oauthParams.redirectUri && oauthParams.codeChallenge) {
        setOauthDebug('1/4: Login OK, requesting auth code...');
        console.log('[OAuth] Mobile app login detected, requesting authorization code...');
        
        // Request authorization code from OAuth endpoint
        try {
          const oauthResponse = await fetch('/api/auth/oauth/authorize', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              client_id: oauthParams.clientId,
              response_type: oauthParams.responseType || 'code',
              redirect_uri: oauthParams.redirectUri,
              code_challenge: oauthParams.codeChallenge,
              code_challenge_method: oauthParams.codeChallengeMethod || 'S256',
              scope: oauthParams.scope || 'read write',
            }),
          });

          const oauthResult = await oauthResponse.json();

          if (!oauthResponse.ok) {
            setOauthDebug(`2/4 FAIL: ${oauthResponse.status} - ${JSON.stringify(oauthResult)}`);
            console.error('[OAuth] Authorization failed:', oauthResult);
            toast.error(TOAST.AUTH.OAUTH_FAILED);
            return;
          }

          setOauthDebug('3/4: Auth code received, redirecting...');
          console.log('[OAuth] Authorization code received, redirecting to app...');
          
          // Always redirect through the HTTPS auth-callback page.
          // Direct window.location.href to a custom URL scheme (fotolokashen://...)
          // can be blocked by browser security inside ASWebAuthenticationSession.
          // The /app/auth-callback page handles the custom-scheme redirect for us.
          const callbackUrl = new URL('/app/auth-callback', window.location.origin);
          callbackUrl.searchParams.set('code', oauthResult.authorization_code);
          setOauthDebug(`4/4: Navigating to ${callbackUrl.toString()}`);
          window.location.href = callbackUrl.toString();
          return;
        } catch (oauthError) {
          setOauthDebug(`CATCH: ${oauthError}`);
          console.error('[OAuth] Error during OAuth flow:', oauthError);
          toast.error(TOAST.AUTH.OAUTH_FLOW_FAILED);
          return;
        }
      }

      // Normal web login - redirect to returnUrl or map
      setTimeout(() => {
        if (returnUrl) {
          window.location.href = decodeURIComponent(returnUrl);
        } else {
          window.location.href = '/map';
        }
      }, 200);
    } catch (error) {
      console.error('Login error:', error);
      toast.error(TOAST.GENERIC.UNEXPECTED);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      {oauthDebug && (
        <div className="bg-yellow-100 text-yellow-900 text-xs p-2 rounded-t-lg font-mono">
          [OAuth Debug] {oauthDebug}
        </div>
      )}
      <CardHeader className="space-y-0.5 pb-3 sm:space-y-1 sm:pb-4">
        <CardTitle className="text-xl sm:text-2xl font-bold">Welcome Back</CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          {message === 'location' ? (
            <span className="text-primary font-medium">
              To view this location please login or{' '}
              <Link 
                href={`/register${returnUrl ? `?returnUrl=${encodeURIComponent(returnUrl)}` : ''}`}
                className="underline hover:text-primary-foreground"
              >
                create an account if you don't have one
              </Link>
              .
            </span>
          ) : (
            'Enter Your Creds Below'
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 sm:space-y-4">
          <div className="space-y-1">
            <Label htmlFor="email" className="text-xs sm:text-sm">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              {...register('email')}
              disabled={isLoading}
              className={`h-9 sm:h-10 text-sm ${errors.email ? 'border-destructive focus-visible:ring-destructive' : ''}`}
              aria-invalid={errors.email ? 'true' : 'false'}
            />
            {errors.email && (
              <p className="text-xs text-destructive font-medium">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-xs sm:text-sm">Password</Label>
              <Link href="/forgot-password" className="text-xs sm:text-sm text-primary hover:underline">
                Forgot Password?
              </Link>
            </div>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                {...register('password')}
                disabled={isLoading}
                className={`h-9 sm:h-10 text-sm pr-10 ${errors.password ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                aria-invalid={errors.password ? 'true' : 'false'}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none"
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs text-destructive font-medium">{errors.password.message}</p>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="rememberMe"
              {...register('rememberMe')}
              disabled={isLoading}
              className="h-4 w-4 rounded border-border"
            />
            <Label htmlFor="rememberMe" className="text-sm font-normal">
              Remember me for 30 days
            </Label>
          </div>

          <Button type="submit" className="w-full h-9 sm:h-10" disabled={isLoading}>
            {isLoading ? 'Logging in...' : 'Login'}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="pt-0 pb-4">
        <p className="text-xs sm:text-sm text-muted-foreground">
          No account?{' '}
          <Link href="/register" className="text-primary hover:underline font-medium">
            Create Account
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
