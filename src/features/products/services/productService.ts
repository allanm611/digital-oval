import {
  Product,
  CreateProductRequest,
  UpdateProductRequest,
  ApiResponse,
  PaginatedResponse,
  ProductStats,
  CategoryPerformance,
  TopSellingProduct,
  ProductAvailability,
  ProductMargin,
} from "../types/product";
import {
  getAuthHeaders,
  buildApiUrl,
  API_CONFIG,
} from "../../../shared/services/api";

class ProductService {
  private baseUrl = buildApiUrl(API_CONFIG.ENDPOINTS.PRODUCTS);

  /**
   * Translates technical error messages to user-friendly messages
   */
  private getUserFriendlyError(
    errorMessage: string,
    statusCode: number,
    operation: string = "operation"
  ): string {
    // List of technical/generic error messages that should be translated
    const technicalErrors = [
      "internal server error",
      "server error",
      "bad request",
      "unauthorized",
      "forbidden",
      "not found",
      "method not allowed",
      "unprocessable entity",
      "too many requests",
      "service unavailable",
      "http error",
      "network error",
      "fetch failed",
    ];

    // Check if error message is technical/generic
    const isTechnicalError = technicalErrors.some((techError) =>
      errorMessage.toLowerCase().includes(techError)
    );

    // If it's a technical error or contains status code, provide user-friendly message
    if (isTechnicalError || errorMessage.includes("status:")) {
      // Map status codes to user-friendly messages
      const statusMessages: Record<number, string> = {
        400: "The request was invalid. Please check your input and try again.",
        401: "You are not authorized to perform this action. Please log in and try again.",
        403: "You don't have permission to perform this action.",
        404: "The requested resource was not found.",
        409: "This item already exists. Please use a different value.",
        422: "The provided data is invalid. Please check your input and try again.",
        429: "Too many requests. Please wait a moment and try again.",
        500: "A server error occurred. Please try again later or contact support if the problem persists.",
        502: "Service temporarily unavailable. Please try again later.",
        503: "Service temporarily unavailable. Please try again later.",
        504: "Request timed out. Please try again.",
      };

      // If we have a specific message for this status code, use it
      if (statusMessages[statusCode]) {
        return statusMessages[statusCode];
      }

      // Generic messages based on status code range
      if (statusCode >= 500) {
        return "A server error occurred. Please try again later or contact support if the problem persists.";
      } else if (statusCode >= 400) {
        return "There was a problem with your request. Please check your input and try again.";
      } else {
        return `An error occurred while ${operation}. Please try again.`;
      }
    }

    // If it's a user-friendly error message (like "DA ID already exists"), return as-is
    return errorMessage;
  }

