// src/features/testing/types/health.ts

export type TestStatus = 'pass' | 'fail' | 'running' | 'unknown' | 'skipped' | 'cancelled';
export type RunStatus = 'pending' | 'running' | 'passed' | 'failed' | 'cancelled' | 'unknown';
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
  | 'api'
  | 'ui'
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
  cancelRequested?: boolean;
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
  cancelRequested?: boolean;
  cancelledAt?: string | null;
  cancelledBy?: string | null;
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
    cancelled: number;
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

// ===================================
// Dynamic test creation + API-based tests
// ===================================

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD';

export type ApiBodyMode = 'none' | 'form-data' | 'urlencoded' | 'raw' | 'binary' | 'graphql';
export type ApiRawLanguage = 'json' | 'text' | 'xml' | 'html';
export type ApiAuthType = 'none' | 'bearer' | 'basic' | 'apikey';

export interface ApiKeyValueRow {
  key: string;
  value: string;
  description?: string;
  enabled?: boolean;
}

export interface ApiAuthConfig {
  type: ApiAuthType;
  bearerToken?: string;
  username?: string;
  password?: string;
  apiKey?: string;
  apiValue?: string;
  apiKeyIn?: 'header' | 'query';
}

export interface ApiBodyConfig {
  mode: ApiBodyMode;
  rawLanguage?: ApiRawLanguage;
  raw?: string;
  graphqlQuery?: string;
  graphqlVariables?: string;
  formRows?: ApiKeyValueRow[];
}

export interface ApiRequestEditor {
  queryRows?: ApiKeyValueRow[];
  headerRows?: ApiKeyValueRow[];
  auth?: ApiAuthConfig;
  body?: ApiBodyConfig;
}

export type ApiAssertionType = 'status' | 'jsonPath' | 'header' | 'bodyContains' | 'responseTimeMs';

export type ApiAssertionOperator =
  | 'equals'
  | 'notEquals'
  | 'contains'
  | 'lessThan'
  | 'greaterThan'
  | 'exists';

export interface ApiAssertion {
  type: ApiAssertionType;
  /** jsonPath expression (e.g. "data.items[0].id") or header name. Unused for bodyContains/responseTimeMs. */
  path?: string;
  operator: ApiAssertionOperator;
  value?: unknown;
}

export interface ApiTestCase {
  id: string;
  /** Nullable — a case can be reusable/standalone or scoped to one module. */
  moduleId: string | null;
  name: string;
  method: HttpMethod;
  url: string;
  headers?: Record<string, string>;
  queryParams?: Record<string, string>;
  body?: unknown;
  editor?: ApiRequestEditor;
  expectedStatus: number[];
  assertions: ApiAssertion[];
  timeoutMs: number;
  active: boolean;
  tags?: string[];
  createdBy?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

/** Payload accepted by POST/PUT /v1/api-tests (id/timestamps are server-assigned). */
export type ApiTestCasePayload = Omit<ApiTestCase, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>;

export interface ApiAssertionResult {
  assertion: ApiAssertion;
  passed: boolean;
  message: string;
  actual?: unknown;
}

export interface ApiTestCaseResult {
  caseId?: string;
  name: string;
  requestUrl: string;
  method: HttpMethod;
  status: number;
  durationMs: number;
  ok: boolean;
  assertionResults: ApiAssertionResult[];
  responseBodyPreview?: string;
  /** Present on current try-runners; older backends may omit this. */
  responseHeaders?: Record<string, string>;
  error?: string;
}

export type GeneratedTestDraftStatus = 'draft' | 'approved' | 'rejected';

export interface GeneratedTestDraft {
  id: string;
  moduleId: string | null;
  featureName: string;
  sourceUrl?: string | null;
  prompt?: string | null;
  generatedCode: string;
  specPath?: string | null;
  status: GeneratedTestDraftStatus;
  safetyWarnings: string[];
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  createdBy?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface GenerateTestRequestPayload {
  moduleId?: string;
  featureName: string;
  url: string;
  prompt?: string;
}

// ===================================
// Dynamic UI flow tests (non-AI, data-driven browser steps)
// ===================================

export type UiStepAction =
  | 'goto'
  | 'click'
  | 'fill'
  | 'check'
  | 'uncheck'
  | 'selectOption'
  | 'press'
  | 'waitForSelector'
  | 'expectVisible'
  | 'expectText'
  | 'expectURL'
  | 'expectCount';

/**
 * Small locator DSL, e.g. role=button[name="Submit"], label=Email,
 * text=Sign in, testid=login-btn, placeholder=Search, css=#id, or a bare
 * CSS selector. Not used by goto/expectURL.
 */
export interface UiFlowStep {
  action: UiStepAction;
  locator?: string;
  /** fill text / selectOption value / press key / expectText or expectURL match value / goto target */
  value?: string;
  /** expectCount target */
  count?: number;
  timeoutMs?: number;
  description?: string;
}

export interface UiFlowTestCase {
  id: string;
  moduleId: string | null;
  name: string;
  startUrl: string;
  steps: UiFlowStep[];
  timeoutMs: number;
  active: boolean;
  /** Reuse Playwright storageState (saved login) so protected routes work without login steps. */
  useStoredAuth: boolean;
  tags?: string[];
  createdBy?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export type UiFlowTestCasePayload = Omit<UiFlowTestCase, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>;

export interface UiFlowStepResult {
  index: number;
  step: UiFlowStep;
  passed: boolean;
  skipped: boolean;
  message: string;
  durationMs: number;
  /** Prefer screenshotUrl (async Try). Base64 only for sync / includeScreenshots. */
  screenshotBase64?: string;
  screenshotUrl?: string;
}

export interface UiFlowTestCaseResult {
  caseId?: string;
  name: string;
  ok: boolean;
  durationMs: number;
  steps: UiFlowStepResult[];
  error?: string;
}

export type UiFlowTryRunStatus = 'queued' | 'running' | 'succeeded' | 'failed' | 'error';

export interface UiFlowTryRunView {
  runId: string;
  status: UiFlowTryRunStatus;
  caseId?: string | null;
  name: string;
  ok?: boolean | null;
  durationMs?: number | null;
  error?: string | null;
  startedAt?: string | null;
  finishedAt?: string | null;
  createdAt?: string;
  result?: UiFlowTestCaseResult;
}
