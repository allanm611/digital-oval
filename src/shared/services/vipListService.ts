import { extractErrorMessage } from "../utils/errorHandler";
import { buildApiUrl, getAuthHeaders } from "./api";

export interface VIPList {
  id: number;
  name: string;
  description?: string;
  original_filename?: string;
  file_hash?: string;
  rows_imported?: number;
  rows_failed?: number;
  processing_status?: "pending" | "processing" | "completed" | "failed";
  processing_error?: string;
  processing_time_ms?: number;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface VIPCustomer {
  id: number;
  vip_list_id: number;
  customer_id: number;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  vip_list_name?: string;
  status: "active" | "inactive";
  added_at: string;
  added_by?: number;
  removed_at?: string;
  removed_by?: number;
  created_at: string;
}

export interface CreateVIPListRequest {
  name: string;
  description?: string;
  created_by?: string;
}

export interface UpdateVIPListRequest {
  name?: string;
  description?: string;
}

export interface AddVIPMemberRequest {
  vip_list_id: number;
  customer_id: number;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  added_by?: number;
}

const BASE_URL = buildApiUrl("/vip-lists");

class VIPListService {
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
    const data = await this.request<{ success: boolean; data: VIPList[] }>("");
    return data.data;
  }

  async getById(id: number) {
    const data = await this.request<{ success: boolean; data: VIPList }>(
      `/${id}`,
    );
    return data.data;
  }

  async create(data: CreateVIPListRequest) {
    const response = await this.request<{ success: boolean; data: VIPList }>(
      "",
      {
        method: "POST",
        body: JSON.stringify(data),
      },
    );
    return response.data;
  }

  async update(id: number, data: UpdateVIPListRequest) {
    const response = await this.request<{ success: boolean; data: VIPList }>(
      `/${id}`,
      {
        method: "PUT",
        body: JSON.stringify(data),
      },
    );
    return response.data;
  }

  async delete(id: number) {
    const response = await this.request<{ success: boolean; message: string }>(
      `/${id}`,
      {
        method: "DELETE",
      },
    );
    return response;
  }

  async getMembers(id: number) {
    const data = await this.request<{ success: boolean; data: VIPCustomer[] }>(
      `/${id}/members`,
    );
    return data.data;
  }

  async addMember(data: AddVIPMemberRequest) {
    const response = await this.request<{
      success: boolean;
      member_id: number;
    }>("/members", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return response;
  }

  async removeMember(listId: number, memberId: number, removedBy?: number) {
    const response = await this.request<{
      success: boolean;
      message?: string;
    }>(`/${listId}/members/${memberId}`, {
      method: "DELETE",
      ...(typeof removedBy === "number" ? {
        body: JSON.stringify({ removed_by: removedBy }),
      } : {}),
    });
    return response;
  }
}

export const vipListService = new VIPListService();
