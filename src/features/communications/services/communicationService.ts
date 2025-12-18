import { API_CONFIG, getAuthHeaders } from '../../../shared/services/api';
import {
  SendCommunicationRequest,
  SendCommunicationResponse,
  CommunicationExecution,
  CommunicationStats,
  CommunicationLog,
  GetExecutionsRequest,
  GetLogsRequest,
  CommunicationExecutionsResponse,
  CommunicationStatsResponse,
  CommunicationLogsResponse,
} from '../types/communication';

const BASE_URL = `${API_CONFIG.BASE_URL}/communications`;

class CommunicationService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${BASE_URL}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        ...getAuthHeaders(),
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('Communication API Error:', {
        status: response.status,
        statusText: response.statusText,
        body: errorBody,
        url,
      });
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Send a communication to QuickList recipients
   */
  async sendCommunication(
    request: SendCommunicationRequest
  ): Promise<SendCommunicationResponse> {
    console.log('Sending communication:', request);
    return this.request<SendCommunicationResponse>('/send', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  /**
   * Get communication statistics
   */
  async getStats(): Promise<CommunicationStatsResponse> {
    return this.request<CommunicationStatsResponse>('/stats');
  }

  /**
   * Get communication executions
   */
  async getExecutions(
    params?: GetExecutionsRequest
  ): Promise<CommunicationExecutionsResponse> {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());
    if (params?.start_date) queryParams.append('start_date', params.start_date);
    if (params?.end_date) queryParams.append('end_date', params.end_date);
    if (params?.channel) queryParams.append('channel', params.channel);
    if (params?.source_type) queryParams.append('source_type', params.source_type);

    const queryString = queryParams.toString();
    const endpoint = `/executions${queryString ? `?${queryString}` : ''}`;

    return this.request<CommunicationExecutionsResponse>(endpoint);
  }

  /**
   * Get detailed execution information
   */
  async getExecutionById(executionId: string): Promise<{ success: boolean; data: CommunicationExecution }> {
    return this.request<{ success: boolean; data: CommunicationExecution }>(`/executions/${executionId}`);
  }

  /**
   * Get communication logs
   */
  async getLogs(
    params?: GetLogsRequest
  ): Promise<CommunicationLogsResponse> {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());
    if (params?.execution_id) queryParams.append('execution_id', params.execution_id);
    if (params?.channel) queryParams.append('channel', params.channel);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.start_date) queryParams.append('start_date', params.start_date);
    if (params?.end_date) queryParams.append('end_date', params.end_date);

    const queryString = queryParams.toString();
    const endpoint = `/logs${queryString ? `?${queryString}` : ''}`;

    return this.request<CommunicationLogsResponse>(endpoint);
  }
}

export const communicationService = new CommunicationService();
