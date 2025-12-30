'use client';

import { useState } from 'react';
import { KnowledgeBase } from './KnowledgeBase';
import { Requests } from './Requests';

export type HelpCenterTab = 'articles' | 'requests';

export interface HelpCenterProps {
  /**
   * Which tabs to show
   * @default ['articles', 'requests']
   */
  tabs?: HelpCenterTab[];

  /**
   * Default active tab
   * @default 'articles'
   */
  defaultTab?: HelpCenterTab;

  /**
   * Custom labels for tabs
   */
  tabLabels?: Partial<Record<HelpCenterTab, string>>;

  /**
   * Show search in knowledge base
   * @default true
   */
  showSearch?: boolean;

  /**
   * Show categories in knowledge base
   * @default true
   */
  showCategories?: boolean;

  /**
   * Custom CSS class
   */
  className?: string;
}

const defaultTabLabels: Record<HelpCenterTab, string> = {
  articles: 'Articles',
  requests: 'My Requests',
};

const defaultStyles = {
  container: {
    fontFamily: 'system-ui, -apple-system, sans-serif',
  },
  tabsContainer: {
    display: 'flex',
    gap: '4px',
    padding: '4px',
    backgroundColor: '#f3f4f6',
    borderRadius: '8px',
    marginBottom: '24px',
  },
  tab: {
    flex: 1,
    padding: '8px 16px',
    fontSize: '14px',
    fontWeight: 500,
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.15s',
    backgroundColor: 'transparent',
    color: '#6b7280',
  },
  tabActive: {
    backgroundColor: '#ffffff',
    color: '#111827',
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
  },
};

/**
 * HelpCenter component that combines KnowledgeBase and Requests with tabs.
 *
 * @example
 * ```tsx
 * import { CensusProvider, HelpCenter } from '@census-ai/census-sdk/react';
 *
 * function HelpPage() {
 *   return (
 *     <CensusProvider apiKey="cs_live_xxx">
 *       <HelpCenter
 *         tabs={['articles', 'requests']}
 *         defaultTab="articles"
 *         showSearch
 *       />
 *     </CensusProvider>
 *   );
 * }
 * ```
 */
export function HelpCenter({
  tabs = ['articles', 'requests'],
  defaultTab = 'articles',
  tabLabels = {},
  showSearch = true,
  showCategories = true,
  className,
}: HelpCenterProps) {
  const [activeTab, setActiveTab] = useState<HelpCenterTab>(defaultTab);

  const mergedLabels = { ...defaultTabLabels, ...tabLabels };

  // If only one tab, don't show tabs UI
  if (tabs.length === 1) {
    return (
      <div style={defaultStyles.container} className={className}>
        {tabs[0] === 'articles' && (
          <KnowledgeBase showSearch={showSearch} showCategories={showCategories} />
        )}
        {tabs[0] === 'requests' && <Requests />}
      </div>
    );
  }

  return (
    <div style={defaultStyles.container} className={className}>
      {/* Tabs */}
      <div style={defaultStyles.tabsContainer}>
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              ...defaultStyles.tab,
              ...(activeTab === tab ? defaultStyles.tabActive : {}),
            }}
          >
            {mergedLabels[tab]}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'articles' && tabs.includes('articles') && (
        <KnowledgeBase showSearch={showSearch} showCategories={showCategories} />
      )}

      {activeTab === 'requests' && tabs.includes('requests') && <Requests />}
    </div>
  );
}
