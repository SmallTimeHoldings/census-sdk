'use client';

import React, { useEffect } from 'react';
import type { GuideStep, GuideStepStyleConfig } from '../../../types';
import { Backdrop } from './Backdrop';
import { StepButtons } from './StepButtons';
import { StepContent } from './StepContent';

export interface ModalStepProps {
  /**
   * The step data
   */
  step: GuideStep;

  /**
   * Current step index (0-based)
   */
  currentStep: number;

  /**
   * Total number of steps
   */
  totalSteps: number;

  /**
   * Callback when advancing to next step
   */
  onNext: () => void;

  /**
   * Callback when going to previous step
   */
  onPrev: () => void;

  /**
   * Callback when dismissing the guide
   */
  onDismiss: () => void;

  /**
   * Callback for custom button actions
   */
  onCustomAction?: (actionName: string) => void;

  /**
   * Whether to show progress indicator
   */
  showProgress?: boolean;

  /**
   * Global style overrides
   */
  globalStyle?: GuideStepStyleConfig;

  /**
   * Z-index for the modal
   */
  zIndex?: number;
}

type ModalPosition = 'center' | 'top' | 'bottom';

export function ModalStep({
  step,
  currentStep,
  totalSteps,
  onNext,
  onPrev,
  onDismiss,
  onCustomAction,
  showProgress = true,
  globalStyle,
  zIndex = 9999,
}: ModalStepProps) {
  const style = { ...globalStyle, ...step.style_config };
  const backgroundColor = style.backgroundColor || 'white';
  const textColor = style.textColor || '#1f2937';
  const accentColor = style.accentColor || '#2563eb';
  const borderRadius = style.borderRadius || 12;

  // Get modal-specific display config
  const displayConfig = step.display_config || {};
  const width = displayConfig.width || 480;
  const position = (displayConfig.position as ModalPosition) || 'center';
  const dismissOnBackdropClick = displayConfig.backdrop !== false;

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onDismiss();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onDismiss]);

  // Lock body scroll
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  const getPositionStyles = (): React.CSSProperties => {
    switch (position) {
      case 'top':
        return {
          top: '10%',
          left: '50%',
          transform: 'translateX(-50%)',
        };
      case 'bottom':
        return {
          bottom: '10%',
          left: '50%',
          transform: 'translateX(-50%)',
        };
      case 'center':
      default:
        return {
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        };
    }
  };

  return (
    <>
      <Backdrop
        visible={true}
        onClick={dismissOnBackdropClick ? onDismiss : undefined}
        dismissOnClick={dismissOnBackdropClick}
        opacity={0.6}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="guide-modal-title"
        style={{
          position: 'fixed',
          ...getPositionStyles(),
          zIndex,
          width: '90%',
          maxWidth: width,
          maxHeight: '85vh',
          overflow: 'auto',
          padding: '24px',
          backgroundColor,
          color: textColor,
          borderRadius,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        {/* Close button */}
        <button
          onClick={onDismiss}
          aria-label="Close"
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            width: '28px',
            height: '28px',
            border: 'none',
            borderRadius: '50%',
            backgroundColor: 'transparent',
            color: '#9ca3af',
            fontSize: '20px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'color 0.15s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#6b7280')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#9ca3af')}
        >
          ×
        </button>

        <StepContent step={step} textColor={textColor} />

        {showProgress && totalSteps > 1 && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '6px',
              marginTop: '16px',
            }}
          >
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div
                key={i}
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: i === currentStep ? accentColor : '#e5e7eb',
                  transition: 'background-color 0.15s',
                }}
              />
            ))}
          </div>
        )}

        <StepButtons
          buttons={step.rich_content?.buttons}
          currentStep={currentStep}
          totalSteps={totalSteps}
          isLastStep={currentStep === totalSteps - 1}
          onNext={onNext}
          onPrev={onPrev}
          onDismiss={onDismiss}
          onCustomAction={onCustomAction}
          accentColor={accentColor}
        />
      </div>
    </>
  );
}
