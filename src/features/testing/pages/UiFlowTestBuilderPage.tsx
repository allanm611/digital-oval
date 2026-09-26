import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MousePointerClick, Plus } from 'lucide-react';
import BackButton from '../../../shared/components/ui/BackButton';
import DeleteConfirmModal from '../../../shared/components/ui/DeleteConfirmModal';
import { useDeleteConfirm } from '../../../shared/hooks/useDeleteConfirm';
import { useToast } from '../../../contexts/ToastContext';
import { navigateBackOrFallback } from '../../../shared/utils/navigation';
import { tw } from '../../../shared/utils/utils';
import { useHealthStatus } from '../hooks/useHealthStatus';
import { useUiFlowTestCases, useDeleteUiFlowTestCase, useUpdateUiFlowTestCase } from '../hooks/useUiFlowTestCases';
import UiFlowTestCaseList from '../components/UiFlowTestCaseList';
import UiFlowTestCaseForm from '../components/UiFlowTestCaseForm';
import { HEALTH_CHECK_BASE } from '../constants/routes';
import type { UiFlowTestCase } from '../types/health';

type View = 'list' | 'create' | 'edit';

export default function UiFlowTestBuilderPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [view, setView] = useState<View>('list');
  const [editingCase, setEditingCase] = useState<UiFlowTestCase | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const { data: dashboard } = useHealthStatus();
  const { data: cases = [], isLoading } = useUiFlowTestCases();
  const deleteCase = useDeleteUiFlowTestCase();
  const updateCase = useUpdateUiFlowTestCase();

  const moduleOptions = useMemo(
    () => (dashboard?.modules ?? []).map((module) => ({ id: module.id, name: module.name })),
    [dashboard?.modules],
  );

  const moduleNameById = useMemo(
    () => Object.fromEntries(moduleOptions.map((option) => [option.id, option.name])),
    [moduleOptions],
  );

  const {
    deleteConfirm,
    isDeleting,
    openDeleteConfirm,
    closeDeleteConfirm,
    handleDelete: confirmDeleteCase,
  } = useDeleteConfirm({
    onDelete: (id) => deleteCase.mutateAsync(String(id)),
    itemLabel: 'UI flow test case',
  });

  const handleBack = () => {
    navigateBackOrFallback(navigate, HEALTH_CHECK_BASE);
  };

  const handleCreate = () => {
    setEditingCase(null);
    setView('create');
  };

  const handleEdit = (testCase: UiFlowTestCase) => {
    setEditingCase(testCase);
    setView('edit');
  };

  const handleSaved = (testCase: UiFlowTestCase) => {
    setView('list');
    setEditingCase(null);
    void testCase;
  };

  const handleCancelForm = () => {
    setView('list');
    setEditingCase(null);
  };

  const handleToggleActive = async (testCase: UiFlowTestCase) => {
    setTogglingId(testCase.id);
    try {
      await updateCase.mutateAsync({ id: testCase.id, payload: { active: !testCase.active } });
    } catch (err) {
      toast.error('Update failed', err instanceof Error ? err.message : 'Could not toggle active state.');
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <BackButton
        showBreadcrumb
        parentLabel="Health Check"
        currentLabel="UI Flow Test Builder"
        onClick={view === 'list' ? handleBack : handleCancelForm}
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-500 flex items-center justify-center text-white shrink-0">
            <MousePointerClick size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">UI Flow Test Builder</h1>
            <p className="text-sm text-gray-500 mt-1">
              Compose real browser flows (goto/click/fill/assert) without writing Playwright
              code.
            </p>
          </div>
        </div>

        {view === 'list' && (
          <button
            type="button"
            onClick={handleCreate}
            className={`${tw.button} inline-flex items-center gap-2 px-4 py-2 text-sm shrink-0`}
          >
            <Plus size={14} />
            New flow
          </button>
        )}
      </div>

      {view === 'list' ? (
        <UiFlowTestCaseList
          cases={cases}
          isLoading={isLoading}
          moduleNameById={moduleNameById}
          onEdit={handleEdit}
          onDelete={(testCase) => openDeleteConfirm(testCase.id, testCase.name)}
          onToggleActive={handleToggleActive}
          togglingId={togglingId}
        />
      ) : (
        <UiFlowTestCaseForm
          moduleOptions={moduleOptions}
          initialCase={view === 'edit' ? editingCase : null}
          onSaved={handleSaved}
          onCancel={handleCancelForm}
        />
      )}

      <DeleteConfirmModal
        isOpen={deleteConfirm.id !== null}
        onClose={closeDeleteConfirm}
        onConfirm={confirmDeleteCase}
        title="Delete UI flow test case"
        description="Are you sure you want to delete this flow? Any modules referencing it will no longer be able to run it."
        itemName={deleteConfirm.itemName}
        isLoading={isDeleting}
      />
    </div>
  );
}
