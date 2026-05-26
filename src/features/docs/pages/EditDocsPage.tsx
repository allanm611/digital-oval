import Input from '../../../shared/components/ui/Input';
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import MarkdownIt from 'markdown-it';
import { useAuth } from '../../../contexts/AuthContext';
import { PermissionGate } from '../../auth/components/PermissionGate';
import { useDocumentation } from '../hooks/useDocumentation';
// import { documentationService } from '../services/documentationService';
// import { DocDocument, DocCategory, DocVersion, CreateDocPayload } from '../types/documentation';
import HeadlessSelect from '../../../shared/components/ui/HeadlessSelect';
import DeleteConfirmModal from '../../../shared/components/ui/DeleteConfirmModal';
import styles from './EditDocsPage.module.css';

// API integration commented out - will use when backend is ready
// import { DocDocument, DocCategory, DocVersion, CreateDocPayload } from '../types/documentation';

const md = new MarkdownIt({
  html: false,
  linkify: true,
  typographer: true,
});

function EditDocsPageContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState<number | string>('');
  // const [categories, setCategories] = useState<DocCategory[]>([]);
  // const [versions, setVersions] = useState<DocVersion[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [imageAlt, setImageAlt] = useState('');
  // const [selectedVersion, setSelectedVersion] = useState<number | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isAddMode = location.pathname.includes('/add');
  const params = new URLSearchParams(location.search);
  const slug = params.get('slug') || '';
  const { content: loadedContent, title: loadedTitle } = useDocumentation(isAddMode ? undefined : slug);

  const isViewingOldVersion = selectedVersion !== null && document && selectedVersion !== document.version;

  useEffect(() => {
    // loadCategories(); // API integration pending
    if (!isAddMode && slug) {
      // loadVersions(); // API integration pending
    }
    setLoading(false);
  }, [slug, isAddMode]);

  useEffect(() => {
    loadDoc();
  }, [loadedContent, loadedTitle, isAddMode]);

  // COMMENTED OUT - API INTEGRATION PENDING
  /*
  const loadCategories = async () => {
    try {
      const response = await documentationService.getCategories();
      setCategories(response || []);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const loadVersions = async () => {
    if (!slug) return;
    try {
      const response = await documentationService.getDocumentVersions(slug);
      setVersions(response.versions || []);
    } catch (error) {
      console.error('Failed to load versions:', error);
    }
  };
  */

  const loadDoc = () => {
    try {
      if (isAddMode) {
        setContent('');
        setTitle('');
        setCategoryId('');
      } else if (loadedContent && loadedTitle) {
        setContent(loadedContent);
        setTitle(loadedTitle);
        setCategoryId(''); // Not available in hardcoded mode
      } else {
        setContent('');
        setTitle('');
        setCategoryId('');
      }
    } catch (error) {
      setMessage('Error loading document');
    }
  };

  // COMMENTED OUT - API INTEGRATION PENDING
  /*
  const handleSave = async () => {
    if (!title.trim() || !content.trim() || !categoryId) {
      setMessage('Title, category, and content are required');
      return;
    }

    try {
      setIsSaving(true);
      setMessage(null);

      const payload: CreateDocPayload = {
        category_id: Number(categoryId),
        title: title.trim(),
        slug: isAddMode ? slug || title.toLowerCase().replace(/\s+/g, '-') : slug,
        doc_type: 'markdown',
        summary: content.substring(0, 200),
        markdown_content: content,
      };

      if (isAddMode) {
        await documentationService.createDocument(payload);
        setMessage('Document created successfully!');
      } else {
        await documentationService.updateDocument(slug, payload);
        setMessage('Document saved successfully!');
      }

      const destinationSlug = payload.slug;
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
  */

  const handleSave = async () => {
    setMessage('Edit functionality available with API integration');
  };

  const handleCancel = () => {
    navigate(isAddMode ? '/documentation' : `/documentation/${slug}`);
  };

  // COMMENTED OUT - API INTEGRATION PENDING
  /*
  const handleRollback = async () => {
    if (!slug || selectedVersion === null || !document) return;

    try {
      setIsSaving(true);
      setMessage(null);

      await documentationService.rollbackDocument(slug, selectedVersion);
      setMessage(`Rolled back to Version ${selectedVersion}. New version created!`);
      setTimeout(() => {
        setSelectedVersion(null);
        loadDoc();
        setMessage(null);
      }, 2000);
    } catch (error) {
      setMessage('Failed to rollback');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!slug) return;

    try {
      setIsDeleting(true);
      setMessage(null);

      await documentationService.deleteDocument(slug);
      setMessage('Document deleted successfully!');
      setTimeout(() => {
        navigate('/documentation');
      }, 1500);
    } catch (error) {
      console.error('Error deleting document:', error);
      setMessage(error instanceof Error ? error.message : 'Failed to delete document');
      setShowDeleteConfirm(false);
    } finally {
      setIsDeleting(false);
    }
  };
  */

  const handleRollback = async () => {
    setMessage('Version rollback available with API integration');
  };

  const handleDelete = async () => {
    setMessage('Delete functionality available with API integration');
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

  // COMMENTED OUT - API INTEGRATION PENDING
  /*
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setMessage(null);
      const formData = new FormData();
      formData.append('file', file);

      const response = await documentationService.uploadImage(formData);
      const alt = file.name.replace(/\.[^/.]+$/, '');
      const markdown = `![${alt}](${response.image_url})\n`;
      insertAtCursor(markdown);
      setMessage('Image uploaded successfully!');
    } catch (error) {
      console.error('Error uploading image:', error);
      setMessage(error instanceof Error ? error.message : 'Failed to upload image');
    } finally {
      e.target.value = '';
    }
  };
  */

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage('Image upload available with API integration');
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
          <Input
            type="text"
            value={title}
            onChange={(value) => setTitle(String(value))}
            placeholder={isAddMode ? "Enter document title" : "Document title"}
            disabled={isSaving}
            className={styles.titleEditInput}
          />
          <div className={styles.versionSelectors}>
            <div className={styles.versionGroup}>
              <label>Category</label>
              <HeadlessSelect
                options={categories.map(cat => ({
                  value: cat.category_id,
                  label: cat.label || cat.name,
                }))}
                value={categoryId}
                onChange={(value) => setCategoryId(value)}
                placeholder="Select a category"
                disabled={isSaving}
              />
            </div>
            {!isAddMode && versions.length > 0 && (
              <div className={styles.versionGroup}>
                <label>Document Version</label>
                <select
                  value={selectedVersion || ''}
                  onChange={(e) => setSelectedVersion(e.target.value ? Number(e.target.value) : null)}
                  className={styles.versionSelect}
                  disabled={isSaving}
                >
                  <option value="">Current Version</option>
                  {versions.map(v => (
                    <option key={v.version} value={v.version}>{`Version ${v.version}`}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>
        <div className={styles.actions}>
          {isViewingOldVersion && (
            <button
              onClick={handleRollback}
              className={styles.rollbackButton}
              disabled={isSaving}
              title={`Rollback to Version ${selectedVersion}`}
            >
              {isSaving ? 'Rolling back...' : `Rollback to v${selectedVersion}`}
            </button>
          )}
          {!isAddMode && (
            <PermissionGate permission="docs.delete">
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className={styles.deleteButton}
                disabled={isSaving || isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete Document'}
              </button>
            </PermissionGate>
          )}
          <button
            onClick={handleCancel}
            className={styles.cancelButton}
            disabled={isSaving || isDeleting}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className={styles.saveButton}
            disabled={isSaving || isDeleting}
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
            <Input
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
              <Input
                type="text"
                placeholder="Image URL (e.g., https://example.com/image.png)"
                value={imageUrl}
                onChange={(value) => setImageUrl(String(value))}
                className={styles.urlInput}
              />
              <Input
                type="text"
                placeholder="Alt text (optional)"
                value={imageAlt}
                onChange={(value) => setImageAlt(String(value))}
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

      <DeleteConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Delete Document"
        description={`Are you sure you want to delete "${title}"? This action cannot be undone.`}
        isLoading={isDeleting}
      />
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
