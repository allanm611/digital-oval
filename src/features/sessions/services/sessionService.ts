import { buildApiUrl, getAuthHeaders } from "../../../shared/services/api";
import {
  SessionType,
  CreateSessionRequest,
  UpdateSessionActivityRequest,
  VerifyMFARequest,
  MarkSuspiciousRequest,
  UpdateRiskScoreRequest,
  UpdateSessionMetadataRequest,
  EndSessionRequest,
  SearchSessionsQuery,
  EndUserSessionsRequest,
  EndOtherSessionsRequest,
  ExpireSessionsRequest,
  ExpireInactiveSessionsRequest,
  EndSuspiciousSessionsRequest,
  ApiSuccessResponse,
  PaginatedResponse,
  SessionStatsResponse,
} from "../types/session";

const BASE_URL = buildApiUrl("/sessions");

class SessionService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${BASE_URL}${endpoint}`;

    const response = await fetch(url, {
      headers: {
        ...getAuthHeaders(),
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      try {
        const errorData = await response.json();
        if (errorData.error) {
          throw new Error(errorData.error);
        }
        if (errorData.message) {
          throw new Error(errorData.message);
        }
        if (errorData.details) {
          throw new Error(errorData.details);
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      } catch (err) {
        if (err instanceof Error) {
          throw err;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    }

    return response.json();
  }

  private buildQueryParams(params: Record<string, unknown>): string {
    const urlParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        if (Array.isArray(value)) {
          urlParams.append(key, value.join(","));
        } else if (typeof value === "boolean") {
          urlParams.append(key, value.toString());
        } else {
          urlParams.append(key, String(value));
        }
      }
    });

    const queryString = urlParams.toString();
    return queryString ? `?${queryString}` : "";
  }

  // ==================== SEARCH & STATISTICS (8 endpoints) ====================

  /**
   * GET /sessions/search - Search sessions
   */
  async searchSessions(
    query: SearchSessionsQuery
  ): Promise<PaginatedResponse<SessionType>> {
    const queryString = this.buildQueryParams(query);
    return this.request<PaginatedResponse<SessionType>>(
      `/search${queryString}`
    );
  }

  /**
   * GET /sessions/stats/active-count - Get active sessions count
   */
  async getActiveCount(): Promise<ApiSuccessResponse<{ count: number }>> {
    return this.request<ApiSuccessResponse<{ count: number }>>(
      "/stats/active-count"
    );
  }

  /**
   * GET /sessions/stats/by-session-type - Get count by session type
   */
  async getStatsBySessionType(): Promise<SessionStatsResponse> {
    return this.request<SessionStatsResponse>("/stats/by-session-type");
  }

  /**
   * GET /sessions/stats/by-device-type - Get count by device type
   */
  async getStatsByDeviceType(): Promise<SessionStatsResponse> {
    return this.request<SessionStatsResponse>("/stats/by-device-type");
  }

  /**
   * GET /sessions/stats/by-country - Get sessions by country
   */
  async getStatsByCountry(): Promise<SessionStatsResponse> {
    return this.request<SessionStatsResponse>("/stats/by-country");
  }

  /**
   * GET /sessions/stats/top-users - Get users with most sessions
   */
  async getTopUsers(
    limit: number = 10
  ): Promise<
    ApiSuccessResponse<
      Array<{ user_id: number; username: string; session_count: number }>
    >
  > {
    const queryString = this.buildQueryParams({ limit });
    return this.request<
      ApiSuccessResponse<
        Array<{ user_id: number; username: string; session_count: number }>
      >
    >(`/stats/top-users${queryString}`);
  }

  /**
   * GET /sessions/stats/suspicious - Get suspicious session stats
   */
  async getSuspiciousStats(): Promise<
    ApiSuccessResponse<{ count: number; risk_score_avg: number }>
  > {
    return this.request<
      ApiSuccessResponse<{ count: number; risk_score_avg: number }>
    >("/stats/suspicious");
  }

  /**
   * GET /sessions/stats/avg-duration - Get average session duration
   */
  async getAverageDuration(
    period?: string
  ): Promise<
    ApiSuccessResponse<{ avg_duration_seconds: number; period: string }>
  > {
    const queryString = this.buildQueryParams({ period });
    return this.request<
      ApiSuccessResponse<{ avg_duration_seconds: number; period: string }>
    >(`/stats/avg-duration${queryString}`);
  }

  // ==================== QUERY ENDPOINTS (6 endpoints) ====================

  /**
   * GET /sessions/suspicious - Get suspicious sessions
   */
  async getSuspiciousSessions(
    query?: SearchSessionsQuery
  ): Promise<PaginatedResponse<SessionType>> {
    const queryString = this.buildQueryParams(query || {});
    return this.request<PaginatedResponse<SessionType>>(
      `/suspicious${queryString}`
    );
  }

  /**
   * GET /sessions/high-risk - Get high-risk sessions
   */
  async getHighRiskSessions(
    query?: SearchSessionsQuery
  ): Promise<PaginatedResponse<SessionType>> {
    const queryString = this.buildQueryParams(query || {});
    return this.request<PaginatedResponse<SessionType>>(
      `/high-risk${queryString}`
    );
  }

  /**
   * GET /sessions/expired - Get expired active sessions
   */
  async getExpiredSessions(
    query?: SearchSessionsQuery
  ): Promise<PaginatedResponse<SessionType>> {
    const queryString = this.buildQueryParams(query || {});
    return this.request<PaginatedResponse<SessionType>>(
      `/expired${queryString}`
    );
  }

  /**
   * GET /sessions/inactive - Get inactive sessions
   */
  async getInactiveSessions(
    query?: SearchSessionsQuery
  ): Promise<PaginatedResponse<SessionType>> {
    const queryString = this.buildQueryParams(query || {});
    return this.request<PaginatedResponse<SessionType>>(
      `/inactive${queryString}`
    );
  }

  /**
   * GET /sessions/unverified-mfa - Get unverified MFA sessions
   */
  async getUnverifiedMFASessions(
    query?: SearchSessionsQuery
  ): Promise<PaginatedResponse<SessionType>> {
    const queryString = this.buildQueryParams(query || {});
    return this.request<PaginatedResponse<SessionType>>(
      `/unverified-mfa${queryString}`
    );
  }

  /**
   * GET /sessions/recent - Get recent sessions
   */
  async getRecentSessions(
    query?: SearchSessionsQuery
  ): Promise<PaginatedResponse<SessionType>> {
    const queryString = this.buildQueryParams(query || {});
    return this.request<PaginatedResponse<SessionType>>(
      `/recent${queryString}`
    );
  }

  // ==================== LOOKUP ENDPOINTS (3 endpoints) ====================

  /**
   * GET /sessions/token/:tokenHash - Get session by token hash
   */
  async getSessionByToken(
    tokenHash: string,
    skipCache?: boolean
  ): Promise<ApiSuccessResponse<SessionType>> {
    const queryString = this.buildQueryParams({ skipCache });
    return this.request<ApiSuccessResponse<SessionType>>(
      `/token/${encodeURIComponent(tokenHash)}${queryString}`
    );
  }

  /**
   * GET /sessions/type/:sessionType - Get sessions by type
   */
  async getSessionsByType(
    sessionType: string,
    query?: SearchSessionsQuery
  ): Promise<PaginatedResponse<SessionType>> {
    const queryString = this.buildQueryParams(query || {});
    return this.request<PaginatedResponse<SessionType>>(
      `/type/${encodeURIComponent(sessionType)}${queryString}`
    );
  }

  /**
   * GET /sessions/ip/:ipAddress - Get sessions by IP address
   */
  async getSessionsByIP(
    ipAddress: string,
    query?: SearchSessionsQuery
  ): Promise<PaginatedResponse<SessionType>> {
    const queryString = this.buildQueryParams(query || {});
    return this.request<PaginatedResponse<SessionType>>(
      `/ip/${encodeURIComponent(ipAddress)}${queryString}`
    );
  }

  // ==================== USER-SPECIFIC SESSION OPERATIONS (5 endpoints) ====================

  /**
   * GET /sessions/user/:userId/active - Get active sessions for user
   */
  async getUserActiveSessions(
    userId: number
  ): Promise<ApiSuccessResponse<SessionType[]>> {
    return this.request<ApiSuccessResponse<SessionType[]>>(
      `/user/${userId}/active`
    );
  }

  /**
   * GET /sessions/user/:userId/all - Get all sessions for user
   */
  async getUserAllSessions(
    userId: number,
    query?: SearchSessionsQuery
  ): Promise<PaginatedResponse<SessionType>> {
    const queryString = this.buildQueryParams(query || {});
    return this.request<PaginatedResponse<SessionType>>(
      `/user/${userId}/all${queryString}`
    );
  }

  /**
   * GET /sessions/user/:userId/count - Count active sessions for user
   */
  async getUserSessionCount(
    userId: number
  ): Promise<ApiSuccessResponse<{ count: number }>> {
    return this.request<ApiSuccessResponse<{ count: number }>>(
      `/user/${userId}/count`
    );
  }

  /**
   * PUT /sessions/user/:userId/end-all - End all user sessions
   */
  async endAllUserSessions(
    userId: number,
    request?: EndUserSessionsRequest
  ): Promise<ApiSuccessResponse<{ ended_count: number }>> {
    return this.request<ApiSuccessResponse<{ ended_count: number }>>(
      `/user/${userId}/end-all`,
      {
        method: "PUT",
        body: request ? JSON.stringify(request) : undefined,
      }
    );
  }

  /**
   * PUT /sessions/user/:userId/end-others/:currentSessionId - End other user sessions
   */
  async endOtherUserSessions(
    userId: number,
    currentSessionId: number,
    request?: EndOtherSessionsRequest
  ): Promise<ApiSuccessResponse<{ ended_count: number }>> {
    return this.request<ApiSuccessResponse<{ ended_count: number }>>(
      `/user/${userId}/end-others/${currentSessionId}`,
      {
        method: "PUT",
        body: request ? JSON.stringify(request) : undefined,
      }
    );
  }

  // ==================== MAINTENANCE OPERATIONS (4 endpoints) ====================

  /**
   * POST /sessions/maintenance/expire-sessions - Auto expire sessions
   */
  async expireSessions(
    request?: ExpireSessionsRequest
  ): Promise<ApiSuccessResponse<{ expired_count: number }>> {
    return this.request<ApiSuccessResponse<{ expired_count: number }>>(
      "/maintenance/expire-sessions",
      {
        method: "POST",
        body: request ? JSON.stringify(request) : undefined,
      }
    );
  }

  /**
   * POST /sessions/maintenance/expire-inactive - Auto expire inactive sessions
   */
  async expireInactiveSessions(
    request?: ExpireInactiveSessionsRequest
  ): Promise<ApiSuccessResponse<{ expired_count: number }>> {
    return this.request<ApiSuccessResponse<{ expired_count: number }>>(
      "/maintenance/expire-inactive",
      {
        method: "POST",
        body: request ? JSON.stringify(request) : undefined,
      }
    );
  }

  /**
   * POST /sessions/maintenance/end-suspicious - End suspicious sessions
   */
  async endSuspiciousSessions(
    request?: EndSuspiciousSessionsRequest
  ): Promise<ApiSuccessResponse<{ ended_count: number }>> {
    return this.request<ApiSuccessResponse<{ ended_count: number }>>(
      "/maintenance/end-suspicious",
      {
        method: "POST",
        body: request ? JSON.stringify(request) : undefined,
      }
    );
  }

  /**
   * DELETE /sessions/maintenance/cleanup - Delete old sessions
   */
  async cleanupOldSessions(
    daysOld?: number
  ): Promise<ApiSuccessResponse<{ deleted_count: number }>> {
    const queryString = this.buildQueryParams({ days_old: daysOld });
    return this.request<ApiSuccessResponse<{ deleted_count: number }>>(
      `/maintenance/cleanup${queryString}`,
      {
        method: "DELETE",
      }
    );
  }

  // ==================== SESSION OPERATIONS (8 endpoints) ====================

  /**
   * GET /sessions/:id/validate - Validate session
   */
  async validateSession(
    id: number
  ): Promise<ApiSuccessResponse<{ valid: boolean; reason?: string }>> {
    return this.request<
      ApiSuccessResponse<{ valid: boolean; reason?: string }>
    >(`/${id}/validate`);
  }

  /**
   * PUT /sessions/:id/activity - Update session activity
   */
  async updateSessionActivity(
    id: number,
    request: UpdateSessionActivityRequest
  ): Promise<ApiSuccessResponse<SessionType>> {
    return this.request<ApiSuccessResponse<SessionType>>(`/${id}/activity`, {
      method: "PUT",
      body: JSON.stringify(request),
    });
  }

  /**
   * PUT /sessions/:id/verify-mfa - Verify session MFA
   */
  async verifySessionMFA(
    id: number,
    request: VerifyMFARequest
  ): Promise<ApiSuccessResponse<SessionType>> {
    return this.request<ApiSuccessResponse<SessionType>>(`/${id}/verify-mfa`, {
      method: "PUT",
      body: JSON.stringify(request),
    });
  }

  /**
   * PUT /sessions/:id/mark-suspicious - Mark session as suspicious
   */
  async markSessionSuspicious(
    id: number,
    request?: MarkSuspiciousRequest
  ): Promise<ApiSuccessResponse<SessionType>> {
    return this.request<ApiSuccessResponse<SessionType>>(
      `/${id}/mark-suspicious`,
      {
        method: "PUT",
        body: request ? JSON.stringify(request) : undefined,
      }
    );
  }

  /**
   * PUT /sessions/:id/clear-suspicious - Clear suspicious flag
   */
  async clearSuspiciousFlag(
    id: number
  ): Promise<ApiSuccessResponse<SessionType>> {
    return this.request<ApiSuccessResponse<SessionType>>(
      `/${id}/clear-suspicious`,
      {
        method: "PUT",
      }
    );
  }

  /**
   * PUT /sessions/:id/risk-score - Update session risk score
   */
  async updateRiskScore(
    id: number,
    request: UpdateRiskScoreRequest
  ): Promise<ApiSuccessResponse<SessionType>> {
    return this.request<ApiSuccessResponse<SessionType>>(`/${id}/risk-score`, {
      method: "PUT",
      body: JSON.stringify(request),
    });
  }

  /**
   * PUT /sessions/:id/metadata - Update session metadata
   */
  async updateSessionMetadata(
    id: number,
    request: UpdateSessionMetadataRequest
  ): Promise<ApiSuccessResponse<SessionType>> {
    return this.request<ApiSuccessResponse<SessionType>>(`/${id}/metadata`, {
      method: "PUT",
      body: JSON.stringify(request),
    });
  }

  /**
   * PUT /sessions/:id/end - End session
   */
  async endSession(
    id: number,
    request?: EndSessionRequest
  ): Promise<ApiSuccessResponse<SessionType>> {
    return this.request<ApiSuccessResponse<SessionType>>(`/${id}/end`, {
      method: "PUT",
      body: request ? JSON.stringify(request) : undefined,
    });
  }

  // ==================== CRUD OPERATIONS (3 endpoints) ====================

  /**
   * POST /sessions - Create session
   */
  async createSession(
    request: CreateSessionRequest
  ): Promise<ApiSuccessResponse<SessionType>> {
    return this.request<ApiSuccessResponse<SessionType>>("/", {
      method: "POST",
      body: JSON.stringify(request),
    });
  }

  /**
   * GET /sessions/:id - Get session by ID
   */
  async getSessionById(
    id: number,
    skipCache?: boolean
  ): Promise<ApiSuccessResponse<SessionType>> {
    const queryString = this.buildQueryParams({ skipCache });
    return this.request<ApiSuccessResponse<SessionType>>(
      `/${id}${queryString}`
    );
  }

  /**
   * GET /sessions - Get all sessions
   */
  async getSessions(
    query?: SearchSessionsQuery
  ): Promise<PaginatedResponse<SessionType>> {
    const queryString = this.buildQueryParams(query || {});
    return this.request<PaginatedResponse<SessionType>>(`${queryString}`);
  }
}

export const sessionService = new SessionService();
