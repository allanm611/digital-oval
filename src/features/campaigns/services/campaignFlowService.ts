import { API_CONFIG, getAuthHeaders } from "../../../shared/services/api";
import {
  CampaignFlowResponse,
  GetCampaignFlowsResponse,
  CreateCampaignFlowRequest,
  UpdateCampaignFlowRequest,
  SearchCampaignFlowsParams,
  GetCampaignFlowByIdResponse,
  CampaignOffersResponse,
  CampaignSegmentsResponse,
  UniqueCombinationsResponse,
  FlowStatisticsResponse,
  RelationshipStatisticsResponse,
  GrowthTrendsResponse,
  SyncSegmentsRequest,
  SyncSegmentsResponse,
} from "../types/campaignFlow";

const BASE_URL = `${API_CONFIG.BASE_URL}/campaign-flows`;

class CampaignFlowService {
  /**
   * Create a single campaign flow
   */
  async createCampaignFlow(
    data: CreateCampaignFlowRequest
  ): Promise<CampaignFlowResponse> {
    const response = await fetch(BASE_URL, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("API Error Response:", {
        status: response.status,
        statusText: response.statusText,
        body: errorBody,
        url: BASE_URL,
        data,
      });
      throw new Error(
        `HTTP error! status: ${response.status}, details: ${errorBody}`
      );
    }

    return response.json();
  }

  /**
   * Create multiple campaign flows in batch
   */
  async createBatchCampaignFlows(
    flows: CreateCampaignFlowRequest[]
  ): Promise<CampaignFlowResponse[]> {
    const results: CampaignFlowResponse[] = [];

    for (const flow of flows) {
      try {
        const result = await this.createCampaignFlow(flow);
        results.push(result);
      } catch (error) {
        console.error("Error creating campaign flow:", { flow, error });
        throw error;
      }
    }

    return results;
  }

  /**
   * Get all flows for a specific campaign
   */
  async getCampaignFlows(
    campaignId: number,
    skipCache: boolean = false
  ): Promise<GetCampaignFlowsResponse> {
    let url = `${BASE_URL}/campaign/${campaignId}`;
    if (skipCache) {
      url += `?skipCache=${Date.now()}`;
    }

    const response = await fetch(url, {
      method: "GET",
      headers: getAuthHeaders(),
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
        `HTTP error! status: ${response.status}, details: ${errorBody}`
      );
    }

    return response.json();
  }

  /**
   * Update a campaign flow
   */
  async updateCampaignFlow(
    id: number,
    data: UpdateCampaignFlowRequest
  ): Promise<CampaignFlowResponse> {
    const url = `${BASE_URL}/${id}`;

    const response = await fetch(url, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("API Error Response:", {
        status: response.status,
        statusText: response.statusText,
        body: errorBody,
        url,
        data,
      });
      throw new Error(
        `HTTP error! status: ${response.status}, details: ${errorBody}`
      );
    }

    return response.json();
  }

  /**
   * Delete a campaign flow
   */
  async deleteCampaignFlow(id: number): Promise<void> {
    const url = `${BASE_URL}/${id}`;

    const response = await fetch(url, {
      method: "DELETE",
      headers: getAuthHeaders(),
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
        `HTTP error! status: ${response.status}, details: ${errorBody}`
      );
    }
  }

  /**
   * Search all campaign flows with filters
   */
  async searchCampaignFlows(
    params?: SearchCampaignFlowsParams
  ): Promise<GetCampaignFlowsResponse> {
    const queryParams = new URLSearchParams();
    if (params) {
      if (params.campaignId) queryParams.append("campaignId", String(params.campaignId));
      if (params.segmentId) queryParams.append("segmentId", String(params.segmentId));
      if (params.offerId) queryParams.append("offerId", String(params.offerId));
      if (params.flowType) queryParams.append("flowType", params.flowType);
      if (params.activeOnly !== undefined) queryParams.append("activeOnly", String(params.activeOnly));
      if (params.limit) queryParams.append("limit", String(params.limit));
      if (params.offset) queryParams.append("offset", String(params.offset));
      if (params.skipCache) queryParams.append("skipCache", String(params.skipCache));
    }

    const url = `${BASE_URL}${queryParams.toString() ? "?" + queryParams.toString() : ""}`;

    const response = await fetch(url, {
      method: "GET",
      headers: getAuthHeaders(),
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
        `HTTP error! status: ${response.status}, details: ${errorBody}`
      );
    }

    return response.json();
  }