  private normalizeProduct(data: any): Product {
    if (!data) {
      return {
        id: 0,
        product_uuid: "unknown",
        product_code: "Not specified",
        name: "Not specified",
        description: "Not specified",
        price: 0,
        currency: "USD",
        requires_inventory: false,
        is_active: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }

    return {
      id: data.id || 0,
      product_uuid: data.product_uuid || "unknown",
      product_code: data.product_code || "Not specified",
      da_id: data.da_id || undefined,
      name: data.name || "Not specified",
      description: data.description || "Not specified",
      category_id: data.category_id || undefined,
      product_type_id: data.product_type_id || undefined,
      price: data.price ?? 0,
      currency: data.currency || "USD",
      scope: data.scope || undefined,
      unit: data.unit || data.unit_of_measure || undefined,
      unit_value: data.unit_value ?? data.value ?? undefined,
      cost: data.cost ?? undefined,
      validity_days: data.validity_days ?? undefined,
      validity_hours: data.validity_hours ?? undefined,
      offer_category: data.offer_category || undefined,
      requires_inventory: data.requires_inventory ?? false,
      available_quantity: data.available_quantity ?? undefined,
      is_active: data.is_active ?? false,
      effective_from: data.effective_from || undefined,
      effective_to: data.effective_to || undefined,
      created_at: data.created_at || new Date().toISOString(),
      updated_at: data.updated_at || new Date().toISOString(),
      created_by: data.created_by || undefined,
      updated_by: data.updated_by || undefined,
      metadata: data.metadata || undefined,
      tags: Array.isArray(data.tags) ? data.tags : [],
    };
  }

  private normalizeProductArray(products: any[]): Product[] {
    return Array.isArray(products) ? products.map((prod) => this.normalizeProduct(prod)) : [];
  }

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

    // Parse response first
    const contentType = response.headers.get("content-type");
    let responseData: Record<string, unknown>;

    try {
      if (contentType && contentType.includes("application/json")) {
        responseData = await response.json();
      } else {
        const text = await response.text();
        responseData = text ? JSON.parse(text) : {};
      }
    } catch {
      responseData = {};
    }

    // Check if response has success: false (backend may return 200 with error)
    if (responseData && responseData.success === false) {
      const errorMessage =
        responseData.error ||
        responseData.message ||
        responseData.details ||
        "Operation failed";
      throw new Error(
        typeof errorMessage === "string"
          ? errorMessage
          : JSON.stringify(errorMessage)
      );
    }

    if (!response.ok) {
      // Try to parse error message from response
      let errorMessage = `HTTP error! status: ${response.status}`;

      try {
        const errorData = responseData || {};

        // Check for error message in various possible locations
        // Backend returns: { success: false, error: "message" }
        if (errorData.error) {
          errorMessage =
            typeof errorData.error === "string"
              ? errorData.error
              : String(errorData.error);
        } else if (errorData.message) {
          errorMessage =
            typeof errorData.message === "string"
              ? errorData.message
              : String(errorData.message);
        } else if (errorData.details) {
          errorMessage =
            typeof errorData.details === "string"
              ? errorData.details
              : JSON.stringify(errorData.details);
        } else if (typeof errorData === "string") {
          errorMessage = errorData;
        }
      } catch {
        // If parsing fails, use status text
        errorMessage =
          response.statusText || `HTTP error! status: ${response.status}`;
      }

      // Extract operation type from endpoint for better error messages
      const operation =
        endpoint.includes("create") || options.method === "POST"
          ? "creating the product"
          : endpoint.includes("update") ||
            options.method === "PUT" ||
            options.method === "PATCH"
          ? "updating the product"
          : "processing your request";

      // Translate to user-friendly message if needed
      const friendlyMessage = this.getUserFriendlyError(
        errorMessage,
        response.status,
        operation
      );

      throw new Error(friendlyMessage);
    }

    return responseData as T;
  }

  // 1. Analytics & Stats Endpoints

  async getStats(
    skipCache: boolean = false
  ): Promise<ApiResponse<ProductStats>> {
    const params = skipCache ? "?skipCache=true" : "";
    return this.request<ApiResponse<ProductStats>>(`/stats${params}`);
  }

  async getCategoryPerformance(
    params: {
      limit?: number;
      offset?: number;
      skipCache?: boolean;
    } = {}
  ): Promise<PaginatedResponse<CategoryPerformance>> {
    const queryParams = new URLSearchParams();
    if (params.limit) queryParams.append("limit", params.limit.toString());
    if (params.offset) queryParams.append("offset", params.offset.toString());
    if (params.skipCache) queryParams.append("skipCache", "true");

    const query = queryParams.toString();
    return this.request<PaginatedResponse<CategoryPerformance>>(
      `/category-performance${query ? "?" + query : ""}`
    );
  }

  async getTopSelling(
    params: {
      limit?: number;
      offset?: number;
      skipCache?: boolean;
    } = {}
  ): Promise<PaginatedResponse<TopSellingProduct>> {
    const queryParams = new URLSearchParams();
    if (params.limit) queryParams.append("limit", params.limit.toString());
    if (params.offset) queryParams.append("offset", params.offset.toString());
    if (params.skipCache) queryParams.append("skipCache", "true");

    const query = queryParams.toString();
    return this.request<PaginatedResponse<TopSellingProduct>>(
      `/top-selling${query ? "?" + query : ""}`
    );
  }

  // 2. Search Endpoints

