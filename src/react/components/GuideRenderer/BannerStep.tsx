'use client';

import { useEffect, useState } from 'react';
import type { GuideStep, GuideStepStyleConfig } from '../../../types';
import { StepButtons } from './StepButtons';

export interface BannerStepProps {
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
   * Z-index for the banner
   */
  zIndex?: number;
}

type BannerPosition = 'top' | 'bottom';
type BannerVariant = 'info' | 'warning' | 'success' | 'custom';

const variantStyles: Record<BannerVariant, { bg: string; text: string; icon: string }> = {
  info: { bg: '#eff6ff', text: '#1e40af', icon: 'i' },
  warning: { bg: '#fef3c7', text: '#92400e', icon: '!' },
  success: { bg: '#dcfce7', text: '#166534', icon: '✓' },
  custom: { bg: '#2563eb', text: 'white', icon: '' },
};

export function BannerStep({
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
}: BannerStepProps) {
  const [isAnimating, setIsAnimating] = useState(true);
  const [isVisible, setIsVisible] = useState(true);

  const style = { ...globalStyle, ...step.style_config };
  const displayConfig = step.display_config || {};

  // Get banner-specific config
  const position: BannerPosition = displayConfig.bannerPosition || 'top';
  const variant: BannerVariant = 'custom'; // Could be from config

  // Use style colors or variant defaults
  const backgroundColor = style.backgroundColor || variantStyles[variant].bg;
  const textColor = style.textColor || variantStyles[variant].text;
  const accentColor = style.accentColor || '#2563eb';

  // Animate in
  useEffect(() => {
    const timer = setTimeout(() => setIsAnimating(false), 50);
    return () => clearTimeout(timer);
  }, []);

  // Handle dismiss with animation
  const handleDismiss = () => {
    setIsAnimating(true);
    setTimeout(() => {
      setIsVisible(false);
      onDismiss();
    }, 200);
  };

  if (!isVisible) return null;

  const richContent = step.rich_content;
  const title = richContent?.title || step.title;
  const body = richContent?.body || step.content;
  const hasButtons = richContent?.buttons && richContent.buttons.length > 0;

  return (
    <div
      role="alert"
      style={{
        position: 'fixed',
        left: 0,
        right: 0,
        [position]: 0,
        zIndex,
        padding: '12px 20px',
        backgroundColor,
        color: textColor,
        boxShadow: position === 'top'
          ? '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          : '0 -4px 6px -1px rgba(0, 0, 0, 0.1)',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        transform: isAnimating
          ? position === 'top' ? 'translateY(-100%)' : 'translateY(100%)'
          : 'translateY(0)',
        transition: 'transform 0.2s ease-out',
      }}
    >
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
        }}
      >
        {/* Content */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Icon */}
          {variantStyles[variant].icon && (
            <div
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                backgroundColor: variant === 'custom' ? 'rgba(255,255,255,0.2)' : textColor,
                color: variant === 'custom' ? textColor : backgroundColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                fontWeight: 600,
                flexShrink: 0,
              }}
            >
              {variantStyles[variant].icon}
            </div>
          )}

          {/* Text content */}
          <div style={{ flex: 1 }}>
            {title && (
              <strong style={{ display: 'block', marginBottom: body ? '2px' : 0 }}>
                {title}
              </strong>
            )}
            {body && (
              <span style={{ opacity: 0.9, fontSize: '14px' }}>
                {body}
              </span>
            )}
          </div>

          {/* Progress */}
          {showProgress && totalSteps > 1 && (
            <span style={{ fontSize: '12px', opacity: 0.7, flexShrink: 0 }}>
              {currentStep + 1}/{totalSteps}
            </span>
          )}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          {hasButtons ? (
            <StepButtons
              buttons={richContent.buttons}
              currentStep={currentStep}
              totalSteps={totalSteps}
              isLastStep={currentStep === totalSteps - 1}
              onNext={onNext}
              onPrev={onPrev}
              onDismiss={handleDismiss}
              onCustomAction={onCustomAction}
              accentColor={variant === 'custom' ? 'white' : accentColor}
            />
          ) : (
            <>
              {currentStep < totalSteps - 1 ? (
                <button
                  onClick={onNext}
                  style={{
                    padding: '6px 12px',
                    fontSize: '14px',
                    border: 'none',
                    borderRadius: '4px',
                    backgroundColor: variant === 'custom' ? 'rgba(255,255,255,0.2)' : accentColor,
                    color: variant === 'custom' ? textColor : 'white',
                    cursor: 'pointer',
                  }}
                >
                  Next
                </button>
              ) : (
                <button
                  onClick={handleDismiss}
                  style={{
                    padding: '6px 12px',
                    fontSize: '14px',
                    border: 'none',
                    borderRadius: '4px',
                    backgroundColor: variant === 'custom' ? 'rgba(255,255,255,0.2)' : accentColor,
                    color: variant === 'custom' ? textColor : 'white',
                    cursor: 'pointer',
                  }}
                >
                  Got it
                </button>
              )}
            </>
          )}

          {/* Close button */}
          <button
            onClick={handleDismiss}
            aria-label="Dismiss"
            style={{
              width: '28px',
              height: '28px',
              border: 'none',
              borderRadius: '4px',
              backgroundColor: 'transparent',
              color: textColor,
              opacity: 0.7,
              fontSize: '18px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
}
