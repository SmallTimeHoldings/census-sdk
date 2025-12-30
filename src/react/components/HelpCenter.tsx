'use client';

import { useState, useMemo } from 'react';
import { useArticles, useArticle, useRequests, useFeatureGroups } from '../hooks';
import { useCensusContext } from '../context';
import type {
  HelpCenterProps,
  HelpCenterTab,
  Article,
  Request,
  Feature,
  FeatureGroup,
  FeedbackType,
  CensusTheme,
} from '../../types';

// ============================================================================
// Styles
// ============================================================================

const defaultStyles = {
  container: {
    fontFamily: 'system-ui, -apple-system, sans-serif',
    display: 'flex',
    minHeight: '400px',
  },
  // Left sidebar
  sidebar: {
    width: '240px',
    flexShrink: 0,
    borderRight: '1px solid #e5e7eb',
    paddingRight: '16px',
    marginRight: '24px',
  },
  sidebarSection: {
    marginBottom: '24px',
  },
  sidebarLabel: {
    fontSize: '11px',
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    color: '#6b7280',
    marginBottom: '8px',
    paddingLeft: '8px',
  },
  sidebarItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 12px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    color: '#374151',
    transition: 'background-color 0.15s, color 0.15s',
    border: 'none',
    background: 'none',
    width: '100%',
    textAlign: 'left' as const,
  },
  sidebarItemActive: {
    backgroundColor: '#f3f4f6',
    color: '#111827',
    fontWeight: 500,
  },
  sidebarFeature: {
    padding: '6px 12px 6px 32px',
    fontSize: '13px',
  },
  sidebarBadge: {
    marginLeft: 'auto',
    padding: '2px 6px',
    borderRadius: '9999px',
    fontSize: '11px',
    fontWeight: 500,
    backgroundColor: '#e5e7eb',
    color: '#374151',
  },
  // Main content
  main: {
    flex: 1,
    minWidth: 0,
  },
  // Tabs
  tabs: {
    display: 'flex',
    gap: '4px',
    marginBottom: '24px',
    borderBottom: '1px solid #e5e7eb',
  },
  tab: {
    padding: '12px 20px',
    border: 'none',
    background: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 500,
    color: '#6b7280',
    borderBottom: '2px solid transparent',
    marginBottom: '-1px',
    transition: 'color 0.15s, border-color 0.15s',
  },
  tabActive: {
    color: '#111827',
    borderBottomColor: '#111827',
  },
  tabBadge: {
    marginLeft: '6px',
    padding: '2px 6px',
    borderRadius: '9999px',
    fontSize: '11px',
    fontWeight: 600,
    backgroundColor: '#e5e7eb',
    color: '#374151',
  },
  // Feature group cards
  groupCardsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: '16px',
    marginBottom: '24px',
  },
  groupCard: {
    padding: '20px',
    border: '1px solid #e5e7eb',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'border-color 0.15s, box-shadow 0.15s',
    backgroundColor: 'white',
  },
  groupCardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '8px',
  },
  groupCardIcon: {
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '20px',
  },
  groupCardName: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#111827',
    margin: 0,
  },
  groupCardMeta: {
    fontSize: '13px',
    color: '#6b7280',
    marginTop: '4px',
  },
  // Search
  searchInput: {
    width: '100%',
    padding: '10px 14px',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    fontSize: '14px',
    marginBottom: '20px',
    boxSizing: 'border-box' as const,
  },
  // Article cards
  articleCard: {
    padding: '16px',
    border: '1px solid #e5e7eb',
    borderRadius: '10px',
    marginBottom: '12px',
    cursor: 'pointer',
    transition: 'border-color 0.15s, box-shadow 0.15s',
    backgroundColor: 'white',
  },
  articleTitle: {
    margin: '0 0 6px 0',
    fontSize: '15px',
    fontWeight: 600,
  },
  articleDescription: {
    margin: 0,
    fontSize: '14px',
    color: '#6b7280',
    lineHeight: 1.5,
  },
  articleMeta: {
    display: 'flex',
    gap: '12px',
    marginTop: '10px',
    fontSize: '12px',
    color: '#9ca3af',
  },
  // Article detail
  backButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 0',
    border: 'none',
    background: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    color: '#6b7280',
    marginBottom: '16px',
  },
  articleContent: {
    lineHeight: 1.7,
    fontSize: '15px',
  },
  // Request cards
  requestCard: {
    border: '1px solid #e5e7eb',
    borderRadius: '10px',
    padding: '16px',
    backgroundColor: '#ffffff',
    marginBottom: '12px',
    transition: 'border-color 0.15s',
  },
  requestHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '8px',
  },
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '3px 10px',
    borderRadius: '9999px',
    fontSize: '12px',
    fontWeight: 500,
  },
  requestMessage: {
    fontSize: '14px',
    color: '#111827',
    margin: 0,
    lineHeight: 1.5,
  },
  requestMeta: {
    display: 'flex',
    gap: '12px',
    marginTop: '10px',
    fontSize: '12px',
    color: '#9ca3af',
  },
  // Section header
  sectionHeader: {
    marginBottom: '16px',
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: 600,
    color: '#111827',
    margin: '0 0 4px 0',
  },
  sectionDescription: {
    fontSize: '14px',
    color: '#6b7280',
    margin: 0,
  },
  // States
  loading: {
    textAlign: 'center' as const,
    padding: '40px',
    color: '#6b7280',
  },
  error: {
    padding: '20px',
    backgroundColor: '#fef2f2',
    borderRadius: '10px',
    color: '#b91c1c',
    textAlign: 'center' as const,
  },
  empty: {
    textAlign: 'center' as const,
    padding: '48px 24px',
    color: '#6b7280',
  },
  emptyIcon: {
    width: '48px',
    height: '48px',
    margin: '0 auto 16px',
    color: '#d1d5db',
  },
};

