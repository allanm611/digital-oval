import { buildApiUrl, getAuthHeaders } from "../../../shared/services/api";
import { ApiResponse } from "../../../shared/types/api";

export enum ChannelEnum {
  SMS = 'SMS',
  Email = 'Email',
  Push = 'Push',
  InApp = 'InApp',
  Web = 'Web',
  IVR = 'IVR',
  USSD = 'USSD',
  WhatsApp = 'WhatsApp',
}

export const CHANNEL_OPTIONS = [
  { label: 'SMS', value: ChannelEnum.SMS },
  { label: 'Email', value: ChannelEnum.Email },
  { label: 'Push', value: ChannelEnum.Push },
  { label: 'InApp', value: ChannelEnum.InApp },
  { label: 'Web', value: ChannelEnum.Web },
  { label: 'IVR', value: ChannelEnum.IVR },
  { label: 'USSD', value: ChannelEnum.USSD },
  { label: 'WhatsApp', value: ChannelEnum.WhatsApp },
];

export interface CreativeTemplate {
  id: number;
  name: string;
  code: string;
  description?: string;
  is_active: boolean;
  channel: ChannelEnum;
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
  primaryChannel: ChannelEnum;
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

  async getCreativeTemplates(): Promise<ApiResponse<CreativeTemplate[]>> {
    return this.request<ApiResponse<CreativeTemplate[]>>("");
  }

  async getCreativeTemplateById(id: number): Promise<CreativeTemplate> {
    const response = await this.request<{ success: boolean; data: CreativeTemplate[] }>(`/${id}`);
    // API returns data as an array, extract the first item
    const template = Array.isArray(response.data) ? response.data[0] : response.data;
    if (!template) {
      throw new Error("Creative template not found");
    }
    return template;
  }

  async createCreativeTemplate(data: CreateCreativeTemplateRequest): Promise<ApiResponse<CreativeTemplate>> {
    return this.request<ApiResponse<CreativeTemplate>>("", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async createCreativeTemplates(data: CreateCreativeTemplateRequest[]): Promise<ApiResponse<CreativeTemplate[]>> {
    return this.request<ApiResponse<CreativeTemplate[]>>("", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateCreativeTemplate(id: number, data: UpdateCreativeTemplateRequest): Promise<ApiResponse<CreativeTemplate>> {
    return this.request<ApiResponse<CreativeTemplate>>(`/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async deleteCreativeTemplate(id: number): Promise<ApiResponse<{ message: string }>> {
    return this.request<ApiResponse<{ message: string }>>(`/${id}`, {
      method: "DELETE",
    });
  }
}

export const creativeTemplateService = new CreativeTemplateService();
