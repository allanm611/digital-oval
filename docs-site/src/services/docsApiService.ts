/**
 * Docs API Service
 * Handles API calls for fetching and saving docs
 * Communicates with backend for database-backed docs
 */

import { docsAuthService } from './docsAuthService';

export interface DocResponse {
  id: string;
  slug: string;
  title: string;
  content: string;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface SaveDocRequest {
  title: string;
  content: string;
}

class DocsApiService {
  private getApiBaseUrl(): string {
    if (typeof window === 'undefined') {
      return import.meta.env.VITE_API_BASE_URL || "http://sentra.groupngs.com:8080/api/database-service";
    }

    const isLocalhost =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";

    if (isLocalhost) {
      return import.meta.env.VITE_API_BASE_URL || "http://sentra.groupngs.com:8080/api/database-service";
    }
    // Production/UAT: use dynamic URL based on hostname
    return `${window.location.protocol}//${window.location.host}/api/database-service`;
  }

  private get API_URL(): string {
    return this.getApiBaseUrl();
  }

  /**
   * Fetch a single doc by slug
   */
  async getDocBySlug(slug: string): Promise<DocResponse> {
    const token = docsAuthService.getAuthToken();

    const response = await fetch(`${this.API_URL}/api/docs/${slug}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        docsAuthService.clearAuth();
        throw new Error('Unauthorized - please log in again');
      }
      if (response.status === 404) {
        throw new Error('Document not found');
      }
      throw new Error('Failed to fetch document');
    }

    return response.json();
  }

  /**
   * Save/update a doc
   */
  async saveDoc(docId: string, data: SaveDocRequest): Promise<DocResponse> {
    const token = docsAuthService.getAuthToken();

    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${this.API_URL}/api/docs/${docId}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      if (response.status === 401) {
        docsAuthService.clearAuth();
        throw new Error('Unauthorized - please log in again');
      }
      if (response.status === 403) {
        throw new Error('You do not have permission to edit this document');
      }
      if (response.status === 404) {
        throw new Error('Document not found');
      }

      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to save document');
    }

    return response.json();
  }

  /**
   * Get all docs (for listing)
   */
  async getAllDocs(): Promise<DocResponse[]> {
    const token = docsAuthService.getAuthToken();

    const response = await fetch(`${this.API_URL}/api/docs`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        docsAuthService.clearAuth();
        throw new Error('Unauthorized');
      }
      throw new Error('Failed to fetch documents');
    }

    return response.json();
  }

  /**
   * Delete a doc
   */
  async deleteDoc(docId: string): Promise<void> {
    const token = docsAuthService.getAuthToken();

    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${this.API_URL}/api/docs/${docId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        docsAuthService.clearAuth();
        throw new Error('Unauthorized');
      }
      if (response.status === 403) {
        throw new Error('You do not have permission to delete this document');
      }
      throw new Error('Failed to delete document');
    }
  }
}

export const docsApiService = new DocsApiService();
