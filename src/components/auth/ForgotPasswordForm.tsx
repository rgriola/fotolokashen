'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';

// Validation schema
const forgotPasswordSchema = z.object({
    email: z.string().email('Invalid email address').toLowerCase().trim(),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export function ForgotPasswordForm() {
    const [isLoading, setIsLoading] = useState(false);
    const [emailSent, setEmailSent] = useState(false);
    const [submittedEmail, setSubmittedEmail] = useState('');

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<ForgotPasswordFormData>({
        resolver: zodResolver(forgotPasswordSchema),
    });

    const onSubmit = async (data: ForgotPasswordFormData) => {
        setIsLoading(true);

        try {
            const response = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            const result = await response.json();

            if (!response.ok) {
                toast.error(result.error || 'Failed to send reset email');
                return;
            }

            // Show success state
            setEmailSent(true);
            setSubmittedEmail(data.email);
            toast.success('Check your email for reset instructions');
        } catch (error) {
            console.error('Forgot password error:', error);
            toast.error('An unexpected error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    if (emailSent) {
        return (
            <Card className="w-full max-w-md mx-auto">
                <CardHeader className="space-y-1 text-center">
                    <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                        <CheckCircle className="w-6 h-6 text-green-600" />
                    </div>
                    <CardTitle className="text-2xl font-bold">Check Your Email</CardTitle>
                    <CardDescription>
                        If an account exists with {submittedEmail}, we've sent password reset instructions.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p className="text-sm text-blue-800">
                            <strong>Didn't receive an email?</strong>
                        </p>
                        <ul className="text-sm text-blue-700 mt-2 space-y-1 list-disc list-inside">
                            <li>Check your spam or junk folder</li>
                            <li>Make sure you entered the correct email</li>
                            <li>Wait a few minutes and check again</li>
                        </ul>
                    </div>

                    <div className="text-center text-sm text-gray-600">
                        <p>The reset link will expire in <strong>15 minutes</strong>.</p>
                    </div>
                </CardContent>
                <CardFooter className="flex flex-col space-y-2">
                    <Link href="/login" className="w-full">
                        <Button variant="outline" className="w-full">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Login
                        </Button>
                    </Link>
                </CardFooter>
            </Card>
        );
    }

    return (
        <Card className="w-full max-w-md mx-auto">
            <CardHeader className="space-y-1">
                <CardTitle className="text-2xl font-bold">Forgot Password?</CardTitle>
                <CardDescription>
                    Enter your email address and we'll send you instructions to reset your password.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                            <Input
                                id="email"
                                type="email"
                                placeholder="you@example.com"
                                {...register('email')}
                                disabled={isLoading}
                                className={`pl-9 ${errors.email ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                                aria-invalid={errors.email ? 'true' : 'false'}
                            />
                        </div>
                        {errors.email && (
                            <p className="text-sm text-red-500 font-medium">{errors.email.message}</p>
                        )}
                    </div>

                    <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? 'Sending...' : 'Send Reset Instructions'}
                    </Button>
                </form>
            </CardContent>
            <CardFooter className="flex flex-col space-y-2">
                <div className="text-sm text-gray-600">
                    Remember your password?{' '}
                    <Link href="/login" className="text-blue-600 hover:underline font-medium">
                        Back to Login
                    </Link>
                </div>
            </CardFooter>
        </Card>
    );
}
