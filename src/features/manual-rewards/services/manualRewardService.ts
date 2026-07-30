import { extractErrorMessage } from "../../../shared/utils/errorHandler";
import { buildApiUrl, getAuthHeaders } from "../../../shared/services/api";
import type {
  CreateManualRewardRequest,
  CreateManualRewardResponse,
  ManualRewardListParams,
  ManualRewardResource,
} from "../types/manualRewardApi";

const BASE_URL = buildApiUrl("/manual-reward");

class ManualRewardService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
        ...options.headers,
      },
      ...options,
    });

    const text = await response.text();
    let body: T & { success?: boolean; error?: string; message?: string };
    try {
      body = text ? JSON.parse(text) : ({} as T);
    } catch {
      throw new Error(extractErrorMessage(text, response.status));
    }

    if (!response.ok) {
      throw new Error(
        extractErrorMessage(
          (body as { error?: string; message?: string }).error ||
            (body as { message?: string }).message ||
            text,
          response.status,
        ),
      );
    }

    return body;
  }

  /** POST /manual-reward — creates job; with applyType "now" may fulfill immediately */
  async create(
    payload: CreateManualRewardRequest,
  ): Promise<CreateManualRewardResponse> {
    return this.request<CreateManualRewardResponse>("", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  /** GET /manual-reward */
  async getAll(
    params?: ManualRewardListParams,
  ): Promise<ManualRewardResource[]> {
    const query = new URLSearchParams();
    if (params?.limit != null) query.set("limit", String(params.limit));
    if (params?.offset != null) query.set("offset", String(params.offset));
    if (params?.status) query.set("status", params.status);
    if (params?.rewardType) query.set("rewardType", params.rewardType);
    const qs = query.toString();
    const result = await this.request<{
      success: boolean;
      data: ManualRewardResource[];
    }>(qs ? `?${qs}` : "");
    return result.data || [];
  }

  /** GET /manual-reward/:id */
  async getById(id: number): Promise<ManualRewardResource> {
    const result = await this.request<{
      success: boolean;
      data: ManualRewardResource;
    }>(`/${id}`);
    return result.data;
  }

  /** DELETE /manual-reward/:id — soft delete */
  async delete(id: number): Promise<{ success: boolean; message?: string }> {
    return this.request<{ success: boolean; message?: string }>(`/${id}`, {
      method: "DELETE",
    });
  }

  /** POST /manual-reward/:id/apply */
  async apply(
    id: number,
  ): Promise<{ success: boolean; data?: { applied?: number; failed?: number } }> {
    return this.request(`/${id}/apply`, { method: "POST", body: "{}" });
  }
}

export const manualRewardService = new ManualRewardService();
