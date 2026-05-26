/**
 * Docs Service
 * Handles loading documentation from bundled markdown files
 * API integration commented out - will use when backend is ready
 */

import { DocDocument } from '../types/documentation';
// import documentationService from './documentationService';

export interface DocMetadata {
  slug: string;
  title: string;
  category: string;
  path: string;
}

class DocsService {
  private markdownCache: Record<string, { content: string; metadata: DocMetadata }> = {};

  /**
   * Load all markdown documents using Vite's glob import
   */
  private loadAllMarkdown() {
    const modules = import.meta.glob('../markdown-v1.0/**/*.md', { query: '?raw', import: 'default' }) as Record<string, () => Promise<string>>;
    return modules;
  }

  /**
   * Load document by slug
   * Slug format: "intro", "authentication/login", "campaigns/create-campaign", etc.
   */
  async loadMarkdown(slug: string): Promise<{ content: string; metadata: DocMetadata }> {
    if (this.markdownCache[slug]) {
      return this.markdownCache[slug];
    }

    try {
      const modules = this.loadAllMarkdown();
      const filePath = `../markdown-v1.0/${slug}.md`;

      // Try exact match
      let moduleKey = Object.keys(modules).find(key => key.includes(`/${slug}.md`));

      if (!moduleKey) {
        throw new Error(`Documentation for "${slug}" not found`);
      }

      const module = modules[moduleKey];
      const content = await module();

      const { metadata, body } = this.parseFrontmatter(content);
      const docMetadata: DocMetadata = {
        slug,
        title: metadata.title || this.formatLabel(slug.split('/').pop() || slug),
        category: slug.split('/')[0] || 'general',
        path: `/documentation/${slug}`,
      };

      const result = { content: body, metadata: docMetadata };
      this.markdownCache[slug] = result;
      return result;
    } catch (error) {
      console.error(`Failed to load document for slug: ${slug}`, error);
      throw new Error(`Documentation for "${slug}" not found`);
    }
  }

  /**
   * COMMENTED OUT - API INTEGRATION PENDING
   * Load document by slug from API
   * Uncomment when backend API is ready
   */
  /*
  async loadDocument(slug: string): Promise<DocDocument> {
    try {
      return await documentationService.getDocumentBySlug(slug);
    } catch (error) {
      console.error(`Failed to load document for slug: ${slug}`, error);
      throw new Error(`Documentation for "${slug}" not found`);
    }
  }
  */

  /**
   * Remove HTML comments from markdown content
   */
  removeHtmlComments(content: string): string {
    return content.replace(/<!--[\s\S]*?-->/g, '');
  }

  /**
   * Parse markdown frontmatter and content
   */
  parseFrontmatter(content: string): { metadata: Record<string, any>; body: string } {
    // Check if markdown starts with frontmatter (---)
    if (!content.startsWith('---')) {
      return { metadata: {}, body: this.removeHtmlComments(content) };
    }

    const parts = content.split('---');
    if (parts.length < 3) {
      return { metadata: {}, body: this.removeHtmlComments(content) };
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

      return { metadata, body: this.removeHtmlComments(body) };
    } catch (error) {
      return { metadata: {}, body: this.removeHtmlComments(content) };
    }
  }

  /**
   * Format a slug into a readable label
   */
  private formatLabel(slug: string): string {
    return slug
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
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
export default docsService;
