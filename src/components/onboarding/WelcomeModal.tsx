'use client';

import { useOnboarding } from './OnboardingProvider';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ONBOARDING_CONFIG } from '@/lib/onboarding/constants';

export function WelcomeModal() {
  const { showWelcome, setShowWelcome, startTour, skipTour } = useOnboarding();

  const handleStart = () => {
    startTour();
  };

  const handleSkip = () => {
    skipTour();
  };

  return (
    <Dialog open={showWelcome} onOpenChange={setShowWelcome}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            Welcome to fotolokashen! 🎉
          </DialogTitle>
        </DialogHeader>

        <div className="text-center pt-4 space-y-4">
          <p className="text-base text-muted-foreground">
            We&apos;ll show you around in just {ONBOARDING_CONFIG.TOTAL_STEPS} quick steps
            ({ONBOARDING_CONFIG.ESTIMATED_DURATION_MINUTES} minute).
          </p>
          <p className="text-sm text-muted-foreground">
            You can skip or restart this tour anytime from your profile menu.
          </p>
        </div>

        <div className="flex justify-center gap-2 py-4">
          {[...Array(ONBOARDING_CONFIG.TOTAL_STEPS)].map((_, i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-indigo-200"
            />
          ))}
        </div>

        <DialogFooter className="flex-row justify-between sm:justify-between gap-2">
          <Button
            variant="ghost"
            onClick={handleSkip}
            className="flex-1 sm:flex-initial"
          >
            Maybe Later
          </Button>
          <Button
            onClick={handleStart}
            className="flex-1 sm:flex-initial bg-indigo-600 hover:bg-indigo-700"
          >
            Let&apos;s Go! →
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
