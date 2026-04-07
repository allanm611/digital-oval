import { buildApiUrl, getAuthHeaders } from "./api";

export interface NotificationType {
  id: number;
  name: string;
  description?: string;
  notification_key: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: number;
  updated_by?: number;
}

export interface CreateNotificationTypeRequest {
  name: string;
  description?: string;
  notification_key: string;
  is_active?: boolean;
}

export interface UpdateNotificationTypeRequest {
  name?: string;
  description?: string;
  notification_key?: string;
  is_active?: boolean;
}

const BASE_URL = buildApiUrl("/notifications/types");

class NotificationTypeService {
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
      throw new Error(`Failed to fetch from ${url}: ${response.statusText}`);
    }

    return response.json();
  }

  async getAll() {
    const data = await this.request<{ success: boolean; data: NotificationType[] }>("");
    return data.data;
  }

  async getById(id: number) {
    const data = await this.request<{ success: boolean; data: NotificationType }>(
      `/${id}`
    );
    return data.data;
  }

  async create(data: CreateNotificationTypeRequest) {
    const response = await this.request<{ success: boolean; data: NotificationType }>(
      "",
      {
        method: "POST",
        body: JSON.stringify(data),
      }
    );
    return response.data;
  }

  async update(id: number, data: UpdateNotificationTypeRequest) {
    const response = await this.request<{ success: boolean; data: NotificationType }>(
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
}

export const notificationTypeService = new NotificationTypeService();
