'use client';

import type { TooltipPosition } from '../../../types';

/**
 * Position data for an element
 */
export interface ElementRect {
  top: number;
  left: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
}

/**
 * Computed position for a tooltip/popover
 */
export interface ComputedPosition {
  top: number;
  left: number;
  placement: TooltipPosition;
  arrowPosition: { top?: number; left?: number; transform?: string };
}

/**
 * Position configuration
 */
export interface PositionConfig {
  preferredPosition: TooltipPosition;
  offset?: { x: number; y: number };
  containerPadding?: number;
  arrowSize?: number;
}

/**
 * Get the bounding rect of an element with scroll offset
 */
export function getElementRect(element: Element): ElementRect {
  const rect = element.getBoundingClientRect();
  return {
    top: rect.top + window.scrollY,
    left: rect.left + window.scrollX,
    right: rect.right + window.scrollX,
    bottom: rect.bottom + window.scrollY,
    width: rect.width,
    height: rect.height,
  };
}

/**
 * Get the viewport dimensions
 */
export function getViewport(): { width: number; height: number; scrollX: number; scrollY: number } {
  return {
    width: window.innerWidth,
    height: window.innerHeight,
    scrollX: window.scrollX,
    scrollY: window.scrollY,
  };
}

/**
 * Check if there's enough space to place tooltip at a given position
 */
function hasSpaceForPosition(
  targetRect: ElementRect,
  tooltipWidth: number,
  tooltipHeight: number,
  position: TooltipPosition,
  padding: number
): boolean {
  const viewport = getViewport();
  const { scrollX, scrollY, width: viewportWidth, height: viewportHeight } = viewport;

  switch (position) {
    case 'top':
      return (
        targetRect.top - scrollY - tooltipHeight - padding > 0 &&
        targetRect.left - scrollX + targetRect.width / 2 - tooltipWidth / 2 > 0 &&
        targetRect.left - scrollX + targetRect.width / 2 + tooltipWidth / 2 < viewportWidth
      );
    case 'bottom':
      return (
        targetRect.bottom - scrollY + tooltipHeight + padding < viewportHeight &&
        targetRect.left - scrollX + targetRect.width / 2 - tooltipWidth / 2 > 0 &&
        targetRect.left - scrollX + targetRect.width / 2 + tooltipWidth / 2 < viewportWidth
      );
    case 'left':
      return (
        targetRect.left - scrollX - tooltipWidth - padding > 0 &&
        targetRect.top - scrollY + targetRect.height / 2 - tooltipHeight / 2 > 0 &&
        targetRect.top - scrollY + targetRect.height / 2 + tooltipHeight / 2 < viewportHeight
      );
    case 'right':
      return (
        targetRect.right - scrollX + tooltipWidth + padding < viewportWidth &&
        targetRect.top - scrollY + targetRect.height / 2 - tooltipHeight / 2 > 0 &&
        targetRect.top - scrollY + targetRect.height / 2 + tooltipHeight / 2 < viewportHeight
      );
    default:
      return true;
  }
}

/**
 * Find the best position when 'auto' is specified
 */
function findBestPosition(
  targetRect: ElementRect,
  tooltipWidth: number,
  tooltipHeight: number,
  padding: number
): TooltipPosition {
  // Preference order: bottom, top, right, left
  const positionOrder: TooltipPosition[] = ['bottom', 'top', 'right', 'left'];

  for (const position of positionOrder) {
    if (hasSpaceForPosition(targetRect, tooltipWidth, tooltipHeight, position, padding)) {
      return position;
    }
  }

  // Fallback to bottom if nothing fits
  return 'bottom';
}

/**
 * Calculate the position for a tooltip relative to a target element
 */