// Type and status configs for requests
const typeConfig: Record<FeedbackType, { label: string; color: string; bg: string }> = {
  feedback: { label: 'Feedback', color: '#2563eb', bg: '#dbeafe' },
  bug_report: { label: 'Bug', color: '#dc2626', bg: '#fee2e2' },
  feature_request: { label: 'Feature', color: '#d97706', bg: '#fef3c7' },
  article_rating: { label: 'Rating', color: '#7c3aed', bg: '#ede9fe' },
};

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  new: { label: 'New', color: '#6b7280', bg: '#f3f4f6' },
  planned: { label: 'Planned', color: '#2563eb', bg: '#dbeafe' },
  in_progress: { label: 'In Progress', color: '#d97706', bg: '#fef3c7' },
  resolved: { label: 'Resolved', color: '#059669', bg: '#d1fae5' },
  closed: { label: 'Closed', color: '#6b7280', bg: '#f3f4f6' },
};

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function getThemeStyles(theme: CensusTheme) {
  return {
    primaryColor: theme.primaryColor || '#111827',
    textColor: theme.textColor || '#111827',
    backgroundColor: theme.backgroundColor || '#ffffff',
    borderRadius: theme.borderRadius || '10px',
    fontFamily: theme.fontFamily || 'system-ui, -apple-system, sans-serif',
  };
}

// Default tab labels
const defaultTabLabels: Record<HelpCenterTab, string> = {
  articles: 'Articles',
  requests: 'My Requests',
};

// ============================================================================
// Feature Group Card Component
// ============================================================================

function FeatureGroupCard({
  group,
  onClick,
}: {
  group: FeatureGroup;
  onClick: () => void;
}) {
  return (
    <div
      style={defaultStyles.groupCard}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onClick();
      }}
    >
      <div>
        <h3 style={defaultStyles.groupCardName}>{group.name}</h3>
        <p style={defaultStyles.groupCardMeta}>
          {group.feature_count} feature{group.feature_count !== 1 ? 's' : ''} · {group.article_count} article
          {group.article_count !== 1 ? 's' : ''}
        </p>
      </div>
      {group.description && (
        <p style={{ ...defaultStyles.articleDescription, marginTop: '8px' }}>{group.description}</p>
      )}
    </div>
  );
}

