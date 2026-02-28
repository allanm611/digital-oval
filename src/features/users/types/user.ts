// ==================== CORE USER TYPE ====================
export type UserType = {
  id: number;
  uuid?: string;
  username: string;
  email_address: string;
  email?: string; // Legacy alias
  first_name: string;
  last_name: string;
  middle_name?: string | null;
  preferred_name?: string | null;
  display_name?: string | null;
  phone_number?: string | null;
  employee_id?: string | null;
  department?: string | null;
  job_title?: string | null;
  manager_id?: number | null;
  photo_url?: string | null;
  password_hash?: string;
  password_algorithm?: string;
  primary_role_id?: number | null;
  role_id?: number; // Legacy alias
  role_name?: string;
  data_access_level?:
    | "public"
    | "internal"
    | "confidential"
    | "restricted"
    | string;
  can_access_pii?: boolean;
  pii_access?: boolean; // Legacy alias
  timezone?: string;
  language_preference?: string;
  access_expires_at?: string | null;
  ip_whitelist?: string[] | null;
  status?: "active" | "inactive" | "suspended" | "locked";
  is_active?: boolean;
  mfa_enabled?: boolean;
  created_at: string;
  updated_at: string;
  created_by?: number | null;
  updated_by?: number | null;
  last_login?: string | null;
  password_expires_at?: string | null;
  preferences?: Record<string, unknown> | null;
};

// ==================== API RESPONSE TYPES ====================
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
    [key: string]: unknown;
  };
};

export type ApiErrorResponse = {
  success: false;
  error: string;
  message: string;
  details?: string;
};

export type PaginatedResponse<T> = {
  success: true;
  data: T[];
  meta: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
    sortBy?: string;
    sortDirection?: "ASC" | "DESC";
    isCachedResponse?: boolean;
    cacheDurationSec?: number;
    [key: string]: unknown;
  };
};

// Legacy pagination format (for backward compatibility)
export type LegacyPaginatedResponse<T> = {
  success: true;
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  meta?: {
    isCachedResponse?: boolean;
    cacheDurationSec?: number;
  };
};

// Current pagination format with limit/offset
export type PaginationResponse<T> = {
  success: true;
  data: T[];
  pagination: {
    limit: number;
    offset: number;
    total: number;
    hasMore?: boolean;
  };
  source?: string;
};

// ==================== AUTHENTICATION TYPES ====================
export type LoginRequest = {
  email: string;
  password: string;
};

export type LoginResponse =
  | {
      success: true;
      user: {
        id: number;
        uuid: string;
        username: string;
        email: string;
        first_name: string;
        last_name: string;
        display_name: string | null;
      };
      session: {
        id: string;
        token: string;
        expires_at: string;
      };
    }
  | ApiErrorResponse;

export type PasswordResetRequestRequest = {
  email: string;
};

export type PasswordResetRequestResponse =
  | {
      success: true;
      message: string;
      token?: string; // For testing only
    }
  | ApiErrorResponse;

export type PasswordResetCompleteRequest = {
  token: string;
  newPassword: string;
};

export type PasswordResetCompleteResponse =
  | {
      success: true;
      message: string;
    }
  | ApiErrorResponse;

export type LogoutResponse = {
  success: true;
  message: string;
};

export type LogoutAllResponse = {
  success: true;
  message: string;
  sessionsEnded: number;
};

export type RefreshTokenResponse = {
  success: true;
  session: {
    token: string;
    expiresAt: string;
  };
};

export type MeResponse = {
  success: true;
  user: {
    userId: number;
    username: string;
    sessionId: string;
  };
};

export type PermissionsResponse = {
  success: true;
  permissions: string[];
};

export type PasswordChangeRequest = {
  oldPassword: string;
  newPassword: string;
};

export type PasswordChangeResponse =
  | {
      success: true;
      message: string;
    }
  | ApiErrorResponse;

export type ValidateTokenResponse = {
  success: true;
  valid: boolean;
  user?: {
    userId: number;
    username: string;
  };
};

