'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, Loader2, Shield } from 'lucide-react';

function CancelEmailChangeContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token');

    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('');

    useEffect(() => {
        if (!token) {
            setStatus('error');
            setMessage('No cancellation token provided');
            return;
        }

        const cancelEmailChange = async () => {
            try {
                const response = await fetch('/api/auth/change-email/cancel', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ cancelToken: token }),
                });

                const result = await response.json();

                if (!response.ok) {
                    setStatus('error');

                    // Specific error messages
                    if (result.code === 'INVALID_TOKEN') {
                        setMessage('Invalid cancellation link.');
                    } else if (result.code === 'ALREADY_COMPLETED') {
                        setMessage('This email change has already been completed and cannot be cancelled.');
                    } else if (result.code === 'ALREADY_CANCELLED') {
                        setMessage('This email change has already been cancelled.');
                    } else {
                        setMessage(result.error || 'Failed to cancel email change');
                    }
                    return;
                }

                setStatus('success');
                setMessage('Email change cancelled successfully. Your email address remains unchanged.');
            } catch (error) {
                console.error('Cancellation error:', error);
                setStatus('error');
                setMessage('An unexpected error occurred');
            }
        };

        cancelEmailChange();
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
                        {status === 'loading' && 'Cancelling Email Change...'}
                        {status === 'success' && 'Email Change Cancelled'}
                        {status === 'error' && 'Cancellation Failed'}
                    </CardTitle>
                    <CardDescription>{message}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {status === 'success' && (
                        <div className="text-center space-y-4">
                            <div className="flex gap-3 p-4 rounded-lg border border-success/20 bg-success/10 dark:border-success dark:bg-success/10">
                                <Shield className="h-5 w-5 text-success dark:text-success flex-shrink-0 mt-0.5" />
                                <div className="text-sm text-success dark:text-success-foreground">
                                    <strong>Your account is secure:</strong> The email change request has been cancelled.
                                    Your current email address remains active.
                                </div>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                If you didn't request this email change, we recommend changing your password immediately.
                            </p>
                            <div className="flex flex-col gap-2">
                                <Button onClick={() => router.push('/profile')} className="w-full">
                                    Go to Profile
                                </Button>
                                <Button onClick={() => router.push('/login')} variant="outline" className="w-full">
                                    Go to Login
                                </Button>
                            </div>
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

export default function CancelEmailChangePage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-16 w-16 text-primary animate-spin" />
            </div>
        }>
            <CancelEmailChangeContent />
        </Suspense>
    );
}
