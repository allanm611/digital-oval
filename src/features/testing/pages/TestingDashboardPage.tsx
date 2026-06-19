import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity, Bell, Brain, LayoutGrid, List, Loader2, RefreshCw,
} from 'lucide-react';
import BackButton from '../../../shared/components/ui/BackButton';
import SearchInput from '../../../shared/components/ui/SearchInput';
import OutlinedActionButton from '../../../shared/components/ui/OutlinedActionButton';
import FeatureActionButton from '../../../shared/components/FeatureActionButton';
import { tw } from '../../../shared/utils/utils';
import {
  useHealthStatus,
  useTriggerRun,
  useDeleteModule,
} from '../hooks/useHealthStatus';
import { useToast } from '../../../contexts/ToastContext';
import { useAuth } from '../../../contexts/AuthContext';
import ModuleCard from '../components/ModuleCard';
import SummaryBar from '../components/SummaryBar';

type ViewMode = 'grid' | 'list';
type FilterStatus = 'all' | 'pass' | 'fail' | 'unknown' | 'running';

const defaultSummary = { total: 0, passing: 0, failing: 0, running: 0, unknown: 0 };

const FILTER_OPTIONS: { value: FilterStatus; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'pass', label: 'Passing' },
  { value: 'fail', label: 'Failing' },
  { value: 'running', label: 'Running' },
  { value: 'unknown', label: 'Unknown' },
];

const TestingDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { data, isLoading, isError, refetch, isFetching, apiReachable, sseConnected } = useHealthStatus();
  const triggerRun = useTriggerRun();
  const deleteModule = useDeleteModule();
  const toast = useToast();
  const authToastShown = useRef(false);

  const safeSummary = data?.summary ?? defaultSummary;
  const safeModules = data?.modules ?? [];
  const offlineMode = isError && !data;

  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const handleAuthError = (event: Event) => {
      if (authToastShown.current) return;
      authToastShown.current = true;

      const detail = (event as CustomEvent)?.detail as { status?: number } | undefined;
      if (detail?.status === 403) {
        toast.error('Access forbidden', 'You do not have permission to view the testing dashboard.');
      } else if (!isAuthenticated) {
        toast.error('Sign in required', 'Please sign in to access the testing dashboard.');
      } else {
        toast.error(
          'Testing API authentication failed',
          'Your session could not be validated for the health service. Try signing out and back in.',
        );
      }
    };
    window.addEventListener('health:auth-error', handleAuthError);
    return () => window.removeEventListener('health:auth-error', handleAuthError);
  }, [toast, isAuthenticated]);

  useEffect(() => {
    authToastShown.current = false;
  }, [isAuthenticated]);

  const handleRunNow = useCallback(async (moduleId: string) => {
    try {
      await triggerRun.mutateAsync(moduleId);
      toast.success('Run started', 'The module has been submitted for execution.');
    } catch (err) {
      toast.error('Run failed', (err as Error)?.message ?? 'See console for details.');
      console.error('Trigger run failed:', err);
    }
  }, [triggerRun, toast]);

  const handleDelete = useCallback(async (moduleId: string) => {
    try {
      await deleteModule.mutateAsync(moduleId);
      toast.success('Deleted', 'Module removed successfully.');
    } catch (err) {
      toast.error('Delete failed', (err as Error)?.message ?? 'See console for details.');
    }
  }, [deleteModule, toast]);

  const filteredModules = React.useMemo(() => {
    return safeModules.filter((module) => {
      const matchesStatus = filterStatus === 'all' || module.status === filterStatus;
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        module.name.toLowerCase().includes(query) ||
        (module.description?.toLowerCase().includes(query) ?? false);
      return matchesStatus && matchesSearch;
    });
  }, [safeModules, filterStatus, searchQuery]);

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-gray-500">
        <p>Sign in to access the Health Check Dashboard.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-gray-500 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <p className="text-sm">Loading health status…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <BackButton
          showBreadcrumb
          parentLabel="Administration"
          currentLabel="Health Check"
          onClick={() => navigate('/dashboard/administration')}
        />
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => refetch()}
            className={`p-2 icon-edit ${tw.rounded} transition-colors`}
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
          </button>
          <button
            type="button"
            onClick={() => navigate('/dashboard/health-check/notifications')}
            className={`p-2 icon-edit ${tw.rounded} transition-colors`}
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
          </button>
          <OutlinedActionButton
            icon={<Brain className="w-4 h-4" />}
            onClick={() => navigate('/dashboard/health-check/insights')}
          >
            AI Insights
          </OutlinedActionButton>
          <FeatureActionButton
            featureId="health-check"
            action="create"
            label="Add Module"
            onClick={() => navigate('/dashboard/health-check/create')}
          />
        </div>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Health Check Dashboard</h1>
        <p className={`${tw.textSecondary} text-sm mt-1`}>
          Monitor Playwright health modules, schedules, and run outcomes.
          {data?.lastUpdated && (
            <span className="ml-2 text-gray-400">
              Last updated {new Date(data.lastUpdated).toLocaleTimeString()}
            </span>
          )}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {data?.executionMode && (
          <span className="inline-flex items-center rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-gray-600">
            Mode: {data.executionMode}
          </span>
        )}
        <span
          className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${
            sseConnected
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'border-gray-200 bg-white text-gray-600'
          }`}
        >
          {sseConnected ? 'Live updates (SSE)' : 'Polling every 30s'}
        </span>
        <span
          className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${
            apiReachable
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'border-amber-200 bg-amber-50 text-amber-700'
          }`}
        >
          {apiReachable ? 'API reachable' : 'API unavailable'}
        </span>
      </div>

      {offlineMode && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <p className="text-sm text-amber-800">
            Health service unreachable. Ensure playwright-health is mounted at /playwright-health.
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            className="shrink-0 px-4 py-2 text-sm rounded-md bg-amber-600 text-white hover:bg-amber-700"
          >
            Retry
          </button>
        </div>
      )}

      <SummaryBar summary={safeSummary} />

      <div className={`${tw.rounded} border border-gray-200 bg-white p-4 shadow-sm space-y-4`}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
          <div className="flex-1 min-w-0">
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search modules…"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {FILTER_OPTIONS.map((filter) => (
              <button
                key={filter.value}
                type="button"
                onClick={() => setFilterStatus(filter.value)}
                className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
                  filterStatus === filter.value
                    ? 'border-gray-900 bg-gray-900 text-white'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                }`}
              >
                {filter.value === 'all'
                  ? `${filter.label} (${safeModules.length})`
                  : filter.label}
              </button>
            ))}
          </div>

          <div className="inline-flex rounded-md border border-gray-200 p-1 bg-gray-50">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded ${viewMode === 'grid' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}
              title="Grid view"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`p-2 rounded ${viewMode === 'list' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}
              title="List view"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className={viewMode === 'grid'
        ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4'
        : 'flex flex-col gap-3'
      }>
        {offlineMode ? (
          <div className="col-span-full flex flex-col items-center justify-center py-16 text-gray-500 gap-3">
            <Activity className="w-10 h-10 text-gray-300" />
            <p className="text-sm">Backend is not reachable right now.</p>
            <button
              type="button"
              onClick={() => refetch()}
              className={`${tw.button} px-4 py-2 text-sm`}
            >
              Retry
            </button>
          </div>
        ) : filteredModules.length === 0 ? (
          <div className="col-span-full text-center py-16 text-gray-500">
            <p>No modules match your filters.</p>
          </div>
        ) : (
          filteredModules.map((module) => (
            <ModuleCard
              key={module.id}
              module={module}
              viewMode={viewMode}
              onViewDetails={() => navigate(`/dashboard/health-check/${module.id}`)}
              onEdit={() => navigate(`/dashboard/health-check/${module.id}/edit`)}
              onRunNow={() => handleRunNow(module.id)}
              onViewLogs={() => navigate(`/dashboard/health-check/${module.id}/logs`)}
              onSchedule={() => navigate(`/dashboard/health-check/${module.id}/schedule`)}
              isTriggering={triggerRun.isPending && triggerRun.variables === module.id}
              onDelete={() => {
                if (window.confirm(`Delete "${module.name}"? This cannot be undone.`)) {
                  void handleDelete(module.id);
                }
              }}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default TestingDashboardPage;
