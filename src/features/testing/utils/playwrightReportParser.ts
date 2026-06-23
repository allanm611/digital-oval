import type { PlaywrightTestCaseMeta, RunMeta, TestError, TestRun, TestSuiteResult } from '../types/health';

export type PlaywrightReportFilter = 'all' | 'passed' | 'failed' | 'skipped' | 'flaky' | 'suites';

export type PlaywrightCaseStatus = PlaywrightTestCaseMeta['status'];

export interface PlaywrightTestCase {
  id: string;
  title: string;
  specFile: string;
  line?: number;
  column?: number;
  project?: string;
  durationMs: number;
  status: PlaywrightCaseStatus;
  retries?: number;
  error?: TestError;
  traceUrl?: string;
}

export interface PlaywrightSpecGroup {
  specFile: string;
  project?: string;
  tests: PlaywrightTestCase[];
  passed: number;
  failed: number;
  skipped: number;
  flaky: number;
  durationMs: number;
}

export interface PlaywrightReportModel {
  testCases: PlaywrightTestCase[];
  specGroups: PlaywrightSpecGroup[];
  summary: {
    passed: number;
    failed: number;
    skipped: number;
    flaky: number;
    suites: number;
    total: number;
    durationMs: number;
  };
  reportUrl?: string;
}

const OUTPUT_LINE =
  /^\s*([✓✘×\-])\s+\d+\s+(?:\[(?<project>[^\]]+)\]\s+)?›\s+(?<file>.+?):(?<line>\d+):(?<col>\d+)\s+›\s+(?<title>.+?)(?:\s+\((?<dur>[\d.]+)(?<unit>ms|s)\))?\s*$/u;

function parseDurationMs(value: string | undefined, unit: string | undefined): number {
  if (!value) return 0;
  const num = Number.parseFloat(value);
  if (!Number.isFinite(num)) return 0;
  return unit === 's' ? Math.round(num * 1000) : Math.round(num);
}

function statusFromSymbol(symbol: string): PlaywrightCaseStatus {
  if (symbol === '✓') return 'passed';
  if (symbol === '✘' || symbol === '×') return 'failed';
  if (symbol === '-') return 'skipped';
  return 'unknown';
}

