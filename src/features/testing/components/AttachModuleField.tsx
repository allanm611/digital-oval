import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import RegularModal from '../../../shared/components/ui/RegularModal';
import { useCreateModule } from '../hooks/useHealthStatus';
import { useToast } from '../../../contexts/ToastContext';
import ModuleForm from './ModuleForm';
import type { ModuleConfig } from '../types/health';

interface ModuleOption {
  id: string;
  name: string;
}

interface AttachModuleFieldProps {
  /** Full label text, e.g. "Attach to module (optional — enables the module's baseUrl for the SSRF allow-list)". */
  label: string;
  /** Text for the empty/"no module" option, e.g. "— Standalone / reusable —". */
  placeholderOptionLabel: string;
  moduleId: string;
  moduleOptions: ModuleOption[];
  onChange: (moduleId: string) => void;
}

const selectClass = 'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900';

/**
 * "Attach to module" select paired with an inline "+ create module" action —
 * mirrors the dropdown-plus-add-button pattern used elsewhere in the app
 * (e.g. Offer Type / Catalog pickers). Reuses the full `ModuleForm` (rather
 * than a stripped-down duplicate) inside a modal so module creation stays
 * validated identically everywhere, then auto-selects the newly created
 * module on this field once it's saved.
 */
const AttachModuleField: React.FC<AttachModuleFieldProps> = ({
  label,
  placeholderOptionLabel,
  moduleId,
  moduleOptions,
  onChange,
}) => {
  const toast = useToast();
  const createModule = useCreateModule();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const handleCreateModule = async (payload: Partial<ModuleConfig>) => {
    try {
      const created = await createModule.mutateAsync(payload);
      toast.success('Module created', `"${created.name}" was created and attached to this test case.`);
      onChange(created.id);
      setIsCreateOpen(false);
    } catch (err) {
      toast.error('Create failed', err instanceof Error ? err.message : 'Could not create the module.');
      throw err;
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      <div className="flex items-center gap-2">
        <select
          className={`${selectClass} flex-1`}
          value={moduleId}
          onChange={(event) => onChange(event.target.value)}
        >
          <option value="">{placeholderOptionLabel}</option>
          {moduleOptions.map((option) => (
            <option key={option.id} value={option.id}>{option.name}</option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => setIsCreateOpen(true)}
          className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-gray-900 text-white hover:bg-gray-700 transition-colors shrink-0"
          aria-label="Create a new module and attach it"
          title="Create a new module and attach it"
        >
          <Plus size={16} />
        </button>
      </div>

      <RegularModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create module"
        size="2xl"
      >
        <ModuleForm
          mode="create"
          compact
          onSubmit={handleCreateModule}
          onCancel={() => setIsCreateOpen(false)}
          isSubmitting={createModule.isPending}
          submitLabel="Create & attach"
          submittingLabel="Creating…"
        />
      </RegularModal>
    </div>
  );
};

export default AttachModuleField;