  /**
   * Get a single campaign flow by ID
   */
  async getCampaignFlowById(
    id: number,
    skipCache?: boolean
  ): Promise<GetCampaignFlowByIdResponse> {
    const url = `${BASE_URL}/${id}${skipCache ? "?skipCache=true" : ""}`;

    const response = await fetch(url, {
      method: "GET",
      headers: getAuthHeaders(),
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
        `HTTP error! status: ${response.status}, details: ${errorBody}`
      );
    }

    return response.json();
  }

  /**
   * Get all campaign flows by segment ID
   */
  async getCampaignFlowsBySegment(
    segmentId: number,
    activeOnly?: boolean,
    limit?: number,
    offset?: number
  ): Promise<GetCampaignFlowsResponse> {
    const queryParams = new URLSearchParams();
    if (activeOnly !== undefined) queryParams.append("activeOnly", String(activeOnly));
    if (limit) queryParams.append("limit", String(limit));
    if (offset !== undefined) queryParams.append("offset", String(offset));

    const url = `${BASE_URL}/segment/${segmentId}${queryParams.toString() ? "?" + queryParams.toString() : ""}`;

    const response = await fetch(url, {
      method: "GET",
      headers: getAuthHeaders(),
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
        `HTTP error! status: ${response.status}, details: ${errorBody}`
      );
    }

    return response.json();
  }

  /**
   * Get all campaign flows by offer ID
   */
  async getCampaignFlowsByOffer(
    offerId: number,
    activeOnly?: boolean,
    limit?: number,
    offset?: number
  ): Promise<GetCampaignFlowsResponse> {
    const queryParams = new URLSearchParams();
    if (activeOnly !== undefined) queryParams.append("activeOnly", String(activeOnly));
    if (limit) queryParams.append("limit", String(limit));
    if (offset !== undefined) queryParams.append("offset", String(offset));

    const url = `${BASE_URL}/offer/${offerId}${queryParams.toString() ? "?" + queryParams.toString() : ""}`;

    const response = await fetch(url, {
      method: "GET",
      headers: getAuthHeaders(),
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
        `HTTP error! status: ${response.status}, details: ${errorBody}`
      );
    }

    return response.json();
  }

  /**
   * Get campaign flows by flow type
   */
  async getCampaignFlowsByType(
    campaignId: number,
    flowType: string,
    activeOnly?: boolean,
    limit?: number,
    offset?: number
  ): Promise<GetCampaignFlowsResponse> {
    const queryParams = new URLSearchParams();
    if (activeOnly !== undefined) queryParams.append("activeOnly", String(activeOnly));
    if (limit) queryParams.append("limit", String(limit));
    if (offset !== undefined) queryParams.append("offset", String(offset));

    const url = `${BASE_URL}/campaign/${campaignId}/flow-type/${flowType}${queryParams.toString() ? "?" + queryParams.toString() : ""}`;

    const response = await fetch(url, {
      method: "GET",
      headers: getAuthHeaders(),
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
        `HTTP error! status: ${response.status}, details: ${errorBody}`
      );
    }

    return response.json();
  }

  /**
   * Get campaign flows by campaign + segment combination
   */
  async getCampaignFlowsByCampaignAndSegment(
    campaignId: number,
    segmentId: number,
    activeOnly?: boolean,
    limit?: number,
    offset?: number
  ): Promise<GetCampaignFlowsResponse> {
    const queryParams = new URLSearchParams();
    if (activeOnly !== undefined) queryParams.append("activeOnly", String(activeOnly));
    if (limit) queryParams.append("limit", String(limit));
    if (offset !== undefined) queryParams.append("offset", String(offset));

    const url = `${BASE_URL}/campaign/${campaignId}/segment/${segmentId}${queryParams.toString() ? "?" + queryParams.toString() : ""}`;

    const response = await fetch(url, {
      method: "GET",
      headers: getAuthHeaders(),
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
        `HTTP error! status: ${response.status}, details: ${errorBody}`
      );
    }

    return response.json();
  }

