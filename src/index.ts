/**
 * @census-ai/census-sdk - Official Census SDK
 *
 * Integrate feedback collection, knowledge base, and analytics
 * into your application.
 *
 * @example
 * ```typescript
 * import { createCensus } from '@census-ai/census-sdk';
 *
 * const census = createCensus({ apiKey: 'cs_live_xxx' });
 *
 * // Identify users
 * await census.identify({
 *   userId: 'user_123',
 *   email: 'user@example.com',
 * });
 *
 * // Submit feedback
 * await census.submitFeedback({
 *   type: 'bug_report',
 *   message: 'Something went wrong',
 * });
 *
 * // Get knowledge base articles
 * const { articles } = await census.getArticles();
 *
 * // Track events
 * await census.track('button_clicked', { buttonId: 'cta' });
 * ```
 *
 * For React applications, use the React integration:
 *
 * @example
 * ```typescript
 * import { CensusProvider, useFeedback, FeedbackButton } from '@census-ai/census-sdk/react';
 *
 * function App() {
 *   return (
 *     <CensusProvider apiKey="cs_live_xxx">
 *       <YourApp />
 *       <FeedbackButton position="bottom-right" />
 *     </CensusProvider>
 *   );
 * }
 * ```
 */

// Core exports
export { createCensus, CensusClient } from './client';

// Type exports
export type {
  CensusConfig,
  UserIdentity,
  FeedbackType,
  FeedbackOptions,
  Article,
  ArticlesOptions,
  ArticlesResponse,
  Request,
  RequestsOptions,
  RequestsResponse,
  TrackEventOptions,
  BatchEventsOptions,
  CensusError,
  Position,
  CensusTheme,
  FeedbackButtonProps,
  KnowledgeBaseProps,
  RequestsProps,
  CensusProviderProps,
} from './types';
