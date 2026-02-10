'use client';

import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useArticles, useArticle, useRequests, useFeedback, useFeatureGroups } from '../hooks';
import { useCensusContext } from '../context';
import type { Article, FeedbackType } from '../../types';

export type HelpCenterTab = 'articles' | 'requests';
export type HelpCenterTheme = 'light' | 'dark' | 'auto';

export interface HelpCenterProps {
  tabs?: HelpCenterTab[];
  defaultTab?: HelpCenterTab;
  tabLabels?: Partial<Record<HelpCenterTab, string>>;
  showSearch?: boolean;
  className?: string;
  /** Theme mode: 'light', 'dark', or 'auto' (inherits from system/parent) */
  theme?: HelpCenterTheme;
}

const defaultTabLabels: Record<HelpCenterTab, string> = {
  articles: 'Documentation',
  requests: 'My Requests',
};

const feedbackTypeConfig: Record<FeedbackType, { label: string; color: string; bg: string }> = {
  feedback: { label: 'Feedback', color: '#2563eb', bg: '#dbeafe' },
  bug_report: { label: 'Bug Report', color: '#dc2626', bg: '#fee2e2' },
  feature_request: { label: 'Feature Request', color: '#d97706', bg: '#fef3c7' },
  article_rating: { label: 'Article Rating', color: '#7c3aed', bg: '#ede9fe' },
};

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  new: { label: 'New', color: '#6b7280', bg: '#f3f4f6' },
  planned: { label: 'Planned', color: '#2563eb', bg: '#dbeafe' },
  in_progress: { label: 'In Progress', color: '#d97706', bg: '#fef3c7' },
  resolved: { label: 'Resolved', color: '#059669', bg: '#d1fae5' },
  closed: { label: 'Closed', color: '#6b7280', bg: '#f3f4f6' },
};

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

const FORM_TYPES: { value: FeedbackType; label: string }[] = [
  { value: 'feedback', label: 'Feedback' },
  { value: 'bug_report', label: 'Bug' },
  { value: 'feature_request', label: 'Feature' },
];

