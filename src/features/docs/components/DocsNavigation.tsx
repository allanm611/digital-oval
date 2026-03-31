import React from 'react';
import { useNavigate } from 'react-router-dom';
import { SidebarItem } from '../utils/sidebarConverter';
import styles from './DocsNavigation.module.css';

interface DocsNavigationProps {
  sidebarItems: SidebarItem[];
  currentSlug: string;
}

/**
 * Flatten sidebar structure to get all pages in order
 */
function flattenSidebar(items: SidebarItem[]): SidebarItem[] {
  const flattened: SidebarItem[] = [];

  for (const item of items) {
    if (item.path) {
      flattened.push(item);
    }
    if (item.items) {
      flattened.push(...flattenSidebar(item.items));
    }
  }

  return flattened;
}

export function DocsNavigation({ sidebarItems, currentSlug }: DocsNavigationProps) {
  const navigate = useNavigate();
  const pages = flattenSidebar(sidebarItems);

  const currentIndex = pages.findIndex(
    page => page.path === `/${currentSlug}` ||
            page.path?.endsWith(currentSlug)
  );

  if (currentIndex === -1) return null;

  const prevPage = currentIndex > 0 ? pages[currentIndex - 1] : null;
  const nextPage = currentIndex < pages.length - 1 ? pages[currentIndex + 1] : null;

  if (!prevPage && !nextPage) return null;

  return (
    <div className={styles.navigation}>
      {prevPage ? (
        <button
          onClick={() => navigate(`/documentation${prevPage.path}`)}
          className={styles.prevButton}
        >
          <span className={styles.arrow}>←</span>
          <div>
            <div className={styles.label}>Previous</div>
            <div className={styles.title}>{prevPage.label}</div>
          </div>
        </button>
      ) : (
        <div />
      )}

      {nextPage ? (
        <button
          onClick={() => navigate(`/documentation${nextPage.path}`)}
          className={styles.nextButton}
        >
          <div>
            <div className={styles.label}>Next</div>
            <div className={styles.title}>{nextPage.label}</div>
          </div>
          <span className={styles.arrow}>→</span>
        </button>
      ) : (
        <div />
      )}
    </div>
  );
}
