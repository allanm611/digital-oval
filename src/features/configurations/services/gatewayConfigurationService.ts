import { extractErrorMessage } from "../../../shared/utils/errorHandler";
import { buildApiUrl, getAuthHeaders } from "../../../shared/services/api";
import {
  CreateGatewayConfigurationRequest,
  GatewayConfiguration,
  GatewayConfigurationListParams,
  UpdateGatewayConfigurationRequest,
} from "../types/gatewayConfiguration";

const BASE_URL = buildApiUrl("/gateway-configurations");

class GatewayConfigurationService {
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

  async getAll(
    params?: GatewayConfigurationListParams,
  ): Promise<GatewayConfiguration[]> {
    const query = new URLSearchParams();
    if (params?.channel_id != null) {
      query.set("channel_id", String(params.channel_id));
    }
    if (params?.provider_id != null) {
      query.set("provider_id", String(params.provider_id));
    }
    const qs = query.toString();
    const result = await this.request<{
      success: boolean;
      data:
        | GatewayConfiguration[]
        | { items?: GatewayConfiguration[]; data?: GatewayConfiguration[] };
      total?: number;
    }>(qs ? `?${qs}` : "");
    const payload = result.data;
    if (Array.isArray(payload)) return payload;
    if (payload && typeof payload === "object") {
      if (Array.isArray(payload.items)) return payload.items;
      if (Array.isArray(payload.data)) return payload.data;
    }
    return [];
  }

  async getById(id: number): Promise<GatewayConfiguration> {
    const result = await this.request<{
      success: boolean;
      data: GatewayConfiguration;
    }>(`/${id}`);
    return result.data;
  }

  async create(
    data: CreateGatewayConfigurationRequest,
  ): Promise<GatewayConfiguration> {
    const result = await this.request<{
      success: boolean;
      data: GatewayConfiguration;
    }>("", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return result.data;
  }

  async update(
    id: number,
    data: UpdateGatewayConfigurationRequest,
  ): Promise<GatewayConfiguration> {
    const result = await this.request<{
      success: boolean;
      data: GatewayConfiguration;
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

export const gatewayConfigurationService = new GatewayConfigurationService();

/** Match configs to a channel type label/code (SMS, EMAIL, etc.) when channel_id is unknown. */
export function filterGatewayConfigsByChannelType(
  configs: GatewayConfiguration[],
  channelType: string,
): GatewayConfiguration[] {
  const needle = (channelType || "").toUpperCase().trim();
  if (!needle) return configs;
  return configs.filter((config) => {
    const hay = `${config.channel_value || ""} ${config.channel_label || ""}`.toUpperCase();
    return hay.includes(needle);
  });
}
