/**
 * Hook: useDocumentation
 * Load and manage documentation content from API
 */

import { useEffect, useState } from 'react';
import { docsService } from '../services/docsService';
import { DocDocument } from '../types/documentation';

export interface UseDocumentationReturn {
  content: string;
  isLoading: boolean;
  error: string | null;
  reload: () => void;
  document?: DocDocument;
}

export function useDocumentation(slug?: string): UseDocumentationReturn {
  const [content, setContent] = useState('');
  const [document, setDocument] = useState<DocDocument | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDoc = async () => {
    if (!slug) {
      setContent('');
      setDocument(undefined);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const doc = await docsService.loadDocument(slug);
      setDocument(doc);
      setContent(doc.markdown_content || '');
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load documentation');
      setContent('');
      setDocument(undefined);
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
    document,
  };
}
