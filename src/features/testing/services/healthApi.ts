import { API_CONFIG, buildApiUrl, getAuthHeaders } from '../../../shared/services/api';
import type {
  AIBackendResponse,
  ApiTestCase,
  ApiTestCasePayload,
  ApiTestCaseResult,
  ArtifactPurgePayload,
  ArtifactPurgeResult,
  ArtifactRetentionConfig,
  GenerateTestRequestPayload,
  GeneratedTestDraft,
  GeneratedTestDraftStatus,
  HealthDashboardRaw,
  ModuleConfig,
  NotificationConfiguredSendPayload,
  NotificationDeliveryResult,
  NotificationSettings,
  NotificationSettingsView,
  NotificationTestPayload,
  PlaywrightServiceInfo,
  RunDetail,
  ModuleUpdate,
  ServiceProbeResult,
  TestCatalogNode,
  UiFlowTestCase,
  UiFlowTestCasePayload,
  UiFlowTestCaseResult,
} from '../types/health';

// const BASE_URL = buildApiUrl(API_CONFIG.ENDPOINTS.HEALTH);
const BASE_URL = "http://localhost:11008/playwright-health"; 

/** Resolve a playwright-health path (e.g. /playwright-health/v1/runs/.../artifacts/...) to a full URL. */
export function resolvePlaywrightHealthUrl(pathOrUrl: string): string {
  if (!pathOrUrl) return '';
  if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) {
    return pathOrUrl;
  }
  const apiOrigin = BASE_URL.replace(/\/playwright-health\/?$/, '');
  return `${apiOrigin}${pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`}`;
}
export class HealthApiError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly details?: string;

  constructor(
    message: string,
    status: number,
    options?: { code?: string; details?: string },
  ) {
    super(message);
    this.name = 'HealthApiError';
    this.status = status;
    this.code = options?.code;
    this.details = options?.details;
  }
}

function getBearerToken(): string | null {
  return localStorage.getItem('authToken') || localStorage.getItem('auth_token');
}

function emitAuthError(status: number): void {
  window.dispatchEvent(
    new CustomEvent('health:auth-error', { detail: { status } }),
  );
}

class HealthApiService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    includeJsonContentType = true,
  ): Promise<T> {
    const url = `${BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        ...(includeJsonContentType ? getAuthHeaders() : this.authHeadersOnly()),
        ...(options.headers as Record<string, string> | undefined),
      },
    });

    if (response.status === 401 || response.status === 403) {
      emitAuthError(response.status);
    }

    if (response.status === 204) {
      if (!response.ok) {
        throw new HealthApiError(response.statusText || 'Request failed', response.status);
      }
      return undefined as T;
    }

    const responseText = await response.text();
    if (!responseText) {
      if (!response.ok) {
        throw new HealthApiError(
          `HTTP ${response.status} ${response.statusText}`,
          response.status,
        );
      }
      return undefined as T;
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(responseText);
    } catch {
      throw new HealthApiError(
        `Invalid JSON from playwright-health API: ${responseText.substring(0, 200)}`,
        response.status,
      );
    }

    if (!response.ok) {
      const body = parsed as {
        error?: string;
        message?: string;
        code?: string;
        details?: string;
      };
      const errorMessage =
        body.error ||
        body.message ||
        response.statusText ||
        'Unknown error';
      throw new HealthApiError(errorMessage, response.status, {
        code: body.code,
        details: body.details,
      });
    }

    return parsed as T;
  }

  private authHeadersOnly(): Record<string, string> {
    const token = getBearerToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  async probe(): Promise<ServiceProbeResult> {
    const started = performance.now();
    try {
      const response = await fetch(`${BASE_URL}/health`, {
        headers: this.authHeadersOnly(),
      });
      const durationMs = Math.round(performance.now() - started);
      let message: string | undefined;

      if (response.ok) {
        try {
          const body = (await response.json()) as { status?: string; executionMode?: string };
          message = body.executionMode
            ? `${body.status ?? 'healthy'} (${body.executionMode})`
            : body.status;
        } catch {
          message = 'healthy';
        }
      }

      return {
        ok: response.ok,
        status: response.status,
        durationMs,
        message,
      };
    } catch (error) {
      return {
        ok: false,
        status: 0,
        durationMs: Math.round(performance.now() - started),
        message: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  async getStatus(): Promise<HealthDashboardRaw> {
    return this.request<HealthDashboardRaw>('/v1/status');
  }

  async getTestCatalog(): Promise<TestCatalogNode[]> {
    const response = await this.request<TestCatalogNode[] | { data?: TestCatalogNode[] }>(
      '/v1/test-catalog',
    );
    if (Array.isArray(response)) {
      return response;
    }
    return Array.isArray(response.data) ? response.data : [];
  }

  async issueSseTicket(): Promise<{ ticket: string; expiresInMs: number }> {
    return this.request<{ ticket: string; expiresInMs: number }>('/v1/events/ticket', {
      method: 'POST',
    });
  }

  getSseStreamUrl(ticket: string): string {
    return `${BASE_URL}/v1/events/stream?ticket=${encodeURIComponent(ticket)}`;
  }

  async getModule(id: string): Promise<ModuleConfig> {
    return this.request<ModuleConfig>(`/v1/modules/${encodeURIComponent(id)}`);
  }

  async createModule(payload: Partial<ModuleConfig>): Promise<ModuleConfig> {
    return this.request<ModuleConfig>('/v1/modules', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async updateModule(id: string, payload: ModuleUpdate): Promise<ModuleConfig> {
    return this.request<ModuleConfig>(`/v1/modules/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  async deleteModule(id: string): Promise<void> {
    await this.request<void>(`/v1/modules/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  }

  /**
   * Trigger a module run. The backend uses server-side E2E credentials
   * (TEST_EMAIL / TEST_PASSWORD / TEST_AUTH_TOKEN in cvm-backend .env) and the
   * module's configured baseUrl as FRONTEND_URL — no request body is required.
   */
  async triggerRun(moduleId: string): Promise<RunDetail> {
    return this.request<RunDetail>(`/v1/run/${encodeURIComponent(moduleId)}`, {
      method: 'POST',
    });
  }

  /**
   * Requests that a pending or running module run be stopped. Pending runs
   * are cancelled immediately; running runs are stopped cooperatively and
   * may take a few seconds to fully finalize (poll run detail / watch SSE).
   */
  async cancelRun(runId: string): Promise<RunDetail> {
    return this.request<RunDetail>(
      `/v1/runs/detail/${encodeURIComponent(runId)}/cancel`,
      { method: 'POST' },
    );
  }

  async getServiceInfo(): Promise<PlaywrightServiceInfo> {
    return this.request<PlaywrightServiceInfo>('/');
  }

  async listRuns(moduleId: string, limit = 25): Promise<RunDetail[]> {
    const query = limit > 0 ? `?limit=${limit}` : '';
    const response = await this.request<RunDetail[]>(
      `/v1/runs/${encodeURIComponent(moduleId)}${query}`,
    );
    return Array.isArray(response) ? response : [];
  }

  async getRunDetail(runId: string): Promise<RunDetail> {
    return this.request<RunDetail>(`/v1/runs/detail/${encodeURIComponent(runId)}`);
  }

  async getNotificationSettings(): Promise<NotificationSettingsView> {
    return this.request<NotificationSettingsView>('/v1/notifications/settings');
  }

  async updateNotificationSettings(
    settings: NotificationSettings,
  ): Promise<NotificationSettingsView> {
    await this.request<NotificationSettings & { message?: string }>(
      '/v1/notifications/settings',
      {
        method: 'POST',
        body: JSON.stringify(settings),
      },
    );
    return this.getNotificationSettings();
  }

  async sendTestNotification(
    payload?: NotificationTestPayload,
  ): Promise<NotificationDeliveryResult> {
    const response = await this.request<
      NotificationDeliveryResult & { message?: string }
    >('/v1/notifications/test', {
      method: 'POST',
      body: JSON.stringify(payload ?? {}),
    });
    return response;
  }

  async sendConfiguredNotification(
    payload?: NotificationConfiguredSendPayload,
  ): Promise<NotificationDeliveryResult> {
    const response = await this.request<
      NotificationDeliveryResult & { message?: string }
    >('/v1/notifications/send', {
      method: 'POST',
      body: JSON.stringify(payload ?? {}),
    });
    return response;
  }

  async analyzeRun(runId: string): Promise<AIBackendResponse> {
    return this.request<AIBackendResponse>(
      `/v1/ai/analyze/${encodeURIComponent(runId)}`,
      { method: 'POST' },
    );
  }

  async generateTests(
    moduleId: string,
  ): Promise<{ moduleId: string; generated?: boolean; message?: string; stubs?: string }> {
    return this.request(`/v1/ai/generate/${encodeURIComponent(moduleId)}`, {
      method: 'POST',
    });
  }

  async getArtifactRetention(): Promise<ArtifactRetentionConfig> {
    return this.request<ArtifactRetentionConfig>('/v1/artifacts/retention');
  }

  async purgeArtifacts(payload?: ArtifactPurgePayload): Promise<ArtifactPurgeResult> {
    return this.request<ArtifactPurgeResult>('/v1/artifacts/purge', {
      method: 'POST',
      body: JSON.stringify(payload ?? {}),
    });
  }

  // ===================================
  // Dynamic API test cases (data-driven, no code — run via api/dynamic-api.spec.ts)
  // ===================================

  async listApiTestCases(moduleId?: string): Promise<ApiTestCase[]> {
    const query = moduleId ? `?moduleId=${encodeURIComponent(moduleId)}` : '';
    const response = await this.request<ApiTestCase[]>(`/v1/api-tests${query}`);
    return Array.isArray(response) ? response : [];
  }

  async getApiTestCase(id: string): Promise<ApiTestCase> {
    return this.request<ApiTestCase>(`/v1/api-tests/${encodeURIComponent(id)}`);
  }

  async createApiTestCase(payload: ApiTestCasePayload): Promise<ApiTestCase> {
    return this.request<ApiTestCase>('/v1/api-tests', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async updateApiTestCase(
    id: string,
    payload: Partial<ApiTestCasePayload>,
  ): Promise<ApiTestCase> {
    return this.request<ApiTestCase>(`/v1/api-tests/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  async deleteApiTestCase(id: string): Promise<void> {
    await this.request<void>(`/v1/api-tests/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  }

  /** Executes a case immediately without saving — pass an `id` to try a saved case, or a full draft payload. */
  async tryApiTestCase(payload: Partial<ApiTestCasePayload> & { id?: string }): Promise<ApiTestCaseResult> {
    return this.request<ApiTestCaseResult>('/v1/api-tests/try', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // ===================================
  // Dynamic UI flow test cases (data-driven browser steps — run via ui/dynamic-ui.spec.ts)
  // ===================================

  async listUiFlowTestCases(moduleId?: string): Promise<UiFlowTestCase[]> {
    const query = moduleId ? `?moduleId=${encodeURIComponent(moduleId)}` : '';
    const response = await this.request<UiFlowTestCase[]>(`/v1/ui-tests${query}`);
    return Array.isArray(response) ? response : [];
  }

  async getUiFlowTestCase(id: string): Promise<UiFlowTestCase> {
    return this.request<UiFlowTestCase>(`/v1/ui-tests/${encodeURIComponent(id)}`);
  }

  async createUiFlowTestCase(payload: UiFlowTestCasePayload): Promise<UiFlowTestCase> {
    return this.request<UiFlowTestCase>('/v1/ui-tests', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async updateUiFlowTestCase(
    id: string,
    payload: Partial<UiFlowTestCasePayload>,
  ): Promise<UiFlowTestCase> {
    return this.request<UiFlowTestCase>(`/v1/ui-tests/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  async deleteUiFlowTestCase(id: string): Promise<void> {
    await this.request<void>(`/v1/ui-tests/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  }

  /** Executes a flow immediately without saving — pass an `id` to try a saved case, or a full draft payload. */
  async tryUiFlowTestCase(
    payload: Partial<UiFlowTestCasePayload> & { id?: string },
  ): Promise<UiFlowTestCaseResult> {
    return this.request<UiFlowTestCaseResult>('/v1/ui-tests/try', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // ===================================
  // AI-assisted dynamic test creation (draft -> human review -> approve/reject)
  // ===================================

  async requestTestGeneration(payload: GenerateTestRequestPayload): Promise<GeneratedTestDraft> {
    return this.request<GeneratedTestDraft>('/v1/ai/generate', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async listGeneratedDrafts(filter?: {
    moduleId?: string;
    status?: GeneratedTestDraftStatus;
  }): Promise<GeneratedTestDraft[]> {
    const params = new URLSearchParams();
    if (filter?.moduleId) params.set('moduleId', filter.moduleId);
    if (filter?.status) params.set('status', filter.status);
    const query = params.toString() ? `?${params.toString()}` : '';
    const response = await this.request<GeneratedTestDraft[]>(`/v1/ai/generate/drafts${query}`);
    return Array.isArray(response) ? response : [];
  }

  async getGeneratedDraft(id: string): Promise<GeneratedTestDraft> {
    return this.request<GeneratedTestDraft>(`/v1/ai/generate/drafts/${encodeURIComponent(id)}`);
  }

  async approveGeneratedDraft(id: string): Promise<GeneratedTestDraft> {
    return this.request<GeneratedTestDraft>(
      `/v1/ai/generate/drafts/${encodeURIComponent(id)}/approve`,
      { method: 'POST' },
    );
  }

  async rejectGeneratedDraft(id: string): Promise<GeneratedTestDraft> {
    return this.request<GeneratedTestDraft>(
      `/v1/ai/generate/drafts/${encodeURIComponent(id)}/reject`,
      { method: 'POST' },
    );
  }
}

export const healthApi = new HealthApiService();

export const fetchNotificationSettings = () => healthApi.getNotificationSettings();
export const updateNotificationSettings = (settings: NotificationSettings) =>
  healthApi.updateNotificationSettings(settings);
export const sendTestNotification = (payload?: NotificationTestPayload) =>
  healthApi.sendTestNotification(payload);
export const sendConfiguredNotification = (payload?: NotificationConfiguredSendPayload) =>
  healthApi.sendConfiguredNotification(payload);
export const generateTestStubs = (moduleId: string) => healthApi.generateTests(moduleId);