export function calculatePosition(
  targetElement: Element,
  tooltipWidth: number,
  tooltipHeight: number,
  config: PositionConfig
): ComputedPosition {
  const { preferredPosition, offset = { x: 0, y: 0 }, containerPadding = 10, arrowSize = 8 } = config;

  const targetRect = getElementRect(targetElement);
  const viewport = getViewport();

  // Determine final position
  let finalPosition: TooltipPosition = preferredPosition;
  if (preferredPosition === 'auto') {
    finalPosition = findBestPosition(targetRect, tooltipWidth, tooltipHeight, containerPadding);
  } else if (!hasSpaceForPosition(targetRect, tooltipWidth, tooltipHeight, preferredPosition, containerPadding)) {
    // Flip to opposite side if not enough space
    const opposites: Record<string, TooltipPosition> = {
      top: 'bottom',
      bottom: 'top',
      left: 'right',
      right: 'left',
    };
    const opposite = opposites[preferredPosition];
    if (opposite && hasSpaceForPosition(targetRect, tooltipWidth, tooltipHeight, opposite, containerPadding)) {
      finalPosition = opposite;
    }
  }

  let top = 0;
  let left = 0;
  let arrowPosition: ComputedPosition['arrowPosition'] = {};

  const gap = arrowSize + 4; // Gap between tooltip and target

  switch (finalPosition) {
    case 'top':
      top = targetRect.top - tooltipHeight - gap + offset.y;
      left = targetRect.left + targetRect.width / 2 - tooltipWidth / 2 + offset.x;
      arrowPosition = {
        left: tooltipWidth / 2 - arrowSize / 2,
        top: tooltipHeight,
        transform: 'rotate(180deg)',
      };
      break;

    case 'bottom':
      top = targetRect.bottom + gap + offset.y;
      left = targetRect.left + targetRect.width / 2 - tooltipWidth / 2 + offset.x;
      arrowPosition = {
        left: tooltipWidth / 2 - arrowSize / 2,
        top: -arrowSize,
      };
      break;

    case 'left':
      top = targetRect.top + targetRect.height / 2 - tooltipHeight / 2 + offset.y;
      left = targetRect.left - tooltipWidth - gap + offset.x;
      arrowPosition = {
        top: tooltipHeight / 2 - arrowSize / 2,
        left: tooltipWidth,
        transform: 'rotate(-90deg)',
      };
      break;

    case 'right':
      top = targetRect.top + targetRect.height / 2 - tooltipHeight / 2 + offset.y;
      left = targetRect.right + gap + offset.x;
      arrowPosition = {
        top: tooltipHeight / 2 - arrowSize / 2,
        left: -arrowSize,
        transform: 'rotate(90deg)',
      };
      break;
  }

  // Clamp to viewport bounds
  const minLeft = viewport.scrollX + containerPadding;
  const maxLeft = viewport.scrollX + viewport.width - tooltipWidth - containerPadding;
  const minTop = viewport.scrollY + containerPadding;
  const maxTop = viewport.scrollY + viewport.height - tooltipHeight - containerPadding;

  // Adjust arrow position if tooltip is clamped horizontally
  const originalLeft = left;
  left = Math.max(minLeft, Math.min(maxLeft, left));
  if (finalPosition === 'top' || finalPosition === 'bottom') {
    arrowPosition.left = (arrowPosition.left || 0) + (originalLeft - left);
  }

  // Adjust arrow position if tooltip is clamped vertically
  const originalTop = top;
  top = Math.max(minTop, Math.min(maxTop, top));
  if (finalPosition === 'left' || finalPosition === 'right') {
    arrowPosition.top = (arrowPosition.top || 0) + (originalTop - top);
  }

  return {
    top,
    left,
    placement: finalPosition,
    arrowPosition,
  };
}

/**
 * Scroll an element into view with optional padding
 */
export function scrollIntoView(element: Element, padding: number = 100): void {
  const rect = element.getBoundingClientRect();
  const viewport = getViewport();

  const isAboveViewport = rect.top < padding;
  const isBelowViewport = rect.bottom > viewport.height - padding;
  const isLeftOfViewport = rect.left < padding;
  const isRightOfViewport = rect.right > viewport.width - padding;

  if (isAboveViewport || isBelowViewport || isLeftOfViewport || isRightOfViewport) {
    element.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
      inline: 'center',
    });
  }
}

/**
 * Find an element using a selector strategy
 */
export function findElement(
  selectorStrategy: { css?: string; xpath?: string; text?: string; testId?: string } | null
): Element | null {
  if (!selectorStrategy) return null;

  // Try CSS selector first
  if (selectorStrategy.css) {
    try {
      const element = document.querySelector(selectorStrategy.css);
      if (element) return element;
    } catch {
      // Invalid selector
    }
  }

  // Try data-testid
  if (selectorStrategy.testId) {
    const element = document.querySelector(`[data-testid="${selectorStrategy.testId}"]`);
    if (element) return element;
  }

  // Try XPath
  if (selectorStrategy.xpath) {
    try {
      const result = document.evaluate(
        selectorStrategy.xpath,
        document,
        null,
        XPathResult.FIRST_ORDERED_NODE_TYPE,
        null
      );
      if (result.singleNodeValue) return result.singleNodeValue as Element;
    } catch {
      // Invalid xpath
    }
  }

  // Try text content (basic implementation)
  if (selectorStrategy.text) {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let node: Node | null;
    while ((node = walker.nextNode())) {
      if (node.textContent?.includes(selectorStrategy.text)) {
        return node.parentElement;
      }
    }
  }

  return null;
}

/**
 * Generate a spotlight/backdrop with a hole for the target element
 */
export function getSpotlightClipPath(element: Element, padding: number = 8): string {
  const rect = element.getBoundingClientRect();
  const paddedRect = {
    top: rect.top - padding,
    left: rect.left - padding,
    right: rect.right + padding,
    bottom: rect.bottom + padding,
    width: rect.width + padding * 2,
    height: rect.height + padding * 2,
  };

  // Create a polygon that covers everything except the element
  // Using a polygon with a hole (clockwise outer, counter-clockwise inner)
  return `polygon(
    0 0,
    100% 0,
    100% 100%,
    0 100%,
    0 0,
    ${paddedRect.left}px ${paddedRect.top}px,
    ${paddedRect.left}px ${paddedRect.bottom}px,
    ${paddedRect.right}px ${paddedRect.bottom}px,
    ${paddedRect.right}px ${paddedRect.top}px,
    ${paddedRect.left}px ${paddedRect.top}px
  )`;
}
