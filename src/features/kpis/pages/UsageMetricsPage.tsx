import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Edit, Trash2, Eye, Activity, Power } from "lucide-react";
import Input from "../../../shared/components/ui/Input";
import BackButton from "../../../shared/components/ui/BackButton";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import Pagination from "../../../shared/components/ui/Pagination";
import { UsageMetric } from "../types/usageMetrics";
import { usageMetricService } from "../services/usageMetricService";
import { useToast } from "../../../contexts/ToastContext";
import { color, tw } from "../../../shared/utils/utils";

export default function UsageMetricsPage() {
  const navigate = useNavigate();
  const { success, error: showError } = useToast();

  const [metrics, setMetrics] = useState<UsageMetric[]>([]);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [toggling, setToggling] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [deleteConfirmName, setDeleteConfirmName] = useState("");
  const [activeMetrics, setActiveMetrics] = useState<Set<number>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);

  useEffect(() => {
    loadMetrics();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, categoryFilter]);

  const loadMetrics = async () => {
    try {
      const data = await usageMetricService.getAllMetrics();
      setMetrics(data);
    } catch (err) {
      showError("Error", "Failed to load usage metrics");
    }
  };

  const handleDeleteClick = (metric: UsageMetric) => {
    setDeleteConfirmId(metric.id);
    setDeleteConfirmName(metric.name);
  };

  const handleToggleActive = async (metric: UsageMetric) => {
    setToggling(metric.id);
    try {
      const isCurrentlyActive = activeMetrics.has(metric.id);
      const newActiveSet = new Set(activeMetrics);
      if (isCurrentlyActive) {
        newActiveSet.delete(metric.id);
        success("Success", `"${metric.name}" has been deactivated`);
      } else {
        newActiveSet.add(metric.id);
        success("Success", `"${metric.name}" has been activated`);
      }
      setActiveMetrics(newActiveSet);
    } catch (err) {
      showError("Error", "Failed to toggle metric status");
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
      showError("Error", "Failed to delete usage metric");
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

  const paginatedMetrics = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredMetrics.slice(startIndex, endIndex);
  }, [filteredMetrics, currentPage, pageSize]);

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
        <BackButton fallbackTo="/dashboard/kpis" showBreadcrumb={true} currentLabel="Usage Metrics" />
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
              className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}
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
      <div className="overflow-x-auto">
        <table
          className="w-full min-w-[720px]"
          style={{ borderCollapse: "separate", borderSpacing: "0 8px" }}
        >
          <thead>
            <tr>
              <th
                className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider rounded-tl-md"
                style={{
                  color: color.surface.tableHeaderText,
                  backgroundColor: color.surface.tableHeader,
                }}
              >
                Metric Name
              </th>
              <th
                className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                style={{
                  color: color.surface.tableHeaderText,
                  backgroundColor: color.surface.tableHeader,
                }}
              >
                Category
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
                Description
              </th>
              <th
                className="px-6 py-4 text-right text-xs font-medium uppercase tracking-wider rounded-tr-md"
                style={{
                  color: color.surface.tableHeaderText,
                  backgroundColor: color.surface.tableHeader,
                }}
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredMetrics.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center">
                  <p className={`${tw.textSecondary} text-sm`}>
                    No metrics match your search
                  </p>
                </td>
              </tr>
            ) : (
              paginatedMetrics.map((metric) => (
                <tr
                  key={metric.id}
                  style={{ backgroundColor: color.surface.tablebodybg }}
                >
                  <td className="px-6 py-4 text-sm font-medium text-black">
                    {metric.name}
                  </td>
                  <td className="px-6 py-4 text-sm text-black">
                    {metric.category
                      .replace(/_/g, " ")
                      .replace(/\b\w/g, (l) => l.toUpperCase())}
                  </td>
                  <td className="px-6 py-4 text-sm text-black">
                    {metric.field_type === "decimal" ? "Decimal" : "Numeric"}
                  </td>
                  <td className="px-6 py-4 text-sm text-black truncate max-w-xs">
                    {metric.description || "—"}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => handleToggleActive(metric)}
                        disabled={toggling === metric.id || deleting === metric.id}
                        className={`p-2 ${tw.rounded} disabled:opacity-60 transition-colors ${activeMetrics.has(metric.id) ? 'text-green-800' : 'text-orange-800'}`}
                        title={activeMetrics.has(metric.id) ? "Deactivate" : "Activate"}
                      >
                        <Power className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() =>
                          navigate(`/dashboard/kpis/usage-metrics/${metric.id}`, { state: { parentLabel: "Usage Metrics" } })
                        }
                        disabled={deleting === metric.id}
                        className={`p-2 ${tw.rounded} text-black disabled:opacity-60`}
                        title="View details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() =>
                          navigate(
                            `/dashboard/kpis/usage-metrics/${metric.id}/edit`,
                          )
                        }
                        disabled={deleting === metric.id}
                        className={`p-2 ${tw.rounded} text-black disabled:opacity-60`}
                        title="Edit metric"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(metric)}
                        disabled={deleting === metric.id}
                        className={`p-2 text-black ${tw.rounded} disabled:opacity-60`}
                        title="Delete metric"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {paginatedMetrics.length > 0 && filteredMetrics.length > 0 && (
        <Pagination
          currentPage={currentPage}
          pageSize={pageSize}
          totalItems={filteredMetrics.length}
          onPageChange={setCurrentPage}
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
    </div>
  );
}
