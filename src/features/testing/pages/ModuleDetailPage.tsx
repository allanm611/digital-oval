import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Activity, Bell, Brain, Clock, Edit, FileText, Loader2, Play, Settings, Trash2,
} from 'lucide-react';
import OutlinedActionButton from '../../../shared/components/ui/OutlinedActionButton';
import { tw } from '../../../shared/utils/utils';
import HealthModuleBreadcrumb, {
  healthCheckListCrumb,
  healthCheckModuleCrumb,
} from '../components/HealthModuleBreadcrumb';
import { useModuleById } from '../hooks/useModuleById';
import { useDeleteModule, useTriggerRun } from '../hooks/useHealthStatus';
import { useToast } from '../../../contexts/ToastContext';
import { HealthApiError } from '../services/healthApi';
import { cronToHuman } from '../utils/cronUtils';
import type { TestStatus } from '../types/health';

const HEALTH_CHECK_LIST_PATH = '/dashboard/health-check';

const STATUS_STYLES: Record<TestStatus, string> = {
  pass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  fail: 'bg-rose-50 text-rose-700 border-rose-200',
  running: 'bg-blue-50 text-blue-700 border-blue-200',
  unknown: 'bg-amber-50 text-amber-700 border-amber-200',
  skipped: 'bg-gray-50 text-gray-600 border-gray-200',
};

function formatRelativeTime(isoString: string | null): string {
  if (!isoString) return 'Never';
  const diff = Date.now() - new Date(isoString).getTime();
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}

function DetailField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</dt>
      <dd className="mt-1 text-sm text-gray-900 break-words">{value}</dd>
    </div>
  );
}

