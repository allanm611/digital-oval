import { buildApiUrl, getAuthHeaders } from "../../../shared/services/api";
import { ApiResponse } from "../../../shared/types/api";
import {
  SMSGatewayConfig,
  CreateSMSGatewayConfigRequest,
  UpdateSMSGatewayConfigRequest,
} from "../types/smsGatewayConfig";

const BASE_URL = buildApiUrl("/gateway-configs/sms");

export const SMS_GATEWAY_DUMMY_DATA: SMSGatewayConfig[] = [
  {
    id: 1,
    name: "Twilio Primary",
    description: "Primary Twilio account for SMS campaigns",
    channel_type: "SMS",
    provider_type: "EXTERNAL_PROVIDER_A",
    is_active: true,
    credentials: {
      api_key: "***hidden***",
      api_secret: "***hidden***",
      account_sid: "AC1234567890abcdef1234567890abcde",
      phone_number: "+1234567890",
      messaging_service_id: "MG1234567890abcdef1234567890abcde",
    },
    created_at: "2026-01-20T08:00:00Z",
    updated_at: "2026-04-19T12:30:00Z",
  },
  {
    id: 2,
    name: "Mocana SMS Gateway",
    description: "Mocana SMS routing for backup",
    channel_type: "SMS",
    provider_type: "MOCANA",
    is_active: true,
    credentials: {
      api_key: "***hidden***",
      gateway_url: "https://api.mocana.com/sms",
      account_sid: "mocana_account_123",
    },
    created_at: "2026-02-15T14:20:00Z",
    updated_at: "2026-04-17T11:00:00Z",
  },
  {
    id: 3,
    name: "Internal SMS Hub",
    description: "Internal SMS gateway hub",
    channel_type: "SMS",
    provider_type: "INTERNAL",
    is_active: true,
    credentials: {
      api_key: "***hidden***",
      gateway_url: "http://internal-sms.company.local:8080",
    },
    created_at: "2026-01-10T09:00:00Z",
    updated_at: "2026-04-16T15:45:00Z",
  },
];

class SMSGatewayConfigService {
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
      throw new Error(
        `Failed to fetch from ${url}: ${response.statusText}`
      );
    }

    return response.json();
  }

  async getAllConfigs(): Promise<SMSGatewayConfig[]> {
    try {
      const data = await this.request<{
        success: boolean;
        data: SMSGatewayConfig[];
      }>("");
      return data.data;
    } catch (err) {
      return SMS_GATEWAY_DUMMY_DATA;
    }
  }

  async getConfigById(id: number): Promise<SMSGatewayConfig> {
    try {
      const data = await this.request<{
        success: boolean;
        data: SMSGatewayConfig;
      }>(`/${id}`);
      return data.data;
    } catch (err) {
      const config = SMS_GATEWAY_DUMMY_DATA.find((c) => c.id === id);
      if (config) return config;
      throw err;
    }
  }

  async createConfig(
    data: CreateSMSGatewayConfigRequest
  ): Promise<SMSGatewayConfig> {
    const response = await this.request<{
      success: boolean;
      data: SMSGatewayConfig;
    }>("", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return response.data;
  }

  async updateConfig(
    id: number,
    data: UpdateSMSGatewayConfigRequest
  ): Promise<SMSGatewayConfig> {
    const response = await this.request<{
      success: boolean;
      data: SMSGatewayConfig;
    }>(`/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
    return response.data;
  }

  async deleteConfig(id: number): Promise<{ success: boolean; message: string }> {
    const response = await this.request<{
      success: boolean;
      message: string;
    }>(`/${id}`, {
      method: "DELETE",
    });
    return response;
  }
}

export const smsGatewayConfigService = new SMSGatewayConfigService();