  async searchProducts(params: {
    q: string;
    limit?: number;
    offset?: number;
    skipCache?: boolean;
  }): Promise<PaginatedResponse<Product>> {
    const queryParams = new URLSearchParams();
    queryParams.append("searchTerm", params.q);
    if (params.limit) queryParams.append("limit", params.limit.toString());
    if (params.offset) queryParams.append("offset", params.offset.toString());
    if (params.skipCache) queryParams.append("skipCache", "true");

    const response = await this.request<PaginatedResponse<Product>>(`/search?${queryParams}`);

    // Normalize all products in paginated response
    if (response?.data && Array.isArray(response.data)) {
      return {
        ...response,
        data: this.normalizeProductArray(response.data),
      };
    }
    return response;
  }

  async superSearch(
    params: {
      id?: number;
      product_code?: string;
      name?: string;
      category_id?: number;
      price_min?: number;
      price_max?: number;
      currency?: string;
      is_active?: boolean;
      requires_inventory?: boolean;
      validity_days?: number;
      validity_hours?: number;
      effective_from?: string;
      effective_to?: string;
      limit?: number;
      offset?: number;
      skipCache?: boolean;
    } = {}
  ): Promise<PaginatedResponse<Product>> {
    const queryParams = new URLSearchParams();
    if (params.id) queryParams.append("id", params.id.toString());
    if (params.product_code)
      queryParams.append("product_code", params.product_code);
    if (params.name) queryParams.append("name", params.name);
    if (params.category_id)
      queryParams.append("category_id", params.category_id.toString());
    if (params.price_min)
      queryParams.append("price_min", params.price_min.toString());
    if (params.price_max)
      queryParams.append("price_max", params.price_max.toString());
    if (params.currency) queryParams.append("currency", params.currency);
    if (params.is_active !== undefined)
      queryParams.append("is_active", params.is_active.toString());
    if (params.requires_inventory !== undefined)
      queryParams.append(
        "requires_inventory",
        params.requires_inventory.toString()
      );
    if (params.validity_days)
      queryParams.append("validity_days", params.validity_days.toString());
    if (params.validity_hours)
      queryParams.append("validity_hours", params.validity_hours.toString());
    if (params.effective_from)
      queryParams.append("effective_from", params.effective_from);
    if (params.effective_to)
      queryParams.append("effective_to", params.effective_to);
    if (params.limit) queryParams.append("limit", params.limit.toString());
    if (params.offset) queryParams.append("offset", params.offset.toString());
    if (params.skipCache) queryParams.append("skipCache", "true");

    const response = await this.request<PaginatedResponse<Product>>(
      `/super-search?${queryParams}`
    );

    // Normalize all products in paginated response
    if (response?.data && Array.isArray(response.data)) {
      return {
        ...response,
        data: this.normalizeProductArray(response.data),
      };
    }
    return response;
  }

  // 3. Filtered List Endpoints

  async getActiveProducts(
    params: {
      limit?: number;
      offset?: number;
      skipCache?: boolean;
    } = {}
  ): Promise<PaginatedResponse<Product>> {
    const queryParams = new URLSearchParams();
    // Ensure limit doesn't exceed API maximum of 100
    const limit = Math.min(params.limit || 50, 100);
    queryParams.append("limit", limit.toString());
    if (params.offset) queryParams.append("offset", params.offset.toString());
    if (params.skipCache) queryParams.append("skipCache", "true");

    const query = queryParams.toString();
    const response = await this.request<PaginatedResponse<Product>>(
      `/active${query ? "?" + query : ""}`
    );

    // Normalize all products in paginated response
    if (response?.data && Array.isArray(response.data)) {
      return {
        ...response,
        data: this.normalizeProductArray(response.data),
      };
    }
    return response;
  }

  async getEffectiveProducts(
    params: {
      asOfDate?: string;
      limit?: number;
      offset?: number;
      skipCache?: boolean;
    } = {}
  ): Promise<PaginatedResponse<Product>> {
    const queryParams = new URLSearchParams();
    if (params.asOfDate) queryParams.append("asOfDate", params.asOfDate);
    if (params.limit) queryParams.append("limit", params.limit.toString());
    if (params.offset) queryParams.append("offset", params.offset.toString());
    if (params.skipCache) queryParams.append("skipCache", "true");

    const query = queryParams.toString();
    return this.request<PaginatedResponse<Product>>(
      `/effective${query ? "?" + query : ""}`
    );
  }

