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

    // Find Customer 360 category
    const customer360Category = categories.find(
      (category) =>
        category.value === "customer_360" ||
        (category.name && category.name.toLowerCase().includes("customer 360"))
    );

    // Find Customer Identity subcategory within Customer 360
    if (customer360Category?.sub_categories && customer360Category.sub_categories.length > 0) {
      const customerIdentitySubcategory = customer360Category.sub_categories.find(
        (subcategory: any) =>
          subcategory.name && subcategory.name.toLowerCase().includes("customer identity")
      );

      if (customerIdentitySubcategory?.fields) {
        return customerIdentitySubcategory.fields;
      }
    }

    // Fallback: try the old structure (direct fields on category)
    if (customer360Category?.fields) {
      return customer360Category.fields;
    }

    return [];
  }
}

export const customerIdentityService = new CustomerIdentityService();
