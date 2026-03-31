/**
 * Search Service
 * Indexes and searches documentation content
 */

import { docsService } from './docsService';

export interface SearchResult {
  slug: string;
  title: string;
  excerpt: string;
  matchType: 'title' | 'content';
}

class SearchService {
  private index: Map<string, { title: string; content: string; slug: string }> = new Map();
  private isIndexed = false;

  /**
   * Build search index from all markdown files
   */
  buildIndex(markdownModules: Record<string, string>): void {
    if (this.isIndexed) return;

    Object.entries(markdownModules).forEach(([path, content]) => {
      if (!content) return;

      // Extract slug from path: '../markdown/intro.md' -> 'intro'
      const slug = path
        .replace('../markdown/', '')
        .replace('.md', '');

      // Parse frontmatter and get title + body
      const { metadata, body } = docsService.parseFrontmatter(content);
      const title = metadata.title || slug;

      this.index.set(slug, {
        slug,
        title,
        content: body,
      });
    });

    this.isIndexed = true;
  }

  /**
   * Search documentation by query
   * Returns matches from both title and content
   */
  search(query: string): SearchResult[] {
    if (!query.trim() || !this.isIndexed) return [];

    const normalizedQuery = query.toLowerCase();
    const results: SearchResult[] = [];

    this.index.forEach((doc) => {
      const titleMatch = doc.title.toLowerCase().includes(normalizedQuery);
      const contentMatch = doc.content.toLowerCase().includes(normalizedQuery);

      if (titleMatch) {
        results.push({
          slug: doc.slug,
          title: doc.title,
          excerpt: `Found in title`,
          matchType: 'title',
        });
      } else if (contentMatch) {
        // Extract excerpt around the match
        const contentLower = doc.content.toLowerCase();
        const matchIndex = contentLower.indexOf(normalizedQuery);
        const start = Math.max(0, matchIndex - 50);
        const end = Math.min(doc.content.length, matchIndex + 100);
        const excerpt = `...${doc.content.substring(start, end)}...`;

        results.push({
          slug: doc.slug,
          title: doc.title,
          excerpt: excerpt.replace(/\n/g, ' ').substring(0, 100),
          matchType: 'content',
        });
      }
    });

    // Sort by match type (title matches first) and limit to 10 results
    return results.sort((a, b) => {
      if (a.matchType === 'title' && b.matchType === 'content') return -1;
      if (a.matchType === 'content' && b.matchType === 'title') return 1;
      return 0;
    }).slice(0, 10);
  }
}

export const searchService = new SearchService();
