'use client';

import { useEffect } from 'react';
import Joyride, { CallBackProps, STATUS, EVENTS } from 'react-joyride';
import { useOnboarding } from './OnboardingProvider';
import { ONBOARDING_STEPS } from './onboarding-steps';
import './onboarding-fix.css';

export function OnboardingTour() {
  const { isRunning, currentStep, endTour, setStep } = useOnboarding();

  // Prevent body scroll/layout shifts during tour
  useEffect(() => {
    if (isRunning) {
      document.body.classList.add('react-joyride-running');
      
      // Aggressively prevent scrollbar from appearing with MutationObserver
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
            const body = mutation.target as HTMLElement;
            // Force overflow hidden to prevent scrollbar
            if (body.style.overflow !== 'hidden') {
              body.style.overflow = 'hidden';
            }
          }
        });
      });
      
      observer.observe(document.body, {
        attributes: true,
        attributeFilter: ['style'],
      });
      
      // Lock body overflow to hidden (no scrollbar ever)
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
      
      return () => {
        observer.disconnect();
        document.body.classList.remove('react-joyride-running');
      };
    }
  }, [isRunning]);

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status, index, type, action } = data;

    // Handle tour completion
    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      endTour();
    }
  };

  return (
    <Joyride
      steps={ONBOARDING_STEPS}
      run={isRunning}
      continuous
      showProgress
      showSkipButton
      scrollToFirstStep={false}
      disableScrolling={true}
      disableScrollParentFix={true}
      disableOverlay={true}
      disableOverlayClose
      spotlightPadding={8}
      callback={handleJoyrideCallback}
      styles={{
        options: {
          zIndex: 10000,
          primaryColor: '#4F46E5', // Indigo-600 (fotolokashen brand)
          backgroundColor: '#ffffff',
          textColor: '#1F2937',
          overlayColor: 'rgba(0, 0, 0, 0.5)',
          spotlightShadow: '0 0 15px rgba(79, 70, 229, 0.5)',
          arrowColor: '#ffffff',
        },
        buttonNext: {
          backgroundColor: '#4F46E5',
          fontSize: 14,
          borderRadius: 6,
        },
        buttonBack: {
          color: '#6B7280',
          fontSize: 14,
        },
        buttonSkip: {
          color: '#6B7280',
          fontSize: 14,
        },
        tooltip: {
          borderRadius: 8,
          padding: 20,
          transition: 'none',
          animation: 'none',
        },
        tooltipTitle: {
          fontSize: 18,
          fontWeight: 600,
        },
        tooltipContent: {
          padding: '12px 0',
          fontSize: 14,
        },
        overlay: {
          transition: 'none',
          animation: 'none',
        },
        spotlight: {
          transition: 'none',
          animation: 'none',
        },
      }}
      floaterProps={{
        disableAnimation: true,
        styles: {
          arrow: {
            length: 8,
            spread: 12,
          },
        },
      }}
      locale={{
        back: 'Back',
        close: 'Close',
        last: 'Finish',
        next: 'Next',
        skip: 'Skip',
      }}
    />
  );
}
