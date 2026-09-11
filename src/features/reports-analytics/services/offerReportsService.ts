import { buildApiUrl, getAuthHeaders } from "../../../shared/services/api";
import type {
  OfferReportsResponse,
  ReportQueryParams,
} from "../types/ReportsAPI";

const BASE_URL = buildApiUrl("/monitoring/reporting/offers");

export interface OfferReportsEnvelope {
  success: boolean;
  data?: OfferReportsResponse;
  meta?: OfferReportsResponse["meta"];
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

class OfferReportsService {
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
   * GET /monitoring/reporting/offers/portfolio
   * Full Offer Reports payload for Real Data mode.
   */
  async getPortfolio(params: ReportQueryParams & { status?: string } = {}): Promise<OfferReportsEnvelope> {
    const query = toQuery({
      range: params.range,
      startDate: params.startDate,
      endDate: params.endDate,
      grain: params.grain,
      page: params.page,
      pageSize: params.pageSize,
      sortBy: params.sortBy,
      sortOrder: params.sortOrder,
      search: params.search,
      status: params.status,
    });
    return this.request<OfferReportsEnvelope>(`/portfolio${query}`);
  }
}

export const offerReportsService = new OfferReportsService();
