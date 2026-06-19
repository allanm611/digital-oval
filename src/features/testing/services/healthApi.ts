import { buildApiUrl, getAuthHeaders } from '../../../shared/services/api';
import type {
  AIBackendResponse,
  HealthDashboardRaw,
  ModuleConfig,
  NotificationSendPayload,
  NotificationSettings,
  RunDetail,
  ScheduleUpdate,
  ModuleUpdate,
  ServiceProbeResult,
  TestCatalogNode,
} from '../types/health';

// const BASE_URL = buildApiUrl('/playwright-health');
const BASE_URL = 'http://localhost:11008/playwright-health';

export class HealthApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'HealthApiError';
    this.status = status;
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
      const errorMessage =
        (parsed as { error?: string; message?: string })?.error ||
        (parsed as { message?: string })?.message ||
        response.statusText ||
        'Unknown error';
      throw new HealthApiError(errorMessage, response.status);
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

  async triggerRun(moduleId: string): Promise<RunDetail> {
    return this.request<RunDetail>(`/v1/run/${encodeURIComponent(moduleId)}`, {
      method: 'POST',
    });
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

  async getNotificationSettings(): Promise<NotificationSettings> {
    return this.request<NotificationSettings>('/v1/notifications/settings');
  }

  async updateNotificationSettings(
    settings: NotificationSettings,
  ): Promise<NotificationSettings> {
    const response = await this.request<NotificationSettings & { message?: string }>(
      '/v1/notifications/settings',
      {
        method: 'POST',
        body: JSON.stringify(settings),
      },
    );
    return {
      enabled: response.enabled,
      recipients: response.recipients,
    };
  }

  async sendTestNotification(payload: NotificationSendPayload): Promise<void> {
    await this.request('/v1/notifications/test', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
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
}

export const healthApi = new HealthApiService();

export const fetchNotificationSettings = () => healthApi.getNotificationSettings();
export const updateNotificationSettings = (settings: NotificationSettings) =>
  healthApi.updateNotificationSettings(settings);
export const sendTestNotification = (payload: NotificationSendPayload) =>
  healthApi.sendTestNotification(payload);
export const generateTestStubs = (moduleId: string) => healthApi.generateTests(moduleId);
