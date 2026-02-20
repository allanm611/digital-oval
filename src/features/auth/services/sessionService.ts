import {
  UserSession,
  CreateSessionRequest,
  CreateSessionResponse,
  EndSessionRequest,
  EndSessionResponse,
  EndAllSessionsRequest,
  EndAllSessionsResponse,
  VerifyMFARequest,
  VerifyMFAResponse,
  SessionStats,
  PaginatedSessions,
} from "../types/auth";
import { getAuthHeaders, API_CONFIG } from "../../../shared/services/api";

interface SessionQueryParams {
  limit?: number;
  offset?: number;
  skipCache?: boolean;
}

class SessionService {
  private baseUrl = `${API_CONFIG.BASE_URL}/user-sessions`;

  // Create a new session
  async createSession(
    data: CreateSessionRequest
  ): Promise<CreateSessionResponse> {
    const response = await fetch(`${this.baseUrl}`, {
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
          code: "CREATE_SESSION_FAILED",
          message: errorData.message || "Failed to create session",
        },
      };
    }

    return response.json();
  }

  // Get session by token hash
  async getSessionByToken(tokenHash: string): Promise<UserSession | null> {
    const response = await fetch(`${this.baseUrl}/token/${tokenHash}`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.data || null;
  }

  // Get all active sessions for a user
  async getActiveSessions(
    userId: number,
    params?: SessionQueryParams
  ): Promise<PaginatedSessions> {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.offset) queryParams.append("offset", params.offset.toString());
    if (params?.skipCache) queryParams.append("skipCache", "true");

    const url = `${this.baseUrl}/user/${userId}/active${
      queryParams.toString() ? "?" + queryParams.toString() : ""
    }`;

    const response = await fetch(url, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        data: [],
        pagination: {
          limit: params?.limit || 10,
          offset: params?.offset || 0,
          total: 0,
          hasMore: false,
        },
      };
    }

    return response.json();
  }

  // Get all sessions for a user (active and inactive)
  async getAllSessions(
    userId: number,
    params?: SessionQueryParams
  ): Promise<PaginatedSessions> {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.offset) queryParams.append("offset", params.offset.toString());
    if (params?.skipCache) queryParams.append("skipCache", "true");

    const url = `${this.baseUrl}/user/${userId}/all${
      queryParams.toString() ? "?" + queryParams.toString() : ""
    }`;

    const response = await fetch(url, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        data: [],
        pagination: {
          limit: params?.limit || 10,
          offset: params?.offset || 0,
          total: 0,
          hasMore: false,
        },
      };
    }

    return response.json();
  }

  // End a specific session
  async endSession(
    sessionId: number,
    data?: EndSessionRequest
  ): Promise<EndSessionResponse> {
    const response = await fetch(`${this.baseUrl}/end/${sessionId}`, {
      method: "PUT",
      headers: {
        ...getAuthHeaders(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data || {}),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        message: errorData.message || "Failed to end session",
      };
    }

    return response.json();
  }

  // End all sessions for a user
  async endAllSessions(userId: number): Promise<EndAllSessionsResponse> {
    const response = await fetch(`${this.baseUrl}/user/${userId}/end-all`, {
      method: "PUT",
      headers: {
        ...getAuthHeaders(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        message: errorData.message || "Failed to end all sessions",
      };
    }

    return response.json();
  }

  // Verify MFA for a session
  async verifyMFA(
    sessionId: number,
    data: VerifyMFARequest
  ): Promise<VerifyMFAResponse> {
    const response = await fetch(`${this.baseUrl}/${sessionId}/verify-mfa`, {
      method: "PUT",
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
        message: errorData.message || "Failed to verify MFA",
        error: {
          code: "MFA_VERIFICATION_FAILED",
          message: errorData.message || "MFA verification failed",
        },
      };
    }

    return response.json();
  }

  // Get session statistics
  async getSessionStats(): Promise<SessionStats> {
    const response = await fetch(`${this.baseUrl}/stats`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      return {
        active_count: 0,
        by_session_type: {},
        by_device_type: {},
        suspicious_count: 0,
      };
    }

    const data = await response.json();
    return data.data || {};
  }

  // Get session stats by type
  async getSessionStatsByType(): Promise<Record<string, number>> {
    const response = await fetch(`${this.baseUrl}/stats/by-type`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      return {};
    }

    const data = await response.json();
    return data.data || {};
  }

  // Get session stats by device
  async getSessionStatsByDevice(): Promise<Record<string, number>> {
    const response = await fetch(`${this.baseUrl}/stats/by-device`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      return {};
    }

    const data = await response.json();
    return data.data || {};
  }

  // Get suspicious session count
  async getSuspiciousSessionCount(): Promise<number> {
    const response = await fetch(`${this.baseUrl}/stats/suspicious`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      return 0;
    }

    const data = await response.json();
    return data.data?.count || 0;
  }
}

export const sessionService = new SessionService();
