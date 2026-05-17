import { extractErrorMessage } from "../utils/errorHandler";
import { buildApiUrl, getAuthHeaders } from "./api";

export interface ControlGroup {
  id: string | number;
  name: string;
  status: "active" | "inactive" | "expired";
  generationTime: string;
  percentage: number;
  memberCount: number;
  customerBase: "active_subscribers" | "all_customers" | "saved_segments";
  recurrence: "once" | "daily" | "weekly" | "monthly";
  lastGenerated?: string;
  nextGeneration?: string;
  createdBy?: string;
  description?: string;
  sizeMethod?: "percentage" | "fixed_value" | "advanced_parameters";
  outlierRemoval?: boolean;
  varianceCalculation?: boolean;
  createdAt?: string;
  updated_at?: string;
}

export interface CreateControlGroupRequest {
  name: string;
  percentage: number;
  customerBase: "active_subscribers" | "all_customers" | "saved_segments";
  recurrence: "once" | "daily" | "weekly" | "monthly";
  description?: string;
  sizeMethod?: "percentage" | "fixed_value" | "advanced_parameters";
  outlierRemoval?: boolean;
  varianceCalculation?: boolean;
}

export interface UpdateControlGroupRequest {
  name?: string;
  percentage?: number;
  customerBase?: "active_subscribers" | "all_customers" | "saved_segments";
  recurrence?: "once" | "daily" | "weekly" | "monthly";
  description?: string;
  status?: "active" | "inactive" | "expired";
  sizeMethod?: "percentage" | "fixed_value" | "advanced_parameters";
  outlierRemoval?: boolean;
  varianceCalculation?: boolean;
}

const BASE_URL = buildApiUrl("/control-groups");

class ControlGroupService {
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
    const data = await this.request<{ success: boolean; data: ControlGroup[] }>("");
    return data.data;
  }

  async getById(id: string | number) {
    const data = await this.request<{ success: boolean; data: ControlGroup }>(
      `/${id}`
    );
    return data.data;
  }

  async create(data: CreateControlGroupRequest) {
    const response = await this.request<{ success: boolean; data: ControlGroup }>(
      "",
      {
        method: "POST",
        body: JSON.stringify(data),
      }
    );
    return response.data;
  }

  async update(id: string | number, data: UpdateControlGroupRequest) {
    const response = await this.request<{ success: boolean; data: ControlGroup }>(
      `/${id}`,
      {
        method: "PUT",
        body: JSON.stringify(data),
      }
    );
    return response.data;
  }

  async delete(id: string | number) {
    const response = await this.request<{ success: boolean; message: string }>(
      `/${id}`,
      {
        method: "DELETE",
      }
    );
    return response;
  }
}

export const controlGroupService = new ControlGroupService();
