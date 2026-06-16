import { useCallback, useEffect, useState } from "react";
import {
  Eye,
  Edit,
  Plus,
  Trash2,
  BarChart3,
  Copy,
  Play,
  Pause,
  X,
} from "lucide-react";
import SearchInput from "../../../shared/components/ui/SearchInput";
import Textarea from "../../../shared/components/ui/Textarea";
import BackButton from "../../../shared/components/ui/BackButton";
import ActivateDeactivateButton from "../../../shared/components/ui/ActivateDeactivateButton";
import { useNavigate } from "react-router-dom";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import DeleteConfirmModal from "../../../shared/components/ui/DeleteConfirmModal";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import { useDeleteConfirm } from "../../../shared/hooks/useDeleteConfirm";
import Pagination, { DEFAULT_PAGE_SIZE, getInitialPageSize } from "../../../shared/components/ui/Pagination";
import { color, tw, button } from "../../../shared/utils/utils";
import { Table, useTable, type TableColumn } from "../../../shared/components/Table";
import { useToast } from "../../../contexts/ToastContext";
import { extractBackendError } from "../../../shared/utils/errorHandler";;;
import { useLanguage } from "../../../contexts/LanguageContext";
import { PermissionGate } from "../../auth/components/PermissionGate";
import { workflowService } from "../services/workflowService";
import type { Workflow } from "../types/workflow";
import DateFormatter from "../../../shared/components/DateFormatter";
import { useAuth } from "../../../contexts/AuthContext";
import Checkbox from "../../../shared/components/ui/Checkbox";
import WorkflowModal from "../components/WorkflowModal";

