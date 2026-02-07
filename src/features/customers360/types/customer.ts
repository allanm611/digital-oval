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
  data: Customer[];
  pagination?: PaginationInfo;
  total?: number;
  message?: string;
  source?: string;
}
