import {
  LoginRequest,
  LoginResponse,
  RefreshTokenResponse,
  MeResponse,
  PermissionsResponse,
  PasswordChangeRequest,
  PasswordChangeResponse,
  PasswordResetRequest,
  PasswordResetResponse,
  PasswordResetCompleteRequest,
  PasswordResetCompleteResponse,
  ValidateResponse,
} from "../types/auth";
import { getAuthHeaders, API_CONFIG } from "../../../shared/services/api";
import { fetchWithAuthInterceptor } from "../../../shared/services/fetchInterceptor";

class AuthService {
  private baseUrl = `${API_CONFIG.BASE_URL}/auth`;


  // Login user
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await fetch(`${this.baseUrl}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: {
          code: "LOGIN_FAILED",
          message: errorData.message || "Invalid credentials",
        },
      };
    }

    return response.json();
  }

  // Logout user
  async logout(): Promise<void> {
    const response = await fetchWithAuthInterceptor(`${this.baseUrl}/logout`, {
      method: "POST",
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error("Failed to logout");
    }
  }

  // Logout all sessions
  async logoutAll(): Promise<void> {
    const response = await fetchWithAuthInterceptor(`${this.baseUrl}/logout-all`, {
      method: "POST",
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error("Failed to logout all sessions");
    }
  }

  // Refresh token
  async refreshToken(): Promise<RefreshTokenResponse> {
    const response = await fetchWithAuthInterceptor(`${this.baseUrl}/refresh`, {
      method: "POST",
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: {
          code: "REFRESH_FAILED",
          message: errorData.message || "Failed to refresh token",
        },
      };
    }

    return response.json();
  }

  // Get current user info
  async getMe(): Promise<MeResponse> {
    const response = await fetchWithAuthInterceptor(`${this.baseUrl}/me`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: {
          code: "GET_ME_FAILED",
          message: errorData.message || "Failed to get user info",
        },
      };
    }

    return response.json();
  }

  // Get user permissions
  async getPermissions(): Promise<PermissionsResponse> {
    const response = await fetch(`${this.baseUrl}/permissions`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: {
          code: "GET_PERMISSIONS_FAILED",
          message: errorData.message || "Failed to get permissions",
        },
      };
    }

    return response.json();
  }

  // Change password
  async changePassword(
    data: PasswordChangeRequest
  ): Promise<PasswordChangeResponse> {
    const response = await fetch(`${this.baseUrl}/password/change`, {
      method: "POST",
      headers: {
        ...getAuthHeaders(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: {
          code: "PASSWORD_CHANGE_FAILED",
          message: errorData.message || "Failed to change password",
        },
      };
    }

    return response.json();
  }

  // Request password reset
  async requestPasswordReset(
    request: PasswordResetRequest
  ): Promise<PasswordResetResponse> {
    const response = await fetch(`${this.baseUrl}/password/reset-request`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: {
          code: "PASSWORD_RESET_REQUEST_FAILED",
          message: errorData.message || "Failed to request password reset",
        },
      };
    }

    return response.json();
  }

  // Complete password reset
  async completePasswordReset(
    data: PasswordResetCompleteRequest
  ): Promise<PasswordResetCompleteResponse> {
    const response = await fetch(`${this.baseUrl}/password/reset-complete`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: {
          code: "PASSWORD_RESET_COMPLETE_FAILED",
          message: errorData.message || "Failed to complete password reset",
        },
      };
    }

    return response.json();
  }

  // Validate token
  async validateToken(token: string): Promise<ValidateResponse> {
    const response = await fetch(`${this.baseUrl}/validate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ token }),
    });

    if (!response.ok) {
      return {
        valid: false,
        reason: "Token validation failed",
      };
    }

    return response.json();
  }
}

export const authService = new AuthService();
