// Legacy User interface - keeping for backward compatibility
export interface User {
  user_id: number;
  first_name: string;
  last_name: string;
  private_email_address: string;
  email: string;
  role: string;
  photo_url?: string;
  is_activated: boolean;
  is_deleted: boolean;
  force_password_reset: boolean;
  created_on: string;
  updated_on: string;
  created_by?: number;
  updated_by?: number;
  password_hash?: string;
  req_id?: number;
}

// Simple user info for auth responses
export interface AuthUser {
  id: number;
  uuid: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  display_name?: string;
}

// Core auth types for the 8 backend endpoints
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  user?: AuthUser;
  session?: {
    id: string;
    token: string;
    expires_at: string;
    permissions?: string[];
  };
  error?: {
    code: string;
    message: string;
  };
}

export interface LogoutRequest {
  sessionId?: string; // Optional, will logout current session if not provided
}

export interface LogoutResponse {
  success: boolean;
  message?: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  success: boolean;
  token?: string;
  expires_at?: string;
  error?: {
    code: string;
    message: string;
  };
}

export interface MeResponse {
  success: boolean;
  user?: AuthUser;
  error?: {
    code: string;
    message: string;
  };
}

export interface PermissionsResponse {
  success: boolean;
  permissions?: string[]; // Simple permission codes for now
  roles?: string[]; // Simple role names for now
  error?: {
    code: string;
    message: string;
  };
}

export interface PasswordChangeRequest {
  currentPassword: string;
  newPassword: string;
}

export interface PasswordChangeResponse {
  success: boolean;
  message?: string;
  error?: {
    code: string;
    message: string;
  };
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetResponse {
  success: boolean;
  message?: string;
  error?: {
    code: string;
    message: string;
  };
}

export interface PasswordResetCompleteRequest {
  token: string;
  email: string;
  newPassword: string;
}

export interface PasswordResetCompleteResponse {
  success: boolean;
  message?: string;
  error?: {
    code: string;
    message: string;
  };
}

export interface ValidateRequest {
  token: string;
}

export interface ValidateResponse {
  valid: boolean;
  userId?: number;
  username?: string;
  reason?: string;
}

// Session Management Types
export interface UserSession {
  id: number;
  user_id: number;
  session_type: "web" | "mobile" | "api";
  device_type?: "desktop" | "mobile" | "tablet";
  token_hash: string;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
  expires_at: string;
  last_activity_at?: string;
  is_active: boolean;
  mfa_verified?: boolean;
}

export interface CreateSessionRequest {
  user_id: number;
  session_type: "web" | "mobile" | "api";
  device_type?: "desktop" | "mobile" | "tablet";
}

export interface CreateSessionResponse {
  success: boolean;
  session?: UserSession;
  error?: {
    code: string;
    message: string;
  };
}

export interface EndSessionRequest {
  session_id: number;
}

export interface EndSessionResponse {
  success: boolean;
  message?: string;
}

export interface EndAllSessionsRequest {
  user_id: number;
}

export interface EndAllSessionsResponse {
  success: boolean;
  ended_count?: number;
  message?: string;
}

export interface VerifyMFARequest {
  mfa_code: string;
}

export interface VerifyMFAResponse {
  success: boolean;
  message?: string;
  error?: {
    code: string;
    message: string;
  };
}

export interface SessionStats {
  active_count?: number;
  by_session_type?: Record<string, number>;
  by_device_type?: Record<string, number>;
  suspicious_count?: number;
}

export interface PaginatedSessions {
  success: boolean;
  data: UserSession[];
  pagination?: {
    limit: number;
    offset: number;
    total: number;
    hasMore: boolean;
  };
}

// Legacy types - keeping for backward compatibility
export interface CreateUserRequest {
  firstName: string;
  lastName: string;
  email: string;
  company?: string;
  phone?: string;
  role: string;
  message?: string;
}

export interface CreateUserResponse {
  userId: number;
  email: string;
  to_be_redacted: {
    defaultPassword: string;
  };
  message: string;
}

export interface AccountRequest {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: "admin" | "user";
  photoUrl?: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  updatedAt: string;
}

export interface ApproveRejectRequest {
  status: "approved" | "rejected";
  role: "admin" | "user";
}

export interface ApproveAccountResponse {
  message: string;
  userId: number;
  email: string;
}

export interface RejectAccountResponse {
  message: string;
  requestId: number;
}

// Legacy password reset types - keeping for backward compatibility
export interface LegacyPasswordResetRequest {
  email: string;
}

export interface LegacyPasswordResetResponse {
  message: string;
}

export interface LegacyPasswordResetConfirmRequest {
  token: string;
  email: string;
  newPassword: string;
}

// Legacy logout types - keeping for backward compatibility
export interface LegacyLogoutRequest {
  sessionId: number;
}

export interface LegacyLogoutResponse {
  success: boolean;
}

export interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;

  // Core auth methods (updated for new backend)
  login: (email: string, password: string) => Promise<LoginResponse>;
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
  refreshToken: () => Promise<RefreshTokenResponse>;
  getMe: () => Promise<MeResponse>;
  getPermissions: () => Promise<PermissionsResponse>;
  changePassword: (
    currentPassword: string,
    newPassword: string,
  ) => Promise<PasswordChangeResponse>;
  validateToken: (token: string) => Promise<ValidateResponse>;

  // Password reset methods (updated for new backend)
  requestPasswordReset: (email: string) => Promise<PasswordResetResponse>;
  completePasswordReset: (
    token: string,
    email: string,
    newPassword: string,
  ) => Promise<PasswordResetCompleteResponse>;

  // Legacy user management methods (keeping unchanged)
  createUser: (userData: CreateUserRequest) => Promise<CreateUserResponse>;
  approveAccount: (
    requestId: number,
    role: "admin" | "user",
  ) => Promise<ApproveAccountResponse>;
  rejectAccount: (requestId: number) => Promise<RejectAccountResponse>;
}
