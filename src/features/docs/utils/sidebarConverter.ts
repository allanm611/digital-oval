/**
 * Convert Docusaurus sidebars config to React component format
 */

interface DocusaurusItem {
  type?: 'category' | 'doc';
  label?: string;
  id?: string;
  items?: (string | DocusaurusItem)[];
  link?: {
    type: 'doc';
    id: string;
  };
}

export interface SidebarItem {
  label: string;
  path?: string;
  items?: SidebarItem[];
}

/**
 * Convert Docusaurus sidebar structure to React SidebarItem format
 */
export function convertDocusaurusSidebar(items: (string | DocusaurusItem)[]): SidebarItem[] {
  return items.map(item => {
    if (typeof item === 'string') {
      // Simple string reference like 'intro' or 'authentication/login'
      const label = item.split('/').pop() || item;
      return {
        label: formatLabel(label),
        path: `/${item}`,
      };
    }

    if (item.type === 'category') {
      return {
        label: item.label || 'Untitled',
        path: item.link && item.link.type === 'doc' ? `/${item.link.id}` : undefined,
        items: item.items ? convertDocusaurusSidebar(item.items) : undefined,
      };
    }

    if (item.type === 'doc' || !item.type) {
      const id = item.id || item.label || '';
      return {
        label: item.label || formatLabel(id.split('/').pop() || ''),
        path: `/${id}`,
      };
    }

    return {
      label: 'Unknown',
    };
  });
}

/**
 * Format a slug into a readable label
 * e.g., 'campaign-objectives' -> 'Campaign Objectives'
 */
function formatLabel(slug: string): string {
  return slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
