import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Edit, Trash2, Copy, Play, Pause, MoreVertical } from "lucide-react";
import { workflowService } from "../services/workflowService";
import { useToast } from "../../../contexts/ToastContext";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import BackButton from "../../../shared/components/ui/BackButton";
import DeleteConfirmModal from "../../../shared/components/ui/DeleteConfirmModal";
import { PermissionGate } from "../../auth/components/PermissionGate";
import { tw, button } from "../../../shared/utils/utils";
import type { Workflow } from "../types/workflow";
import { useAuth } from "../../../contexts/AuthContext";
import DateFormatter from "../../../shared/components/DateFormatter";

export default function WorkflowDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { error: showError, success: showToast } = useToast();
  const { user } = useAuth();

  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isActive, setIsActive] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCloning, setIsCloning] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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
          Number(id),
        );
        setIsActive(activeCheck.is_active);
      } catch (err) {
        showError(
          "Error",
          err instanceof Error ? err.message : "Failed to load workflow",
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadWorkflow();
  }, [id, showError]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [showMenu]);

  const handleToggleActive = async () => {
    if (!id) return;

    setIsToggling(true);
    try {
      if (isActive) {
        await workflowService.deactivateWorkflow(Number(id));
        showToast("Deactivated", "Workflow has been deactivated");
      } else {
        await workflowService.activateWorkflow(Number(id));
        showToast("Activated", "Workflow has been activated");
      }
      setIsActive(!isActive);
      if (workflow) {
        setWorkflow({ ...workflow, is_active: !isActive });
      }
    } catch (err) {
      showError(
        "Toggle Failed",
        err instanceof Error ? err.message : "Unknown error",
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
        created_by: user?.user_id ?? null,
      });
      showToast("Success", "Workflow has been cloned successfully");
      navigate("/dashboard/workflows");
    } catch (err) {
      showError(
        "Clone Failed",
        err instanceof Error ? err.message : "Unknown error",
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
        err instanceof Error ? err.message : "Unknown error",
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
      <BackButton
        fallbackTo="/dashboard/workflows"
        showBreadcrumb={true}
        currentLabel="Workflow Details"
      />
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`${tw.tableFirstColumn} ${tw.textPrimary}`}>
            {workflow.name}
          </h1>
        </div>
        <div className="flex items-center gap-2">
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
          <PermissionGate permission="job-workflows.update">
            <button
              onClick={() =>
                navigate(`/dashboard/workflows/${workflow.id}/edit`)
              }
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
              title="Edit"
            >
              <Edit className="h-4 w-4" />
              Edit
            </button>
          </PermissionGate>
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowMenu(!showMenu)}
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
              title="More actions"
            >
              <MoreVertical className="h-4 w-4" />
            </button>
            {showMenu && (
              <div
                className={`absolute right-0 top-full mt-1 w-48 bg-white ${tw.rounded} shadow-lg border border-gray-200 py-1 z-10`}
              >
                <PermissionGate permission="job-workflows.update">
                  <button
                    onClick={() => {
                      handleClone();
                      setShowMenu(false);
                    }}
                    disabled={isCloning}
                    className="w-full text-left px-4 py-2 text-sm text-gray-900 hover:bg-gray-50 flex items-center gap-2 disabled:opacity-60"
                  >
                    {isCloning ? <LoadingSpinner /> : <Copy className="h-4 w-4" />}
                    Clone
                  </button>
                </PermissionGate>
                <PermissionGate permission="job-workflows.delete">
                  <button
                    onClick={() => {
                      setShowDeleteModal(true);
                      setShowMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </button>
                </PermissionGate>
              </div>
            )}
          </div>
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
              <DateFormatter date={workflow.created_at} useUserTimezone includeTime />
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Updated At
            </label>
            <p className="text-sm text-gray-900">
              <DateFormatter date={workflow.updated_at} useUserTimezone includeTime />
            </p>
          </div>
        </div>
      </div>

      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Delete Workflow"
        description={`Are you sure you want to delete "${workflow.name}"? This action cannot be undone.`}
        itemName={workflow.name}
        isLoading={isDeleting}
      />
    </div>
  );
}
