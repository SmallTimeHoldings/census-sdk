import { useState, useCallback } from 'react';
import { useFeedback } from '../hooks';
import { useCensusContext } from '../context';
import type { FeedbackButtonProps, FeedbackType, CensusTheme } from '../../types';

const defaultStyles = {
  button: {
    position: 'fixed' as const,
    padding: '12px 20px',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    fontSize: '14px',
    fontWeight: '500' as const,
    transition: 'transform 0.2s',
    zIndex: 9999,
  },
  modal: {
    position: 'fixed' as const,
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 10000,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '24px',
    width: '100%',
    maxWidth: '400px',
    margin: '16px',
    boxShadow: '0 20px 50px rgba(0, 0, 0, 0.2)',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #e0e0e0',
    borderRadius: '6px',
    fontSize: '14px',
    marginBottom: '12px',
    boxSizing: 'border-box' as const,
    fontFamily: 'inherit',
  },
  textarea: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #e0e0e0',
    borderRadius: '6px',
    fontSize: '14px',
    marginBottom: '16px',
    minHeight: '100px',
    resize: 'vertical' as const,
    boxSizing: 'border-box' as const,
    fontFamily: 'inherit',
  },
  submitButton: {
    width: '100%',
    padding: '12px',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500' as const,
    transition: 'opacity 0.2s',
  },
  typeButton: {
    padding: '8px 16px',
    border: '1px solid #e0e0e0',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px',
    backgroundColor: 'white',
    transition: 'all 0.2s',
    marginRight: '8px',
    marginBottom: '8px',
  },
};

const positionStyles = {
  'bottom-right': { bottom: '20px', right: '20px' },
  'bottom-left': { bottom: '20px', left: '20px' },
  'top-right': { top: '20px', right: '20px' },
  'top-left': { top: '20px', left: '20px' },
};

const feedbackTypeLabels: Record<FeedbackType, string> = {
  feedback: 'General Feedback',
  bug_report: 'Bug Report',
  feature_request: 'Feature Request',
  article_rating: 'Article Rating',
};

const feedbackTypeEmojis: Record<FeedbackType, string> = {
  feedback: '💬',
  bug_report: '🐛',
  feature_request: '💡',
  article_rating: '⭐',
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
 * Floating feedback button component.
 * Displays a button that opens a modal for submitting feedback.
 *
 * @example
 * ```tsx
 * import { FeedbackButton } from '@census-ai/census-sdk/react';
 *
 * function App() {
 *   return (
 *     <>
 *       <YourApp />
 *       <FeedbackButton
 *         position="bottom-right"
 *         text="Send Feedback"
 *         allowedTypes={['feedback', 'bug_report', 'feature_request']}
 *       />
 *     </>
 *   );
 * }
 * ```
 */
export function FeedbackButton({
  position = 'bottom-right',
  text = 'Feedback',
  allowedTypes = ['feedback', 'bug_report', 'feature_request'],
  theme: themeProp,
  onSubmit,
  onError,
  children,
}: FeedbackButtonProps) {
  const { theme: contextTheme } = useCensusContext();
  const { submitFeedback, isSubmitting, isSuccess, reset } = useFeedback();

  const [isOpen, setIsOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<FeedbackType>(allowedTypes[0]);
  const [message, setMessage] = useState('');

  const theme = { ...contextTheme, ...themeProp };
  const themeStyles = getThemeStyles(theme);

  const handleOpen = useCallback(() => {
    setIsOpen(true);
    reset();
  }, [reset]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setMessage('');
    setSelectedType(allowedTypes[0]);
  }, [allowedTypes]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      const feedbackData = {
        type: selectedType,
        message,
      };

      try {
        await submitFeedback(feedbackData);
        onSubmit?.(feedbackData);
        // Close after a short delay to show success
        setTimeout(handleClose, 1500);
      } catch (err) {
        onError?.(err instanceof Error ? err : new Error('Failed to submit feedback'));
      }
    },
    [selectedType, message, submitFeedback, onSubmit, onError, handleClose]
  );

  // Custom trigger
  if (children) {
    return (
      <>
        <div onClick={handleOpen} style={{ cursor: 'pointer' }}>
          {children}
        </div>
        {isOpen && (
          <FeedbackModal
            isOpen={isOpen}
            onClose={handleClose}
            selectedType={selectedType}
            onTypeChange={setSelectedType}
            allowedTypes={allowedTypes}
            message={message}
            onMessageChange={setMessage}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            isSuccess={isSuccess}
            themeStyles={themeStyles}
          />
        )}
      </>
    );
  }

  return (
    <>
      <button
        onClick={handleOpen}
        style={{
          ...defaultStyles.button,
          ...positionStyles[position],
          backgroundColor: themeStyles.primaryColor,
          color: 'white',
          borderRadius: themeStyles.borderRadius,
          fontFamily: themeStyles.fontFamily,
        }}
        aria-label="Open feedback form"
      >
        {text}
      </button>
      {isOpen && (
        <FeedbackModal
          isOpen={isOpen}
          onClose={handleClose}
          selectedType={selectedType}
          onTypeChange={setSelectedType}
          allowedTypes={allowedTypes}
          message={message}
          onMessageChange={setMessage}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          isSuccess={isSuccess}
          themeStyles={themeStyles}
        />
      )}
    </>
  );
}

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedType: FeedbackType;
  onTypeChange: (type: FeedbackType) => void;
  allowedTypes: FeedbackType[];
  message: string;
  onMessageChange: (message: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isSubmitting: boolean;
  isSuccess: boolean;
  themeStyles: ReturnType<typeof getThemeStyles>;
}

