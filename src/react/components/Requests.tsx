'use client';

import { useState, useCallback } from 'react';
import { useRequests, useVote, useFeedback } from '../hooks';
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
    transition: 'border-color 0.15s, box-shadow 0.15s',
  },
  cardHover: {
    borderColor: '#d1d5db',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
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
  voteButton: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    padding: '8px',
    borderRadius: '6px',
    border: '1px solid #e5e7eb',
    backgroundColor: '#ffffff',
    cursor: 'pointer',
    minWidth: '48px',
    transition: 'all 0.15s',
  },
  voteButtonActive: {
    backgroundColor: '#dbeafe',
    borderColor: '#2563eb',
    color: '#2563eb',
  },
  voteCount: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#111827',
  },
  cardWithVote: {
    display: 'flex',
    gap: '12px',
  },
  cardContent: {
    flex: 1,
  },
  form: {
    marginBottom: '16px',
    padding: '16px',
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
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
    color: '#111827',
    margin: 0,
  },
  typeSelector: {
    display: 'flex',
    gap: '8px',
    marginBottom: '12px',
  },
  typeButton: {
    padding: '6px 12px',
    borderRadius: '6px',
    border: '1px solid #e5e7eb',
    backgroundColor: '#ffffff',
    fontSize: '13px',
    cursor: 'pointer',
    transition: 'all 0.15s',
  },
  typeButtonActive: {
    backgroundColor: '#111827',
    borderColor: '#111827',
    color: '#ffffff',
  },
  textarea: {
    width: '100%',
    padding: '10px 12px',
    borderRadius: '6px',
    border: '1px solid #e5e7eb',
    fontSize: '14px',
    resize: 'vertical' as const,
    minHeight: '80px',
    fontFamily: 'inherit',
    marginBottom: '12px',
  },
  submitButton: {
    padding: '8px 16px',
    borderRadius: '6px',
    border: 'none',
    backgroundColor: '#111827',
    color: '#ffffff',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'opacity 0.15s',
  },
  successMessage: {
    padding: '12px',
    backgroundColor: '#d1fae5',
    borderRadius: '6px',
    color: '#059669',
    fontSize: '14px',
    marginBottom: '16px',
  },
  ownBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '2px 6px',
    borderRadius: '9999px',
    fontSize: '11px',
    fontWeight: 500,
    backgroundColor: '#f3f4f6',
    color: '#6b7280',
    marginLeft: '6px',
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

