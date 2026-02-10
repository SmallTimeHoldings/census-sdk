/**
 * @census-ai/census-sdk/server - Server-side Census SDK
 *
 * For backend use cases: sync users from your server, track subscription changes,
 * and bulk import users.
 *
 * @example
 * ```typescript
 * import { createCensusServer } from '@census-ai/census-sdk/server';
 *
 * const census = createCensusServer({ apiKey: 'cs_live_xxx' });
 *
 * // Sync a single user (e.g., on signup or subscription change)
 * await census.syncUser({
 *   userId: 'user_123',
 *   email: 'john@example.com',
 *   planName: 'Pro',
 *   subscriptionStatus: 'active',
 *   mrr: 9900, // $99.00 in cents
 *   signupAt: new Date(),
 * });
 *
 * // Bulk sync users (e.g., initial import)
 * const result = await census.syncUsers(allUsers, { batchSize: 100 });
 * console.log(`Created: ${result.created}, Updated: ${result.updated}`);
 * ```
 */

import type {
  CensusConfig,
  SyncUserData,
  SyncUsersOptions,
  SyncResult,
  SyncUsersResult,
  CensusError,
} from './types';

/**
 * Default API base URL
 */
const DEFAULT_BASE_URL = 'https://census-api-production-97c0.up.railway.app';

/**
 * Census Server SDK Client
 *
 * A server-side client for syncing user data from your backend.
 * Use `createCensusServer()` to create an instance.
 *
 * This client is designed for:
 * - Backend services (Node.js, Bun, Deno, Edge runtimes)
 * - Syncing subscription/billing data from your payment processor
 * - Bulk importing users from your database
 * - Tracking server-side events
 *
 * For client-side usage, use `createCensus()` from '@census-ai/census-sdk'.
 */
export class CensusServerClient {
  private apiKey: string;
  private baseUrl: string;
  private debug: boolean;

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

