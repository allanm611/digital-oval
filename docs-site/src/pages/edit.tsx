import React, { useState, useEffect } from 'react';
import MarkdownIt from 'markdown-it';
import styles from './edit.module.css';

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

export default function EditPage() {
  const [doc, setDoc] = useState<DocData | null>(null);
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Get slug from query params
  const searchParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
  const slug = searchParams.get('slug') || 'intro';

  useEffect(() => {
    loadDoc();
  }, [slug]);

  const loadDoc = async () => {
    try {
      setLoading(true);
      // TODO: Fetch from backend API
      const mockDocs: Record<string, DocData> = {
        intro: {
          slug: 'intro',
          title: 'Get started',
          content: `# Sentra CVM Documentation

Welcome to the complete guide for the **Sentra Customer Value Management (CVM)** platform. This documentation covers all features, tools, and configurations available in the system.

## Quick Start

Get up and running quickly with these essential guides:

- **[Authentication](./authentication/login)** - Log in and manage your account
- **[Campaigns](./campaigns/campaigns-list)** - Create and launch your first campaign
- **[Customer 360](./customer-360/customers-list)** - Explore unified customer profiles
- **[Reports & Analytics](./analytics/overall-dashboard-performance)** - Monitor key metrics`,
        },
        'authentication/login': {
          slug: 'authentication/login',
          title: 'Login',
          content: `# Login

## Overview

The login page allows users to authenticate with their email and password to access the Sentra CVM platform.

![Login Page](/img/auth-images/login.png)

## Login Form

### Email Field

**Type:** Text input
**Required:** Yes
**Validation:**
- Must be a valid email format (e.g., user@example.com)

### Password Field

**Type:** Password input
**Required:** Yes
**Validation:**
- Minimum 6 characters
- Must match a registered account

### Show/Hide Password

Click the eye icon to toggle password visibility between hidden (dots) and plain text.

## Additional Options

### Remember Me

Enable the "Remember Me" checkbox to keep your login session active longer on this device. This is optional.

### Forgot Password?

If you've forgotten your password, see the [Password Reset](./password-reset) page for detailed instructions:

1. Click the **Forgot Password?** link
2. Enter your email address in the modal
3. Click **Send Reset Link**
4. Check your email for a password reset link
5. Follow the link to reset your password

## Login Process

1. Enter your registered email address
2. Enter your password
3. Optionally enable "Remember Me"
4. Click **Login**
5. You will be redirected to the dashboard upon successful authentication

## Error Handling

If login fails:
- **Invalid Credentials** - Check that your email and password are correct
- **Account Not Found** - Verify your email address is registered in the system
- **Account Inactive** - Contact your administrator if your account has been deactivated

## New Users

If you don't have an account, click **Request Account** to start the [account request process](./registration).`,
        },
      };

      const docData = mockDocs[slug] || { slug, title: slug, content: '' };
      setDoc(docData);
      setContent(docData.content);
      setTitle(docData.title);
    } catch (error) {
      setMessage('Error loading document');
      console.error(error);
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

      // TODO: Call backend API to save
      console.log('Saving:', { slug, title, content });

      // Simulate save
      await new Promise(resolve => setTimeout(resolve, 1000));

      setMessage('✅ Changes saved successfully!');
      setTimeout(() => {
        window.location.href = '/docs/intro';
      }, 1500);
    } catch (error) {
      setMessage('❌ Failed to save document');
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    window.location.href = '/docs/intro';
  };

  if (loading) {
    return <div className={styles.container}>Loading...</div>;
  }

  return (
    <div className={styles.container}>
      {/* Header */}
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
        </div>
        <div className={styles.actions}>
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

      {/* Message */}
      {message && (
        <div className={`${styles.message} ${message.includes('✅') ? styles.success : styles.error}`}>
          {message}
        </div>
      )}

      {/* Main Content - Side by side */}
      <div className={styles.editorLayout}>
        {/* Left: Editor (Markdown Code) */}
        <div className={styles.editorSection}>
          <div className={styles.editorLabel}>Markdown</div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="# Write your markdown here..."
            disabled={isSaving}
            className={styles.contentTextarea}
          />
          <small className={styles.hint}>Supports: # headings, ## subheadings, **bold**, - lists</small>
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
