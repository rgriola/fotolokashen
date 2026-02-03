'use client';

import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';

interface OnboardingContextType {
  isRunning: boolean;
  currentStep: number;
  isCompleted: boolean;
  isSkipped: boolean;
  showWelcome: boolean;
  showCompletionModal: boolean;
  startTour: () => void;
  endTour: () => void;
  skipTour: () => void;
  setStep: (step: number) => void;
  setShowWelcome: (show: boolean) => void;
  resetTour: () => void;
  dismissCompletion: () => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

interface OnboardingProviderProps {
  children: ReactNode;
  userOnboardingStatus?: {
    onboardingCompleted: boolean;
    onboardingSkipped: boolean;
    onboardingStep: number | null;
  };
}

export function OnboardingProvider({ children, userOnboardingStatus }: OnboardingProviderProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isCompleted, setIsCompleted] = useState(
    userOnboardingStatus?.onboardingCompleted ?? false
  );
  const [isSkipped, setIsSkipped] = useState(
    userOnboardingStatus?.onboardingSkipped ?? false
  );
  const [showWelcome, setShowWelcome] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);

  // Sync state with userOnboardingStatus prop when it changes
  useEffect(() => {
    if (userOnboardingStatus) {
      setIsCompleted(userOnboardingStatus.onboardingCompleted);
      setIsSkipped(userOnboardingStatus.onboardingSkipped);
    }
  }, [userOnboardingStatus]);

  // Auto-show welcome modal for eligible users
  useEffect(() => {
    if (
      userOnboardingStatus &&
      !userOnboardingStatus.onboardingCompleted &&
      !userOnboardingStatus.onboardingSkipped
    ) {
      // Delay to allow page to settle
      const timer = setTimeout(() => {
        setShowWelcome(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [userOnboardingStatus]);

  const startTour = useCallback(async () => {
    setIsRunning(true);
    setCurrentStep(0);
    setShowWelcome(false);
    try {
      await fetch('/api/onboarding/start', { 
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Failed to start onboarding:', error);
    }
  }, []);

  const endTour = useCallback(async () => {
    setIsRunning(false);
    setIsCompleted(true);
    setShowCompletionModal(true); // Show completion modal
    try {
      await fetch('/api/onboarding/complete', { 
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
    }
  }, []);

  const skipTour = useCallback(async () => {
    setIsRunning(false);
    setIsSkipped(true);
    setShowWelcome(false);
    try {
      await fetch('/api/onboarding/skip', { 
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Failed to skip onboarding:', error);
    }
  }, []);

  const setStep = useCallback(async (step: number) => {
    setCurrentStep(step);
  }, []);

  const resetTour = useCallback(async () => {
    setIsCompleted(false);
    setIsSkipped(false);
    setIsRunning(false);
    setCurrentStep(0);
    try {
      await fetch('/api/onboarding/reset', { 
        method: 'POST',
        credentials: 'include',
      });
      // Show welcome modal again
      setShowWelcome(true);
    } catch (error) {
      console.error('Failed to reset onboarding:', error);
    }
  }, []);

  const dismissCompletion = useCallback(() => {
    setShowCompletionModal(false);
  }, []);

  return (
    <OnboardingContext.Provider
      value={{
        isRunning,
        currentStep,
        isCompleted,
        isSkipped,
        showWelcome,
        showCompletionModal,
        startTour,
        endTour,
        skipTour,
        setStep,
        setShowWelcome,
        resetTour,
        dismissCompletion,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within OnboardingProvider');
  }
  return context;
}
