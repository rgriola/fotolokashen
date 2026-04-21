'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
    return (
        <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
            {/* Background Image Layer */}
            <div className="absolute inset-0 opacity-90">
                <Image
                    src="/images/landing/hero/hero-background.jpg"
                    alt="404 background"
                    fill
                    className="object-cover"
                    priority
                    sizes="100vw"
                />
            </div>
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-linear-to-br from-primary/80 via-social/80 to-primary/80" />

            {/* Animated Gradient Blur Effects */}
            <div className="absolute -top-24 right-0 h-96 w-96 rounded-full bg-primary/20 blur-3xl animate-pulse" />
            <div className="absolute bottom-0 left-0 h-96 w-96 rounded-full bg-social/20 blur-3xl animate-pulse" />

            {/* Content */}
            <div className="relative z-10 max-w-2xl w-full mx-4 text-center">
                {/* 404 Number */}
                <div className="mb-8">
                    <h1 className="text-9xl font-bold bg-linear-to-r from-primary/60 to-social/60 bg-clip-text text-transparent">
                        404
                    </h1>
                </div>

                {/* Title */}
                <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                    Page Not Found
                </h2>

                {/* Description */}
                <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-md mx-auto">
                    Oops! The page you're looking for seems to have wandered off the map.
                </p>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button
                        size="lg"
                        asChild
                        className="bg-linear-to-r from-primary to-social hover:from-primary/90 hover:to-social text-white shadow-lg shadow-primary/50"
                    >
                        <Link href="/">
                            <Home className="mr-2 h-5 w-5" />
                            Go Home
                        </Link>
                    </Button>
                    <Button
                        size="lg"
                        variant="outline"
                        asChild
                        className="bg-white/10 backdrop-blur-sm text-white border-white/30 hover:bg-white/20"
                    >
                        <Link href="/">
                            <ArrowLeft className="mr-2 h-5 w-5" />
                            Return Home
                        </Link>
                    </Button>
                </div>

                {/* Additional Help */}
                <div className="mt-12 p-6 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
                    <h3 className="text-lg font-semibold text-white mb-2">
                        Lost your way?
                    </h3>
                    <p className="text-muted-foreground text-sm">
                        Try using the navigation menu or search for locations on the map page.
                    </p>
                </div>
            </div>
        </div>
    );
}
