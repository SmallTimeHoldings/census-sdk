'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { getSpotlightClipPath } from './positioning';

export interface BackdropProps {
  /**
   * Whether the backdrop is visible
   */
  visible: boolean;

  /**
   * Element to spotlight (cut out of backdrop)
   */
  spotlightElement?: Element | null;

  /**
   * Padding around the spotlighted element
   */
  spotlightPadding?: number;

  /**
   * Callback when clicking the backdrop (outside spotlight)
   */
  onClick?: () => void;

  /**
   * Whether clicking backdrop dismisses the guide
   */
  dismissOnClick?: boolean;

  /**
   * Custom z-index
   */
  zIndex?: number;

  /**
   * Backdrop opacity (0-1)
   */
  opacity?: number;
}

export function Backdrop({
  visible,
  spotlightElement,
  spotlightPadding = 8,
  onClick,
  dismissOnClick = false,
  zIndex = 9998,
  opacity = 0.5,
}: BackdropProps) {
  const [clipPath, setClipPath] = useState<string | undefined>();

  const updateClipPath = useCallback(() => {
    if (spotlightElement) {
      setClipPath(getSpotlightClipPath(spotlightElement, spotlightPadding));
    } else {
      setClipPath(undefined);
    }
  }, [spotlightElement, spotlightPadding]);

  useEffect(() => {
    if (!visible) return;

    updateClipPath();

    // Update on scroll and resize
    window.addEventListener('scroll', updateClipPath, true);
    window.addEventListener('resize', updateClipPath);

    return () => {
      window.removeEventListener('scroll', updateClipPath, true);
      window.removeEventListener('resize', updateClipPath);
    };
  }, [visible, updateClipPath]);

  if (!visible) return null;

  const handleClick = (e: React.MouseEvent) => {
    // Only fire if clicking the backdrop itself, not the spotlight area
    if (dismissOnClick && onClick) {
      onClick();
    }
    e.stopPropagation();
  };

  return (
    <div
      onClick={handleClick}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex,
        backgroundColor: `rgba(0, 0, 0, ${opacity})`,
        clipPath,
        transition: 'clip-path 0.2s ease-out',
        cursor: dismissOnClick ? 'pointer' : 'default',
        pointerEvents: spotlightElement ? 'auto' : 'auto',
      }}
      aria-hidden="true"
    />
  );
}
