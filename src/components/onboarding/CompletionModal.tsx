'use client';

import { useOnboarding } from './OnboardingProvider';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export function CompletionModal() {
  const { showCompletionModal, dismissCompletion } = useOnboarding();

  const handleClose = () => {
    dismissCompletion();
  };

  // Only show if just completed (not on page reload)
  if (!showCompletionModal) {
    return null;
  }

  return (
    <Dialog open={showCompletionModal} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            🎉 You&apos;re All Set!
          </DialogTitle>
          <div className="text-center pt-4 space-y-4">
            <p className="text-base">
              You&apos;ve completed the tour. Ready to start saving your favorite locations?
            </p>
            <p className="text-sm text-muted-foreground">
              💡 Tip: You can restart this tour anytime from your profile menu.
            </p>
          </div>
        </DialogHeader>

        <DialogFooter className="justify-center">
          <Button
            onClick={handleClose}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            Start Exploring →
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
