import type {
  CensusConfig,
  UserIdentity,
  FeedbackOptions,
  ArticlesOptions,
  ArticlesResponse,
  Article,
  RequestsOptions,
  RequestsResponse,
  BatchEventsOptions,
  CensusError,
  Guide,
  GuidesResponse,
  GuideAnalyticsEvent,
} from './types';

/**
 * Default API base URL
 */
const DEFAULT_BASE_URL = 'https://api.census.ai';

/**
 * Census SDK Client
 *
 * The main client for interacting with the Census API.
 * Use `createCensus()` to create an instance.
 *
 * @example
 * ```typescript
 * import { createCensus } from '@census-ai/census-sdk';
 *
 * const census = createCensus({ apiKey: 'cs_live_xxx' });
 *
 * await census.identify({ userId: 'user_123', email: 'user@example.com' });
 * await census.submitFeedback({ type: 'bug_report', message: 'Button is broken' });
 * ```
 */
export class CensusClient {
  private apiKey: string;
  private baseUrl: string;
  private debug: boolean;
  private currentUserId: string | null = null;

  constructor(config: CensusConfig) {
    if (!config.apiKey) {
      throw new Error('Census: apiKey is required');
    }

    // Support both new (cs_) and legacy (op_) key prefixes
    const validPrefixes = ['cs_live_', 'cs_test_', 'op_live_', 'op_test_'];
    if (!validPrefixes.some(prefix => config.apiKey.startsWith(prefix))) {
      console.warn('Census: API key should start with "cs_live_" or "cs_test_"');
    }

    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || DEFAULT_BASE_URL;
    this.debug = config.debug || false;

    this.log('Initialized with base URL:', this.baseUrl);
  }

  /**
   * Identify a user for tracking purposes.
   * Call this when a user logs in or when you have user information.
   *
   * @param user - User identity information
   *
   * @example
   * ```typescript
   * await census.identify({
   *   userId: 'user_123',
   *   email: 'john@example.com',
   *   name: 'John Doe',
   *   organizationId: 'org_456',
   *   organizationName: 'Acme Inc',
   * });
   * ```
   */
  async identify(user: UserIdentity): Promise<void> {
    if (!user.userId) {
      throw new Error('Census: userId is required for identify()');
    }

    this.currentUserId = user.userId;

    await this.request('/api/sdk/identify', 'POST', {
      userId: user.userId,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      metadata: user.metadata,
      organizationId: user.organizationId,
      organizationName: user.organizationName,
      organizationDomain: user.organizationDomain,
      organizationPlan: user.organizationPlan,
    });

    this.log('User identified:', user.userId);
  }

  /**
   * Clear the current user identity.
   * Call this when a user logs out.
   */
  reset(): void {
    this.currentUserId = null;
    this.log('User identity reset');
  }

  /**
   * Submit feedback, bug report, or feature request.
   *
   * @param options - Feedback options
   *
   * @example
   * ```typescript
   * // Submit a bug report
   * await census.submitFeedback({
   *   type: 'bug_report',
   *   message: 'The submit button is not working on Firefox',
   * });
   *
   * // Submit a feature request
   * await census.submitFeedback({
   *   type: 'feature_request',
   *   message: 'It would be great to have dark mode support',
   * });
   *
   * // Rate an article
   * await census.submitFeedback({
   *   type: 'article_rating',
   *   articleId: 'article_123',
   *   helpful: true,
   *   rating: 5,
   * });
   * ```
   */
  async submitFeedback(options: FeedbackOptions): Promise<{ feedbackId: string }> {
    const validTypes = ['feedback', 'bug_report', 'feature_request', 'article_rating'];
    if (!options.type || !validTypes.includes(options.type)) {
      throw new Error(`Census: type must be one of: ${validTypes.join(', ')}`);
    }

    if (options.type === 'article_rating') {
      if (options.rating === undefined && options.helpful === undefined) {
        throw new Error('Census: article_rating requires rating or helpful field');
      }
    } else if (!options.message) {
      throw new Error('Census: message is required for this feedback type');
    }

    const response = await this.request<{ success: boolean; feedbackId: string }>(
      '/api/sdk/feedback',
      'POST',
      {
        type: options.type,
        message: options.message,
        rating: options.rating,
        helpful: options.helpful,
        userId: this.currentUserId,
        articleId: options.articleId,
        pageUrl: typeof window !== 'undefined' ? window.location.href : undefined,
        metadata: options.metadata,
      }
    );

    this.log('Feedback submitted:', response.feedbackId);
    return { feedbackId: response.feedbackId };
  }

