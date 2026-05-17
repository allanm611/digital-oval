/**
 * Hook: useSearch
 * Search documentation content via API
 */

import { useState, useEffect } from 'react';
import { searchService, SearchResult } from '../services/searchService';

export function useSearch(query: string): SearchResult[] {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Search when query changes
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const performSearch = async () => {
      try {
        setIsLoading(true);
        const searchResults = await searchService.search(query);
        setResults(searchResults);
      } catch (error) {
        console.error('Search error:', error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    };

    performSearch();
  }, [query]);

  return results;
}
