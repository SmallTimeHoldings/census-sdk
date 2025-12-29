'use client';

import React from 'react';
import type { GuideStepRichContent } from '../../../types';

export interface StepButtonsProps {
  /**
   * Button configuration from step
   */
  buttons?: GuideStepRichContent['buttons'];

  /**
   * Current step index
   */
  currentStep: number;

  /**
   * Total number of steps
   */
  totalSteps: number;

  /**
   * Whether this is the last step
   */
  isLastStep: boolean;

  /**
   * Callback for next action
   */
  onNext: () => void;

  /**
   * Callback for previous action
   */
  onPrev: () => void;

  /**
   * Callback for dismiss action
   */
  onDismiss: () => void;

  /**
   * Callback for custom actions
   */
  onCustomAction?: (actionName: string) => void;

  /**
   * Accent color for primary buttons
   */
  accentColor?: string;
}

export function StepButtons({
  buttons,
  currentStep,
  isLastStep,
  onNext,
  onPrev,
  onDismiss,
  onCustomAction,
  accentColor = '#2563eb',
}: StepButtonsProps) {
  // If no custom buttons, use default next/prev/done
  if (!buttons || buttons.length === 0) {
    return (
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px' }}>
        <div>
          {currentStep > 0 && (
            <button
              onClick={onPrev}
              style={{
                padding: '8px 16px',
                fontSize: '14px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                backgroundColor: 'white',
                color: '#374151',
                cursor: 'pointer',
              }}
            >
              Back
            </button>
          )}
        </div>
        <button
          onClick={isLastStep ? onDismiss : onNext}
          style={{
            padding: '8px 16px',
            fontSize: '14px',
            border: 'none',
            borderRadius: '6px',
            backgroundColor: accentColor,
            color: 'white',
            cursor: 'pointer',
          }}
        >
          {isLastStep ? 'Done' : 'Next'}
        </button>
      </div>
    );
  }

  // Render custom buttons
  const handleButtonClick = (button: NonNullable<GuideStepRichContent['buttons']>[number]) => {
    switch (button.action) {
      case 'next':
        onNext();
        break;
      case 'prev':
        onPrev();
        break;
      case 'dismiss':
        onDismiss();
        break;
      case 'url':
        if (button.url) {
          window.open(button.url, '_blank', 'noopener,noreferrer');
        }
        break;
      case 'custom':
        if (button.customAction && onCustomAction) {
          onCustomAction(button.customAction);
        }
        break;
    }
  };

  const getButtonStyle = (style?: 'primary' | 'secondary' | 'text'): React.CSSProperties => {
    switch (style) {
      case 'primary':
        return {
          padding: '8px 16px',
          fontSize: '14px',
          border: 'none',
          borderRadius: '6px',
          backgroundColor: accentColor,
          color: 'white',
          cursor: 'pointer',
        };
      case 'text':
        return {
          padding: '8px 16px',
          fontSize: '14px',
          border: 'none',
          borderRadius: '6px',
          backgroundColor: 'transparent',
          color: accentColor,
          cursor: 'pointer',
        };
      case 'secondary':
      default:
        return {
          padding: '8px 16px',
          fontSize: '14px',
          border: '1px solid #d1d5db',
          borderRadius: '6px',
          backgroundColor: 'white',
          color: '#374151',
          cursor: 'pointer',
        };
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
      {buttons.map((button, index) => (
        <button
          key={index}
          onClick={() => handleButtonClick(button)}
          style={getButtonStyle(button.style)}
        >
          {button.label}
        </button>
      ))}
    </div>
  );
}
