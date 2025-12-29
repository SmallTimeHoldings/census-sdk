'use client';

import { useState, useCallback } from 'react';
import type {
  GuideStep,
  GuideStepType,
  TooltipPosition,
  SelectorStrategy,
  GuideStepRichContent,
  GuideStepDisplayConfig,
  GuideStepAdvanceConfig,
  CreateGuideStepOptions,
  AdvanceTrigger,
} from '../../../types';

export interface StepEditorProps {
  /**
   * The step being edited
   */
  step: GuideStep;

  /**
   * Callback when step is updated
   */
  onUpdate: (stepId: string, options: CreateGuideStepOptions) => Promise<GuideStep>;

  /**
   * Callback to open element selector
   */
  onSelectElement: () => void;

  /**
   * Whether element selector is currently active
   */
  isSelectingElement?: boolean;
}

const stepTypeLabels: Record<GuideStepType, string> = {
  tooltip: 'Tooltip',
  modal: 'Modal',
  slideout: 'Slideout',
  hotspot: 'Hotspot',
  banner: 'Banner',
};

const stepTypeDescriptions: Record<GuideStepType, string> = {
  tooltip: 'Points to a specific element with an arrow',
  modal: 'Centered overlay that grabs attention',
  slideout: 'Slides in from the side of the screen',
  hotspot: 'Pulsing beacon that expands on click',
  banner: 'Top or bottom bar announcement',
};

const positionOptions: { value: TooltipPosition | 'center'; label: string }[] = [
  { value: 'auto', label: 'Auto' },
  { value: 'top', label: 'Top' },
  { value: 'bottom', label: 'Bottom' },
  { value: 'left', label: 'Left' },
  { value: 'right', label: 'Right' },
];

const advanceTriggerOptions: { value: AdvanceTrigger; label: string }[] = [
  { value: 'button', label: 'Button click' },
  { value: 'click', label: 'Click anywhere' },
  { value: 'delay', label: 'After delay' },
  { value: 'form-submit', label: 'Form submit' },
];

