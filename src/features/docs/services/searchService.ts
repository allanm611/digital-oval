/**
 * Search Service
 * Searches documentation via API
 */

import documentationService from './documentationService';

export interface SearchResult {
  slug: string;
  title: string;
  excerpt: string;
  matchType: 'title' | 'content';
}

class SearchService {
  /**
   * Search documentation by query via API
   * Returns matches from the backend search endpoint
   */
  async search(query: string): Promise<SearchResult[]> {
    if (!query.trim()) return [];

    try {
      const results = await documentationService.search(query, { limit: 10 });

      return results.map((result) => ({
        slug: result.slug,
        title: result.title,
        excerpt: result.summary || 'No description available',
        matchType: 'content' as const,
      }));
    } catch (error) {
      console.error('Search failed:', error);
      return [];
    }
  }
}

export const searchService = new SearchService();
export default searchService;
