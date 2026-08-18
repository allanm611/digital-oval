import type {
  PlaywrightTestCaseMeta,
  RunDetail,
  RunMeta,
  TestRun,
  TestSuiteResult,
} from '../types/health';

export interface RunTestStats {
  passed: number;
  failed: number;
  skipped: number;
  flaky: number;
  total: number;
  successRate: number;
}

const EMPTY_STATS: RunTestStats = {
  passed: 0,
  failed: 0,
  skipped: 0,
  flaky: 0,
  total: 0,
  successRate: 0,
};

function normalizeSpecPath(specFile: string): string {
  return specFile.replace(/\\/g, '/').replace(/^e2e\/tests\//, '');
}

export function parseModuleSuiteEntry(entry: string): { path: string; grep?: string } {
  const normalized = entry.trim().replace(/\\/g, '/');
  const separator = normalized.indexOf('::');
  if (separator === -1) {
    return { path: normalized };
  }
  return {
    path: normalized.slice(0, separator),
    grep: normalized.slice(separator + 2).trim() || undefined,
  };
}

function isSetupArtifact(testCase: PlaywrightTestCaseMeta): boolean {
  const spec = normalizeSpecPath(testCase.specFile);
  return testCase.project === 'setup' || spec.includes('auth.setup');
}

function specMatchesSuitePath(specFile: string, suitePath: string): boolean {
  const spec = normalizeSpecPath(specFile);
  const path = normalizeSpecPath(suitePath);

  if (spec === path) return true;
  if (spec.endsWith(`/${path}`)) return true;
  if (path.endsWith(spec)) return true;
  if (!path.includes('.') && (spec === path || spec.startsWith(`${path}/`))) return true;

  const specBase = spec.split('/').pop() ?? spec;
  const pathBase = path.split('/').pop() ?? path;
  return specBase === pathBase;
}

/** True when a Playwright case belongs to a module test-suite entry. */
export function testCaseMatchesModuleSuite(
  testCase: PlaywrightTestCaseMeta,
  suiteEntry: string,
): boolean {
  const { path, grep } = parseModuleSuiteEntry(suiteEntry);

  if (isSetupArtifact(testCase)) {
    return normalizeSpecPath(path).includes('auth.setup');
  }

  if (!specMatchesSuitePath(testCase.specFile, path)) {
    return false;
  }
  if (grep && !testCase.title.includes(grep)) {
    return false;
  }
  return true;
}

/**
 * Suite scope for a run — prefer suites stored on the run at execution time
 * (`meta.testSuites`) over the current module config.
 */
export function resolveRunTestSuiteScope(
  run: Pick<TestRun | RunDetail, 'meta'> | null | undefined,
  moduleTestSuites?: string[],
): string[] | undefined {
  const meta = run?.meta;
  if (meta && typeof meta === 'object') {
    const fromRun = (meta as RunMeta).testSuites;
    if (Array.isArray(fromRun) && fromRun.length > 0) {
      return fromRun;
    }
  }
  return moduleTestSuites?.length ? moduleTestSuites : undefined;
}

function extractMetaTestCases(
  run: Pick<TestRun | RunDetail, 'meta'>,
): PlaywrightTestCaseMeta[] {
  const meta = run.meta;
  if (!meta || typeof meta !== 'object') return [];
  const cases = (meta as { testCases?: unknown }).testCases;
  return Array.isArray(cases) ? (cases as PlaywrightTestCaseMeta[]) : [];
}

function filterCasesForModule(
  cases: PlaywrightTestCaseMeta[],
  moduleTestSuites?: string[],
): PlaywrightTestCaseMeta[] {
  if (!moduleTestSuites?.length) {
    return cases;
  }

  if (cases.length === 0) {
    return cases;
  }

  const strict = cases.filter((testCase) =>
    moduleTestSuites.some((entry) => testCaseMatchesModuleSuite(testCase, entry)),
  );
  if (strict.length > 0) {
    return strict;
  }

  const basenames = moduleTestSuites.map(
    (entry) => parseModuleSuiteEntry(entry).path.split('/').pop() ?? '',
  );
  const loose = cases.filter((testCase) => {
    if (isSetupArtifact(testCase)) {
      return false;
    }
    const specBase = normalizeSpecPath(testCase.specFile).split('/').pop() ?? '';
    return basenames.includes(specBase);
  });

  // Never fall back to the full unfiltered list — that leaks other modules' cases.
  return loose;
}

/** Scope run test cases to a module's configured suites (exported for report UI). */
export function filterModuleTestCases(
  cases: PlaywrightTestCaseMeta[],
  moduleTestSuites?: string[],
): PlaywrightTestCaseMeta[] {
  return filterCasesForModule(cases, moduleTestSuites);
}

function statsFromTestCases(cases: PlaywrightTestCaseMeta[]): RunTestStats {
  const passed = cases.filter((item) => item.status === 'passed').length;
  const failed = cases.filter((item) => item.status === 'failed').length;
  const skipped = cases.filter((item) => item.status === 'skipped').length;
  const flaky = cases.filter((item) => item.status === 'flaky').length;
  const total = passed + failed + skipped + flaky;

  return {
    passed,
    failed,
    skipped,
    flaky,
    total,
    successRate: total > 0 ? Math.round((passed / total) * 100) : 0,
  };
}

function extractSuitesFromRun(
  raw: Pick<TestRun | RunDetail, 'suites' | 'meta'>,
): Array<Partial<TestSuiteResult>> {
  if (Array.isArray(raw.suites) && raw.suites.length > 0) {
    return raw.suites;
  }

  const meta = raw.meta;
  if (meta && typeof meta === 'object' && Array.isArray((meta as { suites?: unknown }).suites)) {
    return (meta as { suites: Array<Partial<TestSuiteResult>> }).suites;
  }

  return [];
}

function statsFromSuites(suites: Array<Partial<TestSuiteResult>>): RunTestStats {
  const passed = suites.reduce((sum, suite) => sum + (suite.passed ?? 0), 0);
  const failed = suites.reduce((sum, suite) => sum + (suite.failed ?? 0), 0);
  const skipped = suites.reduce((sum, suite) => sum + (suite.skipped ?? 0), 0);
  const total = passed + failed + skipped;

  return {
    passed,
    failed,
    skipped,
    flaky: 0,
    total,
    successRate: total > 0 ? Math.round((passed / total) * 100) : 0,
  };
}

/**
 * Per-module test counts for a run.
 * Prefers `meta.testCases` scoped to the run's configured suites.
 */
export function computeRunTestStats(
  run: Pick<TestRun | RunDetail, 'meta' | 'suites'> | null | undefined,
  moduleTestSuites?: string[],
): RunTestStats {
  if (!run) return EMPTY_STATS;

  const scope = resolveRunTestSuiteScope(run, moduleTestSuites);
  const metaCases = extractMetaTestCases(run);

  if (metaCases.length > 0) {
    return statsFromTestCases(filterCasesForModule(metaCases, scope));
  }

  return statsFromSuites(extractSuitesFromRun(run));
}

/** Pick the newest run per module — safer than trusting array order from the API. */
export function indexLatestRunByModule(runs: RunDetail[]): Map<string, RunDetail> {
  const map = new Map<string, RunDetail>();

  for (const run of runs) {
    const key = String(run.moduleId);
    const existing = map.get(key);
    if (!existing) {
      map.set(key, run);
      continue;
    }

    const runTime = new Date(run.startedAt).getTime();
    const existingTime = new Date(existing.startedAt).getTime();
    if (runTime >= existingTime) {
      map.set(key, run);
    }
  }

  return map;
}
