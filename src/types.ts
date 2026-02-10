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
   * Project ID to scope all requests to
   */
  projectId?: string;

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
  content?: string;
  content_html?: string;
  features?: {
    id: string;
    name: string;
    slug: string;
  };
}

// ============================================================================
// Feature Groups types (for HelpCenter navigation)
// ============================================================================

/**
 * A feature within a feature group
 */
export interface Feature {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  status: string;
  article_count: number;
}

/**
 * A feature group containing features
 */
export interface FeatureGroup {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  color: string | null;
  features: Feature[];
  feature_count: number;
  article_count: number;
}

/**
 * Response from feature groups endpoint
 */
export interface FeatureGroupsResponse {
  feature_groups: FeatureGroup[];
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
 * Feature group tag on a request
 */
export interface RequestFeatureGroup {
  id: string;
  name: string;
  color: string | null;
}

/**
 * Feature tag on a request
 */
export interface RequestFeature {
  id: string;
  name: string;
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
  feature_group: RequestFeatureGroup | null;
  feature: RequestFeature | null;
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

// ============================================================================
// Guide Builder types
// ============================================================================

/**
 * Step types for guides
 */
export type GuideStepType = 'tooltip' | 'modal' | 'slideout' | 'hotspot' | 'banner' | 'embedded';

/**
 * Position options for embedded guides
 */
export type EmbeddedPosition = 'prepend' | 'append' | 'replace';

/**
 * Tooltip position options
 */
export type TooltipPosition = 'auto' | 'top' | 'bottom' | 'left' | 'right';

/**
 * Step advancement trigger types
 */
export type AdvanceTrigger = 'button' | 'click' | 'delay' | 'form-submit';

/**
 * Form types for guide steps
 */
export type GuideFormType = 'nps' | 'rating' | 'text' | 'select' | 'multi-select';

/**
 * Rich content for guide steps
 */
export interface GuideStepRichContent {
  title?: string;
  body?: string;
  media?: {
    type: 'image' | 'video';
    url: string;
    alt?: string;
  };
  buttons?: Array<{
    label: string;
    action: 'next' | 'prev' | 'dismiss' | 'url' | 'custom';
    url?: string;
    customAction?: string;
    style?: 'primary' | 'secondary' | 'text';
  }>;
  form?: {
    type: GuideFormType;
    question: string;
    options?: string[];
    required?: boolean;
    submitLabel?: string;
  };
}

/**
 * Display configuration for guide steps
 */
export interface GuideStepDisplayConfig {
  position?: TooltipPosition | 'center';
  offset?: { x: number; y: number };
  width?: number;
  backdrop?: boolean;
  spotlightPadding?: number;
  bannerPosition?: 'top' | 'bottom';
  embeddedPosition?: EmbeddedPosition;
}

/**
 * Advancement configuration for guide steps
 */
export interface GuideStepAdvanceConfig {
  trigger: AdvanceTrigger;
  delay?: number;
  clickSelector?: string;
}

/**
 * Style configuration for guide steps
 */
export interface GuideStepStyleConfig {
  backgroundColor?: string;
  textColor?: string;
  accentColor?: string;
  borderRadius?: number;
  customCSS?: string;
}

/**
 * Selector strategy for targeting elements
 */
export interface SelectorStrategy {
  css?: string;
  xpath?: string;
  text?: string;
  testId?: string;
}

/**
 * Guide step definition
 */
export interface GuideStep {
  id: string;
  guide_id?: string;
  sort_order: number;
  step_type: GuideStepType;
  selector_strategy: SelectorStrategy | null;
  title: string | null;
  content: string | null;
  tooltip_position: TooltipPosition;
  actions: Array<Record<string, unknown>>;
  wait_for: 'click' | 'next_button' | 'delay' | 'custom';
  wait_config: Record<string, unknown>;
  rich_content: GuideStepRichContent;
  display_config: GuideStepDisplayConfig;
  advance_config: GuideStepAdvanceConfig;
  style_config: GuideStepStyleConfig;
  created_at?: string;
  updated_at?: string;
}

/**
 * Guide trigger types
 */
export type GuideTriggerType = 'manual' | 'url_match' | 'first_visit' | 'event';

/**
 * Guide status
 */
export type GuideStatus = 'draft' | 'published' | 'archived';

/**
 * Guide definition
 */
export interface Guide {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  trigger_type: GuideTriggerType;
  trigger_config: Record<string, unknown>;
  theme: Record<string, unknown>;
  allow_skip: boolean;
  show_progress: boolean;
  status?: GuideStatus;
  published_at?: string | null;
  created_at?: string;
  updated_at?: string;
  guide_steps: GuideStep[];
}

/**
 * Options for creating a guide
 */
export interface CreateGuideOptions {
  /**
   * Name of the guide
   */
  name: string;

  /**
   * URL-friendly slug (lowercase, hyphens only)
   */
  slug: string;

  /**
   * Description of the guide
   */
  description?: string;

  /**
   * Project ID to associate with
   */
  projectId?: string;

  /**
   * When to trigger the guide
   * @default "manual"
   */
  triggerType?: GuideTriggerType;

  /**
   * Configuration for the trigger (e.g., url_pattern for url_match)
   */
  triggerConfig?: Record<string, unknown>;

  /**
   * Theme customization
   */
  theme?: Record<string, unknown>;

  /**
   * Allow users to skip the guide
   * @default true
   */
  allowSkip?: boolean;

