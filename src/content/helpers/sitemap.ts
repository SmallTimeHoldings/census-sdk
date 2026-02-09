import type { SitemapEntry } from '../types';
import type { CensusContentClient } from '../client';

/**
 * Fetch Census content URLs and return them in Next.js sitemap format.
 * Merge this with your static sitemap entries.
 *
 * @example
 * ```ts
 * // app/sitemap.ts
 * import { censusContent } from '@/lib/census'
 * import { generateContentSitemap } from '@census-ai/census-sdk/content'
 *
 * export default async function sitemap() {
 *   const contentEntries = await generateContentSitemap(censusContent, 'https://everre.co')
 *   return [...staticEntries, ...contentEntries]
 * }
 * ```
 */
export async function generateContentSitemap(
  client: CensusContentClient,
  siteUrl: string
): Promise<Array<{
  url: string;
  lastModified?: string;
  changeFrequency?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
}>> {
  try {
    const entries = await client.getSitemapEntries();
    return entries.map((entry: SitemapEntry) => ({
      url: entry.url.startsWith('http') ? entry.url : `${siteUrl}${entry.url}`,
      lastModified: entry.lastmod,
      changeFrequency: entry.changefreq,
      priority: entry.priority,
    }));
  } catch {
    // Return empty on error so sitemap generation doesn't fail
    return [];
  }
}
