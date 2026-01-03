'use client';

import { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import type { GuideStep, GuideStepStyleConfig, EmbeddedPosition } from '../../../types';
import { StepContent } from './StepContent';
import { StepButtons } from './StepButtons';
import { findElement } from './positioning';

export interface EmbeddedStepProps {
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
}

/**
 * Void elements that cannot contain children
 */
const VOID_ELEMENTS = [
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
  'link', 'meta', 'param', 'source', 'track', 'wbr', 'canvas',
];

/**
 * Check if an element can contain embedded content
 */
function canEmbed(element: Element): boolean {
  return !VOID_ELEMENTS.includes(element.tagName.toLowerCase());
}

/**
 * EmbeddedStep - Renders guide content directly inside a target DOM element
 *
 * Unlike other step types that float above the page, EmbeddedStep inserts
 * content directly into the DOM flow, making it appear as native page content.
 *
 * Supports three positioning modes:
 * - prepend: Insert at the beginning of the target element
 * - append: Insert at the end of the target element
 * - replace: Replace the target element's content entirely
 */
export function EmbeddedStep({
  step,
  currentStep,
  totalSteps,
  onNext,
  onPrev,
  onDismiss,
  onCustomAction,
  showProgress = true,
  globalStyle,
}: EmbeddedStepProps) {
  const [targetElement, setTargetElement] = useState<Element | null>(null);
  const [isReady, setIsReady] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const originalContentRef = useRef<string | null>(null);

  const style = { ...globalStyle, ...step.style_config };
  const displayConfig = step.display_config || {};
  const position: EmbeddedPosition = displayConfig.embeddedPosition || 'append';

  // Use style colors or defaults
  const backgroundColor = style.backgroundColor || 'white';
  const textColor = style.textColor || '#1f2937';
  const accentColor = style.accentColor || '#2563eb';
  const borderRadius = style.borderRadius ?? 8;

  // Find target element on mount
  useEffect(() => {
    const element = findElement(step.selector_strategy);

    if (element && canEmbed(element)) {
      setTargetElement(element);
    } else {
      // Hide silently if target not found or can't embed
      setTargetElement(null);
    }
  }, [step.selector_strategy]);

  // Create and insert container into DOM
  useEffect(() => {
    if (!targetElement) return;

    // Create container element
    const container = document.createElement('div');
    container.setAttribute('data-census-embedded', 'true');
    containerRef.current = container;

    // Handle positioning
    if (position === 'replace') {
      // Store original content for restoration on unmount
      originalContentRef.current = targetElement.innerHTML;
      targetElement.innerHTML = '';
      targetElement.appendChild(container);
    } else if (position === 'prepend') {
      targetElement.insertBefore(container, targetElement.firstChild);
    } else {
      // append (default)
      targetElement.appendChild(container);
    }

    setIsReady(true);

    // Cleanup on unmount
    return () => {
      if (containerRef.current) {
        containerRef.current.remove();
      }

      // Restore original content if we replaced it
      if (position === 'replace' && originalContentRef.current !== null && targetElement) {
        targetElement.innerHTML = originalContentRef.current;
      }

      containerRef.current = null;
      originalContentRef.current = null;
    };
  }, [targetElement, position]);

  // Don't render if target not found or container not ready
  if (!targetElement || !isReady || !containerRef.current) {
    return null;
  }

  const richContent = step.rich_content;

  return createPortal(
    <div
      role="region"
      aria-label="Guide content"
      style={{
        position: 'relative',
        padding: '16px',
        backgroundColor,
        color: textColor,
        borderRadius: `${borderRadius}px`,
        border: '1px solid #e5e7eb',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        boxSizing: 'border-box',
      }}
    >
      {/* Close button */}
      <button
        onClick={onDismiss}
        aria-label="Dismiss"
        style={{
          position: 'absolute',
          top: '8px',
          right: '8px',
          width: '24px',
          height: '24px',
          border: 'none',
          borderRadius: '4px',
          backgroundColor: 'transparent',
          color: textColor,
          opacity: 0.5,
          fontSize: '16px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 0,
        }}
      >
        ×
      </button>

      {/* Progress indicator */}
      {showProgress && totalSteps > 1 && (
        <div
          style={{
            fontSize: '12px',
            color: textColor,
            opacity: 0.6,
            marginBottom: '8px',
          }}
        >
          Step {currentStep + 1} of {totalSteps}
        </div>
      )}

      {/* Content */}
      <StepContent step={step} textColor={textColor} />

      {/* Buttons */}
      <StepButtons
        buttons={richContent?.buttons}
        currentStep={currentStep}
        totalSteps={totalSteps}
        isLastStep={currentStep === totalSteps - 1}
        onNext={onNext}
        onPrev={onPrev}
        onDismiss={onDismiss}
        onCustomAction={onCustomAction}
        accentColor={accentColor}
      />
    </div>,
    containerRef.current
  );
}
