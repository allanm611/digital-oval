/**
 * Docs Service
 * Handles loading and managing documentation via API
 */

import { DocDocument } from '../types/documentation';
import documentationService from './documentationService';

export interface DocMetadata {
  slug: string;
  title: string;
  category: string;
  path: string;
}

class DocsService {
  /**
   * Load document by slug from API
   * Slug format: "intro", "authentication/login", "campaigns/create-campaign", etc.
   */
  async loadDocument(slug: string): Promise<DocDocument> {
    try {
      return await documentationService.getDocumentBySlug(slug);
    } catch (error) {
      console.error(`Failed to load document for slug: ${slug}`, error);
      throw new Error(`Documentation for "${slug}" not found`);
    }
  }

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