export default function WorkflowsPage() {
  const navigate = useNavigate();
  const { error: showError, success: showToast } = useToast();
  const { t } = useLanguage();
  const { user } = useAuth();

  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "inactive"
  >("all");
  const [workflowTypeFilter, setWorkflowTypeFilter] = useState<string>("");
  const [workflowTypes, setWorkflowTypes] = useState<string[]>([]);
  type Stats = {
    total: number;
    active: number;
    inactive: number;
    pending_activation?: number;
    deactivated?: number;
    suspended?: number;
    locked?: number;
    deleted?: number;
  };

  const [stats, setStats] = useState<Stats>({
    total: 0,
    active: 0,
    inactive: 0,
    pending_activation: 0,
    deactivated: 0,
    suspended: 0,
    locked: 0,
    deleted: 0,
  });
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [rowLoading, setRowLoading] = useState<{
    id: number;
    action: "clone" | "delete";
  } | null>(null);
  const [deletingWorkflow, setDeletingWorkflow] = useState<Workflow | null>(null);

  const { deleteConfirm, isDeleting, openDeleteConfirm, closeDeleteConfirm, handleDelete: confirmDeleteWorkflow } = useDeleteConfirm({
    onDelete: async (id) => {
      const numId = typeof id === "string" ? parseInt(id) : id;
      const workflowToDelete = workflows.find(w => w.id === numId);
      if (!workflowToDelete) return;

      setWorkflows((prev) => prev.filter((w) => w.id !== numId));
      setTotalCount((prev) => prev - 1);

      await workflowService.deleteWorkflow(numId);
      setRowLoading(null);
      fetchStats();
    },
    itemLabel: "Workflow",
  });
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedWorkflows, setSelectedWorkflows] = useState<Set<number>>(
    new Set(),
  );
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(getInitialPageSize());
  const [totalCount, setTotalCount] = useState(0);
  const [showWorkflowModal, setShowWorkflowModal] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState<Workflow | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingWorkflow, setViewingWorkflow] = useState<Workflow | null>(null);
  const [isLoadingView, setIsLoadingView] = useState(false);

  const fetchWorkflows = useCallback(async () => {
    setIsLoading(true);
    try {
      let response;

      if (workflowTypeFilter) {
        response = await workflowService.getWorkflowsByType(
          workflowTypeFilter,
          {
            activeOnly: statusFilter === "active",
            limit: pageSize,
            offset: (page - 1) * pageSize,
            skipCache: true,
          },
        );
      } else if (searchTerm.trim()) {
        response = await workflowService.searchWorkflows({
          q: searchTerm.trim(),
          activeOnly: statusFilter === "active",
          limit: pageSize,
          offset: (page - 1) * pageSize,
          skipCache: true,
        });
      } else if (statusFilter === "active") {
        response = await workflowService.getActiveWorkflows({
          limit: pageSize,
          offset: (page - 1) * pageSize,
          skipCache: true,
        });
      } else if (statusFilter === "inactive") {
        response = await workflowService.getInactiveWorkflows({
          limit: pageSize,
          offset: (page - 1) * pageSize,
          skipCache: true,
        });
      } else {
        response = await workflowService.getAllWorkflows({
          limit: pageSize,
          offset: (page - 1) * pageSize,
          skipCache: true,
        });
      }

      setWorkflows(response.data || []);
      const total =
        response.pagination?.total ??
        (response as { count?: number }).count ??
        (response.data ? response.data.length : 0);
      setTotalCount(total);
    } catch (err) {
      showError(
        t("common.error", "Error"),
        err instanceof Error
          ? err.message
          : t("workflows.loadFailed", "Failed to load workflows"),
      );
    } finally {
      setIsLoading(false);
    }
  }, [
    searchTerm,
    statusFilter,
    workflowTypeFilter,
    page,
    pageSize,
    showError,
    t,
  ]);

  // Reset pagination when filters/search change
  useEffect(() => {
    setPage(1);
  }, [searchTerm, statusFilter, workflowTypeFilter]);

  const fetchStats = useCallback(async () => {
    setIsLoadingStats(true);
    try {
      const [statusCounts, typesResponse] = await Promise.all([
        workflowService.getStatusCounts(true),
        workflowService.getWorkflowTypes(true),
      ]);

      // Handle different response structures
      const counts: Partial<Stats> =
        (statusCounts?.data as Partial<Stats>) ||
        (statusCounts as Partial<Stats>) ||
        {};
      const totalCalculatedFromStatus =
        (counts.pending_activation || 0) +
        (counts.active || 0) +
        (counts.suspended || 0) +
        (counts.locked || 0) +
        (counts.deactivated || 0) +
        (counts.deleted || 0) +
        (counts.inactive || 0);

      const totalFinal = (counts.total as number) || totalCalculatedFromStatus || 0;

      setStats({
        total: totalFinal,
        active: counts.active || 0,
        inactive:
          (counts.inactive || 0) +
          (counts.deactivated || 0) +
          (counts.suspended || 0) +
          (counts.locked || 0),
        pending_activation: counts.pending_activation || 0,
        deactivated: counts.deactivated || 0,
        suspended: counts.suspended || 0,
        locked: counts.locked || 0,
        deleted: counts.deleted || 0,
      });

      // Handle types response - backend returns {success: true, data: {types: [...], total: N}}
      let types: string[] = [];
      if (Array.isArray(typesResponse)) {
        types = typesResponse;
      } else if (
        typesResponse?.data &&
        typeof typesResponse.data === "object" &&
        "types" in typesResponse.data &&
        Array.isArray((typesResponse.data as { types?: unknown }).types)
      ) {
        types = (typesResponse.data as { types: string[] }).types;
      } else if (
        typesResponse?.data &&
        Array.isArray(typesResponse.data as unknown[])
      ) {
        types = typesResponse.data as string[];
      }
      setWorkflowTypes(types);
    } catch (err) {
      console.error("Failed to load stats:", err);
      // Ensure workflowTypes is always an array even on error
      setWorkflowTypes([]);
    } finally {
      setIsLoadingStats(false);
    }
  }, []);

  useEffect(() => {
    fetchWorkflows();
    fetchStats();
  }, [fetchWorkflows, fetchStats]);

  const handleDeleteWorkflow = (workflow: Workflow) => {
    setDeletingWorkflow(workflow);
    openDeleteConfirm(workflow.id, workflow.name || `Workflow #${workflow.id}`);
  };

  const handleToggleSelection = (workflowId: number) => {
    const newSelected = new Set(selectedWorkflows);
    if (newSelected.has(workflowId)) {
      newSelected.delete(workflowId);
    } else {
      newSelected.add(workflowId);
    }
    setSelectedWorkflows(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedWorkflows.size === workflows.length) {
      setSelectedWorkflows(new Set());
    } else {
      setSelectedWorkflows(new Set(workflows.map((w) => w.id)));
    }
  };

  const handleBatchActivate = async () => {
    if (selectedWorkflows.size === 0) return;

    setIsBatchProcessing(true);
    try {
      const result = await workflowService.bulkActivateWorkflows({
        workflowIds: Array.from(selectedWorkflows),
      });
      showToast(
        t.workflows.workflowActivated || "Workflows activated",
        `${result.success} workflow(s) activated successfully.`,
      );
      setSelectedWorkflows(new Set());
      setIsSelectionMode(false);
      fetchWorkflows();
      fetchStats();
    } catch (err) {
      showError(
        t.workflows.toggleFailed || "Batch activate failed",
        err instanceof Error ? err.message : t.common.error || "Unknown error",
      );
    } finally {
      setIsBatchProcessing(false);
    }
  };

  const handleBatchDeactivate = async () => {
    if (selectedWorkflows.size === 0) return;

    setIsBatchProcessing(true);
    try {
      const result = await workflowService.bulkDeactivateWorkflows({
        workflowIds: Array.from(selectedWorkflows),
      });
      showToast(
        t.workflows.workflowDeactivated || "Workflows deactivated",
        `${result.success} workflow(s) deactivated successfully.`,
      );
      setSelectedWorkflows(new Set());
      setIsSelectionMode(false);
      fetchWorkflows();
      fetchStats();
    } catch (err) {
      showError(
        t.workflows.toggleFailed || "Batch deactivate failed",
        err instanceof Error ? err.message : t.common.error || "Unknown error",
      );
    } finally {
      setIsBatchProcessing(false);
    }
  };

  const handleView = async (workflow: Workflow) => {
    setViewingWorkflow(workflow);
    setIsViewModalOpen(true);
    setIsLoadingView(true);
    try {
      const fresh = await workflowService.getWorkflowById(workflow.id, true);
      setViewingWorkflow(fresh);
    } catch (err) {
      // Show with cached data if fetch fails
      console.error("Failed to fetch workflow details:", err);
    } finally {
      setIsLoadingView(false);
    }
  };

  const handleEdit = (workflow: Workflow) => {
    setEditingWorkflow(workflow);
    setShowWorkflowModal(true);
  };

  const handleClone = async (workflow: Workflow) => {
    setRowLoading({ id: workflow.id, action: "clone" });
    try {
      const cloned = await workflowService.cloneWorkflow(workflow.id, {
        newName: `${workflow.name} (Copy)`,
        created_by: user?.user_id ?? null,
      });
      showToast(
        t.workflows.cloneSuccess || "Workflow cloned",
        "Workflow has been cloned successfully.",
      );
      // Optimistic update: prepend cloned workflow to list
      setWorkflows((prev) => [cloned, ...prev]);
      setTotalCount((prev) => prev + 1);
      fetchStats();
    } catch (err) {
      showError(
        t.workflows.cloneFailed || "Clone failed",
        err instanceof Error ? err.message : t.common.error || "Unknown error",
      );
    } finally {
      setRowLoading((prev) => (prev?.id === workflow.id ? null : prev));
    }
  };

  // Table columns definition
  const defaultColumns: TableColumn<Workflow>[] = [
    {
      id: "name",
      label: "Name",
      visible: true,
      render: (value) => (
        <div className={`text-sm font-semibold text-gray-900`}>
          {value}
        </div>
      ),
    },
    {
      id: "workflow_type",
      label: "Type",
      visible: true,
      render: (value) => (
        <div className="text-sm text-gray-600">
          {value || "—"}
        </div>
      ),
    },
    {
      id: "is_active",
      label: "Status",
      visible: true,
      render: (value) => (
        <span className="text-sm text-black font-medium">
          {value ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      id: "created_at",
      label: "Created",
      visible: true,
      render: (value) => (
        <span className="text-sm text-gray-600">
          {value ? new Date(value as string).toLocaleDateString() : "—"}
        </span>
      ),
    },
    {
      id: "actions",
      label: "Actions",
      visible: true,
      sortable: false,
      render: (value, workflow) => (
        <div className="flex items-center justify-end space-x-2">
          <button
            onClick={() => handleView(workflow)}
            className={`p-2 ${tw.rounded} text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors`}
            title="View"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleEdit(workflow)}
            className={`p-2 ${tw.rounded} text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors`}
            title="Edit"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={async () => {
              setRowLoading({ id: workflow.id, action: "clone" });
              await handleClone(workflow);
              setRowLoading((prev) =>
                prev?.id === workflow.id ? null : prev,
              );
            }}
            disabled={
              rowLoading?.id === workflow.id &&
              rowLoading?.action === "clone"
            }
            className={`p-2 ${tw.rounded} text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors disabled:opacity-50`}
            title="Clone"
          >
            {rowLoading?.id === workflow.id &&
            rowLoading?.action === "clone" ? (
              <LoadingSpinner />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </button>
          <button
            onClick={() => handleDeleteWorkflow(workflow)}
            className={`p-2 text-red-600 hover:text-red-700 hover:bg-red-50 ${tw.rounded} transition-colors`}
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  const {
    columns,
    currentPage: tableCurrentPage,
    pageSize: tablePageSize,
    handlePageChange: tableHandlePageChange,
    handlePageSizeChange: tableHandlePageSizeChange,
    sortConfigs,
    handleSort,
  } = useTable({
    tableId: "workflows-table",
    defaultColumns,
    defaultPageSize: DEFAULT_PAGE_SIZE,
    persistToLocalStorage: true,
  });

  return (
    <>
      <div className="overflow-x-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <BackButton
                showBreadcrumb={true}
                currentLabel="Job Workflows"
              />
            </div>
            <p className={`${tw.textSecondary} text-sm mt-1`}>
              Manage and monitor workflows
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/dashboard/workflows/analytics")}
              className={`inline-flex items-center gap-2 ${tw.rounded} px-4 py-2 text-sm font-medium focus:outline-none transition-colors`}
              style={{
                backgroundColor: "transparent",
                color: color.primary.action,
                border: `1px solid ${color.primary.action}`,
              }}
            >
              <BarChart3 className="h-4 w-4" />
              Analytics
            </button>
            <PermissionGate permission="job-workflows.select">
              <button
                onClick={() => {
                  if (!isSelectionMode) {
                    setIsSelectionMode(true);
                    setSelectedWorkflows(new Set(workflows.map((w) => w.id)));
                  } else {
                    setIsSelectionMode(false);
                    setSelectedWorkflows(new Set());
                  }
                }}
                className={`inline-flex items-center gap-2 ${tw.rounded} text-sm font-medium`}
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
                {isSelectionMode ? "Cancel" : "Select"}
              </button>
            </PermissionGate>
            <PermissionGate permission="job-workflows.create">
              <button
                onClick={() => {
                  setEditingWorkflow(null);
                  setShowWorkflowModal(true);
                }}
                className={`inline-flex items-center gap-2 ${tw.rounded} px-4 py-2 text-sm font-semibold text-white`}
                style={{ backgroundColor: color.primary.action }}
              >
                <Plus className="h-4 w-4" />
                {t.workflows.createWorkflow}
              </button>
            </PermissionGate>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="mt-6">
          <div className="grid gap-4 md:grid-cols-4">
        <div
          className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}
        >
          <div className="flex items-center gap-2">
            <BarChart3
              className="h-5 w-5"
              style={{ color: color.primary.accent }}
            />
            <p className="text-sm font-medium text-gray-600">Total Workflows</p>
          </div>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {isLoadingStats ? "..." : stats.total}
          </p>
        </div>
        <div
          className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}
        >
          <div className="flex items-center gap-2">
            <Play className="h-5 w-5" style={{ color: color.primary.accent }} />
            <p className="text-sm font-medium text-gray-600">Active</p>
          </div>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {isLoadingStats ? "..." : stats.active}
          </p>
        </div>
        <div
          className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}
        >
          <div className="flex items-center gap-2">
            <Pause
              className="h-5 w-5"
              style={{ color: color.primary.accent }}
            />
            <p className="text-sm font-medium text-gray-600">Inactive</p>
          </div>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {isLoadingStats ? "..." : stats.inactive}
          </p>
        </div>
        <div
          className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}
        >
          <div className="flex items-center gap-2">
            <BarChart3
              className="h-5 w-5"
              style={{ color: color.primary.accent }}
            />
            <p className="text-sm font-medium text-gray-600">
              Pending Activation
            </p>
          </div>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {isLoadingStats ? "..." : stats.pending_activation}
          </p>
        </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="space-y-4 mt-6">
          <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <SearchInput
            placeholder="Search workflows..."
            value={searchTerm}
            onChange={(value) => setSearchTerm(value)}
          />
        </div>
        <HeadlessSelect
          options={[
            { value: "", label: "All Types" },
            ...workflowTypes.map((type) => ({ value: type, label: type })),
          ]}
          value={workflowTypeFilter}
          onChange={(value) => setWorkflowTypeFilter(String(value))}
          placeholder="Filter by type"
          className="w-full sm:w-48"
        />
        <HeadlessSelect
          options={[
            { value: "all", label: "All" },
            { value: "active", label: "Active" },
            { value: "inactive", label: "Inactive" },
          ]}
          value={statusFilter}
          onChange={(value) =>
            setStatusFilter(value as "all" | "active" | "inactive")
          }
          placeholder="Status"
          className="w-full sm:w-40"
        />
          </div>
        </div>

        {/* Batch Actions Toolbar */}
      {isSelectionMode && selectedWorkflows.size > 0 && (
        <div
          className={`${tw.rounded} border border-gray-200 bg-white p-4 flex items-center justify-between`}
        >
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-900">
              {selectedWorkflows.size} selected
            </span>
            <button
              onClick={handleSelectAll}
              className="text-sm hover:opacity-80"
              style={{ color: color.primary.accent }}
            >
              {selectedWorkflows.size === workflows.length
                ? "Deselect All"
                : "Select All"}
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleBatchActivate}
              disabled={isBatchProcessing}
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
              <Play className="h-4 w-4" />
              Activate
            </button>
            <button
              onClick={handleBatchDeactivate}
              disabled={isBatchProcessing}
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
              <Pause className="h-4 w-4" />
              Deactivate
            </button>
            <button
              onClick={() => {
                setSelectedWorkflows(new Set());
                setIsSelectionMode(false);
              }}
              className={`inline-flex items-center gap-2 ${tw.rounded} px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50`}
            >
              Clear All
            </button>
          </div>
        </div>
      )}

      {/* Workflows List */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <LoadingSpinner />
        </div>
      ) : workflows.length === 0 ? (
        <div
          className={`${tw.rounded} border border-gray-200 bg-white p-8 text-center`}
        >
          <p className="text-gray-500">No workflows found</p>
        </div>
      ) : (
        <>
          <Table<Workflow>
            columns={columns}
            data={workflows}
            totalItems={totalCount}
            currentPage={page}
            pageSize={pageSize}
            isLoading={isLoading}
            onPageChange={setPage}
            onSort={handleSort}
            sortConfigs={sortConfigs}
            style={{
              headerBackground: color.surface.tableHeader,
              headerTextColor: color.surface.tableHeaderText,
              rowBackground: color.surface.tablebodybg,
              rowSpacing: "0 8px",
            }}
          />

          {/* Pagination */}
          {workflows.length > 0 && (
            <div className="mt-4">
              <Pagination
                currentPage={page}
                pageSize={pageSize}
                totalItems={totalCount}
                onPageChange={setPage}
                onPageSizeChange={setPageSize}
              />
            </div>
          )}
        </>
      )}
      </div>

      <DeleteConfirmModal
        isOpen={deleteConfirm.id !== null}
        onClose={() => {
          closeDeleteConfirm();
          setDeletingWorkflow(null);
          setRowLoading(null);
        }}
        onConfirm={confirmDeleteWorkflow}
        title="Delete Workflow"
        description="This action cannot be undone."
        itemName={deleteConfirm.itemName}
        isLoading={isDeleting}
      />

      <WorkflowViewModal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setViewingWorkflow(null);
        }}
        workflow={viewingWorkflow}
        isLoading={isLoadingView}
      />

      <WorkflowModal
        isOpen={showWorkflowModal}
        onClose={() => {
          setShowWorkflowModal(false);
          setEditingWorkflow(null);
        }}
        onSuccess={() => {
          setShowWorkflowModal(false);
          setEditingWorkflow(null);
          setPage(1);
          fetchWorkflows();
          fetchStats();
        }}
        workflow={editingWorkflow}
      />
    </>
  );
}

