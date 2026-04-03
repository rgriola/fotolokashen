import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LogOut, ArrowRight } from 'lucide-react';

export default function LogoutPage() {
    return (
        <div className="relative flex min-h-screen flex-col overflow-hidden">
            {/* Background Image Layer - uses same image as login but with unique class for future customization */}
            <div
                className="logout-bg-image absolute inset-0 bg-cover bg-center opacity-90"
                style={{ backgroundImage: 'url(/images/landing/hero/login-hero-bg.jpg)' }}
            />
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/80 via-social/80 to-primary/80" />

            {/* Animated Gradient Blur Effects */}
            <div className="absolute -top-24 right-0 h-96 w-96 rounded-full bg-primary/20 blur-3xl animate-pulse" />
            <div className="absolute bottom-0 left-0 h-96 w-96 rounded-full bg-social/20 blur-3xl animate-pulse" />

            {/* Content - Centered */}
            <div className="relative z-10 w-full px-4 md:px-6 lg:px-8 flex-1 flex items-center justify-center">
                <Card className="w-full max-w-md shadow-2xl border-white/10 bg-white/95 backdrop-blur-sm">
                    <CardHeader className="text-center">
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                            <LogOut className="h-8 w-8 text-primary" />
                        </div>
                        <CardTitle className="text-2xl">You&apos;ve been logged out</CardTitle>
                        <CardDescription className="text-base mt-2">
                            Your session has ended successfully. Thank you for using our app.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-sm text-muted-foreground text-center">
                            You can sign in again or return to the home page.
                        </p>
                        <Button asChild className="w-full" size="lg">
                            <Link href="/login">
                                Sign In Again
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                        <Button asChild variant="outline" className="w-full" size="lg">
                            <Link href="/">
                                Go to Home
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
