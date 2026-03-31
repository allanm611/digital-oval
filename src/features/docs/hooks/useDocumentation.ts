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

export function useDocumentation(slug: string): UseDocumentationReturn {
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDoc = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const markdown = await docsService.loadMarkdown(slug);
      // Strip frontmatter from markdown
      const { body } = docsService.parseFrontmatter(markdown);
      setContent(body);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load documentation');
      setContent('');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDoc();
  }, [slug]);

  return {
    content,
    isLoading,
    error,
    reload: loadDoc,
  };
}