function normalizeSpecPath(file: string): string {
  return file.replace(/\\/g, '/').replace(/^e2e\/tests\//, '');
}

function mergeStatus(
  current: PlaywrightCaseStatus,
  incoming: PlaywrightCaseStatus,
): PlaywrightCaseStatus {
  const priority: Record<PlaywrightCaseStatus, number> = {
    failed: 4,
    flaky: 3,
    unknown: 2,
    skipped: 1,
    passed: 0,
  };
  return priority[incoming] >= priority[current] ? incoming : current;
}

function extractRunMeta(run: TestRun): RunMeta | null {
  if (!run.meta || typeof run.meta !== 'object') return null;
  return run.meta as RunMeta;
}

function mapMetaTestCases(metaCases: PlaywrightTestCaseMeta[]): PlaywrightTestCase[] {
  return metaCases.map((item) => ({
    id: item.id,
    title: item.title,
    specFile: item.specFile,
    line: item.line,
    column: item.column,
    project: item.project,
    durationMs: item.durationMs,
    status: item.status,
    retries: item.retries,
    error: item.error,
    traceUrl: item.error?.traceUrl,
  }));
}

function indexErrorsByTest(suites: TestSuiteResult[]): Map<string, TestError> {
  const map = new Map<string, TestError>();
  for (const suite of suites) {
    for (const err of suite.errors ?? []) {
      const key = err.test.trim().toLowerCase();
      if (!map.has(key)) {
        map.set(key, err);
      }
    }
  }
  return map;
}

function parseOutputLines(output: string | undefined, errorsByTest: Map<string, TestError>): PlaywrightTestCase[] {
  if (!output?.trim()) return [];

  const byKey = new Map<string, PlaywrightTestCase>();

  for (const line of output.split('\n')) {
    const match = line.match(OUTPUT_LINE);
    if (!match?.groups) continue;

    const specFile = normalizeSpecPath(match.groups.file.trim());
    const title = match.groups.title.trim();
    const status = statusFromSymbol(match[1] ?? '');
    const key = `${specFile}::${title}`.toLowerCase();

    const existing = byKey.get(key);
    const durationMs = parseDurationMs(match.groups.dur, match.groups.unit);
    const error = errorsByTest.get(title.toLowerCase());

    const next: PlaywrightTestCase = {
      id: key,
      title,
      specFile,
      line: Number.parseInt(match.groups.line, 10),
      column: Number.parseInt(match.groups.col, 10),
      project: match.groups.project?.trim(),
      durationMs: existing ? Math.max(existing.durationMs, durationMs) : durationMs,
      status: existing ? mergeStatus(existing.status, status) : status,
      error: error ?? existing?.error,
      traceUrl: error?.traceUrl ?? existing?.traceUrl,
    };

    if (next.status === 'failed' && error) {
      next.error = error;
    }

    byKey.set(key, next);
  }

  return [...byKey.values()];
}

function synthesizeFromSuites(suites: TestSuiteResult[]): PlaywrightTestCase[] {
  const cases: PlaywrightTestCase[] = [];

  for (const suite of suites) {
    for (const err of suite.errors ?? []) {
      cases.push({
        id: `error-${suite.type}-${err.test}`,
        title: err.test,
        specFile: err.specFile ?? suite.type,
        line: err.line,
        durationMs: 0,
        status: 'failed',
        error: err,
        traceUrl: err.traceUrl,
      });
    }

    for (let index = 0; index < suite.passed; index += 1) {
      cases.push({
        id: `passed-${suite.type}-${index}`,
        title: `Passed test ${index + 1}`,
        specFile: suite.type,
        durationMs: 0,
        status: 'passed',
      });
    }

    for (let index = 0; index < suite.skipped; index += 1) {
      cases.push({
        id: `skipped-${suite.type}-${index}`,
        title: `Skipped test ${index + 1}`,
        specFile: suite.type,
        durationMs: 0,
        status: 'skipped',
      });
    }
  }

  return cases;
}

function groupBySpec(testCases: PlaywrightTestCase[]): PlaywrightSpecGroup[] {
  const groups = new Map<string, PlaywrightSpecGroup>();

  for (const testCase of testCases) {
    const key = testCase.specFile;
    if (!groups.has(key)) {
      groups.set(key, {
        specFile: key,
        project: testCase.project,
        tests: [],
        passed: 0,
        failed: 0,
        skipped: 0,
        flaky: 0,
        durationMs: 0,
      });
    }

    const group = groups.get(key)!;
    group.tests.push(testCase);
    group.durationMs += testCase.durationMs;
    if (testCase.status === 'passed') group.passed += 1;
    else if (testCase.status === 'failed') group.failed += 1;
    else if (testCase.status === 'skipped') group.skipped += 1;
    else if (testCase.status === 'flaky') group.flaky += 1;
  }

  return [...groups.values()].sort((a, b) => a.specFile.localeCompare(b.specFile));
}

export function buildPlaywrightReport(run: TestRun | null): PlaywrightReportModel | null {
  if (!run) return null;

  const meta = extractRunMeta(run);
  const suites = run.suites ?? [];

  let testCases: PlaywrightTestCase[] = [];

  if (Array.isArray(meta?.testCases) && meta.testCases.length > 0) {
    testCases = mapMetaTestCases(meta.testCases);
  } else {
    const errorsByTest = indexErrorsByTest(suites);
    testCases = parseOutputLines(run.output, errorsByTest);
    if (testCases.length === 0 && suites.length > 0) {
      testCases = synthesizeFromSuites(suites);
    }
  }

  const specGroups = groupBySpec(testCases);

  const passed = testCases.filter((item) => item.status === 'passed').length
    || suites.reduce((sum, suite) => sum + suite.passed, 0);
  const failed = testCases.filter((item) => item.status === 'failed').length
    || suites.reduce((sum, suite) => sum + suite.failed, 0);
  const skipped = testCases.filter((item) => item.status === 'skipped').length
    || suites.reduce((sum, suite) => sum + suite.skipped, 0);
  const flaky = testCases.filter((item) => item.status === 'flaky').length
    || (typeof meta?.flaky === 'number' ? meta.flaky : 0);

  const suitesCount = specGroups.length > 0
    ? specGroups.length
    : suites.length;

  const durationMs = testCases.reduce((sum, item) => sum + item.durationMs, 0)
    || run.durationMs
    || suites.reduce((sum, suite) => sum + suite.duration, 0);

  return {
    testCases,
    specGroups,
    summary: {
      passed,
      failed,
      skipped,
      flaky,
      suites: suitesCount,
      total: passed + failed + skipped + flaky,
      durationMs,
    },
    reportUrl: typeof meta?.reportUrl === 'string' ? meta.reportUrl : undefined,
  };
}

export function filterPlaywrightReport(
  report: PlaywrightReportModel,
  filter: PlaywrightReportFilter,
  search: string,
): { testCases: PlaywrightTestCase[]; specGroups: PlaywrightSpecGroup[] } {
  const query = search.trim().toLowerCase();

  const matchesSearch = (item: PlaywrightTestCase) => {
    if (!query) return true;
    return (
      item.title.toLowerCase().includes(query) ||
      item.specFile.toLowerCase().includes(query) ||
      (item.project?.toLowerCase().includes(query) ?? false)
    );
  };

  const matchesFilter = (item: PlaywrightTestCase) => {
    switch (filter) {
      case 'passed':
        return item.status === 'passed';
      case 'failed':
        return item.status === 'failed';
      case 'skipped':
        return item.status === 'skipped';
      case 'flaky':
        return item.status === 'flaky';
      case 'suites':
      case 'all':
      default:
        return true;
    }
  };

  const testCases = report.testCases.filter(
    (item) => matchesFilter(item) && matchesSearch(item),
  );

  const specGroups = report.specGroups
    .map((group) => ({
      ...group,
      tests: group.tests.filter((item) => matchesFilter(item) && matchesSearch(item)),
    }))
    .filter((group) => group.tests.length > 0);

  return { testCases, specGroups };
}
