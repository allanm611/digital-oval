// Account Request Types
export type AccountRequestType = {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  employee_id?: string;
  department?: string;
  role_id?: number;
  status: "pending" | "submitted" | "approved" | "rejected" | "cancelled";
  approver_id?: number;
  submitted_at?: string;
  approved_at?: string;
  rejected_at?: string;
  rejection_reason?: string;
  consents?: Record<string, boolean>;
  created_at: string;
  updated_at: string;
  created_by?: number;
};

// API Response Types
export type ApiSuccessResponse<T> = {
  success: true;
  message?: string;
  data: T;
  meta?: {
    total?: number;
    page?: number;
    pageSize?: number;
    totalPages?: number;
    isCachedResponse?: boolean;
    cacheDurationSec?: number;
  };
};

// Request Types
export type CreatedBySource =
  | "online_portal"
  | "print_form"
  | "hr_system"
  | "api_integration"
  | "admin_portal"
  | "bulk_import";

export type CreateAccountRequestRequest = {
  email_address: string;
  first_name: string;
  last_name: string;
  business_justification: string;
  created_by_source?: CreatedBySource;
  employee_id?: string;
  department?: string;
  role_id?: number;
  requested_by?: number;
};

export type RecordConsentsRequest = {
  consents: Record<string, boolean>;
};

export type SubmitAccountRequestRequest = {
  notes?: string;
};

export type AssignApproverRequest = {
  approver_id: number;
};

export type ApproveAccountRequestRequest = {
  notes?: string;
  create_user_account?: boolean;
};

export type RejectAccountRequestRequest = {
  reason: string;
  notify_user?: boolean;
};

export type CreateDirectAccountRequest = {
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  password: string;
  employee_id?: string;
  department?: string;
  role_id?: number;
  data_access_level?: string;
  skip_approval?: boolean;
};

export type HashPasswordRequest = {
  password: string;
};
