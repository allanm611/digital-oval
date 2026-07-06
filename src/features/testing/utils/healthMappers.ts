// src/features/testing/utils/healthMappers.ts

import type {
  AIAnalysis,
  E2eEnvDiagnostics,
  HealthDashboardData,
  HealthDashboardRaw,
  ModuleConfig,
  ModuleStatus,
  RunDetail,
  RunStatus,
  TestRun,
  TestStatus,
  TestSuiteResult,
  AIBackendResponse,
  AIRecommendation,
} from '../types/health';

import { computeRunTestStats, indexLatestRunByModule } from './runTestStats';
export function buildSummaryFromModules(
  modules: ModuleStatus[],
): HealthDashboardData['summary'] {
  return {
    total: modules.length,
    passing: modules.filter((m) => m.status === 'pass').length,
    failing: modules.filter((m) => m.status === 'fail').length,
    running: modules.filter((m) => m.status === 'running').length,
    unknown: modules.filter((m) => m.status === 'unknown').length,
  };
}

export const mapRunStatus = (status: RunStatus | string | undefined): TestStatus => {
  switch (status) {
    case 'passed':  return 'pass';
    case 'failed':  return 'fail';
    case 'running': return 'running';
    case 'pending': return 'running'; // show as running while queued
    case 'skipped': return 'skipped';
    default:        return 'unknown';
  }
};

/** Pull suite breakdown from top-level field or meta.suites (backend storage). */
export const extractSuitesFromRun = (
  raw: Pick<RunDetail, 'suites' | 'meta'>,
): Array<Partial<TestSuiteResult>> => {
  if (Array.isArray(raw.suites) && raw.suites.length > 0) {
    return raw.suites;
  }

  const meta = raw.meta;
  if (meta && typeof meta === 'object' && Array.isArray((meta as { suites?: unknown }).suites)) {
    return (meta as { suites: Array<Partial<TestSuiteResult>> }).suites;
  }

  return [];
};


/**
 * Converts a raw RunDetail from the backend into the UI TestRun shape.
 * Safe against missing or partially formed data.
 */
export const normalizeRunDetail = (raw: RunDetail): TestRun => {
  const suites: TestSuiteResult[] = extractSuitesFromRun(raw).map((suite) => ({
    type:     suite.type    ?? 'unit',
    status:   suite.status  ?? 'unknown',
    passed:   typeof suite.passed  === 'number' ? suite.passed  : 0,
    failed:   typeof suite.failed  === 'number' ? suite.failed  : 0,
    skipped:  typeof suite.skipped === 'number' ? suite.skipped : 0,
    duration: typeof suite.duration === 'number' ? suite.duration : 0,
    errors:   Array.isArray(suite.errors) ? suite.errors : [],
  }));

  return {
    id:          String(raw.id),
    moduleId:    String(raw.moduleId),
    startedAt:   raw.startedAt   ?? new Date().toISOString(),
    finishedAt:  raw.finishedAt  ?? null,
    status:      mapRunStatus(raw.status),
    durationMs:  typeof raw.durationMs === 'number' ? raw.durationMs : 0,
    suites,
    triggeredBy: raw.triggeredBy ?? 'manual',
    output:      raw.output,
    errors:      raw.errors,
    meta:        raw.meta,
  };
};


/**
 * Builds a UI-ready ModuleStatus from a raw ModuleConfig and its latest RunDetail.
 * Derives status, successRate, and consecutiveFailures locally.
 *
 * NOTE: consecutiveFailures from a single run can only be 0 or 1.
 * For accurate counts the backend should expose this field on the module config,
 * or the hook should aggregate across the run history. The field is preserved from
 * the module config if the backend starts returning it.
 */
