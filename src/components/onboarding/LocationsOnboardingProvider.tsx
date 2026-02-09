'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import Joyride, { CallBackProps, STATUS, ACTIONS } from 'react-joyride';
import { locationsSteps } from '@/lib/onboarding/locationsSteps';
import { useAuth } from '@/lib/auth-context';

interface LocationsOnboardingContextValue {
  runTour: boolean;
  restartTour: () => void;
}

const LocationsOnboardingContext = createContext<LocationsOnboardingContextValue | null>(null);

export function useLocationsOnboarding() {
  const context = useContext(LocationsOnboardingContext);
  if (!context) {
    throw new Error('useLocationsOnboarding must be used within LocationsOnboardingProvider');
  }
  return context;
}

interface LocationsOnboardingProviderProps {
  children: ReactNode;
  locationsOnboardingCompleted?: boolean;
  onTourComplete?: () => void;
}

export function LocationsOnboardingProvider({
  children,
  locationsOnboardingCompleted = false,
  onTourComplete,
}: LocationsOnboardingProviderProps) {
  const { user } = useAuth();
  const [runTour, setRunTour] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [isCompleted, setIsCompleted] = useState(locationsOnboardingCompleted);

  // Update local state when prop changes
  useEffect(() => {
    setIsCompleted(locationsOnboardingCompleted);
  }, [locationsOnboardingCompleted]);

  // Auto-start tour if not completed
  useEffect(() => {
    if (user && !isCompleted) {
      // Small delay to ensure DOM elements are ready
      const timer = setTimeout(() => {
        setRunTour(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [user, isCompleted]);

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status, action, index, type } = data;

    if (([STATUS.FINISHED, STATUS.SKIPPED] as string[]).includes(status)) {
      setRunTour(false);
      setStepIndex(0);

      // Mark onboarding as complete
      if (status === STATUS.FINISHED) {
        console.log('Tour finished, marking as complete...');
        setIsCompleted(true); // Update local state immediately
        fetch('/api/onboarding/locations/complete', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        })
        .then(async (response) => {
          const data = await response.json();
          console.log('API response:', response.status, data);
          if (!response.ok) {
            throw new Error(data.error || 'Failed to update');
          }
          // Notify parent component
          if (onTourComplete) {
            onTourComplete();
          }
        })
        .catch(err => {
          console.error('Failed to mark locations onboarding complete:', err);
          console.error('Error details:', err.message);
        });
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
    <LocationsOnboardingContext.Provider value={{ runTour, restartTour }}>
      {children}
      <Joyride
        steps={locationsSteps}
        run={runTour}
        stepIndex={stepIndex}
        continuous
        showProgress
        showSkipButton
        scrollToFirstStep
        disableScrolling={false}
        callback={handleJoyrideCallback}
        styles={{
          options: {
            primaryColor: '#4f46e5', // indigo-600
            zIndex: 10000,
          },
        }}
      />
    </LocationsOnboardingContext.Provider>
  );
}
