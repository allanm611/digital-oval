import { useNavigate } from 'react-router-dom';
import BackButton from '../../../shared/components/ui/BackButton';
import { useToast } from '../../../contexts/ToastContext';
import { navigateBackOrFallback } from '../../../shared/utils/navigation';
import { useCreateModule } from '../hooks/useHealthStatus';
import ModuleForm from '../components/ModuleForm';
import type { ModuleConfig } from '../types/health';

import { HEALTH_CHECK_BASE } from '../constants/routes';

export default function CreateModulePage() {
  const navigate = useNavigate();
  const toast = useToast();
  const createModule = useCreateModule();

  const handleCancel = () => {
    navigateBackOrFallback(navigate, HEALTH_CHECK_BASE);
  };

  const handleSubmit = async (payload: Partial<ModuleConfig>) => {
    try {
      await createModule.mutateAsync(payload);
      toast.success('Module created', `"${payload.name}" is now being monitored.`);
      navigate(HEALTH_CHECK_BASE);
    } catch (err) {
      toast.error('Create failed', (err as Error)?.message ?? 'See console for details.');
      throw err;
    }
  };

  return (
    <div className="space-y-6">
      <BackButton
        showBreadcrumb
        parentLabel="Health Check"
        currentLabel="Add Module"
        onClick={handleCancel}
      />

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Add Module</h1>
        <p className="text-sm text-gray-500 mt-1">
          Configure a new Playwright health-check monitoring module.
        </p>
      </div>

      <ModuleForm
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isSubmitting={createModule.isPending}
      />
    </div>
  );
}
