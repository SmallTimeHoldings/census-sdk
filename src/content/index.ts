/**
 * @census-ai/census-sdk/content - Server-side content fetcher for SEO
 *
 * Use this module to fetch blog posts and help articles from Census
 * for server-side rendering in Next.js or similar frameworks.
 *
 * @example
 * ```typescript
 * import { createCensusContent } from '@census-ai/census-sdk/content';
 *
 * const content = createCensusContent({
 *   apiKey: process.env.CENSUS_API_KEY!,
 *   baseUrl: 'https://api.census.ai',
 * });
 *
 * // Fetch blog posts for SSR
 * const { posts } = await content.getBlogPosts({ limit: 20 });
 *
 * // Fetch a single post with full SEO metadata
 * const post = await content.getBlogPost('my-post-slug');
 *
 * // Generate sitemap entries
 * const entries = await content.getSitemapEntries();
 * ```
 */

export { CensusContentClient } from './client';
export type {
  ContentConfig,
  BlogPost,
  BlogPostsResponse,
  HelpArticle,
  HelpArticlesResponse,
  HelpCategory,
  SitemapEntry,
} from './types';

export { generateBlogMetadata, generateArticleMetadata } from './helpers/metadata';
export { generateContentSitemap } from './helpers/sitemap';
export { generateRSSFeed } from './helpers/rss';

import { CensusContentClient } from './client';
import type { ContentConfig } from './types';

/**
 * Create a new Census Content client for server-side content fetching.
 */
export function createCensusContent(config: ContentConfig): CensusContentClient {
  return new CensusContentClient(config);
}
