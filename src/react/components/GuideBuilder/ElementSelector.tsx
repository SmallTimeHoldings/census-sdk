'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { SelectorStrategy } from '../../../types';

export interface ElementSelectorProps {
  /**
   * Whether the selector is active
   */
  isActive: boolean;

  /**
   * Callback when an element is selected
   */
  onSelect: (selector: SelectorStrategy, element: Element) => void;

  /**
   * Callback to cancel selection mode
   */
  onCancel: () => void;

  /**
   * Elements to ignore (e.g., the builder UI itself)
   */
  ignoreSelector?: string;

  /**
   * Z-index for the selector overlay
   */
  zIndex?: number;
}

/**
 * Generates a CSS selector for an element
 * Tries to create the most specific and reliable selector possible
 */
function generateSelector(element: Element): SelectorStrategy {
  const result: SelectorStrategy = {};

  // Try data-testid first (most reliable)
  const testId = element.getAttribute('data-testid');
  if (testId) {
    result.testId = testId;
    result.css = `[data-testid="${testId}"]`;
    return result;
  }

  // Try ID (also very reliable)
  if (element.id) {
    result.css = `#${CSS.escape(element.id)}`;
    return result;
  }

  // Build a CSS path
  const parts: string[] = [];
  let current: Element | null = element;
  let depth = 0;
  const maxDepth = 5;

  while (current && current !== document.body && depth < maxDepth) {
    let selector = current.tagName.toLowerCase();

    // Add classes (up to 2 most specific)
    const classes = Array.from(current.classList)
      .filter((c) => !c.startsWith('hover') && !c.startsWith('focus') && !c.startsWith('active'))
      .slice(0, 2);

    if (classes.length > 0) {
      selector += '.' + classes.map((c) => CSS.escape(c)).join('.');
    }

    // Add nth-child if needed for uniqueness
    const parent = current.parentElement;
    if (parent) {
      const siblings = Array.from(parent.children).filter(
        (child) => child.tagName === current!.tagName
      );
      if (siblings.length > 1) {
        const index = siblings.indexOf(current) + 1;
        selector += `:nth-of-type(${index})`;
      }
    }

    parts.unshift(selector);

    // Check if this is unique enough
    const testSelector = parts.join(' > ');
    try {
      if (document.querySelectorAll(testSelector).length === 1) {
        result.css = testSelector;
        break;
      }
    } catch {
      // Invalid selector, continue
    }

    current = current.parentElement;
    depth++;
  }

  if (!result.css && parts.length > 0) {
    result.css = parts.join(' > ');
  }

  // Also try to capture text content for text-based selection
  const text = element.textContent?.trim();
  if (text && text.length < 100 && text.length > 2) {
    result.text = text.slice(0, 50);
  }

  return result;
}

/**
 * Tests if a selector uniquely identifies an element
 */
function testSelector(selector: SelectorStrategy): { isUnique: boolean; count: number } {
  let count = 0;

  if (selector.css) {
    try {
      count = document.querySelectorAll(selector.css).length;
    } catch {
      // Invalid selector
    }
  }

  if (selector.testId) {
    count = document.querySelectorAll(`[data-testid="${selector.testId}"]`).length;
  }

  return { isUnique: count === 1, count };
}

export function ElementSelector({
  isActive,
  onSelect,
  onCancel,
  ignoreSelector = '[data-census-builder]',
  zIndex = 99999,
}: ElementSelectorProps) {
  const [hoveredElement, setHoveredElement] = useState<Element | null>(null);
  const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null);
  const [generatedSelector, setGeneratedSelector] = useState<SelectorStrategy | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Update highlight position
  const updateHighlight = useCallback(() => {
    if (!hoveredElement) {
      setHighlightRect(null);
      return;
    }
    setHighlightRect(hoveredElement.getBoundingClientRect());
  }, [hoveredElement]);

  // Handle mouse move
  useEffect(() => {
    if (!isActive) return;

    const handleMouseMove = (e: MouseEvent) => {
      // Get element under cursor
      const elements = document.elementsFromPoint(e.clientX, e.clientY);

      // Find the first element that's not part of the builder or the overlay
      const target = elements.find((el) => {
        // Skip our overlay
        if (overlayRef.current?.contains(el)) return false;
        // Skip elements matching ignore selector
        if (ignoreSelector && el.closest(ignoreSelector)) return false;
        // Skip body and html
        if (el === document.body || el === document.documentElement) return false;
        return true;
      });

      if (target !== hoveredElement) {
        setHoveredElement(target || null);
        if (target) {
          setGeneratedSelector(generateSelector(target));
        } else {
          setGeneratedSelector(null);
        }
      }
    };

    const handleScroll = () => {
      updateHighlight();
    };

    document.addEventListener('mousemove', handleMouseMove, true);
    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleScroll);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove, true);
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleScroll);
    };
  }, [isActive, hoveredElement, ignoreSelector, updateHighlight]);

  // Update highlight when element changes
  useEffect(() => {
    updateHighlight();
  }, [hoveredElement, updateHighlight]);

  // Handle click to select
  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (hoveredElement && generatedSelector) {
        onSelect(generatedSelector, hoveredElement);
      }
    },
    [hoveredElement, generatedSelector, onSelect]
  );

  // Handle escape to cancel
  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isActive, onCancel]);

  if (!isActive) return null;

  const selectorTest = generatedSelector ? testSelector(generatedSelector) : null;

  return (
    <div
      ref={overlayRef}
      data-census-builder
      style={{
        position: 'fixed',
        inset: 0,
        zIndex,
        cursor: 'crosshair',
      }}
      onClick={handleClick}
    >
      {/* Element highlight */}
      {highlightRect && (
        <div
          style={{
            position: 'fixed',
            top: highlightRect.top,
            left: highlightRect.left,
            width: highlightRect.width,
            height: highlightRect.height,
            border: '2px solid #2563eb',
            borderRadius: '4px',
            backgroundColor: 'rgba(37, 99, 235, 0.1)',
            pointerEvents: 'none',
            transition: 'all 0.1s ease-out',
          }}
        />
      )}

      {/* Selector info tooltip */}
      {highlightRect && generatedSelector && (
        <div
          style={{
            position: 'fixed',
            top: Math.max(8, highlightRect.top - 40),
            left: highlightRect.left,
            padding: '6px 10px',
            backgroundColor: '#1f2937',
            color: 'white',
            fontSize: '12px',
            fontFamily: 'monospace',
            borderRadius: '4px',
            maxWidth: '300px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          }}
        >
          <span style={{ color: '#9ca3af' }}>
            {generatedSelector.testId ? 'data-testid: ' : ''}
          </span>
          {generatedSelector.testId || generatedSelector.css}
          {selectorTest && (
            <span
              style={{
                marginLeft: '8px',
                color: selectorTest.isUnique ? '#4ade80' : '#fbbf24',
              }}
            >
              ({selectorTest.count} match{selectorTest.count !== 1 ? 'es' : ''})
            </span>
          )}
        </div>
      )}

      {/* Instructions bar */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          padding: '12px 20px',
          backgroundColor: '#1f2937',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          fontSize: '14px',
        }}
      >
        <span>
          Click on any element to select it, or press <kbd style={{
            padding: '2px 6px',
            backgroundColor: '#374151',
            borderRadius: '4px',
            marginLeft: '4px',
            marginRight: '4px',
          }}>Esc</kbd> to cancel
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onCancel();
          }}
          style={{
            padding: '6px 12px',
            border: '1px solid #4b5563',
            borderRadius: '4px',
            backgroundColor: 'transparent',
            color: 'white',
            cursor: 'pointer',
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
