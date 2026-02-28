import {
  UserSession,
  CreateSessionRequest,
  CreateSessionResponse,
  EndSessionRequest,
  EndSessionResponse,
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
    data: CreateSessionRequest,
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

  // Get session by ID
  async getSessionById(sessionId: number): Promise<UserSession | null> {
    const response = await fetch(`${this.baseUrl}/${sessionId}`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.data || null;
  }

  // Get all sessions (admin)
  async getAllSessions(
    params?: SessionQueryParams,
  ): Promise<PaginatedSessions> {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.offset) queryParams.append("offset", params.offset.toString());
    if (params?.skipCache) queryParams.append("skipCache", "true");

    const url = `${this.baseUrl}${
      queryParams.toString() ? "?" + queryParams.toString() : ""
    }`;

    const response = await fetch(url, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      return {
        success: false,
        data: [],
      };
    }

    return response.json();
  }

  // Get all active sessions for a user
  async getActiveSessions(
    userId: number,
    params?: SessionQueryParams,
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
      return {
        success: false,
        data: [],
      };
    }

    return response.json();
  }

  // Get all sessions for a user (active and inactive)
  async getAllUserSessions(
    userId: number,
    params?: SessionQueryParams,
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
      return {
        success: false,
        data: [],
      };
    }

    return response.json();
  }

  // Count active sessions for a user
  async countActiveSessionsByUser(userId: number): Promise<number> {
    const response = await fetch(`${this.baseUrl}/user/${userId}/count`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      return 0;
    }

    const data = await response.json();
    return data.data?.count || 0;
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

  // End all other sessions except current
  async endOtherSessions(
    userId: number,
    currentSessionId: number,
  ): Promise<EndAllSessionsResponse> {
    const response = await fetch(
      `${this.baseUrl}/user/${userId}/end-others/${currentSessionId}`,
      {
        method: "PUT",
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      },
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        message: errorData.message || "Failed to end other sessions",
      };
    }

    return response.json();
  }

  // End a specific session
  async endSession(
    sessionId: number,
    data?: EndSessionRequest,
  ): Promise<EndSessionResponse> {
    const response = await fetch(`${this.baseUrl}/${sessionId}/end`, {
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

  // Validate session
  async validateSession(sessionId: number): Promise<boolean> {
    const response = await fetch(`${this.baseUrl}/${sessionId}/validate`, {
      headers: getAuthHeaders(),
    });

    return response.ok;
  }

  // Update session activity
  async updateSessionActivity(sessionId: number): Promise<boolean> {
    const response = await fetch(`${this.baseUrl}/${sessionId}/activity`, {
      method: "PUT",
      headers: {
        ...getAuthHeaders(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    });

    return response.ok;
  }

  // Verify MFA for a session
  async verifyMFA(
    sessionId: number,
    data: VerifyMFARequest,
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

  // Mark session as suspicious
  async markSessionSuspicious(sessionId: number): Promise<boolean> {
    const response = await fetch(
      `${this.baseUrl}/${sessionId}/mark-suspicious`,
      {
        method: "PUT",
        headers: getAuthHeaders(),
      },
    );

    return response.ok;
  }

  // Clear suspicious flag
  async clearSessionSuspicious(sessionId: number): Promise<boolean> {
    const response = await fetch(
      `${this.baseUrl}/${sessionId}/clear-suspicious`,
      {
        method: "PUT",
        headers: getAuthHeaders(),
      },
    );

    return response.ok;
  }

  // Update session risk score
  async updateSessionRiskScore(
    sessionId: number,
    riskScore: number,
  ): Promise<boolean> {
    const response = await fetch(`${this.baseUrl}/${sessionId}/risk-score`, {
      method: "PUT",
      headers: {
        ...getAuthHeaders(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ risk_score: riskScore }),
    });

    return response.ok;
  }

  // Update session metadata
  async updateSessionMetadata(
    sessionId: number,
    metadata: Record<string, any>,
  ): Promise<boolean> {
    const response = await fetch(`${this.baseUrl}/${sessionId}/metadata`, {
      method: "PUT",
      headers: {
        ...getAuthHeaders(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(metadata),
    });

    return response.ok;
  }

  // Search sessions
  async searchSessions(query: string, params?: SessionQueryParams) {
    const queryParams = new URLSearchParams();
    queryParams.append("q", query);
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.offset) queryParams.append("offset", params.offset.toString());

    const response = await fetch(
      `${this.baseUrl}/search?${queryParams.toString()}`,
      { headers: getAuthHeaders() },
    );

    if (!response.ok) return null;
    return response.json();
  }

  // Get suspicious sessions
  async getSuspiciousSessions(
    params?: SessionQueryParams,
  ): Promise<PaginatedSessions> {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.offset) queryParams.append("offset", params.offset.toString());

    const response = await fetch(
      `${this.baseUrl}/suspicious?${queryParams.toString()}`,
      { headers: getAuthHeaders() },
    );

    if (!response.ok) return { success: false, data: [] };
    return response.json();
  }

  // Get high-risk sessions
  async getHighRiskSessions(
    params?: SessionQueryParams,
  ): Promise<PaginatedSessions> {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.offset) queryParams.append("offset", params.offset.toString());

    const response = await fetch(
      `${this.baseUrl}/high-risk?${queryParams.toString()}`,
      { headers: getAuthHeaders() },
    );

    if (!response.ok) return { success: false, data: [] };
    return response.json();
  }

  // Get expired sessions
  async getExpiredSessions(
    params?: SessionQueryParams,
  ): Promise<PaginatedSessions> {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.offset) queryParams.append("offset", params.offset.toString());

    const response = await fetch(
      `${this.baseUrl}/expired?${queryParams.toString()}`,
      { headers: getAuthHeaders() },
    );

    if (!response.ok) return { success: false, data: [] };
    return response.json();
  }

  // Get inactive sessions
  async getInactiveSessions(
    params?: SessionQueryParams,
  ): Promise<PaginatedSessions> {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.offset) queryParams.append("offset", params.offset.toString());

    const response = await fetch(
      `${this.baseUrl}/inactive?${queryParams.toString()}`,
      { headers: getAuthHeaders() },
    );

    if (!response.ok) return { success: false, data: [] };
    return response.json();
  }

  // Get unverified MFA sessions
  async getUnverifiedMfaSessions(
    params?: SessionQueryParams,
  ): Promise<PaginatedSessions> {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.offset) queryParams.append("offset", params.offset.toString());

    const response = await fetch(
      `${this.baseUrl}/unverified-mfa?${queryParams.toString()}`,
      { headers: getAuthHeaders() },
    );

    if (!response.ok) return { success: false, data: [] };
    return response.json();
  }

  // Get recent sessions
  async getRecentSessions(
    params?: SessionQueryParams,
  ): Promise<PaginatedSessions> {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.offset) queryParams.append("offset", params.offset.toString());

    const response = await fetch(
      `${this.baseUrl}/recent?${queryParams.toString()}`,
      { headers: getAuthHeaders() },
    );

    if (!response.ok) return { success: false, data: [] };
    return response.json();
  }

  // Get session by token hash
  async getSessionByToken(tokenHash: string): Promise<UserSession | null> {
    const response = await fetch(`${this.baseUrl}/token/${tokenHash}`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) return null;
    const data = await response.json();
    return data.data || null;
  }

  // Get sessions by type
  async getSessionsByType(
    sessionType: string,
    params?: SessionQueryParams,
  ): Promise<PaginatedSessions> {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.offset) queryParams.append("offset", params.offset.toString());

    const response = await fetch(
      `${this.baseUrl}/type/${sessionType}?${queryParams.toString()}`,
      { headers: getAuthHeaders() },
    );

    if (!response.ok) return { success: false, data: [] };
    return response.json();
  }

  // Get sessions by IP address
  async getSessionsByIpAddress(
    ipAddress: string,
    params?: SessionQueryParams,
  ): Promise<PaginatedSessions> {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.offset) queryParams.append("offset", params.offset.toString());

    const response = await fetch(
      `${this.baseUrl}/ip/${ipAddress}?${queryParams.toString()}`,
      { headers: getAuthHeaders() },
    );

    if (!response.ok) return { success: false, data: [] };
    return response.json();
  }

  // Get active sessions count
  async getActiveSessionsCount(): Promise<number> {
    const response = await fetch(`${this.baseUrl}/stats/active-count`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) return 0;
    const data = await response.json();
    return data.data?.count || 0;
  }

  // Get count by session type
  async getCountBySessionType(): Promise<Record<string, number>> {
    const response = await fetch(`${this.baseUrl}/stats/by-session-type`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) return {};
    const data = await response.json();
    return data.data || {};
  }

  // Get count by device type
  async getCountByDeviceType(): Promise<Record<string, number>> {
    const response = await fetch(`${this.baseUrl}/stats/by-device-type`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) return {};
    const data = await response.json();
    return data.data || {};
  }

  // Get sessions by country
  async getSessionsByCountry(): Promise<Record<string, number>> {
    const response = await fetch(`${this.baseUrl}/stats/by-country`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) return {};
    const data = await response.json();
    return data.data || {};
  }

  // Get users with most sessions
  async getUsersWithMostSessions(limit?: number) {
    const queryParams = new URLSearchParams();
    if (limit) queryParams.append("limit", limit.toString());

    const response = await fetch(
      `${this.baseUrl}/stats/top-users?${queryParams.toString()}`,
      { headers: getAuthHeaders() },
    );

    if (!response.ok) return [];
    const data = await response.json();
    return data.data || [];
  }

  // Get suspicious session stats
  async getSuspiciousSessionStats(): Promise<SessionStats> {
    const response = await fetch(`${this.baseUrl}/stats/suspicious`, {
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

  // Get average session duration
  async getAverageSessionDuration(): Promise<number> {
    const response = await fetch(`${this.baseUrl}/stats/avg-duration`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) return 0;
    const data = await response.json();
    return data.data?.duration || 0;
  }

  // Auto expire sessions
  async autoExpireSessions(): Promise<{ count: number }> {
    const response = await fetch(
      `${this.baseUrl}/maintenance/expire-sessions`,
      {
        method: "POST",
        headers: getAuthHeaders(),
      },
    );

    if (!response.ok) return { count: 0 };
    const data = await response.json();
    return data.data || { count: 0 };
  }

  // Auto expire inactive sessions
  async autoExpireInactiveSessions(): Promise<{ count: number }> {
    const response = await fetch(
      `${this.baseUrl}/maintenance/expire-inactive`,
      {
        method: "POST",
        headers: getAuthHeaders(),
      },
    );

    if (!response.ok) return { count: 0 };
    const data = await response.json();
    return data.data || { count: 0 };
  }

  // End suspicious sessions
  async endSuspiciousSessions(): Promise<{ count: number }> {
    const response = await fetch(`${this.baseUrl}/maintenance/end-suspicious`, {
      method: "POST",
      headers: getAuthHeaders(),
    });

    if (!response.ok) return { count: 0 };
    const data = await response.json();
    return data.data || { count: 0 };
  }

  // Delete old sessions
  async deleteOldSessions(olderThanDays?: number): Promise<{ count: number }> {
    const queryParams = new URLSearchParams();
    if (olderThanDays) queryParams.append("days", olderThanDays.toString());

    const response = await fetch(
      `${this.baseUrl}/maintenance/cleanup?${queryParams.toString()}`,
      {
        method: "DELETE",
        headers: getAuthHeaders(),
      },
    );

    if (!response.ok) return { count: 0 };
    const data = await response.json();
    return data.data || { count: 0 };
  }
}

export const sessionService = new SessionService();