const FORM_TYPES: { value: FeedbackType; label: string }[] = [
  { value: 'feedback', label: 'Feedback' },
  { value: 'bug_report', label: 'Bug' },
  { value: 'feature_request', label: 'Feature' },
];

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
  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState<FeedbackType>('feedback');
  const [formMessage, setFormMessage] = useState('');
  const [localVotes, setLocalVotes] = useState<Record<string, { count: number; hasVoted: boolean }>>({});

  const { requests, isLoading, error, refetch, settings } = useRequests({
    status,
    type,
    limit,
  });

  const { vote, isVoting } = useVote();
  const { submitFeedback, isSubmitting, isSuccess, reset } = useFeedback();

  const handleRequestClick = useCallback(
    (request: Request) => {
      onRequestClick?.(request);
    },
    [onRequestClick]
  );

  const handleVote = useCallback(
    async (feedbackId: string, currentCount: number, currentHasVoted: boolean) => {
      if (isVoting) return;

      // Optimistic update
      setLocalVotes((prev) => ({
        ...prev,
        [feedbackId]: {
          count: currentHasVoted ? currentCount - 1 : currentCount + 1,
          hasVoted: !currentHasVoted,
        },
      }));

      try {
        const result = await vote(feedbackId);
        // Update with actual result
        setLocalVotes((prev) => ({
          ...prev,
          [feedbackId]: {
            count: result.vote_count,
            hasVoted: result.user_has_voted,
          },
        }));
      } catch {
        // Revert on error
        setLocalVotes((prev) => ({
          ...prev,
          [feedbackId]: {
            count: currentCount,
            hasVoted: currentHasVoted,
          },
        }));
      }
    },
    [vote, isVoting]
  );

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
        // Refetch after a short delay to allow DB to update
        setTimeout(() => {
          refetch();
          reset();
        }, 500);
      } catch {
        // Error is handled by useFeedback hook
      }
    },
    [formType, formMessage, isSubmitting, submitFeedback, refetch, reset]
  );

  const getVoteInfo = (request: Request) => {
    const local = localVotes[request.id];
    return {
      count: local?.count ?? request.vote_count,
      hasVoted: local?.hasVoted ?? request.user_has_voted,
    };
  };

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

  // Request creation form component
  const renderForm = () => {
    if (!settings.allowRequestCreation) return null;

    if (isSuccess) {
      return (
        <div style={defaultStyles.successMessage}>
          Thanks for your feedback! It has been submitted.
        </div>
      );
    }

    if (!showForm) {
      return (
        <button
          onClick={() => setShowForm(true)}
          style={{
            ...defaultStyles.submitButton,
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Request
        </button>
      );
    }

    return (
      <form onSubmit={handleSubmit} style={defaultStyles.form}>
        <div style={defaultStyles.formHeader}>
          <p style={defaultStyles.formTitle}>Submit a request</p>
          <button
            type="button"
            onClick={() => setShowForm(false)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}
          >
            ✕
          </button>
        </div>
        <div style={defaultStyles.typeSelector}>
          {FORM_TYPES.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setFormType(t.value)}
              style={{
                ...defaultStyles.typeButton,
                ...(formType === t.value ? defaultStyles.typeButtonActive : {}),
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
          style={defaultStyles.textarea}
          required
        />
        <button
          type="submit"
          style={{
            ...defaultStyles.submitButton,
            opacity: isSubmitting ? 0.6 : 1,
          }}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Submitting...' : 'Submit'}
        </button>
      </form>
    );
  };

  if (requests.length === 0 && showEmptyState) {
    return (
      <div style={defaultStyles.container} className={className}>
        {renderForm()}
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
            {settings.allowRequestCreation
              ? 'Submit your first request above.'
              : 'When you submit feedback, bug reports, or feature requests, they\'ll appear here.'}
          </p>
        </div>
      </div>
    );
  }

  const canVote = settings.allowVoting && settings.feedbackVisibility !== 'own';

  return (
    <div style={defaultStyles.container} className={className}>
      {renderForm()}
      <ul style={defaultStyles.list}>
        {requests.map((request) => {
          const typeInfo = typeConfig[request.feedback_type] || typeConfig.feedback;
          const statusInfo = statusConfig[request.status] || statusConfig.new;
          const isHovered = hoveredId === request.id;
          const voteInfo = getVoteInfo(request);

          return (
            <li
              key={request.id}
              style={{
                ...defaultStyles.card,
                ...(isHovered ? defaultStyles.cardHover : {}),
              }}
              onMouseEnter={() => setHoveredId(request.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              <div style={canVote ? defaultStyles.cardWithVote : undefined}>
                {canVote && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleVote(request.id, voteInfo.count, voteInfo.hasVoted);
                    }}
                    disabled={isVoting}
                    style={{
                      ...defaultStyles.voteButton,
                      ...(voteInfo.hasVoted ? defaultStyles.voteButtonActive : {}),
                    }}
                    title={voteInfo.hasVoted ? 'Remove vote' : 'Upvote this request'}
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill={voteInfo.hasVoted ? 'currentColor' : 'none'}
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 15l7-7 7 7"
                      />
                    </svg>
                    <span style={{
                      ...defaultStyles.voteCount,
                      ...(voteInfo.hasVoted ? { color: '#2563eb' } : {}),
                    }}>
                      {voteInfo.count}
                    </span>
                  </button>
                )}
                <div
                  style={canVote ? defaultStyles.cardContent : undefined}
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
                      {request.is_own && (
                        <span style={defaultStyles.ownBadge}>You</span>
                      )}
                    </div>
                  </div>
                  <p style={defaultStyles.message}>
                    {request.message || 'No message provided'}
                  </p>
                  <div style={defaultStyles.meta}>
                    <span>{formatDate(request.created_at)}</span>
                    {!canVote && voteInfo.count > 0 && (
                      <span>{voteInfo.count} vote{voteInfo.count !== 1 ? 's' : ''}</span>
                    )}
                    {request.page_url && (
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '200px' }}>
                        From: {request.page_url}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
