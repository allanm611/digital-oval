import { useCallback, useEffect, useState } from "react";
import {
  Eye,
  Edit,
  Plus,
  Search,
  Trash2,
  CheckSquare,
  Square,
  Filter,
  BarChart3,
  Copy,
  Play,
  Pause,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import DeleteConfirmModal from "../../../shared/components/ui/DeleteConfirmModal";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import { color, tw } from "../../../shared/utils/utils";
import { useToast } from "../../../contexts/ToastContext";
import { workflowService } from "../services/workflowService";
import type { Workflow } from "../types/workflow";
import { useAuth } from "../../../contexts/AuthContext";

export default function WorkflowsPage() {
  const navigate = useNavigate();
  const { error: showError, success: showToast } = useToast();
  const { user } = useAuth();

  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeOnlyFilter, setActiveOnlyFilter] = useState(true);
  const [workflowTypeFilter, setWorkflowTypeFilter] = useState<string>("");
  const [workflowTypes, setWorkflowTypes] = useState<string[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
  });
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingWorkflow, setDeletingWorkflow] = useState<Workflow | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedWorkflows, setSelectedWorkflows] = useState<Set<number>>(new Set());
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const fetchWorkflows = useCallback(async () => {
    setIsLoading(true);
    try {
      let response;

      if (workflowTypeFilter) {
        response = await workflowService.getWorkflowsByType(workflowTypeFilter, {
          activeOnly: activeOnlyFilter,
          limit: 50,
        });
      } else if (searchTerm.trim()) {
        response = await workflowService.searchWorkflows({
          q: searchTerm.trim(),
          activeOnly: activeOnlyFilter,
          limit: 50,
          skipCache: true,
        });
      } else if (activeOnlyFilter) {
        response = await workflowService.getActiveWorkflows({
          limit: 50,
          skipCache: true,
        });
      } else {
        response = await workflowService.getAllWorkflows({
          limit: 50,
          skipCache: true,
        });
      }

      setWorkflows(response.data || []);
    } catch (err) {
      showError(
        "Error",
        err instanceof Error ? err.message : "Failed to load workflows"
      );
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, activeOnlyFilter, workflowTypeFilter, showError]);

  const fetchStats = useCallback(async () => {
    setIsLoadingStats(true);
    try {
      const [statusCounts, typesResponse] = await Promise.all([
        workflowService.getStatusCounts(true),
        workflowService.getWorkflowTypes(),
      ]);

      setStats({
        total: statusCounts.data?.total || 0,
        active: statusCounts.data?.active || 0,
        inactive: statusCounts.data?.inactive || 0,
      });

      // Ensure workflowTypes is always an array
      // Handle both cases: response might be array directly or wrapped in { data: string[] }
      let types: string[] = [];
      if (Array.isArray(typesResponse)) {
        types = typesResponse;
      } else if (typesResponse?.data && Array.isArray(typesResponse.data)) {
        types = typesResponse.data;
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
      showToast("Workflow deleted", "Workflow has been deleted successfully.");
      setShowDeleteModal(false);
      setDeletingWorkflow(null);
      fetchWorkflows();
      fetchStats();
    } catch (err) {
      showError(
        "Delete failed",
        err instanceof Error ? err.message : "Unknown error"
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
        "Workflows activated",
        `${result.success} workflow(s) activated successfully.`
      );
      setSelectedWorkflows(new Set());
      setIsSelectionMode(false);
      fetchWorkflows();
      fetchStats();
    } catch (err) {
      showError(
        "Batch activate failed",
        err instanceof Error ? err.message : "Unknown error"
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
        "Workflows deactivated",
        `${result.success} workflow(s) deactivated successfully.`
      );
      setSelectedWorkflows(new Set());
      setIsSelectionMode(false);
      fetchWorkflows();
      fetchStats();
    } catch (err) {
      showError(
        "Batch deactivate failed",
        err instanceof Error ? err.message : "Unknown error"
      );
    } finally {
      setIsBatchProcessing(false);
    }
  };

  const handleClone = async (workflow: Workflow) => {
    try {
      await workflowService.cloneWorkflow(workflow.id, {
        newName: `${workflow.name} (Copy)`,
        created_by: user?.user_id || null,
      });
      showToast("Workflow cloned", "Workflow has been cloned successfully.");
      fetchWorkflows();
      fetchStats();
    } catch (err) {
      showError(
        "Clone failed",
        err instanceof Error ? err.message : "Unknown error"
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-2xl font-bold ${tw.textPrimary}`}>
            Workflows
          </h1>
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
            onClick={() => navigate("/dashboard/workflows/create")}
            className={`inline-flex items-center gap-2 ${tw.rounded} px-4 py-2 text-sm font-semibold text-white`}
            style={{ backgroundColor: color.primary.action }}
          >
            <Plus className="h-4 w-4" />
            Create Workflow
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {!isLoadingStats && (
        <div className="grid gap-4 md:grid-cols-3">
          <div className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" style={{ color: color.primary.accent }} />
              <p className="text-sm font-medium text-gray-600">Total Workflows</p>
            </div>
            <p className="mt-2 text-3xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}>
            <div className="flex items-center gap-2">
              <Play className="h-5 w-5" style={{ color: color.primary.accent }} />
              <p className="text-sm font-medium text-gray-600">Active</p>
            </div>
            <p className="mt-2 text-3xl font-bold text-gray-900">{stats.active}</p>
          </div>
          <div className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}>
            <div className="flex items-center gap-2">
              <Pause className="h-5 w-5" style={{ color: color.primary.accent }} />
              <p className="text-sm font-medium text-gray-600">Inactive</p>
            </div>
            <p className="mt-2 text-3xl font-bold text-gray-900">{stats.inactive}</p>
          </div>
        </div>
      )}

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
            { value: "true", label: "Active Only" },
            { value: "false", label: "All" },
          ]}
          value={activeOnlyFilter ? "true" : "false"}
          onChange={(value) => setActiveOnlyFilter(value === "true")}
          placeholder="Status"
          className="w-full sm:w-40"
        />
        <button
          onClick={() => setIsSelectionMode(!isSelectionMode)}
          className={`inline-flex items-center gap-2 ${tw.rounded} px-4 py-2 text-sm font-medium border border-gray-300 bg-white hover:bg-gray-50`}
        >
          {isSelectionMode ? "Cancel" : "Select"}
        </button>
      </div>

      {/* Batch Actions Toolbar */}
      {isSelectionMode && selectedWorkflows.size > 0 && (
        <div className={`${tw.rounded} border border-gray-200 bg-white p-4 flex items-center justify-between`}>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">
              {selectedWorkflows.size} selected
            </span>
            <button
              onClick={handleSelectAll}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              {selectedWorkflows.size === workflows.length ? "Deselect All" : "Select All"}
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleBatchActivate}
              disabled={isBatchProcessing}
              className={`inline-flex items-center gap-2 ${tw.rounded} px-4 py-2 text-sm font-medium text-green-700 bg-green-50 border border-green-300 hover:bg-green-100 disabled:opacity-50`}
            >
              <Play className="h-4 w-4" />
              Activate
            </button>
            <button
              onClick={handleBatchDeactivate}
              disabled={isBatchProcessing}
              className={`inline-flex items-center gap-2 ${tw.rounded} px-4 py-2 text-sm font-medium text-orange-700 bg-orange-50 border border-orange-300 hover:bg-orange-100 disabled:opacity-50`}
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
        <div className={`${tw.rounded} border border-gray-200 bg-white p-8 text-center`}>
          <p className="text-gray-500">No workflows found</p>
        </div>
      ) : (
        <div className={`${tw.rounded} border border-gray-200 bg-white shadow-sm overflow-hidden`}>
          <table className="min-w-full divide-y divide-gray-200">
            <thead style={{ backgroundColor: color.surface.tableHeader }}>
              <tr>
                {isSelectionMode && (
                  <th className="px-6 py-3 text-left">
                    <button onClick={handleSelectAll}>
                      {selectedWorkflows.size === workflows.length ? (
                        <CheckSquare className="h-5 w-5 text-gray-600" />
                      ) : (
                        <Square className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                  </th>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: color.surface.tableHeaderText }}>
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: color.surface.tableHeaderText }}>
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: color.surface.tableHeaderText }}>
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: color.surface.tableHeaderText }}>
                  Created
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider" style={{ color: color.surface.tableHeaderText }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200" style={{ backgroundColor: color.surface.tablebodybg }}>
              {workflows.map((workflow) => (
                <tr key={workflow.id} className="hover:bg-gray-50">
                  {isSelectionMode && (
                    <td className="px-6 py-4">
                      <button onClick={() => handleToggleSelection(workflow.id)}>
                        {selectedWorkflows.has(workflow.id) ? (
                          <CheckSquare className="h-5 w-5 text-gray-600" />
                        ) : (
                          <Square className="h-5 w-5 text-gray-400" />
                        )}
                      </button>
                    </td>
                  )}
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {workflow.name}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {workflow.workflow_type || "—"}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 ${tw.rounded} text-xs font-medium ${
                        workflow.is_active
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {workflow.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {new Date(workflow.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => navigate(`/dashboard/workflows/${workflow.id}`)}
                        className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
                        title="View details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => navigate(`/dashboard/workflows/${workflow.id}/edit`)}
                        className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleClone(workflow)}
                        className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
                        title="Clone"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setDeletingWorkflow(workflow);
                          setShowDeleteModal(true);
                        }}
                        className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded transition-colors"
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
        </div>
      )}

      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setDeletingWorkflow(null);
        }}
        onConfirm={handleDelete}
        title="Delete Workflow"
        message={`Are you sure you want to delete "${deletingWorkflow?.name}"? This action cannot be undone.`}
        isDeleting={isDeleting}
      />
    </div>
  );
}

