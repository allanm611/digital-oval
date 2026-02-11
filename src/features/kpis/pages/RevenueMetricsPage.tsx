import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Edit, Trash2, Search, Eye, DollarSign } from "lucide-react";
import BackButton from "../../../shared/components/ui/BackButton";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import Pagination from "../../../shared/components/ui/Pagination";
import { RevenueMetric } from "../types/revenueMetrics";
import { revenueMetricService } from "../services/revenueMetricService";
import { useToast } from "../../../contexts/ToastContext";
import { color, tw } from "../../../shared/utils/utils";

export default function RevenueMetricsPage() {
  const navigate = useNavigate();
  const { success, error: showError } = useToast();

  const [metrics, setMetrics] = useState<RevenueMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [deleteConfirmName, setDeleteConfirmName] = useState("");
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
      setLoading(true);
      const data = await revenueMetricService.getAllMetrics();
      setMetrics(data);
    } catch (err) {
      showError("Error", "Failed to load revenue metrics");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (metric: RevenueMetric) => {
    setDeleteConfirmId(metric.id);
    setDeleteConfirmName(metric.name);
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmId) return;

    try {
      setDeleting(deleteConfirmId);
      await revenueMetricService.deleteMetric(deleteConfirmId);
      success(
        "Success",
        `"${deleteConfirmName}" has been deleted successfully`,
      );
      await loadMetrics();
      setDeleteConfirmId(null);
      setDeleteConfirmName("");
    } catch (err) {
      showError("Error", "Failed to delete revenue metric");
    } finally {
      setDeleting(null);
    }
  };

  const filteredMetrics = useMemo(() => {
    return metrics.filter((metric) => {
      const matchesSearch =
        metric.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        metric.description.toLowerCase().includes(searchTerm.toLowerCase());
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
    dataRevenue: metrics.filter((m) => m.category === "data_revenue").length,
    voiceRevenue: metrics.filter((m) => m.category === "voice_revenue").length,
    otherRevenue: metrics.filter(
      (m) =>
        m.category === "sms_revenue" ||
        m.category === "bundle_revenue" ||
        m.category === "other_revenue",
    ).length,
  };

  const statCards = [
    { name: "Total Metrics", value: stats.totalMetrics, icon: DollarSign },
    { name: "Data Revenue", value: stats.dataRevenue, icon: DollarSign },
    { name: "Voice Revenue", value: stats.voiceRevenue, icon: DollarSign },
    { name: "Other Revenue", value: stats.otherRevenue, icon: DollarSign },
  ];

  const categoryOptions = [
    { value: "all", label: "All Categories" },
    { value: "data_revenue", label: "Data Revenue" },
    { value: "voice_revenue", label: "Voice Revenue" },
    { value: "sms_revenue", label: "SMS Revenue" },
    { value: "bundle_revenue", label: "Bundle Revenue" },
    { value: "other_revenue", label: "Other Revenue" },
  ];

  const handleCategoryChange = (value: string) => {
    setCategoryFilter(value || "all");
  };

  return (
    <div className="space-y-6">
      {/* Header with Back Button and Create Button */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <BackButton fallbackTo="/dashboard/kpis" />
          <div>
            <h2 className="text-3xl font-bold text-gray-900">
              Revenue Metrics
            </h2>
            <p className={`text-sm ${tw.textSecondary} mt-1`}>
              Manage revenue performance indicators and metrics tracking
            </p>
          </div>
        </div>
        <button
          onClick={() => navigate("/dashboard/kpis/revenue-metrics/create")}
          disabled={loading}
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
        <div className="relative flex-1 min-w-[250px]">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search metrics..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            disabled={loading}
            className={`w-full ${tw.rounded} border border-gray-200 bg-white py-3 pl-10 pr-4 text-sm focus:border-gray-300 focus:outline-none focus:ring-0`}
          />
        </div>

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
            {loading ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <LoadingSpinner
                      variant="modern"
                      size="md"
                      color="primary"
                    />
                    <p className={`${tw.textMuted} font-medium mt-4`}>
                      Loading metrics...
                    </p>
                  </div>
                </td>
              </tr>
            ) : filteredMetrics.length === 0 ? (
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
                        onClick={() =>
                          navigate(
                            `/dashboard/kpis/revenue-metrics/${metric.id}`,
                          )
                        }
                        disabled={deleting === metric.id || loading}
                        className={`p-2 ${tw.rounded} text-black disabled:opacity-60`}
                        title="View details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() =>
                          navigate(
                            `/dashboard/kpis/revenue-metrics/${metric.id}/edit`,
                          )
                        }
                        disabled={deleting === metric.id || loading}
                        className={`p-2 ${tw.rounded} text-black disabled:opacity-60`}
                        title="Edit metric"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(metric)}
                        disabled={deleting === metric.id || loading}
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
              Delete Revenue Metric
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
