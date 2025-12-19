import { buildApiUrl, getAuthHeaders } from "../../../shared/services/api";
import {
  ProductCategory as ProductCategoryType,
  ApiResponse,
  PaginatedResponse,
  CategoryStats,
  ProductCountByCategory,
  CategoryDepthAnalysis,
  CategoryUsageStats,
  CategoryTree,
  MoveSubtreeRequest,
} from "../types/productCategory";
import { Product } from "../types/product";

class ProductCategoryService {
  private baseUrl = buildApiUrl("/product-categories");

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      headers: {
        ...getAuthHeaders(),
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      // Try to parse error message from response
      try {
        const errorData = await response.json();

        if (errorData.error) {
          throw new Error(errorData.error);
        }
        if (errorData.message) {
          throw new Error(errorData.message);
        }
        if (errorData.details) {
          throw new Error(errorData.details);
        }
        // If we have data but no specific error message, show generic error
        throw new Error(`HTTP error! status: ${response.status}`);
      } catch (parseError) {
        // If JSON parsing fails, try to get text response
        if (
          parseError instanceof Error &&
          parseError.message.includes("JSON")
        ) {
          try {
            const textError = await response.text();
            throw new Error(
              textError || `HTTP error! status: ${response.status}`
            );
          } catch {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
        }
        // If it's already an Error with the message, re-throw it
        if (parseError instanceof Error) {
          throw parseError;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    }

    return response.json();
  }

  // 1. Create Endpoints

  async createCategory(data: {
    name: string;
    description?: string;
    parent_category_id?: number;
    is_active?: boolean;
    created_by?: number;
  }): Promise<ApiResponse<ProductCategoryType>> {
    return this.request<ApiResponse<ProductCategoryType>>("/", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // 2. Tree Operations Endpoints

  async moveSubtree(data: MoveSubtreeRequest): Promise<
    ApiResponse<{
      message: string;
      moved_categories: number;
      affected_products: number;
    }>
  > {
    return this.request<
      ApiResponse<{
        message: string;
        moved_categories: number;
        affected_products: number;
      }>
    >("/move-subtree", {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  // 3. Filtered List Endpoints

  async getActiveCategories(
    params: {
      limit?: number;
      offset?: number;
      skipCache?: boolean;
    } = {}
  ): Promise<PaginatedResponse<ProductCategoryType>> {
    const queryParams = new URLSearchParams();
    if (params.limit) queryParams.append("limit", params.limit.toString());
    if (params.offset) queryParams.append("offset", params.offset.toString());
    if (params.skipCache) queryParams.append("skipCache", "true");

    const query = queryParams.toString();
    return this.request<PaginatedResponse<ProductCategoryType>>(
      `/active${query ? "?" + query : ""}`
    );
  }

  async getRootCategories(
    params: {
      limit?: number;
      offset?: number;
      skipCache?: boolean;
    } = {}
  ): Promise<PaginatedResponse<ProductCategoryType>> {
    const queryParams = new URLSearchParams();
    if (params.limit) queryParams.append("limit", params.limit.toString());
    if (params.offset) queryParams.append("offset", params.offset.toString());
    if (params.skipCache) queryParams.append("skipCache", "true");

    const query = queryParams.toString();
    return this.request<PaginatedResponse<ProductCategoryType>>(
      `/root${query ? "?" + query : ""}`
    );
  }

  async getCategoryTree(
    skipCache: boolean = false
  ): Promise<ApiResponse<CategoryTree[]>> {
    const params = skipCache ? "?skipCache=true" : "";
    return this.request<ApiResponse<CategoryTree[]>>(`/tree${params}`);
  }

  async searchCategories(params: {
    q: string;
    limit?: number;
    offset?: number;
    skipCache?: boolean;
  }): Promise<PaginatedResponse<ProductCategoryType>> {
    const queryParams = new URLSearchParams();
    queryParams.append("searchTerm", params.q);
    if (params.limit) queryParams.append("limit", params.limit.toString());
    if (params.offset) queryParams.append("offset", params.offset.toString());
    if (params.skipCache) queryParams.append("skipCache", "true");

    return this.request<PaginatedResponse<ProductCategoryType>>(
      `/search?${queryParams}`
    );
  }

  async superSearch(
    params: {
      id?: number;
      name?: string;
      description?: string;
      parent_category_id?: number;
      is_active?: boolean;
      created_by?: number;
      created_from?: string;
      created_to?: string;
      limit?: number;
      offset?: number;
      skipCache?: boolean;
    } = {}
  ): Promise<PaginatedResponse<ProductCategoryType>> {
    const queryParams = new URLSearchParams();
    if (params.id) queryParams.append("id", params.id.toString());
    if (params.name) queryParams.append("name", params.name);
    if (params.description)
      queryParams.append("description", params.description);
    if (params.parent_category_id)
      queryParams.append(
        "parent_category_id",
        params.parent_category_id.toString()
      );
    if (params.is_active !== undefined && params.is_active !== null)
      queryParams.append("is_active", params.is_active.toString());
    if (params.created_by)
      queryParams.append("created_by", params.created_by.toString());
    if (params.created_from)
      queryParams.append("created_from", params.created_from);
    if (params.created_to) queryParams.append("created_to", params.created_to);
    if (params.limit) queryParams.append("limit", params.limit.toString());
    if (params.offset) queryParams.append("offset", params.offset.toString());
    if (params.skipCache) queryParams.append("skipCache", "true");

    return this.request<PaginatedResponse<ProductCategoryType>>(
      `/super-search?${queryParams}`
    );
  }

  // 4. Analytics Endpoints

  async getStats(
    skipCache: boolean = false
  ): Promise<ApiResponse<CategoryStats>> {
    const params = skipCache ? "?skipCache=true" : "";
    return this.request<ApiResponse<CategoryStats>>(`/stats${params}`);
  }

  async getProductCountByCategory(
    params: {
      limit?: number;
      offset?: number;
      skipCache?: boolean;
    } = {}
  ): Promise<PaginatedResponse<ProductCountByCategory>> {
    const queryParams = new URLSearchParams();
    if (params.limit) queryParams.append("limit", params.limit.toString());
    if (params.offset) queryParams.append("offset", params.offset.toString());
    if (params.skipCache) queryParams.append("skipCache", "true");

    const query = queryParams.toString();
    return this.request<PaginatedResponse<ProductCountByCategory>>(
      `/analytics/product-count${query ? "?" + query : ""}`
    );
  }

  async getActiveProductCountByCategory(
    params: {
      limit?: number;
      offset?: number;
      skipCache?: boolean;
    } = {}
  ): Promise<PaginatedResponse<ProductCountByCategory>> {
    const queryParams = new URLSearchParams();
    if (params.limit) queryParams.append("limit", params.limit.toString());
    if (params.offset) queryParams.append("offset", params.offset.toString());
    if (params.skipCache) queryParams.append("skipCache", "true");

    const query = queryParams.toString();
    return this.request<PaginatedResponse<ProductCountByCategory>>(
      `/analytics/active-product-count${query ? "?" + query : ""}`
    );
  }

  async getDepthAnalysis(
    skipCache: boolean = false
  ): Promise<ApiResponse<CategoryDepthAnalysis[]>> {
    const params = skipCache ? "?skipCache=true" : "";
    return this.request<ApiResponse<CategoryDepthAnalysis[]>>(
      `/analytics/depth-analysis${params}`
    );
  }

  async getUsageStats(
    params: {
      limit?: number;
      offset?: number;
      skipCache?: boolean;
    } = {}
  ): Promise<PaginatedResponse<CategoryUsageStats>> {
    const queryParams = new URLSearchParams();
    if (params.limit) queryParams.append("limit", params.limit.toString());
    if (params.offset) queryParams.append("offset", params.offset.toString());
    if (params.skipCache) queryParams.append("skipCache", "true");

    const query = queryParams.toString();
    return this.request<PaginatedResponse<CategoryUsageStats>>(
      `/analytics/usage-stats${query ? "?" + query : ""}`
    );
  }

  // 5. Name Lookup Endpoints

  async getCategoryByName(
    name: string,
    skipCache: boolean = false
  ): Promise<ApiResponse<ProductCategoryType>> {
    const params = skipCache ? "?skipCache=true" : "";
    return this.request<ApiResponse<ProductCategoryType>>(
      `/name/${encodeURIComponent(name)}${params}`
    );
  }

  // 6. ID-based Operations Endpoints

  async getCategoryById(
    id: number,
    skipCache: boolean = false
  ): Promise<ApiResponse<ProductCategoryType>> {
    const params = skipCache ? "?skipCache=true" : "";
    return this.request<ApiResponse<ProductCategoryType>>(`/${id}${params}`);
  }

  async getCategoryChildren(
    id: number,
    params: {
      limit?: number;
      offset?: number;
      skipCache?: boolean;
    } = {}
  ): Promise<PaginatedResponse<ProductCategoryType>> {
    const queryParams = new URLSearchParams();
    if (params.limit) queryParams.append("limit", params.limit.toString());
    if (params.offset) queryParams.append("offset", params.offset.toString());
    if (params.skipCache) queryParams.append("skipCache", "true");

    const query = queryParams.toString();
    return this.request<PaginatedResponse<ProductCategoryType>>(
      `/${id}/children${query ? "?" + query : ""}`
    );
  }

  async getCategoryDescendants(
    id: number,
    params: {
      limit?: number;
      offset?: number;
      include_self?: boolean;
      skipCache?: boolean;
    } = {}
  ): Promise<PaginatedResponse<ProductCategoryType>> {
    const queryParams = new URLSearchParams();
    if (params.limit) queryParams.append("limit", params.limit.toString());
    if (params.offset) queryParams.append("offset", params.offset.toString());
    if (params.include_self)
      queryParams.append("include_self", params.include_self.toString());
    if (params.skipCache) queryParams.append("skipCache", "true");

    const query = queryParams.toString();
    return this.request<PaginatedResponse<ProductCategoryType>>(
      `/${id}/descendants${query ? "?" + query : ""}`
    );
  }

  async getCategoryAncestors(
    id: number,
    params: {
      limit?: number;
      offset?: number;
      include_self?: boolean;
      skipCache?: boolean;
    } = {}
  ): Promise<PaginatedResponse<ProductCategoryType>> {
    const queryParams = new URLSearchParams();
    if (params.limit) queryParams.append("limit", params.limit.toString());
    if (params.offset) queryParams.append("offset", params.offset.toString());
    if (params.include_self)
      queryParams.append("include_self", params.include_self.toString());
    if (params.skipCache) queryParams.append("skipCache", "true");

    const query = queryParams.toString();
    return this.request<PaginatedResponse<ProductCategoryType>>(
      `/${id}/ancestors${query ? "?" + query : ""}`
    );
  }

  async getCategorySubtree(
    id: number,
    params: {
      include_self?: boolean;
      skipCache?: boolean;
    } = {}
  ): Promise<ApiResponse<CategoryTree[]>> {
    const queryParams = new URLSearchParams();
    if (params.include_self)
      queryParams.append("include_self", params.include_self.toString());
    if (params.skipCache) queryParams.append("skipCache", "true");

    const query = queryParams.toString();
    return this.request<ApiResponse<CategoryTree[]>>(
      `/${id}/subtree${query ? "?" + query : ""}`
    );
  }

  async getCategoryProducts(
    id: number,
    params: {
      limit?: number;
      offset?: number;
      active_only?: boolean;
      skipCache?: boolean;
    } = {}
  ): Promise<PaginatedResponse<Product>> {
    const queryParams = new URLSearchParams();
    if (params.limit) queryParams.append("limit", params.limit.toString());
    if (params.offset) queryParams.append("offset", params.offset.toString());
    if (params.active_only)
      queryParams.append("active_only", params.active_only.toString());
    if (params.skipCache) queryParams.append("skipCache", "true");

    const query = queryParams.toString();
    return this.request<PaginatedResponse<Product>>(
      `/${id}/products${query ? "?" + query : ""}`
    );
  }

  async getCategoryProductCount(
    id: number,
    skipCache: boolean = false
  ): Promise<
    ApiResponse<{
      category_id: number;
      category_name: string;
      total_products: number;
      active_products: number;
      inactive_products: number;
    }>
  > {
    const params = skipCache ? "?skipCache=true" : "";
    return this.request<
      ApiResponse<{
        category_id: number;
        category_name: string;
        total_products: number;
        active_products: number;
        inactive_products: number;
      }>
    >(`/${id}/product-count${params}`);
  }

  async getCategoryActiveProductCount(
    id: number,
    skipCache: boolean = false
  ): Promise<
    ApiResponse<{
      category_id: number;
      category_name: string;
      active_products: number;
    }>
  > {
    const params = skipCache ? "?skipCache=true" : "";
    return this.request<
      ApiResponse<{
        category_id: number;
        category_name: string;
        active_products: number;
      }>
    >(`/${id}/active-product-count${params}`);
  }

  // 7. Update Endpoints

  async updateCategory(
    id: number,
    data: {
      name?: string;
      description?: string;
      parent_category_id?: number;
      is_active?: boolean;
      updated_by?: number;
    }
  ): Promise<ApiResponse<ProductCategoryType>> {
    return this.request<ApiResponse<ProductCategoryType>>(`/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async activateCategory(
    id: number,
    updatedBy?: number
  ): Promise<ApiResponse<ProductCategoryType>> {
    const body = updatedBy ? { updated_by: updatedBy } : {};
    return this.request<ApiResponse<ProductCategoryType>>(`/${id}/activate`, {
      method: "PATCH",
      body: JSON.stringify(body),
    });
  }

  async deactivateCategory(
    id: number,
    updatedBy?: number
  ): Promise<ApiResponse<ProductCategoryType>> {
    const body = updatedBy ? { updated_by: updatedBy } : {};
    return this.request<ApiResponse<ProductCategoryType>>(`/${id}/deactivate`, {
      method: "PATCH",
      body: JSON.stringify(body),
    });
  }

  async updateCategoryParent(
    id: number,
    data: {
      parent_category_id?: number;
      updated_by?: number;
    }
  ): Promise<ApiResponse<ProductCategoryType>> {
    return this.request<ApiResponse<ProductCategoryType>>(`/${id}/parent`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  // 8. Delete Endpoints

  async deleteCategory(id: number): Promise<
    ApiResponse<{
      message: string;
      deleted_at: string;
      affected_products: number;
    }>
  > {
    return this.request<
      ApiResponse<{
        message: string;
        deleted_at: string;
        affected_products: number;
      }>
    >(`/${id}`, {
      method: "DELETE",
    });
  }

  // 9. List All Endpoints

  async getAllCategories(
    params: {
      limit?: number;
      offset?: number;
      skipCache?: boolean;
    } = {}
  ): Promise<PaginatedResponse<ProductCategoryType>> {
    const queryParams = new URLSearchParams();
    if (params.limit) queryParams.append("limit", params.limit.toString());
    if (params.offset) queryParams.append("offset", params.offset.toString());
    if (params.skipCache) queryParams.append("skipCache", "true");

    const query = queryParams.toString();
    return this.request<PaginatedResponse<ProductCategoryType>>(
      `/${query ? "?" + query : ""}`
    );
  }
}

export const productCategoryService = new ProductCategoryService();
