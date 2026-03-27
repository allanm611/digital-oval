/**
 * Docs Authentication Service
 * Handles auth token validation for docs
 * Reuses tokens from main app (localStorage)
 */

export interface ValidateTokenResponse {
  valid: boolean;
  userId?: number;
  username?: string;
  reason?: string;
}

class DocsAuthService {
  private getApiBaseUrl(): string {
    const isLocalhost =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";

    if (isLocalhost) {
      return import.meta.env.VITE_API_BASE_URL || "http://sentra.groupngs.com:8080/api/auth";
    }
    // Production/UAT: use dynamic URL based on hostname
    return `${window.location.protocol}//${window.location.host}/api/auth`;
  }

  private get MAIN_APP_BASE_URL(): string {
    return this.getApiBaseUrl().replace("/api/auth", "");
  }

  /**
   * Get auth token from localStorage (shared with main app)
   */
  getAuthToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  /**
   * Get user from localStorage (shared with main app)
   */
  getUser() {
    const userJson = localStorage.getItem('auth_user');
    return userJson ? JSON.parse(userJson) : null;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    const token = this.getAuthToken();
    const user = this.getUser();
    return !!token && !!user;
  }

  /**
   * Validate token with backend
   */
  async validateToken(): Promise<ValidateTokenResponse> {
    const token = this.getAuthToken();

    if (!token) {
      return { valid: false, reason: 'No token found' };
    }

    try {
      const response = await fetch(`${this.MAIN_APP_BASE_URL}/auth/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ token }),
      });

      if (!response.ok) {
        // Token invalid or expired
        this.clearAuth();
        return { valid: false, reason: 'Token validation failed' };
      }

      return response.json();
    } catch (error) {
      console.error('Token validation error:', error);
      return { valid: false, reason: 'Token validation request failed' };
    }
  }

  /**
   * Clear auth data from localStorage
   */
  clearAuth(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    localStorage.removeItem('auth_permissions');
    localStorage.removeItem('session_id');
  }

  /**
   * Get user's stored permissions
   */
  getStoredPermissions(): string[] {
    const permsJson = localStorage.getItem('auth_permissions');
    return permsJson ? JSON.parse(permsJson) : [];
  }
}

export const docsAuthService = new DocsAuthService();