// Icons as inline SVGs
const SearchIcon = () => (
  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const BookIcon = () => (
  <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
  </svg>
);

const ChevronRightIcon = () => (
  <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);

const ChevronDownIcon = () => (
  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

const ArrowLeftIcon = () => (
  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
);

const ClockIcon = () => (
  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const LayersIcon = () => (
  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
  </svg>
);

const MessageIcon = () => (
  <svg width="48" height="48" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
  </svg>
);

const PlusIcon = () => (
  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const LoaderIcon = () => (
  <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ animation: 'spin 1s linear infinite' }}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
  </svg>
);

// Theme definitions
const themes = {
  light: {
    primary: '#c45a2c',
    primaryHover: '#a84a24',
    primaryLight: 'rgba(196, 90, 44, 0.08)',
    primaryLightHover: 'rgba(196, 90, 44, 0.15)',
    background: 'transparent',
    surface: '#ffffff',
    surfaceHover: '#fafafa',
    border: 'rgba(0, 0, 0, 0.08)',
    borderHover: 'rgba(196, 90, 44, 0.25)',
    text: '#1a1a1a',
    textSecondary: '#525252',
    textMuted: '#737373',
    textLight: '#a3a3a3',
  },
  dark: {
    primary: '#e07347',
    primaryHover: '#f08a5d',
    primaryLight: 'rgba(224, 115, 71, 0.12)',
    primaryLightHover: 'rgba(224, 115, 71, 0.2)',
    background: 'transparent',
    surface: 'rgba(255, 255, 255, 0.03)',
    surfaceHover: 'rgba(255, 255, 255, 0.06)',
    border: 'rgba(255, 255, 255, 0.08)',
    borderHover: 'rgba(224, 115, 71, 0.35)',
    text: '#fafafa',
    textSecondary: '#d4d4d4',
    textMuted: '#a3a3a3',
    textLight: '#737373',
  },
};

type ThemeColors = typeof themes.light;

// Create styles dynamically based on theme
const createStyles = (t: ThemeColors) => ({
  container: {
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    minHeight: '400px',
    color: t.text,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '220px 1fr',
    gap: '40px',
  },
  sidebar: {
    position: 'sticky' as const,
    top: '24px',
    height: 'fit-content',
  },
  main: {
    minWidth: 0,
  },
  tabs: {
    display: 'flex',
    borderBottom: `1px solid ${t.border}`,
    marginBottom: '28px',
    gap: '0',
  },
  tab: {
    padding: '10px 20px',
    fontSize: '14px',
    fontWeight: 500,
    border: 'none',
    borderBottomWidth: '2px',
    borderBottomStyle: 'solid' as const,
    borderBottomColor: 'transparent',
    cursor: 'pointer',
    transition: 'all 0.15s',
    backgroundColor: 'transparent',
    color: t.textMuted,
    marginBottom: '-1px',
  },
  tabActive: {
    color: t.primary,
    borderBottomColor: t.primary,
  },
  searchContainer: {
    position: 'relative' as const,
    marginBottom: '20px',
  },
  searchIcon: {
    position: 'absolute' as const,
    left: '10px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: t.textLight,
  },
  searchInput: {
    width: '100%',
    padding: '8px 10px 8px 32px',
    fontSize: '13px',
    border: `1px solid ${t.border}`,
    borderRadius: '6px',
    outline: 'none',
    backgroundColor: 'transparent',
    color: t.text,
    boxSizing: 'border-box' as const,
  },
  sectionTitle: {
    fontSize: '10px',
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    color: t.textLight,
    marginBottom: '8px',
    marginTop: '20px',
  },
  navList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    padding: '6px 10px',
    fontSize: '13px',
    color: t.textSecondary,
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    textAlign: 'left' as const,
    transition: 'all 0.15s',
  },
  navItemActive: {
    backgroundColor: t.surfaceHover,
    color: t.text,
    fontWeight: 500,
  },
  subNav: {
    marginLeft: '20px',
    marginTop: '2px',
    paddingLeft: '10px',
    borderLeft: `1px solid ${t.border}`,
  },
  articleGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '12px',
  },
  articleCard: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    padding: '14px',
    border: `1px solid ${t.border}`,
    borderRadius: '8px',
    backgroundColor: t.surface,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    textAlign: 'left' as const,
  },
  articleIcon: {
    flexShrink: 0,
    width: '36px',
    height: '36px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: t.primaryLight,
    borderRadius: '8px',
    color: t.primary,
    transition: 'background-color 0.2s',
  },
  articleContent: {
    flex: 1,
    minWidth: 0,
  },
  articleTitle: {
    fontSize: '14px',
    fontWeight: 500,
    color: t.text,
    margin: 0,
    lineHeight: 1.4,
  },
  articleDesc: {
    fontSize: '12px',
    color: t.textMuted,
    margin: '4px 0 0',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical' as const,
    overflow: 'hidden',
    lineHeight: 1.5,
  },
  articleMeta: {
    fontSize: '11px',
    color: t.textLight,
    marginTop: '6px',
  },
  articleChevron: {
    flexShrink: 0,
    color: t.textLight,
    transition: 'color 0.2s',
  },
  backButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 0',
    fontSize: '13px',
    color: t.textMuted,
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    marginBottom: '20px',
    transition: 'color 0.15s',
  },
  articleDetail: {
    maxWidth: '720px',
  },
  articleDetailTitle: {
    fontSize: '28px',
    fontWeight: 600,
    color: t.text,
    margin: 0,
    lineHeight: 1.3,
  },
  articleDetailMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '13px',
    color: t.textMuted,
    marginTop: '10px',
  },
  articleDetailContent: {
    marginTop: '28px',
    fontSize: '15px',
    lineHeight: 1.7,
    color: t.textSecondary,
  },
  emptyState: {
    textAlign: 'center' as const,
    padding: '48px 24px',
    color: t.textMuted,
  },
  emptyIcon: {
    color: t.textLight,
    marginBottom: '12px',
    opacity: 0.5,
  },
  emptyTitle: {
    fontSize: '16px',
    fontWeight: 500,
    color: t.text,
    margin: '0 0 6px',
  },
  emptyText: {
    fontSize: '13px',
    margin: 0,
    color: t.textMuted,
  },
  loading: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    padding: '48px',
    color: t.textMuted,
    fontSize: '13px',
  },
  // Request styles
  requestCard: {
    border: `1px solid ${t.border}`,
    borderRadius: '8px',
    padding: '16px',
    backgroundColor: t.surface,
    marginBottom: '10px',
    transition: 'border-color 0.2s',
  },
  requestHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    marginBottom: '10px',
  },
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '3px 8px',
    borderRadius: '9999px',
    fontSize: '11px',
    fontWeight: 500,
  },
  requestMessage: {
    fontSize: '14px',
    color: t.text,
    margin: 0,
    lineHeight: 1.5,
  },
  requestMeta: {
    display: 'flex',
    gap: '12px',
    marginTop: '10px',
    fontSize: '12px',
    color: t.textMuted,
  },
  form: {
    padding: '16px',
    backgroundColor: t.surface,
    borderRadius: '8px',
    border: `1px solid ${t.border}`,
    marginBottom: '20px',
  },
  formHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '12px',
  },
  formTitle: {
    fontSize: '14px',
    fontWeight: 500,
    color: t.text,
    margin: 0,
  },
  typeSelector: {
    display: 'flex',
    gap: '6px',
    marginBottom: '12px',
  },
  typeButton: {
    padding: '6px 12px',
    borderRadius: '6px',
    border: `1px solid ${t.border}`,
    backgroundColor: 'transparent',
    color: t.textSecondary,
    fontSize: '13px',
    cursor: 'pointer',
    transition: 'all 0.15s',
    fontWeight: 500,
  },
  typeButtonActive: {
    backgroundColor: t.primary,
    borderColor: t.primary,
    color: '#ffffff',
  },
  textarea: {
    width: '100%',
    padding: '10px 12px',
    borderRadius: '6px',
    border: `1px solid ${t.border}`,
    fontSize: '13px',
    resize: 'vertical' as const,
    minHeight: '80px',
    fontFamily: 'inherit',
    marginBottom: '12px',
    boxSizing: 'border-box' as const,
    backgroundColor: 'transparent',
    color: t.text,
  },
  submitButton: {
    padding: '8px 16px',
    borderRadius: '6px',
    border: 'none',
    backgroundColor: t.primary,
    color: '#ffffff',
    fontSize: '13px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.15s',
  },
  newRequestButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 16px',
    borderRadius: '6px',
    border: 'none',
    backgroundColor: t.primary,
    color: '#ffffff',
    fontSize: '13px',
    fontWeight: 500,
    cursor: 'pointer',
    marginBottom: '20px',
    transition: 'background-color 0.15s',
  },
  successMessage: {
    padding: '12px 14px',
    backgroundColor: 'rgba(5, 150, 105, 0.1)',
    borderRadius: '6px',
    color: '#059669',
    fontSize: '13px',
    marginBottom: '12px',
    fontWeight: 500,
  },
});

