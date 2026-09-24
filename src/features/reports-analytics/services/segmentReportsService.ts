import { buildApiUrl, getAuthHeaders } from "../../../shared/services/api";
import type {
  ReportQueryParams,
  SegmentReportsResponse,
} from "../types/ReportsAPI";

const BASE_URL = buildApiUrl("/monitoring/reporting/segments");

export interface SegmentReportsEnvelope {
  success: boolean;
  data?: SegmentReportsResponse;
  meta?: SegmentReportsResponse["meta"];
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

class SegmentReportsService {
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
   * GET /monitoring/reporting/segments/portfolio
   * Full Segment Reports payload for Real Data mode.
   */
  async getPortfolio(
    params: ReportQueryParams & { status?: string } = {},
  ): Promise<SegmentReportsEnvelope> {
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
      segmentId: params.segment,
    });
    return this.request<SegmentReportsEnvelope>(`/portfolio${query}`);
  }

  /** GET /monitoring/reporting/segments/member-growth */
  async getMemberGrowth(
    params: ReportQueryParams = {},
  ): Promise<SegmentReportsEnvelope> {
    const query = toQuery({
      range: params.range,
      startDate: params.startDate,
      endDate: params.endDate,
      grain: params.grain,
      preset: params.preset,
      segmentId: params.segment,
    });
    return this.request<SegmentReportsEnvelope>(`/member-growth${query}`);
  }
}

export const segmentReportsService = new SegmentReportsService();
