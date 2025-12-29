'use client';
import type { GuideStep } from '../../../types';

export interface StepContentProps {
  /**
   * The step data
   */
  step: GuideStep;

  /**
   * Text color for content
   */
  textColor?: string;

  /**
   * Whether to show the title
   */
  showTitle?: boolean;
}

export function StepContent({
  step,
  textColor = '#1f2937',
  showTitle = true,
}: StepContentProps) {
  const richContent = step.rich_content;
  const title = richContent?.title || step.title;
  const body = richContent?.body || step.content;

  return (
    <div>
      {/* Title */}
      {showTitle && title && (
        <h3
          style={{
            margin: '0 0 8px 0',
            fontSize: '16px',
            fontWeight: 600,
            color: textColor,
            lineHeight: 1.4,
          }}
        >
          {title}
        </h3>
      )}

      {/* Body text */}
      {body && (
        <div
          style={{
            fontSize: '14px',
            color: textColor,
            opacity: 0.9,
            lineHeight: 1.5,
          }}
          // If body contains HTML, render it safely
          dangerouslySetInnerHTML={
            body.includes('<') ? { __html: sanitizeHTML(body) } : undefined
          }
        >
          {!body.includes('<') ? body : null}
        </div>
      )}

      {/* Media (image or video) */}
      {richContent?.media && (
        <div style={{ marginTop: '12px' }}>
          {richContent.media.type === 'image' && (
            <img
              src={richContent.media.url}
              alt={richContent.media.alt || ''}
              style={{
                maxWidth: '100%',
                height: 'auto',
                borderRadius: '4px',
              }}
            />
          )}
          {richContent.media.type === 'video' && (
            <video
              src={richContent.media.url}
              controls
              style={{
                maxWidth: '100%',
                height: 'auto',
                borderRadius: '4px',
              }}
            >
              Your browser does not support the video tag.
            </video>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Basic HTML sanitization for step content
 * Only allows safe tags and strips potentially dangerous attributes
 */
function sanitizeHTML(html: string): string {
  // Allowed tags
  const allowedTags = [
    'p', 'br', 'b', 'i', 'strong', 'em', 'u', 's',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'ul', 'ol', 'li',
    'a', 'code', 'pre', 'blockquote',
    'span', 'div',
  ];

  // Create a temporary element to parse HTML
  if (typeof document === 'undefined') {
    // SSR fallback - just return text content
    return html.replace(/<[^>]*>/g, '');
  }

  const temp = document.createElement('div');
  temp.innerHTML = html;

  // Remove script tags and event handlers
  const scripts = temp.querySelectorAll('script');
  scripts.forEach((script) => script.remove());

  // Remove event handlers from all elements
  const allElements = temp.querySelectorAll('*');
  allElements.forEach((el) => {
    // Check if tag is allowed
    if (!allowedTags.includes(el.tagName.toLowerCase())) {
      // Replace with its text content
      const text = document.createTextNode(el.textContent || '');
      el.parentNode?.replaceChild(text, el);
      return;
    }

    // Remove dangerous attributes
    const attrs = Array.from(el.attributes);
    attrs.forEach((attr) => {
      const name = attr.name.toLowerCase();
      // Remove event handlers (onclick, onerror, etc.)
      if (name.startsWith('on')) {
        el.removeAttribute(attr.name);
      }
      // Remove javascript: URLs
      if (name === 'href' || name === 'src') {
        const value = attr.value.toLowerCase().trim();
        if (value.startsWith('javascript:') || value.startsWith('data:')) {
          el.removeAttribute(attr.name);
        }
      }
      // Only allow certain attributes
      const allowedAttrs = ['href', 'target', 'rel', 'class', 'style'];
      if (!allowedAttrs.includes(name)) {
        el.removeAttribute(attr.name);
      }
    });

    // Add rel="noopener noreferrer" to links
    if (el.tagName.toLowerCase() === 'a') {
      el.setAttribute('rel', 'noopener noreferrer');
      el.setAttribute('target', '_blank');
    }
  });

  return temp.innerHTML;
}
