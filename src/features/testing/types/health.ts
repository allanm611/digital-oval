// src/features/testing/types/health.ts

export type TestStatus = 'pass' | 'fail' | 'running' | 'unknown' | 'skipped';
export type RunStatus = 'pending' | 'running' | 'passed' | 'failed' | 'unknown';
export type PlaywrightCaseStatus = 'passed' | 'failed' | 'skipped' | 'flaky' | 'unknown';

export interface PlaywrightTestCaseMeta {
  id: string;
  title: string;
  specFile: string;
  line?: number;
  column?: number;
  project?: string;
  suiteType?: string;
  durationMs: number;
  status: PlaywrightCaseStatus;
  retries?: number;
  error?: TestError;
  screenshotKey?: string;
  traceKey?: string;
}

export interface RunMeta {
  testSuites?: string[];
  cron?: string;
  suites?: Array<Partial<TestSuiteResult>>;
  testCases?: PlaywrightTestCaseMeta[];
  reportUrl?: string;
  flaky?: number;
  [key: string]: unknown;
}

export type TestType =
  | 'unit'
  | 'integration'
  | 'e2e'
  | 'regression'
  | 'performance'
  | 'smoke'
  | 'security'
  | 'accessibility'
  | 'errorHandling';

export interface TestError {
  test: string;
  message: string;
  stack?: string;
  screenshot?: string;
  traceUrl?: string;
  specFile?: string;
  line?: number;
}

export interface TestSuiteResult {
  type: TestType;
  status: TestStatus;
  passed: number;
  failed: number;
  skipped: number;
  duration: number;
  errors: TestError[];
}

export interface TestRun {
  id: string;
  moduleId: string;
  startedAt: string;
  finishedAt: string | null;
  status: TestStatus;
  durationMs: number;
  suites: TestSuiteResult[];
  triggeredBy: 'schedule' | 'manual' | 'ci';
  output?: string;
  errors?: string;
  meta?: unknown;
}

export interface ModuleThresholds {
  performanceMs: number;
  maxFailures: number;
}


export interface ModuleConfig {
  id: string;
  name: string;
  description: string;
  testSuites: string[];
  cron: string;
  notifyOnFailure: boolean;
  notifyEmails: string[];
  active: boolean;
  thresholds?: {
    performanceMs?: number;
    maxFailures?: number;
  };
  tags?: string[];
  baseUrl?: string;
  nextScheduled?: string | null;
  consecutiveFailures?: number;
}

export interface ModuleStatus extends ModuleConfig {
  lastRun: TestRun | null;
  nextScheduled: string | null;
  status: TestStatus;
  consecutiveFailures: number;
  /** 0–100 integer */
  successRate: number;
  /** Accurate counts from the latest run (prefers meta.testCases). */
  lastRunStats: {
    passed: number;
    failed: number;
    skipped: number;
    total: number;
  };
}

/** Raw run shape from the backend before normalisation. */
export interface RunDetail {
  id: string | number;
  moduleId: string | number;
  startedAt: string;
  finishedAt: string | null;
  status: RunStatus;
  durationMs: number;
  suites?: Array<Partial<TestSuiteResult>>;
  triggeredBy?: 'schedule' | 'manual' | 'ci';
  output?: string;
  errors?: string;
  meta?: unknown;
}

export interface AIRecommendation {
  text: string;
  confidence?: 'high' | 'medium' | 'low';
  selectors?: string[];
}

export interface AIBackendResponse {
  runId: string;
  summary: string;
  recommendations?: Array<AIRecommendation | string>;
}

/** Raw shape from GET /v1/status */
export interface HealthDashboardRaw {
  modules: ModuleConfig[];
  lastRuns: RunDetail[];
  executionMode?: 'inline' | 'worker' | string;
}

/** Enriched shape after the react-query transform */
export interface HealthDashboardData {
  modules: ModuleStatus[];
  summary: {
    total: number;
    passing: number;
    failing: number;
    unknown: number;
    running: number;
  };
  lastUpdated: string;
  executionMode?: string;
}

