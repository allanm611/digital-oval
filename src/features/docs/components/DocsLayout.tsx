/**
 * DocsLayout
 * Docusaurus-style layout with sidebar, header, main content, and TOC
 */

import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';
import styles from './DocsLayout.module.css';

interface DocsLayoutProps {
  children: React.ReactNode;
  sidebar: React.ReactNode;
  toc?: React.ReactNode;
  title?: string;
  header?: React.ReactNode;
}

export function DocsLayout({ children, sidebar, toc, title, header }: DocsLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className={styles.docsWrapper}>
      {/* Fixed Header */}
      {header && (
        <div className={styles.headerSlot}>
          {header}
        </div>
      )}

      {/* Mobile Sidebar Toggle */}
      <button
        className={styles.sidebarToggle}
        onClick={() => setSidebarOpen(!sidebarOpen)}
        aria-label="Toggle sidebar"
      >
        {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <aside
        className={`${styles.sidebar} ${sidebarOpen ? styles.open : ''}`}
        role="complementary"
      >
        <nav className={styles.sidebarNav}>{sidebar}</nav>
      </aside>

      {/* Main Content */}
      <main className={styles.main}>
        <div className={styles.contentWrapper}>
          <article className={styles.article}>{children}</article>

          {/* Right TOC Sidebar */}
          {toc && (
            <aside className={styles.tocSidebar} role="complementary">
              {toc}
            </aside>
          )}
        </div>
      </main>
    </div>
  );
}
