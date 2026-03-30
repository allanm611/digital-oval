import {
  CreateDocumentRequest,
  UpdateDocumentRequest,
  GetAllDocumentsQuery,
  DocumentResponse,
  DocumentListResponse,
  DocumentsListResponse,
  DocumentationSearchResult,
} from '@site/src/types/documentation';

// Get API base URL based on environment
const getApiBaseUrl = () => {
  if (typeof window === 'undefined') return '/api/documentation';

  const isVercel =
    window.location.hostname.includes('vercel.app') ||
    window.location.hostname.includes('.vercel.app');
  const isLocalhost =
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1';

  if (isVercel) {
    return '/api/proxy';
  }
  if (isLocalhost) {
    return import.meta.env.VITE_API_BASE_URL || 'http://sentra.groupngs.com:8080/api/documentation';
  }
  return `${window.location.protocol}//${window.location.host}/api/documentation`;
};

const BASE_URL = getApiBaseUrl();

// Create Document
export async function createDocument(request: CreateDocumentRequest): Promise<DocumentResponse> {
  const response = await fetch(`${BASE_URL}/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`Failed to create document: ${response.statusText}`);
  }

  return response.json();
}

// Get All Documents
export async function getAllDocuments(query?: GetAllDocumentsQuery): Promise<DocumentsListResponse> {
  const params = new URLSearchParams();

  if (query) {
    if (query.limit) params.append('limit', String(query.limit));
    if (query.offset) params.append('offset', String(query.offset));
    if (query.category_id) params.append('category_id', String(query.category_id));
    if (query.doc_type) params.append('doc_type', query.doc_type);
    if (query.q) params.append('q', query.q);
    if (query.sort_by) params.append('sort_by', query.sort_by);
    if (query.sort_order) params.append('sort_order', query.sort_order);
  }

  const url = `${BASE_URL}/documents${params.toString() ? '?' + params.toString() : ''}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch documents: ${response.statusText}`);
  }

  return response.json();
}

// Get Document by Slug
export async function getDocumentBySlug(slug: string): Promise<DocumentResponse> {
  const response = await fetch(`${BASE_URL}/documents/${slug}`);

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(`Document not found: ${slug}`);
    }
    throw new Error(`Failed to fetch document: ${response.statusText}`);
  }

  return response.json();
}

// Update Document
export async function updateDocument(slug: string, request: UpdateDocumentRequest): Promise<DocumentResponse> {
  const response = await fetch(`${BASE_URL}/documents/${slug}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(`Document not found: ${slug}`);
    }
    throw new Error(`Failed to update document: ${response.statusText}`);
  }

  return response.json();
}

// Delete Document
export async function deleteDocument(slug: string): Promise<{ message: string; success: boolean }> {
  const response = await fetch(`${BASE_URL}/documents/${slug}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(`Document not found: ${slug}`);
    }
    throw new Error(`Failed to delete document: ${response.statusText}`);
  }

  return response.json();
}

// List Documents by Category
export async function listDocumentsByCategory(
  categoryId: number,
  limit?: number,
  offset?: number
): Promise<DocumentListResponse> {
  const params = new URLSearchParams();
  if (limit) params.append('limit', String(limit));
  if (offset) params.append('offset', String(offset));

  const url = `${BASE_URL}/categories/${categoryId}/documents${params.toString() ? '?' + params.toString() : ''}`;
  const response = await fetch(url);

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(`Category not found: ${categoryId}`);
    }
    throw new Error(`Failed to fetch documents: ${response.statusText}`);
  }

  return response.json();
}

// Search Documents
export async function searchDocuments(query: string): Promise<DocumentationSearchResult[]> {
  if (!query.trim()) {
    throw new Error('Search query is required');
  }

  const params = new URLSearchParams({ q: query });
  const response = await fetch(`${BASE_URL}/search?${params.toString()}`);

  if (!response.ok) {
    throw new Error(`Failed to search documents: ${response.statusText}`);
  }

  return response.json();
}