  async getInventoryRequiredProducts(
    params: {
      limit?: number;
      offset?: number;
      skipCache?: boolean;
    } = {}
  ): Promise<PaginatedResponse<Product>> {
    const queryParams = new URLSearchParams();
    if (params.limit) queryParams.append("limit", params.limit.toString());
    if (params.offset) queryParams.append("offset", params.offset.toString());
    if (params.skipCache) queryParams.append("skipCache", "true");

    const query = queryParams.toString();
    return this.request<PaginatedResponse<Product>>(
      `/inventory-required${query ? "?" + query : ""}`
    );
  }

  async getLowInventoryProducts(
    params: {
      threshold?: number;
      limit?: number;
      offset?: number;
      skipCache?: boolean;
    } = {}
  ): Promise<PaginatedResponse<Product>> {
    const queryParams = new URLSearchParams();
    if (params.threshold)
      queryParams.append("threshold", params.threshold.toString());
    if (params.limit) queryParams.append("limit", params.limit.toString());
    if (params.offset) queryParams.append("offset", params.offset.toString());
    if (params.skipCache) queryParams.append("skipCache", "true");

    const query = queryParams.toString();
    return this.request<PaginatedResponse<Product>>(
      `/low-inventory${query ? "?" + query : ""}`
    );
  }

  async getProductsByPriceRange(params: {
    minPrice: number;
    maxPrice: number;
    currency?: string;
    limit?: number;
    offset?: number;
    skipCache?: boolean;
  }): Promise<PaginatedResponse<Product>> {
    const queryParams = new URLSearchParams();
    queryParams.append("minPrice", params.minPrice.toString());
    queryParams.append("maxPrice", params.maxPrice.toString());
    if (params.currency) queryParams.append("currency", params.currency);
    if (params.limit) queryParams.append("limit", params.limit.toString());
    if (params.offset) queryParams.append("offset", params.offset.toString());
    if (params.skipCache) queryParams.append("skipCache", "true");

    return this.request<PaginatedResponse<Product>>(
      `/price-range?${queryParams}`
    );
  }

  async getProductsByValidity(
    params: {
      days?: number;
      hours?: number;
      limit?: number;
      offset?: number;
      skipCache?: boolean;
    } = {}
  ): Promise<PaginatedResponse<Product>> {
    const queryParams = new URLSearchParams();
    if (params.days) queryParams.append("days", params.days.toString());
    if (params.hours) queryParams.append("hours", params.hours.toString());
    if (params.limit) queryParams.append("limit", params.limit.toString());
    if (params.offset) queryParams.append("offset", params.offset.toString());
    if (params.skipCache) queryParams.append("skipCache", "true");

    const query = queryParams.toString();
    return this.request<PaginatedResponse<Product>>(
      `/validity${query ? "?" + query : ""}`
    );
  }

  // 4. Specific Lookup Endpoints

  async getProductByUuid(
    uuid: string,
    skipCache: boolean = false
  ): Promise<ApiResponse<Product>> {
    const params = skipCache ? "?skipCache=true" : "";
    return this.request<ApiResponse<Product>>(`/uuid/${uuid}${params}`);
  }

  async getProductByCode(
    code: string,
    skipCache: boolean = false
  ): Promise<ApiResponse<Product>> {
    const params = skipCache ? "?skipCache=true" : "";
    return this.request<ApiResponse<Product>>(`/code/${code}${params}`);
  }

  async getProductByDaId(
    daId: string,
    skipCache: boolean = false
  ): Promise<ApiResponse<Product>> {
    const params = skipCache ? "?skipCache=true" : "";
    return this.request<ApiResponse<Product>>(`/da/${daId}${params}`);
  }

  async getProductByName(
    name: string,
    skipCache: boolean = false
  ): Promise<ApiResponse<Product>> {
    const params = skipCache ? "?skipCache=true" : "";
    return this.request<ApiResponse<Product>>(`/name/${name}${params}`);
  }

