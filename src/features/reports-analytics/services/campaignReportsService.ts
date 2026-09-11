import { buildApiUrl, getAuthHeaders } from "../../../shared/services/api";
import type {
  CampaignAttributionRow,
  CampaignBroadcastRun,
  CampaignBudgetReport,
  CampaignControlReport,
  CampaignKpiSummary,
  CampaignLifecycleRow,
  CampaignReportEnvelope,
  CampaignReportsResponse,
  CampaignRewardRow,
  CampaignRoiReport,
  CampaignRow,
  CampaignSnapshotRefreshResult,
  ReportQueryParams,
} from "../types/ReportsAPI";

const BASE_URL = buildApiUrl("/monitoring/reporting/campaigns");
// const BASE_URL = "http://localhost:11008/monitoring/reporting/campaigns";


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

function windowQuery(params: ReportQueryParams & { metric?: string; limit?: number } = {}) {
  return toQuery({
    range: params.range,
    startDate: params.startDate,
    endDate: params.endDate,
    grain: params.grain,
    page: params.page,
    pageSize: params.pageSize,
    sortBy: params.sortBy,
    sortOrder: params.sortOrder,
    search: params.search,
    campaignId: params.campaignId,
    metric: params.metric,
    limit: params.limit,
  });
}

class CampaignReportsService {
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

  /** GET /monitoring/reporting/campaigns/portfolio */
  async getPortfolio(
    params: ReportQueryParams = {},
  ): Promise<CampaignReportEnvelope<CampaignReportsResponse>> {
    return this.request(`/portfolio${windowQuery(params)}`);
  }

  /** GET /monitoring/reporting/campaigns/kpis */
  async getKpis(
    params: ReportQueryParams = {},
  ): Promise<CampaignReportEnvelope<CampaignKpiSummary>> {
    return this.request(`/kpis${windowQuery(params)}`);
  }

  /** GET /monitoring/reporting/campaigns/channel-reach */
  async getChannelReach(
    params: ReportQueryParams = {},
  ): Promise<CampaignReportEnvelope<CampaignReportsResponse["channelReach"]>> {
    return this.request(`/channel-reach${windowQuery(params)}`);
  }

  /** GET /monitoring/reporting/campaigns/funnel */
  async getFunnel(
    params: ReportQueryParams = {},
  ): Promise<CampaignReportEnvelope<CampaignReportsResponse["conversionFunnel"]>> {
    return this.request(`/funnel${windowQuery(params)}`);
  }

  /** GET /monitoring/reporting/campaigns/trends */
  async getTrends(
    params: ReportQueryParams = {},
  ): Promise<CampaignReportEnvelope<CampaignReportsResponse["performanceTrend"]>> {
    return this.request(`/trends${windowQuery(params)}`);
  }

  /** GET /monitoring/reporting/campaigns/campaigns */
  async getCampaignsTable(
    params: ReportQueryParams = {},
  ): Promise<CampaignReportEnvelope<CampaignRow[]>> {
    return this.request(`/campaigns${windowQuery(params)}`);
  }

  /** GET /monitoring/reporting/campaigns/top */
  async getTopCampaigns(
    params: ReportQueryParams & { metric?: string; limit?: number } = {},
  ): Promise<CampaignReportEnvelope<CampaignRow[]>> {
    return this.request(`/top${windowQuery(params)}`);
  }

  /** POST /monitoring/reporting/campaigns/snapshots/refresh */
  async refreshSnapshots(
    params: Pick<ReportQueryParams, "startDate" | "endDate" | "range"> = {},
  ): Promise<CampaignReportEnvelope<CampaignSnapshotRefreshResult>> {
    return this.request(`/snapshots/refresh`, {
      method: "POST",
      body: JSON.stringify({
        startDate: params.startDate,
        endDate: params.endDate,
        range: params.range,
      }),
    });
  }

  /** GET /monitoring/reporting/campaigns/:id/summary */
  async getCampaignSummary(
    campaignId: string | number,
    params: ReportQueryParams = {},
  ): Promise<CampaignReportEnvelope<CampaignKpiSummary>> {
    return this.request(`/${campaignId}/summary${windowQuery(params)}`);
  }

  /** GET /monitoring/reporting/campaigns/:id/roi */
  async getCampaignRoi(
    campaignId: string | number,
    params: ReportQueryParams = {},
  ): Promise<CampaignReportEnvelope<CampaignRoiReport>> {
    return this.request(`/${campaignId}/roi${windowQuery(params)}`);
  }

  /** GET /monitoring/reporting/campaigns/:id/control */
  async getCampaignControl(
    campaignId: string | number,
    params: ReportQueryParams = {},
  ): Promise<CampaignReportEnvelope<CampaignControlReport>> {
    return this.request(`/${campaignId}/control${windowQuery(params)}`);
  }

  /** GET /monitoring/reporting/campaigns/:id/trends */
  async getCampaignTrends(
    campaignId: string | number,
    params: ReportQueryParams = {},
  ): Promise<CampaignReportEnvelope<CampaignReportsResponse["performanceTrend"]>> {
    return this.request(`/${campaignId}/trends${windowQuery(params)}`);
  }

  /** GET /monitoring/reporting/campaigns/:id/broadcasts */
  async getCampaignBroadcasts(
    campaignId: string | number,
    params: ReportQueryParams = {},
  ): Promise<CampaignReportEnvelope<CampaignBroadcastRun[]>> {
    return this.request(`/${campaignId}/broadcasts${windowQuery(params)}`);
  }

  /** GET /monitoring/reporting/campaigns/:id/budget */
  async getCampaignBudget(
    campaignId: string | number,
  ): Promise<CampaignReportEnvelope<CampaignBudgetReport>> {
    return this.request(`/${campaignId}/budget`);
  }

  /** GET /monitoring/reporting/campaigns/:id/rewards */
  async getCampaignRewards(
    campaignId: string | number,
    params: ReportQueryParams = {},
  ): Promise<CampaignReportEnvelope<CampaignRewardRow[]>> {
    return this.request(`/${campaignId}/rewards${windowQuery(params)}`);
  }

  /** GET /monitoring/reporting/campaigns/:id/attribution */
  async getCampaignAttribution(
    campaignId: string | number,
    params: ReportQueryParams = {},
  ): Promise<CampaignReportEnvelope<CampaignAttributionRow[]>> {
    return this.request(`/${campaignId}/attribution${windowQuery(params)}`);
  }

  /** GET /monitoring/reporting/campaigns/:id/lifecycle */
  async getCampaignLifecycle(
    campaignId: string | number,
  ): Promise<CampaignReportEnvelope<CampaignLifecycleRow[]>> {
    return this.request(`/${campaignId}/lifecycle`);
  }
}

export const campaignReportsService = new CampaignReportsService();
