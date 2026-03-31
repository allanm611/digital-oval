/**
 * Docs Service
 * Handles loading and managing documentation markdown files
 */

export interface DocMetadata {
  slug: string;
  title: string;
  category: string;
  path: string;
}

// Load all markdown files using Vite's glob - eager load for instant access
const markdownModules = import.meta.glob<string>('../markdown/**/*.md', { as: 'raw', eager: true });

class DocsService {
  /**
   * Load markdown file by slug
   * Slug format: "intro", "authentication/login", "campaigns/create-campaign", etc.
   */
  loadMarkdown(slug: string): string {
    try {
      // Normalize slug: "intro" or "authentication/login"
      const path = slug === 'intro' ? '../markdown/intro.md' : `../markdown/${slug}.md`;

      const content = markdownModules[path];
      if (!content) {
        throw new Error(`File not found: ${path}`);
      }

      // Eager loaded modules return content directly (synchronous)
      return content || '';
    } catch (error) {
      console.error(`Failed to load markdown for slug: ${slug}`, error);
      throw new Error(`Documentation for "${slug}" not found`);
    }
  }

  /**
   * Parse markdown frontmatter and content
   */
  parseFrontmatter(content: string): { metadata: Record<string, any>; body: string } {
    // Check if markdown starts with frontmatter (---)
    if (!content.startsWith('---')) {
      return { metadata: {}, body: content };
    }

    const parts = content.split('---');
    if (parts.length < 3) {
      return { metadata: {}, body: content };
    }

    try {
      const frontmatter = parts[1];
      const body = parts.slice(2).join('---').trim();
      const metadata: Record<string, any> = {};

      // Simple YAML-like parsing
      frontmatter.split('\n').forEach((line) => {
        const [key, ...valueParts] = line.split(':');
        if (key && valueParts.length > 0) {
          metadata[key.trim()] = valueParts.join(':').trim();
        }
      });

      return { metadata, body };
    } catch (error) {
      return { metadata: {}, body: content };
    }
  }

  /**
   * Get slug from URL pathname
   * Converts /documentation/path/to/doc → path/to/doc
   */
  getSlugFromPath(pathname: string): string {
    const match = pathname.match(/^\/documentation\/(.+)$/);
    return match ? match[1] : 'intro';
  }

  /**
   * Convert slug to URL path
   */
  slugToPath(slug: string): string {
    return `/documentation/${slug}`;
  }
}

export const docsService = new DocsService();
