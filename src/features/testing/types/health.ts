// src/features/testing/types/health.ts

export type TestStatus = 'pass' | 'fail' | 'running' | 'unknown' | 'skipped';
export type RunStatus = 'pending' | 'running' | 'passed' | 'failed' | 'unknown';
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

export interface NotificationSendPayload {
  recipients: string[];
  subject?: string;
  message?: string;
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

export type TestCatalogKind = 'category' | 'spec' | 'case';

export interface TestCatalogNode {
  id: string;
  label: string;
  kind: TestCatalogKind;
  /** Path stored in module.testSuites */
  value?: string;
  children?: TestCatalogNode[];
}
