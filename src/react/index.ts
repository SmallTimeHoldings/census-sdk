/**
 * @census-ai/census-sdk/react - React integration for Census SDK
 *
 * Provides React components and hooks for integrating Census
 * into your React application.
 *
 * @example
 * ```tsx
 * import {
 *   CensusProvider,
 *   FeedbackButton,
 *   KnowledgeBase,
 *   useFeedback,
 *   useArticles,
 * } from '@census-ai/census-sdk/react';
 *
 * function App() {
 *   return (
 *     <CensusProvider
 *       apiKey="cs_live_xxx"
 *       user={{ userId: 'user_123', email: 'user@example.com' }}
 *     >
 *       <YourApp />
 *       <FeedbackButton position="bottom-right" />
 *     </CensusProvider>
 *   );
 * }
 *
 * function HelpPage() {
 *   return <KnowledgeBase showSearch showCategories />;
 * }
 *
 * function CustomFeedbackForm() {
 *   const { submitFeedback, isSubmitting, isSuccess } = useFeedback();
 *   // Custom implementation...
 * }
 * ```
 */

// Context and Provider
export { CensusProvider, useCensus, useCensusContext, useIdentify } from './context';

// Hooks
export { useFeedback, useArticles, useArticle, useRequests, useTrack } from './hooks';

// Components
export { FeedbackButton } from './components/FeedbackButton';
export { KnowledgeBase } from './components/KnowledgeBase';
export { Requests } from './components/Requests';

// Re-export types that are commonly used with React
export type {
  CensusProviderProps,
  FeedbackButtonProps,
  KnowledgeBaseProps,
  RequestsProps,
  UserIdentity,
  FeedbackType,
  FeedbackOptions,
  Article,
  ArticlesOptions,
  Request,
  RequestsOptions,
  CensusTheme,
  Position,
} from '../types';
