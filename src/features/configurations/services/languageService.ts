import { buildApiUrl, getAuthHeaders } from "../../../shared/services/api";

export interface Language {
  id: number;
  name: string;
  description?: string;
  is_active: boolean;
  language_code: string;
  country?: string;
  character_set?: string;
  created_at?: string;
  updated_at?: string;
  created_by?: number;
  updated_by?: number;
}

export interface CreateLanguageRequest {
  name: string;
  description?: string;
  is_active?: boolean;
  language_code: string;
  country?: string;
  character_set?: string;
}

export interface UpdateLanguageRequest extends Partial<CreateLanguageRequest> {}

const BASE_URL = buildApiUrl("/language");

class LanguageService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
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
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async getLanguages(): Promise<Language[]> {
    const response = await this.request<{ success: boolean; data: Language[] }>("");
    return response.data || [];
  }

  async getLanguageById(id: number): Promise<Language> {
    return this.request<Language>(`/${id}`);
  }

  async createLanguage(data: CreateLanguageRequest): Promise<Language> {
    return this.request<Language>("", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateLanguage(id: number, data: UpdateLanguageRequest): Promise<Language> {
    return this.request<Language>(`/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async deleteLanguage(id: number): Promise<void> {
    return this.request<void>(`/${id}`, {
      method: "DELETE",
    });
  }
}

export const languageService = new LanguageService();