function FeedbackModal({
  isOpen,
  onClose,
  selectedType,
  onTypeChange,
  allowedTypes,
  message,
  onMessageChange,
  onSubmit,
  isSubmitting,
  isSuccess,
  themeStyles,
}: FeedbackModalProps) {
  if (!isOpen) return null;

  if (isSuccess) {
    return (
      <div style={defaultStyles.modal} onClick={onClose}>
        <div
          style={{
            ...defaultStyles.modalContent,
            textAlign: 'center',
            fontFamily: themeStyles.fontFamily,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎉</div>
          <h3 style={{ margin: '0 0 8px 0', color: themeStyles.textColor }}>
            Thanks for your feedback!
          </h3>
          <p style={{ margin: 0, color: '#666' }}>We appreciate you taking the time to share.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={defaultStyles.modal} onClick={onClose}>
      <div
        style={{
          ...defaultStyles.modalContent,
          fontFamily: themeStyles.fontFamily,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
          }}
        >
          <h3 style={{ margin: 0, color: themeStyles.textColor }}>Send Feedback</h3>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#999',
              padding: '0',
              lineHeight: '1',
            }}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <form onSubmit={onSubmit}>
          {/* Feedback type selection */}
          <div style={{ marginBottom: '16px' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '13px',
                color: '#666',
                fontWeight: '500',
              }}
            >
              What kind of feedback?
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap' }}>
              {allowedTypes.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => onTypeChange(type)}
                  style={{
                    ...defaultStyles.typeButton,
                    backgroundColor: selectedType === type ? themeStyles.primaryColor : 'white',
                    color: selectedType === type ? 'white' : themeStyles.textColor,
                    borderColor: selectedType === type ? themeStyles.primaryColor : '#e0e0e0',
                  }}
                >
                  {feedbackTypeEmojis[type]} {feedbackTypeLabels[type]}
                </button>
              ))}
            </div>
          </div>

          {/* Message input */}
          <div>
            <label
              style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '13px',
                color: '#666',
                fontWeight: '500',
              }}
            >
              Your message
            </label>
            <textarea
              value={message}
              onChange={(e) => onMessageChange(e.target.value)}
              placeholder={
                selectedType === 'bug_report'
                  ? 'Describe the bug and steps to reproduce...'
                  : selectedType === 'feature_request'
                    ? 'Describe the feature you would like...'
                    : 'Share your thoughts...'
              }
              style={defaultStyles.textarea}
              required
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !message.trim()}
            style={{
              ...defaultStyles.submitButton,
              backgroundColor: themeStyles.primaryColor,
              color: 'white',
              opacity: isSubmitting || !message.trim() ? 0.6 : 1,
              cursor: isSubmitting || !message.trim() ? 'not-allowed' : 'pointer',
            }}
          >
            {isSubmitting ? 'Sending...' : 'Send Feedback'}
          </button>
        </form>
      </div>
    </div>
  );
}
