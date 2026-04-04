/**
 * DocsSidebar
 * Navigation sidebar with nested menu structure
 */

import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronDown, ChevronRight } from 'lucide-react';
import styles from './DocsSidebar.module.css';

interface SidebarItem {
  label: string;
  path?: string;
  items?: SidebarItem[];
}

interface DocsSidebarProps {
  items: SidebarItem[];
}

/**
 * Check if any descendant of this item matches the current pathname
 */
function isDescendantActive(item: SidebarItem, pathname: string): boolean {
  if (item.path && pathname === `/documentation${item.path}`) return true;
  if (item.items) {
    return item.items.some(child => isDescendantActive(child, pathname));
  }
  return false;
}

export function DocsSidebar({ items }: DocsSidebarProps) {
  return (
    <div className={styles.sidebarContent}>
      {items.map((item, idx) => (
        <SidebarSection key={idx} item={item} />
      ))}
    </div>
  );
}

function SidebarSection({ item }: { item: SidebarItem }) {
  const location = useLocation();
  const hasChildren = item.items && item.items.length > 0;
  const isActive = item.path && location.pathname === `/documentation${item.path}`;
  const hasActiveDescendant = hasChildren && isDescendantActive(item, location.pathname);

  const [expanded, setExpanded] = useState(hasActiveDescendant);

  // Auto-expand if a descendant becomes active on navigation
  useEffect(() => {
    if (hasChildren && isDescendantActive(item, location.pathname)) {
      setExpanded(true);
    }
  }, [location.pathname]);

  return (
    <div className={styles.section}>
      {item.path ? (
        <Link
          to={`/documentation${item.path}`}
          className={`${styles.sectionLabel} ${isActive ? styles.active : ''}`}
        >
          {item.label}
        </Link>
      ) : (
        <button
          className={styles.sectionButton}
          onClick={() => setExpanded(!expanded)}
        >
          <span className={styles.sectionLabel}>{item.label}</span>
          {hasChildren && (
            <span className={`${styles.chevron} ${expanded ? styles.expanded : ''}`}>
              <ChevronDown size={16} />
            </span>
          )}
        </button>
      )}

      {hasChildren && expanded && (
        <div className={styles.subsections}>
          {item.items!.map((subitem, idx) => (
            <SidebarSubitem key={idx} item={subitem} />
          ))}
        </div>
      )}
    </div>
  );
}

function SidebarSubitem({ item }: { item: SidebarItem }) {
  const location = useLocation();
  const hasChildren = item.items && item.items.length > 0;
  const isActive = item.path && location.pathname === `/documentation${item.path}`;
  const hasActiveDescendant = hasChildren && isDescendantActive(item, location.pathname);

  const [expanded, setExpanded] = useState(hasActiveDescendant);

  // Auto-expand if a descendant becomes active on navigation
  useEffect(() => {
    if (hasChildren && isDescendantActive(item, location.pathname)) {
      setExpanded(true);
    }
  }, [location.pathname]);

  return (
    <div className={styles.subsection}>
      {item.path ? (
        <Link
          to={`/documentation${item.path}`}
          className={`${styles.subsectionLink} ${isActive ? styles.active : ''}`}
        >
          {item.label}
        </Link>
      ) : (
        <button
          className={styles.subsectionButton}
          onClick={() => setExpanded(!expanded)}
        >
          <span>{item.label}</span>
          {hasChildren && (
            <span className={`${styles.chevron} ${expanded ? styles.expanded : ''}`}>
              <ChevronRight size={14} />
            </span>
          )}
        </button>
      )}

      {hasChildren && expanded && (
        <div className={styles.nestedItems}>
          {item.items!.map((nested, idx) => (
            <SidebarSubitem key={idx} item={nested} />
          ))}
        </div>
      )}
    </div>
  );
}
