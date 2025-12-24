'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
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
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-1 text-center">
                    <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                        <AlertCircle className="w-6 h-6 text-red-600" />
                    </div>
                    <CardTitle className="text-2xl font-bold">Invalid Reset Link</CardTitle>
                    <CardDescription>
                        This password reset link is missing required information.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-sm text-gray-600 text-center">
                        Please request a new password reset link.
                    </p>
                    <Link href="/forgot-password" className="block">
                        <Button className="w-full">
                            Request New Reset Link
                        </Button>
                    </Link>
                </CardContent>
            </Card>
        );
    }

    return <ResetPasswordForm token={token} />;
}

export default function ResetPasswordPage() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 px-4">
            <Suspense fallback={
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle>Loading...</CardTitle>
                    </CardHeader>
                </Card>
            }>
                <ResetPasswordContent />
            </Suspense>
        </div>
    );
}
