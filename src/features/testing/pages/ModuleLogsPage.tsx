import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { navigateBackOrFallback } from '../../../shared/utils/navigation';
import { useModuleById } from '../hooks/useModuleById';
import TestLogViewerContent from '../components/TestLogViewerContent';
import HealthModuleBreadcrumb, {
  healthCheckListCrumb,
  healthCheckModuleCrumb,
} from '../components/HealthModuleBreadcrumb';

import { HEALTH_CHECK_BASE, healthCheckModulePath } from '../constants/routes';

export default function ModuleLogsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { module, isLoading, isNotFound } = useModuleById(id);

  const selectedRunId = searchParams.get('runId');
  const moduleDetailPath = id ? healthCheckModulePath(id) : HEALTH_CHECK_BASE;

  const handleBack = () => {
    if (id) {
      navigate(moduleDetailPath);
      return;
    }
    navigateBackOrFallback(navigate, HEALTH_CHECK_BASE);
  };

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
          <p className="text-sm mt-1">It may have been deleted or the link is invalid.</p>
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
