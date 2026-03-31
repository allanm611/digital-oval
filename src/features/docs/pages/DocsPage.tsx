/**
 * DocsPage - Integrated into Main App
 * Docusaurus-style layout with sidebar, content, and TOC
 * Serves docs from /documentation/* routes
 */

import React, { useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { useAuth } from '../../../contexts/AuthContext';
import { PermissionGate } from '../../auth/components/PermissionGate';
import { useDocumentation } from '../hooks/useDocumentation';
import { DocsLayout } from '../components/DocsLayout';
import { DocsSidebar } from '../components/DocsSidebar';
import { DocsTOC } from '../components/DocsTOC';
import { DocsHeader } from '../components/DocsHeader';
import { DocsBreadcrumb } from '../components/DocsBreadcrumb';
import { convertDocusaurusSidebar } from '../utils/sidebarConverter';
import sidebarsConfig from '../sidebars';
import styles from './DocsPage.module.css';


export function DocsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Extract slug from URL path (e.g., /documentation/authentication/login → authentication/login)
  const slug = location.pathname.replace(/^\/documentation\/?/, '') || 'intro';

  // Convert Docusaurus sidebar config to React component format
  const SIDEBAR_ITEMS = useMemo(() => {
    if (sidebarsConfig && sidebarsConfig.tutorialSidebar) {
      return convertDocusaurusSidebar(sidebarsConfig.tutorialSidebar);
    }
    return [];
  }, []);

  const { content, isLoading, error } = useDocumentation(slug);

  // Redirect to login if not authenticated
  if (!user) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <h2>Authentication Required</h2>
          <p>You need to be logged in to access the documentation.</p>
          <button
            onClick={() => navigate('/login')}
            className={styles.loginButton}
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <DocsLayout
        sidebar={<DocsSidebar items={SIDEBAR_ITEMS} />}
        header={<DocsHeader />}
      >
        <div className={styles.error}>
          <h2>Documentation Not Found</h2>
          <p>{error}</p>
          <button
            onClick={() => navigate('/documentation')}
            className={styles.homeButton}
          >
            Back to Home
          </button>
        </div>
      </DocsLayout>
    );
  }

  return (
    <DocsLayout
      sidebar={<DocsSidebar items={SIDEBAR_ITEMS} />}
      toc={<DocsTOC content={content} />}
      header={<DocsHeader />}
    >
      <article className={styles.article}>
        <div className={styles.breadcrumbRow}>
          <DocsBreadcrumb sidebarItems={SIDEBAR_ITEMS} />
          <PermissionGate permission="docs.update">
            <button
              onClick={() => navigate(`/documentation/edit?slug=${slug}`)}
              className={styles.editLink}
            >
              Edit
            </button>
          </PermissionGate>
        </div>

        {/* Add IDs to headings for TOC linking */}
        <div
          className={styles.markdown}
          onLoad={() => {
            // Add IDs to headings for TOC
            const headings = document.querySelectorAll('h2, h3');
            headings.forEach(heading => {
              if (!heading.id) {
                const text = heading.textContent || '';
                heading.id = text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
              }
            });
          }}
        >
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>
      </article>
    </DocsLayout>
  );
}

export default DocsPage;