// ============================================================================
// Articles Content (for a specific feature or all)
// ============================================================================

function ArticlesContent({
  featureId,
  featureName,
  showSearch,
  themeStyles,
  onArticleView,
  onBack,
}: {
  featureId?: string;
  featureName?: string;
  showSearch: boolean;
  themeStyles: ReturnType<typeof getThemeStyles>;
  onArticleView?: (article: Article) => void;
  onBack?: () => void;
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArticleSlug, setSelectedArticleSlug] = useState<string | null>(null);

  const {
    articles,
    isLoading: isLoadingArticles,
    error: articlesError,
  } = useArticles({
    search: searchQuery || undefined,
  });

  const {
    article: selectedArticle,
    isLoading: isLoadingArticle,
    error: articleError,
  } = useArticle(selectedArticleSlug || '');

  // Filter articles by feature if specified
  const filteredArticles = useMemo(() => {
    if (!featureId) return articles;
    return articles.filter((a) => a.features?.id === featureId);
  }, [articles, featureId]);

  const handleArticleClick = (article: Article) => {
    setSelectedArticleSlug(article.slug);
    onArticleView?.(article);
  };

  const handleBack = () => {
    setSelectedArticleSlug(null);
  };

  // Article detail view
  if (selectedArticleSlug) {
    if (isLoadingArticle) {
      return <div style={defaultStyles.loading}>Loading article...</div>;
    }

    if (articleError) {
      return (
        <div>
          <button onClick={handleBack} style={defaultStyles.backButton}>
            ← Back to articles
          </button>
          <div style={defaultStyles.error}>Failed to load article.</div>
        </div>
      );
    }

    if (!selectedArticle) {
      return (
        <div>
          <button onClick={handleBack} style={defaultStyles.backButton}>
            ← Back to articles
          </button>
          <div style={defaultStyles.empty}>Article not found.</div>
        </div>
      );
    }

    return (
      <div>
        <button onClick={handleBack} style={defaultStyles.backButton}>
          ← Back to articles
        </button>
        <article>
          <h1 style={{ margin: '0 0 12px 0', fontSize: '24px', color: themeStyles.textColor }}>
            {selectedArticle.title}
          </h1>
          {selectedArticle.read_time_minutes && (
            <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '24px' }}>
              {selectedArticle.read_time_minutes} min read
            </div>
          )}
          {selectedArticle.content_html ? (
            <div
              style={{ ...defaultStyles.articleContent, color: themeStyles.textColor }}
              dangerouslySetInnerHTML={{ __html: selectedArticle.content_html }}
            />
          ) : (
            <div style={{ ...defaultStyles.articleContent, color: themeStyles.textColor }}>
              {typeof selectedArticle.content === 'string'
                ? selectedArticle.content
                : 'No content available.'}
            </div>
          )}
        </article>
      </div>
    );
  }

  // Articles list view
  return (
    <div>
      {featureName && onBack && (
        <div style={defaultStyles.sectionHeader}>
          <button onClick={onBack} style={defaultStyles.backButton}>
            ← Back to features
          </button>
          <h2 style={defaultStyles.sectionTitle}>{featureName}</h2>
          <p style={defaultStyles.sectionDescription}>Documentation and guides for this feature</p>
        </div>
      )}

      {showSearch && (
        <input
          type="text"
          placeholder="Search articles..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={defaultStyles.searchInput}
        />
      )}

      {isLoadingArticles && <div style={defaultStyles.loading}>Loading articles...</div>}

      {articlesError && (
        <div style={defaultStyles.error}>Failed to load articles. Please try again.</div>
      )}

      {!isLoadingArticles && !articlesError && filteredArticles.length === 0 && (
        <div style={defaultStyles.empty}>
          <svg style={defaultStyles.emptyIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
            />
          </svg>
          <p style={{ margin: 0, fontWeight: 500, color: '#111827' }}>
            {searchQuery ? `No articles found for "${searchQuery}"` : 'No articles yet'}
          </p>
          <p style={{ margin: '8px 0 0', fontSize: '14px' }}>Check back soon for helpful content.</p>
        </div>
      )}

      {!isLoadingArticles && !articlesError && filteredArticles.length > 0 && (
        <div>
          {filteredArticles.map((article) => (
            <div
              key={article.id}
              onClick={() => handleArticleClick(article)}
              style={defaultStyles.articleCard}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  handleArticleClick(article);
                }
              }}
            >
              <h3 style={{ ...defaultStyles.articleTitle, color: themeStyles.textColor }}>
                {article.title}
              </h3>
              {article.seo_description && (
                <p style={defaultStyles.articleDescription}>{article.seo_description}</p>
              )}
              <div style={defaultStyles.articleMeta}>
                {article.category && <span>{article.category}</span>}
                {article.read_time_minutes && <span>{article.read_time_minutes} min read</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Requests Tab Content
// ============================================================================

function RequestsContent({ onRequestClick }: { onRequestClick?: (request: Request) => void }) {
  const { isIdentified } = useCensusContext();
  const { requests, isLoading, error, refetch } = useRequests({ limit: 50 });

  if (!isIdentified) {
    return (
      <div style={defaultStyles.empty}>
        <p style={{ margin: 0, fontWeight: 500, color: '#111827' }}>Sign in required</p>
        <p style={{ margin: '8px 0 0', fontSize: '14px' }}>Please sign in to view your requests.</p>
      </div>
    );
  }

  if (isLoading) {
    return <div style={defaultStyles.loading}>Loading requests...</div>;
  }

  if (error) {
    return (
      <div style={defaultStyles.error}>
        <p>
          Failed to load requests.{' '}
          <button
            onClick={refetch}
            style={{
              color: 'inherit',
              textDecoration: 'underline',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Try again
          </button>
        </p>
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div style={defaultStyles.empty}>
        <svg style={defaultStyles.emptyIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
          />
        </svg>
        <p style={{ margin: 0, fontWeight: 500, color: '#111827' }}>No requests yet</p>
        <p style={{ margin: '8px 0 0', fontSize: '14px' }}>
          When you submit feedback, bug reports, or feature requests, they'll appear here.
        </p>
      </div>
    );
  }

  return (
    <div>
      {requests.map((request) => {
        const typeInfo = typeConfig[request.feedback_type] || typeConfig.feedback;
        const statusInfo = statusConfig[request.status] || statusConfig.new;

        return (
          <div
            key={request.id}
            style={defaultStyles.requestCard}
            onClick={() => onRequestClick?.(request)}
            role={onRequestClick ? 'button' : undefined}
            tabIndex={onRequestClick ? 0 : undefined}
            onKeyDown={
              onRequestClick
                ? (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      onRequestClick(request);
                    }
                  }
                : undefined
            }
          >
            <div style={defaultStyles.requestHeader}>
              <span
                style={{
                  ...defaultStyles.badge,
                  color: typeInfo.color,
                  backgroundColor: typeInfo.bg,
                }}
              >
                {typeInfo.label}
              </span>
              <span
                style={{
                  ...defaultStyles.badge,
                  color: statusInfo.color,
                  backgroundColor: statusInfo.bg,
                }}
              >
                {statusInfo.label}
              </span>
            </div>
            <p style={defaultStyles.requestMessage}>{request.message || 'No message provided'}</p>
            <div style={defaultStyles.requestMeta}>
              <span>{formatDate(request.created_at)}</span>
              {request.page_url && (
                <span
                  style={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    maxWidth: '200px',
                  }}
                >
                  From: {request.page_url}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ============================================================================
// Main HelpCenter Component
// ============================================================================

/**
 * Unified help center component with left navigation showing feature groups.
 *
 * @example
 * ```tsx
 * import { HelpCenter } from '@census-ai/census-sdk/react';
 *
 * function HelpPage() {
 *   return (
 *     <HelpCenter
 *       tabs={['articles', 'requests']}
 *       showSearch
 *     />
 *   );
 * }
 * ```
 */
export function HelpCenter({
  tabs = ['articles', 'requests'],
  defaultTab,
  tabLabels,
  showSearch = true,
  showCategories: _showCategories = true, // Reserved for future use
  theme: themeProp,
  className,
  onArticleView,
  onRequestClick,
  onTabChange,
}: HelpCenterProps) {
  void _showCategories; // Suppress unused warning
  const { theme: contextTheme } = useCensusContext();
  const theme = { ...contextTheme, ...themeProp };
  const themeStyles = getThemeStyles(theme);

  // Tab state
  const initialTab = defaultTab && tabs.includes(defaultTab) ? defaultTab : tabs[0];
  const [activeTab, setActiveTab] = useState<HelpCenterTab>(initialTab);

  // Navigation state
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [selectedFeature, setSelectedFeature] = useState<Feature | null>(null);

  // Data
  const { featureGroups, isLoading: isLoadingGroups } = useFeatureGroups();
  const { requests } = useRequests({ limit: 100 });

  const openRequestsCount = requests.filter((r) =>
    ['new', 'planned', 'in_progress'].includes(r.status)
  ).length;

  // Merge tab labels
  const mergedLabels = { ...defaultTabLabels, ...tabLabels };

  // Get selected group
  const selectedGroup = useMemo(
    () => featureGroups.find((g) => g.id === selectedGroupId) || null,
    [featureGroups, selectedGroupId]
  );

  const handleTabChange = (tab: HelpCenterTab) => {
    setActiveTab(tab);
    setSelectedGroupId(null);
    setSelectedFeature(null);
    onTabChange?.(tab);
  };

  const handleGroupClick = (group: FeatureGroup) => {
    setSelectedGroupId(group.id);
    setSelectedFeature(null);
  };

  const handleFeatureClick = (feature: Feature) => {
    setSelectedFeature(feature);
  };

  const handleBackToGroups = () => {
    setSelectedGroupId(null);
    setSelectedFeature(null);
  };

  const handleBackToFeatures = () => {
    setSelectedFeature(null);
  };

  // If only one tab, don't show tabs UI
  const showTabs = tabs.length > 1;

  return (
    <div style={{ ...defaultStyles.container, fontFamily: themeStyles.fontFamily }} className={className}>
      {/* Left Sidebar */}
      {activeTab === 'articles' && featureGroups.length > 0 && (
        <div style={defaultStyles.sidebar}>
          {/* Resources section - could add general links here */}
          <div style={defaultStyles.sidebarSection}>
            <div style={defaultStyles.sidebarLabel}>Resources</div>
            <button
              style={{
                ...defaultStyles.sidebarItem,
                ...(!selectedGroupId ? defaultStyles.sidebarItemActive : {}),
              }}
              onClick={handleBackToGroups}
            >
              <span>🏠</span>
              <span>All Features</span>
            </button>
          </div>

          {/* Feature Groups section */}
          <div style={defaultStyles.sidebarSection}>
            <div style={defaultStyles.sidebarLabel}>Features</div>
            {isLoadingGroups ? (
              <div style={{ padding: '8px 12px', fontSize: '13px', color: '#6b7280' }}>Loading...</div>
            ) : (
              featureGroups.map((group) => (
                <div key={group.id}>
                  <button
                    style={{
                      ...defaultStyles.sidebarItem,
                      ...(selectedGroupId === group.id ? defaultStyles.sidebarItemActive : {}),
                    }}
                    onClick={() => handleGroupClick(group)}
                  >
                    <span style={{ flex: 1 }}>{group.name}</span>
                    <span style={defaultStyles.sidebarBadge}>{group.feature_count}</span>
                  </button>
                  {/* Show features when group is selected */}
                  {selectedGroupId === group.id && (
                    <div>
                      {group.features.map((feature) => (
                        <button
                          key={feature.id}
                          style={{
                            ...defaultStyles.sidebarItem,
                            ...defaultStyles.sidebarFeature,
                            ...(selectedFeature?.id === feature.id ? defaultStyles.sidebarItemActive : {}),
                          }}
                          onClick={() => handleFeatureClick(feature)}
                        >
                          {feature.name}
                          {feature.article_count > 0 && (
                            <span style={defaultStyles.sidebarBadge}>{feature.article_count}</span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div style={defaultStyles.main}>
        {showTabs && (
          <div style={defaultStyles.tabs}>
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => handleTabChange(tab)}
                style={{
                  ...defaultStyles.tab,
                  ...(activeTab === tab ? defaultStyles.tabActive : {}),
                  ...(activeTab === tab
                    ? { borderBottomColor: themeStyles.primaryColor, color: themeStyles.primaryColor }
                    : {}),
                }}
              >
                {mergedLabels[tab]}
                {tab === 'requests' && openRequestsCount > 0 && (
                  <span style={defaultStyles.tabBadge}>{openRequestsCount}</span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Articles Tab Content */}
        {activeTab === 'articles' && (
          <>
            {/* Show feature group cards when nothing selected */}
            {!selectedGroupId && !selectedFeature && featureGroups.length > 0 && (
              <div>
                <div style={defaultStyles.sectionHeader}>
                  <h2 style={defaultStyles.sectionTitle}>Browse by Feature</h2>
                  <p style={defaultStyles.sectionDescription}>
                    Select a feature group to find relevant documentation
                  </p>
                </div>
                <div style={defaultStyles.groupCardsGrid}>
                  {featureGroups.map((group) => (
                    <FeatureGroupCard key={group.id} group={group} onClick={() => handleGroupClick(group)} />
                  ))}
                </div>
              </div>
            )}

            {/* Show features when group is selected but no feature */}
            {selectedGroup && !selectedFeature && (
              <div>
                <div style={defaultStyles.sectionHeader}>
                  <button onClick={handleBackToGroups} style={defaultStyles.backButton}>
                    ← Back to all features
                  </button>
                  <h2 style={defaultStyles.sectionTitle}>{selectedGroup.name}</h2>
                  {selectedGroup.description && (
                    <p style={defaultStyles.sectionDescription}>{selectedGroup.description}</p>
                  )}
                </div>
                <div style={defaultStyles.groupCardsGrid}>
                  {selectedGroup.features.map((feature) => (
                    <div
                      key={feature.id}
                      style={defaultStyles.groupCard}
                      onClick={() => handleFeatureClick(feature)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') handleFeatureClick(feature);
                      }}
                    >
                      <h3 style={defaultStyles.groupCardName}>{feature.name}</h3>
                      <p style={defaultStyles.groupCardMeta}>
                        {feature.article_count} article{feature.article_count !== 1 ? 's' : ''}
                      </p>
                      {feature.description && (
                        <p style={{ ...defaultStyles.articleDescription, marginTop: '8px' }}>
                          {feature.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Show articles when feature is selected */}
            {selectedFeature && (
              <ArticlesContent
                featureId={selectedFeature.id}
                featureName={selectedFeature.name}
                showSearch={showSearch}
                themeStyles={themeStyles}
                onArticleView={onArticleView}
                onBack={handleBackToFeatures}
              />
            )}

            {/* Fallback: show all articles if no feature groups */}
            {featureGroups.length === 0 && (
              <ArticlesContent
                showSearch={showSearch}
                themeStyles={themeStyles}
                onArticleView={onArticleView}
              />
            )}
          </>
        )}

        {/* Requests Tab Content */}
        {activeTab === 'requests' && <RequestsContent onRequestClick={onRequestClick} />}
      </div>
    </div>
  );
}