export default function ModuleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const { module, isLoading, isNotFound } = useModuleById(id);
  const triggerRun = useTriggerRun();
  const deleteModule = useDeleteModule();

  const handleRunNow = async () => {
    if (!module) return;
    try {
      const run = await triggerRun.mutateAsync({
        moduleId: module.id,
        baseUrl: module.baseUrl,
      });
      toast.success(
        run.status === 'running' ? 'Run queued' : 'Run started',
        run.status === 'running'
          ? 'The module was submitted to the worker queue.'
          : 'The module has been submitted for execution.',
      );
      navigate(
        `/dashboard/health-check/${module.id}/logs${run.id ? `?runId=${run.id}` : ''}`,
      );
    } catch (err) {
      const message = (err as Error)?.message ?? 'See console for details.';
      if (err instanceof HealthApiError && (err.status === 401 || err.status === 400)) {
        toast.error('Cannot run tests', message);
      } else {
        toast.error('Run failed', message);
      }
    }
  };

  const handleDelete = async () => {
    if (!module) return;
    if (!window.confirm(`Delete "${module.name}"? This cannot be undone.`)) return;
    try {
      await deleteModule.mutateAsync(module.id);
      toast.success('Deleted', 'Module removed successfully.');
      navigate(HEALTH_CHECK_LIST_PATH);
    } catch (err) {
      toast.error('Delete failed', (err as Error)?.message ?? 'See console for details.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-gray-500 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <p className="text-sm">Loading module…</p>
      </div>
    );
  }

  if (isNotFound || !module) {
    return (
      <div className="space-y-4">
        <HealthModuleBreadcrumb
          items={[healthCheckListCrumb(), { label: 'Module Details' }]}
        />
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-6 text-amber-800">
          <p className="font-medium">Module not found</p>
          <p className="text-sm mt-1">It may have been deleted or the link is invalid.</p>
        </div>
      </div>
    );
  }

  const lastRun = module.lastRun;
  const suites = lastRun?.suites ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-3">
          <HealthModuleBreadcrumb
            items={[healthCheckListCrumb(), { label: module.name }]}
          />
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{module.name}</h1>
              <span
                className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize ${
                  STATUS_STYLES[module.status]
                }`}
              >
                {module.status}
              </span>
              {!module.active && (
                <span className="inline-flex items-center rounded-full border border-gray-200 bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
                  Paused
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {module.description || 'No description provided.'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <OutlinedActionButton
            icon={<Brain className="w-4 h-4" />}
            onClick={() => navigate('/dashboard/health-check/insights')}
          >
            AI Insights
          </OutlinedActionButton>
          <button
            type="button"
            onClick={() => navigate(`/dashboard/health-check/${module.id}/edit`)}
            className={`${tw.button} inline-flex items-center gap-2 px-4 py-2 text-sm`}
          >
            <Edit className="w-4 h-4" />
            Edit
          </button>
          <OutlinedActionButton
            icon={<Settings className="w-4 h-4" />}
            onClick={() => navigate(`/dashboard/health-check/${module.id}/schedule`)}
          >
            Schedule
          </OutlinedActionButton>
          <OutlinedActionButton
            icon={<FileText className="w-4 h-4" />}
            onClick={() => navigate(`/dashboard/health-check/${module.id}/logs`)}
          >
            Logs
          </OutlinedActionButton>
          <button
            type="button"
            onClick={handleRunNow}
            disabled={triggerRun.isPending}
            className={`${tw.button} inline-flex items-center gap-2 px-4 py-2 text-sm disabled:opacity-60`}
          >
            {triggerRun.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-4 h-4" />
            )}
            Run now
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleteModule.isPending}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm border border-rose-200 rounded-md text-rose-600 hover:bg-rose-50 disabled:opacity-60"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm lg:col-span-2 space-y-5`}>
          <h2 className="text-lg font-semibold text-gray-900">Configuration</h2>
          <dl className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <DetailField label="Module ID" value={<code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">{module.id}</code>} />
            <DetailField label="Base URL" value={module.baseUrl || '—'} />
            <DetailField label="Schedule" value={cronToHuman(module.cron)} />
            <DetailField
              label="Monitoring"
              value={module.active ? 'Enabled' : 'Paused'}
            />
            <DetailField
              label="Test suites"
              value={
                module.testSuites?.length
                  ? `${module.testSuites.length} selected`
                  : 'None'
              }
            />
            <DetailField
              label="Tags"
              value={
                module.tags?.length ? (
                  <div className="flex flex-wrap gap-1.5">
                    {module.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex rounded-md border border-gray-200 bg-gray-50 px-2 py-0.5 text-xs text-gray-600"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                ) : (
                  '—'
                )
              }
            />
          </dl>

          {module.testSuites?.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Selected suites</h3>
              <div className="flex flex-wrap gap-2">
                {module.testSuites.map((suite) => (
                  <span
                    key={suite}
                    className="inline-flex rounded-md border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-mono text-gray-700"
                  >
                    {suite}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm space-y-4`}>
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Activity className="w-5 h-5 text-gray-400" />
              Health
            </h2>
            <dl className="space-y-4">
              <DetailField label="Success rate" value={`${module.successRate}%`} />
              <DetailField label="Consecutive failures" value={module.consecutiveFailures} />
              <DetailField label="Last run" value={formatRelativeTime(lastRun?.startedAt ?? null)} />
              <DetailField
                label="Next scheduled"
                value={module.nextScheduled ? new Date(module.nextScheduled).toLocaleString() : '—'}
              />
            </dl>
          </div>

          <div className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm space-y-4`}>
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Bell className="w-5 h-5 text-gray-400" />
              Notifications
            </h2>
            <dl className="space-y-4">
              <DetailField
                label="Alert on failure"
                value={module.notifyOnFailure ? 'Enabled' : 'Disabled'}
              />
              <DetailField
                label="Recipients"
                value={
                  module.notifyEmails?.length
                    ? module.notifyEmails.join(', ')
                    : 'None'
                }
              />
              <DetailField
                label="Performance threshold"
                value={`${module.thresholds?.performanceMs ?? 2000}ms`}
              />
              <DetailField
                label="Max failures before alert"
                value={module.thresholds?.maxFailures ?? 3}
              />
            </dl>
          </div>
        </div>
      </div>

      {lastRun && (
        <div className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm space-y-4`}>
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-gray-400" />
              Latest run
            </h2>
            <button
              type="button"
              onClick={() => navigate(`/dashboard/health-check/${module.id}/logs?runId=${lastRun.id}`)}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              View in logs
            </button>
          </div>
          <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <DetailField label="Status" value={<span className="capitalize">{lastRun.status}</span>} />
            <DetailField label="Triggered by" value={lastRun.triggeredBy} />
            <DetailField label="Duration" value={`${lastRun.durationMs}ms`} />
            <DetailField label="Suites" value={suites.length} />
          </dl>
        </div>
      )}
    </div>
  );
}
