import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Edit, Trash2, Copy, Play, Pause } from "lucide-react";
import { workflowService } from "../services/workflowService";
import { useToast } from "../../../contexts/ToastContext";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import DeleteConfirmModal from "../../../shared/components/ui/DeleteConfirmModal";
import { tw, button } from "../../../shared/utils/utils";
import type { Workflow } from "../types/workflow";
import { useAuth } from "../../../contexts/AuthContext";
import { useLanguage } from "../../../contexts/LanguageContext";

export default function WorkflowDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { error: showError, success: showToast } = useToast();
  const { user } = useAuth();
  const { t } = useLanguage();

  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isActive, setIsActive] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCloning, setIsCloning] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  useEffect(() => {
    const loadWorkflow = async () => {
      if (!id) return;

      setIsLoading(true);
      try {
        const data = await workflowService.getWorkflowById(Number(id), true);
        setWorkflow(data);
        setIsActive(data.is_active);

        // Also check active status
        const activeCheck = await workflowService.checkWorkflowActive(
          Number(id)
        );
        setIsActive(activeCheck.is_active);
      } catch (err) {
        showError(
          t.common.error,
          err instanceof Error ? err.message : t.workflows.failedToLoadWorkflow
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadWorkflow();
  }, [id, showError]);

  const handleToggleActive = async () => {
    if (!id) return;

    setIsToggling(true);
    try {
      if (isActive) {
        await workflowService.deactivateWorkflow(Number(id));
        showToast(t.workflows.workflowDeactivated, t.workflows.workflowDeactivatedSuccess);
      } else {
        await workflowService.activateWorkflow(Number(id));
        showToast(t.workflows.workflowActivated, t.workflows.workflowActivatedSuccess);
      }
      setIsActive(!isActive);
      if (workflow) {
        setWorkflow({ ...workflow, is_active: !isActive });
      }
    } catch (err) {
      showError(
        t.workflows.toggleFailed,
        err instanceof Error ? err.message : t.common.error
      );
    } finally {
      setIsToggling(false);
    }
  };

  const handleClone = async () => {
    if (!workflow) return;

    setIsCloning(true);
    try {
      await workflowService.cloneWorkflow(workflow.id, {
        newName: `${workflow.name} (Copy)`,
        created_by: user?.user_id || null,
      });
      showToast(t.workflows.cloneSuccess, t.workflows.workflowClonedSuccess);
      navigate("/dashboard/workflows");
    } catch (err) {
      showError(
        t.workflows.cloneFailed,
        err instanceof Error ? err.message : t.common.error
      );
    } finally {
      setIsCloning(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;

    setIsDeleting(true);
    try {
      await workflowService.deleteWorkflow(Number(id));
      showToast("Workflow deleted", "Workflow has been deleted successfully.");
      navigate("/dashboard/workflows");
    } catch (err) {
      showError(
        "Delete failed",
        err instanceof Error ? err.message : "Unknown error"
      );
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    );
  }

  if (!workflow) {
    return (
      <div
        className={`${tw.rounded} border border-gray-200 bg-white p-8 text-center`}
      >
        <p className="text-gray-500">Workflow not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/dashboard/workflows")}
            className={`${tw.rounded} p-2 text-gray-600 hover:text-gray-800 transition-colors`}
            aria-label="Back"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className={`text-2xl font-bold ${tw.textPrimary}`}>
              {workflow.name}
            </h1>
            <p className={`${tw.textSecondary} mt-1 text-sm`}>
              Workflow Details
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {!isActive && (
            <button
              onClick={handleToggleActive}
              disabled={isToggling}
              className={`inline-flex items-center gap-2 ${tw.rounded} text-sm font-medium disabled:opacity-50`}
              style={{
                background: button.secondaryAction.background,
                color: button.secondaryAction.color,
                border: button.secondaryAction.border,
                paddingTop: button.secondaryAction.paddingY,
                paddingBottom: button.secondaryAction.paddingY,
                paddingLeft: button.secondaryAction.paddingX,
                paddingRight: button.secondaryAction.paddingX,
                borderRadius: button.secondaryAction.borderRadius,
                fontSize: button.secondaryAction.fontSize,
              }}
            >
              {isToggling ? <LoadingSpinner /> : <Play className="h-4 w-4" />}
              Activate
            </button>
          )}
          {isActive && (
            <button
              onClick={handleToggleActive}
              disabled={isToggling}
              className={`inline-flex items-center gap-2 ${tw.rounded} text-sm font-medium disabled:opacity-50`}
              style={{
                background: button.bordered.background,
                color: button.bordered.color,
                border: button.bordered.border,
                paddingTop: button.bordered.paddingY,
                paddingBottom: button.bordered.paddingY,
                paddingLeft: button.bordered.paddingX,
                paddingRight: button.bordered.paddingX,
                borderRadius: button.bordered.borderRadius,
                fontSize: button.bordered.fontSize,
              }}
            >
              {isToggling ? <LoadingSpinner /> : <Pause className="h-4 w-4" />}
              Deactivate
            </button>
          )}
          <button
            onClick={handleClone}
            disabled={isCloning}
            className={`inline-flex items-center gap-2 ${tw.rounded} text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50`}
            style={{
              paddingTop: button.bordered.paddingY,
              paddingBottom: button.bordered.paddingY,
              paddingLeft: button.bordered.paddingX,
              paddingRight: button.bordered.paddingX,
              borderRadius: button.bordered.borderRadius,
              fontSize: button.bordered.fontSize,
            }}
          >
            {isCloning ? <LoadingSpinner /> : <Copy className="h-4 w-4" />}
            Clone
          </button>
          <button
            onClick={() => navigate(`/dashboard/workflows/${workflow.id}/edit`)}
            className={`inline-flex items-center gap-2 ${tw.rounded} text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50`}
            style={{
              paddingTop: button.bordered.paddingY,
              paddingBottom: button.bordered.paddingY,
              paddingLeft: button.bordered.paddingX,
              paddingRight: button.bordered.paddingX,
              borderRadius: button.bordered.borderRadius,
              fontSize: button.bordered.fontSize,
            }}
          >
            <Edit className="h-4 w-4" />
            Edit
          </button>
          <button
            onClick={() => setShowDeleteModal(true)}
            className={`inline-flex items-center gap-2 ${tw.rounded} text-sm font-medium text-red-700 bg-white border border-red-300 hover:bg-red-50`}
            style={{
              paddingTop: button.bordered.paddingY,
              paddingBottom: button.bordered.paddingY,
              paddingLeft: button.bordered.paddingX,
              paddingRight: button.bordered.paddingX,
              borderRadius: button.bordered.borderRadius,
              fontSize: button.bordered.fontSize,
            }}
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </button>
        </div>
      </div>

      {/* Details */}
      <div
        className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}
      >
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Workflow Information
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name
            </label>
            <p className="text-sm text-gray-900">{workflow.name}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type
            </label>
            <p className="text-sm text-gray-900">
              {workflow.workflow_type || "—"}
            </p>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <p className="text-sm text-gray-900">
              {workflow.description || "—"}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <span
              className={`inline-flex items-center px-2.5 py-0.5 ${
                tw.rounded
              } text-xs font-medium ${
                workflow.is_active
                  ? "bg-green-100 text-green-800"
                  : "bg-gray-100 text-gray-800"
              }`}
            >
              {workflow.is_active ? "Active" : "Inactive"}
            </span>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Created At
            </label>
            <p className="text-sm text-gray-900">
              {new Date(workflow.created_at).toLocaleString()}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Updated At
            </label>
            <p className="text-sm text-gray-900">
              {new Date(workflow.updated_at).toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Delete Workflow"
        message={`Are you sure you want to delete "${workflow.name}"? This action cannot be undone.`}
        isDeleting={isDeleting}
      />
    </div>
  );
}