export interface NotificationSettings {
  enabled: boolean;
  recipients: string[];
}

/** SMTP readiness from GET /v1/notifications/settings */
export interface NotificationDeliveryDiagnostics {
  primaryConfigured: boolean;
  fallbackConfigured: boolean;
  fromAddress: string | null;
}

export interface NotificationSettingsView extends NotificationSettings {
  delivery: NotificationDeliveryDiagnostics;
}

export type NotificationErrorCode =
  | 'DISABLED'
  | 'NO_RECIPIENTS'
  | 'SMTP_NOT_CONFIGURED'
  | 'DELIVERY_FAILED'
  | 'VALIDATION_ERROR';

/** POST /v1/notifications/test — recipients optional (falls back to saved settings) */
export interface NotificationTestPayload {
  recipients?: string[];
  subject?: string;
  message?: string;
}

/** POST /v1/notifications/send — uses configured recipients (notifications must be enabled) */
export interface NotificationConfiguredSendPayload {
  subject?: string;
  message?: string;
}

/** Successful delivery response from test/send endpoints */
export interface NotificationDeliveryResult {
  delivered: true;
  messageId: string;
  recipients: string[];
  channel: 'primary' | 'fallback';
  subject: string;
  message?: string;
}

/** @deprecated Use NotificationTestPayload */
export interface NotificationSendPayload extends NotificationTestPayload {
  recipients: string[];
}

export interface ScheduleUpdate {
  cron?: string;
  active?: boolean;
  testSuites?: string[];
  notifyOnFailure?: boolean;
  notifyEmails?: string[];
  thresholds?: {
    performanceMs?: number;
    maxFailures?: number;
  };
}

/** Partial module payload accepted by PUT /v1/modules/:id */
export interface ModuleUpdate extends ScheduleUpdate {
  name?: string;
  description?: string;
  baseUrl?: string;
  tags?: string[];
}

export interface AIAnalysis {
  summary: string;
  rootCause: string;
  suggestedFix: string;
  affectedSelectors?: string[];
  confidence: 'high' | 'medium' | 'low';
}

export interface ServiceProbeResult {
  ok: boolean;
  status: number;
  durationMs: number;
  message?: string;
}

/** Mirrors backend `getE2eEnvDiagnostics()` from GET /playwright-health/ */
export interface E2eEnvDiagnostics {
  envPath: string | null;
  hasEmail: boolean;
  hasPassword: boolean;
  hasToken: boolean;
  tokenUsable: boolean;
  frontendUrl?: string;
  keys: readonly string[];
}

/** Mirrors backend `ArtifactRetentionConfig` */
export interface ArtifactRetentionConfig {
  enabled: boolean;
  retentionDays: number;
  purgeCron: string;
  batchSize: number;
}

/** Mirrors backend `ArtifactPurgeResult` */
export interface ArtifactPurgeResult {
  enabled: boolean;
  retentionDays: number;
  cutoffAt: string;
  dryRun: boolean;
  scanned: number;
  purged: number;
  skipped: number;
  deletedDirs: string[];
  errors: string[];
}

export interface ArtifactPurgePayload {
  dryRun?: boolean;
  retentionDays?: number;
  batchSize?: number;
}

/** Response from GET /playwright-health/ (service root) */
export interface PlaywrightServiceInfo {
  status: string;
  service: string;
  version: string;
  executionMode?: string;
  e2e?: E2eEnvDiagnostics;
  artifactRetention?: ArtifactRetentionConfig;
}

export interface TriggerRunRequest {
  moduleId: string;
}

export type TestCatalogKind = 'category' | 'spec' | 'case';

export interface TestCatalogNode {
  id: string;
  label: string;
  kind: TestCatalogKind;
  /** Path stored in module.testSuites */
  value?: string;
  children?: TestCatalogNode[];
}
