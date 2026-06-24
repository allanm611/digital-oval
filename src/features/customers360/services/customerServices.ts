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
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        const errorJson = JSON.parse(errorBody);
        if (errorJson.error) {
          errorMessage = errorJson.error;
        }
      } catch {
        // If JSON parsing fails, add the raw body to the message
        errorMessage = `${errorMessage}, details: ${errorBody}`;
      }
      throw new Error(errorMessage);
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
   * Search customers by msisdn
   * POST /subscribers/search
   */
  async searchCustomers(params?: {
    msisdn?: string;
    limit?: number;
    offset?: number;
  }): Promise<CustomersListResponse> {
    try {
      const body: any = {};
      if (params?.msisdn) body.msisdn = params.msisdn;
      if (params?.limit) body.limit = params.limit;
      if (params?.offset) body.offset = params.offset;

      const response = await fetch(`${BASE_URL}/search`, {
        method: "POST",
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
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

  async getSubscriberStats(skipCache?: boolean): Promise<any> {
    try {
      const params = new URLSearchParams();
      if (skipCache) {
        params.append("skipCache", "true");
      }
      return await this.request(`/stats${params.toString() ? `?${params.toString()}` : ""}`);
    } catch (error) {
      console.error("Failed to fetch subscriber stats:", error);
      throw error;
    }
  }
}

export const customerService = new CustomerService();
export default customerService;
