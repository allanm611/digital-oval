/**
 * TestingSidebar
 * Navigation for the standalone health-check feature.
 */

import { Link, useLocation } from 'react-router-dom';
import { Activity, Brain, Bell, PlusCircle, Globe, Wand2 } from 'lucide-react';
import { HEALTH_CHECK_BASE, healthCheckPath } from '../constants/routes';
import styles from './TestingSidebar.module.css';

interface NavItem {
  label: string;
  path: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  exact?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Modules', path: HEALTH_CHECK_BASE, icon: Activity, exact: true },
  { label: 'AI Insights', path: healthCheckPath('insights'), icon: Brain },
  { label: 'API Tests', path: healthCheckPath('api-tests'), icon: Globe },
  { label: 'Generate Tests', path: healthCheckPath('generate'), icon: Wand2 },
  { label: 'Notifications', path: healthCheckPath('notifications'), icon: Bell },
  { label: 'Add Module', path: healthCheckPath('create'), icon: PlusCircle },
];

function isNavActive(pathname: string, item: NavItem): boolean {
  if (item.exact) {
    return pathname === item.path || pathname === `${item.path}/`;
  }
  return pathname === item.path || pathname.startsWith(`${item.path}/`);
}

export function TestingSidebar() {
  const { pathname } = useLocation();

  return (
    <div className={styles.sidebarContent}>
      <div className={styles.sectionTitle}>Health Check</div>
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const active = isNavActive(pathname, item);
        return (
          <Link
            key={item.path}
            to={item.path}
            className={`${styles.navItem} ${active ? styles.navItemActive : ''}`}
          >
            <span className="inline-flex items-center gap-2">
              <Icon size={16} />
              {item.label}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
