import type { BlogPost } from '../types';

/**
 * Generate an RSS 2.0 XML feed from blog posts.
 *
 * @example
 * ```ts
 * // app/blog/rss.xml/route.ts
 * import { censusContent } from '@/lib/census'
 * import { generateRSSFeed } from '@census-ai/census-sdk/content'
 *
 * export async function GET() {
 *   const { posts } = await censusContent.getBlogPosts({ limit: 50 })
 *   const xml = generateRSSFeed(posts, {
 *     title: 'Everre Blog',
 *     description: 'CRE insights',
 *     siteUrl: 'https://everre.co',
 *     feedUrl: 'https://everre.co/blog/rss.xml',
 *   })
 *   return new Response(xml, {
 *     headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' },
 *   })
 * }
 * ```
 */
export function generateRSSFeed(
  posts: BlogPost[],
  options: {
    title: string;
    description: string;
    siteUrl: string;
    feedUrl: string;
    language?: string;
  }
): string {
  const { title, description, siteUrl, feedUrl, language = 'en-us' } = options;

  const escapeXml = (str: string) =>
    str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');

  const items = posts
    .filter((p) => p.published_at)
    .map((post) => {
      const link = `${siteUrl}/blog/${post.slug}`;
      return `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${escapeXml(link)}</link>
      <guid isPermaLink="true">${escapeXml(link)}</guid>
      <description>${escapeXml(post.seo_description || '')}</description>
      <pubDate>${new Date(post.published_at!).toUTCString()}</pubDate>${
        post.author_name
          ? `\n      <dc:creator>${escapeXml(post.author_name)}</dc:creator>`
          : ''
      }${
        post.tags?.length
          ? post.tags.map((t) => `\n      <category>${escapeXml(t)}</category>`).join('')
          : ''
      }
    </item>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>${escapeXml(title)}</title>
    <link>${escapeXml(siteUrl)}</link>
    <description>${escapeXml(description)}</description>
    <language>${language}</language>
    <atom:link href="${escapeXml(feedUrl)}" rel="self" type="application/rss+xml"/>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${items}
  </channel>
</rss>`;
}