  async getProductsByCategory(
    categoryId: number,
    params: {
      limit?: number;
      offset?: number;
      skipCache?: boolean;
    } = {}
  ): Promise<PaginatedResponse<Product>> {
    const queryParams = new URLSearchParams();
    if (params.limit) queryParams.append("limit", params.limit.toString());
    if (params.offset) queryParams.append("offset", params.offset.toString());
    if (params.skipCache) queryParams.append("skipCache", "true");

    const query = queryParams.toString();
    return this.request<PaginatedResponse<Product>>(
      `/category/${categoryId}${query ? "?" + query : ""}`
    );
  }

  async batchAssignCategory(
    productIds: number[],
    categoryId: number
  ): Promise<{ success: boolean; message: string; updated_count: number }> {
    return this.request("/batch/category", {
      method: "PATCH",
      body: JSON.stringify({ product_ids: productIds, category_id: categoryId }),
    });
  }

  // 5. Product Operations Endpoints

  async checkAvailability(
    id: number,
    quantity: number = 1,
    skipCache: boolean = false
  ): Promise<ApiResponse<ProductAvailability>> {
    const params = new URLSearchParams();
    params.append("quantity", quantity.toString());
    if (skipCache) params.append("skipCache", "true");

    return this.request<ApiResponse<ProductAvailability>>(
      `/${id}/availability?${params}`
    );
  }

  async getMargin(
    id: number,
    skipCache: boolean = false
  ): Promise<ApiResponse<ProductMargin>> {
    const params = skipCache ? "?skipCache=true" : "";
    return this.request<ApiResponse<ProductMargin>>(`/${id}/margin${params}`);
  }

  async activateProduct(
    id: number,
    updatedBy?: number
  ): Promise<ApiResponse<Product>> {
    const body = updatedBy ? { updated_by: updatedBy } : {};
    return this.request<ApiResponse<Product>>(`/${id}/activate`, {
      method: "PATCH",
      body: JSON.stringify(body),
    });
  }

  async deactivateProduct(
    id: number,
    updatedBy?: number
  ): Promise<ApiResponse<Product>> {
    const body = updatedBy ? { updated_by: updatedBy } : {};
    return this.request<ApiResponse<Product>>(`/${id}/deactivate`, {
      method: "PATCH",
      body: JSON.stringify(body),
    });
  }

  async reserveInventory(
    id: number,
    quantity: number,
    updatedBy?: number
  ): Promise<ApiResponse<Product>> {
    const body = { quantity, ...(updatedBy && { updated_by: updatedBy }) };
    return this.request<ApiResponse<Product>>(`/${id}/inventory/reserve`, {
      method: "PATCH",
      body: JSON.stringify(body),
    });
  }

  async releaseInventory(
    id: number,
    quantity: number,
    updatedBy?: number
  ): Promise<ApiResponse<Product>> {
    const body = { quantity, ...(updatedBy && { updated_by: updatedBy }) };
    return this.request<ApiResponse<Product>>(`/${id}/inventory/release`, {
      method: "PATCH",
      body: JSON.stringify(body),
    });
  }

  // 6. CRUD Operations Endpoints

  async getProductById(
    id: number,
    skipCache: boolean = false
  ): Promise<ApiResponse<Product>> {
    const params = skipCache ? "?skipCache=true" : "";
    const response = await this.request<ApiResponse<Product>>(`/${id}${params}`);

    // Normalize the product
    if (response?.data) {
      return {
        ...response,
        data: this.normalizeProduct(response.data),
      };
    }
    return response;
  }

  async getAllProducts(
    params: {
      limit?: number;
      offset?: number;
      skipCache?: boolean;
    } = {}
  ): Promise<PaginatedResponse<Product>> {
    const queryParams = new URLSearchParams();
    // Ensure limit doesn't exceed API maximum of 100
    const limit = Math.min(params.limit || 50, 100);
    queryParams.append("limit", limit.toString());
    if (params.offset) queryParams.append("offset", params.offset.toString());
    if (params.skipCache) queryParams.append("skipCache", "true");

    const query = queryParams.toString();
    const response = await this.request<PaginatedResponse<Product>>(
      `/${query ? "?" + query : ""}`
    );

    // Normalize all products in paginated response
    if (response?.data && Array.isArray(response.data)) {
      return {
        ...response,
        data: this.normalizeProductArray(response.data),
      };
    }
    return response;
  }

