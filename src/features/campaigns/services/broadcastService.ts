import {
  API_CONFIG,
  buildApiUrl,
  getAuthHeaders,
} from "../../../shared/services/api";
import { Broadcast, BroadcastsResponse } from "../types/broadcast";

const BASE_URL = buildApiUrl("/monitoring");

class BroadcastService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const url = `${BASE_URL}${endpoint}`;

    const response = await fetch(url, {
      headers: {
        ...getAuthHeaders(),
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      try {
        const errorData = await response.json();
        if (errorData.error) {
          throw new Error(errorData.error);
        }
        if (errorData.message) {
          throw new Error(errorData.message);
        }
        throw new Error("Request failed");
      } catch (err) {
        throw err;
      }
    }

    return response.json();
  }

  /**
   * GET /monitoring/reporting/campaigns/:id/broadcasts
   * Fetch all broadcasts for a campaign with performance metrics
   * @param campaignId Campaign ID
   * @param startDate Optional - ISO format date (e.g., 2026-04-01)
   * @param endDate Optional - ISO format date (e.g., 2026-04-30)
   * @returns List of broadcasts with performance data
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

    return this.request<BroadcastsResponse>(endpoint);
  }

  /**
   * GET /monitoring/broadcasts/statistics
   * Fetch system-wide broadcast statistics
   * @returns Overview statistics across all broadcasts
   */
  async getBroadcastStatistics(): Promise<any> {
    return this.request<any>("/broadcasts/statistics");
  }
}

export const broadcastService = new BroadcastService();
