'use client';

import { useState, useCallback, type ReactNode } from 'react';
import { useGuideBuilder } from '../../hooks';
import type { Guide, GuideStep, CreateGuideStepOptions, GuideStepType, SelectorStrategy } from '../../../types';
import { StepEditor } from './StepEditor';
import { ElementSelector } from './ElementSelector';

/**
 * Props for the GuideBuilder component
 */
export interface GuideBuilderProps {
  /**
   * Whether the builder is open
   */
  isOpen?: boolean;

  /**
   * Callback when builder is closed
   */
  onClose?: () => void;

  /**
   * Guide ID to edit (optional - if not provided, creates new guide)
   */
  guideId?: string;

  /**
   * Callback when guide is saved
   */
  onSave?: (guide: Guide) => void;

  /**
   * Callback when guide is published
   */
  onPublish?: (guide: Guide) => void;

  /**
   * Custom trigger element
   */
  trigger?: ReactNode;

  /**
   * Custom CSS class for the modal
   */
  className?: string;

  /**
   * Layout mode:
   * - 'fullscreen' (default): Full-screen overlay with 3-column layout
   * - 'docked': Fixed right sidebar (420px) so the host app remains visible
   */
  mode?: 'fullscreen' | 'docked';
}

/**
 * Guide Builder Component
 *
 * A full-screen overlay for creating and editing guides.
 * This is a shell component - the full UI will be implemented in Phase 3.
 *
 * @example
 * ```tsx
 * // Controlled mode
 * <GuideBuilder
 *   isOpen={showBuilder}
 *   onClose={() => setShowBuilder(false)}
 *   onSave={(guide) => console.log('Saved:', guide)}
 * />
 *
 * // With trigger
 * <GuideBuilder
 *   trigger={<button>Create Guide</button>}
 *   onSave={(guide) => console.log('Saved:', guide)}
 * />
 * ```
 */
export function GuideBuilder({
  isOpen: controlledIsOpen,
  onClose,
  guideId,
  onSave,
  onPublish,
  trigger,
  className,
  mode = 'fullscreen',
}: GuideBuilderProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isOpen = controlledIsOpen ?? internalIsOpen;

  const {
    guide,
    steps,
    selectedStep,
    selectedStepId,
    isLoading,
    isSaving,
    error,
    loadGuide,
    updateGuide,
    publishGuide,
    addStep,
    updateStep,
    deleteStep,
    moveStepUp,
    moveStepDown,
    setSelectedStepId,
    reset,
  } = useGuideBuilder();

  // Open the builder
  const handleOpen = useCallback(async () => {
    setInternalIsOpen(true);
    if (guideId) {
      await loadGuide(guideId);
    }
  }, [guideId, loadGuide]);

  // Close the builder
  const handleClose = useCallback(() => {
    setInternalIsOpen(false);
    reset();
    onClose?.();
  }, [reset, onClose]);

  // Handle save
  const handleSave = useCallback(async () => {
    if (!guide) return;
    try {
      await updateGuide({});
      onSave?.(guide);
    } catch {
      // Error already set in hook
    }
  }, [guide, updateGuide, onSave]);

  // Handle publish
  const handlePublish = useCallback(async () => {
    if (!guide) return;
    try {
      const publishedGuide = await publishGuide();
      onPublish?.(publishedGuide);
    } catch {
      // Error already set in hook
    }
  }, [guide, publishGuide, onPublish]);

  // Add a new step
  const handleAddStep = useCallback(
    async (stepType: GuideStepType = 'tooltip') => {
      try {
        await addStep({
          stepType,
          richContent: {
            title: 'New Step',
            body: 'Click to edit...',
          },
        });
      } catch {
        // Error already set in hook
      }
    },
    [addStep]
  );

  // If trigger is provided and not controlled, render trigger + modal
  if (trigger && controlledIsOpen === undefined) {
    return (
      <>
        <span onClick={handleOpen}>{trigger}</span>
        {isOpen && (
          <GuideBuilderModal
            guide={guide}
            steps={steps}
            selectedStep={selectedStep}
            selectedStepId={selectedStepId}
            isLoading={isLoading}
            isSaving={isSaving}
            error={error}
            onClose={handleClose}
            onSave={handleSave}
            onPublish={handlePublish}
            onAddStep={handleAddStep}
            onSelectStep={setSelectedStepId}
            onUpdateStep={updateStep}
            onDeleteStep={deleteStep}
            onMoveStepUp={moveStepUp}
            onMoveStepDown={moveStepDown}
            className={className}
            mode={mode}
          />
        )}
      </>
    );
  }

  // Controlled mode - just render modal if open
  if (!isOpen) return null;

  return (
    <GuideBuilderModal
      guide={guide}
      steps={steps}
      selectedStep={selectedStep}
      selectedStepId={selectedStepId}
      isLoading={isLoading}
      isSaving={isSaving}
      error={error}
      onClose={handleClose}
      onSave={handleSave}
      onPublish={handlePublish}
      onAddStep={handleAddStep}
      onSelectStep={setSelectedStepId}
      onUpdateStep={updateStep}
      onDeleteStep={deleteStep}
      onMoveStepUp={moveStepUp}
      onMoveStepDown={moveStepDown}
      className={className}
      mode={mode}
    />
  );
}

