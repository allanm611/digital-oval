/**
 * Hook: useDocumentation
 * Load and manage documentation content from bundled markdown
 * Will switch to API when backend is ready
 */

import { useEffect, useState } from 'react';
import { docsService } from '../services/docsService';

export interface UseDocumentationReturn {
  content: string;
  isLoading: boolean;
  error: string | null;
  reload: () => void;
  title?: string;
}

export function useDocumentation(slug?: string, version: string = '1.3.2'): UseDocumentationReturn {
  const [content, setContent] = useState('');
  const [title, setTitle] = useState<string>();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDoc = async () => {
    if (!slug) {
      setContent('');
      setTitle(undefined);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const doc = await docsService.loadMarkdown(slug, version);
      setTitle(doc.metadata.title);
      setContent(doc.content || '');
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load documentation');
      setContent('');
      setTitle(undefined);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDoc();
  }, [slug, version]);

  return {
    content,
    isLoading,
    error,
    reload: loadDoc,
    title,
  };
}
