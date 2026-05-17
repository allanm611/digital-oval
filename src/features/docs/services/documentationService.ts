import { API_CONFIG, buildApiUrl, getAuthHeaders } from "../../../shared/services/api";
import {
  DocDocument,
  DocCategory,
  DocVersion,
  CreateDocPayload,
  CreateCategoryPayload,
  DocumentsListResponse,
  VersionsListResponse,
  CreateDocumentResponse,
  CreateCategoryResponse,
  RollbackResponse,
  UploadImageResponse,
  DocSearchResult,
} from "../types/documentation";

const BASE_URL = buildApiUrl(API_CONFIG.ENDPOINTS.DOCUMENTATION);

class DocumentationService {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      headers: {
        ...getAuthHeaders(),
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      try {
        const errorData = await response.json();
        if (errorData.error) throw new Error(errorData.error);
        if (errorData.message) throw new Error(errorData.message);
        if (errorData.details) throw new Error(errorData.details);
        throw new Error(`HTTP error! status: ${response.status}`);
      } catch (err) {
        if (err instanceof Error && err.message.includes("JSON")) {
          const textError = await response.text();
          throw new Error(textError || `HTTP error! status: ${response.status}`);
        }
        if (err instanceof Error) throw err;
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    }

    return response.json();
  }

  // ===== Documents =====

  async getDocuments(params?: { limit?: number; offset?: number }): Promise<DocumentsListResponse> {
    const queryString = new URLSearchParams();
    if (params?.limit) queryString.append("limit", params.limit.toString());
    if (params?.offset) queryString.append("offset", params.offset.toString());
    const query = queryString.toString() ? `?${queryString.toString()}` : "";
    return this.request<DocumentsListResponse>(`/documents${query}`);
  }

  async getDocumentBySlug(slug: string): Promise<DocDocument> {
    return this.request<DocDocument>(`/documents/${slug}`);
  }

  async createDocument(payload: CreateDocPayload): Promise<CreateDocumentResponse> {
    return this.request<CreateDocumentResponse>("/create", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async updateDocument(
    slug: string,
    payload: Partial<CreateDocPayload>
  ): Promise<DocDocument> {
    return this.request<DocDocument>(`/documents/${slug}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  }

  async deleteDocument(slug: string): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>(`/documents/${slug}`, {
      method: "DELETE",
    });
  }

  // ===== Document Versions =====

  async getDocumentVersions(slug: string): Promise<VersionsListResponse> {
    return this.request<VersionsListResponse>(`/documents/${slug}/versions`);
  }

  async getDocumentVersion(slug: string, version: number): Promise<DocDocument> {
    return this.request<DocDocument>(`/documents/${slug}/versions/${version}`);
  }

  async rollbackDocument(
    slug: string,
    version: number,
    reason?: string
  ): Promise<RollbackResponse> {
    return this.request<RollbackResponse>(
      `/documents/${slug}/rollback/${version}`,
      {
        method: "POST",
        body: JSON.stringify({ reason }),
      }
    );
  }

  // ===== Categories =====

  async getCategories(): Promise<DocCategory[]> {
    return this.request<DocCategory[]>("/categories");
  }

  async getCategoryById(id: number): Promise<DocCategory> {
    return this.request<DocCategory>(`/categories/${id}`);
  }

  async createCategory(payload: CreateCategoryPayload): Promise<CreateCategoryResponse> {
    return this.request<CreateCategoryResponse>("/categories", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async updateCategory(
    id: number,
    payload: Partial<CreateCategoryPayload>
  ): Promise<DocCategory> {
    return this.request<DocCategory>(`/categories/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  }

  async deleteCategory(id: number): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>(`/categories/${id}`, {
      method: "DELETE",
    });
  }

  async getCategoryDocuments(
    id: number,
    params?: { limit?: number; offset?: number }
  ): Promise<DocumentsListResponse> {
    const queryString = new URLSearchParams();
    if (params?.limit) queryString.append("limit", params.limit.toString());
    if (params?.offset) queryString.append("offset", params.offset.toString());
    const query = queryString.toString() ? `?${queryString.toString()}` : "";
    return this.request<DocumentsListResponse>(`/categories/${id}/documents${query}`);
  }

  // ===== Search & Discovery =====

  async search(q: string, params?: { limit?: number; offset?: number }): Promise<DocSearchResult[]> {
    const queryString = new URLSearchParams();
    queryString.append("q", q);
    if (params?.limit) queryString.append("limit", params.limit.toString());
    if (params?.offset) queryString.append("offset", params.offset.toString());
    return this.request<DocSearchResult[]>(`/search?${queryString.toString()}`);
  }

  // ===== Images =====

  async uploadImage(formData: FormData): Promise<UploadImageResponse> {
    const response = await fetch(`${BASE_URL}/upload-image-base64`, {
      method: "POST",
      headers: {
        ...getAuthHeaders(false),
      },
      body: formData,
    });

    if (!response.ok) {
      try {
        const errorData = await response.json();
        if (errorData.error) throw new Error(errorData.error);
        if (errorData.message) throw new Error(errorData.message);
        throw new Error(`HTTP error! status: ${response.status}`);
      } catch (err) {
        if (err instanceof Error) throw err;
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    }

    return response.json();
  }
}

export const documentationService = new DocumentationService();
export default documentationService;
