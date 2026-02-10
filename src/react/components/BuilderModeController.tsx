'use client';

import { useState, useEffect, useCallback } from 'react';
import { GuideBuilder } from './GuideBuilder';

/**
 * BuilderModeController
 *
 * Automatically activates the GuideBuilder in docked (right sidebar) mode
 * when the URL contains `?census-builder=true`.
 *
 * Optionally loads an existing guide if `census-guide-id=<id>` is present.
 *
 * Rendered inside CensusProvider — no manual setup required.
 *
 * @example
 * // Activate by navigating to:
 * // https://your-app.com/some-page?census-builder=true&census-guide-id=abc-123
 */
export function BuilderModeController() {
  const [isActive, setIsActive] = useState(false);
  const [guideId, setGuideId] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const params = new URLSearchParams(window.location.search);
    const builderParam = params.get('census-builder');
    const guideIdParam = params.get('census-guide-id');

    if (builderParam === 'true') {
      setIsActive(true);
      if (guideIdParam) {
        setGuideId(guideIdParam);
      }
    }
  }, []);

  const handleClose = useCallback(() => {
    setIsActive(false);
    setGuideId(undefined);

    // Remove census params from URL without reload
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.delete('census-builder');
      url.searchParams.delete('census-guide-id');
      window.history.replaceState({}, '', url.toString());
    }
  }, []);

  if (!isActive) return null;

  return (
    <GuideBuilder
      isOpen={true}
      guideId={guideId}
      mode="docked"
      onClose={handleClose}
    />
  );
}
