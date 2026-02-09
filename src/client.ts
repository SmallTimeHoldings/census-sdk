import type {
  CensusConfig,
  UserIdentity,
  FeedbackOptions,
  ArticlesOptions,
  ArticlesResponse,
  Article,
  FeatureGroupsResponse,
  RequestsOptions,
  RequestsResponse,
  BatchEventsOptions,
  CensusError,
  Guide,
  GuideStep,
  GuidesOptions,
  GuidesResponse,
  GuideAnalyticsEvent,
  CreateGuideOptions,
  UpdateGuideOptions,
  CreateGuideStepOptions,
  UpdateGuideStepOptions,
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
   * Fetch feature groups with their features.
   * Used by the HelpCenter component for navigation.
   *
   * @returns Feature groups with features and article counts
   *
   * @example
   * ```typescript
   * const { feature_groups } = await census.getFeatureGroups();
   * feature_groups.forEach(group => {
   *   console.log(group.name, group.features.length);
   * });
   * ```
   */
  async getFeatureGroups(): Promise<FeatureGroupsResponse> {
    const response = await this.request<FeatureGroupsResponse>(
      '/api/sdk/feature-groups',
      'GET'
    );
    this.log('Fetched feature groups:', response.feature_groups.length);
    return response;
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

  // ============================================================================
  // Guide Builder Methods
  // ============================================================================

  /**
   * Get published guides.
   *
   * @param options - Query options
   * @returns Guides and completion status
   *
   * @example
   * ```typescript
   * const { guides, completedGuides } = await census.getGuides({
   *   url: window.location.href,
   *   userId: 'user_123',
   * });
   * ```
   */
  async getGuides(options?: GuidesOptions): Promise<GuidesResponse> {
    const params = new URLSearchParams();
    if (options?.projectId) params.set('project_id', options.projectId);
    if (options?.url) params.set('url', options.url);
    if (options?.userId) params.set('user_id', options.userId);

    const queryString = params.toString();
    const url = `/api/sdk/guides${queryString ? `?${queryString}` : ''}`;

    const response = await this.request<GuidesResponse>(url, 'GET');
    this.log('Fetched guides:', response.guides.length);
    return response;
  }

  /**
   * Get a single guide by ID.
   *
   * @param guideId - Guide ID
   * @returns Guide with steps or null if not found
   *
   * @example
   * ```typescript
   * const guide = await census.getGuide('guide_123');
   * if (guide) {
   *   console.log(guide.name, guide.guide_steps.length);
   * }
   * ```
   */
  async getGuide(guideId: string): Promise<Guide | null> {
    try {
      const response = await this.request<{ guide: Guide }>(
        `/api/sdk/guides/${encodeURIComponent(guideId)}`,
        'GET'
      );
      this.log('Fetched guide:', guideId);
      return response.guide;
    } catch (error) {
      if ((error as CensusError).status === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Create a new guide.
   * Requires guides:create or guides:admin scope.
   *
   * @param options - Guide creation options
   * @returns Created guide
   *
   * @example
   * ```typescript
   * const guide = await census.createGuide({
   *   name: 'Welcome Tour',
   *   slug: 'welcome-tour',
   *   description: 'Introduction to the app',
   *   triggerType: 'first_visit',
   * });
   * ```
   */
  async createGuide(options: CreateGuideOptions): Promise<Guide> {
    if (!options.name || !options.slug) {
      throw new Error('Census: name and slug are required for createGuide()');
    }

    const response = await this.request<{ guide: Guide }>(
      '/api/sdk/guides',
      'POST',
      {
        name: options.name,
        slug: options.slug,
        description: options.description,
        project_id: options.projectId,
        trigger_type: options.triggerType || 'manual',
        trigger_config: options.triggerConfig || {},
        theme: options.theme || {},
        allow_skip: options.allowSkip ?? true,
        show_progress: options.showProgress ?? true,
      }
    );

    this.log('Guide created:', response.guide.id);
    return response.guide;
  }

  /**
   * Update an existing guide.
   * Requires guides:create or guides:admin scope.
   *
   * @param guideId - Guide ID to update
   * @param options - Update options
   * @returns Updated guide
   *
   * @example
   * ```typescript
   * const guide = await census.updateGuide('guide_123', {
   *   name: 'Updated Tour Name',
   *   status: 'published',
   * });
   * ```
   */
  async updateGuide(guideId: string, options: UpdateGuideOptions): Promise<Guide> {
    if (!guideId) {
      throw new Error('Census: guideId is required for updateGuide()');
    }

    const body: Record<string, unknown> = {};
    if (options.name !== undefined) body.name = options.name;
    if (options.slug !== undefined) body.slug = options.slug;
    if (options.description !== undefined) body.description = options.description;
    if (options.triggerType !== undefined) body.trigger_type = options.triggerType;
    if (options.triggerConfig !== undefined) body.trigger_config = options.triggerConfig;
    if (options.theme !== undefined) body.theme = options.theme;
    if (options.allowSkip !== undefined) body.allow_skip = options.allowSkip;
    if (options.showProgress !== undefined) body.show_progress = options.showProgress;
    if (options.status !== undefined) body.status = options.status;

    const response = await this.request<{ guide: Guide }>(
      `/api/sdk/guides/${encodeURIComponent(guideId)}`,
      'PUT',
      body
    );

    this.log('Guide updated:', guideId);
    return response.guide;
  }

  /**
   * Delete a guide.
   * Requires guides:admin scope.
   *
   * @param guideId - Guide ID to delete
   *
   * @example
   * ```typescript
   * await census.deleteGuide('guide_123');
   * ```
   */
  async deleteGuide(guideId: string): Promise<void> {
    if (!guideId) {
      throw new Error('Census: guideId is required for deleteGuide()');
    }

    await this.request(
      `/api/sdk/guides/${encodeURIComponent(guideId)}`,
      'DELETE'
    );

    this.log('Guide deleted:', guideId);
  }

  /**
   * Get steps for a guide.
   *
   * @param guideId - Guide ID
   * @returns Array of steps
   *
   * @example
   * ```typescript
   * const steps = await census.getGuideSteps('guide_123');
   * ```
   */
  async getGuideSteps(guideId: string): Promise<GuideStep[]> {
    const response = await this.request<{ steps: GuideStep[] }>(
      `/api/sdk/guides/${encodeURIComponent(guideId)}/steps`,
      'GET'
    );
    this.log('Fetched steps for guide:', guideId);
    return response.steps;
  }

  /**
   * Add a step to a guide.
   * Requires guides:create or guides:admin scope.
   *
   * @param guideId - Guide ID
   * @param options - Step creation options
   * @returns Created step
   *
   * @example
   * ```typescript
   * const step = await census.addGuideStep('guide_123', {
   *   stepType: 'tooltip',
   *   selectorStrategy: { css: '.welcome-button' },
   *   richContent: {
   *     title: 'Welcome!',
   *     body: 'Click here to get started',
   *   },
   * });
   * ```
   */
  async addGuideStep(guideId: string, options: CreateGuideStepOptions): Promise<GuideStep> {
    if (!guideId) {
      throw new Error('Census: guideId is required for addGuideStep()');
    }

    const response = await this.request<{ step: GuideStep }>(
      `/api/sdk/guides/${encodeURIComponent(guideId)}/steps`,
      'POST',
      {
        step_type: options.stepType || 'tooltip',
        sort_order: options.sortOrder,
        selector_strategy: options.selectorStrategy || {},
        title: options.title,
        content: options.content,
        tooltip_position: options.tooltipPosition || 'auto',
        rich_content: options.richContent || {},
        display_config: options.displayConfig || {},
        advance_config: options.advanceConfig || { trigger: 'button' },
        style_config: options.styleConfig || {},
      }
    );

    this.log('Step added to guide:', guideId);
    return response.step;
  }

  /**
   * Update a guide step.
   * Requires guides:create or guides:admin scope.
   *
   * @param guideId - Guide ID
   * @param stepId - Step ID
   * @param options - Update options
   * @returns Updated step
   *
   * @example
   * ```typescript
   * const step = await census.updateGuideStep('guide_123', 'step_456', {
   *   richContent: { title: 'Updated title' },
   * });
   * ```
   */
  async updateGuideStep(
    guideId: string,
    stepId: string,
    options: UpdateGuideStepOptions
  ): Promise<GuideStep> {
    if (!guideId || !stepId) {
      throw new Error('Census: guideId and stepId are required for updateGuideStep()');
    }

    const body: Record<string, unknown> = {};
    if (options.stepType !== undefined) body.step_type = options.stepType;
    if (options.sortOrder !== undefined) body.sort_order = options.sortOrder;
    if (options.selectorStrategy !== undefined) body.selector_strategy = options.selectorStrategy;
    if (options.title !== undefined) body.title = options.title;
    if (options.content !== undefined) body.content = options.content;
    if (options.tooltipPosition !== undefined) body.tooltip_position = options.tooltipPosition;
    if (options.richContent !== undefined) body.rich_content = options.richContent;
    if (options.displayConfig !== undefined) body.display_config = options.displayConfig;
    if (options.advanceConfig !== undefined) body.advance_config = options.advanceConfig;
    if (options.styleConfig !== undefined) body.style_config = options.styleConfig;

    const response = await this.request<{ step: GuideStep }>(
      `/api/sdk/guides/${encodeURIComponent(guideId)}/steps/${encodeURIComponent(stepId)}`,
      'PUT',
      body
    );

    this.log('Step updated:', stepId);
    return response.step;
  }

  /**
   * Delete a guide step.
   * Requires guides:create or guides:admin scope.
   *
   * @param guideId - Guide ID
   * @param stepId - Step ID
   *
   * @example
   * ```typescript
   * await census.deleteGuideStep('guide_123', 'step_456');
   * ```
   */
  async deleteGuideStep(guideId: string, stepId: string): Promise<void> {
    if (!guideId || !stepId) {
      throw new Error('Census: guideId and stepId are required for deleteGuideStep()');
    }

    await this.request(
      `/api/sdk/guides/${encodeURIComponent(guideId)}/steps/${encodeURIComponent(stepId)}`,
      'DELETE'
    );

    this.log('Step deleted:', stepId);
  }

  /**
   * Reorder steps in a guide.
   * Requires guides:create or guides:admin scope.
   *
   * @param guideId - Guide ID
   * @param stepOrder - Array of { id, sort_order } to define new order
   * @returns Updated steps
   *
   * @example
   * ```typescript
   * const steps = await census.reorderGuideSteps('guide_123', [
   *   { id: 'step_a', sort_order: 0 },
   *   { id: 'step_b', sort_order: 1 },
   *   { id: 'step_c', sort_order: 2 },
   * ]);
   * ```
   */
  async reorderGuideSteps(
    guideId: string,
    stepOrder: Array<{ id: string; sort_order: number }>
  ): Promise<GuideStep[]> {
    if (!guideId) {
      throw new Error('Census: guideId is required for reorderGuideSteps()');
    }

    const response = await this.request<{ steps: GuideStep[] }>(
      `/api/sdk/guides/${encodeURIComponent(guideId)}/steps`,
      'PUT',
      { steps: stepOrder }
    );

    this.log('Steps reordered for guide:', guideId);
    return response.steps;
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
    const maxRetries = 1;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30_000);

      try {
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
          signal: controller.signal,
        });

        if (!response.ok) {
          // Retry on 5xx errors
          if (response.status >= 500 && attempt < maxRetries) {
            this.log(`Retrying ${method} ${path} after ${response.status}`);
            await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
            continue;
          }

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
      } catch (err) {
        if (err && typeof err === 'object' && 'error' in err) throw err;

        // Retry on network errors
        if (attempt < maxRetries) {
          this.log(`Retrying ${method} ${path} after network error`);
          await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
          continue;
        }

        const error: CensusError = {
          error: controller.signal.aborted
            ? `Request timed out after 30s: ${method} ${path}`
            : `Network error: ${method} ${path}`,
        };
        throw error;
      } finally {
        clearTimeout(timeoutId);
      }
    }

    // TypeScript exhaustiveness — unreachable
    throw { error: 'Unexpected error', status: 500 } as CensusError;
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