  /**
   * Fetch published articles from the knowledge base.
   *
   * @param options - Query options
   * @returns Articles and pagination info
   *
   * @example
   * ```typescript
   * // Get all articles
   * const { articles } = await census.getArticles();
   *
   * // Search articles
   * const { articles } = await census.getArticles({ search: 'getting started' });
   *
   * // Filter by category
   * const { articles } = await census.getArticles({ category: 'guides' });
   * ```
   */
  async getArticles(options?: ArticlesOptions): Promise<ArticlesResponse> {
    const params = new URLSearchParams();
    if (options?.category) params.set('category', options.category);
    if (options?.search) params.set('search', options.search);
    if (options?.limit) params.set('limit', String(options.limit));
    if (options?.offset) params.set('offset', String(options.offset));

    const queryString = params.toString();
    const url = `/api/sdk/articles${queryString ? `?${queryString}` : ''}`;

    const response = await this.request<ArticlesResponse>(url, 'GET');
    this.log('Fetched articles:', response.articles.length);
    return response;
  }

  /**
   * Fetch a single article by slug or ID.
   *
   * @param slugOrId - Article slug or ID
   * @returns Article or null if not found
   *
   * @example
   * ```typescript
   * const article = await census.getArticle('getting-started');
   * if (article) {
   *   console.log(article.title, article.content_html);
   * }
   * ```
   */
  async getArticle(slugOrId: string): Promise<Article | null> {
    try {
      const response = await this.request<{ article: Article }>(
        `/api/sdk/articles/${encodeURIComponent(slugOrId)}`,
        'GET'
      );
      this.log('Fetched article:', slugOrId);
      return response.article;
    } catch (error) {
      if ((error as CensusError).status === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Fetch the current user's submitted requests (feedback, bugs, feature requests).
   * Requires a user to be identified first.
   *
   * @param options - Query options
   * @returns Requests and pagination info
   *
   * @example
   * ```typescript
   * // Get all requests for the current user
   * const { requests } = await census.getRequests();
   *
   * // Filter by status
   * const { requests } = await census.getRequests({ status: 'in_progress' });
   *
   * // Filter by type
   * const { requests } = await census.getRequests({ type: 'bug_report' });
   * ```
   */
  async getRequests(options?: RequestsOptions): Promise<RequestsResponse> {
    if (!this.currentUserId) {
      throw new Error('Census: User must be identified before fetching requests. Call identify() first.');
    }

    const params = new URLSearchParams();
    params.set('userId', this.currentUserId);
    if (options?.status) params.set('status', options.status);
    if (options?.type) params.set('type', options.type);
    if (options?.limit) params.set('limit', String(options.limit));
    if (options?.offset) params.set('offset', String(options.offset));

    const response = await this.request<RequestsResponse>(
      `/api/sdk/requests?${params.toString()}`,
      'GET'
    );
    this.log('Fetched requests:', response.requests.length);
    return response;
  }

  /**
   * Track a custom analytics event.
   *
   * @param eventType - Name of the event
   * @param properties - Additional event properties
   *
   * @example
   * ```typescript
   * // Track a button click
   * await census.track('button_clicked', { buttonId: 'submit-form' });
   *
   * // Track a page view
   * await census.track('page_viewed', { page: '/pricing' });
   * ```
   */
  async track(eventType: string, properties?: Record<string, unknown>): Promise<void> {
    if (!eventType) {
      throw new Error('Census: eventType is required for track()');
    }

    await this.request('/api/sdk/events', 'POST', {
      eventType,
      userId: this.currentUserId,
      properties,
    });

    this.log('Event tracked:', eventType);
  }

  /**
   * Track multiple events in a single request.
   * More efficient than calling track() multiple times.
   *
   * @param events - Array of events to track
   *
   * @example
   * ```typescript
   * await census.trackBatch({
   *   events: [
   *     { eventType: 'page_viewed', properties: { page: '/home' } },
   *     { eventType: 'button_clicked', properties: { button: 'cta' } },
   *   ],
   * });
   * ```
   */
  async trackBatch(options: BatchEventsOptions): Promise<void> {
    if (!options.events || options.events.length === 0) {
      throw new Error('Census: at least one event is required');
    }

    if (options.events.length > 100) {
      throw new Error('Census: maximum 100 events per batch');
    }

    const events = options.events.map((event) => ({
      eventType: event.eventType,
      userId: this.currentUserId,
      articleId: event.articleId,
      featureId: event.featureId,
      properties: event.properties,
    }));

    await this.request('/api/sdk/events', 'POST', { events });

    this.log('Batch events tracked:', options.events.length);
  }

  /**
   * Fetch available guides for the current user.
   * Returns guides that match the user's context and haven't been completed.
   *
   * @returns Guides and list of completed guide IDs
   *
   * @example
   * ```typescript
   * const { guides, completedGuides } = await census.getGuides();
   * guides.forEach(guide => console.log(guide.name));
   * ```
   */
  async getGuides(): Promise<GuidesResponse> {
    const params = new URLSearchParams();
    if (this.currentUserId) {
      params.set('userId', this.currentUserId);
    }

    const queryString = params.toString();
    const url = `/api/sdk/guides${queryString ? `?${queryString}` : ''}`;

    const response = await this.request<GuidesResponse>(url, 'GET');
    this.log('Fetched guides:', response.guides.length);
    return response;
  }

  /**
   * Fetch a single guide by slug or ID.
   *
   * @param slugOrId - Guide slug or ID
   * @returns Guide or null if not found
   *
   * @example
   * ```typescript
   * const guide = await census.getGuide('onboarding-tour');
   * if (guide) {
   *   console.log(guide.name, guide.guide_steps.length);
   * }
   * ```
   */
  async getGuide(slugOrId: string): Promise<Guide | null> {
    try {
      const params = new URLSearchParams();
      if (this.currentUserId) {
        params.set('userId', this.currentUserId);
      }

      const queryString = params.toString();
      const url = `/api/sdk/guides/${encodeURIComponent(slugOrId)}${queryString ? `?${queryString}` : ''}`;

      const response = await this.request<{ guide: Guide }>(url, 'GET');
      this.log('Fetched guide:', slugOrId);
      return response.guide;
    } catch (error) {
      if ((error as CensusError).status === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Track a guide analytics event.
   * Used to track user progress through guides.
   *
   * @param event - Guide analytics event
   *
   * @example
   * ```typescript
   * await census.trackGuideEvent({
   *   guideId: 'guide_123',
   *   eventType: 'step_completed',
   *   stepId: 'step_456',
   *   stepIndex: 2,
   *   sessionId: 'session_789',
   * });
   * ```
   */
  async trackGuideEvent(event: GuideAnalyticsEvent): Promise<void> {
    if (!event.guideId || !event.eventType || !event.sessionId) {
      throw new Error('Census: guideId, eventType, and sessionId are required for trackGuideEvent()');
    }

    await this.request('/api/sdk/guides/events', 'POST', {
      guideId: event.guideId,
      eventType: event.eventType,
      stepId: event.stepId,
      stepIndex: event.stepIndex,
      pageUrl: event.pageUrl || (typeof window !== 'undefined' ? window.location.href : undefined),
      sessionId: event.sessionId,
      userId: event.userId || this.currentUserId,
      metadata: event.metadata,
    });

    this.log('Guide event tracked:', event.eventType, event.guideId);
  }

  /**
   * Mark a guide as completed for the current user.
   * Prevents the guide from showing again.
   *
   * @param guideId - ID of the guide to mark as completed
   *
   * @example
   * ```typescript
   * await census.markGuideCompleted('guide_123');
   * ```
   */
  async markGuideCompleted(guideId: string): Promise<void> {
    if (!guideId) {
      throw new Error('Census: guideId is required for markGuideCompleted()');
    }

    if (!this.currentUserId) {
      throw new Error('Census: User must be identified before marking guides complete. Call identify() first.');
    }

    await this.request('/api/sdk/guides/complete', 'POST', {
      guideId,
      userId: this.currentUserId,
    });

    this.log('Guide marked completed:', guideId);
  }

  /**
   * Get the current identified user ID
   */
  getCurrentUserId(): string | null {
    return this.currentUserId;
  }

  /**
   * Check if a user is currently identified
   */
  isIdentified(): boolean {
    return this.currentUserId !== null;
  }

  /**
   * Make an API request
   */
  private async request<T>(path: string, method: string, body?: unknown): Promise<T> {
    const url = `${this.baseUrl}${path}`;

    const headers: Record<string, string> = {
      'X-Census-Key': this.apiKey,
    };

    if (body) {
      headers['Content-Type'] = 'application/json';
    }

    this.log(`${method} ${path}`, body);

    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      let errorMessage = `Request failed with status ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch {
        // Use default error message
      }

      const error: CensusError = {
        error: errorMessage,
        status: response.status,
      };
      throw error;
    }

    return response.json();
  }

  /**
   * Log debug messages
   */
  private log(...args: unknown[]): void {
    if (this.debug) {
      console.log('[Census]', ...args);
    }
  }
}

/**
 * Create a new Census SDK client.
 *
 * @param config - Configuration options
 * @returns Census client instance
 *
 * @example
 * ```typescript
 * import { createCensus } from '@census-ai/census-sdk';
 *
 * const census = createCensus({
 *   apiKey: 'cs_live_your_key_here',
 *   debug: true, // Enable debug logging
 * });
 * ```
 */
export function createCensus(config: CensusConfig): CensusClient {
  return new CensusClient(config);
}
