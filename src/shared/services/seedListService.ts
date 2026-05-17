import { buildApiUrl, getAuthHeaders } from "./api";
import { extractErrorMessage } from "../utils/errorHandler";

export interface SeedList {
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

export interface SeedListRecipient {
  id: number;
  seed_list_id: number;
  customer_id: number;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  department_id?: number;
  department_name?: string;
  line_of_business_id?: number;
  line_of_business_name?: string;
  status: "active" | "inactive";
  added_at: string;
  added_by?: number;
  removed_at?: string;
  removed_by?: number;
  created_at: string;
}

export interface CreateSeedListRequest {
  name: string;
  description?: string;
  created_by?: string;
}

export interface UpdateSeedListRequest {
  name?: string;
  description?: string;
}

export interface AddSeedListMemberRequest {
  seed_list_id: number;
  customer_id: number;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  department_id?: number;
  line_of_business_id?: number;
  added_by?: number;
}

const BASE_URL = buildApiUrl("/seed-lists");

class SeedListService {
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
    const data = await this.request<{ success: boolean; data: SeedList[] }>("");
    return data.data;
  }

  async getById(id: number) {
    const data = await this.request<{ success: boolean; data: SeedList }>(
      `/${id}`,
    );
    return data.data;
  }

  async create(data: CreateSeedListRequest) {
    const response = await this.request<{ success: boolean; data: SeedList }>(
      "",
      {
        method: "POST",
        body: JSON.stringify(data),
      },
    );
    return response.data;
  }

  async update(id: number, data: UpdateSeedListRequest) {
    const response = await this.request<{ success: boolean; data: SeedList }>(
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
    const data = await this.request<{
      success: boolean;
      data: SeedListRecipient[];
    }>(`/${id}/members`);
    return data.data;
  }

  async addMember(data: AddSeedListMemberRequest) {
    const response = await this.request<{
      success: boolean;
      data: { id: number };
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
      body: JSON.stringify({
        ...(typeof removedBy === "number" ? { removed_by: removedBy } : {}),
      }),
    });
    return response;
  }
}

export const seedListService = new SeedListService();
