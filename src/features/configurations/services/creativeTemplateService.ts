import { buildApiUrl, getAuthHeaders } from "../../../shared/services/api";

export interface CreativeTemplate {
  id: number;
  name: string;
  code: string;
  description?: string;
  is_active: boolean;
  channel: 'SMS' | 'Email' | 'Push' | 'InApp' | 'Web' | 'IVR' | 'USSD' | 'WhatsApp';
  locale: string;
  title?: string;
  body_text?: string;
  body_html?: string;
  variables?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
  created_by?: number;
  updated_by?: number;
}

export interface CreateCreativeTemplateRequest {
  name: string;
  code: string;
  description?: string;
  isActive?: boolean;
  primaryChannel: 'SMS' | 'Email' | 'Push' | 'InApp' | 'Web' | 'IVR' | 'USSD' | 'WhatsApp';
  locale?: string;
  title?: string;
  text_body?: string;
  html_body?: string;
  variables?: Record<string, any>;
}

export interface UpdateCreativeTemplateRequest extends Partial<CreateCreativeTemplateRequest> {}

const BASE_URL = buildApiUrl("/creative-template");

class CreativeTemplateService {
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

  async getCreativeTemplates(): Promise<CreativeTemplate[]> {
    return this.request<CreativeTemplate[]>("");
  }

  async getCreativeTemplateById(id: number): Promise<CreativeTemplate> {
    return this.request<CreativeTemplate>(`/${id}`);
  }

  async createCreativeTemplate(data: CreateCreativeTemplateRequest): Promise<CreativeTemplate> {
    return this.request<CreativeTemplate>("", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async createCreativeTemplates(data: CreateCreativeTemplateRequest[]): Promise<CreativeTemplate[]> {
    return this.request<CreativeTemplate[]>("", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateCreativeTemplate(id: number, data: UpdateCreativeTemplateRequest): Promise<CreativeTemplate> {
    return this.request<CreativeTemplate>(`/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async deleteCreativeTemplate(id: number): Promise<void> {
    return this.request<void>(`/${id}`, {
      method: "DELETE",
    });
  }
}

export const creativeTemplateService = new CreativeTemplateService();