    this.log('Server client initialized with base URL:', this.baseUrl);
  }

  /**
   * Sync a single user's data to Census.
   *
   * Call this when:
   * - A user signs up
   * - Subscription status changes (upgrade, downgrade, cancel)
   * - User profile is updated
   * - Login activity should be recorded
   *
   * @param user - User data to sync
   * @returns Sync result with user ID
   *
   * @example
   * ```typescript
   * // On user signup
   * await census.syncUser({
   *   userId: 'user_123',
   *   email: 'john@example.com',
   *   name: 'John Doe',
   *   signupAt: new Date(),
   *   subscriptionStatus: 'trial',
   *   trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
   * });
   *
   * // On subscription purchase
   * await census.syncUser({
   *   userId: 'user_123',
   *   planName: 'Pro',
   *   subscriptionStatus: 'active',
   *   billingCycle: 'monthly',
   *   mrr: 9900, // $99.00 in cents
   *   subscriptionStartedAt: new Date(),
   * });
   *
   * // On cancellation
   * await census.syncUser({
   *   userId: 'user_123',
   *   subscriptionStatus: 'canceled',
   *   subscriptionEndsAt: new Date('2024-02-01'),
   * });
   * ```
   */
  async syncUser(user: SyncUserData): Promise<SyncResult> {
    if (!user.userId) {
      throw new Error('Census: userId is required for syncUser()');
    }

    const response = await this.request<SyncResult>(
      '/api/sdk/sync',
      'POST',
      this.prepareUserData(user)
    );

    this.log('User synced:', user.userId);
    return response;
  }

  /**
   * Bulk sync multiple users to Census.
   *
   * Use this for:
   * - Initial import of existing users
   * - Periodic full sync from your database
   * - Batch updates after bulk operations
   *
   * @param users - Array of users to sync (max 1000 per request)
   * @param options - Sync options
   * @returns Bulk sync result with counts
   *
   * @example
   * ```typescript
   * // Initial import
   * const allUsers = await db.users.findAll();
   *
   * const result = await census.syncUsers(
   *   allUsers.map(u => ({
   *     userId: u.id,
   *     email: u.email,
   *     name: u.name,
   *     planName: u.subscription?.plan,
   *     subscriptionStatus: u.subscription?.status,
   *     mrr: u.subscription?.mrr,
   *     signupAt: u.createdAt,
   *     lastLoginAt: u.lastLogin,
   *     loginCount: u.loginCount,
   *   })),
   *   { batchSize: 100 }
   * );
   *
   * console.log(`Synced: ${result.created} created, ${result.updated} updated`);
   * if (result.errors?.length) {
   *   console.error('Errors:', result.errors);
   * }
   * ```
   */
  async syncUsers(
    users: SyncUserData[],
    options?: SyncUsersOptions
  ): Promise<SyncUsersResult> {
    if (!users || users.length === 0) {
      return {
        success: true,
        created: 0,
        updated: 0,
        skipped: 0,
        failed: 0,
      };
    }

    if (users.length > 1000) {
      throw new Error('Census: Maximum 1000 users per syncUsers() call. Split into multiple calls.');
    }

    // Validate all users have userId
    const invalidUsers = users.filter(u => !u.userId);
    if (invalidUsers.length > 0) {
      throw new Error(`Census: ${invalidUsers.length} users missing userId`);
    }

    const response = await this.request<SyncUsersResult>(
      '/api/sdk/sync/bulk',
      'POST',
      {
        users: users.map(u => this.prepareUserData(u)),
        options: {
          onConflict: options?.onConflict || 'update',
          batchSize: options?.batchSize,
        },
      }
    );

    this.log(
      'Bulk sync complete:',
      `${response.created} created,`,
      `${response.updated} updated,`,
      `${response.failed} failed`
    );

    return response;
  }

  /**
   * Prepare user data for API request, converting dates to ISO strings
   */
  private prepareUserData(user: SyncUserData): Record<string, unknown> {
    const data: Record<string, unknown> = {
      userId: user.userId,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      metadata: user.metadata,
      organizationId: user.organizationId,
      organizationName: user.organizationName,
      organizationDomain: user.organizationDomain,
      organizationPlan: user.organizationPlan,
      planName: user.planName,
      subscriptionStatus: user.subscriptionStatus,
      billingCycle: user.billingCycle,
      mrr: user.mrr,
      loginCount: user.loginCount,
    };

    // Convert dates to ISO strings
    if (user.subscriptionStartedAt) {
      data.subscriptionStartedAt = this.toISOString(user.subscriptionStartedAt);
    }
    if (user.subscriptionEndsAt) {
      data.subscriptionEndsAt = this.toISOString(user.subscriptionEndsAt);
    }
    if (user.trialEndsAt) {
      data.trialEndsAt = this.toISOString(user.trialEndsAt);
    }
    if (user.signupAt) {
      data.signupAt = this.toISOString(user.signupAt);
    }
    if (user.lastLoginAt) {
      data.lastLoginAt = this.toISOString(user.lastLoginAt);
    }

    // Remove undefined values
    return Object.fromEntries(
      Object.entries(data).filter(([, v]) => v !== undefined)
    );
  }

  /**
   * Convert Date or string to ISO string
   */
  private toISOString(value: string | Date): string {
    if (value instanceof Date) {
      return value.toISOString();
    }
    return value;
  }

  /**
   * Make an API request
   */
  private async request<T>(
    path: string,
    method: string,
    body?: unknown
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const maxRetries = 1;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30_000);

      try {
        const headers: Record<string, string> = {
          'X-Census-Key': this.apiKey,
          'Content-Type': 'application/json',
        };

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
      console.log('[Census Server]', ...args);
    }
  }
}

/**
 * Create a new Census Server SDK client.
 *
 * @param config - Configuration options
 * @returns Census server client instance
 *
 * @example
 * ```typescript
 * import { createCensusServer } from '@census-ai/census-sdk/server';
 *
 * const census = createCensusServer({
 *   apiKey: 'cs_live_your_key_here',
 *   debug: true, // Enable debug logging
 * });
 *
 * // Sync user on subscription change
 * await census.syncUser({
 *   userId: 'user_123',
 *   planName: 'Pro',
 *   subscriptionStatus: 'active',
 *   mrr: 9900,
 * });
 * ```
 */
export function createCensusServer(config: CensusConfig): CensusServerClient {
  return new CensusServerClient(config);
}

// Re-export types needed for server usage
export type {
  CensusConfig,
  SyncUserData,
  SyncUsersOptions,
  SyncResult,
  SyncUsersResult,
  CensusError,
} from './types';
