'use client';

import React, { useEffect, useState } from 'react';
import type { GuideStep, GuideStepStyleConfig } from '../../../types';
import { Backdrop } from './Backdrop';
import { StepButtons } from './StepButtons';
import { StepContent } from './StepContent';

export interface SlideoutStepProps {
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
   * Z-index for the slideout
   */
  zIndex?: number;
}

type SlideoutSide = 'left' | 'right';

export function SlideoutStep({
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
}: SlideoutStepProps) {
  const [isAnimating, setIsAnimating] = useState(true);

  const style = { ...globalStyle, ...step.style_config };
  const backgroundColor = style.backgroundColor || 'white';
  const textColor = style.textColor || '#1f2937';
  const accentColor = style.accentColor || '#2563eb';
  const borderRadius = style.borderRadius || 0;

  // Get slideout-specific display config
  const displayConfig = step.display_config || {};
  const width = displayConfig.width || 400;
  const side: SlideoutSide = (displayConfig.position as SlideoutSide) === 'left' ? 'left' : 'right';
  const showBackdrop = displayConfig.backdrop !== false;

  // Animate in
  useEffect(() => {
    const timer = setTimeout(() => setIsAnimating(false), 50);
    return () => clearTimeout(timer);
  }, []);

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

  const getSlideStyles = (): React.CSSProperties => {
    const baseStyles: React.CSSProperties = {
      position: 'fixed',
      top: 0,
      bottom: 0,
      width: '90%',
      maxWidth: width,
      zIndex,
      backgroundColor,
      color: textColor,
      boxShadow: side === 'right'
        ? '-10px 0 30px -5px rgba(0, 0, 0, 0.1)'
        : '10px 0 30px -5px rgba(0, 0, 0, 0.1)',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      overflow: 'auto',
      transition: 'transform 0.3s ease-out',
    };

    if (side === 'right') {
      return {
        ...baseStyles,
        right: 0,
        borderTopLeftRadius: borderRadius,
        borderBottomLeftRadius: borderRadius,
        transform: isAnimating ? 'translateX(100%)' : 'translateX(0)',
      };
    } else {
      return {
        ...baseStyles,
        left: 0,
        borderTopRightRadius: borderRadius,
        borderBottomRightRadius: borderRadius,
        transform: isAnimating ? 'translateX(-100%)' : 'translateX(0)',
      };
    }
  };

  return (
    <>
      {showBackdrop && (
        <Backdrop
          visible={true}
          onClick={onDismiss}
          dismissOnClick={true}
          opacity={0.4}
        />
      )}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="guide-slideout-title"
        style={getSlideStyles()}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            borderBottom: '1px solid #e5e7eb',
            position: 'sticky',
            top: 0,
            backgroundColor,
            zIndex: 1,
          }}
        >
          <h2
            id="guide-slideout-title"
            style={{
              margin: 0,
              fontSize: '18px',
              fontWeight: 600,
              color: textColor,
            }}
          >
            {step.rich_content?.title || step.title || 'Guide'}
          </h2>
          <button
            onClick={onDismiss}
            aria-label="Close"
            style={{
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
            }}
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '20px' }}>
          <StepContent step={step} textColor={textColor} showTitle={false} />

          {showProgress && totalSteps > 1 && (
            <div
              style={{
                fontSize: '12px',
                color: '#6b7280',
                marginTop: '16px',
              }}
            >
              Step {currentStep + 1} of {totalSteps}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '16px 20px',
            borderTop: '1px solid #e5e7eb',
            position: 'sticky',
            bottom: 0,
            backgroundColor,
          }}
        >
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
      </div>
    </>
  );
}
