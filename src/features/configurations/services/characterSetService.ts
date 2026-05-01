import { buildApiUrl, getAuthHeaders } from "../../../shared/services/api";

export interface CharacterSet {
  id: number;
  name: string;
  description?: string;
  is_active: boolean;
  message_type: 'SMS' | 'FLASH_SMS' | 'UNICODE' | 'BINARY' | 'USSD';
  character_set_type: 'GSM7' | 'UCS2' | 'UTF8' | 'ISO-8859-1';
  character_set_size: number;
  standard_chars: string;
  double_chars?: string;
  triple_chars?: string;
  quad_chars?: string;
  created_at?: string;
  updated_at?: string;
  created_by?: number;
  updated_by?: number;
}

export interface CreateCharacterSetRequest {
  name: string;
  description?: string;
  is_active?: boolean;
  message_type: 'SMS' | 'FLASH_SMS' | 'UNICODE' | 'BINARY' | 'USSD';
  character_set_type: 'GSM7' | 'UCS2' | 'UTF8' | 'ISO-8859-1';
  character_set_size: number;
  standard_chars: string;
  double_chars?: string;
  triple_chars?: string;
  quad_chars?: string;
}

export interface UpdateCharacterSetRequest extends Partial<CreateCharacterSetRequest> {}

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
    const response = await this.request<{ success: boolean; data: CharacterSet[] }>("");
    return response.data || [];
  }

  async getCharacterSetById(id: number): Promise<CharacterSet> {
    const response = await this.request<{ success: boolean; data: CharacterSet[] }>(`/${id}`);
    // API returns data as an array, extract the first item
    const characterSet = Array.isArray(response.data) ? response.data[0] : response.data;
    if (!characterSet) {
      throw new Error("Character set not found");
    }
    return characterSet;
  }

  async createCharacterSet(data: CreateCharacterSetRequest): Promise<CharacterSet> {
    return this.request<CharacterSet>("", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateCharacterSet(id: number, data: UpdateCharacterSetRequest): Promise<CharacterSet> {
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
