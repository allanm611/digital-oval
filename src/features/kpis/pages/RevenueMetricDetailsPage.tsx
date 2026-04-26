import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Edit, Trash2, DollarSign } from "lucide-react";
import BackButton from "../../../shared/components/ui/BackButton";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import { RevenueMetric } from "../types/revenueMetrics";
import { revenueMetricService } from "../services/revenueMetricService";
import { useToast } from "../../../contexts/ToastContext";
import { color, tw, button } from "../../../shared/utils/utils";
import { getOperatorsForFieldType } from "../../../shared/utils/operatorMapper";

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
  const location = useLocation();
  const parentLabel = (location.state as any)?.parentLabel;
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
        <p className={`${tw.textMuted} font-medium mt-4`}>
          Loading metric details...
        </p>
      </div>
    );
  }

  if (!metric) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <BackButton fallbackTo="/dashboard/kpis/revenue-metrics" showBreadcrumb={true} currentLabel="Revenue Metric Details" parentLabel={parentLabel} />
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
          <BackButton fallbackTo="/dashboard/kpis/revenue-metrics" showBreadcrumb={true} currentLabel="Revenue Metric Details" parentLabel={parentLabel} />
          <div></div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() =>
              navigate(`/dashboard/kpis/revenue-metrics/${metric.id}/edit`)
            }
            className={`px-4 py-2 text-white text-xs ${tw.rounded} font-semibold transition-all duration-200 flex items-center gap-2 w-fit`}
            style={{ backgroundColor: color.primary.action }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = "0.9";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = "1";
            }}
          >
            <Edit className="w-4 h-4" />
            Edit
          </button>
          <button
            onClick={handleDelete}
            className={`${tw.rounded} font-semibold transition-all duration-200 flex items-center gap-2 text-xs w-fit`}
            style={{
              backgroundColor: button.delete.background,
              color: button.delete.color,
              border: button.delete.border,
              padding: `${button.delete.paddingY} ${button.delete.paddingX}`,
              borderRadius: button.delete.borderRadius,
              fontSize: button.delete.fontSize,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = "0.9";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = "1";
            }}
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>
      </div>

      {/* Metric Information */}
      <div className="space-y-6">
        {/* Metric Overview & Basic Information */}
        <div className={`bg-white ${tw.rounded} border border-gray-200 p-6`}>
          <div className="flex items-start space-x-4 mb-6">
            <div
              className={`h-14 w-14 ${tw.rounded} flex items-center justify-center flex-shrink-0`}
              style={{ backgroundColor: color.primary.accent }}
            >
              <DollarSign className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1">
              <h2 className={`text-sm font-semibold ${tw.textPrimary} mb-2`}>
                {metric.name}
              </h2>
              <p className={`text-sm ${tw.textSecondary} leading-relaxed`}>
                {metric.description || "No description available"}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label
                className={`text-xs font-medium ${tw.textMuted} uppercase tracking-wide`}
              >
                Metric Name
              </label>
              <p className={`text-sm ${tw.textPrimary}`}>
                {metric.name}
              </p>
            </div>
            <div className="space-y-1">
              <label
                className={`text-xs font-medium ${tw.textMuted} uppercase tracking-wide`}
              >
                Field Type
              </label>
              <p className={`text-sm ${tw.textPrimary}`}>
                {metric.field_type === "decimal" ? "Decimal" : "Numeric"}
              </p>
            </div>
          </div>
        </div>

        {/* Data Source Information */}
        <div className={`bg-white ${tw.rounded} border border-gray-200 p-6`}>
          <h3 className={`text-sm font-semibold ${tw.textPrimary} mb-6`}>
            Data Source Information
          </h3>
          <div className="space-y-4">
            <div className="space-y-1">
              <label
                className={`text-xs font-medium ${tw.textMuted} uppercase tracking-wide`}
              >
                Source Table
              </label>
              <p className={`text-sm ${tw.textPrimary}`}>
                —
              </p>
            </div>
            <div className="space-y-1">
              <label
                className={`text-xs font-medium ${tw.textMuted} uppercase tracking-wide`}
              >
                Data Source
              </label>
              <p className={`text-sm ${tw.textPrimary}`}>
                —
              </p>
            </div>
            <div className="space-y-1">
              <label
                className={`text-xs font-medium ${tw.textMuted} uppercase tracking-wide`}
              >
                Frequency
              </label>
              <p className={`text-sm ${tw.textPrimary}`}>
                —
              </p>
            </div>
          </div>
        </div>

        {/* Operators */}
        <div className={`${tw.rounded} border overflow-hidden`} style={{ borderColor: color.border.default }}>
          <div className="hidden lg:block overflow-x-auto">
            <table
              className="w-full min-w-[720px]"
              style={{ borderCollapse: "separate", borderSpacing: "0 8px" }}
            >
              <thead style={{ background: color.surface.tableHeader }}>
                <tr>
                  {["Label", "Symbol", "Requires Value", "Requires Two Values"].map((header) => (
                    <th
                      key={header}
                      className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                      style={{ color: color.surface.tableHeaderText }}
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {getOperatorsForFieldType(metric.field_type).map((operator) => (
                  <tr key={operator.id}>
                    <td
                      className="px-6 py-4 text-sm text-gray-900 font-medium"
                      style={{ backgroundColor: color.surface.tablebodybg }}
                    >
                      {operator.label
                        .split("_")
                        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                        .join(" ")}
                    </td>
                    <td
                      className="px-6 py-4 text-sm text-gray-700"
                      style={{ backgroundColor: color.surface.tablebodybg }}
                    >
                      {operator.symbol}
                    </td>
                    <td
                      className="px-6 py-4 text-sm text-gray-700"
                      style={{ backgroundColor: color.surface.tablebodybg }}
                    >
                      {operator.requiresValue ? "Yes" : "No"}
                    </td>
                    <td
                      className="px-6 py-4 text-sm text-gray-700"
                      style={{ backgroundColor: color.surface.tablebodybg }}
                    >
                      {operator.requiresTwoValues ? "Yes" : "No"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="lg:hidden p-6 space-y-4">
            {getOperatorsForFieldType(metric.field_type).map((operator) => (
              <div
                key={operator.id}
                className="border border-gray-200 rounded p-4 space-y-2"
              >
                <div>
                  <p className="text-xs font-medium text-gray-600 uppercase">Label</p>
                  <p className="text-sm font-medium text-gray-900">
                    {operator.label
                      .split("_")
                      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                      .join(" ")}
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <p className="font-medium text-gray-600 uppercase">Symbol</p>
                    <p className="text-gray-900">{operator.symbol}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-600 uppercase">Req Value</p>
                    <p className="text-gray-900">{operator.requiresValue ? "Yes" : "No"}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-600 uppercase">Req Two</p>
                    <p className="text-gray-900">{operator.requiresTwoValues ? "Yes" : "No"}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-md p-6 max-w-md w-full mx-4">
            <h3 className={`text-sm font-semibold ${tw.textPrimary} mb-2`}>
              Delete Revenue Metric
            </h3>
            <p className={`text-sm ${tw.textSecondary} mb-6`}>
              Are you sure you want to delete "{metric.name}"? This action
              cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
                className="px-4 py-2 text-xs font-medium border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="px-4 py-2 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors disabled:opacity-60"
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
