'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

export default function VerifyEmailPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('');
    const [countdown, setCountdown] = useState(3);
    const [shouldRedirect, setShouldRedirect] = useState(false);

    useEffect(() => {
        const token = searchParams.get('token');

        if (!token) {
            setStatus('error');
            setMessage('No verification token provided');
            return;
        }

        // Call the verification API
        fetch(`/api/auth/verify-email?token=${token}`)
            .then((res) => res.json())
            .then((data) => {
                if (data.success) {
                    setStatus('success');
                    setMessage(data.message || 'Email verified successfully!');

                    // Auto-redirect for already verified emails
                    if (data.alreadyVerified) {
                        setShouldRedirect(true);
                    }
                } else {
                    setStatus('error');
                    setMessage(data.error || 'Verification failed');
                }
            })
            .catch(() => {
                setStatus('error');
                setMessage('An error occurred during verification');
            });
    }, [searchParams]);

    // Countdown and redirect for already-verified emails
    useEffect(() => {
        if (shouldRedirect && countdown > 0) {
            const timer = setTimeout(() => {
                setCountdown(countdown - 1);
            }, 1000);
            return () => clearTimeout(timer);
        } else if (shouldRedirect && countdown === 0) {
            router.push('/login');
        }
    }, [shouldRedirect, countdown, router]);

    return (
        <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
            {/* Background Image Layer */}
            <div
                className="absolute inset-0 bg-cover bg-center opacity-90"
                style={{ backgroundImage: 'url(/images/landing/hero/verify-email-bg.jpg)' }}
            />
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/80 via-purple-900/80 to-indigo-900/80" />

            {/* Animated Gradient Blur Effects */}
            <div className="absolute -top-24 right-0 h-96 w-96 rounded-full bg-blue-400/20 blur-3xl animate-pulse" />
            <div className="absolute bottom-0 left-0 h-96 w-96 rounded-full bg-purple-400/20 blur-3xl animate-pulse" />

            {/* Content */}
            <div className="relative z-10 max-w-md w-full bg-white/95 backdrop-blur-sm rounded-lg shadow-xl p-8 mx-4">
                {status === 'loading' && (
                    <div className="text-center">
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                        <h2 className="mt-4 text-xl font-semibold text-gray-800">
                            Verifying your email...
                        </h2>
                    </div>
                )}

                {status === 'success' && (
                    <div className="text-center">
                        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                            <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                            </svg>
                        </div>
                        <h2 className="mt-4 text-2xl font-bold text-gray-900">Success!</h2>
                        <p className="mt-2 text-gray-600">{message}</p>
                        {shouldRedirect && countdown > 0 && (
                            <p className="mt-3 text-sm text-indigo-600 font-medium">
                                Redirecting to login in {countdown} second{countdown !== 1 ? 's' : ''}...
                            </p>
                        )}
                        <div className="mt-6 space-y-3">
                            <Link
                                href="/login"
                                className="block w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
                            >
                                Go to Login
                            </Link>
                            <Link
                                href="/"
                                className="block w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-4 rounded-lg transition-colors"
                            >
                                Go to Home
                            </Link>
                        </div>
                    </div>
                )}

                {status === 'error' && (
                    <div className="text-center">
                        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                            <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                        </div>
                        <h2 className="mt-4 text-2xl font-bold text-gray-900">Verification Failed</h2>
                        <p className="mt-2 text-gray-600">{message}</p>
                        <div className="mt-6 space-y-3">
                            <Link
                                href="/register"
                                className="block w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
                            >
                                Register Again
                            </Link>
                            <Link
                                href="/"
                                className="block w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-4 rounded-lg transition-colors"
                            >
                                Go to Home
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
