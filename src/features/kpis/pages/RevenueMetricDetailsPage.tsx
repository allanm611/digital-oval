import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Edit, Trash2, DollarSign } from "lucide-react";
import BackButton from "../../../shared/components/ui/BackButton";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import { RevenueMetric } from "../types/revenueMetrics";
import { revenueMetricService } from "../services/revenueMetricService";
import { useToast } from "../../../contexts/ToastContext";
import { color, tw, button } from "../../../shared/utils/utils";

const CATEGORY_LABELS: Record<string, string> = {
  data_revenue: "Data Revenue",
  voice_revenue: "Voice Revenue",
  sms_revenue: "SMS Revenue",
  bundle_revenue: "Bundle Revenue",
  other_revenue: "Other Revenue",
};

export default function RevenueMetricDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { success, error: showError } = useToast();

  const [loading, setLoading] = useState(true);
  const [metric, setMetric] = useState<RevenueMetric | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    loadMetric();
  }, [id]);

  const loadMetric = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await revenueMetricService.getMetricById(Number(id));
      if (data) {
        setMetric(data);
      } else {
        showError("Error", "Revenue metric not found");
        navigate("/dashboard/kpis/revenue-metrics");
      }
    } catch (err) {
      showError("Error", "Failed to load metric details");
      navigate("/dashboard/kpis/revenue-metrics");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!metric) return;
    try {
      setDeleting(true);
      await revenueMetricService.deleteMetric(metric.id);
      success("Success", `"${metric.name}" has been deleted successfully`);
      navigate("/dashboard/kpis/revenue-metrics");
    } catch (err) {
      showError("Error", "Failed to delete revenue metric");
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <LoadingSpinner variant="modern" size="xl" color="primary" />
        <p className={`${tw.textMuted} font-medium mt-4`}>Loading metric details...</p>
      </div>
    );
  }

  if (!metric) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <BackButton fallbackTo="/dashboard/kpis/revenue-metrics" />
          <p className={tw.textSecondary}>Metric not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div className="flex items-center space-x-2 sm:space-x-4">
          <BackButton fallbackTo="/dashboard/kpis/revenue-metrics" />
          <div>
            <h1 className={`text-2xl font-bold ${tw.textPrimary}`}>Revenue Metric Details</h1>
            <p className={`${tw.textSecondary} mt-2 text-sm`}>
              View and manage revenue metric configuration
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => navigate(`/dashboard/kpis/revenue-metrics/${metric.id}/edit`)}
            className={`px-4 py-2 text-white ${tw.rounded} font-semibold transition-all duration-200 flex items-center gap-2 text-sm w-fit`}
            style={{ backgroundColor: color.primary.action }}
            onMouseEnter={(e) => {
              (e.currentTarget).style.opacity = "0.9";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget).style.opacity = "1";
            }}
          >
            <Edit className="w-4 h-4" />
            Edit
          </button>
          <button
            onClick={handleDelete}
            className={`${tw.rounded} font-semibold transition-all duration-200 flex items-center gap-2 text-sm w-fit`}
            style={{
              backgroundColor: button.delete.background,
              color: button.delete.color,
              border: button.delete.border,
              padding: `${button.delete.paddingY} ${button.delete.paddingX}`,
              borderRadius: button.delete.borderRadius,
              fontSize: button.delete.fontSize,
            }}
            onMouseEnter={(e) => {
              (e.currentTarget).style.opacity = "0.9";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget).style.opacity = "1";
            }}
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>
      </div>

      {/* Metric Information */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Metric Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Metric Overview */}
          <div className={`bg-white ${tw.rounded} border border-gray-200 p-6`}>
            <div className="flex items-start space-x-4 mb-6">
              <div
                className={`h-14 w-14 ${tw.rounded} flex items-center justify-center flex-shrink-0`}
                style={{ backgroundColor: color.primary.accent }}
              >
                <DollarSign className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1">
                <h2 className={`text-2xl font-bold ${tw.textPrimary} mb-2`}>{metric.name}</h2>
                <p className={`${tw.textSecondary} text-base leading-relaxed`}>
                  {metric.description || "No description available"}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-gray-200">
              <span
                className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium text-white"
                style={{ backgroundColor: color.primary.accent }}
              >
                {CATEGORY_LABELS[metric.category]}
              </span>
              <span
                className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium text-white"
                style={{ backgroundColor: color.primary.accent }}
              >
                {metric.field_type === "decimal" ? "Decimal" : "Numeric"}
              </span>
            </div>
          </div>

          {/* Basic Information */}
          <div className={`bg-white ${tw.rounded} border border-gray-200 p-6`}>
            <h3 className={`text-lg font-semibold ${tw.textPrimary} mb-6`}>
              Basic Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className={`text-xs font-medium ${tw.textMuted} uppercase tracking-wide`}>
                  Metric Name
                </label>
                <p className={`text-base ${tw.textPrimary} font-semibold`}>{metric.name}</p>
              </div>
              <div className="space-y-1">
                <label className={`text-xs font-medium ${tw.textMuted} uppercase tracking-wide`}>
                  Category
                </label>
                <p className={`text-base ${tw.textPrimary}`}>{CATEGORY_LABELS[metric.category]}</p>
              </div>
              <div className="space-y-1">
                <label className={`text-xs font-medium ${tw.textMuted} uppercase tracking-wide`}>
                  Field Type
                </label>
                <p className={`text-base ${tw.textPrimary}`}>
                  {metric.field_type === "decimal" ? "Decimal" : "Numeric"}
                </p>
              </div>
              <div className="space-y-1">
                <label className={`text-xs font-medium ${tw.textMuted} uppercase tracking-wide`}>
                  Unit
                </label>
                <p className={`text-base ${tw.textPrimary}`}>{metric.unit || "—"}</p>
              </div>
            </div>
          </div>

          {/* Data Source Information */}
          <div className={`bg-white ${tw.rounded} border border-gray-200 p-6`}>
            <h3 className={`text-lg font-semibold ${tw.textPrimary} mb-6`}>
              Data Source Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className={`text-xs font-medium ${tw.textMuted} uppercase tracking-wide`}>
                  Source Table
                </label>
                <p className={`text-base ${tw.textPrimary} font-mono`}>{metric.source_table}</p>
              </div>
              <div className="space-y-1">
                <label className={`text-xs font-medium ${tw.textMuted} uppercase tracking-wide`}>
                  Data Source
                </label>
                <p className={`text-base ${tw.textPrimary}`}>{metric.data_source}</p>
              </div>
              <div className="space-y-1">
                <label className={`text-xs font-medium ${tw.textMuted} uppercase tracking-wide`}>
                  Frequency
                </label>
                <p className={`text-base ${tw.textPrimary}`}>{metric.frequency}</p>
              </div>
            </div>
          </div>

          {/* Operators */}
          <div className={`bg-white ${tw.rounded} border border-gray-200 p-6`}>
            <h3 className={`text-lg font-semibold ${tw.textPrimary} mb-6`}>
              Operators
            </h3>
            <div className="flex flex-wrap gap-2">
              {metric.operators.map((op) => (
                <span
                  key={op}
                  className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium text-white"
                  style={{ backgroundColor: color.primary.accent }}
                >
                  {op.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Description Card */}
          <div className={`bg-white ${tw.rounded} border border-gray-200 p-6`}>
            <h3 className={`text-lg font-semibold ${tw.textPrimary} mb-4`}>
              Description
            </h3>
            <p className={`${tw.textSecondary} text-sm leading-relaxed`}>
              {metric.description || "No description available"}
            </p>
          </div>

          {/* Summary Card */}
          <div className={`bg-white ${tw.rounded} border border-gray-200 p-6`}>
            <h3 className={`text-lg font-semibold ${tw.textPrimary} mb-4`}>
              Summary
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                <span className={tw.textMuted}>Operators Count</span>
                <span className="font-semibold text-gray-900">{metric.operators.length}</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                <span className={tw.textMuted}>Field Type</span>
                <span className="font-semibold text-gray-900">
                  {metric.field_type === "decimal" ? "Decimal" : "Numeric"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className={tw.textMuted}>Data Source</span>
                <span className="font-semibold text-gray-900">{metric.data_source}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-md p-6 max-w-md w-full mx-4">
            <h3 className={`text-lg font-semibold ${tw.textPrimary} mb-2`}>Delete Revenue Metric</h3>
            <p className={`${tw.textSecondary} text-sm mb-6`}>
              Are you sure you want to delete "{metric.name}"? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
                className="px-4 py-2 text-sm font-medium border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors disabled:opacity-60"
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
