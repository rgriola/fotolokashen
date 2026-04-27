import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MarkdownContent } from './MarkdownContent';

interface MarkdownPageLayoutProps {
    content: string;
    backHref?: string;
    backLabel?: string;
}

/**
 * Server Component layout for rendering a full-page markdown document.
 * Used by /terms, /privacy-policy, and /support pages.
 *
 * Usage:
 *   import content from '@/content/terms-of-service.md';
 *   <MarkdownPageLayout content={content} />
 */
export function MarkdownPageLayout({
    content,
    backHref = '/',
    backLabel = 'Back to Home',
}: MarkdownPageLayoutProps) {
    return (
        <div className="min-h-screen bg-background">
            <div className="container max-w-4xl mx-auto px-4 py-8 md:py-12">
                <Link href={backHref}>
                    <Button variant="ghost" className="mb-6 -ml-2">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        {backLabel}
                    </Button>
                </Link>

                <MarkdownContent content={content} />

                <div className="mt-12 pt-8 border-t">
                    <p className="text-sm text-muted-foreground text-center">
                        © {new Date().getFullYear()} Sea Lion Media LLC. All rights reserved.
                    </p>
                </div>
            </div>
        </div>
    );
}
