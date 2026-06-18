import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Edit, Trash2, Eye, Activity } from "lucide-react";
import Input from "../../../shared/components/ui/Input";
import BackButton from "../../../shared/components/ui/BackButton";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import Pagination, { DEFAULT_PAGE_SIZE } from "../../../shared/components/ui/Pagination";
import ActivateDeactivateButton from "../../../shared/components/ui/ActivateDeactivateButton";
import { Table, useTable, type TableColumn } from "../../../shared/components/Table";
import { ColumnPickerModal } from "../../../shared/components/ColumnPickerModal";
import { UsageMetric } from "../types/usageMetrics";
import { usageMetricService } from "../services/usageMetricService";
import { useToast } from "../../../contexts/ToastContext";
import { extractBackendError } from "../../../shared/utils/errorHandler";;;
import { color, tw } from "../../../shared/utils/utils";
import KPIDetailsExpandedRow from "../components/KPIDetailsExpandedRow";

export default function UsageMetricsPage() {
  const navigate = useNavigate();
  const { success, error: showError } = useToast();

  const [metrics, setMetrics] = useState<UsageMetric[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [toggling, setToggling] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [showColumnPicker, setShowColumnPicker] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [deleteConfirmName, setDeleteConfirmName] = useState("");
  const [expandedRowId, setExpandedRowId] = useState<number | null>(null);
  const [clearFiltersKey, setClearFiltersKey] = useState(0);

  const tableColumns: TableColumn<UsageMetric>[] = [
    {
      id: "name",
      label: "Metric Name",
      visible: true,
      filterConfig: { type: "text" },
      render: (_, row) => (
        <div className={`text-sm ${tw.tableFirstColumn} font-medium text-black`}>
          {row.name}
        </div>
      ),
    },
    {
      id: "category",
      label: "Category",
      visible: true,
      filterConfig: { type: "select", options: ["Data Usage", "Voice Usage", "SMS Usage", "Bundle Usage", "DOU Metrics"] },
      render: (_, row) => (
        <span className="text-sm text-black">
          {row.category
            .replace(/_/g, " ")
            .replace(/\b\w/g, (l) => l.toUpperCase())}
        </span>
      ),
    },
    {
      id: "field_type",
      label: "Type",
      visible: true,
      filterConfig: { type: "select", options: ["Decimal", "Numeric"] },
      render: (_, row) => (
        <span className="text-sm text-black">
          {row.field_type === "decimal" ? "Decimal" : "Numeric"}
        </span>
      ),
    },
    {
      id: "description",
      label: "Description",
      visible: true,
      filterConfig: { type: "text" },
      render: (_, row) => (
        <span className="text-sm text-black truncate max-w-xs" title={row.description}>
          {row.description || "—"}
        </span>
      ),
    },
    {
      id: "is_active",
      label: "Status",
      visible: true,
      filterConfig: { type: "select", options: ["Active", "Inactive"] },
      render: (_, row) => (
        <span className="text-sm text-black">
          {row.is_active ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      id: "actions",
      label: "Actions",
      visible: true,
      sortable: false,
      render: (_, row) => (
        <div className="flex items-center justify-end space-x-2">
          <ActivateDeactivateButton
            isActive={row.is_active ?? true}
            onToggle={() => handleToggleActive(row)}
            disabled={toggling === row.id || deleting === row.id}
            isLoading={toggling === row.id}
          />
          <button
            onClick={() =>
              navigate(
                `/dashboard/kpis/usage-metrics/${row.id}`,
                { state: { parentLabel: "Usage Metrics" } }
              )
            }
            disabled={deleting === row.id}
            className={`p-2 icon-edit ${tw.rounded} disabled:opacity-60`}
            title="View details"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() =>
              navigate(
                `/dashboard/kpis/usage-metrics/${row.id}/edit`,
              )
            }
            disabled={deleting === row.id}
            className={`p-2 icon-edit ${tw.rounded} disabled:opacity-60`}
            title="Edit metric"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDeleteClick(row)}
            disabled={deleting === row.id}
            className={`p-2 icon-delete ${tw.rounded} disabled:opacity-60`}
            title="Delete metric"
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
    toggleColumn,
    reorderColumns,
    resetToDefaults,
  } = useTable({
    tableId: "usage-metrics-table",
    defaultColumns: tableColumns,
    defaultPageSize: DEFAULT_PAGE_SIZE,
    persistToLocalStorage: true,
  });

  // Reset to page 1 when filters change
  useEffect(() => {
    tableHandlePageChange(1);
  }, [searchTerm, categoryFilter, tableHandlePageChange]);

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    setIsLoading(true);
    try {
      const data = await usageMetricService.getAllMetrics();
      setMetrics(data);
    } catch (err) {
      showError("Error", "Failed to load usage metrics");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilteredCountChange = (count: number) => {
    // Updates when filters applied in the Table component
  };

  const handleDeleteClick = (metric: UsageMetric) => {
    setDeleteConfirmId(metric.id);
    setDeleteConfirmName(metric.name);
  };

  const handleToggleActive = async (metric: UsageMetric) => {
    try {
      setToggling(metric.id);
      const newStatus = !(metric.is_active ?? true);

      // Optimistic update
      setMetrics((prev) =>
        prev.map((m) =>
          m.id === metric.id ? { ...m, is_active: newStatus } : m
        )
      );

      // Call API
      await usageMetricService.toggleMetricStatus(metric.id, newStatus);

      success(
        "Success",
        `"${metric.name}" has been ${newStatus ? "activated" : "deactivated"} successfully`
      );
    } catch (err) {
      console.error("Failed to toggle metric status:", err);
      showError("Error", "Failed to update metric status. Please try again.");

      // Revert optimistic update on error
      setMetrics((prev) =>
        prev.map((m) =>
          m.id === metric.id ? { ...m, is_active: !(metric.is_active ?? true) } : m
        )
      );
    } finally {
      setToggling(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmId) return;

    try {
      setDeleting(deleteConfirmId);
      await usageMetricService.deleteMetric(deleteConfirmId);
      success(
        "Success",
        `"${deleteConfirmName}" has been deleted successfully`,
      );
      await loadMetrics();
      setDeleteConfirmId(null);
      setDeleteConfirmName("");
    } catch (err) {
      showError("Error", extractBackendError(error, "Error. Please try again."));
    } finally {
      setDeleting(null);
    }
  };

  const filteredMetrics = useMemo(() => {
    return metrics.filter((metric) => {
      const matchesSearch =
        metric.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (metric.description && metric.description.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCategory =
        categoryFilter === "all" || metric.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [metrics, searchTerm, categoryFilter]);

  // Calculate statistics
  const stats = {
    totalMetrics: metrics.length,
    dataUsage: metrics.filter((m) => m.category === "data_usage").length,
    voiceUsage: metrics.filter((m) => m.category === "voice_usage").length,
    otherUsage: metrics.filter(
      (m) =>
        m.category === "sms_usage" ||
        m.category === "bundle_usage" ||
        m.category === "dou_metrics",
    ).length,
  };

  const statCards = [
    { name: "Total Metrics", value: stats.totalMetrics, icon: Activity },
    { name: "Data Usage", value: stats.dataUsage, icon: Activity },
    { name: "Voice Usage", value: stats.voiceUsage, icon: Activity },
    { name: "Other Usage", value: stats.otherUsage, icon: Activity },
  ];

  const categoryOptions = [
    { value: "all", label: "All Categories" },
    { value: "data_usage", label: "Data Usage" },
    { value: "voice_usage", label: "Voice Usage" },
    { value: "sms_usage", label: "SMS Usage" },
    { value: "bundle_usage", label: "Bundle Usage" },
    { value: "dou_metrics", label: "DOU Metrics" },
  ];

  const handleCategoryChange = (value: string) => {
    setCategoryFilter(value || "all");
  };

  return (
    <div className="space-y-6">
      {/* Header with Back Button and Create Button */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <BackButton showBreadcrumb={true} currentLabel="Usage Metrics" />
        <button
          onClick={() => navigate("/dashboard/kpis/usage-metrics/create")}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-md whitespace-nowrap disabled:opacity-60"
          style={{ backgroundColor: color.primary.action }}
        >
          <Plus className="w-4 h-4" />
          Create
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.name}
              className={`${tw.rounded} bg-white p-6 shadow-sm`}
            >
              <div className="flex items-center gap-2">
                <Icon
                  className="h-5 w-5"
                  style={{ color: color.primary.accent }}
                />
                <p className="text-sm font-medium text-gray-600">{stat.name}</p>
              </div>
              <p className="mt-2 text-3xl font-bold text-gray-900">
                {stat.value}
              </p>
            </div>
          );
        })}
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:flex-wrap">
        <Input
          placeholder="Search metrics..."
          value={searchTerm}
          onChange={setSearchTerm}
          className="flex-1 min-w-[250px]"
        />

        <HeadlessSelect
          options={categoryOptions}
          value={categoryFilter}
          onChange={(value) => handleCategoryChange(value || "all")}
          placeholder="Filter by category"
          className="min-w-[180px]"
        />
      </div>

      {/* Table Container */}
      <div className={`${tw.rounded} overflow-hidden`}>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner
              variant="modern"
              size="lg"
              color="primary"
              className="mr-3"
            />
            <span className={`${tw.textSecondary}`}>Loading metrics...</span>
          </div>
        ) : filteredMetrics.length === 0 ? (
          <div className="text-center py-12">
            <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className={`text-lg font-medium ${tw.textPrimary} mb-2`}>
              No metrics found
            </h3>
            <p className={`${tw.textMuted} mb-6`}>
              Try adjusting your search or filters
            </p>
          </div>
        ) : (
          <Table<UsageMetric>
            columns={columns}
            data={filteredMetrics}
            totalItems={filteredMetrics.length}
            currentPage={tableCurrentPage}
            pageSize={tablePageSize}
            isLoading={isLoading}
            onPageChange={tableHandlePageChange}
            onSort={handleSort}
            sortConfigs={sortConfigs}
            expandedRowId={expandedRowId}
            onExpandChange={setExpandedRowId}
            expandedContent={(row) => (
              <KPIDetailsExpandedRow kpi={row} colSpan={columns.filter((c) => c.visible).length} />
            )}
            onFilteredCountChange={handleFilteredCountChange}
            clearFiltersKey={clearFiltersKey}
            onHideColumn={toggleColumn}
            onManageColumnsClick={() => setShowColumnPicker(true)}
            style={{
              headerBackground: color.surface.tableHeader,
              headerTextColor: color.surface.tableHeaderText,
              rowBackground: color.surface.tablebodybg,
              rowSpacing: "0 8px",
            }}
          />
        )}
      </div>


      {!isLoading && filteredMetrics.length > 0 && (
        <Pagination
          currentPage={tableCurrentPage}
          pageSize={tablePageSize}
          totalItems={filteredMetrics.length}
          onPageChange={tableHandlePageChange}
          onPageSizeChange={tableHandlePageSizeChange}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-md p-6 max-w-md w-full mx-4">
            <h3 className={`text-lg font-semibold ${tw.textPrimary} mb-2`}>
              Delete Usage Metric
            </h3>
            <p className={`${tw.textSecondary} text-sm mb-6`}>
              Are you sure you want to delete "{deleteConfirmName}"? This action
              cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                disabled={deleting !== null}
                className="px-4 py-2 text-sm font-medium border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={deleting !== null}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors disabled:opacity-60"
              >
                {deleting === deleteConfirmId ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Column Picker Modal */}
      <ColumnPickerModal
        isOpen={showColumnPicker}
        columns={columns}
        onClose={() => setShowColumnPicker(false)}
        onToggleColumn={toggleColumn}
        onReorderColumns={reorderColumns}
        onResetToDefaults={resetToDefaults}
      />
    </div>
  );
}
