'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

/**
 * /app/auth-callback — Universal Link fallback page
 *
 * When iOS properly intercepts this URL via the AASA file, the user never
 * sees this page — the app opens directly from the redirect.
 *
 * This page only renders when:
 * 1. The app is not installed
 * 2. The AASA file hasn't been fetched yet (first install)
 * 3. The user is on a non-iOS device
 *
 * In those cases, it falls back to the custom scheme deep link.
 */
function AuthCallbackContent() {
    const searchParams = useSearchParams();
    const code = searchParams.get('code');
    const [attemptedDeepLink, setAttemptedDeepLink] = useState(false);

    useEffect(() => {
        if (code) {
            // Try the custom URL scheme as fallback
            window.location.href = `fotolokashen://oauth-callback?code=${code}`;
            // If we're still here after 2 seconds, the app isn't installed
            const timer = setTimeout(() => {
                setAttemptedDeepLink(true);
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [code]);

    if (!code) {
        return (
            <Card className="w-full max-w-md mx-auto">
                <CardHeader className="text-center">
                    <CardTitle>Invalid Callback</CardTitle>
                    <CardDescription>No authorization code was provided.</CardDescription>
                </CardHeader>
            </Card>
        );
    }

    if (attemptedDeepLink) {
        return (
            <Card className="w-full max-w-md mx-auto">
                <CardHeader className="text-center">
                    <CardTitle>Open fotolokashen</CardTitle>
                    <CardDescription>
                        If the app didn&apos;t open automatically, tap the button below.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Button
                        className="w-full"
                        onClick={() => {
                            window.location.href = `fotolokashen://oauth-callback?code=${code}`;
                        }}
                    >
                        Open fotolokashen App
                    </Button>
                    <p className="text-xs text-center text-muted-foreground">
                        Don&apos;t have the app?{' '}
                        <a
                            href="https://apps.apple.com/app/fotolokashen/id6744093755"
                            className="text-primary hover:underline"
                        >
                            Download from the App Store
                        </a>
                    </p>
                </CardContent>
            </Card>
        );
    }

    // Brief loading state while the deep link attempt fires
    return (
        <Card className="w-full max-w-md mx-auto">
            <CardHeader className="text-center">
                <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
                <CardTitle>Opening fotolokashen...</CardTitle>
            </CardHeader>
        </Card>
    );
}

export default function AuthCallbackPage() {
    return (
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden">
            <div
                className="absolute inset-0 bg-cover bg-center opacity-90"
                style={{ backgroundImage: 'url(/images/landing/hero/forgot-hero-bg.jpg)' }}
            />
            <div className="absolute inset-0 bg-gradient-to-br from-primary/80 via-social/80 to-primary/80" />

            <div className="relative z-10 px-4 w-full">
                <Suspense fallback={
                    <Card className="w-full max-w-md mx-auto">
                        <CardHeader>
                            <CardTitle>Loading...</CardTitle>
                        </CardHeader>
                    </Card>
                }>
                    <AuthCallbackContent />
                </Suspense>
            </div>
        </div>
    );
}
