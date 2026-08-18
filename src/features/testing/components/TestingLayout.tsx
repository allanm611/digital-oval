/**
 * TestingLayout
 * Standalone shell for the health-check feature (mirrors DocsLayout).
 */

import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';
import styles from './TestingLayout.module.css';

interface TestingLayoutProps {
  children: React.ReactNode;
  sidebar: React.ReactNode;
  header?: React.ReactNode;
}

export function TestingLayout({ children, sidebar, header }: TestingLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className={styles.testingWrapper}>
      {header && <div className={styles.headerSlot}>{header}</div>}

      <button
        type="button"
        className={styles.sidebarToggle}
        onClick={() => setSidebarOpen(!sidebarOpen)}
        aria-label="Toggle sidebar"
      >
        {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      <aside
        className={`${styles.sidebar} ${sidebarOpen ? styles.open : ''}`}
        role="complementary"
      >
        <nav className={styles.sidebarNav}>{sidebar}</nav>
      </aside>

      <main className={styles.main}>
        <div className={styles.contentArea}>{children}</div>
      </main>
    </div>
  );
}
