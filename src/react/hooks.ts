import { useState, useCallback, useEffect, useRef } from 'react';
import { useCensusContext } from './context';
import type {
  FeedbackOptions,
  ArticlesOptions,
  ArticlesResponse,
  Article,
  RequestsOptions,
  RequestsResponse,
  Guide,
  GuideStep,
  GuidesResponse,
  CreateGuideOptions,
  UpdateGuideOptions,
  CreateGuideStepOptions,
  UpdateGuideStepOptions,
  GuidesOptions,
} from '../types';

/**
 * Hook for submitting feedback.
 *
 * @returns Object with submit function and state
 *
 * @example
 * ```tsx
 * function FeedbackForm() {
 *   const { submitFeedback, isSubmitting, isSuccess, error } = useFeedback();
 *
 *   const handleSubmit = async (message: string) => {
 *     await submitFeedback({
 *       type: 'feedback',
 *       message,
 *     });
 *   };
 *
 *   return (
 *     <form onSubmit={...}>
 *       {isSuccess && <p>Thanks for your feedback!</p>}
 *       {error && <p>Error: {error.message}</p>}
 *       <button disabled={isSubmitting}>Submit</button>
 *     </form>
 *   );
 * }
 * ```
 */
export function useFeedback() {
  const { client } = useCensusContext();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [feedbackId, setFeedbackId] = useState<string | null>(null);

  const submitFeedback = useCallback(
    async (options: FeedbackOptions) => {
      setIsSubmitting(true);
      setIsSuccess(false);
      setError(null);
      setFeedbackId(null);

      try {
        const result = await client.submitFeedback(options);
        setFeedbackId(result.feedbackId);
        setIsSuccess(true);
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to submit feedback');
        setError(error);
        throw error;
      } finally {
        setIsSubmitting(false);
      }
    },
    [client]
  );

  const reset = useCallback(() => {
    setIsSuccess(false);
    setError(null);
    setFeedbackId(null);
  }, []);

  return {
    submitFeedback,
    reset,
    isSubmitting,
    isSuccess,
    error,
    feedbackId,
  };
}

/**
 * Hook for fetching articles from the knowledge base.
 *
 * @param options - Query options (optional)
 * @returns Object with articles data and loading state
 *
 * @example
 * ```tsx
 * function ArticleList() {
 *   const { articles, isLoading, error, refetch } = useArticles();
 *
 *   if (isLoading) return <p>Loading...</p>;
 *   if (error) return <p>Error: {error.message}</p>;
 *
 *   return (
 *     <ul>
 *       {articles.map(article => (
 *         <li key={article.id}>{article.title}</li>
 *       ))}
 *     </ul>
 *   );
 * }
 * ```
 */
export function useArticles(options?: ArticlesOptions) {
  const { client, isReady } = useCensusContext();
  const [data, setData] = useState<ArticlesResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchArticles = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await client.getArticles(options);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch articles'));
    } finally {
      setIsLoading(false);
    }
  }, [client, options?.category, options?.search, options?.limit, options?.offset]);

  useEffect(() => {
    if (isReady) {
      fetchArticles();
    }
  }, [isReady, fetchArticles]);

  return {
    articles: data?.articles || [],
    pagination: data?.pagination,
    isLoading,
    error,
    refetch: fetchArticles,
  };
}

/**
 * Hook for fetching a single article.
 *
 * @param slugOrId - Article slug or ID
 * @returns Object with article data and loading state
 *
 * @example
 * ```tsx
 * function ArticlePage({ slug }) {
 *   const { article, isLoading, error } = useArticle(slug);
 *
 *   if (isLoading) return <p>Loading...</p>;
 *   if (error) return <p>Error: {error.message}</p>;
 *   if (!article) return <p>Article not found</p>;
 *
 *   return (
 *     <article>
 *       <h1>{article.title}</h1>
 *       <div dangerouslySetInnerHTML={{ __html: article.content_html }} />
 *     </article>
 *   );
 * }
 * ```
 */
