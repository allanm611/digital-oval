import React, { useMemo, useState } from 'react';
import {
  CheckCircle2, XCircle, SkipForward, ChevronDown, ChevronRight,
  FileCode2, AlertTriangle, ExternalLink, Camera, Film,
} from 'lucide-react';
import SearchInput from '../../../shared/components/ui/SearchInput';
import ImageLightbox from '../../../shared/components/ui/ImageLightbox';
import { tw } from '../../../shared/utils/utils';
import { resolvePlaywrightHealthUrl } from '../services/healthApi';
import type { TestRun } from '../types/health';
import {
  buildPlaywrightReport,
  filterPlaywrightReport,
  type PlaywrightReportFilter,
  type PlaywrightTestCase,
} from '../utils/playwrightReportParser';

function fmt(ms: number) {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.floor(ms / 60000)}m ${Math.round((ms % 60000) / 1000)}s`;
}

const STATUS_ICON: Record<PlaywrightTestCase['status'], React.ReactNode> = {
  passed: <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />,
  failed: <XCircle size={14} className="text-rose-500 shrink-0" />,
  skipped: <SkipForward size={14} className="text-gray-400 shrink-0" />,
  flaky: <AlertTriangle size={14} className="text-amber-500 shrink-0" />,
  unknown: <AlertTriangle size={14} className="text-amber-500 shrink-0" />,
};

const FILTER_OPTIONS: {
  id: PlaywrightReportFilter;
  label: string;
  countKey: 'total' | 'passed' | 'failed' | 'skipped' | 'flaky' | 'suites';
  activeClass: string;
}[] = [
  { id: 'all', label: 'All', countKey: 'total', activeClass: 'border-gray-900 bg-gray-900 text-white' },
  { id: 'passed', label: 'Passed', countKey: 'passed', activeClass: 'border-emerald-600 bg-emerald-50 text-emerald-700' },
  { id: 'failed', label: 'Failed', countKey: 'failed', activeClass: 'border-rose-600 bg-rose-50 text-rose-700' },
  { id: 'skipped', label: 'Skipped', countKey: 'skipped', activeClass: 'border-gray-500 bg-gray-100 text-gray-700' },
  { id: 'flaky', label: 'Flaky', countKey: 'flaky', activeClass: 'border-amber-500 bg-amber-50 text-amber-700' },
  { id: 'suites', label: 'Suites', countKey: 'suites', activeClass: 'border-blue-600 bg-blue-50 text-blue-700' },
];

const TestCaseRow: React.FC<{
  testCase: PlaywrightTestCase;
  onScreenshotClick: () => void;
}> = ({ testCase, onScreenshotClick }) => {
  const [open, setOpen] = useState(
    (testCase.status === 'failed' || testCase.status === 'flaky') && Boolean(testCase.error),
  );

  const screenshotUrl = testCase.error?.screenshot
    ? resolvePlaywrightHealthUrl(testCase.error.screenshot)
    : undefined;
  const traceUrl = testCase.traceUrl || testCase.error?.traceUrl;
  const resolvedTraceUrl = traceUrl ? resolvePlaywrightHealthUrl(traceUrl) : undefined;

  return (
    <div className="border-b border-gray-100 last:border-b-0">
      <button
        type="button"
        className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
        onClick={() => testCase.error && setOpen(!open)}
      >
        {STATUS_ICON[testCase.status]}
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-gray-900">{testCase.title}</div>
          <div className="text-xs text-gray-500 mt-0.5 font-mono truncate">
            {testCase.specFile}
            {testCase.line ? `:${testCase.line}` : ''}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {testCase.project && (
            <span className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
              {testCase.project}
            </span>
          )}
          {typeof testCase.retries === 'number' && testCase.retries > 0 && (
            <span className="text-[10px] text-gray-500">{testCase.retries} retry</span>
          )}
          <span className="text-xs text-gray-500 tabular-nums">
            {testCase.durationMs > 0 ? fmt(testCase.durationMs) : '—'}
          </span>
          {testCase.error && (
            open ? <ChevronDown size={14} className="text-gray-400" /> : <ChevronRight size={14} className="text-gray-400" />
          )}
        </div>
      </button>

      {open && testCase.error && (
        <div className="px-4 pb-3 space-y-2">
          <pre className="text-xs font-mono text-rose-700 whitespace-pre-wrap bg-rose-50 border border-rose-200 rounded-lg p-3">
            {testCase.error.message}
          </pre>
          {testCase.error.stack && (
            <details>
              <summary className="text-xs text-gray-500 cursor-pointer">Stack trace</summary>
              <pre className="text-xs font-mono text-gray-600 mt-1 whitespace-pre-wrap">{testCase.error.stack}</pre>
            </details>
          )}
          <div className="flex flex-wrap gap-3">
            {screenshotUrl && (
              <a
                href={screenshotUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
              >
                <Camera size={12} />
                View screenshot
              </a>
            )}
            {resolvedTraceUrl && (
              <a
                href={resolvedTraceUrl}
                target="_blank"
                rel="noreferrer"
                download
                className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
              >
                <Film size={12} />
                Download trace
              </a>
            )}
          </div>
          {screenshotUrl && (
            <button
              type="button"
              onClick={onScreenshotClick}
              className="block hover:ring-2 hover:ring-indigo-100 rounded-lg transition-all cursor-zoom-in"
              aria-label={`View full-size screenshot for ${testCase.title}`}
              title="Click to view full size"
            >
              <img
                src={screenshotUrl}
                alt={`Screenshot for ${testCase.title}`}
                className="max-h-48 rounded-lg border border-gray-200"
              />
            </button>
          )}
        </div>
      )}
    </div>
  );
};

interface PlaywrightReportPanelProps {
  run: TestRun;
  moduleTestSuites?: string[];
  filter?: PlaywrightReportFilter;
  onFilterChange?: (filter: PlaywrightReportFilter) => void;
}

const PlaywrightReportPanel: React.FC<PlaywrightReportPanelProps> = ({
  run,
  moduleTestSuites,
  filter: controlledFilter,
  onFilterChange,
}) => {
  const [internalFilter, setInternalFilter] = useState<PlaywrightReportFilter>('all');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const filter = controlledFilter ?? internalFilter;

  const setFilter = (next: PlaywrightReportFilter) => {
    if (controlledFilter === undefined) {
      setInternalFilter(next);
    }
    onFilterChange?.(next);
  };
  const [search, setSearch] = useState('');
  const [expandedSpecs, setExpandedSpecs] = useState<Record<string, boolean>>({});

  const report = useMemo(
    () => buildPlaywrightReport(run, { moduleTestSuites }),
    [run, moduleTestSuites],
  );

  const filtered = useMemo(() => {
    if (!report) return { testCases: [], specGroups: [] };
    return filterPlaywrightReport(report, filter, search);
  }, [report, filter, search]);

  // Flat, visually-ordered list of every screenshot currently on screen (across suite groups or
  // the flat test list, whichever is active) so the lightbox can arrow-key through all of them.
  const screenshotList = useMemo(() => {
    const source = filter === 'suites'
      ? filtered.specGroups.flatMap((group) => group.tests)
      : filtered.testCases;
    return source
      .map((testCase) => ({
        id: testCase.id,
        title: testCase.title,
        url: testCase.error?.screenshot ? resolvePlaywrightHealthUrl(testCase.error.screenshot) : undefined,
      }))
      .filter((item): item is { id: string; title: string; url: string } => Boolean(item.url));
  }, [filter, filtered]);

  const screenshotIndexById = useMemo(
    () => new Map(screenshotList.map((item, position) => [item.id, position])),
    [screenshotList],
  );

  const handleScreenshotClick = (testCaseId: string) => {
    const position = screenshotIndexById.get(testCaseId);
    if (position != null) setLightboxIndex(position);
  };

  if (!report || report.summary.total === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-8 text-center text-sm text-gray-500">
        No structured Playwright report available for this run.
      </div>
    );
  }

  const toggleSpec = (specFile: string) => {
    setExpandedSpecs((prev) => ({ ...prev, [specFile]: !prev[specFile] }));
  };

  const reportUrl = report.reportUrl ? resolvePlaywrightHealthUrl(report.reportUrl) : '';

  return (
    <div className={`${tw.rounded} border border-gray-200 bg-white overflow-hidden`}>
      <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h4 className="text-sm font-semibold text-gray-800">Playwright report</h4>
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span>Total time: {fmt(report.summary.durationMs)}</span>
            {reportUrl && (
              <a
                href={reportUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700"
              >
                Open HTML report
                <ExternalLink size={12} />
              </a>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {FILTER_OPTIONS.map((option) => {
            const count = report.summary[option.countKey];
            if (option.id === 'flaky' && count === 0) {
              return null;
            }
            const isActive = filter === option.id;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => setFilter(option.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
                  isActive
                    ? option.activeClass
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                }`}
              >
                {option.label}
                <span className="tabular-nums">({count})</span>
              </button>
            );
          })}
        </div>

        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search tests…"
        />
      </div>

      <div className="max-h-[480px] overflow-y-auto">
        {filter === 'suites' ? (
          filtered.specGroups.length === 0 ? (
            <div className="py-10 text-center text-sm text-gray-500">No suites match your filters.</div>
          ) : (
            filtered.specGroups.map((group) => {
              const isOpen = expandedSpecs[group.specFile] ?? true;
              return (
                <div key={group.specFile} className="border-b border-gray-200 last:border-b-0">
                  <button
                    type="button"
                    className="w-full flex items-center gap-3 px-4 py-3 bg-white hover:bg-gray-50 text-left"
                    onClick={() => toggleSpec(group.specFile)}
                  >
                    {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    <FileCode2 size={16} className="text-gray-500 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-gray-900 truncate font-mono">
                        {group.specFile}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        <span className="text-emerald-600">{group.passed} passed</span>
                        {' · '}
                        <span className="text-rose-600">{group.failed} failed</span>
                        {group.skipped > 0 && (
                          <>
                            {' · '}
                            <span>{group.skipped} skipped</span>
                          </>
                        )}
                        {group.flaky > 0 && (
                          <>
                            {' · '}
                            <span className="text-amber-600">{group.flaky} flaky</span>
                          </>
                        )}
                      </div>
                    </div>
                    <span className="text-xs text-gray-500">{fmt(group.durationMs)}</span>
                  </button>
                  {isOpen && (
                    <div className="bg-gray-50/60">
                      {group.tests.map((testCase) => (
                        <TestCaseRow
                          key={testCase.id}
                          testCase={testCase}
                          onScreenshotClick={() => handleScreenshotClick(testCase.id)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )
        ) : filtered.testCases.length === 0 ? (
          <div className="py-10 text-center text-sm text-gray-500">No tests match your filters.</div>
        ) : (
          filtered.testCases.map((testCase) => (
            <TestCaseRow
              key={testCase.id}
              testCase={testCase}
              onScreenshotClick={() => handleScreenshotClick(testCase.id)}
            />
          ))
        )}
      </div>

      <ImageLightbox
        images={screenshotList.map((item) => ({
          src: item.url,
          alt: `Screenshot for ${item.title}`,
          downloadHref: item.url,
        }))}
        index={lightboxIndex}
        onClose={() => setLightboxIndex(null)}
        onNavigate={setLightboxIndex}
      />
    </div>
  );
};

export default PlaywrightReportPanel;