// ==================== USER CRUD REQUEST TYPES ====================
export type CreateUserRequest = {
  username: string;
  first_name: string;
  last_name: string;
  middle_name?: string | null;
  preferred_name?: string | null;
  email_address: string;
  phone_number?: string | null;
  employee_id?: string | null;
  department?: string | null;
  job_title?: string | null;
  manager_id?: number | null;
  password_hash: string;
  password_algorithm?: string;
  primary_role_id?: number | null;
  data_access_level?: "public" | "internal" | "confidential" | "restricted";
  can_access_pii?: boolean;
  timezone?: string;
  language_preference?: string;
  access_expires_at?: string | null;
  ip_whitelist?: string[] | null;
  created_by?: number | null;
};

export type UpdateUserRequest = {
  first_name?: string;
  last_name?: string;
  middle_name?: string | null;
  preferred_name?: string | null;
  phone_number?: string | null;
  department?: string | null;
  job_title?: string | null;
  manager_id?: number | null;
  timezone?: string;
  language_preference?: string;
  preferences?: Record<string, unknown> | null;
  updated_by?: number | null;
};

export type ActivateUserRequest = {
  updated_by?: number | null;
  reason?: string;
  notify_user?: boolean;
};

export type DeactivateUserRequest = {
  updated_by?: number | null;
  reason?: string;
  notify_user?: boolean;
};

export type SuspendUserRequest = {
  updated_by?: number | null;
  reason?: string;
};

export type UnsuspendUserRequest = {
  updated_by?: number | null;
  reason?: string;
};

export type SearchUsersQuery = {
  q?: string;
  page?: number;
  pageSize?: number;
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortDirection?: "ASC" | "DESC";
  status?: string;
  department?: string;
  role_id?: number;
  skipCache?: boolean;
};

export type AdvancedSearchUsersQuery = {
  id?: number;
  uuid?: string;
  username?: string;
  email?: string;
  email_address?: string;
  first_name?: string;
  last_name?: string;
  employee_id?: string;
  department?: string;
  status?: string;
  role_id?: number;
  primary_role_id?: number;
  manager_id?: number;
  mfa_enabled?: boolean;
  pii_access?: boolean;
  can_access_pii?: boolean;
  created_at_from?: string;
  created_at_to?: string;
  last_login_from?: string;
  last_login_to?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortDirection?: "ASC" | "DESC";
  skipCache?: boolean;
};

export type UserReportsQuery = {
  department?: string;
  role_id?: number;
  primary_role_id?: number;
  status?: string;
  date_from?: string;
  date_to?: string;
  skipCache?: boolean;
};

export type BatchDeactivateRequest = {
  user_ids: number[];
  reason?: string;
};

export type BatchUpdateDepartmentRequest = {
  user_ids: number[];
  department: string;
};

export type ValidatePasswordResetTokenRequest = {
  token: string;
  email?: string;
};

export type Permission = {
  id: number;
  name: string;
  code: string;
  description: string | null;
  resource_id: number | null;
};

export type UserPermissionsResponse = {
  success: true;
  data: {
    permissions: Permission[];
    roles: Array<{
      id: number;
      name: string;
      code: string;
      [key: string]: unknown;
    }>;
  };
  source?: string;
};

export type UserPermissionsCheckResponse = {
  success: true;
  user_id: number;
  permission_code: string;
  has_permission: boolean;
};

export type UserPermissionsSummaryResponse = {
  success: true;
  data: {
    totalPermissions: number;
    sensitivePermissions: number;
    mfaRequiredPermissions: number;
    roles: number;
    permissionsByAction: {
      admin?: number;
      create?: number;
      delete?: number;
      execute?: number;
      read?: number;
      update?: number;
      [key: string]: number | undefined;
    };
  };
  source?: string;
};

export type ChangeUserPasswordRequest = {
  new_password: string;
  force_change_on_login?: boolean;
  notify_user?: boolean;
};

export type EnableMFARequest = {
  method?: "totp" | "sms" | "email";
  phone_number?: string;
};

export type AssignRoleRequest = {
  role_id: number;
  notify_user?: boolean;
};

