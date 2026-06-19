import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2, XCircle, Loader2, Clock, ChevronDown, ChevronRight,
  Camera, Code2, GitMerge, Eye, Activity, Zap, Shield,
  AlertTriangle, SkipForward, Download, Brain,
} from 'lucide-react';
import { tw } from '../../../shared/utils/utils';
import OutlinedActionButton from '../../../shared/components/ui/OutlinedActionButton';
import { useRunHistory, useRunDetail } from '../hooks/useHealthStatus';
import type { ModuleStatus, TestRun, TestSuiteResult, TestStatus } from '../types/health';

const STATUS_ICON: Record<TestStatus, React.ReactNode> = {
  pass:    <CheckCircle2 size={14} className="text-emerald-500" />,
  fail:    <XCircle size={14} className="text-rose-500" />,
  running: <Loader2 size={14} className="text-blue-500 animate-spin" />,
  unknown: <AlertTriangle size={14} className="text-amber-500" />,
  skipped: <SkipForward size={14} className="text-gray-400" />,
};

const TYPE_ICON: Record<string, React.ReactNode> = {
  unit:          <Code2 size={12} />,
  integration:   <GitMerge size={12} />,
  e2e:           <Eye size={12} />,
  regression:    <Activity size={12} />,
  performance:   <Zap size={12} />,
  smoke:         <Activity size={12} />,
  security:      <Shield size={12} />,
  accessibility: <Eye size={12} />,
  errorHandling: <AlertTriangle size={12} />,
};

const TYPE_COLOR: Record<string, string> = {
  unit: 'text-violet-500',
  integration: 'text-blue-500',
  e2e: 'text-emerald-500',
  regression: 'text-amber-500',
  performance: 'text-orange-500',
  smoke: 'text-cyan-500',
  security: 'text-red-500',
  accessibility: 'text-purple-500',
  errorHandling: 'text-pink-500',
};

function fmt(ms: number) {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.floor(ms / 60000)}m ${Math.round((ms % 60000) / 1000)}s`;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

const tryFormatMeta = (meta: unknown): string | null => {
  if (meta == null) return null;
  if (typeof meta === 'string') return meta;
  try { return JSON.stringify(meta, null, 2); }
  catch { return String(meta); }
};

const SuiteRow: React.FC<{ suite: TestSuiteResult; index: number }> = ({ suite }) => {
  const [open, setOpen] = useState(false);
  const errors = Array.isArray(suite.errors) ? suite.errors : [];
  const hasErrors = errors.length > 0;

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
      <button
        type="button"
        className="w-full flex items-center justify-between gap-3 px-3 py-2.5 hover:bg-gray-50 transition-colors"
        onClick={() => hasErrors && setOpen(!open)}
      >
        <div className="flex items-center gap-2">
          <span className={TYPE_COLOR[suite.type] ?? 'text-gray-400'}>
            {TYPE_ICON[suite.type] ?? <Code2 size={12} />}
          </span>
          <span className="text-sm font-medium text-gray-800 capitalize">{suite.type}</span>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="text-emerald-600">✓ {suite.passed}</span>
          <span className="text-rose-600">✗ {suite.failed}</span>
          {suite.skipped > 0 && <span className="text-gray-500">○ {suite.skipped}</span>}
          <span className="text-gray-500">{fmt(suite.duration)}</span>
          {STATUS_ICON[suite.status]}
          {hasErrors && (open ? <ChevronDown size={13} /> : <ChevronRight size={13} />)}
        </div>
      </button>

      {open && hasErrors && (
        <div className="border-t border-gray-200 bg-gray-50 p-3 space-y-2">
          {errors.map((err, index) => (
            <div key={index} className="rounded-lg border border-rose-200 bg-white p-3">
              <div className="flex items-center gap-2 mb-1">
                <XCircle size={12} className="text-rose-500" />
                <span className="text-xs font-semibold text-gray-800">{err.test}</span>
              </div>
              <pre className="text-xs text-rose-700 whitespace-pre-wrap font-mono">{err.message}</pre>
              {err.stack && (
                <details className="mt-2">
                  <summary className="text-xs text-gray-500 cursor-pointer">Stack trace</summary>
                  <pre className="text-xs text-gray-600 mt-1 whitespace-pre-wrap font-mono">{err.stack}</pre>
                </details>
              )}
              {err.screenshot && (
                <a
                  href={err.screenshot}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-blue-600 mt-2"
                >
                  <Camera size={11} /> View screenshot
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const RunItem: React.FC<{
  run: TestRun;
  selected: boolean;
  onSelect: () => void;
}> = ({ run, selected, onSelect }) => {
  const passed = run.suites.reduce((sum, suite) => sum + suite.passed, 0);
  const failed = run.suites.reduce((sum, suite) => sum + suite.failed, 0);

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 text-left transition-colors border-l-4 ${
        selected
          ? 'bg-blue-50 border-l-blue-600'
          : 'border-l-transparent hover:bg-gray-50'
      }`}
    >
      <div className="flex items-center gap-2 min-w-0">
        {STATUS_ICON[run.status]}
        <div className="min-w-0">
          <div className="text-sm font-medium text-gray-900 truncate">{fmtDate(run.startedAt)}</div>
          <div className="text-xs text-gray-500 truncate">
            by {run.triggeredBy} · {fmt(run.durationMs)}
          </div>
        </div>
      </div>
      <div className="flex gap-2 text-xs shrink-0">
        <span className="text-emerald-600">{passed}p</span>
        <span className="text-rose-600">{failed}f</span>
      </div>
    </button>
  );
};

