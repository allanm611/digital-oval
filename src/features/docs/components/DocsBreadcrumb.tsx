/**
 * DocsBreadcrumb
 * Displays breadcrumb navigation based on current page
 */

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import styles from './DocsBreadcrumb.module.css';
import { SidebarItem } from '../utils/sidebarConverter';

interface BreadcrumbCrumb {
  label: string;
  path?: string;
}

interface DocsBreadcrumbProps {
  sidebarItems: SidebarItem[];
}

/**
 * Recursively find the breadcrumb trail to the active path.
 * Returns an ordered array from root category to current page.
 */
function findBreadcrumbTrail(
  items: SidebarItem[],
  targetPath: string
): BreadcrumbCrumb[] | null {
  for (const item of items) {
    if (item.path === targetPath) {
      return [{ label: item.label, path: item.path }];
    }
    if (item.items && item.items.length > 0) {
      const childTrail = findBreadcrumbTrail(item.items, targetPath);
      if (childTrail !== null) {
        // Prepend this category (no path since categories don't have paths)
        return [{ label: item.label, path: item.path }, ...childTrail];
      }
    }
  }
  return null;
}

export function DocsBreadcrumb({ sidebarItems }: DocsBreadcrumbProps) {
  const location = useLocation();

  // Convert URL path to sidebar path format: /documentation/foo/bar → /foo/bar
  const activePath = location.pathname.replace(/^\/documentation/, '') || '/intro';

  const trail = findBreadcrumbTrail(sidebarItems, activePath);

  // Don't render if on home/intro or no trail found
  if (!trail || trail.length <= 1) return null;

  return (
    <nav aria-label="breadcrumb" className={styles.breadcrumb}>
      {/* Always show "Docs" as home link */}
      <Link to="/documentation/intro" className={styles.crumb}>
        Docs
      </Link>

      {trail.map((crumb, index) => {
        const isLast = index === trail.length - 1;
        return (
          <React.Fragment key={index}>
            <span className={styles.separator} aria-hidden="true">›</span>
            {isLast || !crumb.path ? (
              <span className={`${styles.crumb} ${isLast ? styles.crumbActive : ''}`}>
                {crumb.label}
              </span>
            ) : (
              <Link
                to={`/documentation${crumb.path}`}
                className={styles.crumb}
              >
                {crumb.label}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