  /**
   * Get all offers in a campaign
   */
  async getCampaignOffers(
    campaignId: number,
    skipCache?: boolean
  ): Promise<CampaignOffersResponse> {
    const url = `${BASE_URL}/campaign/${campaignId}/offers${skipCache ? "?skipCache=true" : ""}`;

    const response = await fetch(url, {
      method: "GET",
      headers: getAuthHeaders(),
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
        `HTTP error! status: ${response.status}, details: ${errorBody}`
      );
    }

    return response.json();
  }

  /**
   * Get all segments in a campaign
   */
  async getCampaignSegments(
    campaignId: number,
    skipCache?: boolean
  ): Promise<CampaignSegmentsResponse> {
    const url = `${BASE_URL}/campaign/${campaignId}/segments${skipCache ? "?skipCache=true" : ""}`;

    const response = await fetch(url, {
      method: "GET",
      headers: getAuthHeaders(),
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
        `HTTP error! status: ${response.status}, details: ${errorBody}`
      );
    }

    return response.json();
  }

  /**
   * Get unique campaign flow combinations
   */
  async getUniqueCombinations(
    limit?: number,
    offset?: number,
    skipCache?: boolean
  ): Promise<UniqueCombinationsResponse> {
    const queryParams = new URLSearchParams();
    if (limit) queryParams.append("limit", String(limit));
    if (offset !== undefined) queryParams.append("offset", String(offset));
    if (skipCache) queryParams.append("skipCache", String(skipCache));

    const url = `${BASE_URL}/unique-combinations${queryParams.toString() ? "?" + queryParams.toString() : ""}`;

    const response = await fetch(url, {
      method: "GET",
      headers: getAuthHeaders(),
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
        `HTTP error! status: ${response.status}, details: ${errorBody}`
      );
    }

    return response.json();
  }

  /**
   * Get campaign flow statistics
   */
  async getFlowStatistics(
    skipCache?: boolean
  ): Promise<FlowStatisticsResponse> {
    const queryParams = new URLSearchParams();
    if (skipCache) queryParams.append("skipCache", String(skipCache));

    const url = `${BASE_URL}/statistics${queryParams.toString() ? "?" + queryParams.toString() : ""}`;

    const response = await fetch(url, {
      method: "GET",
      headers: getAuthHeaders(),
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
        `HTTP error! status: ${response.status}, details: ${errorBody}`
      );
    }

    return response.json();
  }

  /**
   * Get campaign flow relationship statistics
   */
  async getRelationshipStatistics(
    skipCache?: boolean
  ): Promise<RelationshipStatisticsResponse> {
    const url = `${BASE_URL}/relationship-statistics${skipCache ? "?skipCache=true" : ""}`;

    const response = await fetch(url, {
      method: "GET",
      headers: getAuthHeaders(),
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
        `HTTP error! status: ${response.status}, details: ${errorBody}`
      );
    }

    return response.json();
  }

  /**
   * Get campaign flow growth trends
   */
  async getGrowthTrends(
    skipCache?: boolean
  ): Promise<GrowthTrendsResponse> {
    const queryParams = new URLSearchParams();
    if (skipCache) queryParams.append("skipCache", String(skipCache));

    const url = `${BASE_URL}/growth-trends${queryParams.toString() ? "?" + queryParams.toString() : ""}`;

    const response = await fetch(url, {
      method: "GET",
      headers: getAuthHeaders(),
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
        `HTTP error! status: ${response.status}, details: ${errorBody}`
      );
    }

    return response.json();
  }

  /**
   * Sync campaign segments
   */
  async syncCampaignSegments(
    campaignId: number,
    request?: SyncSegmentsRequest
  ): Promise<SyncSegmentsResponse> {
    const url = `${BASE_URL}/campaign/${campaignId}/sync-segments`;

    const response = await fetch(url, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(request || {}),
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
        `HTTP error! status: ${response.status}, details: ${errorBody}`
      );
    }

    return response.json();
  }
}

export const campaignFlowService = new CampaignFlowService();
export default campaignFlowService;
