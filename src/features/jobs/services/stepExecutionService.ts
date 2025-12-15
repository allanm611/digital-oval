import { buildApiUrl, getAuthHeaders } from "../../../shared/services/api";
import type {
  StepExecution,
  StepExecutionListResponse,
} from "../types/stepExecution";

const BASE_URL = buildApiUrl("/step-executions");

class StepExecutionService {
  private async request<T>(endpoint: string, options: RequestInit = {}) {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        ...getAuthHeaders(options.body !== undefined),
        ...options.headers,
      },
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || `Step executions API error (${response.status})`);
    }
    if (response.status === 204) return {} as T;
    return (await response.json()) as T;
  }

  async getStepExecutionById(id: string): Promise<StepExecution> {
    return this.request<StepExecution>(`/${id}`);
  }

  async getStepExecutionsByJobExecution(
    jobExecutionId: string,
    params?: { limit?: number; offset?: number }
  ): Promise<StepExecutionListResponse> {
    const search = new URLSearchParams();
    if (params?.limit) search.append("limit", String(params.limit));
    if (params?.offset) search.append("offset", String(params.offset));
    const query = search.toString();
    return this.request<StepExecutionListResponse>(
      `/job-executions/${jobExecutionId}${query ? `?${query}` : ""}`
    );
  }

  async searchStepExecutions(body: Record<string, unknown>) {
    return this.request<StepExecutionListResponse>(`/search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  }

  async updateStepExecution(
    id: string,
    payload: Partial<StepExecution>
  ): Promise<StepExecution> {
    return this.request<StepExecution>(`/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  }

  async updateStepExecutionStatus(
    id: string,
    execution_status: string
  ): Promise<StepExecution> {
    return this.request<StepExecution>(`/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ execution_status }),
    });
  }

  async retryFailedSteps(payload: {
    job_execution_id: string;
    step_ids?: number[];
    userId?: number;
  }) {
    return this.request<{ success: boolean }>(`/retry-failed`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  }
}

export const stepExecutionService = new StepExecutionService();
