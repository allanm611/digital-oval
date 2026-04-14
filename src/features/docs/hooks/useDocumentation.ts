/**
 * Hook: useDocumentation
 * Load and manage documentation content
 */

import { useEffect, useState } from 'react';
import { docsService } from '../services/docsService';

export interface UseDocumentationReturn {
  content: string;
  isLoading: boolean;
  error: string | null;
  reload: () => void;
}

export function useDocumentation(slug?: string, version: string = 'v1.0'): UseDocumentationReturn {
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDoc = () => {
    if (!slug) return;

    try {
      // Synchronous load - markdown files are eagerly loaded by Vite
      const markdown = docsService.loadMarkdown(slug, version);
      const { body } = docsService.parseFrontmatter(markdown);
      setContent(body);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load documentation');
      setContent('');
    }
  };

  useEffect(() => {
    // Load documentation immediately (no async operations, eager-loaded files)
    loadDoc();
    // // Reset content when slug changes to show loader briefly
    // setContent('');
    // setError(null);

    // // Load on next tick to ensure loading state is visible
    // const timer = setTimeout(() => {
    //   loadDoc();
    // }, 0);

    // return () => clearTimeout(timer);
  }, [slug, version]);

  return {
    content,
    isLoading,
    error,
    reload: loadDoc,
  };
}
