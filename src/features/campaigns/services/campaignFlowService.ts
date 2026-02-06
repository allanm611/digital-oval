import { API_CONFIG, getAuthHeaders } from "../../../shared/services/api";
import {
  CampaignFlowConfig,
  CampaignFlowResponse,
  GetCampaignFlowsResponse,
  CreateCampaignFlowRequest,
  UpdateCampaignFlowRequest,
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
    campaignId: number
  ): Promise<GetCampaignFlowsResponse> {
    const url = `${BASE_URL}/campaign/${campaignId}`;

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
}

export const campaignFlowService = new CampaignFlowService();
export default campaignFlowService;