/**
 * The modal UI for the guide builder
 * This is a shell - full implementation in Phase 3
 */
interface GuideBuilderModalProps {
  guide: Guide | null;
  steps: GuideStep[];
  selectedStep: GuideStep | null;
  selectedStepId: string | null;
  isLoading: boolean;
  isSaving: boolean;
  error: Error | null;
  onClose: () => void;
  onSave: () => void;
  onPublish: () => void;
  onAddStep: (stepType?: GuideStepType) => void;
  onSelectStep: (stepId: string | null) => void;
  onUpdateStep: (stepId: string, options: CreateGuideStepOptions) => Promise<GuideStep>;
  onDeleteStep: (stepId: string) => Promise<void>;
  onMoveStepUp: (stepId: string) => Promise<GuideStep[] | undefined>;
  onMoveStepDown: (stepId: string) => Promise<GuideStep[] | undefined>;
  className?: string;
  mode?: 'fullscreen' | 'docked';
}

function GuideBuilderModal({
  guide,
  steps,
  selectedStep,
  selectedStepId,
  isLoading,
  isSaving,
  error,
  onClose,
  onSave,
  onPublish,
  onAddStep,
  onSelectStep,
  onUpdateStep,
  onDeleteStep,
  onMoveStepUp,
  onMoveStepDown,
  className,
  mode = 'fullscreen',
}: GuideBuilderModalProps) {
  const [isSelectingElement, setIsSelectingElement] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const isDocked = mode === 'docked';

  const stepTypeLabels: Record<GuideStepType, string> = {
    tooltip: 'Tooltip',
    modal: 'Modal',
    slideout: 'Slideout',
    hotspot: 'Hotspot',
    banner: 'Banner',
    embedded: 'Embedded',
  };

  // Handle element selection
  const handleElementSelect = useCallback(
    (selector: SelectorStrategy, _element: Element) => {
      if (selectedStep) {
        onUpdateStep(selectedStep.id, {
          selectorStrategy: selector,
        });
      }
      setIsSelectingElement(false);
    },
    [selectedStep, onUpdateStep]
  );

  // Step list items (shared between fullscreen and docked)
  const stepListItems = isLoading ? (
    <div style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>
      Loading...
    </div>
  ) : steps.length === 0 ? (
    <div style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>
      No steps yet. Click &quot;Add Step&quot; to get started.
    </div>
  ) : (
    steps.map((step, index) => (
      <div
        key={step.id}
        onClick={() => onSelectStep(step.id)}
        style={{
          padding: '12px',
          marginBottom: '4px',
          borderRadius: '6px',
          backgroundColor: selectedStepId === step.id ? '#eff6ff' : 'white',
          border: `1px solid ${selectedStepId === step.id ? '#3b82f6' : '#e5e7eb'}`,
          cursor: 'pointer',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 500, fontSize: '14px' }}>
            {index + 1}. {stepTypeLabels[step.step_type]}
          </span>
          <div style={{ display: 'flex', gap: '4px' }}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onMoveStepUp(step.id);
              }}
              disabled={index === 0}
              style={{
                padding: '2px 6px',
                fontSize: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '3px',
                backgroundColor: 'white',
                cursor: index === 0 ? 'not-allowed' : 'pointer',
                opacity: index === 0 ? 0.3 : 1,
              }}
            >
              Up
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onMoveStepDown(step.id);
              }}
              disabled={index === steps.length - 1}
              style={{
                padding: '2px 6px',
                fontSize: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '3px',
                backgroundColor: 'white',
                cursor: index === steps.length - 1 ? 'not-allowed' : 'pointer',
                opacity: index === steps.length - 1 ? 0.3 : 1,
              }}
            >
              Down
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (confirm('Delete this step?')) {
                  onDeleteStep(step.id);
                }
              }}
              style={{
                padding: '2px 6px',
                fontSize: '12px',
                border: '1px solid #fecaca',
                borderRadius: '3px',
                backgroundColor: '#fef2f2',
                color: '#dc2626',
                cursor: 'pointer',
              }}
            >
              Delete
            </button>
          </div>
        </div>
        <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#6b7280' }}>
          {step.rich_content?.title || step.title || 'Untitled'}
        </p>
      </div>
    ))
  );

  return (
    <>
      {/* Element Selector Overlay */}
      <ElementSelector
        isActive={isSelectingElement}
        onSelect={handleElementSelect}
        onCancel={() => setIsSelectingElement(false)}
        ignoreSelector="[data-census-builder]"
      />

      {/* Collapse/Expand toggle for docked mode */}
      {isDocked && (
        <button
          data-census-builder
          onClick={() => setIsCollapsed(!isCollapsed)}
          style={{
            position: 'fixed',
            top: '50%',
            right: isCollapsed ? 0 : '420px',
            transform: 'translateY(-50%)',
            zIndex: 10000,
            width: '24px',
            height: '48px',
            border: '1px solid #e5e7eb',
            borderRight: isCollapsed ? '1px solid #e5e7eb' : 'none',
            borderRadius: isCollapsed ? '6px 0 0 6px' : '6px 0 0 6px',
            backgroundColor: 'white',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '-2px 0 8px rgba(0,0,0,0.08)',
            transition: 'right 0.2s ease',
            fontSize: '12px',
            color: '#6b7280',
            padding: 0,
          }}
        >
          {isCollapsed ? '\u25C0' : '\u25B6'}
        </button>
      )}

      <div
        className={className}
        data-census-builder
        style={isDocked ? {
          position: 'fixed',
          top: 0,
          right: isCollapsed ? '-420px' : 0,
          bottom: 0,
          width: '420px',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#f8f9fa',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          boxShadow: '-4px 0 20px rgba(0,0,0,0.1)',
          transition: 'right 0.2s ease',
        } : {
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#f8f9fa',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        {/* Header */}
        <header
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: isDocked ? '10px 16px' : '12px 20px',
            backgroundColor: 'white',
            borderBottom: '1px solid #e5e7eb',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: isDocked ? '8px' : '12px', minWidth: 0 }}>
            <button
              onClick={onClose}
              style={{
                padding: isDocked ? '6px 10px' : '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                backgroundColor: 'white',
                cursor: 'pointer',
                fontSize: isDocked ? '13px' : '14px',
                flexShrink: 0,
              }}
            >
              Close
            </button>
            <h1 style={{
              margin: 0,
              fontSize: isDocked ? '15px' : '18px',
              fontWeight: 600,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {guide ? guide.name : 'Guide Builder'}
            </h1>
            {guide?.status && (
              <span
                style={{
                  padding: '2px 8px',
                  fontSize: '12px',
                  borderRadius: '4px',
                  backgroundColor: guide.status === 'published' ? '#dcfce7' : '#fef3c7',
                  color: guide.status === 'published' ? '#166534' : '#92400e',
                  flexShrink: 0,
                }}
              >
                {guide.status}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
            {error && !isDocked && (
              <span style={{ color: '#dc2626', fontSize: '14px' }}>{error.message}</span>
            )}
            <button
              onClick={onSave}
              disabled={isSaving || !guide}
              style={{
                padding: isDocked ? '6px 12px' : '8px 16px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                backgroundColor: 'white',
                cursor: isSaving ? 'wait' : 'pointer',
                opacity: isSaving ? 0.5 : 1,
                fontSize: isDocked ? '13px' : '14px',
              }}
            >
              {isSaving ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={onPublish}
              disabled={isSaving || !guide || guide.status === 'published'}
              style={{
                padding: isDocked ? '6px 12px' : '8px 16px',
                border: 'none',
                borderRadius: '6px',
                backgroundColor: '#2563eb',
                color: 'white',
                cursor: isSaving ? 'wait' : 'pointer',
                opacity: isSaving || guide?.status === 'published' ? 0.5 : 1,
                fontSize: isDocked ? '13px' : '14px',
              }}
            >
              Publish
            </button>
          </div>
        </header>

        {/* Error bar for docked mode */}
        {isDocked && error && (
          <div style={{
            padding: '8px 16px',
            backgroundColor: '#fef2f2',
            borderBottom: '1px solid #fecaca',
            color: '#dc2626',
            fontSize: '13px',
          }}>
            {error.message}
          </div>
        )}

        {/* Main Content */}
        {isDocked ? (
          /* Docked: single scrollable column */
          <div style={{ flex: 1, overflow: 'auto' }}>
            {/* Step List */}
            <div style={{ backgroundColor: 'white', borderBottom: '1px solid #e5e7eb' }}>
              <div
                style={{
                  padding: '12px 16px',
                  borderBottom: '1px solid #e5e7eb',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span style={{ fontWeight: 500, fontSize: '14px' }}>Steps ({steps.length})</span>
                <button
                  onClick={() => onAddStep('tooltip')}
                  disabled={!guide}
                  style={{
                    padding: '5px 10px',
                    fontSize: '12px',
                    border: 'none',
                    borderRadius: '4px',
                    backgroundColor: '#2563eb',
                    color: 'white',
                    cursor: guide ? 'pointer' : 'not-allowed',
                    opacity: guide ? 1 : 0.5,
                  }}
                >
                  + Add Step
                </button>
              </div>
              <div style={{ padding: '8px' }}>
                {stepListItems}
              </div>
            </div>

            {/* Step Editor */}
            <div style={{ backgroundColor: 'white' }}>
              {selectedStep ? (
                <StepEditor
                  step={selectedStep}
                  onUpdate={onUpdateStep}
                  onSelectElement={() => setIsSelectingElement(true)}
                  isSelectingElement={isSelectingElement}
                />
              ) : (
                <div style={{ padding: '16px', textAlign: 'center', color: '#6b7280' }}>
                  <p>Select a step to edit</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Fullscreen: 3-column layout */
          <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
            {/* Left Panel - Step List */}
            <aside
              style={{
                width: '280px',
                backgroundColor: 'white',
                borderRight: '1px solid #e5e7eb',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div
                style={{
                  padding: '16px',
                  borderBottom: '1px solid #e5e7eb',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span style={{ fontWeight: 500 }}>Steps ({steps.length})</span>
                <button
                  onClick={() => onAddStep('tooltip')}
                  disabled={!guide}
                  style={{
                    padding: '6px 12px',
                    fontSize: '13px',
                    border: 'none',
                    borderRadius: '4px',
                    backgroundColor: '#2563eb',
                    color: 'white',
                    cursor: guide ? 'pointer' : 'not-allowed',
                    opacity: guide ? 1 : 0.5,
                  }}
                >
                  + Add Step
                </button>
              </div>

              <div style={{ flex: 1, overflow: 'auto', padding: '8px' }}>
                {stepListItems}
              </div>
            </aside>

            {/* Center - Preview */}
            <main style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#f3f4f6' }}>
              <div
                style={{
                  padding: '16px',
                  borderBottom: '1px solid #e5e7eb',
                  backgroundColor: 'white',
                }}
              >
                <span style={{ fontWeight: 500 }}>Preview</span>
              </div>
              <div
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#6b7280',
                }}
              >
                {selectedStep ? (
                  <div
                    style={{
                      padding: '24px',
                      backgroundColor: 'white',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                      maxWidth: '400px',
                      width: '100%',
                    }}
                  >
                    {/* Step type badge */}
                    <div style={{ marginBottom: '12px' }}>
                      <span
                        style={{
                          padding: '4px 8px',
                          fontSize: '11px',
                          fontWeight: 500,
                          borderRadius: '4px',
                          backgroundColor: '#f3f4f6',
                          color: '#6b7280',
                          textTransform: 'uppercase',
                        }}
                      >
                        {stepTypeLabels[selectedStep.step_type]}
                      </span>
                    </div>
                    <h3 style={{ margin: '0 0 8px', fontSize: '16px' }}>
                      {selectedStep.rich_content?.title || selectedStep.title || 'Step Preview'}
                    </h3>
                    <p style={{ margin: 0, color: '#4b5563' }}>
                      {selectedStep.rich_content?.body || selectedStep.content || 'No content'}
                    </p>
                    {/* Show media preview if present */}
                    {selectedStep.rich_content?.media && (
                      <div style={{ marginTop: '12px' }}>
                        {selectedStep.rich_content.media.type === 'image' && (
                          <img
                            src={selectedStep.rich_content.media.url}
                            alt={selectedStep.rich_content.media.alt || ''}
                            style={{ maxWidth: '100%', borderRadius: '4px' }}
                          />
                        )}
                      </div>
                    )}
                    {/* Show buttons preview */}
                    {selectedStep.rich_content?.buttons && selectedStep.rich_content.buttons.length > 0 && (
                      <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
                        {selectedStep.rich_content.buttons.map((btn, i) => (
                          <span
                            key={i}
                            style={{
                              padding: '6px 12px',
                              fontSize: '13px',
                              borderRadius: '4px',
                              backgroundColor: btn.style === 'primary' ? '#2563eb' : '#f3f4f6',
                              color: btn.style === 'primary' ? 'white' : '#374151',
                            }}
                          >
                            {btn.label}
                          </span>
                        ))}
                      </div>
                    )}
                    {/* Show selector info */}
                    {selectedStep.selector_strategy?.css && (
                      <div
                        style={{
                          marginTop: '16px',
                          padding: '8px',
                          backgroundColor: '#f9fafb',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontFamily: 'monospace',
                          color: '#6b7280',
                        }}
                      >
                        Target: {selectedStep.selector_strategy.css}
                      </div>
                    )}
                  </div>
                ) : (
                  <p>Select a step to preview</p>
                )}
              </div>
            </main>

            {/* Right Panel - Step Editor */}
            <aside
              style={{
                width: '360px',
                backgroundColor: 'white',
                borderLeft: '1px solid #e5e7eb',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
              }}
            >
              {selectedStep ? (
                <StepEditor
                  step={selectedStep}
                  onUpdate={onUpdateStep}
                  onSelectElement={() => setIsSelectingElement(true)}
                  isSelectingElement={isSelectingElement}
                />
              ) : (
                <div style={{ padding: '16px' }}>
                  <p style={{ color: '#6b7280' }}>Select a step to edit its settings</p>
                </div>
              )}
            </aside>
          </div>
        )}
      </div>
    </>
  );
}
