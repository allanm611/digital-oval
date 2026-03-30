import React, { useState, useEffect, useRef } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import MarkdownIt from 'markdown-it';
import styles from './edit.module.css';
import { validateLinks, formatBrokenLinks } from '@site/src/utils/linkValidator';
import { createDocument, getDocumentBySlug, updateDocument } from '@site/src/services/documentationService';
// import { PermissionGate } from '../../../src/features/auth/components/PermissionGate';
// import { useAuth } from '../../../src/contexts/AuthContext';

const md = new MarkdownIt({
  html: false,
  linkify: true,
  typographer: true,
});

interface DocData {
  slug: string;
  title: string;
  content: string;
}

function EditPageContent() {
  const history = useHistory();
  const location = useLocation();
  const [doc, setDoc] = useState<DocData | null>(null);
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isNewDocument, setIsNewDocument] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [imageAlt, setImageAlt] = useState('');
  const [selectedDocVersion, setSelectedDocVersion] = useState('4');
  const [selectedDocsVersion, setSelectedDocsVersion] = useState('2.0');
  const [currentVersion, setCurrentVersion] = useState('4');
  const [brokenLinksWarning, setBrokenLinksWarning] = useState<string | null>(null);
  const [skipValidation, setSkipValidation] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const docVersions = ['4', '3', '2', '1'];
  const docsVersions = ['2.0', '1.1', '1.0'];
  const isViewingOldVersion = selectedDocVersion !== currentVersion;

  const params = new URLSearchParams(location.search);
  const slug = params.get('slug') || 'intro';

  useEffect(() => {
    loadDoc();
  }, [slug]);

  const loadDoc = async () => {
    try {
      setLoading(true);

      // Try to fetch from backend API first
      try {
        const backendDoc = await getDocumentBySlug(slug);
        setDoc({
          slug: backendDoc.slug,
          title: backendDoc.title,
          content: backendDoc.markdown_content || '',
        });
        setContent(backendDoc.markdown_content || '');
        setTitle(backendDoc.title);
        setIsNewDocument(false);
        return;
      } catch (error) {
        // Backend document doesn't exist - this is expected for new documents
        console.log('[Edit Page] Creating new document:', slug);
      }

      // Set empty document for new content
      setDoc({ slug, title: slug, content: '' });
      setContent('');
      setTitle(slug);
      setIsNewDocument(true);
    } catch (error) {
      setMessage('Error loading document');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      setMessage('Title and content are required');
      return;
    }

    // Validate links if not skipping validation
    if (!skipValidation) {
      const validation = validateLinks(content, slug);
      if (!validation.isValid) {
        const warning = formatBrokenLinks(validation.brokenLinks);
        setBrokenLinksWarning(warning);
        return;
      }
    }

    try {
      setIsSaving(true);
      setMessage(null);
      setBrokenLinksWarning(null);

      if (isNewDocument) {
        // Create new document
        await createDocument({
          category_id: 0, // Placeholder - will be from sidebar categories in backend later
          title,
          slug,
          doc_type: 'guide',
          markdown_content: content,
          summary: `Documentation for ${title}`,
        });
      } else {
        // Update existing document
        await updateDocument(slug, {
          title,
          doc_type: 'guide',
          markdown_content: content,
          summary: `Documentation for ${title}`,
        });
      }

      setMessage('Document saved successfully!');
      setTimeout(() => {
        if (typeof window !== 'undefined') {
          window.location.href = `/docs/${slug}`;
        }
      }, 1500);
    } catch (error) {
      console.error('Error saving document:', error);
      setMessage(error instanceof Error ? error.message : 'Failed to save document');
    } finally {
      setIsSaving(false);
      setSkipValidation(false);
    }
  };

  const handleCancel = () => {
    if (typeof window !== 'undefined') {
      window.location.href = `/docs/${slug}`;
    }
  };

  const insertAtCursor = (text: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const before = content.substring(0, start);
    const after = content.substring(end);
    const newContent = before + text + after;

    setContent(newContent);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + text.length, start + text.length);
    }, 0);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      const alt = file.name.replace(/\.[^/.]+$/, '');
      const markdown = `![${alt}](${dataUrl})\n`;
      insertAtCursor(markdown);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleInsertImageUrl = () => {
    if (!imageUrl.trim()) {
      setMessage('Please enter an image URL');
      return;
    }
    const alt = imageAlt.trim() || 'Image';
    const markdown = `![${alt}](${imageUrl})\n`;
    insertAtCursor(markdown);
    setImageUrl('');
    setImageAlt('');
    setShowUrlInput(false);
  };

  const handleRollback = async () => {
    try {
      setIsSaving(true);
      setMessage(null);

      await new Promise(resolve => setTimeout(resolve, 1000));

      setCurrentVersion(selectedDocVersion);
      setSelectedDocVersion(selectedDocVersion);
      setMessage(`Rolled back to Version ${selectedDocVersion}. New version created!`);
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage('Failed to rollback');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return <div className={styles.container}>Loading...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>{title}</h1>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Document title"
            disabled={isSaving}
            className={styles.titleEditInput}
          />
          <div className={styles.versionSelectors}>
            {/* File Version selector hidden in add mode - files have no versions yet */}
            {/* <div className={styles.versionGroup}>
              <label>File Version</label>
              <select
                value={selectedDocVersion}
                onChange={(e) => setSelectedDocVersion(e.target.value)}
                className={styles.versionSelect}
                disabled={isSaving}
              >
                {docVersions.map(v => (
                  <option key={v} value={v}>{`Version ${v}`}</option>
                ))}
              </select>
            </div> */}
            <div className={styles.versionGroup}>
              <label>Release</label>
              <select
                value={selectedDocsVersion}
                onChange={(e) => setSelectedDocsVersion(e.target.value)}
                className={styles.versionSelect}
                disabled={isSaving}
              >
                {docsVersions.map(v => (
                  <option key={v} value={v}>{`v${v}`}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
        <div className={styles.actions}>
          {isViewingOldVersion && (
            <button
              onClick={handleRollback}
              className={styles.rollbackButton}
              disabled={isSaving}
              title={`Rollback to Version ${selectedDocVersion}`}
            >
              {isSaving ? 'Rolling back...' : `Rollback to v${selectedDocVersion}`}
            </button>
          )}
          <button
            onClick={handleCancel}
            className={styles.cancelButton}
            disabled={isSaving}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className={styles.saveButton}
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {message && (
        <div className={`${styles.message} ${message.includes('✅') ? styles.success : styles.error}`}>
          {message}
        </div>
      )}

      {brokenLinksWarning && (
        <div className={styles.brokenLinksWarning}>
          <div className={styles.brokenLinksTitle}>
            Broken Links Found
          </div>
          <div className={styles.brokenLinksList}>
            {brokenLinksWarning}
          </div>
          <div className={styles.brokenLinksActions}>
            <button
              onClick={() => setBrokenLinksWarning(null)}
              className={styles.fixButton}
            >
              Fix Links
            </button>
            <button
              onClick={() => {
                setSkipValidation(true);
                setTimeout(() => handleSave(), 0);
              }}
              className={styles.saveAnywayButton}
            >
              Save Anyway
            </button>
          </div>
        </div>
      )}

      {/* Main Content - Side by side */}
      <div className={styles.editorLayout}>
          {/* Left: Editor (Markdown Code) */}
          <div className={styles.editorSection}>
          <div className={styles.editorLabel}>Markdown</div>
          <div className={styles.toolbar}>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              style={{ display: 'none' }}
              id="imageUpload"
            />
            <label htmlFor="imageUpload" className={styles.toolbarButton}>
              Upload Image
            </label>
            <button
              onClick={() => setShowUrlInput(!showUrlInput)}
              className={styles.toolbarButton}
            >
              Insert Image URL
            </button>
          </div>

          {showUrlInput && (
            <div className={styles.urlInputGroup}>
              <input
                type="text"
                placeholder="Image URL (e.g., https://example.com/image.png)"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className={styles.urlInput}
              />
              <input
                type="text"
                placeholder="Alt text (optional)"
                value={imageAlt}
                onChange={(e) => setImageAlt(e.target.value)}
                className={styles.urlInput}
              />
              <button
                onClick={handleInsertImageUrl}
                className={styles.insertButton}
              >
                Insert
              </button>
              <button
                onClick={() => setShowUrlInput(false)}
                className={styles.cancelUrlButton}
              >
                Cancel
              </button>
            </div>
          )}

          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="# Write your markdown here..."
            disabled={isSaving}
            className={styles.contentTextarea}
          />
        </div>

        {/* Right: Preview (Display) */}
        <div className={styles.previewSection}>
          <div className={styles.previewLabel}>Preview</div>
          <div className={styles.previewContent}>
            <div dangerouslySetInnerHTML={{
              __html: md.render(content).replace(/src="\/img\//g, 'src="/docs/img/')
            }} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function EditPage() {
  // Skip rendering on server - client only
  if (typeof window === 'undefined') {
    return null;
  }

  return <EditPageContent />;
}
