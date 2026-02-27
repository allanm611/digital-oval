import { API_CONFIG, getAuthHeaders } from "../../../shared/services/api";
import {
  CreateCustomerRequest,
  UpdateCustomerRequest,
  CustomerResponse,
  CustomersListResponse,
} from "../types/customer";

// const BASE_URL = `${API_CONFIG.BASE_URL}/subscriber-360`;
const BASE_URL = `${API_CONFIG.BASE_URL}/subscribers`;
const BULK_CREATE_URL = `${API_CONFIG.BASE_URL}/subscribers/bulk-create`;

class CustomerService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const url = `${BASE_URL}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        ...getAuthHeaders(),
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    // Handle error status codes (including 409 Conflict)
    if (!response.ok && response.status !== 304) {
      const errorBody = await response.text();
      console.error("API Error Response:", {
        status: response.status,
        statusText: response.statusText,
        body: errorBody,
        url,
      });

      // Try to parse JSON error message for better error display
      try {
        const errorJson = JSON.parse(errorBody);
        throw new Error(errorJson.error || `HTTP error! status: ${response.status}`);
      } catch {
        throw new Error(
          `HTTP error! status: ${response.status}, details: ${errorBody}`,
        );
      }
    }

    return response.json();
  }

  /**
   * Create a new customer (subscriber)
   */
  async createCustomer(
    request: CreateCustomerRequest,
  ): Promise<CustomerResponse> {
    return this.request<CustomerResponse>("", {
      method: "POST",
      body: JSON.stringify(request),
    });
  }

  /**
   * Get customer by subscriber ID
   */
  async getCustomerById(subscriberId: number): Promise<CustomerResponse> {
    return this.request<CustomerResponse>(`/${subscriberId}`);
  }

  /**
   * Update customer by subscriber ID
   */
  async updateCustomer(
    subscriberId: number,
    request: UpdateCustomerRequest,
  ): Promise<CustomerResponse> {
    return this.request<CustomerResponse>(`/${subscriberId}`, {
      method: "PUT",
      body: JSON.stringify(request),
    });
  }

  /**
   * Delete customer by subscriber ID
   */
  async deleteCustomer(
    subscriberId: number,
  ): Promise<{ success: boolean; message?: string }> {
    return this.request<{ success: boolean; message?: string }>(
      `/${subscriberId}`,
      {
        method: "DELETE",
      },
    );
  }

  /**
   * Bulk create customers (different endpoint than other customer operations)
   * POST /api/database-service/subscribers/bulk-create
   */
  async bulkCreateCustomers(request: {
    profiles: {
      msisdn: string;
      attributes?: {
        segment?: string;
        onboarded_at?: string;
        [key: string]: string | undefined;
      };
    }[];
  }): Promise<{ success: boolean; message?: string }> {
    const response = await fetch(BULK_CREATE_URL, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("API Error Response:", {
        status: response.status,
        statusText: response.statusText,
        body: errorBody,
        url: BULK_CREATE_URL,
      });
      throw new Error(
        `HTTP error! status: ${response.status}, details: ${errorBody}`,
      );
    }

    return response.json();
  }

  async getAllCustomers(params?: {
    limit?: number;
    offset?: number;
    skipCache?: boolean;
  }): Promise<CustomersListResponse> {
    try {
      const queryParams = new URLSearchParams();
      if (params) {
        if (params.limit) queryParams.append("limit", String(params.limit));
        if (params.offset) queryParams.append("offset", String(params.offset));
        if (params.skipCache) queryParams.append("skipCache", "true");
      }

      const query = queryParams.toString() ? `?${queryParams.toString()}` : "";
      const url = `${BASE_URL}${query}`;

      const response = await fetch(url, {
        headers: {
          ...getAuthHeaders(),
        },
      });

      if (!response.ok && response.status !== 304) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return response.json();
    } catch (error) {
      console.error("Failed to fetch customers:", error);
      throw error;
    }
  }

  /**
   * Search customers by query term
   * GET /subscribers/search
   */
  async searchCustomers(params?: {
    q?: string;
    search?: string;
    limit?: number;
    offset?: number;
    skipCache?: boolean;
  }): Promise<CustomersListResponse> {
    try {
      const queryParams = new URLSearchParams();
      if (params) {
        if (params.q) queryParams.append("q", params.q);
        if (params.search) queryParams.append("search", params.search);
        if (params.limit) queryParams.append("limit", String(params.limit));
        if (params.offset) queryParams.append("offset", String(params.offset));
        // Note: skipCache not supported by search endpoint
      }

      const query = queryParams.toString() ? `?${queryParams.toString()}` : "";
      const url = `${BASE_URL}/search${query}`;

      const response = await fetch(url, {
        headers: {
          ...getAuthHeaders(),
        },
      });

      if (!response.ok && response.status !== 304) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return response.json();
    } catch (error) {
      console.error("Failed to search customers:", error);
      throw error;
    }
  }
}

export const customerService = new CustomerService();
export default customerService;
