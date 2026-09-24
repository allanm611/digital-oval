import { buildApiUrl, getAuthHeaders } from "../../../shared/services/api";
import type {
  DeliveryEmailReportsResponse,
  ReportQueryParams,
} from "../types/ReportsAPI";

const BASE_URL = buildApiUrl("/monitoring/reporting/email");

export interface EmailDeliveryReportsEnvelope {
  success: boolean;
  data?: DeliveryEmailReportsResponse;
  meta?: DeliveryEmailReportsResponse["meta"];
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

class EmailDeliveryReportsService {
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
   * GET /monitoring/reporting/email/portfolio
   * Summary, delivery timeline, and dispatch log for Real Data mode.
   */
  async getPortfolio(
    params: ReportQueryParams = {},
  ): Promise<EmailDeliveryReportsEnvelope> {
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
      status: params.status,
      campaignId: params.campaignId,
    });
    return this.request<EmailDeliveryReportsEnvelope>(`/portfolio${query}`);
  }

  /** GET /monitoring/reporting/email/timeline */
  async getTimeline(
    params: ReportQueryParams = {},
  ): Promise<EmailDeliveryReportsEnvelope> {
    const query = toQuery({
      range: params.range,
      startDate: params.startDate,
      endDate: params.endDate,
      grain: params.grain,
      preset: params.preset,
      campaignId: params.campaignId,
    });
    return this.request<EmailDeliveryReportsEnvelope>(`/timeline${query}`);
  }
}

export const emailDeliveryReportsService = new EmailDeliveryReportsService();
