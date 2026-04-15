'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { TOAST } from '@/lib/constants/messages';
import { Eye, EyeOff } from 'lucide-react';
import { DateOfBirthPicker } from './DateOfBirthPicker';

// ─── Validation Schema ────────────────────────────────────────────────────────

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(50, 'Username must be less than 50 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens')
    .toLowerCase()
    .trim(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
}).refine((data) => {
  if (!data.dateOfBirth || data.dateOfBirth.length !== 10) return false;
  const birthDate = new Date(data.dateOfBirth);
  const today = new Date();
  const age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  const dayDiff = today.getDate() - birthDate.getDate();
  const actualAge = monthDiff < 0 || (monthDiff === 0 && dayDiff < 0) ? age - 1 : age;
  return actualAge >= 18;
}, {
  message: 'You must be at least 18 years old to create an account.',
  path: ['dateOfBirth'],
});

type RegisterFormData = z.infer<typeof registerSchema>;

interface RegisterFormProps {
  returnUrl?: string;
  message?: string;
}

// ─── Password Strength ────────────────────────────────────────────────────────

function getPasswordStrength(pass: string): number {
  if (!pass) return 0;
  let strength = 0;
  if (pass.length >= 8) strength++;
  if (/[A-Z]/.test(pass)) strength++;
  if (/[a-z]/.test(pass)) strength++;
  if (/[0-9]/.test(pass)) strength++;
  if (/[^A-Za-z0-9]/.test(pass)) strength++;
  return strength;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function RegisterForm({ returnUrl, message }: RegisterFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    watch,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      dateOfBirth: '', // Intentionally blank — never default to today
    },
  });

  const password = watch('password');
  const confirmPassword = watch('confirmPassword');

  const passwordsMatch = password && confirmPassword && password === confirmPassword;
  const passwordsDontMatch = password && confirmPassword && password !== confirmPassword;
  const passwordStrength = getPasswordStrength(password);

  const onSubmit = useCallback(async (data: RegisterFormData) => {
    setIsLoading(true);
    try {
      const { confirmPassword: _confirm, ...registerData } = data;
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registerData),
      });
      const result = await response.json();
      if (!response.ok) {
        toast.error(result.error || TOAST.AUTH.REGISTER_FAILED);
        return;
      }
      toast.success(TOAST.AUTH.REGISTER_SUCCESS);
      if (returnUrl) {
        router.push(`/login?returnUrl=${encodeURIComponent(returnUrl)}&message=${message || ''}`);
      } else {
        router.push('/login');
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast.error(TOAST.GENERIC.UNEXPECTED);
    } finally {
      setIsLoading(false);
    }
  }, [router, returnUrl, message]);

  return (
    <Card className="w-full">
      {/* Compact header on mobile */}
      <CardHeader className="space-y-0.5 pb-3 sm:space-y-1 sm:pb-4">
        <CardTitle className="text-xl sm:text-2xl font-bold">Create Account</CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          {message === 'location' ? (
            <span className="text-primary font-medium">
              To view this location please create an account or{' '}
              <Link
                href={`/login${returnUrl ? `?returnUrl=${encodeURIComponent(returnUrl)}` : ''}`}
                className="underline hover:text-primary-foreground"
              >
                login if you have one
              </Link>
              .
            </span>
          ) : (
            'Enter your information to get access.'
          )}
        </CardDescription>
      </CardHeader>

      <CardContent className="pb-3 sm:pb-4">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 sm:space-y-4" autoComplete="off">

          {/* First + Last Name row */}
          <div className="grid grid-cols-2 gap-2 sm:gap-4">
            <div className="space-y-1">
              <Label htmlFor="firstName" className="text-xs sm:text-sm">First Name</Label>
              <Input
                id="firstName"
                type="text"
                placeholder="John"
                autoComplete="off"
                {...register('firstName')}
                disabled={isLoading}
                className={`h-9 sm:h-10 text-sm ${errors.firstName ? 'border-destructive focus-visible:ring-destructive' : ''}`}
              />
              {errors.firstName && (
                <p className="text-xs text-destructive font-medium">{errors.firstName.message}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label htmlFor="lastName" className="text-xs sm:text-sm">Last Name</Label>
              <Input
                id="lastName"
                type="text"
                placeholder="Doe"
                autoComplete="off"
                {...register('lastName')}
                disabled={isLoading}
                className={`h-9 sm:h-10 text-sm ${errors.lastName ? 'border-destructive focus-visible:ring-destructive' : ''}`}
              />
              {errors.lastName && (
                <p className="text-xs text-destructive font-medium">{errors.lastName.message}</p>
              )}
            </div>
          </div>

          {/* Email */}
          <div className="space-y-1">
            <Label htmlFor="email" className="text-xs sm:text-sm">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              autoComplete="off"
              {...register('email')}
              disabled={isLoading}
              className={`h-9 sm:h-10 text-sm ${errors.email ? 'border-destructive focus-visible:ring-destructive' : ''}`}
            />
            {errors.email && (
              <p className="text-xs text-destructive font-medium">{errors.email.message}</p>
            )}
          </div>

          {/* Username */}
          <div className="space-y-1">
            <Label htmlFor="username" className="text-xs sm:text-sm">Username</Label>
            <Input
              id="username"
              type="text"
              placeholder="johndoe"
              autoComplete="off"
              {...register('username')}
              disabled={isLoading}
              className={`h-9 sm:h-10 text-sm ${errors.username ? 'border-destructive focus-visible:ring-destructive' : ''}`}
            />
            {errors.username && (
              <p className="text-xs text-destructive font-medium">{errors.username.message}</p>
            )}
          </div>

          {/* ── Date of Birth — custom 3-dropdown picker ── */}
          <Controller
            name="dateOfBirth"
            control={control}
            render={({ field }) => (
              <DateOfBirthPicker
                value={field.value}
                onChange={field.onChange}
                disabled={isLoading}
                hasError={!!errors.dateOfBirth}
              />
            )}
          />
          {errors.dateOfBirth && (
            <p className="text-xs text-destructive font-medium -mt-1">{errors.dateOfBirth.message}</p>
          )}

          {/* Password */}
          <div className="space-y-1">
            <Label htmlFor="password" className="text-xs sm:text-sm">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                autoComplete="new-password"
                {...register('password')}
                disabled={isLoading}
                className={`h-9 sm:h-10 text-sm pr-10 ${errors.password ? 'border-destructive focus-visible:ring-destructive' : ''}`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs text-destructive font-medium">{errors.password.message}</p>
            )}
            {/* Password strength bar */}
            {password && (
              <div className="space-y-0.5">
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className={`h-1 flex-1 rounded ${
                        i < passwordStrength
                          ? passwordStrength <= 2
                            ? 'bg-destructive'
                            : passwordStrength <= 3
                              ? 'bg-warning'
                              : 'bg-success'
                          : 'bg-muted'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  {passwordStrength <= 2 && 'Weak'}
                  {passwordStrength === 3 && 'Fair'}
                  {passwordStrength === 4 && 'Good'}
                  {passwordStrength === 5 && 'Strong'}
                </p>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div className="space-y-1">
            <Label htmlFor="confirmPassword" className="text-xs sm:text-sm">Confirm Password</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="••••••••"
                autoComplete="new-password"
                {...register('confirmPassword')}
                disabled={isLoading}
                className={`h-9 sm:h-10 text-sm pr-20 ${
                  errors.confirmPassword
                    ? 'border-destructive focus-visible:ring-destructive'
                    : passwordsMatch
                      ? 'border-success focus-visible:ring-success'
                      : passwordsDontMatch
                        ? 'border-destructive focus-visible:ring-destructive'
                        : ''
                }`}
              />
              {/* Match indicator icon */}
              {confirmPassword && (
                <div className="absolute right-10 top-1/2 -translate-y-1/2">
                  {passwordsMatch ? (
                    <svg className="h-4 w-4 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : passwordsDontMatch ? (
                    <svg className="h-4 w-4 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  ) : null}
                </div>
              )}
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none"
                tabIndex={-1}
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {confirmPassword && !errors.confirmPassword && (
              <p className={`text-xs font-medium ${passwordsMatch ? 'text-success' : 'text-destructive'}`}>
                {passwordsMatch ? '✓ Passwords match' : '✗ Passwords do not match'}
              </p>
            )}
            {errors.confirmPassword && (
              <p className="text-xs text-destructive font-medium">{errors.confirmPassword.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full h-9 sm:h-10" disabled={isLoading}>
            {isLoading ? 'Setting You Up...' : 'Create Account'}
          </Button>
        </form>
      </CardContent>

      <CardFooter className="pt-0 pb-4">
        <p className="text-xs sm:text-sm text-muted-foreground">
          Have an account?{' '}
          <Link href="/login" className="text-primary hover:underline font-medium">
            Log in
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
