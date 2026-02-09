/**
 * Types for Census Content Module
 */

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string | null;
  content_html: string | null;
  seo_title: string | null;
  seo_description: string | null;
  og_image_url: string | null;
  canonical_url: string | null;
  category: string | null;
  tags: string[];
  author_name: string | null;
  author_avatar_url: string | null;
  read_time_minutes: number | null;
  published_at: string | null;
  updated_at: string | null;
  sort_order: number;
}

export interface HelpArticle {
  id: string;
  title: string;
  slug: string;
  content: string | null;
  content_html: string | null;
  seo_title: string | null;
  seo_description: string | null;
  category: string | null;
  read_time_minutes: number | null;
  published_at: string | null;
  updated_at: string | null;
  sort_order: number;
  features?: {
    id: string;
    name: string;
    slug: string;
  };
}

export interface HelpCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  article_count: number;
}

export interface SitemapEntry {
  url: string;
  lastmod?: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
}

export interface BlogPostsResponse {
  posts: BlogPost[];
  total: number;
}

export interface HelpArticlesResponse {
  articles: HelpArticle[];
  total: number;
}

export interface ContentConfig {
  apiKey: string;
  baseUrl?: string;
  /** Request timeout in ms @default 30000 */
  timeout?: number;
}
