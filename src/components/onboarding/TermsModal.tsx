'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { useOnboarding } from './OnboardingProvider';
import { MarkdownContent } from '@/components/markdown/MarkdownContent';

export function TermsModal() {
    const { showTermsModal, setShowTermsModal } = useOnboarding();
    const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
    const [isChecked, setIsChecked] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [termsContent, setTermsContent] = useState<string>('');
    const [privacyContent, setPrivacyContent] = useState<string>('');
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // Fetch markdown content when modal opens
    useEffect(() => {
        if (showTermsModal && !termsContent) {
            fetch('/api/content/legal')
                .then(res => res.json())
                .then(data => {
                    setTermsContent(data.termsContent || '');
                    setPrivacyContent(data.privacyContent || '');
                })
                .catch(() => {
                    setError('Failed to load terms. Please try again.');
                });
        }
    }, [showTermsModal, termsContent]);

    const handleScroll = () => {
        if (!scrollContainerRef.current) return;

        const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
        const scrollPercentage = (scrollTop + clientHeight) / scrollHeight;

        if (scrollPercentage > 0.9 && !hasScrolledToBottom) {
            setHasScrolledToBottom(true);
        }
    };

    const handleAccept = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/onboarding/accept-terms', {
                method: 'POST',
                credentials: 'include',
            });

            if (!response.ok) {
                throw new Error('Failed to accept terms');
            }

            // Close terms modal and reload to update user status
            setShowTermsModal(false);
            window.location.reload();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={showTermsModal} modal>
            <DialogContent 
                className="max-w-4xl max-h-[90dvh] flex flex-col [&>button]:hidden"
                onPointerDownOutside={(e) => e.preventDefault()}
                onEscapeKeyDown={(e) => e.preventDefault()}
            >
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold">Terms of Service & Privacy Policy</DialogTitle>
                    <DialogDescription>
                        Please read and accept our terms to continue using fotolokashen
                    </DialogDescription>
                </DialogHeader>

                <div
                    ref={scrollContainerRef}
                    onScroll={handleScroll}
                    className="flex-1 min-h-0 overflow-y-auto p-6 bg-muted rounded-lg border border-border space-y-6"
                >
                    {termsContent ? (
                        <MarkdownContent content={termsContent} />
                    ) : (
                        <p className="text-muted-foreground">Loading terms...</p>
                    )}

                    <hr className="border-border" />

                    {privacyContent ? (
                        <MarkdownContent content={privacyContent} />
                    ) : (
                        <p className="text-muted-foreground">Loading privacy policy...</p>
                    )}

                    <div className="h-12" /> {/* Bottom spacer for better scroll experience */}
                </div>

                {error && (
                    <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg text-sm">
                        {error}
                        <Button
                            onClick={() => setError(null)}
                            variant="ghost"
                            size="sm"
                            className="ml-2 text-destructive hover:text-destructive"
                        >
                            Dismiss
                        </Button>
                    </div>
                )}

                <div className="shrink-0 space-y-4 pt-4 border-t border-border">
                    <div className="flex items-start space-x-3">
                        <Checkbox
                            id="terms-checkbox"
                            checked={isChecked}
                            onCheckedChange={(checked) => setIsChecked(checked as boolean)}
                            disabled={!hasScrolledToBottom}
                            className="mt-1"
                        />
                        <label
                            htmlFor="terms-checkbox"
                            className={`text-sm leading-relaxed ${
                                hasScrolledToBottom ? 'text-foreground' : 'text-muted-foreground'
                            }`}
                        >
                            I have read and accept the Terms of Service and Privacy Policy
                            {!hasScrolledToBottom && (
                                <span className="block text-xs text-muted-foreground mt-1">
                                    Please scroll to the bottom to enable this checkbox
                                </span>
                            )}
                        </label>
                    </div>

                    <Button
                        onClick={handleAccept}
                        disabled={!isChecked || isLoading}
                        className="w-full"
                        size="lg"
                    >
                        {isLoading ? 'Accepting...' : 'Accept & Continue'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
