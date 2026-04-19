'use client';

import { useEffect, useState, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { AlertCircle, CheckCircle, Mail, Clock } from 'lucide-react';

type VerificationStatus = 'loading' | 'success' | 'no_token' | 'expired' | 'invalid' | 'error';

export default function VerifyEmailPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [status, setStatus] = useState<VerificationStatus>('loading');
    const [message, setMessage] = useState('');
    const [email, setEmail] = useState('');
    const [countdown, setCountdown] = useState(3);
    const [shouldRedirect, setShouldRedirect] = useState(false);
    const [autoLoginToken, setAutoLoginToken] = useState<string | null>(null);
    const verifyingRef = useRef(false);

    useEffect(() => {
        const token = searchParams.get('token');
        const emailParam = searchParams.get('email');
        const resent = searchParams.get('resent');
        const platform = searchParams.get('platform');

        if (emailParam) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setEmail(() => decodeURIComponent(emailParam));
        }

        // If resent=true, show success message for new email sent
        if (resent === 'true') {
            setStatus('no_token');
            setMessage('New verification email sent');
            return;
        }

        // If no token provided, show appropriate message
        if (!token) {
            setStatus('no_token');
            setMessage('No verification token provided');
            return;
        }

        // Prevent double execution in React Strict Mode
        if (verifyingRef.current) return;
        verifyingRef.current = true;

        // Call the verification API — include platform so it can generate auto-login token
        const platformParam = platform ? `&platform=${platform}` : '';
        fetch(`/api/auth/verify-email?token=${token}${platformParam}`)
            .then((res) => res.json())
            .then((data) => {
                if (data.success) {
                    setStatus('success');
                    setMessage(data.message || 'Email verified successfully!');

                    // Store auto-login token if provided (iOS flow)
                    if (data.autoLoginToken) {
                        setAutoLoginToken(data.autoLoginToken);
                    }

                    // Auto-redirect: for already-verified emails OR iOS first-time verifications
                    if (data.alreadyVerified || (platform === 'ios' && data.autoLoginToken)) {
                        setShouldRedirect(true);
                    }
                } else {
                    // Determine specific error type based on error code or message
                    const errorMsg = data.error || 'Verification failed';
                    const errorCode = data.code;

                    if (errorCode === 'TOKEN_EXPIRED' || errorMsg.includes('expired')) {
                        setStatus('expired');
                        setMessage('Your verification link has expired');
                    } else if (errorMsg.includes('Invalid')) {
                        setStatus('invalid');
                        setMessage('This verification link is invalid');
                    } else {
                        setStatus('error');
                        setMessage(errorMsg);
                    }
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
            // If user registered from iOS, redirect to the app via deep link
            const platform = searchParams.get('platform');
            if (platform === 'ios') {
                const tokenParam = autoLoginToken ? `?token=${autoLoginToken}` : '';
                window.location.href = `fotolokashen://email-verified${tokenParam}`;
            } else {
                router.push('/login');
            }
        }
    }, [shouldRedirect, countdown, router, searchParams]);

    return (
        <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
            {/* Background Image Layer */}
            <div
                className="absolute inset-0 bg-cover bg-center opacity-90"
                style={{ backgroundImage: 'url(/images/landing/hero/verify-email-bg.jpg)' }}
            />
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/80 via-social/80 to-primary/80" />

            {/* Animated Gradient Blur Effects */}
            <div className="absolute -top-24 right-0 h-96 w-96 rounded-full bg-primary/20 blur-3xl animate-pulse" />
            <div className="absolute bottom-0 left-0 h-96 w-96 rounded-full bg-social/20 blur-3xl animate-pulse" />

            {/* Content */}
            <div className="relative z-10 max-w-md w-full mx-4">
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
                
                <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-xl p-8">
                {/* Loading State */}
                {status === 'loading' && (
                    <div className="text-center">
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                        <h2 className="mt-4 text-xl font-semibold text-foreground">
                            Verifying your email...
                        </h2>
                    </div>
                )}

                {/* Success State */}
                {status === 'success' && (
                    <div className="text-center">
                        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-success/10">
                            <CheckCircle className="h-10 w-10 text-success" />
                        </div>
                        <h2 className="mt-4 text-2xl font-bold text-foreground">Email Verified!</h2>
                        <p className="mt-2 text-muted-foreground">{message}</p>
                        <p className="mt-3 text-sm text-muted-foreground">
                            You should receive a welcome email shortly.
                        </p>
                        {shouldRedirect && countdown > 0 && (
                            <p className="mt-3 text-sm text-primary font-medium">
                                Redirecting to login in {countdown} second{countdown !== 1 ? 's' : ''}...
                            </p>
                        )}
                        <div className="mt-6 space-y-3">
                            {/* iOS users: deep-link back to the app with auto-login token */}
                            {searchParams.get('platform') === 'ios' ? (
                                <>
                                    <a
                                        href={`fotolokashen://email-verified${autoLoginToken ? `?token=${autoLoginToken}` : ''}`}
                                        className="block w-full bg-primary hover:bg-primary/90 text-white text-center font-medium py-3 px-4 rounded-lg transition-colors"
                                    >
                                        Continue to fotolokashen
                                    </a>
                                    <Link
                                        href="/login"
                                        className="block w-full bg-muted hover:bg-muted text-foreground text-center font-medium py-3 px-4 rounded-lg transition-colors"
                                    >
                                        Or Login on Web
                                    </Link>
                                </>
                            ) : (
                                <>
                                    <Link
                                        href="/login"
                                        className="block w-full bg-primary hover:bg-primary/90 text-white text-center font-medium py-3 px-4 rounded-lg transition-colors"
                                    >
                                        Go to Login
                                    </Link>
                                    <Link
                                        href="/"
                                        className="block w-full bg-muted hover:bg-muted text-foreground text-center font-medium py-3 px-4 rounded-lg transition-colors"
                                    >
                                        Go to Home
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                )}

                {/* No Token - Check Email */}
                {status === 'no_token' && (
                    <div className="text-center">
                        <div className={`mx-auto flex items-center justify-center h-16 w-16 rounded-full ${message === 'New verification email sent' ? 'bg-success/10' : 'bg-warning/10'}`}>
                            {message === 'New verification email sent' ? (
                                <CheckCircle className="h-10 w-10 text-success" />
                            ) : (
                                <Mail className="h-10 w-10 text-warning" />
                            )}
                        </div>
                        <h2 className="mt-4 text-2xl font-bold text-foreground">
                            {message === 'New verification email sent' ? 'Check Your Email' : 'Check Your Email'}
                        </h2>
                        <div className={`mt-4 p-4 rounded-lg border ${message === 'New verification email sent' ? 'bg-success/10 border-success/20' : 'bg-warning/10 border-warning/20'}`}>
                            {message === 'New verification email sent' ? (
                                <>
                                    <p className="text-sm text-success font-semibold">
                                        ✅ New verification email sent!
                                    </p>
                                    <p className="mt-2 text-sm text-success">
                                        We just sent a fresh verification link to <strong>{email}</strong>
                                    </p>
                                    <p className="mt-2 text-sm text-success">
                                        The previous link has expired. Please use the new link.
                                    </p>
                                </>
                            ) : (
                                <>
                                    <p className="text-sm text-warning">
                                        <strong>Email not verified yet.</strong>
                                    </p>
                                    <p className="mt-2 text-sm text-warning">
                                        Please check your email inbox for the confirmation link we sent you during registration.
                                    </p>
                                </>
                            )}
                        </div>
                        {email && message !== 'New verification email sent' && (
                            <p className="mt-3 text-sm text-muted-foreground">
                                Confirmation email sent to: <strong>{email}</strong>
                            </p>
                        )}
                        <div className="mt-6 space-y-3">
                            <Link
                                href="/login"
                                className="block w-full bg-primary hover:bg-primary/90 text-white font-medium py-3 px-4 rounded-lg transition-colors"
                            >
                                Back to Login
                            </Link>
                            <Link
                                href="/"
                                className="block w-full bg-muted hover:bg-muted text-foreground font-medium py-3 px-4 rounded-lg transition-colors"
                            >
                                Go to Home
                            </Link>
                        </div>
                        <p className="mt-4 text-xs text-muted-foreground">
                            Didn't receive the email? Check your spam folder or contact support.
                        </p>
                    </div>
                )}

                {/* Expired Token */}
                {status === 'expired' && (
                    <div className="text-center">
                        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-warning/10">
                            <Clock className="h-10 w-10 text-warning" />
                        </div>
                        <h2 className="mt-4 text-2xl font-bold text-foreground">Link Expired</h2>
                        <div className="mt-4 p-4 bg-warning/10 border border-warning/20 rounded-lg">
                            <p className="text-sm text-warning">
                                <strong>Your verification link has expired.</strong>
                            </p>
                            <p className="mt-2 text-sm text-warning">
                                For security reasons, email verification links expire after 30 minutes.
                            </p>
                        </div>
                        <div className="mt-6 space-y-3">
                            <Link
                                href="/forgot-password"
                                className="block w-full bg-primary hover:bg-primary/90 text-white font-medium py-3 px-4 rounded-lg transition-colors"
                            >
                                Request New Verification Link
                            </Link>
                            <Link
                                href="/login"
                                className="block w-full bg-muted hover:bg-muted text-foreground font-medium py-3 px-4 rounded-lg transition-colors"
                            >
                                Back to Login
                            </Link>
                        </div>
                        <p className="mt-4 text-xs text-muted-foreground">
                            Use the "Forgot Password" flow to receive a new verification email.
                        </p>
                    </div>
                )}

                {/* Invalid Token or Other Error */}
                {(status === 'invalid' || status === 'error') && (
                    <div className="text-center">
                        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-warning/10">
                            <AlertCircle className="h-10 w-10 text-warning" />
                        </div>
                        <h2 className="mt-4 text-2xl font-bold text-foreground">Verification Issue</h2>
                        <div className="mt-4 p-4 bg-warning/10 border border-warning/20 rounded-lg">
                            <p className="text-sm text-warning">
                                <strong>{message}</strong>
                            </p>
                            <p className="mt-2 text-sm text-warning">
                                The verification link may have already been used or is no longer valid.
                            </p>
                        </div>
                        <div className="mt-6 space-y-3">
                            <Link
                                href="/login"
                                className="block w-full bg-primary hover:bg-primary/90 text-white font-medium py-3 px-4 rounded-lg transition-colors"
                            >
                                Try Logging In
                            </Link>
                            <Link
                                href="/forgot-password"
                                className="block w-full bg-muted hover:bg-muted text-foreground font-medium py-3 px-4 rounded-lg transition-colors"
                            >
                                Request New Link
                            </Link>
                        </div>
                        <p className="mt-4 text-xs text-muted-foreground">
                            If your email is already verified, you can log in directly.
                        </p>
                    </div>
                )}
                </div>
            </div>
        </div>
    );
}
