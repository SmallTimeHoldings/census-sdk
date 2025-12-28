/**
 * Configuration options for the Census SDK
 */
export interface CensusConfig {
  /**
   * Your Census API key (starts with cs_live_ or cs_test_)
   */
  apiKey: string;

  /**
   * Base URL for the Census API
   * @default "https://api.census.ai" or your custom domain
   */
  baseUrl?: string;

  /**
   * Enable debug logging
   * @default false
   */
  debug?: boolean;
}

/**
 * User identity information for SDK tracking
 */
export interface UserIdentity {
  /**
   * Unique identifier for the user in your system
   */
  userId: string;

  /**
   * User's email address
   */
  email?: string;

  /**
   * User's display name
   */
  name?: string;

  /**
   * URL to user's avatar image
   */
  avatarUrl?: string;

  /**
   * Additional custom properties for the user
   */
  metadata?: Record<string, unknown>;

  /**
   * Organization ID if the user belongs to an organization
   */
  organizationId?: string;

  /**
   * Organization name
   */
  organizationName?: string;

  /**
   * Organization's domain
   */
  organizationDomain?: string;

  /**
   * Organization's plan/tier
   */
  organizationPlan?: string;
}

/**
 * Feedback submission types
 */
export type FeedbackType = 'feedback' | 'bug_report' | 'feature_request' | 'article_rating';

/**
 * Options for submitting feedback
 */
export interface FeedbackOptions {
  /**
   * Type of feedback being submitted
   */
  type: FeedbackType;

  /**
   * Feedback message content
   */
  message?: string;

  /**
   * Rating (1-5) for article ratings
   */
  rating?: number;

  /**
   * Whether the content was helpful (for article ratings)
   */
  helpful?: boolean;

  /**
   * Article ID if rating a specific article
   */
  articleId?: string;

  /**
   * Additional metadata
   */
  metadata?: Record<string, unknown>;
}

/**
 * Article from the knowledge base
 */
export interface Article {
  id: string;
  title: string;
  slug: string;
  seo_description: string | null;
  category: string | null;
  read_time_minutes: number | null;
  published_at: string | null;
  sort_order: number;
  content?: unknown;
  content_html?: string;
  features?: {
    id: string;
    name: string;
    slug: string;
  };
}

/**
 * Options for fetching articles
 */
export interface ArticlesOptions {
  /**
   * Filter by category
   */
  category?: string;

  /**
   * Search query
   */
  search?: string;

  /**
   * Maximum number of articles to return
   * @default 50
   */
  limit?: number;

  /**
   * Offset for pagination
   * @default 0
   */
  offset?: number;
}

/**
 * Response from articles list endpoint
 */
export interface ArticlesResponse {
  articles: Article[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

/**
 * Options for tracking events
 */
export interface TrackEventOptions {
  /**
   * Event type/name
   */
  eventType: string;

  /**
   * Related article ID
   */
  articleId?: string;

  /**
   * Related feature ID
   */
  featureId?: string;

  /**
   * Additional event properties
   */
  properties?: Record<string, unknown>;
}

/**
 * Batch event tracking
 */
export interface BatchEventsOptions {
  events: TrackEventOptions[];
}

/**
 * A user's submitted request (feedback, bug report, feature request)
 */
export interface Request {
  id: string;
  feedback_type: FeedbackType;
  message: string | null;
  status: 'new' | 'reviewed' | 'in_progress' | 'resolved' | 'closed';
  created_at: string;
  page_url: string | null;
  rating: number | null;
  helpful: boolean | null;
  metadata: Record<string, unknown>;
}

/**
 * Options for fetching requests
 */
export interface RequestsOptions {
  /**
   * Filter by status
   */
  status?: 'new' | 'reviewed' | 'in_progress' | 'resolved' | 'closed';

  /**
   * Filter by feedback type
   */
  type?: FeedbackType;

  /**
   * Maximum number of requests to return
   * @default 50
   */
  limit?: number;

  /**
   * Offset for pagination
   * @default 0
   */
  offset?: number;
}

/**
 * Response from requests list endpoint
 */
export interface RequestsResponse {
  requests: Request[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

/**
 * API error response
 */
export interface CensusError {
  error: string;
  status?: number;
}

/**
 * Position for floating UI elements
 */
export type Position = 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';

/**
 * Theme configuration for embedded components
 */
export interface CensusTheme {
  /**
   * Primary brand color
   */
  primaryColor?: string;

  /**
   * Text color
   */
  textColor?: string;

  /**
   * Background color
   */
  backgroundColor?: string;

  /**
   * Border radius for buttons and cards
   */
  borderRadius?: string;

  /**
   * Font family
   */
  fontFamily?: string;
}

/**
 * Props for the FeedbackButton component
 */
export interface FeedbackButtonProps {
  /**
   * Position of the floating button
   * @default "bottom-right"
   */
  position?: Position;

  /**
   * Custom button text
   * @default "Feedback"
   */
  text?: string;

  /**
   * Types of feedback to allow
   * @default ["feedback", "bug_report", "feature_request"]
   */
  allowedTypes?: FeedbackType[];

  /**
   * Theme customization
   */
  theme?: CensusTheme;

  /**
   * Callback when feedback is submitted
   */
  onSubmit?: (feedback: FeedbackOptions) => void;

  /**
   * Callback when feedback submission fails
   */
  onError?: (error: Error) => void;

  /**
   * Custom trigger element (replaces default button)
   */
  children?: React.ReactNode;
}

/**
 * Props for the KnowledgeBase component
 */
export interface KnowledgeBaseProps {
  /**
   * Display mode
   * @default "embedded"
   */
  mode?: 'embedded' | 'modal' | 'sidebar';

  /**
   * Show search bar
   * @default true
   */
  showSearch?: boolean;

  /**
   * Show categories
   * @default true
   */
  showCategories?: boolean;

  /**
   * Default category to show
   */
  defaultCategory?: string;

  /**
   * Theme customization
   */
  theme?: CensusTheme;

  /**
   * Custom CSS class
   */
  className?: string;

  /**
   * Callback when an article is viewed
   */
  onArticleView?: (article: Article) => void;
}

/**
 * Props for the Requests component
 */
export interface RequestsProps {
  /**
   * Show only requests with specific status
   */
  status?: 'new' | 'reviewed' | 'in_progress' | 'resolved' | 'closed';

  /**
   * Show only specific feedback types
   */
  type?: FeedbackType;

  /**
   * Maximum requests to show
   * @default 50
   */
  limit?: number;

  /**
   * Theme customization
   */
  theme?: CensusTheme;

  /**
   * Custom CSS class
   */
  className?: string;

  /**
   * Show empty state when no requests
   * @default true
   */
  showEmptyState?: boolean;

  /**
   * Callback when a request is clicked
   */
  onRequestClick?: (request: Request) => void;
}

/**
 * Props for the CensusProvider component
 */
export interface CensusProviderProps {
  /**
   * Your Census API key
   */
  apiKey: string;

  /**
   * Base URL for the API
   */
  baseUrl?: string;

  /**
   * Enable debug mode
   */
  debug?: boolean;

  /**
   * Automatically identify user on mount
   */
  user?: UserIdentity;

  /**
   * Theme customization for all components
   */
  theme?: CensusTheme;

  /**
   * Children components
   */
  children: React.ReactNode;
}
