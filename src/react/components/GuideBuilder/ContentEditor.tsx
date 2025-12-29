'use client';

import { useState, useCallback } from 'react';
import type { GuideStepRichContent, GuideFormType } from '../../../types';

export interface ContentEditorProps {
  /**
   * Current content value
   */
  content: GuideStepRichContent;

  /**
   * Callback when content changes
   */
  onChange: (content: GuideStepRichContent) => void;

  /**
   * Whether to show the media section
   */
  showMedia?: boolean;

  /**
   * Whether to show the buttons section
   */
  showButtons?: boolean;

  /**
   * Whether to show the form section
   */
  showForm?: boolean;
}

const formTypeOptions: { value: GuideFormType; label: string; description: string }[] = [
  { value: 'nps', label: 'NPS Score', description: '0-10 rating scale' },
  { value: 'rating', label: 'Star Rating', description: '1-5 stars' },
  { value: 'text', label: 'Text Input', description: 'Free-form text response' },
  { value: 'select', label: 'Single Select', description: 'Choose one option' },
  { value: 'multi-select', label: 'Multi Select', description: 'Choose multiple options' },
];

export function ContentEditor({
  content,
  onChange,
  showMedia = true,
  showButtons = true,
  showForm = true,
}: ContentEditorProps) {
  const [activeTab, setActiveTab] = useState<'text' | 'media' | 'buttons' | 'form'>('text');

  // Update a specific field
  const updateField = useCallback(
    <K extends keyof GuideStepRichContent>(field: K, value: GuideStepRichContent[K]) => {
      onChange({ ...content, [field]: value });
    },
    [content, onChange]
  );

  // Add a button
  const addButton = useCallback(() => {
    const buttons = content.buttons || [];
    onChange({
      ...content,
      buttons: [
        ...buttons,
        { label: 'Button', action: 'next', style: 'primary' },
      ],
    });
  }, [content, onChange]);

  // Update a button
  const updateButton = useCallback(
    (index: number, updates: Partial<NonNullable<GuideStepRichContent['buttons']>[number]>) => {
      const buttons = [...(content.buttons || [])];
      buttons[index] = { ...buttons[index], ...updates };
      onChange({ ...content, buttons });
    },
    [content, onChange]
  );

  // Remove a button
  const removeButton = useCallback(
    (index: number) => {
      const buttons = [...(content.buttons || [])];
      buttons.splice(index, 1);
      onChange({ ...content, buttons });
    },
    [content, onChange]
  );

  // Add form option
  const addFormOption = useCallback(() => {
    const form = content.form || { type: 'select', question: '', options: [] };
    onChange({
      ...content,
      form: {
        ...form,
        options: [...(form.options || []), 'Option'],
      },
    });
  }, [content, onChange]);

  // Update form option
  const updateFormOption = useCallback(
    (index: number, value: string) => {
      const form = content.form;
      if (!form) return;
      const options = [...(form.options || [])];
      options[index] = value;
      onChange({ ...content, form: { ...form, options } });
    },
    [content, onChange]
  );

  // Remove form option
  const removeFormOption = useCallback(
    (index: number) => {
      const form = content.form;
      if (!form) return;
      const options = [...(form.options || [])];
      options.splice(index, 1);
      onChange({ ...content, form: { ...form, options } });
    },
    [content, onChange]
  );

  const tabs = [
    { id: 'text' as const, label: 'Text' },
    ...(showMedia ? [{ id: 'media' as const, label: 'Media' }] : []),
    ...(showButtons ? [{ id: 'buttons' as const, label: 'Buttons' }] : []),
    ...(showForm ? [{ id: 'form' as const, label: 'Form' }] : []),
  ];

  return (
    <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden' }}>
      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          borderBottom: '1px solid #e5e7eb',
          backgroundColor: '#f9fafb',
        }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              flex: 1,
              padding: '10px',
              border: 'none',
              borderBottom: activeTab === tab.id ? '2px solid #2563eb' : '2px solid transparent',
              backgroundColor: 'transparent',
              color: activeTab === tab.id ? '#2563eb' : '#6b7280',
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: '16px' }}>
        {/* Text Tab */}
        {activeTab === 'text' && (
          <div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: 500 }}>
                Title
              </label>
              <input
                type="text"
                value={content.title || ''}
                onChange={(e) => updateField('title', e.target.value)}
                placeholder="Enter a title"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  fontSize: '13px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: 500 }}>
                Body
              </label>
              <div style={{ position: 'relative' }}>
                {/* Basic formatting toolbar */}
                <div
                  style={{
                    display: 'flex',
                    gap: '4px',
                    padding: '6px',
                    borderBottom: '1px solid #e5e7eb',
                    backgroundColor: '#f9fafb',
                    borderRadius: '6px 6px 0 0',
                    border: '1px solid #d1d5db',
                    borderBottomLeftRadius: 0,
                    borderBottomRightRadius: 0,
                  }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      const textarea = document.getElementById('content-body') as HTMLTextAreaElement;
                      if (textarea) {
                        const start = textarea.selectionStart;
                        const end = textarea.selectionEnd;
                        const text = content.body || '';
                        const newText = text.slice(0, start) + '<b>' + text.slice(start, end) + '</b>' + text.slice(end);
                        updateField('body', newText);
                      }
                    }}
                    style={{
                      padding: '4px 8px',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px',
                      backgroundColor: 'white',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      fontSize: '12px',
                    }}
                    title="Bold"
                  >
                    B
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const textarea = document.getElementById('content-body') as HTMLTextAreaElement;
                      if (textarea) {
                        const start = textarea.selectionStart;
                        const end = textarea.selectionEnd;
                        const text = content.body || '';
                        const newText = text.slice(0, start) + '<i>' + text.slice(start, end) + '</i>' + text.slice(end);
                        updateField('body', newText);
                      }
                    }}
                    style={{
                      padding: '4px 8px',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px',
                      backgroundColor: 'white',
                      cursor: 'pointer',
                      fontStyle: 'italic',
                      fontSize: '12px',
                    }}
                    title="Italic"
                  >
                    I
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const url = prompt('Enter URL:');
                      if (url) {
                        const textarea = document.getElementById('content-body') as HTMLTextAreaElement;
                        if (textarea) {
                          const start = textarea.selectionStart;
                          const end = textarea.selectionEnd;
                          const text = content.body || '';
                          const linkText = text.slice(start, end) || 'link';
                          const newText = text.slice(0, start) + `<a href="${url}">${linkText}</a>` + text.slice(end);
                          updateField('body', newText);
                        }
                      }
                    }}
                    style={{
                      padding: '4px 8px',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px',
                      backgroundColor: 'white',
                      cursor: 'pointer',
                      fontSize: '12px',
                    }}
                    title="Link"
                  >
                    🔗
                  </button>
                </div>
                <textarea
                  id="content-body"
                  value={content.body || ''}
                  onChange={(e) => updateField('body', e.target.value)}
                  placeholder="Enter content (HTML supported)"
                  rows={5}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    fontSize: '13px',
                    border: '1px solid #d1d5db',
                    borderTop: 'none',
                    borderRadius: '0 0 6px 6px',
                    resize: 'vertical',
                    fontFamily: 'inherit',
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Media Tab */}
        {activeTab === 'media' && showMedia && (
          <div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: 500 }}>
                Media Type
              </label>
              <select
                value={content.media?.type || ''}
                onChange={(e) => {
                  if (e.target.value) {
                    updateField('media', {
                      type: e.target.value as 'image' | 'video',
                      url: content.media?.url || '',
                    });
                  } else {
                    updateField('media', undefined);
                  }
                }}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  fontSize: '13px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  backgroundColor: 'white',
                }}
              >
                <option value="">No media</option>
                <option value="image">Image</option>
                <option value="video">Video</option>
              </select>
            </div>

            {content.media?.type && (
              <>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: 500 }}>
                    {content.media.type === 'image' ? 'Image URL' : 'Video URL'}
                  </label>
                  <input
                    type="url"
                    value={content.media.url || ''}
                    onChange={(e) =>
                      updateField('media', { ...content.media!, url: e.target.value })
                    }
                    placeholder={`Enter ${content.media.type} URL`}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      fontSize: '13px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: 500 }}>
                    Alt Text
                  </label>
                  <input
                    type="text"
                    value={content.media.alt || ''}
                    onChange={(e) =>
                      updateField('media', { ...content.media!, alt: e.target.value })
                    }
                    placeholder="Describe the media for accessibility"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      fontSize: '13px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                    }}
                  />
                </div>

                {/* Preview */}
                {content.media.url && content.media.type === 'image' && (
                  <div style={{ marginTop: '12px' }}>
                    <img
                      src={content.media.url}
                      alt={content.media.alt || ''}
                      style={{
                        maxWidth: '100%',
                        maxHeight: '150px',
                        borderRadius: '4px',
                        border: '1px solid #e5e7eb',
                      }}
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Buttons Tab */}
        {activeTab === 'buttons' && showButtons && (
          <div>
            {(content.buttons || []).map((button, index) => (
              <div
                key={index}
                style={{
                  padding: '12px',
                  marginBottom: '8px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  backgroundColor: '#f9fafb',
                }}
              >
                <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                  <input
                    type="text"
                    value={button.label}
                    onChange={(e) => updateButton(index, { label: e.target.value })}
                    placeholder="Button text"
                    style={{
                      flex: 1,
                      padding: '6px 10px',
                      fontSize: '12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px',
                    }}
                  />
                  <button
                    onClick={() => removeButton(index)}
                    style={{
                      padding: '6px 10px',
                      border: 'none',
                      borderRadius: '4px',
                      backgroundColor: '#fef2f2',
                      color: '#dc2626',
                      cursor: 'pointer',
                      fontSize: '12px',
                    }}
                  >
                    Remove
                  </button>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <select
                    value={button.action}
                    onChange={(e) =>
                      updateButton(index, { action: e.target.value as typeof button.action })
                    }
                    style={{
                      flex: 1,
                      padding: '6px 10px',
                      fontSize: '12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px',
                      backgroundColor: 'white',
                    }}
                  >
                    <option value="next">Next step</option>
                    <option value="prev">Previous step</option>
                    <option value="dismiss">Dismiss</option>
                    <option value="url">Open URL</option>
                    <option value="custom">Custom action</option>
                  </select>

                  <select
                    value={button.style || 'primary'}
                    onChange={(e) =>
                      updateButton(index, { style: e.target.value as typeof button.style })
                    }
                    style={{
                      width: '100px',
                      padding: '6px 10px',
                      fontSize: '12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px',
                      backgroundColor: 'white',
                    }}
                  >
                    <option value="primary">Primary</option>
                    <option value="secondary">Secondary</option>
                    <option value="text">Text</option>
                  </select>
                </div>

                {button.action === 'url' && (
                  <input
                    type="url"
                    value={button.url || ''}
                    onChange={(e) => updateButton(index, { url: e.target.value })}
                    placeholder="Enter URL"
                    style={{
                      width: '100%',
                      marginTop: '8px',
                      padding: '6px 10px',
                      fontSize: '12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px',
                    }}
                  />
                )}

                {button.action === 'custom' && (
                  <input
                    type="text"
                    value={button.customAction || ''}
                    onChange={(e) => updateButton(index, { customAction: e.target.value })}
                    placeholder="Custom action name"
                    style={{
                      width: '100%',
                      marginTop: '8px',
                      padding: '6px 10px',
                      fontSize: '12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px',
                    }}
                  />
                )}
              </div>
            ))}

            <button
              onClick={addButton}
              style={{
                width: '100%',
                padding: '10px',
                border: '2px dashed #d1d5db',
                borderRadius: '6px',
                backgroundColor: 'transparent',
                color: '#6b7280',
                cursor: 'pointer',
                fontSize: '13px',
              }}
            >
              + Add Button
            </button>
          </div>
        )}

        {/* Form Tab */}
        {activeTab === 'form' && showForm && (
          <div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: 500 }}>
                Form Type
              </label>
              <select
                value={content.form?.type || ''}
                onChange={(e) => {
                  if (e.target.value) {
                    updateField('form', {
                      type: e.target.value as GuideFormType,
                      question: content.form?.question || '',
                      options: content.form?.options,
                    });
                  } else {
                    updateField('form', undefined);
                  }
                }}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  fontSize: '13px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  backgroundColor: 'white',
                }}
              >
                <option value="">No form</option>
                {formTypeOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label} - {opt.description}
                  </option>
                ))}
              </select>
            </div>

            {content.form?.type && (
              <>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: 500 }}>
                    Question
                  </label>
                  <input
                    type="text"
                    value={content.form.question || ''}
                    onChange={(e) =>
                      updateField('form', { ...content.form!, question: e.target.value })
                    }
                    placeholder="Enter your question"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      fontSize: '13px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                    }}
                  />
                </div>

                {(content.form.type === 'select' || content.form.type === 'multi-select') && (
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: 500 }}>
                      Options
                    </label>
                    {(content.form.options || []).map((option, index) => (
                      <div key={index} style={{ display: 'flex', gap: '8px', marginBottom: '4px' }}>
                        <input
                          type="text"
                          value={option}
                          onChange={(e) => updateFormOption(index, e.target.value)}
                          style={{
                            flex: 1,
                            padding: '6px 10px',
                            fontSize: '12px',
                            border: '1px solid #d1d5db',
                            borderRadius: '4px',
                          }}
                        />
                        <button
                          onClick={() => removeFormOption(index)}
                          style={{
                            padding: '6px 10px',
                            border: 'none',
                            borderRadius: '4px',
                            backgroundColor: '#fef2f2',
                            color: '#dc2626',
                            cursor: 'pointer',
                            fontSize: '12px',
                          }}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={addFormOption}
                      style={{
                        width: '100%',
                        padding: '8px',
                        border: '2px dashed #d1d5db',
                        borderRadius: '4px',
                        backgroundColor: 'transparent',
                        color: '#6b7280',
                        cursor: 'pointer',
                        fontSize: '12px',
                      }}
                    >
                      + Add Option
                    </button>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '16px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={content.form.required || false}
                      onChange={(e) =>
                        updateField('form', { ...content.form!, required: e.target.checked })
                      }
                    />
                    <span style={{ fontSize: '12px' }}>Required</span>
                  </label>
                </div>

                <div style={{ marginTop: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: 500 }}>
                    Submit Button Text
                  </label>
                  <input
                    type="text"
                    value={content.form.submitLabel || ''}
                    onChange={(e) =>
                      updateField('form', { ...content.form!, submitLabel: e.target.value })
                    }
                    placeholder="Submit (default)"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      fontSize: '13px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                    }}
                  />
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
