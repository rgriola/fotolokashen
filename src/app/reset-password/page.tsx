'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import Image from 'next/image';
import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

function ResetPasswordContent() {
    const searchParams = useSearchParams();
    const token = searchParams.get('token');

    if (!token) {
        return (
            <div className="w-full max-w-md mx-auto">
                {/* Logo */}
                <div className="mb-6 flex justify-center">
                    <Image
                        src="/logo.png"
                        alt="fotolokashen"
                        width={1200}
                        height={196}
                        className="w-auto h-16 sm:h-20"
                        priority
                    />
                </div>
                <Card className="w-full bg-white/95 backdrop-blur-sm">
                    <CardHeader className="space-y-1 text-center">
                        <div className="mx-auto w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
                            <AlertCircle className="w-6 h-6 text-destructive" />
                        </div>
                        <CardTitle className="text-2xl font-bold">Invalid Reset Link</CardTitle>
                        <CardDescription>
                            This password reset link is missing required information.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-sm text-muted-foreground text-center">
                            Please request a new password reset link.
                        </p>
                        <Link href="/forgot-password" className="block">
                            <Button className="w-full">
                                Request New Reset Link
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="w-full">
            {/* Logo */}
            <div className="mb-6 flex justify-center">
                <Image
                    src="/logo.png"
                    alt="fotolokashen"
                    width={1200}
                    height={196}
                    className="w-auto h-16 sm:h-20"
                    priority
                />
            </div>
            <ResetPasswordForm token={token} />
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden">
            {/* Background Image Layer */}
            <div className="absolute inset-0 opacity-90">
                <Image
                    src="/images/landing/hero/forgot-hero-bg.jpg"
                    alt="Reset password background"
                    fill
                    className="object-cover"
                    priority
                    sizes="100vw"
                />
            </div>
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/80 via-social/80 to-primary/80" />

            {/* Animated Gradient Blur Effects */}
            <div className="absolute -top-24 right-0 h-96 w-96 rounded-full bg-primary/20 blur-3xl animate-pulse" />
            <div className="absolute bottom-0 left-0 h-96 w-96 rounded-full bg-social/20 blur-3xl animate-pulse" />

            {/* Content */}
            <div className="relative z-10 px-4 w-full">
                <Suspense fallback={
                    <Card className="w-full max-w-md mx-auto bg-white/95 backdrop-blur-sm">
                        <CardHeader>
                            <CardTitle>Loading...</CardTitle>
                        </CardHeader>
                    </Card>
                }>
                    <ResetPasswordContent />
                </Suspense>
            </div>
        </div>
    );
}
