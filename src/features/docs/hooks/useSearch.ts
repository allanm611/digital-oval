/**
 * Hook: useSearch
 * Search documentation content
 */

import { useState, useEffect, useMemo } from 'react';
import { searchService, SearchResult } from '../services/searchService';

// Load all markdown files for indexing
const markdownModules = import.meta.glob<string>('../markdown/**/*.md', { as: 'raw', eager: true });

export function useSearch(query: string): SearchResult[] {
  const [results, setResults] = useState<SearchResult[]>([]);

  // Build index once on mount
  useMemo(() => {
    searchService.buildIndex(markdownModules);
  }, []);

  // Search when query changes
  useEffect(() => {
    const searchResults = searchService.search(query);
    setResults(searchResults);
  }, [query]);

  return results;
}
