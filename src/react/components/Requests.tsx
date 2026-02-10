'use client';

import { useState, useCallback } from 'react';
import { useRequests } from '../hooks';
import { useCensusContext } from '../context';
import type { RequestsProps, Request, FeedbackType } from '../../types';

const defaultStyles = {
  container: {
    fontFamily: 'system-ui, -apple-system, sans-serif',
  },
  list: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
  },
  card: {
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    padding: '16px',
    backgroundColor: '#ffffff',
    cursor: 'pointer',
    transition: 'border-color 0.15s',
  },
  cardHover: {
    borderColor: '#d1d5db',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '8px',
    marginBottom: '8px',
  },
  badges: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '2px 8px',
    borderRadius: '9999px',
    fontSize: '12px',
    fontWeight: 500,
  },
  message: {
    fontSize: '14px',
    color: '#111827',
    margin: 0,
    lineHeight: 1.5,
  },
  meta: {
    display: 'flex',
    gap: '12px',
    marginTop: '8px',
    fontSize: '12px',
    color: '#6b7280',
  },
  empty: {
    textAlign: 'center' as const,
    padding: '32px 16px',
    color: '#6b7280',
  },
  emptyIcon: {
    width: '48px',
    height: '48px',
    margin: '0 auto 12px',
    color: '#d1d5db',
  },
  loading: {
    textAlign: 'center' as const,
    padding: '24px',
    color: '#6b7280',
  },
  error: {
    textAlign: 'center' as const,
    padding: '24px',
    color: '#dc2626',
  },
};

const typeConfig: Record<FeedbackType, { label: string; color: string; bg: string }> = {
  feedback: { label: 'Feedback', color: '#2563eb', bg: '#dbeafe' },
  bug_report: { label: 'Bug Report', color: '#dc2626', bg: '#fee2e2' },
  feature_request: { label: 'Feature Request', color: '#d97706', bg: '#fef3c7' },
  article_rating: { label: 'Article Rating', color: '#7c3aed', bg: '#ede9fe' },
};

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  new: { label: 'New', color: '#6b7280', bg: '#f3f4f6' },
  reviewed: { label: 'Reviewed', color: '#2563eb', bg: '#dbeafe' },
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

/**
 * Requests component for displaying user's submitted feedback and requests.
 *
 * @example
 * ```tsx
 * import { Requests } from '@census-ai/census-sdk/react';
 *
 * function MyRequestsPage() {
 *   return (
 *     <div>
 *       <h1>My Requests</h1>
 *       <Requests onRequestClick={(req) => console.log('Clicked:', req)} />
 *     </div>
 *   );
 * }
 * ```
 */
export function Requests({
  status,
  type,
  limit = 50,
  className,
  showEmptyState = true,
  onRequestClick,
}: RequestsProps) {
  const { isIdentified } = useCensusContext();
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const { requests, isLoading, error, refetch } = useRequests({
    status,
    type,
    limit,
  });

  const handleRequestClick = useCallback(
    (request: Request) => {
      onRequestClick?.(request);
    },
    [onRequestClick]
  );

  if (!isIdentified) {
    return showEmptyState ? (
      <div style={defaultStyles.empty}>
        <p>Please sign in to view your requests.</p>
      </div>
    ) : null;
  }

  if (isLoading) {
    return (
      <div style={defaultStyles.loading}>
        <p>Loading requests...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={defaultStyles.error}>
        <p>Failed to load requests. <button onClick={refetch} style={{ color: 'inherit', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer' }}>Try again</button></p>
      </div>
    );
  }

  if (requests.length === 0 && showEmptyState) {
    return (
      <div style={defaultStyles.empty}>
        <svg
          style={defaultStyles.emptyIcon}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
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
    <div style={defaultStyles.container} className={className}>
      <ul style={defaultStyles.list}>
        {requests.map((request) => {
          const typeInfo = typeConfig[request.feedback_type] || typeConfig.feedback;
          const statusInfo = statusConfig[request.status] || statusConfig.new;
          const isHovered = hoveredId === request.id;

          return (
            <li
              key={request.id}
              style={{
                ...defaultStyles.card,
                ...(isHovered ? defaultStyles.cardHover : {}),
              }}
              onMouseEnter={() => setHoveredId(request.id)}
              onMouseLeave={() => setHoveredId(null)}
              onClick={() => handleRequestClick(request)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  handleRequestClick(request);
                }
              }}
            >
              <div style={defaultStyles.header}>
                <div style={defaultStyles.badges}>
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
              </div>
              <p style={defaultStyles.message}>
                {request.message || 'No message provided'}
              </p>
              <div style={defaultStyles.meta}>
                <span>{formatDate(request.created_at)}</span>
                {request.page_url && (
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '200px' }}>
                    From: {request.page_url}
                  </span>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