export type UpdateDataAccessLevelRequest = {
  data_access_level: string;
  reason?: string;
};

export type GrantPIIAccessRequest = {
  reason?: string;
  expires_at?: string;
};

// ==================== ACCOUNT REQUEST TYPES ====================
export type AccountRequestCreate = {
  first_name: string;
  last_name: string;
  middle_name?: string;
  preferred_name?: string;
  email_address: string;
  business_justification: string;
  phone_number?: string;
  mobile_number?: string;
  employee_id?: string;
  department?: string;
  job_title?: string;
  manager_email?: string;
  cost_center?: string;
  office_location?: string;
  requested_role_id?: number;
  requested_permissions?: Record<string, unknown>;
  access_duration_days?: number;
  temporary_access_end_date?: string;
  created_by_source:
    | "online_portal"
    | "print_form"
    | "hr_system"
    | "api_integration"
    | "admin_portal"
    | "bulk_import";
  submitted_from_ip?: string;
  user_agent?: string;
  metadata?: Record<string, unknown>;
  tags?: string[];
  consents?: Record<string, unknown>;
  termsVersion?: string;
};

export type AccountRequestConsents = {
  consents: Record<string, unknown>;
  termsVersion?: string;
};

export type AccountRequestSubmit = {
  // Optional fields for submission
  [key: string]: unknown;
};

export type AccountRequestAssignApprover = {
  approver_id: number;
  approval_level?: number;
};

export type AccountRequestApprove = {
  nextApproverId?: number;
  reason?: string;
};

export type AccountRequestReject = {
  reason: string;
};

export type AccountRequestResponse = {
  success: true;
  requestId?: number;
  needsMoreApprovals?: boolean;
  message?: string;
  data?: {
    id: number;
    status: string;
    [key: string]: unknown;
  };
};

export type AccountCreateDirect = {
  username: string;
  first_name: string;
  last_name: string;
  email_address: string;
  generatePassword?: boolean;
  password?: string;
  middle_name?: string | null;
  preferred_name?: string | null;
  phone_number?: string | null;
  employee_id?: string | null;
  department?: string | null;
  job_title?: string | null;
  manager_id?: number | null;
  primary_role_id?: number | null;
  data_access_level?: "public" | "internal" | "confidential" | "restricted";
  can_access_pii?: boolean;
  timezone?: string;
  language_preference?: string;
  [key: string]: unknown;
};

export type AccountCreateDirectResponse = {
  success: true;
  user: UserType;
  password?: string;
};

// ==================== SESSION TYPES ====================
export type SessionType = {
  id: string;
  user_id: number;
  token: string;
  token_hash: string;
  expires_at: string;
  created_at: string;
  last_activity: string;
  ip_address?: string;
  user_agent?: string;
  device_type?: string;
  session_type?: string;
  is_active?: boolean;
  risk_score?: number;
  is_suspicious?: boolean;
  metadata?: Record<string, unknown>;
};

export type SessionSearchQuery = {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortDirection?: "ASC" | "DESC";
  user_id?: number;
  session_type?: string;
  device_type?: string;
  is_active?: boolean;
  skipCache?: boolean;
};

export type EndAllSessionsResponse = {
  success: true;
  message: string;
  sessionsEnded?: number;
};

// ==================== ROLE TYPES ====================
export type RoleType = {
  id: number;
  name: string;
  code?: string;
  description?: string | null;
  [key: string]: unknown;
};

export type RoleListResponse = {
  success: true;
  data: RoleType[];
  meta?: {
    total?: number;
    page?: number;
    pageSize?: number;
    totalPages?: number;
    [key: string]: unknown;
  };
};

// ==================== ANALYTICS TYPES ====================
export type ChartTooltipPayload = {
  color?: string;
  name?: string;
  value?: number | string;
};

export type AccountRequestListItem = {
  requestId: number;
  first_name: string;
  last_name: string;
  email_address?: string;
  email?: string;
  department?: string;
  created_at?: string;
  status?: string;
  rejection_reason?: string;
};
