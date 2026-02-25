import { API_CONFIG, getAuthHeaders } from "../../../shared/services/api";
import {
  SendCommunicationRequest,
  SendCommunicationResponse,
  CommunicationExecutionDetail,
  // CommunicationStats,
  // CommunicationLog,
  GetExecutionsRequest,
  GetLogsRequest,
  GetStatsRequest,
  CommunicationExecutionsResponse,
  CommunicationExecutionDetailResponse,
  CommunicationStatsResponse,
  CommunicationLogsResponse,
  ManualBroadcastsResponse,
  CreateCommunicationRequest,
  CreateCommunicationResponse,
  GetCommunicationsResponse,
  SendManualCommunicationRequest,
  SendManualCommunicationResponse,
  TemplateVariablesResponse,
  RecipientData,
  MessageTemplate,
  CommunicationChannel,
} from "../types/communication";

const BASE_URL = `${API_CONFIG.BASE_URL}/communications`;

class CommunicationService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const url = `${BASE_URL}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("Communication API Error:", {
        status: response.status,
        statusText: response.statusText,
        body: errorBody,
        url,
      });
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // ========================
  // SEND COMMUNICATIONS
  // ========================

  /**
   * Send a communication to recipients from quicklist, segment, or manual list
   */
  async sendCommunication(
    request: SendCommunicationRequest,
  ): Promise<SendCommunicationResponse> {
    return this.request<SendCommunicationResponse>("/send", {
      method: "POST",
      body: JSON.stringify(request),
    });
  }

  /**
   * Send communication to a quicklist
   */
  async sendToQuicklist(
    quicklistId: number,
    channels: CommunicationChannel[],
    messageTemplate: MessageTemplate,
    options?: {
      filters?: any;
      batchSize?: number;
      createdBy?: number;
    },
  ): Promise<SendCommunicationResponse> {
    return this.sendCommunication({
      source_type: "quicklist",
      source_id: quicklistId,
      channels,
      message_template: messageTemplate,
      filters: options?.filters,
      batch_size: options?.batchSize,
      created_by: options?.createdBy,
    });
  }

  /**
   * Send communication to a segment
   */
  async sendToSegment(
    segmentId: number,
    channels: CommunicationChannel[],
    messageTemplate: MessageTemplate,
    options?: {
      batchSize?: number;
      createdBy?: number;
    },
  ): Promise<SendCommunicationResponse> {
    return this.sendCommunication({
      source_type: "segment",
      source_id: segmentId,
      channels,
      message_template: messageTemplate,
      batch_size: options?.batchSize,
      created_by: options?.createdBy,
    });
  }

  /**
   * Send communication to manual recipient list
   */
  async sendToManualList(
    recipientList: RecipientData[],
    channels: CommunicationChannel[],
    messageTemplate: MessageTemplate,
    options?: {
      createdBy?: number;
    },
  ): Promise<SendCommunicationResponse> {
    return this.sendCommunication({
      source_type: "manual",
      recipient_list: recipientList,
      channels,
      message_template: messageTemplate,
      created_by: options?.createdBy,
    });
  }

  /**
   * Send manual communication (legacy method - use sendToManualList instead)
   */
  async sendManualCommunication(
    request: SendManualCommunicationRequest,
  ): Promise<SendManualCommunicationResponse> {
    return this.request<SendManualCommunicationResponse>("/send", {
      method: "POST",
      body: JSON.stringify(request),
    });
  }

  // ========================
  // VIEW BROADCASTS
  // ========================

  /**
   * Get list of all communication executions (broadcasts)
   * @deprecated Use getExecutions instead - endpoint is /executions not /communications
   */
  // async getAllExecutions(page: number = 1, limit: number = 20): Promise<CommunicationExecutionsResponse> {
  //   const queryParams = new URLSearchParams();
  //   queryParams.append('page', page.toString());
  //   queryParams.append('limit', limit.toString());
  //
  //   return this.request<CommunicationExecutionsResponse>(`/executions?${queryParams.toString()}`);
  // }

  /**
   * Get communication executions with filtering
   */
  async getExecutions(
    params?: GetExecutionsRequest,
  ): Promise<CommunicationExecutionsResponse> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.offset) queryParams.append("offset", params.offset.toString());
    if (params?.start_date) queryParams.append("start_date", params.start_date);
    if (params?.end_date) queryParams.append("end_date", params.end_date);
    if (params?.channel) queryParams.append("channel", params.channel);
    if (params?.source_type)
      queryParams.append("source_type", params.source_type);

    const queryString = queryParams.toString();
    const endpoint = `/${queryString ? `?${queryString}` : ""}`;

    return this.request<CommunicationExecutionsResponse>(endpoint);
  }

  /**
   * Get details of a specific broadcast execution including recent logs
   */
  async getExecutionDetails(
    executionId: string,
  ): Promise<CommunicationExecutionDetailResponse> {
    return this.request<CommunicationExecutionDetailResponse>(
      `/executions/${executionId}`,
    );
  }

  /**
   * Get detailed execution information (legacy - use getExecutionDetails)
   */
  async getExecutionById(
    executionId: string,
  ): Promise<{ success: boolean; data: CommunicationExecutionDetail }> {
    const response = await this.getExecutionDetails(executionId);
    return {
      success: response.success,
      data: response.data.execution,
    };
  }

  /**
   * Get communication logs with filtering and pagination
   */
  async getLogs(params?: GetLogsRequest): Promise<CommunicationLogsResponse> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.offset) queryParams.append("offset", params.offset.toString());
    if (params?.execution_id)
      queryParams.append("execution_id", params.execution_id);
    if (params?.channel) queryParams.append("channel", params.channel);
    if (params?.status) queryParams.append("status", params.status);
    if (params?.start_date) queryParams.append("start_date", params.start_date);
    if (params?.end_date) queryParams.append("end_date", params.end_date);

    const queryString = queryParams.toString();
    const endpoint = `/logs${queryString ? `?${queryString}` : ""}`;

    return this.request<CommunicationLogsResponse>(endpoint);
  }

  /**
   * Get communication statistics for a period
   */
  async getStats(
    params?: GetStatsRequest,
  ): Promise<CommunicationStatsResponse> {
    const queryParams = new URLSearchParams();
    if (params?.days) queryParams.append("days", params.days.toString());

    const queryString = queryParams.toString();
    const endpoint = `/stats${queryString ? `?${queryString}` : ""}`;

    return this.request<CommunicationStatsResponse>(endpoint);
  }

  /**
   * Get manual broadcasts list - uses dedicated endpoint
   */
  async getManualBroadcasts(
    params?: { page?: number; limit?: number; offset?: number },
  ): Promise<ManualBroadcastsResponse> {
    const queryParams = new URLSearchParams();

    if (params) {
      if (params.offset !== undefined) queryParams.append("offset", params.offset.toString());
      if (params.limit !== undefined) queryParams.append("limit", params.limit.toString());
    }

    const queryString = queryParams.toString();
    const url = `${API_CONFIG.BASE_URL}/communications/manual-broadcasts${queryString ? `?${queryString}` : ""}`;

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
      });

      if (!response.ok) {
        const errorBody = await response.text();
        console.error("Manual Broadcasts API Error:", {
          status: response.status,
          statusText: response.statusText,
          body: errorBody,
          url,
        });
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return response.json();
    } catch (error) {
      console.error("Failed to fetch manual broadcasts:", error);
      throw error;
    }
  }

  // ========================
  // UTILITIES
  // ========================

  /**
   * Get available template variables for a quicklist
   */
  async getTemplateVariables(
    quicklistId: number,
  ): Promise<TemplateVariablesResponse> {
    return this.request<TemplateVariablesResponse>(
      `/template-variables/${quicklistId}`,
    );
  }

  /**
   * Create a communication definition
   */
  async createCommunication(
    request: CreateCommunicationRequest,
  ): Promise<CreateCommunicationResponse> {
    return this.request<CreateCommunicationResponse>("", {
      method: "POST",
      body: JSON.stringify(request),
    });
  }

  /**
   * Get all communications
   */
  async getCommunications(): Promise<GetCommunicationsResponse> {
    return this.request<GetCommunicationsResponse>("");
  }

  /**
   * Delete a communication execution
   */
  async deleteExecution(executionId: string | number): Promise<{ success: boolean; message?: string }> {
    return this.request<{ success: boolean; message?: string }>(
      `/${executionId}`,
      { method: "DELETE" },
    );
  }

  /**
   * Delete a communication (broadcast template)
   */
  async deleteCommunication(communicationId: string | number): Promise<{ success: boolean; message?: string }> {
    return this.request<{ success: boolean; message?: string }>(
      `/${communicationId}`,
      { method: "DELETE" },
    );
  }
}

export const communicationService = new CommunicationService();
