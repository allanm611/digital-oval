import { useParams, useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useModuleById } from '../hooks/useModuleById';
import TestLogViewerContent from '../components/TestLogViewerContent';
import HealthModuleBreadcrumb, {
  healthCheckListCrumb,
  healthCheckModuleCrumb,
} from '../components/HealthModuleBreadcrumb';

export default function ModuleLogsPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { module, isLoading, isNotFound, isError } = useModuleById(id);

  const selectedRunId = searchParams.get('runId');

  const handleSelectRun = (runId: string) => {
    setSearchParams({ runId }, { replace: true });
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
          items={[healthCheckListCrumb(), { label: 'Run Logs' }]}
        />
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-6 text-amber-800">
          <p className="font-medium">Module not found</p>
          <p className="text-sm mt-1">
            {id
              ? `No module with id "${id}" was found. It may have been deleted or the link is invalid.`
              : 'No module id was provided in the URL.'}
          </p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-4">
        <HealthModuleBreadcrumb
          items={[healthCheckListCrumb(), { label: 'Run Logs' }]}
        />
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-6 text-rose-800">
          <p className="font-medium">Unable to load module</p>
          <p className="text-sm mt-1">
            The health-check service may be unavailable. Try refreshing or return to the dashboard.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <HealthModuleBreadcrumb
        items={[
          healthCheckListCrumb(),
          healthCheckModuleCrumb(module.id, module.name),
          { label: 'Run Logs' },
        ]}
      />

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Run Logs</h1>
        <p className="text-sm text-gray-500 mt-1">
          {module.name} — browse run history, Playwright report, and raw output.
        </p>
      </div>

      <TestLogViewerContent
        module={module}
        selectedRunId={selectedRunId}
        onSelectRun={handleSelectRun}
      />
    </div>
  );
}