export const buildModuleStatus = (
  module: ModuleConfig,
  lastRun?: RunDetail | null,
): ModuleStatus => {
  const normalizedLastRun = lastRun ? normalizeRunDetail(lastRun) : null;
  const runStats = computeRunTestStats(normalizedLastRun ?? lastRun, module.testSuites);

  const consecutiveFailures =
    typeof module.consecutiveFailures === 'number'
      ? module.consecutiveFailures
      : normalizedLastRun?.status === 'fail'
      ? 1
      : 0;

  return {
    ...module,
    lastRun:             normalizedLastRun,
    nextScheduled:       module.nextScheduled ?? null,
    status:              normalizedLastRun ? normalizedLastRun.status : 'unknown',
    consecutiveFailures,
    successRate:         runStats.successRate,
    lastRunStats: {
      passed: runStats.passed,
      failed: runStats.failed,
      skipped: runStats.skipped,
      total: runStats.total,
    },
  };
};

/** Whether the backend has usable E2E credentials in server .env */
export function isE2eConfigured(e2e?: E2eEnvDiagnostics): boolean {
  if (!e2e) return false;
  if (e2e.tokenUsable) return true;
  return e2e.hasEmail && e2e.hasPassword;
}

/** User-facing toast copy after POST /v1/run/:moduleId */
export function describeRunTriggerResult(run: TestRun): { title: string; message: string } {
  if (!run.finishedAt && run.status === 'running') {
    return {
      title: 'Run queued',
      message: 'The module was submitted to the worker queue.',
    };
  }
  if (run.status === 'pass') {
    return {
      title: 'Run passed',
      message: 'All tests completed successfully.',
    };
  }
  if (run.status === 'fail') {
    return {
      title: 'Run failed',
      message: 'One or more tests failed. Open run logs for details.',
    };
  }
  return {
    title: 'Run started',
    message: 'The module has been submitted for execution.',
  };
}

// ── Dashboard assembly ────────────────────────────────────────────────────────

/**
 * Joins raw modules with their latest run from the lastRuns array.
 * This is the single place where the API shape → UI shape transformation happens.
 */
export const buildDashboard = (raw: HealthDashboardRaw): HealthDashboardData => {
  const lastRuns = Array.isArray(raw.lastRuns) ? raw.lastRuns : [];
  const lastRunByModule = indexLatestRunByModule(lastRuns);

  const modules: ModuleStatus[] = (Array.isArray(raw.modules) ? raw.modules : []).map((module) => {
    const lastRun = lastRunByModule.get(String(module.id)) ?? null;
    return buildModuleStatus(module, lastRun);
  });

  const summary = {
    total:   modules.length,
    passing: modules.filter((m) => m.status === 'pass').length,
    failing: modules.filter((m) => m.status === 'fail').length,
    running: modules.filter((m) => m.status === 'running').length,
    unknown: modules.filter((m) => m.status === 'unknown').length,
  };

  return {
    modules,
    summary,
    lastUpdated:   new Date().toISOString(),
    executionMode: raw.executionMode,
  };
};

// ── AI analysis mapping ───────────────────────────────────────────────────────

function normalizeRecommendation(item: AIRecommendation | string): AIRecommendation {
  if (typeof item === 'string') {
    return { text: item };
  }
  return item;
}

/**
 * Maps the backend AIBackendResponse to the frontend AIAnalysis shape.
 */
export const mapAIAnalysis = (raw: AIBackendResponse): AIAnalysis => {
  const recommendations = (Array.isArray(raw.recommendations) ? raw.recommendations : [])
    .map(normalizeRecommendation)
    .filter((item) => Boolean(item.text));

  const rootCausePick = recommendations[0] ?? null;
  const suggestedFixPick = recommendations[1] ?? null;

  return {
    summary: raw.summary || 'No analysis summary available.',
    rootCause: rootCausePick?.text || raw.summary || 'No root cause identified.',
    suggestedFix:
      suggestedFixPick?.text ||
      'Review the failed run details and verify your selectors against the live UI.',
    confidence: rootCausePick?.confidence ?? 'low',
    affectedSelectors: rootCausePick?.selectors,
  };
};

