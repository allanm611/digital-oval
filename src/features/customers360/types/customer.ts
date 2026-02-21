// Customer (Subscriber-360) Type Definitions

export interface CustomerAttributes {
  first_name?: string;
  last_name?: string;
  email?: string;
  age?: number;
  device_type?: string;
  premium_user?: boolean;
  [key: string]: string | number | boolean | undefined; // Allow dynamic attributes
}

export interface Customer {
  subscriber_id: string | number;
  msisdn: string;
  attributes: CustomerAttributes;
  created_at?: string;
  updated_at?: string;
  last_computed_at?: string;
}

export interface Subscriber {
  id: string;
  subscriber_id?: string | number; // User-provided subscription ID (if backend stores it)
  msisdn: string;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  country_code?: string | null;
  timezone?: string | null;
  subscriber_status?: string | null;
  subscriber_type?: string | null;
  is_active: boolean;
  is_test_account?: boolean;
  is_vip?: boolean;
  kyc_verified?: boolean;
  fraud_flag?: boolean;
  language_preference?: string | null;
  preferred_channel?: string | null;
  metadata?: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
}

// Form data interface used in customer creation and edit modals
export interface CustomerFormData {
  subscriptionId: string;
  firstName: string;
  lastName: string;
  msisdn: string;
  alternatemsisdns: string;
  email: string;
  alternateEmail: string;
  gender: string;
  dateOfBirth: string;
  languagePreference: string;
  city: string;
  physicalAddress: string;
  region: string;
  postalCode: string;
  countryCode: string;
  customerTier: string;
  preferredChannel: string;
  timezone: string;
}

export interface CreateCustomerRequest {
  subscriber_id: number;
  msisdn: string;
  attributes: CustomerAttributes;
}

export interface UpdateCustomerRequest {
  msisdn?: string;
  attributes: CustomerAttributes;
}

export interface CustomerResponse {
  success: boolean;
  data: Customer;
  message?: string;
}

export interface PaginationInfo {
  limit: number;
  offset: number;
  total: number;
  hasMore: boolean;
}

export interface CustomersListResponse {
  success: boolean;
  data: Subscriber[];
  pagination?: PaginationInfo;
  total?: number;
  message?: string;
  source?: string;
}
