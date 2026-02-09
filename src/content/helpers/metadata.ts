import type { BlogPost, HelpArticle } from '../types';

/**
 * Generate Next.js Metadata object for a blog post.
 * Use in `generateMetadata()` in your blog/[slug]/page.tsx.
 */
export function generateBlogMetadata(
  post: BlogPost,
  options?: { siteUrl?: string; siteName?: string }
) {
  const siteUrl = options?.siteUrl || '';
  const siteName = options?.siteName || '';
  const title = post.seo_title || post.title;
  const description = post.seo_description || '';
  const canonical = post.canonical_url || `${siteUrl}/blog/${post.slug}`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      type: 'article' as const,
      publishedTime: post.published_at || undefined,
      modifiedTime: post.updated_at || undefined,
      authors: post.author_name ? [post.author_name] : undefined,
      images: post.og_image_url ? [{ url: post.og_image_url, width: 1200, height: 630 }] : undefined,
      ...(siteName ? { siteName } : {}),
    },
    twitter: {
      card: 'summary_large_image' as const,
      title,
      description,
      images: post.og_image_url ? [post.og_image_url] : undefined,
    },
  };
}

/**
 * Generate Next.js Metadata object for a help article.
 */
export function generateArticleMetadata(
  article: HelpArticle,
  options?: { siteUrl?: string; siteName?: string }
) {
  const siteUrl = options?.siteUrl || '';
  const siteName = options?.siteName || '';
  const title = article.seo_title || article.title;
  const description = article.seo_description || '';
  const canonical = `${siteUrl}/help/${article.slug}`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      type: 'article' as const,
      ...(siteName ? { siteName } : {}),
    },
  };
}
