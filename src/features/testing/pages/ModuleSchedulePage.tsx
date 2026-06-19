import { useNavigate, useParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { navigateBackOrFallback } from '../../../shared/utils/navigation';
import { useModuleById } from '../hooks/useModuleById';
import ScheduleFormContent from '../components/ScheduleFormContent';
import HealthModuleBreadcrumb, {
  healthCheckListCrumb,
  healthCheckModuleCrumb,
} from '../components/HealthModuleBreadcrumb';

const HEALTH_CHECK_LIST_PATH = '/dashboard/health-check';

export default function ModuleSchedulePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { module, isLoading, isNotFound } = useModuleById(id);

  const moduleDetailPath = id ? `/dashboard/health-check/${id}` : HEALTH_CHECK_LIST_PATH;

  const handleBack = () => {
    if (id) {
      navigate(moduleDetailPath);
      return;
    }
    navigateBackOrFallback(navigate, HEALTH_CHECK_LIST_PATH);
  };

  const handleSaved = () => {
    navigate(moduleDetailPath);
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
          items={[healthCheckListCrumb(), { label: 'Configure Schedule' }]}
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
          { label: 'Configure Schedule' },
        ]}
      />

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configure Schedule</h1>
        <p className="text-sm text-gray-500 mt-1">
          {module.name} — cron, test suites, notifications, and thresholds.
        </p>
      </div>

      <ScheduleFormContent
        module={module}
        onCancel={handleBack}
        onSaved={handleSaved}
      />
    </div>
  );
}