export function useArticle(slugOrId: string) {
  const { client, isReady } = useCensusContext();
  const [article, setArticle] = useState<Article | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchArticle = useCallback(async () => {
    if (!slugOrId) {
      setArticle(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await client.getArticle(slugOrId);
      setArticle(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch article'));
    } finally {
      setIsLoading(false);
    }
  }, [client, slugOrId]);

  useEffect(() => {
    if (isReady) {
      fetchArticle();
    }
  }, [isReady, fetchArticle]);

  return {
    article,
    isLoading,
    error,
    refetch: fetchArticle,
  };
}

/**
 * Hook for fetching the current user's submitted requests.
 *
 * @param options - Query options (optional)
 * @returns Object with requests data and loading state
 *
 * @example
 * ```tsx
 * function MyRequests() {
 *   const { requests, isLoading, error, refetch } = useRequests();
 *
 *   if (isLoading) return <p>Loading...</p>;
 *   if (error) return <p>Error: {error.message}</p>;
 *
 *   return (
 *     <ul>
 *       {requests.map(req => (
 *         <li key={req.id}>{req.message} - {req.status}</li>
 *       ))}
 *     </ul>
 *   );
 * }
 * ```
 */
export function useRequests(options?: RequestsOptions) {
  const { client, isReady, isIdentified } = useCensusContext();
  const [data, setData] = useState<RequestsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchRequests = useCallback(async () => {
    if (!isIdentified) {
      setData(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await client.getRequests(options);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch requests'));
    } finally {
      setIsLoading(false);
    }
  }, [client, isIdentified, options?.status, options?.type, options?.limit, options?.offset]);

  useEffect(() => {
    if (isReady && isIdentified) {
      fetchRequests();
    }
  }, [isReady, isIdentified, fetchRequests]);

  return {
    requests: data?.requests || [],
    pagination: data?.pagination,
    isLoading,
    error,
    refetch: fetchRequests,
  };
}

/**
 * Hook for tracking events.
 *
 * @returns Object with track function
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { track } = useTrack();
 *
 *   useEffect(() => {
 *     track('page_viewed', { page: 'home' });
 *   }, []);
 *
 *   return <div>...</div>;
 * }
 * ```
 */
export function useTrack() {
  const { client } = useCensusContext();

  const track = useCallback(
    async (eventType: string, properties?: Record<string, unknown>) => {
      await client.track(eventType, properties);
    },
    [client]
  );

  const trackBatch = useCallback(
    async (
      events: Array<{
        eventType: string;
        articleId?: string;
        featureId?: string;
        properties?: Record<string, unknown>;
      }>
    ) => {
      await client.trackBatch({ events });
    },
    [client]
  );

  return {
    track,
    trackBatch,
  };
}

// ============================================================================
// Guide Builder Hooks
// ============================================================================

/**
 * Hook for fetching guides.
 *
 * @param options - Query options (optional)
 * @returns Object with guides data and loading state
 *
 * @example
 * ```tsx
 * function GuidesList() {
 *   const { guides, isLoading, completedGuides } = useGuides({
 *     url: window.location.href,
 *   });
 *
 *   if (isLoading) return <p>Loading...</p>;
 *
 *   return (
 *     <ul>
 *       {guides.map(guide => (
 *         <li key={guide.id}>
 *           {guide.name}
 *           {completedGuides.includes(guide.id) && ' (completed)'}
 *         </li>
 *       ))}
 *     </ul>
 *   );
 * }
 * ```
 */
export function useGuides(options?: GuidesOptions) {
  const { client, isReady } = useCensusContext();
  const [data, setData] = useState<GuidesResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchGuides = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await client.getGuides(options);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch guides'));
    } finally {
      setIsLoading(false);
    }
  }, [client, options?.projectId, options?.url, options?.userId]);

  useEffect(() => {
    if (isReady) {
      fetchGuides();
    }
  }, [isReady, fetchGuides]);

  return {
    guides: data?.guides || [],
    completedGuides: data?.completedGuides || [],
    isLoading,
    error,
    refetch: fetchGuides,
  };
}

