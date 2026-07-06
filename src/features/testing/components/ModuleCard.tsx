import React from 'react';
import {
  Activity, CheckCircle2, Clock, Edit, Eye, FileText, HelpCircle,
  Loader2, Play, Settings, SkipForward, Trash2, XCircle,
} from 'lucide-react';
import { tw } from '../../../shared/utils/utils';
import type { ModuleStatus, TestStatus } from '../types/health';
import { cronToHuman } from '../utils/cronUtils';

interface ModuleCardProps {
  module: ModuleStatus;
  viewMode: 'grid' | 'list';
  onViewDetails: () => void;
  onEdit: () => void;
  onRunNow: () => void;
  onViewLogs: () => void;
  onSchedule: () => void;
  isTriggering: boolean;
  onDelete?: () => void;
}

const STATUS_CONFIG: Record<
  TestStatus,
  { label: string; badge: string; border: string }
> = {
  pass:    { label: 'Passing',  badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', border: 'border-l-emerald-500' },
  fail:    { label: 'Failing',  badge: 'bg-rose-50 text-rose-700 border-rose-200', border: 'border-l-rose-500' },
  running: { label: 'Running',  badge: 'bg-blue-50 text-blue-700 border-blue-200', border: 'border-l-blue-500' },
  unknown: { label: 'Unknown',  badge: 'bg-amber-50 text-amber-700 border-amber-200', border: 'border-l-amber-500' },
  skipped: { label: 'Skipped',  badge: 'bg-gray-50 text-gray-600 border-gray-200', border: 'border-l-gray-400' },
};

const STATUS_ICON: Record<TestStatus, React.ReactNode> = {
  pass:    <CheckCircle2 size={14} className="text-emerald-500" />,
  fail:    <XCircle size={14} className="text-rose-500" />,
  running: <Loader2 size={14} className="text-blue-500 animate-spin" />,
  unknown: <HelpCircle size={14} className="text-amber-500" />,
  skipped: <SkipForward size={14} className="text-gray-400" />,
};

function formatRelativeTime(isoString: string | null): string {
  if (!isoString) return 'Never';
  const diff = Date.now() - new Date(isoString).getTime();
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}

const IconAction: React.FC<{
  title: string;
  onClick: () => void;
  children: React.ReactNode;
  danger?: boolean;
  disabled?: boolean;
}> = ({ title, onClick, children, danger, disabled }) => (
  <button
    type="button"
    title={title}
    onClick={onClick}
    disabled={disabled}
    className={`p-2 ${tw.rounded} transition-colors disabled:opacity-50 ${
      danger
        ? 'text-rose-600 hover:bg-rose-50'
        : 'icon-edit text-gray-600 hover:text-gray-900 hover:bg-gray-100'
    }`}
  >
    {children}
  </button>
);

const ModuleCard: React.FC<ModuleCardProps> = ({
  module,
  viewMode,
  onViewDetails,
  onEdit,
  onRunNow,
  onViewLogs,
  onSchedule,
  isTriggering,
  onDelete,
}) => {
  const statusCfg = STATUS_CONFIG[module.status] ?? STATUS_CONFIG.unknown;
  const isRunning = module.status === 'running' || isTriggering;
  const lastRun = module.lastRun;
  const totalPassed = module.lastRunStats?.passed ?? 0;
  const totalFailed = module.lastRunStats?.failed ?? 0;

  const actionIcons = (
    <>
      <IconAction title="View details" onClick={onViewDetails}>
        <Eye className="w-4 h-4" />
      </IconAction>
      <IconAction title="Edit module" onClick={onEdit}>
        <Edit className="w-4 h-4" />
      </IconAction>
      <IconAction title="View logs" onClick={onViewLogs}>
        <FileText className="w-4 h-4" />
      </IconAction>
      <IconAction title="Configure schedule" onClick={onSchedule}>
        <Settings className="w-4 h-4" />
      </IconAction>
      {onDelete && (
        <IconAction title="Delete module" onClick={onDelete} danger>
          <Trash2 className="w-4 h-4" />
        </IconAction>
      )}
      <IconAction title="Run now" onClick={onRunNow} disabled={isRunning}>
        {isRunning ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Play className="w-4 h-4" />
        )}
      </IconAction>
    </>
  );

  if (viewMode === 'list') {
    return (
      <div
        className={`${tw.rounded} border border-gray-200 bg-white shadow-sm border-l-4 ${statusCfg.border} px-4 py-3`}
      >
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {STATUS_ICON[module.status]}
            <div className="min-w-0">
              <button
                type="button"
                onClick={onViewDetails}
                className="text-sm font-semibold text-gray-900 hover:text-blue-600 truncate text-left"
              >
                {module.name}
              </button>
              <p className="text-xs text-gray-500 truncate">
                {cronToHuman(module.cron)} · Last run {formatRelativeTime(lastRun?.startedAt ?? null)}
              </p>
            </div>
            <span className={`hidden sm:inline-flex rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${statusCfg.badge}`}>
              {statusCfg.label}
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs shrink-0">
            <span className="text-emerald-600 font-medium">✓ {totalPassed}</span>
            <span className="text-rose-600 font-medium">✗ {totalFailed}</span>
            <span className="text-gray-500">{module.successRate}%</span>
          </div>

          <div className="flex items-center justify-end gap-1">{actionIcons}</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${tw.rounded} border border-gray-200 bg-white shadow-sm overflow-hidden flex flex-col`}>
      {!module.active && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70 backdrop-blur-[1px]">
          <span className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-semibold text-gray-600">
            Paused
          </span>
        </div>
      )}

      <div className={`border-l-4 ${statusCfg.border} p-5 flex flex-col gap-4 flex-1`}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <button
              type="button"
              onClick={onViewDetails}
              className="text-left text-base font-semibold text-gray-900 hover:text-blue-600 line-clamp-1"
            >
              {module.name}
            </button>
            <p className="text-sm text-gray-500 mt-1 line-clamp-2">
              {module.description || 'No description'}
            </p>
          </div>
          <span className={`inline-flex shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize ${statusCfg.badge}`}>
            {statusCfg.label}
          </span>
        </div>

        <div className="grid grid-cols-4 gap-2 text-center">
          {[
            { label: 'Passed', value: totalPassed, color: 'text-emerald-600' },
            { label: 'Failed', value: totalFailed, color: 'text-rose-600' },
            { label: 'Rate', value: `${module.successRate}%`, color: 'text-gray-700' },
            { label: 'Last', value: formatRelativeTime(lastRun?.startedAt ?? null), color: 'text-gray-600 text-xs' },
          ].map((metric) => (
            <div key={metric.label} className="rounded-lg bg-gray-50 px-2 py-2">
              <div className={`text-sm font-bold ${metric.color}`}>{metric.value}</div>
              <div className="text-[10px] text-gray-500 mt-0.5">{metric.label}</div>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
          <span className="inline-flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {cronToHuman(module.cron)}
          </span>
          <span className="inline-flex items-center gap-1">
            <Activity className="w-3.5 h-3.5" />
            {module.testSuites?.length ?? 0} suites
          </span>
          {module.consecutiveFailures > 0 && (
            <span className="text-rose-600 font-medium">
              {module.consecutiveFailures} consecutive failures
            </span>
          )}
        </div>

        <div className="mt-auto pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1">{actionIcons}</div>
        </div>
      </div>
    </div>
  );
};

export default ModuleCard;
