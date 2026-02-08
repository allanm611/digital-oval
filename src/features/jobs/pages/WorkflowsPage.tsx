import { useCallback, useEffect, useState } from "react";
import {
  Eye,
  Edit,
  Plus,
  Search,
  Trash2,
  BarChart3,
  Copy,
  Play,
  Pause,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import DeleteConfirmModal from "../../../shared/components/ui/DeleteConfirmModal";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import CreateButton from "../../../shared/components/ui/CreateButton";
import { color, tw, button } from "../../../shared/utils/utils";
import { useToast } from "../../../contexts/ToastContext";
import { useLanguage } from "../../../contexts/LanguageContext";
import { PermissionGate } from "../../auth/components/PermissionGate";
import { workflowService } from "../services/workflowService";
import type { Workflow } from "../types/workflow";
import { useAuth } from "../../../contexts/AuthContext";

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
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingWorkflow, setDeletingWorkflow] = useState<Workflow | null>(
    null,
  );
  const [deleteName, setDeleteName] = useState<string>("this workflow");
  const [isDeleting, setIsDeleting] = useState(false);
  const [rowLoading, setRowLoading] = useState<{
    id: number;
    action: "clone" | "delete";
  } | null>(null);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedWorkflows, setSelectedWorkflows] = useState<Set<number>>(
    new Set(),
  );
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);
  const [page, setPage] = useState(0);
  const [pageSize] = useState(20);
  const [totalCount, setTotalCount] = useState(0);

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
            offset: page * pageSize,
            skipCache: true,
          },
        );
      } else if (searchTerm.trim()) {
        response = await workflowService.searchWorkflows({
          q: searchTerm.trim(),
          activeOnly: statusFilter === "active",
          limit: pageSize,
          offset: page * pageSize,
          skipCache: true,
        });
      } else if (statusFilter === "active") {
        response = await workflowService.getActiveWorkflows({
          limit: pageSize,
          offset: page * pageSize,
          skipCache: true,
        });
      } else if (statusFilter === "inactive") {
        response = await workflowService.getInactiveWorkflows({
          limit: pageSize,
          offset: page * pageSize,
          skipCache: true,
        });
      } else {
        response = await workflowService.getAllWorkflows({
          limit: pageSize,
          offset: page * pageSize,
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
    setPage(0);
  }, [searchTerm, statusFilter, workflowTypeFilter]);

  const fetchStats = useCallback(async () => {
    setIsLoadingStats(true);
    try {
      const [statusCounts, typesResponse, totalResponse] = await Promise.all([
        workflowService.getStatusCounts(true),
        workflowService.getWorkflowTypes(true),
        workflowService
          .getAllWorkflows({ limit: 50, offset: 0, skipCache: true })
          .catch(() => ({ data: [], pagination: { total: 0 } })),
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

      const totalFromPagination = totalResponse?.pagination?.total ?? 0;
      const totalFromCount = Array.isArray(totalResponse?.data)
        ? totalResponse.data.length
        : 0;

      const totalFinal =
        totalFromPagination || totalFromCount || totalCalculatedFromStatus || 0;

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

  const handleDelete = async () => {
    if (!deletingWorkflow) return;

    setIsDeleting(true);
    try {
      await workflowService.deleteWorkflow(deletingWorkflow.id);
      showToast(
        t.workflows.deleteSuccess,
        "Workflow has been deleted successfully.",
      );
      setShowDeleteModal(false);
      setDeletingWorkflow(null);
      setRowLoading(null);
      fetchWorkflows();
      fetchStats();
    } catch (err) {
      showError(
        t.workflows.deleteFailed || "Delete failed",
        err instanceof Error ? err.message : t.common.error || "Unknown error",
      );
    } finally {
      setIsDeleting(false);
    }
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

  const handleClone = async (workflow: Workflow) => {
    setRowLoading({ id: workflow.id, action: "clone" });
    try {
      await workflowService.cloneWorkflow(workflow.id, {
        newName: `${workflow.name} (Copy)`,
        created_by: user?.user_id || null,
      });
      showToast(
        t.workflows.cloneSuccess || "Workflow cloned",
        "Workflow has been cloned successfully.",
      );
      fetchWorkflows();
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-2xl font-bold ${tw.textPrimary}`}>Workflows</h1>
          <p className={`${tw.textSecondary} mt-1 text-sm`}>
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
          <PermissionGate permission="job-workflows.create">
            <CreateButton route="/dashboard/workflows/create" />
          </PermissionGate>
        </div>
      </div>

      {/* Stats Cards (inline loader like scheduled jobs) */}
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

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search workflows..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full pl-10 pr-4 py-2 ${tw.rounded} border border-gray-300 focus:border-[#3b8169] focus:outline-none focus:ring-1 focus:ring-[#3b8169]`}
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
        <div className="overflow-x-auto">
          <table
            className="w-full"
            style={{ borderCollapse: "separate", borderSpacing: "0 8px" }}
          >
            <thead>
              <tr>
                {isSelectionMode && (
                  <th
                    className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                    style={{
                      color: color.surface.tableHeaderText,
                      backgroundColor: color.surface.tableHeader,
                      borderTopLeftRadius: "0.375rem",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={
                        selectedWorkflows.size === workflows.length &&
                        workflows.length > 0
                      }
                      onChange={handleSelectAll}
                      className="rounded border-gray-300 text-[#3b8169] focus:ring-[#3b8169]"
                    />
                  </th>
                )}
                <th
                  className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                  style={{
                    color: color.surface.tableHeaderText,
                    backgroundColor: color.surface.tableHeader,
                    ...(!isSelectionMode && {
                      borderTopLeftRadius: "0.375rem",
                    }),
                  }}
                >
                  Name
                </th>
                <th
                  className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                  style={{
                    color: color.surface.tableHeaderText,
                    backgroundColor: color.surface.tableHeader,
                  }}
                >
                  Type
                </th>
                <th
                  className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                  style={{
                    color: color.surface.tableHeaderText,
                    backgroundColor: color.surface.tableHeader,
                  }}
                >
                  Status
                </th>
                <th
                  className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                  style={{
                    color: color.surface.tableHeaderText,
                    backgroundColor: color.surface.tableHeader,
                  }}
                >
                  Created
                </th>
                <th
                  className="px-6 py-4 text-right text-xs font-medium uppercase tracking-wider"
                  style={{
                    color: color.surface.tableHeaderText,
                    backgroundColor: color.surface.tableHeader,
                    borderTopRightRadius: "0.375rem",
                  }}
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {workflows.map((workflow) => (
                <tr key={workflow.id} className="transition-colors">
                  {isSelectionMode && (
                    <td
                      className="px-6 py-4"
                      style={{
                        backgroundColor: color.surface.tablebodybg,
                        borderTopLeftRadius: "0.375rem",
                        borderBottomLeftRadius: "0.375rem",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedWorkflows.has(workflow.id)}
                        onChange={() => handleToggleSelection(workflow.id)}
                        className="rounded border-gray-300 text-[#3b8169] focus:ring-[#3b8169]"
                      />
                    </td>
                  )}
                  <td
                    className="px-6 py-4"
                    style={{
                      backgroundColor: color.surface.tablebodybg,
                      ...(!isSelectionMode && {
                        borderTopLeftRadius: "0.375rem",
                        borderBottomLeftRadius: "0.375rem",
                      }),
                    }}
                  >
                    <div className="text-sm font-semibold text-gray-900">
                      {workflow.name}
                    </div>
                  </td>
                  <td
                    className="px-6 py-4"
                    style={{ backgroundColor: color.surface.tablebodybg }}
                  >
                    <div className="text-sm text-gray-600">
                      {workflow.workflow_type || "—"}
                    </div>
                  </td>
                  <td
                    className="px-6 py-4"
                    style={{ backgroundColor: color.surface.tablebodybg }}
                  >
                    <span className="text-sm text-black font-medium">
                      {workflow.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td
                    className="px-6 py-4"
                    style={{ backgroundColor: color.surface.tablebodybg }}
                  >
                    <span className="text-sm text-gray-600">
                      {new Date(workflow.created_at).toLocaleDateString()}
                    </span>
                  </td>
                  <td
                    className="px-6 py-4 text-right"
                    style={{
                      backgroundColor: color.surface.tablebodybg,
                      borderTopRightRadius: "0.375rem",
                      borderBottomRightRadius: "0.375rem",
                    }}
                  >
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() =>
                          navigate(`/dashboard/workflows/${workflow.id}`)
                        }
                        className={`p-2 ${tw.rounded} text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors`}
                        aria-label="View workflow"
                        title="View"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() =>
                          navigate(`/dashboard/workflows/${workflow.id}/edit`)
                        }
                        className={`p-2 ${tw.rounded} text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors`}
                        aria-label="Edit workflow"
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
                        aria-label="Clone workflow"
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
                        onClick={() => {
                          setDeletingWorkflow(workflow);
                          setDeleteName(
                            workflow.name?.trim() || "this workflow",
                          );
                          setShowDeleteModal(true);
                        }}
                        className={`p-2 text-red-600 hover:text-red-700 hover:bg-red-50 ${tw.rounded} transition-colors`}
                        aria-label="Delete workflow"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {/* Pagination */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-white">
            <div className="text-sm text-gray-600">
              Showing{" "}
              <span className="font-medium">
                {workflows.length === 0 ? 0 : page * pageSize + 1}
              </span>{" "}
              to{" "}
              <span className="font-medium">
                {Math.min((page + 1) * pageSize, totalCount)}
              </span>{" "}
              of <span className="font-medium">{totalCount}</span> workflows
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(p - 1, 0))}
                disabled={page === 0 || isLoading}
                className={`inline-flex items-center gap-1 ${tw.rounded} px-3 py-1.5 text-sm font-medium border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50`}
              >
                Prev
              </button>
              <button
                onClick={() => {
                  const nextOffset = (page + 1) * pageSize;
                  if (nextOffset < totalCount) setPage((p) => p + 1);
                }}
                disabled={isLoading || (page + 1) * pageSize >= totalCount}
                className={`inline-flex items-center gap-1 ${tw.rounded} px-3 py-1.5 text-sm font-medium border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50`}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setDeletingWorkflow(null);
          setRowLoading(null);
          setDeleteName("this workflow");
        }}
        onConfirm={handleDelete}
        title="Delete Workflow"
        description="This action cannot be undone."
        itemName={deleteName}
        isLoading={isDeleting}
      />
    </div>
  );
}
