import { API_CONFIG, getAuthHeaders } from "../../../shared/services/api";
import {
  CreateProgramRequest,
  UpdateProgramRequest,
  ProgramResponse,
  SingleProgramResponse,
} from "../types/program";

const BASE_URL = `${API_CONFIG.BASE_URL}/programs`;

class ProgramService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const url = `${BASE_URL}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        ...getAuthHeaders(),
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("API Error Response:", {
        status: response.status,
        statusText: response.statusText,
        body: errorBody,
        url,
      });
      throw new Error(
        `HTTP error! status: ${response.status}, details: ${errorBody}`,
      );
    }

    return response.json();
  }

  async getAllPrograms(params?: {
    limit?: number;
    offset?: number;
    skipCache?: boolean;
  }): Promise<ProgramResponse> {
    const queryParams = new URLSearchParams();
    if (params) {
      if (params.limit) queryParams.append("limit", String(params.limit));
      if (params.offset) queryParams.append("offset", String(params.offset));
      if (params.skipCache) queryParams.append("skipCache", "true");
    }
    const query = queryParams.toString() ? `?${queryParams.toString()}` : "";
    return this.request<ProgramResponse>(`${query}`);
  }

  async getProgramById(
    id: number,
    skipCache?: boolean,
  ): Promise<SingleProgramResponse> {
    const query = skipCache ? "?skipCache=true" : "";
    return this.request<SingleProgramResponse>(`/${id}${query}`);
  }

  async createProgram(
    request: CreateProgramRequest,
  ): Promise<SingleProgramResponse> {
    return this.request<SingleProgramResponse>("", {
      method: "POST",
      body: JSON.stringify(request),
    });
  }

  async updateProgram(
    id: number,
    request: UpdateProgramRequest,
  ): Promise<SingleProgramResponse> {
    return this.request<SingleProgramResponse>(`/${id}`, {
      method: "PUT",
      body: JSON.stringify(request),
    });
  }

  async deleteProgram(
    id: number,
  ): Promise<{ success: boolean; message?: string }> {
    return this.request<{ success: boolean; message?: string }>(`/${id}`, {
      method: "DELETE",
    });
  }

  async activateProgram(
    id: number,
    updatedBy: number,
  ): Promise<SingleProgramResponse> {
    return this.request<SingleProgramResponse>(`/${id}/activate`, {
      method: "PATCH",
      body: JSON.stringify({ updated_by: updatedBy }),
    });
  }

  async deactivateProgram(
    id: number,
    updatedBy: number,
  ): Promise<SingleProgramResponse> {
    return this.request<SingleProgramResponse>(`/${id}/deactivate`, {
      method: "PATCH",
      body: JSON.stringify({ updated_by: updatedBy }),
    });
  }

  /**
   * Get program statistics
   */
  async getProgramStats(
    skipCache: boolean = false,
  ): Promise<Record<string, unknown>> {
    const query = skipCache ? "?skipCache=true" : "";
    return this.request<Record<string, unknown>>(`/stats${query}`);
  }

  /**
   * Get program budget utilization
   */
  async getProgramBudgetUtilization(
    id: number,
    skipCache: boolean = false,
  ): Promise<Record<string, unknown>> {
    const query = skipCache ? "?skipCache=true" : "";
    return this.request<Record<string, unknown>>(
      `/${id}/budget-utilization${query}`,
    );
  }

  /**
   * Get program campaigns
   */
  async getProgramCampaigns(
    id: number,
    params?: {
      limit?: number;
      offset?: number;
      skipCache?: boolean;
    },
  ): Promise<Record<string, unknown>> {
    const queryParams = new URLSearchParams();
    if (params) {
      if (params.limit) queryParams.append("limit", String(params.limit));
      if (params.offset) queryParams.append("offset", String(params.offset));
      if (params.skipCache) queryParams.append("skipCache", "true");
    }
    const query = queryParams.toString() ? `?${queryParams.toString()}` : "";
    return this.request<Record<string, unknown>>(`/${id}/campaigns${query}`);
  }

  /**
   * Get program performance
   */
  async getProgramPerformance(
    id: number,
    skipCache: boolean = false,
  ): Promise<Record<string, unknown>> {
    const query = skipCache ? "?skipCache=true" : "";
    return this.request<Record<string, unknown>>(`/${id}/performance${query}`);
  }

  /**
   * Get budget analysis
   */
  async getProgramBudgetAnalysis(
    skipCache: boolean = false,
  ): Promise<Record<string, unknown>> {
    const query = skipCache ? "?skipCache=true" : "";
    return this.request<Record<string, unknown>>(`/budget-analysis${query}`);
  }

  /**
   * Get program timeline
   */
  async getProgramTimeline(
    skipCache: boolean = false,
  ): Promise<Record<string, unknown>> {
    const query = skipCache ? "?skipCache=true" : "";
    return this.request<Record<string, unknown>>(`/timeline${query}`);
  }

  /**
   * Get active programs
   */
  async getActivePrograms(params?: {
    limit?: number;
    offset?: number;
    skipCache?: boolean;
  }): Promise<ProgramResponse> {
    const queryParams = new URLSearchParams();
    if (params) {
      if (params.limit) queryParams.append("limit", String(params.limit));
      if (params.offset) queryParams.append("offset", String(params.offset));
      if (params.skipCache) queryParams.append("skipCache", "true");
    }
    const query = queryParams.toString() ? `?${queryParams.toString()}` : "";
    return this.request<ProgramResponse>(`/active${query}`);
  }

  /**
   * Search programs
   */
  async searchPrograms(
    searchTerm: string,
    params?: {
      limit?: number;
      offset?: number;
      skipCache?: boolean;
    },
  ): Promise<ProgramResponse> {
    const queryParams = new URLSearchParams();
    queryParams.append("searchTerm", searchTerm);
    if (params) {
      if (params.limit) queryParams.append("limit", String(params.limit));
      if (params.offset) queryParams.append("offset", String(params.offset));
      if (params.skipCache) queryParams.append("skipCache", "true");
    }
    const query = queryParams.toString() ? `?${queryParams.toString()}` : "";
    return this.request<ProgramResponse>(`/search${query}`);
  }

  /**
   * Get programs over budget
   */
  async getProgramsOverBudget(params?: {
    limit?: number;
    offset?: number;
    skipCache?: boolean;
  }): Promise<ProgramResponse> {
    const queryParams = new URLSearchParams();
    if (params) {
      if (params.limit) queryParams.append("limit", String(params.limit));
      if (params.offset) queryParams.append("offset", String(params.offset));
      if (params.skipCache) queryParams.append("skipCache", "true");
    }
    const query = queryParams.toString() ? `?${queryParams.toString()}` : "";
    return this.request<ProgramResponse>(`/over-budget${query}`);
  }

  /**
   * Get programs under budget
   */
  async getProgramsUnderBudget(params?: {
    limit?: number;
    offset?: number;
    skipCache?: boolean;
  }): Promise<ProgramResponse> {
    const queryParams = new URLSearchParams();
    if (params) {
      if (params.limit) queryParams.append("limit", String(params.limit));
      if (params.offset) queryParams.append("offset", String(params.offset));
      if (params.skipCache) queryParams.append("skipCache", "true");
    }
    const query = queryParams.toString() ? `?${queryParams.toString()}` : "";
    return this.request<ProgramResponse>(`/under-budget${query}`);
  }

  /**
   * Get program by code
   */
  async getProgramByCode(
    code: string,
    skipCache: boolean = false,
  ): Promise<SingleProgramResponse> {
    const query = skipCache ? "?skipCache=true" : "";
    return this.request<SingleProgramResponse>(
      `/code/${encodeURIComponent(code)}${query}`,
    );
  }

  /**
   * Get program by name
   */
  async getProgramByName(
    name: string,
    skipCache: boolean = false,
  ): Promise<SingleProgramResponse> {
    const query = skipCache ? "?skipCache=true" : "";
    return this.request<SingleProgramResponse>(
      `/name/${encodeURIComponent(name)}${query}`,
    );
  }

  /**
   * Get programs by type
   */
  async getProgramsByType(
    programType: string,
    params?: {
      limit?: number;
      offset?: number;
      skipCache?: boolean;
    },
  ): Promise<ProgramResponse> {
    const queryParams = new URLSearchParams();
    if (params) {
      if (params.limit) queryParams.append("limit", String(params.limit));
      if (params.offset) queryParams.append("offset", String(params.offset));
      if (params.skipCache) queryParams.append("skipCache", "true");
    }
    const query = queryParams.toString() ? `?${queryParams.toString()}` : "";
    return this.request<ProgramResponse>(
      `/type/${encodeURIComponent(programType)}${query}`,
    );
  }

  /**
   * Get program campaign count
   */
  async getProgramCampaignCount(
    id: number,
    skipCache: boolean = false,
  ): Promise<Record<string, unknown>> {
    const query = skipCache ? "?skipCache=true" : "";
    return this.request<Record<string, unknown>>(
      `/${id}/campaigns/count${query}`,
    );
  }

  /**
   * Get program campaigns budget summary
   */
  async getProgramCampaignsBudgetSummary(
    id: number,
    skipCache: boolean = false,
  ): Promise<Record<string, unknown>> {
    const query = skipCache ? "?skipCache=true" : "";
    return this.request<Record<string, unknown>>(
      `/${id}/campaigns/budget-summary${query}`,
    );
  }

  /**
   * Update program budget
   */
  async updateProgramBudget(
    id: number,
    budget_total: number,
    updatedBy?: number,
  ): Promise<SingleProgramResponse> {
    return this.request<SingleProgramResponse>(`/${id}/budget`, {
      method: "PATCH",
      body: JSON.stringify({
        budget_total,
        updated_by: updatedBy,
      }),
    });
  }

  /**
   * Update program spent budget
   */
  async updateProgramSpentBudget(
    id: number,
    budget_spent: number,
    updatedBy?: number,
  ): Promise<SingleProgramResponse> {
    return this.request<SingleProgramResponse>(`/${id}/budget/spent`, {
      method: "PATCH",
      body: JSON.stringify({
        budget_spent,
        updated_by: updatedBy,
      }),
    });
  }

  /**
   * Advanced search programs
   */
  async advancedSearchPrograms(params: {
    name?: string;
    code?: string;
    description?: string;
    program_type?: string;
    is_active?: boolean;
    created_by?: number;
    budget_min?: number;
    budget_max?: number;
    limit?: number;
    offset?: number;
    skipCache?: boolean;
  }): Promise<ProgramResponse> {
    const queryParams = new URLSearchParams();
    if (params.name) queryParams.append("name", params.name);
    if (params.code) queryParams.append("code", params.code);
    if (params.description)
      queryParams.append("description", params.description);
    if (params.program_type)
      queryParams.append("program_type", params.program_type);
    if (params.is_active !== undefined)
      queryParams.append("is_active", String(params.is_active));
    if (params.created_by)
      queryParams.append("created_by", String(params.created_by));
    if (params.budget_min)
      queryParams.append("budget_min", String(params.budget_min));
    if (params.budget_max)
      queryParams.append("budget_max", String(params.budget_max));
    if (params.limit) queryParams.append("limit", String(params.limit));
    if (params.offset) queryParams.append("offset", String(params.offset));
    if (params.skipCache) queryParams.append("skipCache", "true");
    const query = queryParams.toString() ? `?${queryParams.toString()}` : "";
    return this.request<ProgramResponse>(`/advanced-search${query}`);
  }

  /**
   * Get programs by date range
   */
  async getProgramsByDateRange(params: {
    start_date_from?: string;
    start_date_to?: string;
    end_date_from?: string;
    end_date_to?: string;
    limit?: number;
    offset?: number;
    skipCache?: boolean;
  }): Promise<ProgramResponse> {
    const queryParams = new URLSearchParams();
    if (params.start_date_from)
      queryParams.append("start_date_from", params.start_date_from);
    if (params.start_date_to)
      queryParams.append("start_date_to", params.start_date_to);
    if (params.end_date_from)
      queryParams.append("end_date_from", params.end_date_from);
    if (params.end_date_to)
      queryParams.append("end_date_to", params.end_date_to);
    if (params.limit) queryParams.append("limit", String(params.limit));
    if (params.offset) queryParams.append("offset", String(params.offset));
    if (params.skipCache) queryParams.append("skipCache", "true");
    const query = queryParams.toString() ? `?${queryParams.toString()}` : "";
    return this.request<ProgramResponse>(`/date-range${query}`);
  }

  /**
   * Get programs by budget range
   */
  async getProgramsByBudgetRange(params: {
    budget_min?: number;
    budget_max?: number;
    limit?: number;
    offset?: number;
    skipCache?: boolean;
  }): Promise<ProgramResponse> {
    const queryParams = new URLSearchParams();
    if (params.budget_min)
      queryParams.append("minBudget", String(params.budget_min));
    if (params.budget_max)
      queryParams.append("maxBudget", String(params.budget_max));
    if (params.limit) queryParams.append("limit", String(params.limit));
    if (params.offset) queryParams.append("offset", String(params.offset));
    if (params.skipCache) queryParams.append("skipCache", "true");
    const query = queryParams.toString() ? `?${queryParams.toString()}` : "";
    return this.request<ProgramResponse>(`/budget-range${query}`);
  }

  /**
   * Get programs by creator
   */
  async getProgramsByCreator(
    createdBy: number,
    params?: {
      limit?: number;
      offset?: number;
      skipCache?: boolean;
    },
  ): Promise<ProgramResponse> {
    const queryParams = new URLSearchParams();
    if (params) {
      if (params.limit) queryParams.append("limit", String(params.limit));
      if (params.offset) queryParams.append("offset", String(params.offset));
      if (params.skipCache) queryParams.append("skipCache", "true");
    }
    const query = queryParams.toString() ? `?${queryParams.toString()}` : "";
    return this.request<ProgramResponse>(`/creator/${createdBy}${query}`);
  }

  /**
   * Get programs by performance metric
   */
  async getProgramsByPerformance(
    metric: string,
    params?: {
      limit?: number;
      offset?: number;
      skipCache?: boolean;
    },
  ): Promise<ProgramResponse> {
    const queryParams = new URLSearchParams();
    if (params) {
      if (params.limit) queryParams.append("limit", String(params.limit));
      if (params.offset) queryParams.append("offset", String(params.offset));
      if (params.skipCache) queryParams.append("skipCache", "true");
    }
    const query = queryParams.toString() ? `?${queryParams.toString()}` : "";
    return this.request<ProgramResponse>(
      `/performance/${encodeURIComponent(metric)}${query}`,
    );
  }

  /**
   * Get active campaign count for a program
   */
  async getProgramActiveCampaignCount(
    id: number,
    skipCache: boolean = false,
  ): Promise<Record<string, unknown>> {
    const query = skipCache ? "?skipCache=true" : "";
    return this.request<Record<string, unknown>>(
      `/${id}/campaigns/active-count${query}`,
    );
  }

  /**
   * Recalculate program budget
   */
  async recalculateProgramBudget(
    id: number,
    updatedBy?: number,
  ): Promise<SingleProgramResponse> {
    return this.request<SingleProgramResponse>(`/${id}/budget/recalculate`, {
      method: "POST",
      body: JSON.stringify({ updated_by: updatedBy }),
    });
  }

  /**
   * Update program dates
   */
  async updateProgramDates(
    id: number,
    dates: {
      start_date?: string | null;
      end_date?: string | null;
    },
  ): Promise<SingleProgramResponse> {
    return this.request<SingleProgramResponse>(`/${id}/dates`, {
      method: "PATCH",
      body: JSON.stringify(dates),
    });
  }
}

export const programService = new ProgramService();
export default programService;
