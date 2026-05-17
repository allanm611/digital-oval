import { extractErrorMessage } from "../utils/errorHandler";
import { buildApiUrl, getAuthHeaders } from "./api";

export interface NotificationRule {
  id: number;
  name: string;
  description?: string;
  table_name: string;
  action_type: string;
  message_template: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: number;
  updated_by?: number;
}

export interface CreateNotificationRuleRequest {
  name: string;
  description?: string;
  table_name: string;
  action_type: string;
  message_template: string;
  is_active?: boolean;
}

export interface UpdateNotificationRuleRequest {
  name?: string;
  description?: string;
  table_name?: string;
  action_type?: string;
  message_template?: string;
  is_active?: boolean;
}

const BASE_URL = buildApiUrl("/notifications/rules");

class NotificationRuleService {
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
      const errorBody = await response.text();
      const errorMessage = extractErrorMessage(errorBody, response.status);
      throw new Error(errorMessage);
    }

    return response.json();
  }

  async getAll() {
    const data = await this.request<{ success: boolean; data: NotificationRule[] }>("");
    return data.data;
  }

  async getById(id: number) {
    const data = await this.request<{ success: boolean; data: NotificationRule }>(
      `/${id}`
    );
    return data.data;
  }

  async create(data: CreateNotificationRuleRequest) {
    const response = await this.request<{ success: boolean; data: NotificationRule }>(
      "",
      {
        method: "POST",
        body: JSON.stringify(data),
      }
    );
    return response.data;
  }

  async update(id: number, data: UpdateNotificationRuleRequest) {
    const response = await this.request<{ success: boolean; data: NotificationRule }>(
      `/${id}`,
      {
        method: "PUT",
        body: JSON.stringify(data),
      }
    );
    return response.data;
  }

  async delete(id: number) {
    const response = await this.request<{ success: boolean; message: string }>(
      `/${id}`,
      {
        method: "DELETE",
      }
    );
    return response;
  }

  async getTables() {
    const url = buildApiUrl("/notifications/tables");
    const response = await fetch(url, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch notification tables: ${response.statusText}`);
    }

    const data = await response.json();
    return Array.isArray(data) ? data : (data as any).data || [];
  }
}

export const notificationTypeService = new NotificationRuleService();
