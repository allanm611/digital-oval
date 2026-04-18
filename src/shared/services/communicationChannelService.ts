import { buildApiUrl, getAuthHeaders } from "./api";

export interface CommunicationChannel {
  id: number;
  code: string;
  name: string;
  description?: string;
  max_message_length?: number;
  supports_media: boolean;
  supports_personalization: boolean;
  delivery_confirmation_available: boolean;
  default_rate_limit_per_second?: number;
  default_rate_limit_per_minute?: number;
  estimated_cost_per_message?: number;
  currency: string;
  is_active: boolean;
  config?: Record<string, any>;
  created_at: string;
  updated_at: string;
  created_by?: number;
}

export interface CreateCommunicationChannelRequest {
  code: string;
  name: string;
  description?: string;
  is_active?: boolean;
}

export interface UpdateCommunicationChannelRequest {
  name?: string;
  description?: string;
  is_active?: boolean;
}

const BASE_URL = buildApiUrl("/communication-channels");

class CommunicationChannelService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const url = `${BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      headers: {
        ...getAuthHeaders(),
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(
        `Failed to fetch from ${url}: ${response.statusText}`,
      );
    }

    return response.json();
  }

  async getAll() {
    const data = await this.request<{
      success: boolean;
      data: CommunicationChannel[];
    }>("");
    return data.data;
  }

  async getById(id: number) {
    const data = await this.request<{
      success: boolean;
      data: CommunicationChannel;
    }>(`/${id}`);
    return data.data;
  }

  async create(data: CreateCommunicationChannelRequest) {
    const response = await this.request<{
      success: boolean;
      message: string;
      data: CommunicationChannel;
    }>("", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return response.data;
  }

  async update(id: number, data: UpdateCommunicationChannelRequest) {
    const response = await this.request<{
      success: boolean;
      message: string;
      data: CommunicationChannel;
    }>(`/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
    return response.data;
  }

  async delete(id: number) {
    const response = await this.request<{
      success: boolean;
      message: string;
    }>(`/${id}`, {
      method: "DELETE",
    });
    return response;
  }

  async getStatistics() {
    const data = await this.request<{
      success: boolean;
      data: any;
    }>("/statistics");
    return data.data;
  }

  async getCodeDistribution() {
    const data = await this.request<{
      success: boolean;
      data: any;
    }>("/code-distribution");
    return data.data;
  }

  async getRateLimitAnalytics() {
    const data = await this.request<{
      success: boolean;
      data: any;
    }>("/rate-limit-analytics");
    return data.data;
  }

  async getConfigAnalysis() {
    const data = await this.request<{
      success: boolean;
      data: any;
    }>("/config-analysis");
    return data.data;
  }
}

export const communicationChannelService = new CommunicationChannelService();
