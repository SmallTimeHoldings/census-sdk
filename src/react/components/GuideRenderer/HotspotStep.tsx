'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import type { GuideStep, GuideStepStyleConfig } from '../../../types';
import { calculatePosition, findElement, scrollIntoView, getElementRect, type ComputedPosition } from './positioning';
import { StepButtons } from './StepButtons';
import { StepContent } from './StepContent';

export interface HotspotStepProps {
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
   * Z-index for the hotspot
   */
  zIndex?: number;
}

type BeaconStyle = 'pulse' | 'static' | 'numbered';

export function HotspotStep({
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
}: HotspotStepProps) {
  const popoverRef = useRef<HTMLDivElement>(null);
  const [targetElement, setTargetElement] = useState<Element | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [beaconPosition, setBeaconPosition] = useState({ top: 0, left: 0 });
  const [popoverPosition, setPopoverPosition] = useState<ComputedPosition | null>(null);

  const style = { ...globalStyle, ...step.style_config };
  const backgroundColor = style.backgroundColor || 'white';
  const textColor = style.textColor || '#1f2937';
  const accentColor = style.accentColor || '#2563eb';
  const borderRadius = style.borderRadius || 8;

  // Get hotspot-specific display config
  const displayConfig = step.display_config || {};
  // Could read beaconStyle from displayConfig in future
  const beaconStyle = 'pulse' as BeaconStyle;

  // Find target element
  useEffect(() => {
    const element = findElement(step.selector_strategy);
    setTargetElement(element);

    if (element) {
      scrollIntoView(element, 120);
    }
  }, [step.selector_strategy]);

  // Update beacon position
  const updateBeaconPosition = useCallback(() => {
    if (!targetElement) return;

    const rect = getElementRect(targetElement);
    // Position beacon at top-right corner of element
    setBeaconPosition({
      top: rect.top - 8,
      left: rect.right - 8,
    });
  }, [targetElement]);

  // Update popover position when expanded
  const updatePopoverPosition = useCallback(() => {
    if (!targetElement || !popoverRef.current || !isExpanded) return;

    const popoverRect = popoverRef.current.getBoundingClientRect();
    const newPosition = calculatePosition(
      targetElement,
      popoverRect.width,
      popoverRect.height,
      {
        preferredPosition: step.tooltip_position || 'auto',
        offset: step.display_config?.offset,
        arrowSize: 8,
      }
    );

    setPopoverPosition(newPosition);
  }, [targetElement, isExpanded, step.tooltip_position, step.display_config?.offset]);

  useEffect(() => {
    updateBeaconPosition();
    if (isExpanded) {
      setTimeout(updatePopoverPosition, 10);
    }

    window.addEventListener('scroll', updateBeaconPosition, true);
    window.addEventListener('resize', updateBeaconPosition);

    return () => {
      window.removeEventListener('scroll', updateBeaconPosition, true);
      window.removeEventListener('resize', updateBeaconPosition);
    };
  }, [updateBeaconPosition, updatePopoverPosition, isExpanded]);

  // Handle click outside to close
  useEffect(() => {
    if (!isExpanded) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsExpanded(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isExpanded]);

  // If no target element, show nothing (hotspots require an anchor)
  if (!targetElement) {
    return null;
  }

  // CSS for pulsing animation
  const pulseKeyframes = `
    @keyframes census-hotspot-pulse {
      0% {
        transform: scale(1);
        box-shadow: 0 0 0 0 ${accentColor}66;
      }
      70% {
        transform: scale(1.1);
        box-shadow: 0 0 0 10px ${accentColor}00;
      }
      100% {
        transform: scale(1);
        box-shadow: 0 0 0 0 ${accentColor}00;
      }
    }
  `;

  return (
    <>
      {/* Inject animation styles */}
      <style dangerouslySetInnerHTML={{ __html: pulseKeyframes }} />

      {/* Beacon */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        aria-label="Show more information"
        aria-expanded={isExpanded}
        style={{
          position: 'absolute',
          top: beaconPosition.top,
          left: beaconPosition.left,
          width: '24px',
          height: '24px',
          borderRadius: '50%',
          border: 'none',
          backgroundColor: accentColor,
          color: 'white',
          cursor: 'pointer',
          zIndex,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '12px',
          fontWeight: 600,
          animation: beaconStyle === 'pulse' && !isExpanded ? 'census-hotspot-pulse 2s infinite' : 'none',
          transition: 'transform 0.15s',
        }}
      >
        {beaconStyle === 'numbered' ? currentStep + 1 : '?'}
      </button>

      {/* Expanded popover */}
      {isExpanded && (
        <div
          ref={popoverRef}
          style={{
            position: 'absolute',
            top: popoverPosition?.top || beaconPosition.top + 30,
            left: popoverPosition?.left || beaconPosition.left - 140,
            zIndex: zIndex + 1,
            padding: '16px 20px',
            backgroundColor,
            color: textColor,
            borderRadius,
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
            maxWidth: displayConfig.width || 300,
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
        >
          {/* Arrow pointing to beacon */}
          {popoverPosition && (
            <div
              style={{
                position: 'absolute',
                width: 0,
                height: 0,
                borderLeft: '8px solid transparent',
                borderRight: '8px solid transparent',
                borderBottom: `8px solid ${backgroundColor}`,
                top: popoverPosition.arrowPosition.top,
                left: popoverPosition.arrowPosition.left,
                transform: popoverPosition.arrowPosition.transform,
              }}
            />
          )}

          <StepContent step={step} textColor={textColor} />

          {showProgress && totalSteps > 1 && (
            <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '8px' }}>
              Step {currentStep + 1} of {totalSteps}
            </div>
          )}

          <StepButtons
            buttons={step.rich_content?.buttons}
            currentStep={currentStep}
            totalSteps={totalSteps}
            isLastStep={currentStep === totalSteps - 1}
            onNext={() => {
              setIsExpanded(false);
              onNext();
            }}
            onPrev={() => {
              setIsExpanded(false);
              onPrev();
            }}
            onDismiss={() => {
              setIsExpanded(false);
              onDismiss();
            }}
            onCustomAction={onCustomAction}
            accentColor={accentColor}
          />
        </div>
      )}
    </>
  );
}
