import { useNavigate, useParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { navigateBackOrFallback } from '../../../shared/utils/navigation';
import { useToast } from '../../../contexts/ToastContext';
import { useModuleById } from '../hooks/useModuleById';
import { useUpdateModule } from '../hooks/useHealthStatus';
import ModuleForm from '../components/ModuleForm';
import HealthModuleBreadcrumb, {
  healthCheckListCrumb,
  healthCheckModuleCrumb,
} from '../components/HealthModuleBreadcrumb';
import type { ModuleConfig, ModuleUpdate } from '../types/health';

import { HEALTH_CHECK_BASE, healthCheckModulePath } from '../constants/routes';

export default function EditModulePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const { module, isLoading, isNotFound } = useModuleById(id);
  const updateModule = useUpdateModule();

  const handleBack = () => {
    if (id) {
      navigate(healthCheckModulePath(id));
      return;
    }
    navigateBackOrFallback(navigate, HEALTH_CHECK_BASE);
  };

  const handleSubmit = async (payload: Partial<ModuleConfig>) => {
    if (!module) return;

    const updatePayload: ModuleUpdate = {
      name: payload.name,
      description: payload.description,
      testSuites: payload.testSuites,
      cron: payload.cron,
      baseUrl: payload.baseUrl,
      notifyOnFailure: payload.notifyOnFailure,
      notifyEmails: payload.notifyEmails,
      active: payload.active,
    };

    try {
      await updateModule.mutateAsync({ id: module.id, payload: updatePayload });
      toast.success('Module updated', `"${payload.name}" was saved successfully.`);
      navigate(healthCheckModulePath(module.id));
    } catch (err) {
      toast.error('Update failed', (err as Error)?.message ?? 'See console for details.');
      throw err;
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
          items={[healthCheckListCrumb(), { label: 'Edit Module' }]}
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
          { label: 'Edit Module' },
        ]}
      />

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Edit Module</h1>
        <p className="text-sm text-gray-500 mt-1">
          Update identity, schedule, and notification settings for {module.name}.
        </p>
      </div>

      <ModuleForm
        mode="edit"
        initialValues={module}
        onSubmit={handleSubmit}
        onCancel={handleBack}
        isSubmitting={updateModule.isPending}
      />
    </div>
  );
}
