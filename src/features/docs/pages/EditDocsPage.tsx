import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import MarkdownIt from 'markdown-it';
import { useAuth } from '../../../contexts/AuthContext';
import { PermissionGate } from '../../auth/components/PermissionGate';
import { useDocumentation } from '../hooks/useDocumentation';
import styles from './EditDocsPage.module.css';

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

function EditDocsPageContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const [doc, setDoc] = useState<DocData | null>(null);
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [imageAlt, setImageAlt] = useState('');
  const [selectedDocVersion, setSelectedDocVersion] = useState('4');
  const [selectedDocsVersion, setSelectedDocsVersion] = useState('2.0');
  const [currentVersion, setCurrentVersion] = useState('4');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const docVersions = ['4', '3', '2', '1'];
  const docsVersions = ['2.0', '1.1', '1.0'];
  const isViewingOldVersion = selectedDocVersion !== currentVersion;

  const isAddMode = location.pathname.includes('/add');
  const params = new URLSearchParams(location.search);
  const slug = params.get('slug') || 'intro';
  const { content: loadedContent } = useDocumentation(isAddMode ? undefined : slug);

  useEffect(() => {
    loadDoc();
  }, [slug, loadedContent, isAddMode]);

  const loadDoc = async () => {
    try {
      setLoading(true);
      if (isAddMode) {
        // New document mode - start with blank
        setDoc({ slug: '', title: '', content: '' });
        setContent('');
        setTitle('');
      } else if (loadedContent) {
        // Extract title from first h1 or use slug
        const titleMatch = loadedContent.match(/^#\s+(.+)/m);
        setDoc({
          slug,
          title: titleMatch ? titleMatch[1] : slug,
          content: loadedContent,
        });
        setContent(loadedContent);
        setTitle(titleMatch ? titleMatch[1] : slug);
      } else {
        // New document
        setDoc({ slug, title: slug, content: '' });
        setContent('');
        setTitle(slug);
      }
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

    try {
      setIsSaving(true);
      setMessage(null);

      // Simulate save - in real implementation would call API
      await new Promise(resolve => setTimeout(resolve, 1000));

      setMessage('Document saved successfully!');
      const destinationSlug = isAddMode ? slug || 'new-doc' : slug;
      setTimeout(() => {
        navigate(`/documentation/${destinationSlug}`);
      }, 1500);
    } catch (error) {
      console.error('Error saving document:', error);
      setMessage(error instanceof Error ? error.message : 'Failed to save document');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    navigate(isAddMode ? '/documentation' : `/documentation/${slug}`);
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

  if (loading) {
    return <div className={styles.container}>Loading...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>{isAddMode ? 'Create New Document' : title || 'Edit Document'}</h1>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={isAddMode ? "Enter document title" : "Document title"}
            disabled={isSaving}
            className={styles.titleEditInput}
          />
          <div className={styles.versionSelectors}>
            {!isAddMode && (
              <div className={styles.versionGroup}>
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
              </div>
            )}
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
            {isSaving ? (isAddMode ? 'Creating...' : 'Saving...') : (isAddMode ? 'Create Document' : 'Save Changes')}
          </button>
        </div>
      </div>

      {message && (
        <div className={`${styles.message} ${message.includes('saved') ? styles.success : styles.error}`}>
          {message}
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
              __html: md.render(content)
            }} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function EditDocsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isAddMode = location.pathname.includes('/add');

  if (!user) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>
        <h2>Authentication Required</h2>
        <button onClick={() => navigate('/login')}>Login</button>
      </div>
    );
  }

  const requiredPermission = isAddMode ? 'docs.create' : 'docs.update';

  return (
    <PermissionGate
      permission={requiredPermission}
      fallback={
        <div style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>
          <h2>Permission Denied</h2>
          <p>You do not have permission to {isAddMode ? 'create' : 'edit'} documentation.</p>
        </div>
      }
    >
      <EditDocsPageContent />
    </PermissionGate>
  );
}
