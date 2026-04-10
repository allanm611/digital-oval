import {
  DataConnector,
  DataConnectorType,
  ProcessedDataConnector,
  DataConnectorFilterParams,
  DataConnectorListResponse,
  CreateDataConnectorRequest,
  UpdateDataConnectorRequest,
  DataConnectorStatistics,
  ConnectionTestResult,
  ConnectorTypesResponse,
  ApiError,
  DataConnectorConfiguration
} from "../types/dataConnector";
import { processDataConnectors } from "../utils/connectorIcons";
import { buildApiUrl, getAuthHeaders } from "../../../shared/services/api";

const BASE_URL = buildApiUrl("/data-connectors");

class DataConnectorService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const url = `${BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      headers: {
        ...getAuthHeaders(),
        ...options.headers,
      },
      ...options,
    });

    const text = await response.text();
    const isJson = text.trim().startsWith("{") || text.trim().startsWith("[");

    if (!text) {
      if (!response.ok) {
        throw new Error(`HTTP ${response.status} ${response.statusText}`);
      }
      return undefined as T;
    }

    let parsed: unknown;
    try {
      parsed = isJson ? JSON.parse(text) : (text as unknown);
    } catch {
      throw new Error(
        `Invalid JSON response from DataConnector API. First 200 chars: ${text.substring(0, 200)}`,
      );
    }

    if (!response.ok) {
      const errorMessage =
        (parsed as { error?: string; message?: string })?.error ||
        (parsed as { message?: string })?.message ||
        response.statusText ||
        "Unknown error";
      throw new Error(errorMessage);
    }

    return parsed as T;
  }

  private buildQueryParams(params?: Record<string, unknown>): string {
    if (!params) return "";
    const sp = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null || value === "") return;
      if (Array.isArray(value)) {
        value.forEach((v) => sp.append(key, String(v)));
      } else {
        sp.append(key, String(value));
      }
    });
    const qs = sp.toString();
    return qs ? `?${qs}` : "";
  }

  async fetchDataConnectors(
    params: DataConnectorFilterParams = {}
  ): Promise<{ data: ProcessedDataConnector[]; total: number; hasMore: boolean }> {
    try {
      const apiParams = {
        ...params,
        is_active: params.is_active,
      };

      const queryString = this.buildQueryParams(apiParams as Record<string, unknown>);
      const result: DataConnectorListResponse = await this.request<DataConnectorListResponse>(
        `${queryString ? `?${queryString}` : ''}`
      );

      const processedData = processDataConnectors(result.data);

      return {
        data: processedData,
        total: result.total,
        hasMore: result.has_more,
      };
    } catch (error) {
      console.error('Failed to fetch data connectors:', error);
      throw new Error(`Failed to fetch data connectors: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async fetchDataConnectorById(id: string): Promise<ProcessedDataConnector | null> {
    try {
      const connector: DataConnector = await this.request<DataConnector>(`/${id}`);
      return processDataConnectors([connector])[0];
    } catch (error) {
      if (error instanceof Error && error.message.includes('404')) {
        return null;
      }
      console.error('Failed to fetch data connector by ID:', error);
      throw new Error(`Failed to fetch data connector: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getAvailableConnectorTypes(): Promise<DataConnectorType[]> {
    try {
      const result: ConnectorTypesResponse = await this.request<ConnectorTypesResponse>("/types");
      return result.types;
    } catch (error) {
      console.error('Failed to fetch available connector types:', error);
      return ["jdbc", "api", "kafka", "websocket", "tcp", "files", "sms_inbox"];
    }
  }

  async createDataConnector(connectorData: CreateDataConnectorRequest): Promise<ProcessedDataConnector> {
    try {
      const connector: DataConnector = await this.request<DataConnector>("/create", {
        method: "POST",
        body: JSON.stringify(connectorData),
      });
      return processDataConnectors([connector])[0];
    } catch (error) {
      console.error('Failed to create data connector:', error);
      throw new Error(`Failed to create data connector: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async updateDataConnector(
    id: string,
    updates: UpdateDataConnectorRequest
  ): Promise<ProcessedDataConnector | null> {
    try {
      const connector: DataConnector = await this.request<DataConnector>(`/update/${id}`, {
        method: "PUT",
        body: JSON.stringify(updates),
      });
      return processDataConnectors([connector])[0];
    } catch (error) {
      if (error instanceof Error && error.message.includes('404')) {
        return null;
      }
      console.error('Failed to update data connector:', error);
      throw new Error(`Failed to update data connector: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async deleteDataConnector(id: string): Promise<boolean> {
    try {
      await this.request<void>(`/delete/${id}`, { method: "DELETE" });
      return true;
    } catch (error) {
      if (error instanceof Error && error.message.includes('404')) {
        return false;
      }
      console.error('Failed to delete data connector:', error);
      throw error;
    }
  }

  async testDataConnectorConnection(id: string): Promise<ConnectionTestResult> {
    try {
      const result: ConnectionTestResult = await this.request<ConnectionTestResult>(
        `/${id}/test-connection`,
        { method: "POST" }
      );
      return result;
    } catch (error) {
      console.error('Failed to test data connector connection:', error);
      return {
        success: false,
        message: 'Connection test failed',
        error_details: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async testDataConnectorConfig(config: {
    type: DataConnectorType;
    configuration: DataConnectorConfiguration;
  }): Promise<ConnectionTestResult> {
    try {
      const result: ConnectionTestResult = await this.request<ConnectionTestResult>(
        "/test-connection-config",
        {
          method: "POST",
          body: JSON.stringify(config),
        }
      );
      return result;
    } catch (error) {
      console.error('Config connection test failed:', error);
      return {
        success: false,
        message: 'Connection test failed',
        error_details: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async getDataConnectorStatistics(): Promise<DataConnectorStatistics> {
    try {
      const statistics: DataConnectorStatistics = await this.request<DataConnectorStatistics>("/statistics");
      return statistics;
    } catch (error) {
      console.error('Failed to fetch data connector statistics:', error);
      throw new Error(`Failed to fetch statistics: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async testConnectionConfig(
    type: DataConnectorType,
    configuration: DataConnectorConfiguration
  ): Promise<ConnectionTestResult> {
    try {
      const result: ConnectionTestResult = await this.request<ConnectionTestResult>(
        "/test-connection-config",
        {
          method: "POST",
          body: JSON.stringify({ type, configuration }),
        }
      );
      return result;
    } catch (error) {
      console.error('Failed to test connection configuration:', error);
      return {
        success: false,
        message: 'Connection test failed',
        error_details: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async fetchConnectionProfiles(params: { dataConnectorId?: string } = {}): Promise<any[]> {
    try {
      const query = params.dataConnectorId ? `?dataConnectorId=${params.dataConnectorId}` : '';
      const result = await this.request<any>(`/connection-profiles${query}`);
      return result?.data || result || [];
    } catch (err) {
      console.error('Fetch profiles error:', err);
      return [];
    }
  }

  async getConnectionProfilesByDataConnectorId(dataConnectorId: string): Promise<any[]> {
    try {
      const result = await this.request<any>(`/${dataConnectorId}`);
      return result?.data || result || [];
    } catch (err) {
      console.error('Failed to fetch connection profiles for data connector:', err);
      return [];
    }
  }
}

export const dataConnectorService = new DataConnectorService();