interface TestLogViewerContentProps {
  module: ModuleStatus;
  selectedRunId?: string | null;
  onSelectRun?: (runId: string) => void;
}

const TestLogViewerContent: React.FC<TestLogViewerContentProps> = ({
  module,
  selectedRunId: controlledRunId,
  onSelectRun,
}) => {
  const navigate = useNavigate();
  const [internalRunId, setInternalRunId] = useState<string | null>(controlledRunId ?? null);

  const selectedRunId = controlledRunId !== undefined ? controlledRunId : internalRunId;

  useEffect(() => {
    if (controlledRunId !== undefined) {
      setInternalRunId(controlledRunId);
    }
  }, [controlledRunId]);

  const { data: runs, isLoading: historyLoading } = useRunHistory(module.id);
  const { data: runDetail, isLoading: detailLoading } = useRunDetail(selectedRunId);

  const selectedRun: TestRun | null = selectedRunId
    ? runDetail ?? (runs?.find((run) => run.id === selectedRunId) ?? null)
    : null;

  const handleSelectRun = (runId: string) => {
    if (controlledRunId === undefined) {
      setInternalRunId(runId);
    }
    onSelectRun?.(runId);
  };

  const exportLog = () => {
    if (!selectedRun) return;
    const blob = new Blob([JSON.stringify(selectedRun, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `run-${selectedRun.id}-${module.id}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const openAiInsights = () => {
    if (!selectedRunId) return;
    navigate(`/dashboard/health-check/insights?runId=${selectedRunId}&tab=analysis`);
  };

  const metaText = tryFormatMeta(selectedRun?.meta);
  const suites = selectedRun?.suites ?? [];

  return (
    <div className={`${tw.rounded} border border-gray-200 bg-white shadow-sm overflow-hidden`}>
      <div className="flex flex-col lg:flex-row min-h-[520px]">
        <aside className="w-full lg:w-72 border-b lg:border-b-0 lg:border-r border-gray-200 flex flex-col">
          <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
            <h3 className="text-sm font-semibold text-gray-700">Run history</h3>
          </div>
          <div className="flex-1 overflow-y-auto max-h-[320px] lg:max-h-none">
            {historyLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
              </div>
            ) : !runs?.length ? (
              <div className="flex items-center justify-center py-12 text-sm text-gray-500">
                No runs yet
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {runs.map((run) => (
                  <RunItem
                    key={run.id}
                    run={run}
                    selected={selectedRunId === run.id}
                    onSelect={() => handleSelectRun(run.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </aside>

        <div className="flex-1 flex flex-col min-w-0">
          {!selectedRun ? (
            <div className="flex flex-col items-center justify-center flex-1 gap-3 py-16 text-gray-500">
              <Clock size={32} className="text-gray-300" />
              <p className="text-sm">Select a run to view details</p>
            </div>
          ) : detailLoading && !runDetail ? (
            <div className="flex items-center justify-center flex-1 py-16">
              <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
            </div>
          ) : (
            <div className="flex flex-col flex-1 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-200 bg-gray-50">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    {STATUS_ICON[selectedRun.status]}
                    <span className="text-sm font-semibold text-gray-900 capitalize">
                      {selectedRun.status}
                    </span>
                    <span className="text-xs text-gray-500">
                      {fmtDate(selectedRun.startedAt)} · {fmt(selectedRun.durationMs)} · {selectedRun.triggeredBy}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <OutlinedActionButton
                      icon={<Brain className="w-3.5 h-3.5" />}
                      onClick={openAiInsights}
                      className="px-3 py-1.5 text-xs"
                    >
                      AI Insights
                    </OutlinedActionButton>
                    <OutlinedActionButton
                      icon={<Download className="w-3.5 h-3.5" />}
                      onClick={exportLog}
                      className="px-3 py-1.5 text-xs"
                    >
                      Export JSON
                    </OutlinedActionButton>
                  </div>
                </div>

                <div className="flex flex-wrap gap-5 mt-3">
                  {[
                    { label: 'Passed', val: suites.reduce((sum, suite) => sum + suite.passed, 0), color: 'text-emerald-600' },
                    { label: 'Failed', val: suites.reduce((sum, suite) => sum + suite.failed, 0), color: 'text-rose-600' },
                    { label: 'Skipped', val: suites.reduce((sum, suite) => sum + suite.skipped, 0), color: 'text-gray-500' },
                    { label: 'Suites', val: suites.length, color: 'text-gray-600' },
                  ].map((metric) => (
                    <div key={metric.label}>
                      <div className={`text-lg font-bold ${metric.color}`}>{metric.val}</div>
                      <div className="text-xs text-gray-500">{metric.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {suites.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Suite breakdown
                    </h4>
                    {suites.map((suite, index) => (
                      <SuiteRow key={`${suite.type}-${suite.status}-${index}`} suite={suite} index={index} />
                    ))}
                  </div>
                )}

                {(selectedRun.output || selectedRun.errors || metaText) && (
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-4">
                    {selectedRun.output && (
                      <div>
                        <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
                          Raw output
                        </h4>
                        <pre className="text-xs font-mono text-gray-800 whitespace-pre-wrap bg-white border border-gray-200 rounded-lg p-3 overflow-x-auto">
                          {selectedRun.output}
                        </pre>
                      </div>
                    )}
                    {selectedRun.errors && (
                      <div>
                        <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
                          Errors
                        </h4>
                        <pre className="text-xs font-mono text-rose-700 whitespace-pre-wrap bg-white border border-rose-200 rounded-lg p-3 overflow-x-auto">
                          {selectedRun.errors}
                        </pre>
                      </div>
                    )}
                    {metaText && (
                      <div>
                        <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
                          Metadata
                        </h4>
                        <pre className="text-xs font-mono text-gray-800 whitespace-pre-wrap bg-white border border-gray-200 rounded-lg p-3 overflow-x-auto">
                          {metaText}
                        </pre>
                      </div>
                    )}
                  </div>
                )}

                {suites.length === 0 && !selectedRun.output && !selectedRun.errors && (
                  <div className="text-center py-8 text-sm text-gray-500">
                    No detailed output recorded for this run.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TestLogViewerContent;