/**
 * Hook for the Guide Builder - manages creation and editing of guides.
 *
 * @returns Object with guide builder state and actions
 *
 * @example
 * ```tsx
 * function GuideBuilderUI() {
 *   const {
 *     guide,
 *     steps,
 *     isLoading,
 *     isSaving,
 *     createGuide,
 *     updateGuide,
 *     addStep,
 *     updateStep,
 *     deleteStep,
 *     reorderSteps,
 *     publishGuide,
 *   } = useGuideBuilder();
 *
 *   const handleCreateGuide = async () => {
 *     await createGuide({
 *       name: 'My Tour',
 *       slug: 'my-tour',
 *     });
 *   };
 *
 *   return (
 *     <div>
 *       <button onClick={handleCreateGuide} disabled={isSaving}>
 *         Create Guide
 *       </button>
 *       {guide && (
 *         <div>
 *           <h2>{guide.name}</h2>
 *           <p>{steps.length} steps</p>
 *         </div>
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */
export function useGuideBuilder() {
  const { client, isReady } = useCensusContext();
  const [guide, setGuide] = useState<Guide | null>(null);
  const [steps, setSteps] = useState<GuideStep[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);

  // Track unsaved changes
  const hasUnsavedChanges = useRef(false);

  // Load a guide by ID
  const loadGuide = useCallback(
    async (guideId: string) => {
      setIsLoading(true);
      setError(null);

      try {
        const loadedGuide = await client.getGuide(guideId);
        if (loadedGuide) {
          setGuide(loadedGuide);
          setSteps(loadedGuide.guide_steps || []);
          setSelectedStepId(loadedGuide.guide_steps?.[0]?.id || null);
        }
        return loadedGuide;
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to load guide'));
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [client]
  );

  // Create a new guide
  const createGuide = useCallback(
    async (options: CreateGuideOptions) => {
      setIsSaving(true);
      setError(null);

      try {
        const newGuide = await client.createGuide(options);
        setGuide(newGuide);
        setSteps([]);
        setSelectedStepId(null);
        return newGuide;
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to create guide'));
        throw err;
      } finally {
        setIsSaving(false);
      }
    },
    [client]
  );

  // Update current guide
  const updateGuide = useCallback(
    async (options: UpdateGuideOptions) => {
      if (!guide) throw new Error('No guide loaded');

      setIsSaving(true);
      setError(null);

      try {
        const updatedGuide = await client.updateGuide(guide.id, options);
        setGuide(updatedGuide);
        hasUnsavedChanges.current = false;
        return updatedGuide;
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to update guide'));
        throw err;
      } finally {
        setIsSaving(false);
      }
    },
    [client, guide]
  );

  // Publish the guide
  const publishGuide = useCallback(async () => {
    return updateGuide({ status: 'published' });
  }, [updateGuide]);

  // Unpublish the guide
  const unpublishGuide = useCallback(async () => {
    return updateGuide({ status: 'draft' });
  }, [updateGuide]);

  // Delete the guide
  const deleteGuide = useCallback(async () => {
    if (!guide) throw new Error('No guide loaded');

    setIsSaving(true);
    setError(null);

    try {
      await client.deleteGuide(guide.id);
      setGuide(null);
      setSteps([]);
      setSelectedStepId(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to delete guide'));
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, [client, guide]);

  // Add a step
  const addStep = useCallback(
    async (options: CreateGuideStepOptions) => {
      if (!guide) throw new Error('No guide loaded');

      setIsSaving(true);
      setError(null);

      try {
        const newStep = await client.addGuideStep(guide.id, options);
        setSteps((prev) => [...prev, newStep]);
        setSelectedStepId(newStep.id);
        hasUnsavedChanges.current = true;
        return newStep;
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to add step'));
        throw err;
      } finally {
        setIsSaving(false);
      }
    },
    [client, guide]
  );

  // Update a step
  const updateStep = useCallback(
    async (stepId: string, options: UpdateGuideStepOptions) => {
      if (!guide) throw new Error('No guide loaded');

      setIsSaving(true);
      setError(null);

      try {
        const updatedStep = await client.updateGuideStep(guide.id, stepId, options);
        setSteps((prev) =>
          prev.map((step) => (step.id === stepId ? updatedStep : step))
        );
        hasUnsavedChanges.current = true;
        return updatedStep;
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to update step'));
        throw err;
      } finally {
        setIsSaving(false);
      }
    },
    [client, guide]
  );

  // Delete a step
  const deleteStep = useCallback(
    async (stepId: string) => {
      if (!guide) throw new Error('No guide loaded');

      setIsSaving(true);
      setError(null);

      try {
        await client.deleteGuideStep(guide.id, stepId);
        setSteps((prev) => prev.filter((step) => step.id !== stepId));
        if (selectedStepId === stepId) {
          setSelectedStepId(steps[0]?.id || null);
        }
        hasUnsavedChanges.current = true;
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to delete step'));
        throw err;
      } finally {
        setIsSaving(false);
      }
    },
    [client, guide, selectedStepId, steps]
  );

  // Reorder steps
  const reorderSteps = useCallback(
    async (newOrder: Array<{ id: string; sort_order: number }>) => {
      if (!guide) throw new Error('No guide loaded');

      setIsSaving(true);
      setError(null);

      try {
        const reorderedSteps = await client.reorderGuideSteps(guide.id, newOrder);
        setSteps(reorderedSteps);
        hasUnsavedChanges.current = true;
        return reorderedSteps;
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to reorder steps'));
        throw err;
      } finally {
        setIsSaving(false);
      }
    },
    [client, guide]
  );

  // Move step up/down helpers
  const moveStepUp = useCallback(
    async (stepId: string) => {
      const currentIndex = steps.findIndex((s) => s.id === stepId);
      if (currentIndex <= 0) return;

      const newOrder = steps.map((step, index) => {
        if (index === currentIndex) {
          return { id: step.id, sort_order: currentIndex - 1 };
        }
        if (index === currentIndex - 1) {
          return { id: step.id, sort_order: currentIndex };
        }
        return { id: step.id, sort_order: index };
      });

      return reorderSteps(newOrder);
    },
    [steps, reorderSteps]
  );

  const moveStepDown = useCallback(
    async (stepId: string) => {
      const currentIndex = steps.findIndex((s) => s.id === stepId);
      if (currentIndex < 0 || currentIndex >= steps.length - 1) return;

      const newOrder = steps.map((step, index) => {
        if (index === currentIndex) {
          return { id: step.id, sort_order: currentIndex + 1 };
        }
        if (index === currentIndex + 1) {
          return { id: step.id, sort_order: currentIndex };
        }
        return { id: step.id, sort_order: index };
      });

      return reorderSteps(newOrder);
    },
    [steps, reorderSteps]
  );

  // Get selected step
  const selectedStep = selectedStepId
    ? steps.find((s) => s.id === selectedStepId) || null
    : null;

  // Reset state
  const reset = useCallback(() => {
    setGuide(null);
    setSteps([]);
    setSelectedStepId(null);
    setError(null);
    hasUnsavedChanges.current = false;
  }, []);

  return {
    // State
    guide,
    steps,
    selectedStep,
    selectedStepId,
    isLoading,
    isSaving,
    error,
    isReady,
    hasUnsavedChanges: hasUnsavedChanges.current,

    // Actions
    loadGuide,
    createGuide,
    updateGuide,
    publishGuide,
    unpublishGuide,
    deleteGuide,
    addStep,
    updateStep,
    deleteStep,
    reorderSteps,
    moveStepUp,
    moveStepDown,
    setSelectedStepId,
    reset,
  };
}

/**
 * Hook for rendering guides - manages playback state for the GuideRenderer.
 *
 * @returns Object with guide renderer state and controls
 *
 * @example
 * ```tsx
 * function GuidePlayer() {
 *   const {
 *     activeGuide,
 *     currentStepIndex,
 *     isPlaying,
 *     startGuide,
 *     nextStep,
 *     prevStep,
 *     dismiss,
 *   } = useGuideRenderer();
 *
 *   if (!activeGuide || !isPlaying) return null;
 *
 *   return (
 *     <GuideRenderer
 *       guide={activeGuide}
 *       onComplete={() => dismiss()}
 *       onDismiss={() => dismiss()}
 *     />
 *   );
 * }
 * ```
 */
export function useGuideRenderer() {
  const { client, isReady } = useCensusContext();
  const [activeGuide, setActiveGuide] = useState<Guide | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [completedGuideIds, setCompletedGuideIds] = useState<string[]>([]);
  const [dismissedGuideIds, setDismissedGuideIds] = useState<string[]>([]);

  // Start a guide
  const startGuide = useCallback((guide: Guide, startStep: number = 0) => {
    setActiveGuide(guide);
    setCurrentStepIndex(startStep);
    setIsPlaying(true);
  }, []);

  // Go to next step
  const nextStep = useCallback(() => {
    if (!activeGuide) return;

    const steps = activeGuide.guide_steps || [];
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      // Guide completed
      setCompletedGuideIds((prev) => [...prev, activeGuide.id]);
      setIsPlaying(false);
      setActiveGuide(null);
    }
  }, [activeGuide, currentStepIndex]);

  // Go to previous step
  const prevStep = useCallback(() => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  }, [currentStepIndex]);

  // Go to a specific step
  const goToStep = useCallback((stepIndex: number) => {
    if (!activeGuide) return;

    const steps = activeGuide.guide_steps || [];
    if (stepIndex >= 0 && stepIndex < steps.length) {
      setCurrentStepIndex(stepIndex);
    }
  }, [activeGuide]);

  // Dismiss the guide
  const dismiss = useCallback(() => {
    if (activeGuide) {
      setDismissedGuideIds((prev) => [...prev, activeGuide.id]);
    }
    setIsPlaying(false);
    setActiveGuide(null);
    setCurrentStepIndex(0);
  }, [activeGuide]);

  // Pause playback
  const pause = useCallback(() => {
    setIsPlaying(false);
  }, []);

  // Resume playback
  const resume = useCallback(() => {
    if (activeGuide) {
      setIsPlaying(true);
    }
  }, [activeGuide]);

  // Track step view event
  const trackStepView = useCallback(
    async (guide: Guide, stepIndex: number) => {
      const step = guide.guide_steps?.[stepIndex];
      if (!step) return;

      try {
        await client.track('guide_step_viewed', {
          guide_id: guide.id,
          guide_name: guide.name,
          step_id: step.id,
          step_index: stepIndex,
          step_type: step.step_type,
        });
      } catch {
        // Silently fail analytics
      }
    },
    [client]
  );

  // Track guide completion event
  const trackGuideComplete = useCallback(
    async (guide: Guide) => {
      try {
        await client.track('guide_completed', {
          guide_id: guide.id,
          guide_name: guide.name,
          total_steps: guide.guide_steps?.length || 0,
        });
      } catch {
        // Silently fail analytics
      }
    },
    [client]
  );

  // Track guide dismiss event
  const trackGuideDismiss = useCallback(
    async (guide: Guide, stepIndex: number) => {
      try {
        await client.track('guide_dismissed', {
          guide_id: guide.id,
          guide_name: guide.name,
          dismissed_at_step: stepIndex,
          total_steps: guide.guide_steps?.length || 0,
        });
      } catch {
        // Silently fail analytics
      }
    },
    [client]
  );

  // Get current step
  const currentStep = activeGuide?.guide_steps?.[currentStepIndex] || null;
  const totalSteps = activeGuide?.guide_steps?.length || 0;
  const isLastStep = currentStepIndex === totalSteps - 1;
  const isFirstStep = currentStepIndex === 0;

  // Check if a guide has been completed or dismissed
  const isGuideCompleted = useCallback(
    (guideId: string) => completedGuideIds.includes(guideId),
    [completedGuideIds]
  );

  const isGuideDismissed = useCallback(
    (guideId: string) => dismissedGuideIds.includes(guideId),
    [dismissedGuideIds]
  );

  return {
    // State
    activeGuide,
    currentStep,
    currentStepIndex,
    totalSteps,
    isPlaying,
    isFirstStep,
    isLastStep,
    isReady,

    // Controls
    startGuide,
    nextStep,
    prevStep,
    goToStep,
    dismiss,
    pause,
    resume,

    // Tracking
    trackStepView,
    trackGuideComplete,
    trackGuideDismiss,

    // Status
    completedGuideIds,
    dismissedGuideIds,
    isGuideCompleted,
    isGuideDismissed,
  };
}