// Create dynamic CSS for hover states
const createHoverStyles = (t: ThemeColors, _isDark: boolean) => `
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  .census-hc .census-article-card:hover {
    border-color: ${t.borderHover} !important;
  }

  .census-hc .census-article-card:hover .census-article-icon {
    background-color: ${t.primaryLightHover} !important;
  }

  .census-hc .census-article-card:hover .census-article-chevron {
    color: ${t.textSecondary} !important;
  }

  .census-hc .census-nav-item:hover {
    background-color: ${t.surfaceHover} !important;
    color: ${t.text} !important;
  }

  .census-hc .census-back-btn:hover {
    color: ${t.text} !important;
  }

  .census-hc .census-submit-btn:hover {
    background-color: ${t.primaryHover} !important;
  }

  .census-hc .census-new-request-btn:hover {
    background-color: ${t.primaryHover} !important;
  }

  .census-hc .census-tab:hover {
    color: ${t.text} !important;
  }

  .census-hc .census-search-input:focus {
    border-color: ${t.primary} !important;
    outline: none !important;
    box-shadow: 0 0 0 1px ${t.primary} !important;
  }

  .census-hc .census-search-input::placeholder {
    color: ${t.textLight};
  }

  .census-hc .census-textarea::placeholder {
    color: ${t.textLight};
  }
`;

