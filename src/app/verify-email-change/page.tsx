'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, Loader2, Mail } from 'lucide-react';

function VerifyEmailChangeContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token');

    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('');

    useEffect(() => {
        if (!token) {
            setStatus('error');
            setMessage('No verification token provided');
            return;
        }

        const verifyEmail = async () => {
            try {
                const response = await fetch('/api/auth/change-email/verify', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token }),
                });

                const result = await response.json();

                if (!response.ok) {
                    setStatus('error');

                    // Specific error messages
                    if (result.code === 'INVALID_TOKEN') {
                        setMessage('Invalid verification link. Please request a new email change.');
                    } else if (result.code === 'TOKEN_EXPIRED') {
                        setMessage('This verification link has expired. Please request a new email change.');
                    } else if (result.code === 'ALREADY_COMPLETED') {
                        setMessage('This email change has already been completed.');
                    } else if (result.code === 'CANCELLED') {
                        setMessage('This email change was cancelled.');
                    } else {
                        setMessage(result.error || 'Failed to verify email change');
                    }
                    return;
                }

                setStatus('success');
                setMessage('Email changed successfully! Please log in with your new email address.');

                // Redirect to login after 3 seconds
                setTimeout(() => {
                    router.push('/login');
                }, 3000);
            } catch (error) {
                console.error('Verification error:', error);
                setStatus('error');
                setMessage('An unexpected error occurred');
            }
        };

        verifyEmail();
    }, [token, router]);

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/10 to-primary/20 dark:from-background dark:to-muted">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4">
                        {status === 'loading' && (
                            <Loader2 className="h-16 w-16 text-primary animate-spin" />
                        )}
                        {status === 'success' && (
                            <CheckCircle2 className="h-16 w-16 text-success" />
                        )}
                        {status === 'error' && (
                            <XCircle className="h-16 w-16 text-destructive" />
                        )}
                    </div>
                    <CardTitle className="text-2xl">
                        {status === 'loading' && 'Verifying Email Change...'}
                        {status === 'success' && 'Email Changed!'}
                        {status === 'error' && 'Verification Failed'}
                    </CardTitle>
                    <CardDescription>{message}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {status === 'success' && (
                        <div className="text-center space-y-4">
                            <div className="flex gap-3 p-4 rounded-lg border border-success/20 bg-success/10 dark:border-success dark:bg-success/10">
                                <Mail className="h-5 w-5 text-success dark:text-success flex-shrink-0 mt-0.5" />
                                <div className="text-sm text-success dark:text-success-foreground">
                                    <strong>All sessions logged out:</strong> For security, you've been logged out of all devices.
                                    You'll be redirected to the login page in a few seconds.
                                </div>
                            </div>
                            <Button onClick={() => router.push('/login')} className="w-full">
                                Go to Login
                            </Button>
                        </div>
                    )}
                    {status === 'error' && (
                        <div className="text-center space-y-4">
                            <Button onClick={() => router.push('/profile')} className="w-full">
                                Back to Profile
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

export default function VerifyEmailChangePage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-16 w-16 text-primary animate-spin" />
            </div>
        }>
            <VerifyEmailChangeContent />
        </Suspense>
    );
}
