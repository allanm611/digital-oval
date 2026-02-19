import { buildApiUrl, getAuthHeaders } from "../../../shared/services/api";
import {
  SegmentationProfilesResponse,
  FieldCategory,
  CustomerIdentityField,
} from "../types/customerIdentity";

const BASE_URL = buildApiUrl("/segmentation-fields");

class CustomerIdentityService {
  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await fetch(`${BASE_URL}${path}`, {
      headers: {
        ...getAuthHeaders(),
      },
      ...init,
    });

    if (!response.ok) {
      const message = await response.text();
      throw new Error(
        message || `Request failed with status ${response.status}`,
      );
    }

    return response.json() as Promise<T>;
  }

  async getProfiles(skipCache = false): Promise<SegmentationProfilesResponse> {
    const query = skipCache ? "?skipCache=true" : "";
    return this.request<SegmentationProfilesResponse>(`/profile${query}`);
  }

  async getCustomerIdentityFields(
    skipCache = false,
  ): Promise<CustomerIdentityField[]> {
    const profiles = await this.getProfiles(skipCache);
    const categories =
      profiles.data?.[0]?.field_selector_config ?? ([] as FieldCategory[]);

    // Support both old structure (value field) and new structure (category field)
    const customerIdentityCategory = categories.find(
      (category) =>
        category.value === "customer_identity" ||
        (category.category && category.category.toLowerCase().includes("customer identity"))
    );

    return customerIdentityCategory?.fields ?? [];
  }
}

export const customerIdentityService = new CustomerIdentityService();
