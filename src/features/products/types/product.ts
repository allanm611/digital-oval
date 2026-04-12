export type ProductScope = "segment" | "open_market";

export type ProductUnit =
  | "data_mb"
  | "sms_count"
  | "airtime"
  | "onnet_minutes"
  | "offnet_minutes"
  | "allnet_minutes"
  | "roaming_data_mb"
  | "roaming_minutes"
  | "roaming_sms_count"
  | "utility"
  | "points"
  | "other";

export type ProductOfferCategory =
  | "recharge_offer"
  | "combo"
  | "data"
  | "voice"
  | "sms"
  | "utility"
  | "loyalty"
  | "other";

// Combo resource types - now supports all ProductUnit types
export type ComboResourceType = ProductUnit;

// Combo resource structure
export interface ComboResource {
  resource_type: ComboResourceType;
  unit: ProductUnit;
  unit_value: number;
  validity_hours?: number; // Individual validity in hours (if not using shared)
  price?: number; // Individual price (if not using shared_price)
  daid_account?: string; // Individual DAID account (if not using shared_daid)
}

// Combo product structure
export interface ComboProductData {
  combo_type_id?: number; // Reference to the selected combo type
  resources: ComboResource[];
  shared_validity?: boolean; // true = all resources share same validity, false = individual validity
  shared_validity_hours?: number; // Validity in hours when shared_validity is true
  shared_price?: boolean; // true = single combo price, false = individual resource pricing
  price?: number; // Price for the entire combo (when shared_price is true)
  shared_daid?: boolean; // true = all resources share same DAID account, false = each has own
  shared_daid_account?: string; // DAID account for the entire combo (when shared_daid is true)
}

export interface Product {
  id: number;
  product_uuid: string;
  product_code: string;
  da_id?: string;
  name: string;
  description?: string;
  category_id?: number;
  product_type_id?: number; // Reference to product type
  price: number;
  currency: string;
  scope?: ProductScope;
  unit?: ProductUnit;
  unit_value?: number;
  cost?: number;
  validity_days?: number;
  validity_hours?: number;
  offer_category?: ProductOfferCategory | string;
  requires_inventory: boolean;
  available_quantity?: number;
  is_active: boolean;
  effective_from?: string;
  effective_to?: string;
  created_at: string;
  updated_at: string;
  created_by?: number;
  updated_by?: number;
  metadata?: Record<string, unknown>;
  tags?: string[];
}

export interface CreateProductRequest {
  product_code: string;
  name: string;
  description?: string;
  category_id?: number;
  product_type_id?: number;
  price: number;
  currency?: string;
  scope?: ProductScope;
  unit?: ProductUnit;
  unit_value?: number;
  cost?: number;
  validity_hours?: number; // Validity period in hours (1-8760)
  offer_category?: ProductOfferCategory | string;
  requires_inventory?: boolean;
  available_quantity?: number;
  effective_from?: string;
  effective_to?: string;
  da_id?: string;
  metadata?: Record<string, unknown>;
  tags?: string[]; // Array of tags for the product
  combo_data?: ComboProductData; // For combo products
  created_by?: number;
}

export interface UpdateProductRequest {
  product_code?: string;
  name?: string;
  description?: string;
  category_id?: number;
  product_type_id?: number;
  price?: number;
  currency?: string;
  scope?: ProductScope;
  unit?: ProductUnit;
  unit_value?: number;
  cost?: number;
  validity_hours?: number; // Validity period in hours (1-8760)
  offer_category?: ProductOfferCategory | string;
  requires_inventory?: boolean;
  available_quantity?: number;
  effective_from?: string;
  effective_to?: string;
  da_id?: string;
  is_active?: boolean;
  metadata?: Record<string, unknown>;
  tags?: string[]; // Array of tags for the product
  combo_data?: ComboProductData; // For combo products
  updated_by?: number;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  source?: "cache" | "database" | "database-forced";
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    limit: number;
    offset: number;
    total: number;
    hasMore: boolean;
  };
}

export interface ProductStats {
  total_products: number | string;
  active_products: number | string;
  inactive_products?: number | string;
  products_requiring_inventory?: number | string;
  products_with_low_inventory?: number | string;
  avg_price?: number | string; // Backend returns this as string
  average_price?: number | string; // Legacy field for compatibility
  total_inventory_value?: number | string;
  products_by_currency?: Record<string, number>;
  products_by_category?: Array<{
    category_id: number;
    category_name: string;
    product_count: number;
  }>;
}

export interface CategoryPerformance {
  category_id: number;
  category_name: string;
  product_count: number;
  average_price: number;
  total_value: number;
  active_products: number;
  inactive_products: number;
}

export interface TopSellingProduct extends Product {
  total_sales: number;
  revenue: number;
  margin_amount: number;
  margin_percentage: number;
}

export interface ProductAvailability {
  available: boolean;
  available_quantity: number;
  requested_quantity: number;
  can_fulfill: boolean;
}

export interface ProductMargin {
  margin_amount: number;
  margin_percentage: number;
  price: number;
  cost: number;
  currency: string;
}