  async createProduct(
    data: CreateProductRequest
  ): Promise<ApiResponse<Product>> {
    const response = await this.request<ApiResponse<Product>>("/", {
      method: "POST",
      body: JSON.stringify(data),
    });

    // Normalize the created product
    if (response?.data) {
      return {
        ...response,
        data: this.normalizeProduct(response.data),
      };
    }
    return response;
  }

  async updateProduct(
    id: number,
    data: UpdateProductRequest
  ): Promise<ApiResponse<Product>> {
    const response = await this.request<ApiResponse<Product>>(`/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });

    // Normalize the updated product
    if (response?.data) {
      return {
        ...response,
        data: this.normalizeProduct(response.data),
      };
    }
    return response;
  }

  async deleteProduct(
    id: number
  ): Promise<ApiResponse<{ message: string; deleted_at: string }>> {
    return this.request<ApiResponse<{ message: string; deleted_at: string }>>(
      `/${id}`,
      {
        method: "DELETE",
      }
    );
  }

  // 7. Tag Management

  async addProductTag(id: number, tag: string): Promise<ApiResponse<Product>> {
    return this.request<ApiResponse<Product>>(`/${id}/tags/add`, {
      method: "POST",
      body: JSON.stringify({ tag }),
    });
  }

  async removeProductTag(
    id: number,
    tag: string
  ): Promise<ApiResponse<Product>> {
    return this.request<ApiResponse<Product>>(`/${id}/tags/remove`, {
      method: "POST",
      body: JSON.stringify({ tag }),
    });
  }

  async setProductTags(
    id: number,
    tags: string[]
  ): Promise<ApiResponse<Product>> {
    return this.request<ApiResponse<Product>>(`/${id}/tags`, {
      method: "PUT",
      body: JSON.stringify({ tags }),
    });
  }

  async clearProductTags(id: number): Promise<ApiResponse<Product>> {
    return this.request<ApiResponse<Product>>(`/${id}/tags`, {
      method: "DELETE",
    });
  }

  async getAllProductTags(
    params: { skipCache?: boolean } = {}
  ): Promise<ApiResponse<string[]>> {
    const queryParams = new URLSearchParams();
    if (params.skipCache) queryParams.append("skipCache", "true");
    const query = queryParams.toString();
    return this.request<ApiResponse<string[]>>(
      `/tags/all${query ? `?${query}` : ""}`
    );
  }

  async getProductsByTags(params: {
    tags: string[] | string;
    match_all?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<PaginatedResponse<Product>> {
    const queryParams = new URLSearchParams();
    if (Array.isArray(params.tags)) {
      params.tags.forEach((tag) => queryParams.append("tags", tag));
    } else {
      queryParams.append("tags", params.tags);
    }
    if (params.match_all !== undefined) {
      queryParams.append("match_all", String(params.match_all));
    }
    if (params.limit) queryParams.append("limit", params.limit.toString());
    if (params.offset) queryParams.append("offset", params.offset.toString());

    return this.request<PaginatedResponse<Product>>(
      `/tags/search?${queryParams}`
    );
  }

  async getProductsByTag(params: {
    tag: string;
    limit?: number;
    offset?: number;
    skipCache?: boolean;
  }): Promise<PaginatedResponse<Product>> {
    const queryParams = new URLSearchParams();
    queryParams.append("tag", params.tag);
    if (params.limit) queryParams.append("limit", params.limit.toString());
    if (params.offset) queryParams.append("offset", params.offset.toString());
    if (params.skipCache) queryParams.append("skipCache", "true");

    return this.request<PaginatedResponse<Product>>(
      `/tag/search?${queryParams}`
    );
  }
}

export const productService = new ProductService();
