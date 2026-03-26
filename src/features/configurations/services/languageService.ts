import { buildApiUrl, getAuthHeaders } from "../../../shared/services/api";

export interface Language {
  id?: number;
  name: string;
  description?: string;
  is_active: boolean;
  language_code: string;
  country?: string;
  character_set?: string;
  created_at?: string;
  updated_at?: string;
}

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
    return this.request<Language[]>("");
  }

  async getLanguageById(id: number): Promise<Language> {
    return this.request<Language>(`/${id}`);
  }

  async createLanguage(data: Omit<Language, "id" | "created_at" | "updated_at">): Promise<Language> {
    return this.request<Language>("", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateLanguage(id: number, data: Partial<Language>): Promise<Language> {
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