export function HelpCenter({
  tabs = ['articles', 'requests'],
  defaultTab = 'articles',
  tabLabels = {},
  showSearch = true,
  className,
  theme: themeProp = 'auto',
}: HelpCenterProps) {
  const [activeTab, setActiveTab] = useState<HelpCenterTab>(defaultTab);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [selectedFeatureId, setSelectedFeatureId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState<FeedbackType>('feedback');
  const [formMessage, setFormMessage] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [systemDark, setSystemDark] = useState(false);

  // Detect system theme
  useEffect(() => {
    if (themeProp === 'auto') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      setSystemDark(mediaQuery.matches);

      const handler = (e: MediaQueryListEvent) => setSystemDark(e.matches);
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    }
  }, [themeProp]);

  // Resolve the actual theme
  const isDark = themeProp === 'dark' || (themeProp === 'auto' && systemDark);
  const themeColors = isDark ? themes.dark : themes.light;
  const styles = useMemo(() => createStyles(themeColors), [themeColors]);
  const hoverStyles = useMemo(() => createHoverStyles(themeColors, isDark), [themeColors, isDark]);

  const { isIdentified } = useCensusContext();
  const { articles, isLoading: articlesLoading } = useArticles({ search: searchQuery || undefined });
  const { article: fullArticle, isLoading: articleLoading } = useArticle(selectedArticle?.slug || '');
  const { requests, isLoading: requestsLoading, refetch: refetchRequests } = useRequests({ limit: 50 });
  const { featureGroups, isLoading: groupsLoading } = useFeatureGroups();
  const { submitFeedback, isSubmitting, isSuccess, reset } = useFeedback();

  const mergedLabels = { ...defaultTabLabels, ...tabLabels };

  // Cmd+K keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  };

  const filteredArticles = useMemo(() => {
    return articles.filter((article) => {
      const matchesFeature = !selectedFeatureId || (article as any).feature_id === selectedFeatureId;
      return matchesFeature;
    });
  }, [articles, selectedFeatureId]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!formMessage.trim() || isSubmitting) return;

      try {
        await submitFeedback({
          type: formType,
          message: formMessage,
        });
        setFormMessage('');
        setShowForm(false);
        setTimeout(() => {
          refetchRequests();
          reset();
        }, 500);
      } catch {
        // Error handled by hook
      }
    },
    [formType, formMessage, isSubmitting, submitFeedback, refetchRequests, reset]
  );

  const renderArticleDetail = () => {
    if (articleLoading || !fullArticle) {
      return (
        <div style={styles.loading}>
          <LoaderIcon />
          <span>Loading article...</span>
        </div>
      );
    }

    return (
      <div style={styles.articleDetail}>
        <button onClick={() => setSelectedArticle(null)} style={styles.backButton} className="census-back-btn">
          <ArrowLeftIcon />
          Back to articles
        </button>

        <h1 style={styles.articleDetailTitle}>{fullArticle.title}</h1>
        {fullArticle.read_time_minutes && (
          <div style={styles.articleDetailMeta}>
            <ClockIcon />
            {fullArticle.read_time_minutes} min read
          </div>
        )}

        {fullArticle.content_html ? (
          <div
            style={styles.articleDetailContent}
            dangerouslySetInnerHTML={{ __html: fullArticle.content_html }}
          />
        ) : (
          <p style={{ ...styles.articleDetailContent, color: '#6b7280' }}>No content available.</p>
        )}
      </div>
    );
  };

  const renderArticles = () => {
    if (selectedArticle) {
      return renderArticleDetail();
    }

    if (articlesLoading || groupsLoading) {
      return (
        <div style={styles.loading}>
          <LoaderIcon />
          <span>Loading...</span>
        </div>
      );
    }

    if (filteredArticles.length === 0) {
      return (
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}><BookIcon /></div>
          <h3 style={styles.emptyTitle}>No articles found</h3>
          <p style={styles.emptyText}>
            {searchQuery ? `No results for "${searchQuery}"` : 'No documentation articles available yet.'}
          </p>
        </div>
      );
    }

    return (
      <div style={styles.articleGrid}>
        {filteredArticles.map((article) => (
          <button
            key={article.id}
            onClick={() => setSelectedArticle(article)}
            style={styles.articleCard}
            className="census-article-card"
          >
            <div style={styles.articleIcon} className="census-article-icon">
              <BookIcon />
            </div>
            <div style={styles.articleContent}>
              <h3 style={styles.articleTitle}>{article.title}</h3>
              {article.seo_description && (
                <p style={styles.articleDesc}>{article.seo_description}</p>
              )}
              {article.read_time_minutes && (
                <p style={styles.articleMeta}>{article.read_time_minutes} min read</p>
              )}
            </div>
            <span style={styles.articleChevron} className="census-article-chevron">
              <ChevronRightIcon />
            </span>
          </button>
        ))}
      </div>
    );
  };

  const renderRequestForm = () => {
    if (isSuccess) {
      return (
        <div style={styles.successMessage}>
          Thanks for your feedback! It has been submitted.
        </div>
      );
    }

    if (!showForm) {
      return (
        <button onClick={() => setShowForm(true)} style={styles.newRequestButton} className="census-new-request-btn">
          <PlusIcon />
          New Request
        </button>
      );
    }

    return (
      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.formHeader}>
          <p style={styles.formTitle}>Submit a request</p>
          <button
            type="button"
            onClick={() => setShowForm(false)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', fontSize: '18px' }}
          >
            ×
          </button>
        </div>
        <div style={styles.typeSelector}>
          {FORM_TYPES.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setFormType(t.value)}
              style={{
                ...styles.typeButton,
                ...(formType === t.value ? styles.typeButtonActive : {}),
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
        <textarea
          value={formMessage}
          onChange={(e) => setFormMessage(e.target.value)}
          placeholder="Describe your request..."
          style={styles.textarea}
          className="census-textarea"
          required
        />
        <button
          type="submit"
          style={{ ...styles.submitButton, opacity: isSubmitting ? 0.6 : 1 }}
          disabled={isSubmitting}
          className="census-submit-btn"
        >
          {isSubmitting ? 'Submitting...' : 'Submit'}
        </button>
      </form>
    );
  };

  const renderRequests = () => {
    if (!isIdentified) {
      return (
        <div style={styles.emptyState}>
          <p style={styles.emptyText}>Please sign in to view your requests.</p>
        </div>
      );
    }

    if (requestsLoading) {
      return (
        <div style={styles.loading}>
          <LoaderIcon />
          <span>Loading requests...</span>
        </div>
      );
    }

    return (
      <div>
        {renderRequestForm()}

        {requests.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}><MessageIcon /></div>
            <h3 style={styles.emptyTitle}>No requests yet</h3>
            <p style={styles.emptyText}>
              Submit your first request above.
            </p>
          </div>
        ) : (
          <div>
            {requests.map((request) => {
              const typeInfo = feedbackTypeConfig[request.feedback_type] || feedbackTypeConfig.feedback;
              const statusInfo = statusConfig[request.status] || statusConfig.new;

              return (
                <div key={request.id} style={styles.requestCard}>
                  <div style={{ ...styles.requestHeader, flexWrap: 'wrap' }}>
                    <span style={{ ...styles.badge, color: typeInfo.color, backgroundColor: typeInfo.bg }}>
                      {typeInfo.label}
                    </span>
                    <span style={{ ...styles.badge, color: statusInfo.color, backgroundColor: statusInfo.bg }}>
                      {statusInfo.label}
                    </span>
                    {request.feature_group && (
                      <span
                        style={{
                          ...styles.badge,
                          color: request.feature_group.color || '#6b7280',
                          backgroundColor: request.feature_group.color
                            ? `${request.feature_group.color}20`
                            : '#f3f4f6',
                          border: `1px solid ${request.feature_group.color || '#e5e7eb'}`,
                        }}
                      >
                        {request.feature_group.name}
                      </span>
                    )}
                    {request.feature && (
                      <span
                        style={{
                          ...styles.badge,
                          color: '#374151',
                          backgroundColor: '#f3f4f6',
                          border: '1px solid #e5e7eb',
                        }}
                      >
                        {request.feature.name}
                      </span>
                    )}
                  </div>
                  <p style={styles.requestMessage}>{request.message || 'No message provided'}</p>
                  <div style={styles.requestMeta}>
                    <span>{formatDate(request.created_at)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={styles.container} className={`census-hc ${className || ''}`}>
      <style>{hoverStyles}</style>

      {/* Tabs */}
      {tabs.length > 1 && (
        <div style={styles.tabs}>
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                ...styles.tab,
                ...(activeTab === tab ? styles.tabActive : {}),
              }}
              className={activeTab !== tab ? 'census-tab' : undefined}
            >
              {mergedLabels[tab]}
            </button>
          ))}
        </div>
      )}

      <div style={styles.grid}>
        {/* Sidebar */}
        <aside style={styles.sidebar}>
          {/* Search */}
          {showSearch && activeTab === 'articles' && (
            <div style={styles.searchContainer}>
              <div style={styles.searchIcon}><SearchIcon /></div>
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={styles.searchInput}
                className="census-search-input"
              />
            </div>
          )}

          {/* Feature Groups */}
          {activeTab === 'articles' && featureGroups.length > 0 && (
            <nav>
              <h3 style={styles.sectionTitle}>Features</h3>
              <ul style={styles.navList}>
                <li>
                  <button
                    onClick={() => setSelectedFeatureId(null)}
                    style={{
                      ...styles.navItem,
                      ...(!selectedFeatureId ? styles.navItemActive : {}),
                    }}
                    className={selectedFeatureId ? 'census-nav-item' : undefined}
                  >
                    All Articles
                  </button>
                </li>
                {featureGroups.map((group) => (
                  <li key={group.id}>
                    <button
                      onClick={() => toggleGroup(group.id)}
                      style={styles.navItem}
                      className="census-nav-item"
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <LayersIcon />
                        {group.name}
                      </span>
                      {expandedGroups.has(group.id) ? <ChevronDownIcon /> : <ChevronRightIcon />}
                    </button>
                    {expandedGroups.has(group.id) && group.features.length > 0 && (
                      <ul style={styles.subNav}>
                        {group.features.map((feature) => (
                          <li key={feature.id}>
                            <button
                              onClick={() => setSelectedFeatureId(feature.id)}
                              style={{
                                ...styles.navItem,
                                padding: '6px 12px',
                                fontSize: '13px',
                                ...(selectedFeatureId === feature.id ? styles.navItemActive : {}),
                              }}
                              className={selectedFeatureId !== feature.id ? 'census-nav-item' : undefined}
                            >
                              {feature.name}
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            </nav>
          )}
        </aside>

        {/* Main Content */}
        <main style={styles.main}>
          {activeTab === 'articles' && renderArticles()}
          {activeTab === 'requests' && renderRequests()}
        </main>
      </div>
    </div>
  );
}
