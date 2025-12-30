import { useState, useCallback, useEffect } from 'react';
import { useCensusContext } from './context';
import type {
  FeedbackOptions,
  ArticlesOptions,
  ArticlesResponse,
  Article,
  RequestsOptions,
  RequestsResponse,
  RequestsSettings,
  FeatureGroup,
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

const defaultSettings: RequestsSettings = {
  feedbackVisibility: 'own',
  allowVoting: false,
  allowRequestCreation: true,
};

/**
 * Hook for fetching the current user's submitted requests.
 *
 * @param options - Query options (optional)
 * @returns Object with requests data and loading state
 *
 * @example
 * ```tsx
 * function MyRequests() {
 *   const { requests, isLoading, error, refetch, settings } = useRequests();
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
    if (isReady) {
      if (isIdentified) {
        fetchRequests();
      } else {
        // Not identified - stop loading
        setIsLoading(false);
      }
    }
  }, [isReady, isIdentified, fetchRequests]);

  return {
    requests: data?.requests || [],
    pagination: data?.pagination,
    settings: data?.settings || defaultSettings,
    isLoading,
    error,
    refetch: fetchRequests,
  };
}

/**
 * Hook for voting on requests.
 *
 * @returns Object with vote function and loading state
 *
 * @example
 * ```tsx
 * function VoteButton({ feedbackId }: { feedbackId: string }) {
 *   const { vote, isVoting } = useVote();
 *
 *   const handleVote = async () => {
 *     const result = await vote(feedbackId);
 *     console.log('Voted:', result.action); // 'added' or 'removed'
 *   };
 *
 *   return (
 *     <button onClick={handleVote} disabled={isVoting}>
 *       Vote
 *     </button>
 *   );
 * }
 * ```
 */
export function useVote() {
  const { client } = useCensusContext();
  const [isVoting, setIsVoting] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const vote = useCallback(
    async (feedbackId: string) => {
      setIsVoting(true);
      setError(null);

      try {
        const result = await client.vote(feedbackId);
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to vote');
        setError(error);
        throw error;
      } finally {
        setIsVoting(false);
      }
    },
    [client]
  );

  return {
    vote,
    isVoting,
    error,
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

/**
 * Hook for fetching feature groups with their features.
 *
 * @returns Object with feature groups data and loading state
 *
 * @example
 * ```tsx
 * function FeatureNav() {
 *   const { featureGroups, isLoading, error } = useFeatureGroups();
 *
 *   if (isLoading) return <p>Loading...</p>;
 *   if (error) return <p>Error: {error.message}</p>;
 *
 *   return (
 *     <ul>
 *       {featureGroups.map(group => (
 *         <li key={group.id}>
 *           {group.name} ({group.feature_count} features)
 *         </li>
 *       ))}
 *     </ul>
 *   );
 * }
 * ```
 */
export function useFeatureGroups() {
  const { client, isReady } = useCensusContext();
  const [featureGroups, setFeatureGroups] = useState<FeatureGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchFeatureGroups = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await client.getFeatureGroups();
      setFeatureGroups(result.feature_groups);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch feature groups'));
    } finally {
      setIsLoading(false);
    }
  }, [client]);

  useEffect(() => {
    if (isReady) {
      fetchFeatureGroups();
    }
  }, [isReady, fetchFeatureGroups]);

  return {
    featureGroups,
    isLoading,
    error,
    refetch: fetchFeatureGroups,
  };
}
