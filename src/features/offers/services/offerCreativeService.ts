import {
  CreateOfferCreativeRequest,
  UpdateOfferCreativeRequest,
  UpdateContentRequest,
  UpdateVariablesRequest,
  CreateVersionRequest,
  RenderCreativeRequest,
  RenderCreativeResponseType,
  SearchCreativeParams,
  SuperSearchCreativeParams,
  RollbackCreativeRequest,
  CreativeStatsResponse,
  ChannelCoverageResponse,
  OfferCreativeResponse,
  OfferCreativesResponse,
  CreativeChannel,
  BaseResponse,
} from "../types/offerCreative";
import {
  API_CONFIG,
  buildApiUrl,
  getAuthHeaders,
} from "../../../shared/services/api";

const BASE_URL = buildApiUrl(API_CONFIG.ENDPOINTS.OFFER_CREATIVES);

class OfferCreativeService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${BASE_URL}${endpoint}`;

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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let responseData: any;

    try {
      if (contentType && contentType.includes("application/json")) {
        responseData = await response.json();
      } else {
        const text = await response.text();
        responseData = text ? JSON.parse(text) : {};
      }
    } catch {
      // If parsing fails, handle based on response status
      if (!response.ok) {
        throw new Error(
          `HTTP error! status: ${response.status}, statusText: ${response.statusText}`
        );
      }
      responseData = {};
    }

    // Check if response has success: false (backend may return 200 with error)
    if (responseData && responseData.success === false) {
      if (responseData.error) {
        throw new Error(responseData.error);
      }
      if (responseData.message) {
        throw new Error(responseData.message);
      }
      if (responseData.details) {
        throw new Error(
          typeof responseData.details === "string"
            ? responseData.details
            : JSON.stringify(responseData.details)
        );
      }
      throw new Error("Operation failed");
    }

    // Handle HTTP error status codes (4xx, 5xx)
    if (!response.ok) {
      try {
        const errorData = responseData || {};

        if (errorData.error) {
          throw new Error(errorData.error);
        }
        if (errorData.message) {
          throw new Error(errorData.message);
        }
        if (errorData.details) {
          throw new Error(
            typeof errorData.details === "string"
              ? errorData.details
              : JSON.stringify(errorData.details)
          );
        }
        throw new Error(
          `HTTP error! status: ${response.status}, details: ${JSON.stringify(
            errorData
          )}`
        );
      } catch {
        throw new Error(
          `HTTP error! status: ${response.status}, statusText: ${response.statusText}`
        );
      }
    }

    return responseData;
  }

  // ============================================
  // GET ENDPOINTS (Read)
  // ============================================

  // GET /offer-creatives/stats
  async getStats(skipCache: boolean = false): Promise<CreativeStatsResponse> {
    const params = skipCache ? "?skipCache=true" : "";
    const result = await this.request<CreativeStatsResponse>(`/stats${params}`);
    return result;
  }

  // GET /offer-creatives/most-revised
  async getMostRevised(
    limit: number = 10,
    skipCache: boolean = false
  ): Promise<OfferCreativesResponse> {
    const params = new URLSearchParams();
    if (limit) params.append("limit", limit.toString());
    if (skipCache) params.append("skipCache", "true");
    const queryString = params.toString();
    const result = await this.request<OfferCreativesResponse>(
      `/most-revised${queryString ? `?${queryString}` : ""}`
    );
    return result;
  }

  // GET /offer-creatives/search
  // Backend expects: searchTerm (required), limit, offset, skipCache
  async search(params: SearchCreativeParams): Promise<OfferCreativesResponse> {
    const queryParams = new URLSearchParams();
    // Backend expects searchTerm (required), not query or q
    queryParams.append("searchTerm", params.searchTerm);
    if (params.offer_id)
      queryParams.append("offer_id", params.offer_id.toString());
    if (params.channel) queryParams.append("channel", params.channel);
    if (params.locale) queryParams.append("locale", params.locale);
    if (params.template_type_id)
      queryParams.append(
        "template_type_id",
        params.template_type_id.toString()
      );
    if (params.is_active !== undefined)
      queryParams.append("is_active", params.is_active.toString());
    if (params.limit) queryParams.append("limit", params.limit.toString());
    if (params.offset) queryParams.append("offset", params.offset.toString());
    if (params.skipCache) queryParams.append("skipCache", "true");

    const queryString = queryParams.toString();
    const result = await this.request<OfferCreativesResponse>(
      `/search${queryString ? `?${queryString}` : ""}`
    );
    return result;
  }

  // GET /offer-creatives/super-search
  async superSearch(
    params: SuperSearchCreativeParams
  ): Promise<OfferCreativesResponse> {
    const queryParams = new URLSearchParams();
    // Changed from query to searchTerm to match backend
    if (params.searchTerm) queryParams.append("searchTerm", params.searchTerm);
    if (params.offer_id)
      queryParams.append("offer_id", params.offer_id.toString());
    if (params.channel) queryParams.append("channel", params.channel);
    if (params.locale) queryParams.append("locale", params.locale);
    if (params.template_type_id)
      queryParams.append(
        "template_type_id",
        params.template_type_id.toString()
      );
    if (params.is_active !== undefined)
      queryParams.append("is_active", params.is_active.toString());
    if (params.version)
      queryParams.append("version", params.version.toString());
    if (params.created_by)
      queryParams.append("created_by", params.created_by.toString());
    if (params.updated_by)
      queryParams.append("updated_by", params.updated_by.toString());
    if (params.created_from)
      queryParams.append("created_from", params.created_from);
    if (params.created_to) queryParams.append("created_to", params.created_to);
    if (params.limit) queryParams.append("limit", params.limit.toString());
    if (params.offset) queryParams.append("offset", params.offset.toString());
    if (params.skipCache) queryParams.append("skipCache", "true");

    const queryString = queryParams.toString();
    const result = await this.request<OfferCreativesResponse>(
      `/super-search${queryString ? `?${queryString}` : ""}`
    );
    return result;
  }

  // GET /offer-creatives/template-type/:templateTypeId
  async getByTemplateType(
    templateTypeId: number,
    params?: { limit?: number; offset?: number; skipCache?: boolean }
  ): Promise<OfferCreativesResponse> {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.offset) queryParams.append("offset", params.offset.toString());
    if (params?.skipCache) queryParams.append("skipCache", "true");
    const queryString = queryParams.toString();
    const result = await this.request<OfferCreativesResponse>(
      `/template-type/${templateTypeId}${queryString ? `?${queryString}` : ""}`
    );
    return result;
  }

  // GET /offer-creatives/channel/:channel
  async getByChannel(
    channel: CreativeChannel,
    params?: { limit?: number; offset?: number; skipCache?: boolean }
  ): Promise<OfferCreativesResponse> {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.offset) queryParams.append("offset", params.offset.toString());
    if (params?.skipCache) queryParams.append("skipCache", "true");
    const queryString = queryParams.toString();
    const result = await this.request<OfferCreativesResponse>(
      `/channel/${channel}${queryString ? `?${queryString}` : ""}`
    );
    return result;
  }

  // GET /offer-creatives/locale/:locale
  async getByLocale(
    locale: string,
    params?: { limit?: number; offset?: number; skipCache?: boolean }
  ): Promise<OfferCreativesResponse> {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.offset) queryParams.append("offset", params.offset.toString());
    if (params?.skipCache) queryParams.append("skipCache", "true");
    const queryString = queryParams.toString();
    const result = await this.request<OfferCreativesResponse>(
      `/locale/${encodeURIComponent(locale)}${
        queryString ? `?${queryString}` : ""
      }`
    );
    return result;
  }

  // GET /offer-creatives/offer/:offerId/channels
  async getChannelsByOffer(
    offerId: number,
    skipCache: boolean = false
  ): Promise<BaseResponse<CreativeChannel[]>> {
    const params = skipCache ? "?skipCache=true" : "";
    const result = await this.request<BaseResponse<CreativeChannel[]>>(
      `/offer/${offerId}/channels${params}`
    );
    return result;
  }

  // GET /offer-creatives/offer/:offerId/channel-coverage
  async getChannelCoverage(
    offerId: number,
    skipCache: boolean = false
  ): Promise<ChannelCoverageResponse> {
    const params = skipCache ? "?skipCache=true" : "";
    const result = await this.request<ChannelCoverageResponse>(
      `/offer/${offerId}/channel-coverage${params}`
    );
    return result;
  }

  // GET /offer-creatives/offer/:offerId/channel/:channel/locales
  async getLocalesByOfferAndChannel(
    offerId: number,
    channel: CreativeChannel,
    skipCache: boolean = false
  ): Promise<BaseResponse<string[]>> {
    const params = skipCache ? "?skipCache=true" : "";
    const result = await this.request<BaseResponse<string[]>>(
      `/offer/${offerId}/channel/${channel}/locales${params}`
    );
    return result;
  }

  // GET /offer-creatives/offer/:offerId/channel/:channel/latest
  // Query params: locale (optional, defaults to "en"), skipCache (optional)
  async getLatestByOfferAndChannel(
    offerId: number,
    channel: CreativeChannel,
    params?: { locale?: string; skipCache?: boolean }
  ): Promise<OfferCreativeResponse> {
    const queryParams = new URLSearchParams();
    if (params?.locale) queryParams.append("locale", params.locale);
    if (params?.skipCache) queryParams.append("skipCache", "true");
    const queryString = queryParams.toString();
    const result = await this.request<OfferCreativeResponse>(
      `/offer/${offerId}/channel/${channel}/latest${
        queryString ? `?${queryString}` : ""
      }`
    );
    return result;
  }

  // GET /offer-creatives/offer/:offerId/channel/:channel/versions
  // Query params: locale (optional, defaults to "en"), limit, offset, skipCache
  async getVersionsByOfferAndChannel(
    offerId: number,
    channel: CreativeChannel,
    params?: {
      locale?: string;
      limit?: number;
      offset?: number;
      skipCache?: boolean;
    }
  ): Promise<OfferCreativesResponse> {
    const queryParams = new URLSearchParams();
    if (params?.locale) queryParams.append("locale", params.locale);
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.offset) queryParams.append("offset", params.offset.toString());
    if (params?.skipCache) queryParams.append("skipCache", "true");
    const queryString = queryParams.toString();
    const result = await this.request<OfferCreativesResponse>(
      `/offer/${offerId}/channel/${channel}/versions${
        queryString ? `?${queryString}` : ""
      }`
    );
    return result;
  }

  // GET /offer-creatives/offer/:offerId/channel/:channel
  async getByOfferAndChannel(
    offerId: number,
    channel: CreativeChannel,
    skipCache: boolean = false
  ): Promise<OfferCreativeResponse> {
    const params = skipCache ? "?skipCache=true" : "";
    const result = await this.request<OfferCreativeResponse>(
      `/offer/${offerId}/channel/${channel}${params}`
    );
    return result;
  }

  // GET /offer-creatives/offer/:offerId
  async getByOffer(
    offerId: number,
    params?: { limit?: number; offset?: number; skipCache?: boolean }
  ): Promise<OfferCreativesResponse> {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.offset) queryParams.append("offset", params.offset.toString());
    if (params?.skipCache) queryParams.append("skipCache", "true");
    const queryString = queryParams.toString();
    const result = await this.request<OfferCreativesResponse>(
      `/offer/${offerId}${queryString ? `?${queryString}` : ""}`
    );
    return result;
  }

  // GET /offer-creatives/:id/render
  // Query params: skipCache (optional)
  // Body: variableOverrides (optional object) - backend accepts body with GET (non-standard but supported)
  async render(
    id: number,
    request?: RenderCreativeRequest,
    skipCache: boolean = false
  ): Promise<RenderCreativeResponseType> {
    const queryParams = new URLSearchParams();
    if (skipCache) queryParams.append("skipCache", "true");
    const queryString = queryParams.toString();

    // Backend expects GET with body containing variableOverrides
    const options: RequestInit = {
      method: "GET",
    };

    // Add body if variableOverrides are provided
    if (request?.variableOverrides) {
      options.body = JSON.stringify({
        variableOverrides: request.variableOverrides,
      });
    }

    const result = await this.request<RenderCreativeResponseType>(
      `/${id}/render${queryString ? `?${queryString}` : ""}`,
      options
    );
    return result;
  }

  // GET /offer-creatives/:id
  async getById(
    id: number,
    skipCache: boolean = false
  ): Promise<OfferCreativeResponse> {
    const params = skipCache ? "?skipCache=true" : "";
    const result = await this.request<OfferCreativeResponse>(`/${id}${params}`);
    return result;
  }

  // ============================================
  // POST ENDPOINTS (Create)
  // ============================================

  // POST /offer-creatives/
  async create(
    request: CreateOfferCreativeRequest
  ): Promise<OfferCreativeResponse> {
    const result = await this.request<OfferCreativeResponse>(`/`, {
      method: "POST",
      body: JSON.stringify(request),
    });
    return result;
  }

  // POST /offer-creatives/offer/:offerId/channel/:channel/new-version
  async createNewVersion(
    offerId: number,
    channel: CreativeChannel,
    request: CreateVersionRequest = {}
  ): Promise<OfferCreativeResponse> {
    const result = await this.request<OfferCreativeResponse>(
      `/offer/${offerId}/channel/${channel}/new-version`,
      {
        method: "POST",
        body: JSON.stringify(request),
      }
    );
    return result;
  }

  // POST /offer-creatives/:id/clone-locale
  // Body: newLocale (required), created_by (optional)
  async cloneToLocale(
    id: number,
    request: { newLocale: string; created_by?: number }
  ): Promise<OfferCreativeResponse> {
    const result = await this.request<OfferCreativeResponse>(
      `/${id}/clone-locale`,
      {
        method: "POST",
        body: JSON.stringify({
          newLocale: request.newLocale,
          created_by: request.created_by,
        }),
      }
    );
    return result;
  }

  // POST /offer-creatives/:id/clone-channel
  // Body: newChannel (required), created_by (optional)
  async cloneToChannel(
    id: number,
    request: { newChannel: CreativeChannel; created_by?: number }
  ): Promise<OfferCreativeResponse> {
    const result = await this.request<OfferCreativeResponse>(
      `/${id}/clone-channel`,
      {
        method: "POST",
        body: JSON.stringify({
          newChannel: request.newChannel,
          created_by: request.created_by,
        }),
      }
    );
    return result;
  }

  // ============================================
  // PATCH ENDPOINTS (Update)
  // ============================================

  // PATCH /offer-creatives/:id/activate
  async activate(id: number, updated_by?: number): Promise<OfferCreativeResponse> {
    const result = await this.request<OfferCreativeResponse>(
      `/${id}/activate`,
      {
        method: "PATCH",
        body: JSON.stringify({ updated_by }),
      }
    );
    return result;
  }

  // PATCH /offer-creatives/:id/deactivate
  async deactivate(id: number, updated_by?: number): Promise<OfferCreativeResponse> {
    const result = await this.request<OfferCreativeResponse>(
      `/${id}/deactivate`,
      {
        method: "PATCH",
        body: JSON.stringify({ updated_by }),
      }
    );
    return result;
  }

  // PATCH /offer-creatives/:id/rollback
  // Body: offerId (required), channel (required), locale (required), version (required), updated_by (optional)
  async rollback(
    id: number,
    request: RollbackCreativeRequest
  ): Promise<OfferCreativeResponse> {
    const result = await this.request<OfferCreativeResponse>(
      `/${id}/rollback`,
      {
        method: "PATCH",
        body: JSON.stringify({
          offerId: request.offerId,
          channel: request.channel,
          locale: request.locale,
          version: request.version,
          updated_by: request.updated_by,
        }),
      }
    );
    return result;
  }

  // PATCH /offer-creatives/:id/content
  async updateContent(
    id: number,
    request: UpdateContentRequest
  ): Promise<OfferCreativeResponse> {
    const result = await this.request<OfferCreativeResponse>(`/${id}/content`, {
      method: "PATCH",
      body: JSON.stringify(request),
    });
    return result;
  }

  // PATCH /offer-creatives/:id/variables
  async updateVariables(
    id: number,
    request: UpdateVariablesRequest
  ): Promise<OfferCreativeResponse> {
    const result = await this.request<OfferCreativeResponse>(
      `/${id}/variables`,
      {
        method: "PATCH",
        body: JSON.stringify(request),
      }
    );
    return result;
  }

  // PATCH /offer-creatives/:id
  async update(
    id: number,
    request: UpdateOfferCreativeRequest
  ): Promise<OfferCreativeResponse> {
    const result = await this.request<OfferCreativeResponse>(`/${id}`, {
      method: "PATCH",
      body: JSON.stringify(request),
    });
    return result;
  }

  // ============================================
  // DELETE ENDPOINTS
  // ============================================

  // DELETE /offer-creatives/:id
  async delete(id: number): Promise<{ success: boolean; message: string }> {
    const result = await this.request<{ success: boolean; message: string }>(
      `/${id}`,
      {
        method: "DELETE",
      }
    );
    return result;
  }
}

export const offerCreativeService = new OfferCreativeService();
export default offerCreativeService;
