'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import type { GuideStep, GuideStepStyleConfig } from '../../../types';
import { calculatePosition, findElement, scrollIntoView, type ComputedPosition } from './positioning';
import { Backdrop } from './Backdrop';
import { StepButtons } from './StepButtons';
import { StepContent } from './StepContent';

export interface TooltipStepProps {
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
   * Z-index for the tooltip
   */
  zIndex?: number;
}

export function TooltipStep({
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
}: TooltipStepProps) {
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [targetElement, setTargetElement] = useState<Element | null>(null);
  const [position, setPosition] = useState<ComputedPosition | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  const style = { ...globalStyle, ...step.style_config };
  const backgroundColor = style.backgroundColor || 'white';
  const textColor = style.textColor || '#1f2937';
  const accentColor = style.accentColor || '#2563eb';
  const borderRadius = style.borderRadius || 8;

  // Find the target element
  useEffect(() => {
    const element = findElement(step.selector_strategy);
    setTargetElement(element);

    if (element) {
      scrollIntoView(element, 120);
    }
  }, [step.selector_strategy]);

  // Calculate position when target or tooltip size changes
  const updatePosition = useCallback(() => {
    if (!targetElement || !tooltipRef.current) return;

    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const newPosition = calculatePosition(
      targetElement,
      tooltipRect.width,
      tooltipRect.height,
      {
        preferredPosition: step.tooltip_position || step.display_config?.position as 'auto' | 'top' | 'bottom' | 'left' | 'right' || 'auto',
        offset: step.display_config?.offset,
        arrowSize: 8,
      }
    );

    setPosition(newPosition);
    setIsVisible(true);
  }, [targetElement, step.tooltip_position, step.display_config]);

  useEffect(() => {
    // Initial position calculation with a small delay to ensure tooltip is rendered
    const timer = setTimeout(updatePosition, 10);

    // Update on scroll and resize
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [updatePosition]);

  // If no target element found, render as centered modal fallback
  if (!targetElement) {
    return (
      <>
        <Backdrop visible={true} />
        <div
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex,
            padding: '24px',
            backgroundColor,
            color: textColor,
            borderRadius,
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            maxWidth: '400px',
            width: '90%',
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
        >
          <StepContent step={step} textColor={textColor} />
          {showProgress && (
            <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '8px' }}>
              Step {currentStep + 1} of {totalSteps}
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

  return (
    <>
      <Backdrop
        visible={step.display_config?.backdrop !== false}
        spotlightElement={targetElement}
        spotlightPadding={step.display_config?.spotlightPadding || 8}
        dismissOnClick={false}
      />
      <div
        ref={tooltipRef}
        style={{
          position: 'absolute',
          top: position?.top || 0,
          left: position?.left || 0,
          zIndex,
          padding: '16px 20px',
          backgroundColor,
          color: textColor,
          borderRadius,
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
          maxWidth: step.display_config?.width || 320,
          fontFamily: 'system-ui, -apple-system, sans-serif',
          opacity: isVisible ? 1 : 0,
          transition: 'opacity 0.15s ease-out',
        }}
      >
        {/* Arrow */}
        {position && (
          <div
            style={{
              position: 'absolute',
              width: 0,
              height: 0,
              borderLeft: '8px solid transparent',
              borderRight: '8px solid transparent',
              borderBottom: `8px solid ${backgroundColor}`,
              top: position.arrowPosition.top,
              left: position.arrowPosition.left,
              transform: position.arrowPosition.transform,
            }}
          />
        )}

        <StepContent step={step} textColor={textColor} />

        {showProgress && (
          <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '8px' }}>
            Step {currentStep + 1} of {totalSteps}
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
