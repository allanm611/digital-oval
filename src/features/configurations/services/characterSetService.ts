import { buildApiUrl, getAuthHeaders } from "../../../shared/services/api";

export interface CharacterSet {
  id?: number;
  name: string;
  description?: string;
  is_active: boolean;
  message_type: string;
  character_set_type: string;
  character_set_size: number;
  standard_chars?: string;
  double_chars?: string;
  triple_chars?: string;
  quad_chars?: string;
  created_at?: string;
  updated_at?: string;
}

const BASE_URL = buildApiUrl("/character-set");

class CharacterSetService {
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

  async getCharacterSets(): Promise<CharacterSet[]> {
    return this.request<CharacterSet[]>("");
  }

  async getCharacterSetById(id: number): Promise<CharacterSet> {
    return this.request<CharacterSet>(`/${id}`);
  }

  async createCharacterSet(data: Omit<CharacterSet, "id" | "created_at" | "updated_at">): Promise<CharacterSet> {
    return this.request<CharacterSet>("", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateCharacterSet(id: number, data: Partial<CharacterSet>): Promise<CharacterSet> {
    return this.request<CharacterSet>(`/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async deleteCharacterSet(id: number): Promise<void> {
    return this.request<void>(`/${id}`, {
      method: "DELETE",
    });
  }
}

export const characterSetService = new CharacterSetService();