interface WorkflowViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  workflow: Workflow | null;
  isLoading: boolean;
}

function WorkflowViewModal({
  isOpen,
  onClose,
  workflow,
  isLoading,
}: WorkflowViewModalProps) {
  if (!isOpen) return null;

  const { t } = useLanguage();

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center bg-black/50 p-4">
        <div className="relative w-full max-w-md rounded-lg bg-white shadow-xl">
          {/* Header */}
          <div className="border-b border-gray-200 p-6">
            <div className="flex items-start justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                {workflow?.name || "Workflow Details"}
              </h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner />
              </div>
            ) : workflow ? (
              <div className="space-y-4 text-sm">
                <div>
                  <p className="font-medium text-gray-600">Status</p>
                  <p className="mt-1 text-gray-900">
                    {workflow.is_active ? "Active" : "Inactive"}
                  </p>
                </div>

                {workflow.workflow_type && (
                  <div>
                    <p className="font-medium text-gray-600">Type</p>
                    <p className="mt-1 text-gray-900">{workflow.workflow_type}</p>
                  </div>
                )}

                {workflow.description && (
                  <div>
                    <p className="font-medium text-gray-600">Description</p>
                    <p className="mt-1 text-gray-900">{workflow.description}</p>
                  </div>
                )}

                <div>
                  <p className="font-medium text-gray-600">Created</p>
                  <p className="mt-1 text-gray-900">
                    <DateFormatter
                      date={workflow.created_at}
                      useUserTimezone
                      includeTime
                    />
                  </p>
                </div>

                {workflow.updated_at && (
                  <div>
                    <p className="font-medium text-gray-600">Updated</p>
                    <p className="mt-1 text-gray-900">
                      <DateFormatter
                        date={workflow.updated_at}
                        useUserTimezone
                        includeTime
                      />
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-center text-gray-500">No workflow selected</p>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
