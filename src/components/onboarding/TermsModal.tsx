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

export function TermsModal() {
    const { showTermsModal, setShowTermsModal } = useOnboarding();
    const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
    const [isChecked, setIsChecked] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

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
                className="max-w-4xl max-h-[90vh] flex flex-col [&>button]:hidden"
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
                    className="flex-1 overflow-y-auto p-6 bg-gray-50 rounded-lg border border-gray-200 space-y-6"
                >
                    {/* Terms of Service */}
                    <section>
                        <h2 className="text-xl font-semibold mb-4">Terms of Service</h2>
                        <div className="space-y-4 text-sm text-gray-700">
                            <p>
                                Welcome to fotolokashen, a location discovery and sharing platform. By accessing or using our service, you agree to be bound by these Terms of Service.
                            </p>

                            <div>
                                <h3 className="font-semibold text-gray-900 mb-2">1. Acceptance of Terms</h3>
                                <p>
                                    By creating an account, you confirm that you are at least 13 years old and agree to these terms. If you do not agree, please do not use our service.
                                </p>
                            </div>

                            <div>
                                <h3 className="font-semibold text-gray-900 mb-2">2. User Accounts</h3>
                                <p>
                                    You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to notify us immediately of any unauthorized access.
                                </p>
                            </div>

                            <div>
                                <h3 className="font-semibold text-gray-900 mb-2">3. Content</h3>
                                <p>
                                    You retain ownership of content you upload but grant fotolokashen a license to use, display, and distribute your content as part of the service. You are responsible for ensuring you have the right to share any content you upload.
                                </p>
                            </div>

                            <div>
                                <h3 className="font-semibold text-gray-900 mb-2">4. Prohibited Conduct</h3>
                                <p>
                                    You may not use fotolokashen to: violate any laws, infringe on others&apos; rights, distribute malware, spam users, or engage in any harmful activity.
                                </p>
                            </div>

                            <div>
                                <h3 className="font-semibold text-gray-900 mb-2">5. Termination</h3>
                                <p>
                                    We reserve the right to suspend or terminate your account at any time for violations of these terms or for any other reason at our discretion.
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* Privacy Policy */}
                    <section className="pt-6 border-t border-gray-300">
                        <h2 className="text-xl font-semibold mb-4">Privacy Policy</h2>
                        <div className="space-y-4 text-sm text-gray-700">
                            <p>
                                Your privacy is important to us. This policy explains how we collect, use, and protect your personal information.
                            </p>

                            <div>
                                <h3 className="font-semibold text-gray-900 mb-2">1. Information We Collect</h3>
                                <p>
                                    We collect information you provide directly (account details, profile information, locations saved), automatically (usage data, device information, GPS location when permitted), and from third parties (OAuth providers like Google and Apple).
                                </p>
                            </div>

                            <div>
                                <h3 className="font-semibold text-gray-900 mb-2">2. How We Use Your Information</h3>
                                <p>
                                    We use your information to provide and improve our services, personalize your experience, communicate with you, ensure security, and comply with legal obligations.
                                </p>
                            </div>

                            <div>
                                <h3 className="font-semibold text-gray-900 mb-2">3. Information Sharing</h3>
                                <p>
                                    We do not sell your personal information. We may share data with service providers, when required by law, or with your consent. Your saved locations are only visible according to your privacy settings.
                                </p>
                            </div>

                            <div>
                                <h3 className="font-semibold text-gray-900 mb-2">4. Data Security</h3>
                                <p>
                                    We implement industry-standard security measures to protect your data, including encryption, secure authentication, and regular security audits.
                                </p>
                            </div>

                            <div>
                                <h3 className="font-semibold text-gray-900 mb-2">5. Your Rights</h3>
                                <p>
                                    You have the right to access, modify, or delete your personal information. You can manage your privacy settings, export your data, or request account deletion at any time.
                                </p>
                            </div>

                            <div>
                                <h3 className="font-semibold text-gray-900 mb-2">6. Cookies and Tracking</h3>
                                <p>
                                    We use cookies and similar technologies to maintain your session, remember your preferences, and analyze usage patterns. You can manage cookie preferences in your browser settings.
                                </p>
                            </div>

                            <div>
                                <h3 className="font-semibold text-gray-900 mb-2">7. Changes to This Policy</h3>
                                <p>
                                    We may update this policy from time to time. We will notify you of significant changes via email or in-app notification.
                                </p>
                            </div>

                            <div>
                                <h3 className="font-semibold text-gray-900 mb-2">8. Contact Us</h3>
                                <p>
                                    If you have questions about these terms or our privacy practices, please contact us at support@fotolokashen.com.
                                </p>
                            </div>
                        </div>
                    </section>

                    <div className="h-12" /> {/* Bottom spacer for better scroll experience */}
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm">
                        {error}
                        <Button
                            onClick={() => setError(null)}
                            variant="ghost"
                            size="sm"
                            className="ml-2 text-red-800 hover:text-red-900"
                        >
                            Dismiss
                        </Button>
                    </div>
                )}

                <div className="space-y-4 pt-4 border-t border-gray-200">
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
                                hasScrolledToBottom ? 'text-gray-900' : 'text-gray-400'
                            }`}
                        >
                            I have read and accept the Terms of Service and Privacy Policy
                            {!hasScrolledToBottom && (
                                <span className="block text-xs text-gray-500 mt-1">
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
