import { fetchWithAuthInterceptor } from "../../../shared/services/fetchInterceptor";
import { API_CONFIG } from "../../../shared/services/api";
import { ApiResponse } from "../../../shared/types/api";

export interface DNDType {
  id: number;
  name: string;
  description?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface DNDSubscription {
  id: number;
  customer_id?: number;
  customer_name?: string;
  customer_email?: string;
  customer_phone: string;
  channel: "SMS" | "EMAIL" | "USSD" | "APP";
  dnd_type_id: number;
  dnd_type_name?: string;
  status: "active" | "removed";
  added_at: string;
  added_by?: number;
  added_by_name?: string;
  removed_at?: string;
  removed_by?: number;
  removed_by_name?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateDNDSubscriptionRequest {
  customer_phone: string;
  channel: "SMS" | "EMAIL" | "USSD" | "APP";
  dnd_type_id: number;
  customer_name?: string;
  customer_email?: string;
  added_by?: number;
}

export interface RemoveDNDSubscriptionRequest {
  removed_by?: number;
}

class DNDService {
  private baseUrl = `${API_CONFIG.BASE_URL}/dnd`;

  private async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      "Content-Type": "application/json",
      ...options?.headers,
    };

    const response = await fetchWithAuthInterceptor(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error || errorData.message || `HTTP ${response.status}`
      );
    }

    return response.json();
  }

  // DND Types
  async getDNDTypes(activeOnly: boolean = true): Promise<DNDType[]> {
    const data = await this.request<ApiResponse<DNDType[]>>(
      `/types?activeOnly=${activeOnly}`
    );
    return data.data || [];
  }

  async createDNDType(payload: {
    name: string;
    description?: string;
  }): Promise<DNDType> {
    const data = await this.request<ApiResponse<DNDType>>("/types", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return data.data || {};
  }

  async updateDNDType(
    id: number,
    payload: {
      name?: string;
      description?: string;
      is_active?: boolean;
    }
  ): Promise<DNDType> {
    const data = await this.request<ApiResponse<DNDType>>(`/types/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
    return data.data || {};
  }

  async deleteDNDType(id: number): Promise<ApiResponse<{ message: string }>> {
    return this.request<ApiResponse<{ message: string }>>(`/types/${id}`, {
      method: "DELETE",
    });
  }

  // DND Subscriptions
  async getDNDSubscriptions(filters?: {
    channel?: string;
    dnd_type_id?: number;
    status?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<DNDSubscription[]> {
    const params = new URLSearchParams();
    if (filters?.channel) params.append("channel", filters.channel);
    if (filters?.dnd_type_id) params.append("dnd_type_id", String(filters.dnd_type_id));
    if (filters?.status) params.append("status", filters.status);
    if (filters?.search) params.append("search", filters.search);
    if (filters?.limit) params.append("limit", String(filters.limit));
    if (filters?.offset) params.append("offset", String(filters.offset));

    const queryString = params.toString();
    const endpoint = `/subscriptions${queryString ? `?${queryString}` : ""}`;

    const data = await this.request<ApiResponse<DNDSubscription[]>>(endpoint);
    return data.data || [];
  }

  async addDNDSubscription(
    payload: CreateDNDSubscriptionRequest
  ): Promise<DNDSubscription> {
    const data = await this.request<ApiResponse<DNDSubscription>>(
      "/subscriptions",
      {
        method: "POST",
        body: JSON.stringify(payload),
      }
    );
    return data.data || {};
  }

  async removeDNDSubscription(
    id: number,
    payload?: RemoveDNDSubscriptionRequest
  ): Promise<ApiResponse<{ message: string }>> {
    return this.request<ApiResponse<{ message: string }>>(
      `/subscriptions/${id}/remove`,
      {
        method: "PATCH",
        body: JSON.stringify(payload || {}),
      }
    );
  }
}

export const dndService = new DNDService();
