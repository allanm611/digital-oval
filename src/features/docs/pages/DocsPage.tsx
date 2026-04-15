/**
 * DocsPage - Integrated into Main App
 * Docusaurus-style layout with sidebar, content, and TOC
 * Serves docs from /documentation/* routes
 */

import React, { useMemo, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { Link as LinkIcon } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { PermissionGate } from '../../auth/components/PermissionGate';
import { useDocumentation } from '../hooks/useDocumentation';
import { useDocsVersion } from '../contexts/DocsVersionContext';
import { DocsLayout } from '../components/DocsLayout';
import { DocsSidebar } from '../components/DocsSidebar';
import { DocsTOC } from '../components/DocsTOC';
import { DocsHeader } from '../components/DocsHeader';
import { DocsBreadcrumb } from '../components/DocsBreadcrumb';
import { DocsNavigation } from '../components/DocsNavigation';
import { convertDocusaurusSidebar } from '../utils/sidebarConverter';
import { getSidebar } from '../services/sidebarService';
import styles from './DocsPage.module.css';


export function DocsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { activeVersion } = useDocsVersion();

  // Extract slug from URL path (e.g., /documentation/authentication/login → authentication/login)
  const slug = location.pathname.replace(/^\/documentation\/?/, '') || 'intro';

  // Scroll to top when navigation slug changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  // Convert Docusaurus sidebar config to React component format
  const SIDEBAR_ITEMS = useMemo(() => {
    const sidebarConfig = getSidebar(activeVersion);
    if (sidebarConfig) {
      return convertDocusaurusSidebar(sidebarConfig);
    }
    return [];
  }, [activeVersion]);

  const { content, isLoading, error } = useDocumentation(slug, activeVersion);

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

  if (!content) {
    return (
      <DocsLayout
        sidebar={<DocsSidebar items={SIDEBAR_ITEMS} />}
        header={<DocsHeader />}
      >
        <div className={styles.loading}>
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{
              display: 'inline-block',
              width: '40px',
              height: '40px',
              border: '4px solid #374151',
              borderTop: '4px solid #25c2a0',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }} />
            <p style={{ color: '#9ca3af', marginTop: '16px' }}>Loading documentation...</p>
          </div>
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
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
          <div className={styles.actions}>
            {slug === 'authentication/login' && (
              <PermissionGate permission="docs.create">
                <button
                  onClick={() => navigate(`/documentation/add`)}
                  className={styles.editLink}
                >
                  Add
                </button>
              </PermissionGate>
            )}
            <PermissionGate permission="docs.update">
              <button
                onClick={() => navigate(`/documentation/edit?slug=${slug}`)}
                className={styles.editLink}
              >
                Edit
              </button>
            </PermissionGate>
          </div>
        </div>

        {/* Add IDs to headings for TOC linking */}
        <div className={styles.markdown}>
          <ReactMarkdown
            components={{
              h2: ({ children }) => {
                const text = String(children);
                const id = text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
                return (
                  <h2 id={id} className={styles.headingWithLink}>
                    {children}
                    <a href={`#${id}`} className={styles.headingLink} title="Copy link to section">
                      <LinkIcon size={18} />
                    </a>
                  </h2>
                );
              },
              h3: ({ children }) => {
                const text = String(children);
                const id = text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
                return (
                  <h3 id={id} className={styles.headingWithLink}>
                    {children}
                    <a href={`#${id}`} className={styles.headingLink} title="Copy link to section">
                      <LinkIcon size={18} />
                    </a>
                  </h3>
                );
              },
              a: ({ href, children }) => {
                // Use React Router Link for internal documentation links
                if (href && href.startsWith('/documentation/')) {
                  return <Link to={href}>{children}</Link>;
                }
                // Use regular <a> for external links
                return <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>;
              }
            }}
          >
            {content}
          </ReactMarkdown>
        </div>

        <DocsNavigation sidebarItems={SIDEBAR_ITEMS} currentSlug={slug} />
      </article>
    </DocsLayout>
  );
}

export default DocsPage;
