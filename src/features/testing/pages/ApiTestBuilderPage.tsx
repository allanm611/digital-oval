import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Globe, Plus } from 'lucide-react';
import BackButton from '../../../shared/components/ui/BackButton';
import DeleteConfirmModal from '../../../shared/components/ui/DeleteConfirmModal';
import { useDeleteConfirm } from '../../../shared/hooks/useDeleteConfirm';
import { useToast } from '../../../contexts/ToastContext';
import { navigateBackOrFallback } from '../../../shared/utils/navigation';
import { tw } from '../../../shared/utils/utils';
import { useHealthStatus } from '../hooks/useHealthStatus';
import { useApiTestCases, useDeleteApiTestCase, useUpdateApiTestCase } from '../hooks/useApiTestCases';
import ApiTestCaseList from '../components/ApiTestCaseList';
import ApiTestCaseForm from '../components/ApiTestCaseForm';
import { HEALTH_CHECK_BASE } from '../constants/routes';
import type { ApiTestCase } from '../types/health';

type View = 'list' | 'create' | 'edit';

export default function ApiTestBuilderPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [view, setView] = useState<View>('list');
  const [editingCase, setEditingCase] = useState<ApiTestCase | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const { data: dashboard } = useHealthStatus();
  const { data: cases = [], isLoading } = useApiTestCases();
  const deleteCase = useDeleteApiTestCase();
  const updateCase = useUpdateApiTestCase();

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
    itemLabel: 'API test case',
  });

  const handleBack = () => {
    navigateBackOrFallback(navigate, HEALTH_CHECK_BASE);
  };

  const handleCreate = () => {
    setEditingCase(null);
    setView('create');
  };

  const handleEdit = (testCase: ApiTestCase) => {
    setEditingCase(testCase);
    setView('edit');
  };

  const handleSaved = (testCase: ApiTestCase) => {
    setView('list');
    setEditingCase(null);
    void testCase;
  };

  const handleCancelForm = () => {
    setView('list');
    setEditingCase(null);
  };

  const handleToggleActive = async (testCase: ApiTestCase) => {
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
        currentLabel="API Test Builder"
        onClick={view === 'list' ? handleBack : handleCancelForm}
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center text-white shrink-0">
            <Globe size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">API Test Builder</h1>
            <p className="text-sm text-gray-500 mt-1">
              Define REST assertions without writing Playwright code — cases run through one
              shared dynamic runner.
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
            New test case
          </button>
        )}
      </div>

      {view === 'list' ? (
        <ApiTestCaseList
          cases={cases}
          isLoading={isLoading}
          moduleNameById={moduleNameById}
          onEdit={handleEdit}
          onDelete={(testCase) => openDeleteConfirm(testCase.id, testCase.name)}
          onToggleActive={handleToggleActive}
          togglingId={togglingId}
        />
      ) : (
        <ApiTestCaseForm
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
        title="Delete API test case"
        description="Are you sure you want to delete this test case? Any modules referencing it will no longer be able to run it."
        itemName={deleteConfirm.itemName}
        isLoading={isDeleting}
      />
    </div>
  );
}
