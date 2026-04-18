// Available offer statuses
export enum OfferStatusEnum {
  DRAFT = "draft",
  PENDING_APPROVAL = "pending_approval",
  APPROVED = "approved",
  ACTIVE = "active",
  EXPIRED = "expired",
  PAUSED = "paused",
  ARCHIVED = "archived",
  REJECTED = "rejected",
}

// Available offer types
export enum OfferTypeEnum {
  DATA = "data",
  VOICE = "voice",
  SMS = "sms",
  COMBO = "combo",
  VOUCHER = "voucher",
  LOYALTY = "loyalty",
  DISCOUNT = "discount",
  BUNDLE = "bundle",
  BONUS = "bonus",
  OTHER = "other",
}

// Main offer data structure
export interface Offer {
  id: number;
  name: string;
  code: string;
  description?: string;
  offer_type: OfferTypeEnum;
  offer_type_id?: number; // Backend field - numeric ID of offer type
  offer_type_label?: string; // Backend field - string label of offer type
  category_id?: number;
  communication_channel_id?: number; // Communication channel for the offer
  sms_route_id?: number; // SMS route ID (only used when channel is SMS)
  primary_product_id?: number;
  discount_percentage?: number;
  discount_amount?: number;
  bonus_value?: number;
  eligibility_rules?: object;
  min_spend?: number;
  max_usage_per_customer: number;
  valid_from?: string;
  product_ids?: number[]; // Array of product IDs linked to the offer
  valid_to?: string;
  is_reusable: boolean;
  supports_multi_language: boolean;
  metadata?: object;
  tags?: string[];
  status: OfferStatusEnum;
  lifecycle_status?: string; // Additional status field from backend
  approval_status?: string; // Approval status field from backend
  created_at: string;
  updated_at: string;
  created_by?: number;
  updated_by?: number;
}

// creating a new offer
export interface CreateOfferRequest {
  name: string;
  code: string;
  description?: string;
  offer_type_id?: number; // Frontend field - ID of selected offer type
  offer_type?: string; // Backend field - string value of offer type (for API response compatibility)
  category_id?: string | number;
  communication_channel_id?: number; // Communication channel for the offer
  sms_route_id?: number; // SMS route ID (only used when channel is SMS)
  primary_product_id?: number;
  discount_percentage?: number;
  discount_amount?: number;
  bonus_value?: number;
  eligibility_rules?: object;
  min_spend?: number;
  max_usage_per_customer: number;
  valid_from?: string;
  valid_to?: string;
  is_reusable?: boolean;
  supports_multi_language?: boolean;
  metadata?: object;
  tags?: string[];
  created_by?: number;
}

//  updating an existing offer
export interface UpdateOfferRequest {
  name?: string;
  code?: string;
  description?: string;
  offer_type_id?: number; // Frontend field - ID of selected offer type
  offer_type?: string; // Backend field - string value of offer type (for API response compatibility)
  category_id?: string | number;
  communication_channel_id?: number; // Communication channel for the offer
  sms_route_id?: number; // SMS route ID (only used when channel is SMS)
  primary_product_id?: number;
  discount_percentage?: number;
  discount_amount?: number;
  bonus_value?: number;
  eligibility_rules?: object;
  min_spend?: number;
  max_usage_per_customer?: number;
  valid_from?: string;
  valid_to?: string;
  is_reusable?: boolean;
  supports_multi_language?: boolean;
  metadata?: object;
  tags?: string[];
  updated_by?: number;
}

// updating offer status
export interface UpdateStatusRequest {
  status?: OfferStatusEnum;
  approval_status?: "pending" | "approved" | "rejected" | "cancelled";
  updated_by?: number;
  approved_by?: number;
  approved_at?: string;
}

// submitting offer for approval
export interface SubmitApprovalRequest {
  updated_by?: number;
}

// approving an offer
export interface ApproveOfferRequest {
  approved_by: number;
  approved_at?: string;
}

// Base response structure from backend
export interface BaseResponse<T> {
  success: boolean;
  data: T;
  source?: "cache" | "database" | "database-forced";
}

