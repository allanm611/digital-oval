/**
 * DocsPage - Integrated into Main App
 * Docusaurus-style layout with sidebar, content, and TOC
 * Serves docs from /documentation/* routes
 */

import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { Link as LinkIcon } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { useLanguage } from '../../../contexts/LanguageContext';
import { PermissionGate } from '../../auth/components/PermissionGate';
import { useDocumentation } from '../hooks/useDocumentation';
import { useDocsVersion } from '../contexts/DocsVersionContext';
import { DocsLayout } from '../components/DocsLayout';
import { DocsSidebar } from '../components/DocsSidebar';
import { DocsTOC } from '../components/DocsTOC';
import { DocsHeader } from '../components/DocsHeader';
import { DocsBreadcrumb } from '../components/DocsBreadcrumb';
import { DocsNavigation } from '../components/DocsNavigation';
import { getSidebar, SidebarItem } from '../services/sidebarService';
import styles from './DocsPage.module.css';


export function DocsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { activeVersion } = useDocsVersion();
  const { t } = useLanguage();
  const [sidebarItems, setSidebarItems] = useState<SidebarItem[]>([]);
  const [sidebarLoading, setSidebarLoading] = useState(true);
  const [sidebarError, setSidebarError] = useState<string | null>(null);

  // Extract document slug from URL path (full path after /documentation)
  // e.g., /documentation/getting-started/overview → getting-started/overview
  const slug = location.pathname.replace(/^\/documentation\/?/, '').replace(/\/$/, '') || 'intro';

  // Scroll to top when navigation slug changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  // Load sidebar (hardcoded from sidebars config)
  useEffect(() => {
    try {
      setSidebarLoading(true);
      setSidebarError(null);
      const items = getSidebar(activeVersion);
      setSidebarItems(items);
    } catch (error) {
      setSidebarError(
        error instanceof Error ? error.message : 'Failed to load sidebar'
      );
      setSidebarItems([]);
    } finally {
      setSidebarLoading(false);
    }
  }, [activeVersion]);

  const { content, isLoading, error } = useDocumentation(slug, activeVersion);

  // Redirect to login if not authenticated
  if (!user) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <h2>{t.auth.authenticationRequired}</h2>
          <p>{t.docs.authenticationRequiredMessage}</p>
          <button
            onClick={() => navigate('/login')}
            className={styles.loginButton}
          >
            {t.auth.goToLogin}
          </button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <DocsLayout
        sidebar={<DocsSidebar items={sidebarItems} />}
        header={<DocsHeader />}
      >
        <div className={styles.error}>
          <h2>{t.docs.notFound}</h2>
          <p>{error}</p>
          <button
            onClick={() => navigate('/documentation')}
            className={styles.homeButton}
          >
            {t.common.back}
          </button>
        </div>
      </DocsLayout>
    );
  }

  if (!content || isLoading) {
    return (
      <DocsLayout
        sidebar={<DocsSidebar items={sidebarItems} />}
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
            <p style={{ color: '#9ca3af', marginTop: '16px' }}>{t.docs.loading}</p>
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
      sidebar={<DocsSidebar items={sidebarItems} />}
      toc={<DocsTOC content={content} />}
      header={<DocsHeader />}
    >
      <article className={styles.article}>
        <div className={styles.breadcrumbRow}>
          <DocsBreadcrumb sidebarItems={sidebarItems} />
          <div className={styles.actions}>
            {slug === 'authentication/login' && (
              <PermissionGate permission="docs.create">
                <button
                  onClick={() => navigate(`/documentation/add`)}
                  className={styles.editLink}
                >
                  {t.common.create}
                </button>
              </PermissionGate>
            )}
            <PermissionGate permission="docs.update">
              <button
                onClick={() => navigate(`/documentation/edit?slug=${slug}`)}
                className={styles.editLink}
              >
                {t.common.edit}
              </button>
              {/* Manage Sidebar hidden for now - API integration pending */}
              {/* <button
                onClick={() => navigate(`/documentation/manage-sidebar`)}
                className={styles.editLink}
              >
                Manage Sidebar
              </button> */}
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
                return (
                  <a href={href} target="_blank" rel="noopener noreferrer">
                    {children}
                  </a>
                );
              }
            }}
          >
            {content}
          </ReactMarkdown>
        </div>

        <DocsNavigation sidebarItems={sidebarItems} currentSlug={slug} />
      </article>
    </DocsLayout>
  );
}

export default DocsPage;
