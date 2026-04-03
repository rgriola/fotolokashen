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
  const { showWelcome, setShowWelcome, startTour } = useOnboarding();

  const handleStart = () => {
    startTour();
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
            Let&apos;s take a quick tour of fotolokashen!
          </p>
          <p className="text-sm text-muted-foreground">
            This will only take about {ONBOARDING_CONFIG.ESTIMATED_DURATION_MINUTES} minute and will help you get the most out of the app.
          </p>
        </div>

        <div className="flex justify-center gap-2 py-4">
          {[...Array(ONBOARDING_CONFIG.TOTAL_STEPS)].map((_, i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-primary/20"
            />
          ))}
        </div>

        <DialogFooter className="flex justify-center">
          <Button
            onClick={handleStart}
            className="w-full sm:w-auto bg-primary hover:bg-primary/90"
          >
            Start Tour →
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
