import {
  buildApiUrl,
  getAuthHeaders,
} from "../../../shared/services/api";
import {
  Broadcast,
  BroadcastDetails,
  BroadcastDetailsResponse,
  BroadcastsResponse,
} from "../types/broadcast";
import {
  dedupeBroadcastRows,
  normalizeBroadcastDetailsPayload,
  normalizeOperationalBroadcastRow,
  normalizeReportingBroadcastRow,
} from "../utils/normalizeCampaignBroadcast";

const MONITORING_BASE_URL = buildApiUrl("/monitoring");
const BROADCASTS_BASE_URL = buildApiUrl("/broadcasts");
const CAMPAIGNS_BASE_URL = buildApiUrl("/campaigns");

interface OperationalListResponse {
  success: boolean;
  data?: Record<string, unknown>[];
  error?: string;
}

class BroadcastService {
  private async request<T>(
    baseUrl: string,
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const url = `${baseUrl}${endpoint}`;

    const response = await fetch(url, {
      headers: {
        ...getAuthHeaders(),
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const message =
        (errorData as { error?: string; message?: string }).error ||
        (errorData as { message?: string }).message ||
        `Request failed (${response.status})`;
      throw new Error(message);
    }

    return response.json();
  }

  /**
   * GET /broadcasts/
   * System-wide operational broadcast list (running first).
   */
  async listBroadcasts(): Promise<BroadcastsResponse> {
    const response = await this.request<OperationalListResponse>(
      BROADCASTS_BASE_URL,
      "/",
    );

    const rows = (response.data ?? []).map(normalizeOperationalBroadcastRow);

    return {
      success: response.success !== false,
      data: rows,
      total: rows.length,
      error: response.error,
    };
  }

  /**
   * GET /broadcasts/:id/details
   * Operational details including metrics, policy violations, delivery logs.
   */
  async getBroadcastDetails(id: string | number): Promise<BroadcastDetails> {
    const response = await this.request<BroadcastDetailsResponse>(
      BROADCASTS_BASE_URL,
      `/${id}/details`,
    );

    if (!response.success || !response.data) {
      throw new Error(response.error || `Broadcast ${id} not found`);
    }

    return normalizeBroadcastDetailsPayload(
      response.data as unknown as Record<string, unknown>,
    );
  }

  /**
   * GET /campaigns/:id/broadcasts
   * Campaign-scoped operational list (replaces missing /broadcasts/pending/:id).
   */
  async getCampaignOperationalBroadcasts(
    campaignId: number,
  ): Promise<BroadcastsResponse> {
    const response = await this.request<OperationalListResponse>(
      CAMPAIGNS_BASE_URL,
      `/${campaignId}/broadcasts`,
    );

    const rows = (response.data ?? []).map(normalizeOperationalBroadcastRow);

    return {
      success: response.success !== false,
      data: rows,
      total: rows.length,
      error: response.error,
    };
  }

  /**
   * Prefer reporting metrics; fall back to campaign-scoped operational list.
   */
  async getBroadcastsByCampaign(
    campaignId: number,
    startDate?: string,
    endDate?: string,
  ): Promise<BroadcastsResponse> {
    let endpoint = `/reporting/campaigns/${campaignId}/broadcasts`;

    const params = new URLSearchParams();
    if (startDate) params.append("start_date", startDate);
    if (endDate) params.append("end_date", endDate);

    if (params.toString()) {
      endpoint += `?${params.toString()}`;
    }

    try {
      const reporting = await this.request<BroadcastsResponse>(
        MONITORING_BASE_URL,
        endpoint,
      );

      const reportingRows = (reporting.data ?? []).map((row) =>
        normalizeReportingBroadcastRow(row as unknown as Record<string, unknown>),
      );

      if (reporting.success && reportingRows.length > 0) {
        return {
          success: true,
          data: reportingRows,
          total: reporting.total ?? reportingRows.length,
        };
      }
    } catch (err) {
      console.warn(
        "[broadcastService] Reporting broadcasts failed, trying operational list:",
        err,
      );
    }

    return this.getCampaignOperationalBroadcasts(campaignId);
  }

  /**
   * Merges reporting and operational campaign lists (deduped by broadcast_id).
   */
  async getAllCampaignBroadcasts(
    campaignId: number,
    startDate?: string,
    endDate?: string,
  ): Promise<BroadcastsResponse> {
    const query =
      startDate || endDate
        ? `?${new URLSearchParams({
            ...(startDate ? { start_date: startDate } : {}),
            ...(endDate ? { end_date: endDate } : {}),
          }).toString()}`
        : "";

    const [reportingResult, operationalResult] = await Promise.allSettled([
      this.request<BroadcastsResponse>(
        MONITORING_BASE_URL,
        `/reporting/campaigns/${campaignId}/broadcasts${query}`,
      ),
      this.getCampaignOperationalBroadcasts(campaignId),
    ]);

    const merged: Broadcast[] = [];

    if (reportingResult.status === "fulfilled" && reportingResult.value.data) {
      merged.push(
        ...reportingResult.value.data.map((row) =>
          normalizeReportingBroadcastRow(
            row as unknown as Record<string, unknown>,
          ),
        ),
      );
    }

    if (operationalResult.status === "fulfilled" && operationalResult.value.data) {
      merged.push(...operationalResult.value.data);
    }

    const data = dedupeBroadcastRows(merged);

    return {
      success: true,
      data,
      total: data.length,
    };
  }

  /**
   * GET /monitoring/broadcasts/statistics
   */
  async getBroadcastStatistics(): Promise<any> {
    return this.request<any>(MONITORING_BASE_URL, "/broadcasts/statistics");
  }
}

export const broadcastService = new BroadcastService();
