'use client';

import { useState, useCallback, useEffect } from 'react';
import type { Guide, GuideStep, GuideStepStyleConfig } from '../../../types';
import { TooltipStep } from './TooltipStep';
import { ModalStep } from './ModalStep';
import { SlideoutStep } from './SlideoutStep';
import { HotspotStep } from './HotspotStep';
import { BannerStep } from './BannerStep';
import { EmbeddedStep } from './EmbeddedStep';

export interface GuideRendererProps {
  /**
   * The guide to render
   */
  guide: Guide;

  /**
   * Callback when guide is completed
   */
  onComplete?: (guide: Guide) => void;

  /**
   * Callback when guide is dismissed (skipped)
   */
  onDismiss?: (guide: Guide, step: number) => void;

  /**
   * Callback when a step changes
   */
  onStepChange?: (step: number, totalSteps: number) => void;

  /**
   * Callback for custom button actions
   */
  onCustomAction?: (actionName: string, step: GuideStep) => void;

  /**
   * Global style overrides
   */
  globalStyle?: GuideStepStyleConfig;

  /**
   * Starting step index
   */
  startStep?: number;

  /**
   * Z-index base for guide elements
   */
  zIndex?: number;
}

/**
 * GuideRenderer - Displays a guide step by step
 *
 * Renders the appropriate step type component based on the step's step_type field.
 *
 * @example
 * ```tsx
 * <GuideRenderer
 *   guide={myGuide}
 *   onComplete={(guide) => console.log('Completed:', guide.name)}
 *   onDismiss={(guide, step) => console.log('Dismissed at step:', step)}
 * />
 * ```
 */
export function GuideRenderer({
  guide,
  onComplete,
  onDismiss,
  onStepChange,
  onCustomAction,
  globalStyle,
  startStep = 0,
  zIndex = 9999,
}: GuideRendererProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(startStep);
  const [isActive, setIsActive] = useState(true);

  const steps = guide.guide_steps || [];
  const totalSteps = steps.length;
  const currentStep = steps[currentStepIndex];

  // Notify when step changes
  useEffect(() => {
    onStepChange?.(currentStepIndex, totalSteps);
  }, [currentStepIndex, totalSteps, onStepChange]);

  // Handle next step
  const handleNext = useCallback(() => {
    if (currentStepIndex < totalSteps - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      // Guide completed
      setIsActive(false);
      onComplete?.(guide);
    }
  }, [currentStepIndex, totalSteps, guide, onComplete]);

  // Handle previous step
  const handlePrev = useCallback(() => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  }, [currentStepIndex]);

  // Handle dismiss
  const handleDismiss = useCallback(() => {
    setIsActive(false);
    onDismiss?.(guide, currentStepIndex);
  }, [guide, currentStepIndex, onDismiss]);

  // Handle custom action
  const handleCustomAction = useCallback(
    (actionName: string) => {
      if (currentStep) {
        onCustomAction?.(actionName, currentStep);
      }
    },
    [currentStep, onCustomAction]
  );

  // If not active or no steps, don't render
  if (!isActive || !currentStep || steps.length === 0) {
    return null;
  }

  // Common props for all step types
  const stepProps = {
    step: currentStep,
    currentStep: currentStepIndex,
    totalSteps,
    onNext: handleNext,
    onPrev: handlePrev,
    onDismiss: handleDismiss,
    onCustomAction: handleCustomAction,
    showProgress: guide.show_progress !== false,
    globalStyle: { ...guide.theme, ...globalStyle } as GuideStepStyleConfig,
    zIndex,
  };

  // Render the appropriate step type
  switch (currentStep.step_type) {
    case 'tooltip':
      return <TooltipStep {...stepProps} />;

    case 'modal':
      return <ModalStep {...stepProps} />;

    case 'slideout':
      return <SlideoutStep {...stepProps} />;

    case 'hotspot':
      return <HotspotStep {...stepProps} />;

    case 'banner':
      return <BannerStep {...stepProps} />;

    case 'embedded':
      return <EmbeddedStep {...stepProps} />;

    default:
      // Default to tooltip for unknown types
      return <TooltipStep {...stepProps} />;
  }
}

// Re-export individual step components for custom use cases
export { TooltipStep } from './TooltipStep';
export { ModalStep } from './ModalStep';
export { SlideoutStep } from './SlideoutStep';
export { HotspotStep } from './HotspotStep';
export { BannerStep } from './BannerStep';
export { EmbeddedStep } from './EmbeddedStep';
export { Backdrop } from './Backdrop';
export { StepButtons } from './StepButtons';
export { StepContent } from './StepContent';
export * from './positioning';