export function StepEditor({
  step,
  onUpdate,
  onSelectElement,
  isSelectingElement,
}: StepEditorProps) {
  const [isSaving, setIsSaving] = useState(false);

  // Local state for form fields
  const [stepType, setStepType] = useState<GuideStepType>(step.step_type);
  const [title, setTitle] = useState(step.rich_content?.title || step.title || '');
  const [body, setBody] = useState(step.rich_content?.body || step.content || '');
  const [position, setPosition] = useState<TooltipPosition>(
    step.tooltip_position || (step.display_config?.position as TooltipPosition) || 'auto'
  );
  const [selector, setSelector] = useState(step.selector_strategy?.css || '');
  const [backdrop, setBackdrop] = useState(step.display_config?.backdrop !== false);
  const [advanceTrigger, setAdvanceTrigger] = useState<AdvanceTrigger>(
    step.advance_config?.trigger || 'button'
  );
  const [advanceDelay, setAdvanceDelay] = useState(step.advance_config?.delay || 3000);

  // Handle save
  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      const selectorStrategy: SelectorStrategy | undefined = selector
        ? { css: selector }
        : undefined;

      const richContent: GuideStepRichContent = {
        title: title || undefined,
        body: body || undefined,
      };

      const displayConfig: GuideStepDisplayConfig = {
        position: position !== 'auto' ? position : undefined,
        backdrop,
      };

      const advanceConfig: GuideStepAdvanceConfig = {
        trigger: advanceTrigger,
        delay: advanceTrigger === 'delay' ? advanceDelay : undefined,
      };

      await onUpdate(step.id, {
        stepType,
        selectorStrategy,
        richContent,
        displayConfig,
        advanceConfig,
        tooltipPosition: position,
      });
    } finally {
      setIsSaving(false);
    }
  }, [
    step.id,
    stepType,
    title,
    body,
    position,
    selector,
    backdrop,
    advanceTrigger,
    advanceDelay,
    onUpdate,
  ]);

  // Check if step type needs an element selector
  const needsSelector = stepType === 'tooltip' || stepType === 'hotspot';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div
        style={{
          padding: '16px',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span style={{ fontWeight: 500 }}>Edit Step</span>
        <button
          onClick={handleSave}
          disabled={isSaving}
          style={{
            padding: '6px 12px',
            fontSize: '13px',
            border: 'none',
            borderRadius: '4px',
            backgroundColor: '#2563eb',
            color: 'white',
            cursor: isSaving ? 'wait' : 'pointer',
            opacity: isSaving ? 0.7 : 1,
          }}
        >
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {/* Form */}
      <div style={{ flex: 1, overflow: 'auto', padding: '16px' }}>
        {/* Step Type */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 500 }}>
            Step Type
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
            {(Object.keys(stepTypeLabels) as GuideStepType[]).map((type) => (
              <button
                key={type}
                onClick={() => setStepType(type)}
                style={{
                  padding: '10px',
                  border: `2px solid ${stepType === type ? '#2563eb' : '#e5e7eb'}`,
                  borderRadius: '6px',
                  backgroundColor: stepType === type ? '#eff6ff' : 'white',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <div style={{ fontWeight: 500, fontSize: '13px' }}>{stepTypeLabels[type]}</div>
                <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>
                  {stepTypeDescriptions[type]}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Element Selector (for tooltip/hotspot) */}
        {needsSelector && (
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 500 }}>
              Target Element
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                value={selector}
                onChange={(e) => setSelector(e.target.value)}
                placeholder="CSS selector (e.g., #my-button)"
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  fontSize: '13px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontFamily: 'monospace',
                }}
              />
              <button
                onClick={onSelectElement}
                disabled={isSelectingElement}
                style={{
                  padding: '8px 12px',
                  fontSize: '13px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  backgroundColor: isSelectingElement ? '#f3f4f6' : 'white',
                  cursor: isSelectingElement ? 'wait' : 'pointer',
                }}
              >
                {isSelectingElement ? 'Selecting...' : 'Select'}
              </button>
            </div>
            <p style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>
              Click &quot;Select&quot; to pick an element on the page, or enter a CSS selector manually
            </p>
          </div>
        )}

        {/* Title */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 500 }}>
            Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter step title"
            style={{
              width: '100%',
              padding: '8px 12px',
              fontSize: '13px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
            }}
          />
        </div>

        {/* Body */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 500 }}>
            Content
          </label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Enter step content (HTML supported)"
            rows={4}
            style={{
              width: '100%',
              padding: '8px 12px',
              fontSize: '13px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              resize: 'vertical',
              fontFamily: 'inherit',
            }}
          />
        </div>

        {/* Position (for tooltip/hotspot) */}
        {(stepType === 'tooltip' || stepType === 'hotspot') && (
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 500 }}>
              Position
            </label>
            <select
              value={position}
              onChange={(e) => setPosition(e.target.value as TooltipPosition)}
              style={{
                width: '100%',
                padding: '8px 12px',
                fontSize: '13px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                backgroundColor: 'white',
              }}
            >
              {positionOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Banner Position */}
        {stepType === 'banner' && (
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 500 }}>
              Banner Position
            </label>
            <select
              value={position === 'bottom' ? 'bottom' : 'top'}
              onChange={(e) => setPosition(e.target.value as TooltipPosition)}
              style={{
                width: '100%',
                padding: '8px 12px',
                fontSize: '13px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                backgroundColor: 'white',
              }}
            >
              <option value="top">Top</option>
              <option value="bottom">Bottom</option>
            </select>
          </div>
        )}

        {/* Slideout Side */}
        {stepType === 'slideout' && (
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 500 }}>
              Slideout Side
            </label>
            <select
              value={position === 'left' ? 'left' : 'right'}
              onChange={(e) => setPosition(e.target.value as TooltipPosition)}
              style={{
                width: '100%',
                padding: '8px 12px',
                fontSize: '13px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                backgroundColor: 'white',
              }}
            >
              <option value="right">Right</option>
              <option value="left">Left</option>
            </select>
          </div>
        )}

        {/* Backdrop (for tooltip/modal) */}
        {(stepType === 'tooltip' || stepType === 'modal') && (
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={backdrop}
                onChange={(e) => setBackdrop(e.target.checked)}
                style={{ width: '16px', height: '16px' }}
              />
              <span style={{ fontSize: '13px', fontWeight: 500 }}>Show backdrop overlay</span>
            </label>
            <p style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px', marginLeft: '24px' }}>
              Dims the background to focus attention on the step
            </p>
          </div>
        )}

        {/* Advancement Trigger */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 500 }}>
            Advance When
          </label>
          <select
            value={advanceTrigger}
            onChange={(e) => setAdvanceTrigger(e.target.value as AdvanceTrigger)}
            style={{
              width: '100%',
              padding: '8px 12px',
              fontSize: '13px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              backgroundColor: 'white',
            }}
          >
            {advanceTriggerOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Delay Input (when delay trigger selected) */}
        {advanceTrigger === 'delay' && (
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 500 }}>
              Delay (seconds)
            </label>
            <input
              type="number"
              value={advanceDelay / 1000}
              onChange={(e) => setAdvanceDelay(Number(e.target.value) * 1000)}
              min={1}
              max={60}
              style={{
                width: '100%',
                padding: '8px 12px',
                fontSize: '13px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
