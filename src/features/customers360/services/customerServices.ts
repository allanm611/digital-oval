import { API_CONFIG, getAuthHeaders } from "../../../shared/services/api";
import {
  CreateCustomerRequest,
  UpdateCustomerRequest,
  CustomerResponse,
  CustomersListResponse,
} from "../types/customer";

const BASE_URL = `${API_CONFIG.BASE_URL}/subscriber-360`;
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

      const response = await this.request<CustomersListResponse>(`${query}`);
      return response;
    } catch (error) {
      console.error("Failed to fetch customers:", error);
      throw error;
    }
  }
}

export const customerService = new CustomerService();
export default customerService;