// Response structure for paginated data
export interface PaginatedResponse<T> extends BaseResponse<T[]> {
  pagination: {
    limit: number;
    offset: number;
    total: number;
    hasMore: boolean;
  };
}

// Response for single offer
export type OfferResponse = BaseResponse<Offer>;

// Response for multiple offers
export type OffersResponse = PaginatedResponse<Offer>;

// Response when creating an offer
export interface CreateOfferResponse extends BaseResponse<Offer> {
  insertId: number;
}

// Response for offer statistics
export type OfferStatsResponse = BaseResponse<{
  totalOffers: number;
  activeOffers: number;
  expiredOffers: number;
  pendingApproval: number;
  approvedOffers: number;
  rejectedOffers: number;
}>;

// Response for offer type distribution
export type TypeDistributionResponse = BaseResponse<{
  data: number;
  voice: number;
  sms: number;
  combo: number;
  voucher: number;
  loyalty: number;
  discount: number;
  bundle: number;
  bonus: number;
  other: number;
}>;

// Response for category performance metrics
export type CategoryPerformanceResponse = BaseResponse<
  Array<{
    categoryId: number;
    categoryName: string;
    offerCount: number;
    totalRevenue: number;
    conversionRate: number;
  }>
>;

// Parameters for searching offers
export interface SearchParams {
  searchTerm?: string;
  search?: string;
  limit?: number;
  offset?: number;
  page?: number;
  pageSize?: number;
  status?: OfferStatusEnum;
  categoryId?: number;
  sortBy?: string;
  sortDirection?: "ASC" | "DESC";
  skipCache?: boolean;
}

// Parameters for filtering offers
export interface FilterParams {
  limit?: number;
  offset?: number;
  skipCache?: boolean;
}

// Parameters for date range queries
export interface DateRangeParams {
  startDate: string;
  endDate: string;
  limit?: number;
  offset?: number;
  skipCache?: boolean;
}

// Offer-Product Link types - matches backend structure exactly
export interface OfferProductLink {
  id: number; // Auto-generated link ID
  offer_id: number; // Offer ID
  product_id: number; // Product ID
  is_primary: boolean; // Primary flag
  quantity: number; // Quantity (defaults to 1, must be >= 1)
  created_at: string; // ISO timestamp (auto-generated)
  updated_at?: string; // ISO timestamp (auto-generated)
  created_by?: number; // User ID
  updated_by?: number; // User ID (set on updates)
}

// Request body for linking product to offer - matches backend requirements
export interface CreateOfferProductLinkRequest {
  // Required fields
  offer_id: number; // Must be positive integer, offer must exist
  product_id: number; // Must be positive integer, product must exist
  created_by: number; // Must be positive integer (user ID)

  // Optional fields
  is_primary?: boolean; // Defaults to false. Only one primary per offer allowed
  quantity?: number; // Defaults to 1, must be >= 1
}

// Response from POST /offer-products/
export interface LinkProductToOfferResponse {
  success: boolean;
  data: {
    id: number; // Link ID (auto-generated)
    offer_id: number;
    product_id: number;
    is_primary: boolean;
    quantity: number;
  };
}

// Batch request structure - created_by is at root level, NOT in each link
export interface BatchOfferProductLinkRequest {
  links: Array<{
    offer_id: number; // Required: positive integer
    product_id: number; // Required: positive integer
    is_primary?: boolean; // Optional: defaults to false
    quantity?: number; // Optional: defaults to 1, min 1
  }>; // Required: min 1, max 50 links
  created_by: number; // Required: positive integer (applies to all links)
}

export interface BatchDeleteRequest {
  ids: number[];
}

export interface OfferProductSearchParams {
  id?: number;
  offer_id?: number;
  product_id?: number;
  is_primary?: boolean;
  quantity?: number;
  created_by?: number;
  updated_by?: number;
  limit?: number;
  offset?: number;
  skipCache?: boolean;
}

// Response for offer products
export type OfferProductsResponse = BaseResponse<OfferProductLink[]>;
