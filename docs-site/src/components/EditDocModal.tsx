

import React, { useState, useEffect } from 'react';
import styles from './EditDocModal.module.css';

export interface DocData {
  id?: string;
  slug: string;
  title: string;
  content: string;
  version?: number;
}

interface EditDocModalProps {
  isOpen: boolean;
  onClose: () => void;
  docData: DocData;
  onSave: (updatedDoc: DocData) => Promise<void>;
}

export function EditDocModal({
  isOpen,
  onClose,
  docData,
  onSave,
}: EditDocModalProps): JSX.Element | null {
  const [title, setTitle] = useState(docData.title);
  const [content, setContent] = useState(docData.content);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Update form when docData changes
    setTitle(docData.title);
    setContent(docData.content);
    setError(null);
  }, [docData]);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    if (!content.trim()) {
      setError('Content is required');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const updatedDoc: DocData = {
        ...docData,
        title,
        content,
      };
      await onSave(updatedDoc);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save document');
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    // Reset to original values
    setTitle(docData.title);
    setContent(docData.content);
    setError(null);
    onClose();
  };

  return (
    <div className={styles.modalOverlay} onClick={handleCancel}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <h2>Edit Document</h2>
          <button
            className={styles.closeButton}
            onClick={handleCancel}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Error Message */}
        {error && <div className={styles.error}>{error}</div>}

        {/* Body */}
        <div className={styles.body}>
          {/* Title Field */}
          <div className={styles.formGroup}>
            <label htmlFor="doc-title">Title</label>
            <input
              id="doc-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Document title"
              className={styles.input}
              disabled={isSaving}
            />
          </div>

          {/* Content Field */}
          <div className={styles.formGroup}>
            <label htmlFor="doc-content">Content (Markdown)</label>
            <textarea
              id="doc-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Document content in markdown..."
              className={styles.textarea}
              disabled={isSaving}
              rows={15}
            />
            <small className={styles.hint}>
              Supports markdown formatting
            </small>
          </div>

          {/* Metadata */}
          {docData.slug && (
            <div className={styles.metadata}>
              <small>
                <strong>Slug:</strong> {docData.slug}
                {docData.version && (
                  <> | <strong>Version:</strong> {docData.version}</>
                )}
              </small>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <button
            onClick={handleCancel}
            disabled={isSaving}
            className={styles.secondaryButton}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className={styles.primaryButton}
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
