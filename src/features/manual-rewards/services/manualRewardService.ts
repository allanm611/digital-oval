import { extractErrorMessage } from "../../../shared/utils/errorHandler";
import { buildApiUrl, getAuthHeaders } from "../../../shared/services/api";
import { MANUAL_REWARD_API } from "../constants/manualRewardEndpoints";
import type {
  ApplyManualRewardResponse,
  CreateManualRewardRequest,
  CreateManualRewardResponse,
  ManualRewardListParams,
  ManualRewardResource,
  UpdateManualRewardRequest,
  UpdateManualRewardResponse,
} from "../types/manualRewardApi";

const BASE_URL = buildApiUrl(MANUAL_REWARD_API.base);

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

  /** POST /manual-reward */
  async create(
    payload: CreateManualRewardRequest,
  ): Promise<CreateManualRewardResponse> {
    return this.request<CreateManualRewardResponse>(MANUAL_REWARD_API.create, {
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
    }>(qs ? `?${qs}` : MANUAL_REWARD_API.list);
    return result.data || [];
  }

  /** GET /manual-reward/:id */
  async getById(id: number): Promise<ManualRewardResource> {
    const result = await this.request<{
      success: boolean;
      data: ManualRewardResource;
    }>(MANUAL_REWARD_API.byId(id));
    return result.data;
  }

  /** PUT /manual-reward/:id */
  async update(
    id: number,
    payload: UpdateManualRewardRequest,
  ): Promise<ManualRewardResource> {
    const result = await this.request<UpdateManualRewardResponse>(
      MANUAL_REWARD_API.byId(id),
      {
        method: "PUT",
        body: JSON.stringify(payload),
      },
    );
    return result.data;
  }

  /** DELETE /manual-reward/:id */
  async delete(id: number): Promise<{ success: boolean; message?: string }> {
    return this.request<{ success: boolean; message?: string }>(
      MANUAL_REWARD_API.byId(id),
      { method: "DELETE" },
    );
  }

  /** POST /manual-reward/:id/apply */
  async apply(id: number): Promise<ApplyManualRewardResponse> {
    return this.request<ApplyManualRewardResponse>(MANUAL_REWARD_API.apply(id), {
      method: "POST",
      body: "{}",
    });
  }
}

export const manualRewardService = new ManualRewardService();
