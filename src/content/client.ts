import type {
  ContentConfig,
  BlogPost,
  BlogPostsResponse,
  HelpArticle,
  HelpArticlesResponse,
  HelpCategory,
  SitemapEntry,
} from './types';

const DEFAULT_BASE_URL = 'https://api.census.ai';

/**
 * Server-side content client for fetching blog posts and help articles.
 * Designed for use in Next.js `generateStaticParams`, `generateMetadata`, and server components.
 */
export class CensusContentClient {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly timeout: number;

  constructor(config: ContentConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = (config.baseUrl || DEFAULT_BASE_URL).replace(/\/$/, '');
    this.timeout = config.timeout ?? 30_000;
  }

  // ── Blog ────────────────────────────────────────────────────────────

  async getBlogPosts(options?: {
    limit?: number;
    offset?: number;
    tag?: string;
  }): Promise<BlogPostsResponse> {
    const params = new URLSearchParams();
    if (options?.limit) params.set('limit', String(options.limit));
    if (options?.offset) params.set('offset', String(options.offset));
    if (options?.tag) params.set('tag', options.tag);

    const qs = params.toString();
    return this.request<BlogPostsResponse>(
      `/api/sdk/blog-posts${qs ? `?${qs}` : ''}`
    );
  }

  async getBlogPost(slug: string): Promise<BlogPost | null> {
    try {
      const data = await this.request<{ post: BlogPost }>(
        `/api/sdk/blog-posts/${encodeURIComponent(slug)}`
      );
      return data.post;
    } catch (err) {
      if (err && typeof err === 'object' && 'status' in err && (err as { status: number }).status === 404) {
        return null;
      }
      throw err;
    }
  }

  async getBlogTags(): Promise<string[]> {
    const data = await this.request<{ tags: string[] }>('/api/sdk/blog-posts/tags');
    return data.tags;
  }

  // ── Help Articles ───────────────────────────────────────────────────

  async getHelpArticles(options?: {
    category?: string;
    search?: string;
    limit?: number;
  }): Promise<HelpArticlesResponse> {
    const params = new URLSearchParams();
    if (options?.category) params.set('category', options.category);
    if (options?.search) params.set('search', options.search);
    if (options?.limit) params.set('limit', String(options.limit));

    const qs = params.toString();
    const data = await this.request<{
      articles: HelpArticle[];
      pagination: { total: number };
    }>(`/api/sdk/articles${qs ? `?${qs}` : ''}`);

    return {
      articles: data.articles,
      total: data.pagination.total,
    };
  }

  async getHelpArticle(slug: string): Promise<HelpArticle | null> {
    try {
      const data = await this.request<{ article: HelpArticle }>(
        `/api/sdk/articles/${encodeURIComponent(slug)}`
      );
      return data.article;
    } catch (err) {
      if (err && typeof err === 'object' && 'status' in err && (err as { status: number }).status === 404) {
        return null;
      }
      throw err;
    }
  }

  async getHelpCategories(): Promise<HelpCategory[]> {
    const data = await this.request<{ feature_groups: HelpCategory[] }>(
      '/api/sdk/feature-groups'
    );
    return data.feature_groups.map((g) => ({
      id: g.id,
      name: g.name,
      slug: g.slug,
      description: g.description,
      article_count: g.article_count,
    }));
  }

  // ── SEO ─────────────────────────────────────────────────────────────

  async getSitemapEntries(): Promise<SitemapEntry[]> {
    const data = await this.request<{ entries: SitemapEntry[] }>(
      '/api/sdk/content/sitemap'
    );
    return data.entries;
  }

  async getRSSFeed(): Promise<string> {
    const res = await this.rawRequest('/api/sdk/content/rss');
    return res.text();
  }

  // ── Internal ────────────────────────────────────────────────────────

  private async request<T>(path: string): Promise<T> {
    const res = await this.rawRequest(path);
    return res.json();
  }

  private async rawRequest(path: string): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const res = await fetch(`${this.baseUrl}${path}`, {
        headers: {
          'X-Census-Key': this.apiKey,
        },
        signal: controller.signal,
      });

      if (!res.ok) {
        const error: { error: string; status: number } = {
          error: `Content request failed: ${res.status}`,
          status: res.status,
        };
        try {
          const body = await res.json();
          error.error = body.error || error.error;
        } catch {
          // use default
        }
        throw error;
      }

      return res;
    } finally {
      clearTimeout(timeoutId);
    }
  }
}
