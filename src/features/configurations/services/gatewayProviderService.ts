import { extractErrorMessage } from "../../../shared/utils/errorHandler";
import { buildApiUrl, getAuthHeaders } from "../../../shared/services/api";

export interface GatewayProviderField {
  name: string;
  label: string;
  type: "text" | "password" | "number" | "boolean" | "select";
  required?: boolean;
  placeholder?: string;
  options?: string[];
  /** Seeded into new gateway configurations when the field is empty. */
  default?: string | number | boolean;
}

export interface GatewayProviderFieldSchema {
  /** Connection protocol that produced the canonical fields. Stored on the schema so it survives without a dedicated backend column. */
  protocol?: string;
  fields: GatewayProviderField[];
}

export interface GatewayProvider {
  id: number;
  name: string;
  channel_id?: number;
  /** Present if the backend later exposes protocol as a column. */
  protocol?: string;
  field_schema?: GatewayProviderFieldSchema;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
  channel_value?: string;
  channel_label?: string;
}

export interface CreateGatewayProviderRequest {
  name: string;
  channel_id: number;
  field_schema: GatewayProviderFieldSchema;
  is_active?: boolean;
}

export interface UpdateGatewayProviderRequest {
  name?: string;
  field_schema?: GatewayProviderFieldSchema;
  is_active?: boolean;
}

const BASE_URL = buildApiUrl("/gateway-providers");

class GatewayProviderService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      headers: {
        ...getAuthHeaders(),
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(extractErrorMessage(errorBody, response.status));
    }

    return response.json();
  }

  async getAll(params?: { channel_id?: number }): Promise<GatewayProvider[]> {
    const query = new URLSearchParams();
    if (params?.channel_id != null) {
      query.set("channel_id", String(params.channel_id));
    }
    const qs = query.toString();
    const result = await this.request<{
      success: boolean;
      data: GatewayProvider[];
    }>(qs ? `?${qs}` : "");
    return result.data || [];
  }

  async getById(id: number): Promise<GatewayProvider> {
    const result = await this.request<{
      success: boolean;
      data: GatewayProvider;
    }>(`/${id}`);
    return result.data;
  }

  async create(data: CreateGatewayProviderRequest): Promise<GatewayProvider> {
    const result = await this.request<{
      success: boolean;
      data: GatewayProvider;
    }>("", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return result.data;
  }

  async update(
    id: number,
    data: UpdateGatewayProviderRequest,
  ): Promise<GatewayProvider> {
    const result = await this.request<{
      success: boolean;
      data: GatewayProvider;
    }>(`/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
    return result.data;
  }

  async delete(id: number): Promise<void> {
    await this.request<{ success: boolean; message?: string }>(`/${id}`, {
      method: "DELETE",
    });
  }
}

export const gatewayProviderService = new GatewayProviderService();
