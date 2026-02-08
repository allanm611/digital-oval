import { API_CONFIG, getAuthHeaders } from "../../../shared/services/api";
import {
  CreateCustomerRequest,
  UpdateCustomerRequest,
  CustomerResponse,
  CustomersListResponse,
} from "../types/customer";

const BASE_URL = `${API_CONFIG.BASE_URL}/subscriber-360`;

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
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
        ...options.headers,
      },
    });

    if (!response.ok && response.status !== 304) {
      const errorBody = await response.text();
      console.error("API Error Response:", {
        status: response.status,
        statusText: response.statusText,
        body: errorBody,
        url,
      });
      throw new Error(
        `HTTP error! status: ${response.status}, details: ${errorBody}`,
      );
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
   * Bulk create customers
   * POST /subscriber-360/bulk-create
   */
  async bulkCreateCustomers(request: {
    profiles: {
      msisdn: string;
      attributes?: Record<string, any>;
    }[];
  }): Promise<{ success: boolean; message?: string }> {
    return this.request<{ success: boolean; message?: string }>(
      "/bulk-create",
      {
        method: "POST",
        body: JSON.stringify(request),
      },
    );
  }

  /**
   * Get all customers with pagination
   * GET /subscriber-360?limit=50&offset=0
   */
  async getAllCustomers(params?: {
    limit?: number;
    offset?: number;
  }): Promise<CustomersListResponse> {
    try {
      const queryParams = new URLSearchParams();
      if (params) {
        if (params.limit) queryParams.append("limit", String(params.limit));
        if (params.offset) queryParams.append("offset", String(params.offset));
      }
      const query = queryParams.toString() ? `?${queryParams.toString()}` : "";
      console.log("🔍 Fetching customers from:", `${BASE_URL}${query}`);

      const response = await this.request<CustomersListResponse>(`${query}`);
      console.log("✅ Successfully fetched customers:", response);
      return response;
    } catch (error) {
      console.error("❌ Failed to fetch customers:", error);
      throw error;
    }
  }
}

export const customerService = new CustomerService();
export default customerService;
