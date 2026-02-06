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
} from "../types";
import { processDataConnectors } from "../utils/connectorIcons";
import { API_CONFIG, getAuthHeaders } from "../../../shared/services/api";

// API Configuration
const BASE_URL = `${API_CONFIG.BASE_URL}`;

// Helper function to handle API responses
const handleApiResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const errorData: ApiError = await response.json().catch(() => ({
      error: 'Network Error',
      message: `HTTP ${response.status}: ${response.statusText}`
    }));
    throw new Error(errorData.message || errorData.error || 'API request failed');
  }

  return response.json();
};

// Helper function to build query parameters
const buildQueryParams = (params: Record<string, any>): string => {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (Array.isArray(value)) {
        value.forEach(v => searchParams.append(key, v.toString()));
      } else {
        searchParams.append(key, value.toString());
      }
    }
  });

  return searchParams.toString();
};

/**
 * Fetch data connectors with optional filtering
 */
export const fetchDataConnectors = async (
  params: DataConnectorFilterParams = {}
): Promise<{ data: ProcessedDataConnector[]; total: number; hasMore: boolean }> => {
  try {
    // Convert frontend params to backend format
    const apiParams = {
      ...params,
      is_active: params.is_active,
    };

    const queryString = buildQueryParams(apiParams);
    const url = `${BASE_URL}/data-connectors${queryString ? `?${queryString}` : ''}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const result: DataConnectorListResponse = await handleApiResponse(response);

    // Process the data for frontend consumption
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
};

/**
 * Get a single data connector by ID
 */
export const fetchDataConnectorById = async (
  id: string
): Promise<ProcessedDataConnector | null> => {
  try {
    const response = await fetch(`${BASE_URL}/data-connectors/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.status === 404) {
      return null;
    }

    const connector: DataConnector = await handleApiResponse(response);
    return processDataConnectors([connector])[0];
  } catch (error) {
    console.error('Failed to fetch data connector by ID:', error);
    throw new Error(`Failed to fetch data connector: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Get available connector types
 */
export const getAvailableConnectorTypes = async (): Promise<DataConnectorType[]> => {
  try {
    const response = await fetch(`${BASE_URL}/data-connectors/types`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const result: ConnectorTypesResponse = await handleApiResponse(response);
    return result.types;
  } catch (error) {
    console.error('Failed to fetch available connector types:', error);
    // Fallback to hardcoded types if API fails
    return ["jdbc", "api", "kafka", "websocket", "tcp", "files", "sms_inbox"];
  }
};

/**
 * Create a new data connector
 */
export const createDataConnector = async (
  connectorData: CreateDataConnectorRequest
): Promise<ProcessedDataConnector> => {
  try {
    const response = await fetch(`${BASE_URL}/data-connectors/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(connectorData),
    });

    const connector: DataConnector = await handleApiResponse(response);
    return processDataConnectors([connector])[0];
  } catch (error) {
    console.error('Failed to create data connector:', error);
    throw new Error(`Failed to create data connector: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Update an existing data connector
 */
export const updateDataConnector = async (
  id: string,
  updates: UpdateDataConnectorRequest
): Promise<ProcessedDataConnector | null> => {
  try {
    const response = await fetch(`${BASE_URL}/data-connectors/update/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });

    if (response.status === 404) {
      return null;
    }

    const connector: DataConnector = await handleApiResponse(response);
    return processDataConnectors([connector])[0];
  } catch (error) {
    console.error('Failed to update data connector:', error);
    throw new Error(`Failed to update data connector: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Delete a data connector
 */
export const deleteDataConnector = async (id: string): Promise<boolean> => {
  try {
    const response = await fetch(`${BASE_URL}/data-connectors/delete/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.status === 204 || response.status === 200) {
      return true;
    }

    if (response.status === 404) {
      return false;
    }

    // Only try to parse JSON if we expect an error body
    if (!response.ok) {
      const errorData: ApiError = await response.json().catch(() => ({
        error: 'Unknown error',
        message: `HTTP ${response.status}`
      }));
      throw new Error(errorData.message || errorData.error || 'Delete failed');
    }

    return true;
  } catch (error) {
    console.error('Failed to delete data connector:', error);
    throw error; 
  }
};

/**
 * Test connection for a data connector
 */

export const testDataConnectorConnection = async (id: string): Promise<ConnectionTestResult> => {
  try {
    const response = await fetch(`${BASE_URL}/data-connectors/${id}/test-connection`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const result: ConnectionTestResult = await handleApiResponse(response);
    return result;
  } catch (error) {
    console.error('Failed to test data connector connection:', error);
    return {
      success: false,
      message: 'Connection test failed',
      error_details: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

/**
 * Test connection using configuration (before saving)
 */
export const testDataConnectorConfig = async (
  config: {
    type: DataConnectorType;
    configuration: DataConnectorConfiguration;
  }
): Promise<ConnectionTestResult> => {
  try {
    const response = await fetch(`${BASE_URL}/data-connectors/test-connection-config`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(config),
    });

    const result: ConnectionTestResult = await handleApiResponse(response);
    return result;
  } catch (error) {
    console.error('Config connection test failed:', error);
    return {
      success: false,
      message: 'Connection test failed',
      error_details: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

/**
 * Get data connector statistics
 */
export const getDataConnectorStatistics = async (): Promise<DataConnectorStatistics> => {
  try {
    const response = await fetch(`${BASE_URL}/data-connectors/statistics`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const statistics: DataConnectorStatistics = await handleApiResponse(response);
    return statistics;
  } catch (error) {
    console.error('Failed to fetch data connector statistics:', error);
    throw new Error(`Failed to fetch statistics: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Test connection configuration without saving
 */
export const testConnectionConfig = async (
  type: DataConnectorType,
  configuration: DataConnectorConfiguration
): Promise<ConnectionTestResult> => {
  try {
    const response = await fetch(`${BASE_URL}/data-connectors/test-connection-config`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ type, configuration }),
    });

    const result: ConnectionTestResult = await handleApiResponse(response);
    return result;
  } catch (error) {
    console.error('Failed to test connection configuration:', error);
    return {
      success: false,
      message: 'Connection test failed',
      error_details: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

export const fetchConnectionProfiles = async (params: { dataConnectorId?: string } = {}): Promise<ConnectionProfile[]> => {
  try {
    const query = params.dataConnectorId ? `?dataConnectorId=${params.dataConnectorId}` : '';
    const response = await fetch(`${BASE_URL}/connection-profiles${query}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) throw new Error('Failed to fetch profiles');

    const result = await response.json();
    // Adjust based on real response shape (probably { data: [...] })
    return result.data || result || [];
  } catch (err) {
    console.error('Fetch profiles error:', err);
    return [];
  }
};
