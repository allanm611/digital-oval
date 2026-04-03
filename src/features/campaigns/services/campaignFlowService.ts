import { API_CONFIG, getAuthHeaders } from "../../../shared/services/api";
import { buildQueryString } from "../utils/buildQueryString";
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

/** Remove optional fields that are null/undefined before sending to API */
function cleanFlowData(flow: any) {
  const cleaned = { ...flow };
  const optionalFields = ['offer_creative_id', 'template_id', 'bucket_allocation', 'condition_rule'];
  optionalFields.forEach(field => {
    if (cleaned[field] === null || cleaned[field] === undefined) {
      delete cleaned[field];
    }
  });
  return cleaned;
}

class CampaignFlowService {
  /** Create a single campaign flow */
  async createCampaignFlow(
    data: CreateCampaignFlowRequest
  ): Promise<CampaignFlowResponse> {
    const cleanedData = cleanFlowData(data);
    const response = await fetch(BASE_URL, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(cleanedData),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(errorBody || "An error has occurred");
    }

    return response.json();
  }

  /** Create multiple campaign flows in batch */
  async createBatchCampaignFlows(
    flows: CreateCampaignFlowRequest[]
  ): Promise<CampaignFlowResponse[]> {
    const results: CampaignFlowResponse[] = [];

    for (const flow of flows) {
      const result = await this.createCampaignFlow(flow);
      results.push(result);
    }

    return results;
  }

  /** Get all flows for a specific campaign */
  async getCampaignFlows(
    campaignId: number,
    skipCache: boolean = false
  ): Promise<GetCampaignFlowsResponse> {
    let url = `${BASE_URL}/campaign/${campaignId}`;
    if (skipCache) {
      url += `?skipCache=true`;
    }

    const response = await fetch(url, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(errorBody || "An error has occurred");
    }

    return response.json();
  }

  /** Update a campaign flow */
  async updateCampaignFlow(
    id: number,
    data: UpdateCampaignFlowRequest
  ): Promise<CampaignFlowResponse> {
    const url = `${BASE_URL}/${id}`;
    const cleanedData = cleanFlowData(data);

    const response = await fetch(url, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(cleanedData),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(errorBody || "An error has occurred");
    }

    return response.json();
  }

  /** Delete a campaign flow */
  async deleteCampaignFlow(id: number): Promise<void> {
    const url = `${BASE_URL}/${id}`;

    const response = await fetch(url, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(errorBody || "An error has occurred");
    }
  }

  /** Search all campaign flows with filters */
  async searchCampaignFlows(
    params?: SearchCampaignFlowsParams
  ): Promise<GetCampaignFlowsResponse> {
    const query = buildQueryString(params);
    const url = `${BASE_URL}${query}`;

    const response = await fetch(url, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(errorBody || "An error has occurred");
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
      throw new Error(errorBody || "An error has occurred");
    }

    return response.json();
  }

  /** Get all campaign flows by segment ID */
  async getCampaignFlowsBySegment(
    segmentId: number,
    skipCache: boolean = true,
    activeOnly?: boolean,
    limit?: number,
    offset?: number
  ): Promise<GetCampaignFlowsResponse> {
    const query = buildQueryString({ skipCache, activeOnly, limit, offset });
    const url = `${BASE_URL}/segment/${segmentId}${query}`;

    const response = await fetch(url, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(errorBody || "An error has occurred");
    }

    return response.json();
  }

  /** Get all campaign flows by offer ID */
  async getCampaignFlowsByOffer(
    offerId: number,
    activeOnly?: boolean,
    limit?: number,
    offset?: number
  ): Promise<GetCampaignFlowsResponse> {
    const query = buildQueryString({ activeOnly, limit, offset });
    const url = `${BASE_URL}/offer/${offerId}${query}`;

    const response = await fetch(url, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(errorBody || "An error has occurred");
    }

    return response.json();
  }

  /** Get campaign flows by flow type */
  async getCampaignFlowsByType(
    campaignId: number,
    flowType: string,
    activeOnly?: boolean,
    limit?: number,
    offset?: number
  ): Promise<GetCampaignFlowsResponse> {
    const query = buildQueryString({ activeOnly, limit, offset });
    const url = `${BASE_URL}/campaign/${campaignId}/flow-type/${flowType}${query}`;

    const response = await fetch(url, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(errorBody || "An error has occurred");
    }

    return response.json();
  }

  /** Get campaign flows by campaign + segment combination */
  async getCampaignFlowsByCampaignAndSegment(
    campaignId: number,
    segmentId: number,
    activeOnly?: boolean,
    limit?: number,
    offset?: number
  ): Promise<GetCampaignFlowsResponse> {
    const query = buildQueryString({ activeOnly, limit, offset });
    const url = `${BASE_URL}/campaign/${campaignId}/segment/${segmentId}${query}`;

    const response = await fetch(url, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(errorBody || "An error has occurred");
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
      throw new Error(errorBody || "An error has occurred");
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
      throw new Error(errorBody || "An error has occurred");
    }

    return response.json();
  }

  /** Get unique campaign flow combinations */
  async getUniqueCombinations(
    limit?: number,
    offset?: number,
    skipCache?: boolean
  ): Promise<UniqueCombinationsResponse> {
    const query = buildQueryString({ limit, offset, skipCache });
    const url = `${BASE_URL}/unique-combinations${query}`;

    const response = await fetch(url, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(errorBody || "An error has occurred");
    }

    return response.json();
  }

  /** Get campaign flow statistics */
  async getFlowStatistics(
    skipCache?: boolean
  ): Promise<FlowStatisticsResponse> {
    const query = buildQueryString({ skipCache });
    const url = `${BASE_URL}/statistics${query}`;

    const response = await fetch(url, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(errorBody || "An error has occurred");
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
      throw new Error(errorBody || "An error has occurred");
    }

    return response.json();
  }

  /** Get campaign flow growth trends */
  async getGrowthTrends(
    skipCache?: boolean
  ): Promise<GrowthTrendsResponse> {
    const query = buildQueryString({ skipCache });
    const url = `${BASE_URL}/growth-trends${query}`;

    const response = await fetch(url, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(errorBody || "An error has occurred");
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
      throw new Error(errorBody || "An error has occurred");
    }

    return response.json();
  }
}

export const campaignFlowService = new CampaignFlowService();
export default campaignFlowService;
