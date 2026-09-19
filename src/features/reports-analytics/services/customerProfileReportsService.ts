import { buildApiUrl, getAuthHeaders } from "../../../shared/services/api";
import type {
  CustomerProfileReportsResponse,
  ReportQueryParams,
} from "../types/ReportsAPI";

const BASE_URL = buildApiUrl("/monitoring/reporting/subscribers");

export interface CustomerProfileEnvelope {
  success: boolean;
  data?: CustomerProfileReportsResponse;
  meta?: CustomerProfileReportsResponse["meta"];
  total?: number;
  error?: string;
  message?: string;
}

function toQuery(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    search.set(key, String(value));
  });
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

class CustomerProfileReportsService {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        ...getAuthHeaders(),
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      const message =
        (errorBody as { error?: string; message?: string }).error ||
        (errorBody as { message?: string }).message ||
        `Request failed (${response.status})`;
      throw new Error(message);
    }

    return response.json();
  }

  /**
   * GET /monitoring/reporting/subscribers/portfolio
   * Full Customer Profile Reports payload for Real Data mode.
   */
  async getPortfolio(params: ReportQueryParams = {}): Promise<CustomerProfileEnvelope> {
    const query = toQuery({
      range: params.range,
      startDate: params.startDate,
      endDate: params.endDate,
      grain: params.grain,
      preset: params.preset,
      page: params.page,
      pageSize: params.pageSize,
      sortBy: params.sortBy,
      sortOrder: params.sortOrder,
      search: params.search,
      segment: params.segment,
    });
    return this.request<CustomerProfileEnvelope>(`/portfolio${query}`);
  }

  /**
   * GET /monitoring/reporting/subscribers/search?q=
   * Header search by ID, name, email, or phone.
   */
  async searchCustomers(q: string, limit = 20) {
    return this.request<{
      success: boolean;
      data: CustomerProfileReportsResponse["customers"];
      total: number;
    }>(`/search${toQuery({ q, limit })}`);
  }
}

export const customerProfileReportsService = new CustomerProfileReportsService();
