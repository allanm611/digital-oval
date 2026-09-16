import { buildApiUrl, getAuthHeaders } from "../../../shared/services/api";
import type {
  OfferABTestRow,
  OfferCategoryRow,
  OfferEligibility,
  OfferKpiSummary,
  OfferLegacyPerformance,
  OfferLifecycleRow,
  OfferRedemptionRow,
  OfferReportEnvelope,
  OfferReportsResponse,
  OfferRevenueReport,
  OfferRow,
  OfferSnapshotRefreshResult,
  ReportQueryParams,
} from "../types/ReportsAPI";

const BASE_URL = buildApiUrl("/monitoring/reporting/offers");

function toQuery(
  params: Record<string, string | number | undefined> = {},
): string {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    search.set(key, String(value));
  });
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

function windowQuery(
  params: ReportQueryParams & { metric?: string; limit?: number } = {},
) {
  return toQuery({
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
    offerId: params.offerId,
    status: params.status,
    metric: params.metric,
    limit: params.limit,
  });
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

    const errorBody = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message =
        (errorBody as { error?: string; message?: string }).error ||
        (errorBody as { message?: string }).message ||
        `Request failed (${response.status})`;
      throw new Error(message);
    }

    return errorBody as T;
  }

  /** GET /monitoring/reporting/offers/portfolio */
  async getPortfolio(
    params: ReportQueryParams = {},
  ): Promise<OfferReportEnvelope<OfferReportsResponse>> {
    return this.request(`/portfolio${windowQuery(params)}`);
  }

  /** GET /monitoring/reporting/offers/kpis */
  async getKpis(
    params: ReportQueryParams = {},
  ): Promise<OfferReportEnvelope<OfferKpiSummary>> {
    return this.request(`/kpis${windowQuery(params)}`);
  }

  /** GET /monitoring/reporting/offers/funnel */
  async getFunnel(
    params: ReportQueryParams = {},
  ): Promise<OfferReportEnvelope<OfferReportsResponse["redemptionFunnel"]>> {
    return this.request(`/funnel${windowQuery(params)}`);
  }

  /** GET /monitoring/reporting/offers/timeline */
  async getTimeline(
    params: ReportQueryParams = {},
  ): Promise<OfferReportEnvelope<OfferReportsResponse["redemptionTimeline"]>> {
    return this.request(`/timeline${windowQuery(params)}`);
  }

  /** GET /monitoring/reporting/offers/by-type */
  async getTypeComparison(
    params: ReportQueryParams = {},
  ): Promise<OfferReportEnvelope<OfferReportsResponse["offerTypeComparison"]>> {
    return this.request(`/by-type${windowQuery(params)}`);
  }

  /** GET /monitoring/reporting/offers/offers */
  async getOffersTable(
    params: ReportQueryParams = {},
  ): Promise<OfferReportEnvelope<OfferRow[]>> {
    return this.request(`/offers${windowQuery(params)}`);
  }

  /** GET /monitoring/reporting/offers/top */
  async getTopOffers(
    params: ReportQueryParams & { metric?: string; limit?: number } = {},
  ): Promise<OfferReportEnvelope<OfferRow[]>> {
    return this.request(`/top${windowQuery(params)}`);
  }

  /** GET /monitoring/reporting/offers/by-category */
  async getByCategory(
    params: ReportQueryParams = {},
  ): Promise<OfferReportEnvelope<OfferCategoryRow[]>> {
    return this.request(`/by-category${windowQuery(params)}`);
  }

  /** POST /monitoring/reporting/offers/snapshots/refresh */
  async refreshSnapshots(
    params: Pick<ReportQueryParams, "startDate" | "endDate" | "range" | "grain" | "preset"> = {},
  ): Promise<OfferReportEnvelope<OfferSnapshotRefreshResult>> {
    return this.request(`/snapshots/refresh`, {
      method: "POST",
      body: JSON.stringify({
        startDate: params.startDate,
        endDate: params.endDate,
        range: params.range,
        grain: params.grain,
        preset: params.preset,
      }),
    });
  }

  /** GET /monitoring/reporting/offers/:id/summary */
  async getOfferSummary(
    offerId: string | number,
    params: ReportQueryParams = {},
  ): Promise<OfferReportEnvelope<OfferKpiSummary>> {
    return this.request(`/${offerId}/summary${windowQuery(params)}`);
  }

  /** GET /monitoring/reporting/offers/:id/revenue */
  async getOfferRevenue(
    offerId: string | number,
    params: ReportQueryParams = {},
  ): Promise<OfferReportEnvelope<OfferRevenueReport>> {
    return this.request(`/${offerId}/revenue${windowQuery(params)}`);
  }

  /** GET /monitoring/reporting/offers/:id/redemption */
  async getOfferRedemption(
    offerId: string | number,
    params: ReportQueryParams = {},
  ): Promise<OfferReportEnvelope<OfferRedemptionRow[]>> {
    return this.request(`/${offerId}/redemption${windowQuery(params)}`);
  }

  /** GET /monitoring/reporting/offers/:id/ab-test */
  async getOfferABTest(
    offerId: string | number,
  ): Promise<OfferReportEnvelope<OfferABTestRow[]>> {
    return this.request(`/${offerId}/ab-test`);
  }

  /** GET /monitoring/reporting/offers/:id/eligibility */
  async getOfferEligibility(
    offerId: string | number,
    params: ReportQueryParams = {},
  ): Promise<OfferReportEnvelope<OfferEligibility>> {
    return this.request(`/${offerId}/eligibility${windowQuery(params)}`);
  }

  /** GET /monitoring/reporting/offers/:id/lifecycle */
  async getOfferLifecycle(
    offerId: string | number,
  ): Promise<OfferReportEnvelope<OfferLifecycleRow[]>> {
    return this.request(`/${offerId}/lifecycle`);
  }

  /** GET /monitoring/reporting/offers/:id (legacy snapshot rollup) */
  async getOfferPerformanceLegacy(
    offerId: string | number,
    params: ReportQueryParams = {},
  ): Promise<OfferReportEnvelope<OfferLegacyPerformance>> {
    return this.request(`/${offerId}${windowQuery(params)}`);
  }
}

export const offerReportsService = new OfferReportsService();
