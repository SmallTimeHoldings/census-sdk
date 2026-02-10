import { useState, useMemo } from 'react';
import { useArticles, useArticle } from '../hooks';
import { useCensusContext } from '../context';
import type { KnowledgeBaseProps, Article, CensusTheme } from '../../types';

const defaultStyles = {
  container: {
    fontFamily: 'system-ui, -apple-system, sans-serif',
    maxWidth: '800px',
  },
  searchInput: {
    width: '100%',
    padding: '12px 16px',
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    fontSize: '15px',
    marginBottom: '24px',
    boxSizing: 'border-box' as const,
  },
  categoryButton: {
    padding: '8px 16px',
    border: '1px solid #e0e0e0',
    borderRadius: '20px',
    cursor: 'pointer',
    fontSize: '13px',
    backgroundColor: 'white',
    transition: 'all 0.2s',
    marginRight: '8px',
    marginBottom: '8px',
  },
  articleCard: {
    padding: '20px',
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    marginBottom: '12px',
    cursor: 'pointer',
    transition: 'border-color 0.2s',
    backgroundColor: 'white',
  },
  articleTitle: {
    margin: '0 0 8px 0',
    fontSize: '16px',
    fontWeight: '600' as const,
  },
  articleDescription: {
    margin: 0,
    fontSize: '14px',
    color: '#666',
    lineHeight: 1.5,
  },
  articleMeta: {
    display: 'flex',
    gap: '16px',
    marginTop: '12px',
    fontSize: '12px',
    color: '#999',
  },
  backButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '8px 0',
    border: 'none',
    background: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    color: '#666',
    marginBottom: '16px',
  },
  articleContent: {
    lineHeight: 1.7,
    fontSize: '15px',
  },
  loading: {
    textAlign: 'center' as const,
    padding: '40px',
    color: '#666',
  },
  error: {
    padding: '20px',
    backgroundColor: '#fef2f2',
    borderRadius: '8px',
    color: '#b91c1c',
    textAlign: 'center' as const,
  },
  empty: {
    textAlign: 'center' as const,
    padding: '40px',
    color: '#666',
  },
};

function getThemeStyles(theme: CensusTheme) {
  return {
    primaryColor: theme.primaryColor || '#000000',
    textColor: theme.textColor || '#333333',
    backgroundColor: theme.backgroundColor || '#ffffff',
    borderRadius: theme.borderRadius || '8px',
    fontFamily: theme.fontFamily || 'system-ui, -apple-system, sans-serif',
  };
}

/**
 * Embeddable knowledge base component.
 * Displays a searchable list of articles with full article view.
 *
 * @example
 * ```tsx
 * import { KnowledgeBase } from '@census-ai/census-sdk/react';
 *
 * function HelpPage() {
 *   return (
 *     <div className="help-container">
 *       <h1>Help Center</h1>
 *       <KnowledgeBase
 *         showSearch={true}
 *         showCategories={true}
 *       />
 *     </div>
 *   );
 * }
 * ```
 */
export function KnowledgeBase({
  showSearch = true,
  showCategories = true,
  defaultCategory,
  theme: themeProp,
  className,
  onArticleView,
}: KnowledgeBaseProps) {
  const { theme: contextTheme } = useCensusContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(defaultCategory);
  const [selectedArticleSlug, setSelectedArticleSlug] = useState<string | null>(null);

  const theme = { ...contextTheme, ...themeProp };
  const themeStyles = getThemeStyles(theme);

  const {
    articles,
    isLoading: isLoadingArticles,
    error: articlesError,
  } = useArticles({
    category: selectedCategory,
    search: searchQuery || undefined,
  });

  const {
    article: selectedArticle,
    isLoading: isLoadingArticle,
    error: articleError,
  } = useArticle(selectedArticleSlug || '');

  // Extract unique categories
  const categories = useMemo(() => {
    const cats = new Set<string>();
    articles.forEach((article) => {
      if (article.category) {
        cats.add(article.category);
      }
    });
    return Array.from(cats).sort();
  }, [articles]);

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
      return (
        <div style={{ ...defaultStyles.container, fontFamily: themeStyles.fontFamily }} className={className}>
          <div style={defaultStyles.loading}>Loading article...</div>
        </div>
      );
    }

    if (articleError) {
      return (
        <div style={{ ...defaultStyles.container, fontFamily: themeStyles.fontFamily }} className={className}>
          <button onClick={handleBack} style={defaultStyles.backButton}>
            ← Back to articles
          </button>
          <div style={defaultStyles.error}>Failed to load article. Please try again.</div>
        </div>
      );
    }

    if (!selectedArticle) {
      return (
        <div style={{ ...defaultStyles.container, fontFamily: themeStyles.fontFamily }} className={className}>
          <button onClick={handleBack} style={defaultStyles.backButton}>
            ← Back to articles
          </button>
          <div style={defaultStyles.empty}>Article not found.</div>
        </div>
      );
    }

    return (
      <div style={{ ...defaultStyles.container, fontFamily: themeStyles.fontFamily }} className={className}>
        <button onClick={handleBack} style={defaultStyles.backButton}>
          ← Back to articles
        </button>
        <article>
          <h1 style={{ margin: '0 0 16px 0', color: themeStyles.textColor }}>
            {selectedArticle.title}
          </h1>
          {selectedArticle.read_time_minutes && (
            <div style={{ fontSize: '14px', color: '#666', marginBottom: '24px' }}>
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
    <div style={{ ...defaultStyles.container, fontFamily: themeStyles.fontFamily }} className={className}>
      {/* Search */}
      {showSearch && (
        <input
          type="text"
          placeholder="Search articles..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={defaultStyles.searchInput}
        />
      )}

      {/* Categories */}
      {showCategories && categories.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <button
            onClick={() => setSelectedCategory(undefined)}
            style={{
              ...defaultStyles.categoryButton,
              backgroundColor: !selectedCategory ? themeStyles.primaryColor : 'white',
              color: !selectedCategory ? 'white' : themeStyles.textColor,
              borderColor: !selectedCategory ? themeStyles.primaryColor : '#e0e0e0',
            }}
          >
            All
          </button>
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              style={{
                ...defaultStyles.categoryButton,
                backgroundColor: selectedCategory === category ? themeStyles.primaryColor : 'white',
                color: selectedCategory === category ? 'white' : themeStyles.textColor,
                borderColor: selectedCategory === category ? themeStyles.primaryColor : '#e0e0e0',
              }}
            >
              {category}
            </button>
          ))}
        </div>
      )}

      {/* Loading */}
      {isLoadingArticles && <div style={defaultStyles.loading}>Loading articles...</div>}

      {/* Error */}
      {articlesError && (
        <div style={defaultStyles.error}>Failed to load articles. Please try again.</div>
      )}

      {/* Empty state */}
      {!isLoadingArticles && !articlesError && articles.length === 0 && (
        <div style={defaultStyles.empty}>
          {searchQuery
            ? `No articles found for "${searchQuery}"`
            : 'No articles available yet.'}
        </div>
      )}

      {/* Articles list */}
      {!isLoadingArticles && !articlesError && articles.length > 0 && (
        <div>
          {articles.map((article) => (
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