  /**
   * Show progress indicator
   * @default true
   */
  showProgress?: boolean;
}

/**
 * Options for updating a guide
 */
export interface UpdateGuideOptions {
  name?: string;
  slug?: string;
  description?: string;
  triggerType?: GuideTriggerType;
  triggerConfig?: Record<string, unknown>;
  theme?: Record<string, unknown>;
  allowSkip?: boolean;
  showProgress?: boolean;
  status?: GuideStatus;
}

/**
 * Options for creating a guide step
 */
export interface CreateGuideStepOptions {
  /**
   * Type of step
   * @default "tooltip"
   */
  stepType?: GuideStepType;

  /**
   * Order position (auto-assigned if not provided)
   */
  sortOrder?: number;

  /**
   * Element selector strategy
   */
  selectorStrategy?: SelectorStrategy;

  /**
   * Simple title (legacy, use richContent.title instead)
   */
  title?: string;

  /**
   * Simple content (legacy, use richContent.body instead)
   */
  content?: string;

  /**
   * Tooltip position
   * @default "auto"
   */
  tooltipPosition?: TooltipPosition;

  /**
   * Rich content configuration
   */
  richContent?: GuideStepRichContent;

  /**
   * Display configuration
   */
  displayConfig?: GuideStepDisplayConfig;

  /**
   * Advancement configuration
   */
  advanceConfig?: GuideStepAdvanceConfig;

  /**
   * Style overrides
   */
  styleConfig?: GuideStepStyleConfig;
}

/**
 * Options for updating a guide step
 */
export interface UpdateGuideStepOptions extends Partial<CreateGuideStepOptions> {
  // Same as create but all optional
}

/**
 * Options for fetching guides
 */
export interface GuidesOptions {
  /**
   * Filter by project ID
   */
  projectId?: string;

  /**
   * Current page URL (for trigger matching)
   */
  url?: string;

  /**
   * User ID (to get completion status)
   */
  userId?: string;
}

/**
 * Response from guides list endpoint
 */
export interface GuidesResponse {
  guides: Guide[];
  completedGuides: string[];
}

// ============================================================================
// Server-side sync types
// ============================================================================

/**
 * Extended user data for server-side sync (includes subscription/activity fields)
 */
export interface SyncUserData extends UserIdentity {
  /**
   * User's plan name (e.g., "Pro", "Enterprise")
   */
  planName?: string;

  /**
   * Current subscription status
   */
  subscriptionStatus?: 'active' | 'canceled' | 'trial' | 'past_due' | 'paused' | 'free';

  /**
   * Billing cycle frequency
   */
  billingCycle?: 'monthly' | 'yearly' | 'quarterly' | 'lifetime' | 'custom';

  /**
   * Monthly recurring revenue in cents (e.g., 9900 = $99.00)
   */
  mrr?: number;

  /**
   * When the subscription started
   */
  subscriptionStartedAt?: string | Date;

  /**
   * When the subscription ends (for canceled subscriptions)
   */
  subscriptionEndsAt?: string | Date;

  /**
   * When the trial period ends
   */
  trialEndsAt?: string | Date;

  /**
   * When the user first signed up
   */
  signupAt?: string | Date;

  /**
   * Total number of logins
   */
  loginCount?: number;

  /**
   * Last login timestamp
   */
  lastLoginAt?: string | Date;
}

/**
 * Options for bulk sync operations
 */
export interface SyncUsersOptions {
  /**
   * How to handle existing users
   * - 'update': Update existing users with new data (default)
   * - 'skip': Skip existing users
   */
  onConflict?: 'update' | 'skip';

  /**
   * Batch size for processing (default: 100, max: 100)
   */
  batchSize?: number;
}

/**
 * Result from sync operations
 */
export interface SyncResult {
  success: boolean;
  userId?: string;
}

/**
 * Result from bulk sync operation
 */
export interface SyncUsersResult {
  success: boolean;
  created: number;
  updated: number;
  skipped: number;
  failed: number;
  errors?: Array<{
    userId: string;
    error: string;
  }>;
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
 * Available tabs in the HelpCenter component
 */
export type HelpCenterTab = 'articles' | 'requests';

/**
 * Props for the HelpCenter component
 */
export interface HelpCenterProps {
  /**
   * Which tabs to show. Order determines tab order.
   * @default ['articles', 'requests']
   *
   * @example
   * // Show both tabs
   * tabs={['articles', 'requests']}
   *
   * // Articles only (e.g., documentation page)
   * tabs={['articles']}
   *
   * // Requests only (e.g., feedback page)
   * tabs={['requests']}
   */
  tabs?: HelpCenterTab[];

  /**
   * Default tab to show on load
   * @default First tab in the tabs array
   */
  defaultTab?: HelpCenterTab;

  /**
   * Custom labels for tabs
   * @default { articles: 'Articles', requests: 'My Requests' }
   */
  tabLabels?: Partial<Record<HelpCenterTab, string>>;

  /**
   * Show search bar in articles tab
   * @default true
   */
  showSearch?: boolean;

  /**
   * Show category filters in articles tab
   * @default true
   */
  showCategories?: boolean;

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

  /**
   * Callback when a request is clicked
   */
  onRequestClick?: (request: Request) => void;

  /**
   * Callback when the active tab changes
   */
  onTabChange?: (tab: HelpCenterTab) => void;
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
   * Project ID to scope all requests to
   */
  projectId?: string;

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

// ============================================
// Guide Analytics Types (for tracking)
// ============================================

export type GuideEventType =
  | 'started'
  | 'step_viewed'
  | 'step_completed'
  | 'completed'
  | 'skipped'
  | 'dismissed';

export interface GuideAnalyticsEvent {
  guideId: string;
  eventType: GuideEventType;
  stepId?: string;
  stepIndex?: number;
  pageUrl?: string;
  sessionId: string;
  userId?: string;
  metadata?: Record<string, unknown>;
}
