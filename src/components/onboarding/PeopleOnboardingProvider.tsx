'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import Joyride, { CallBackProps, STATUS, ACTIONS, Step } from 'react-joyride';
import { peopleSteps } from '@/lib/onboarding/peopleSteps';
import { useAuth } from '@/lib/auth-context';

interface PeopleOnboardingContextValue {
  runTour: boolean;
  restartTour: () => void;
}

const PeopleOnboardingContext = createContext<PeopleOnboardingContextValue | null>(null);

export function usePeopleOnboarding() {
  const context = useContext(PeopleOnboardingContext);
  if (!context) {
    throw new Error('usePeopleOnboarding must be used within PeopleOnboardingProvider');
  }
  return context;
}

interface PeopleOnboardingProviderProps {
  children: ReactNode;
  peopleOnboardingCompleted?: boolean;
}

export function PeopleOnboardingProvider({
  children,
  peopleOnboardingCompleted = false,
}: PeopleOnboardingProviderProps) {
  const { user } = useAuth();
  const [runTour, setRunTour] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  // Auto-start tour if not completed
  useEffect(() => {
    if (user && !peopleOnboardingCompleted) {
      // Small delay to ensure DOM elements are ready
      const timer = setTimeout(() => {
        setRunTour(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [user, peopleOnboardingCompleted]);

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status, action, index, type } = data;

    if (([STATUS.FINISHED, STATUS.SKIPPED] as string[]).includes(status)) {
      setRunTour(false);
      setStepIndex(0);

      // Mark onboarding as complete
      if (status === STATUS.FINISHED) {
        fetch('/api/onboarding/people/complete', {
          method: 'POST',
          credentials: 'include',
        }).catch(err => console.error('Failed to mark people onboarding complete:', err));
      }
    } else if (([ACTIONS.CLOSE] as string[]).includes(action)) {
      setRunTour(false);
      setStepIndex(0);
    } else if (type === 'step:after') {
      setStepIndex(index + 1);
    }
  };

  const restartTour = () => {
    setStepIndex(0);
    setRunTour(true);
  };

  return (
    <PeopleOnboardingContext.Provider value={{ runTour, restartTour }}>
      {children}
      <Joyride
        steps={peopleSteps}
        run={runTour}
        stepIndex={stepIndex}
        continuous
        showProgress
        showSkipButton
        callback={handleJoyrideCallback}
        styles={{
          options: {
            primaryColor: '#4f46e5', // indigo-600
            zIndex: 10000,
          },
        }}
      />
    </PeopleOnboardingContext.Provider>
  );
}
