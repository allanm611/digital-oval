import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Edit, Trash2 } from "lucide-react";
import BackButton from "../../../shared/components/ui/BackButton";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import { kpiService, KPIProfile } from "../services/kpiService";
import { useToast } from "../../../contexts/ToastContext";
import { color, tw } from "../../../shared/utils/utils";
import { button } from "../../../shared/utils/utils";

export default function KpiDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const parentLabel = (location.state as any)?.parentLabel;
  const { success, error: showError } = useToast();

  const [loading, setLoading] = useState(true);
  const [kpi, setKpi] = useState<KPIProfile | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    loadKPI();
  }, [id]);

  const loadKPI = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await kpiService.getKPIById(Number(id));
      if (data && data.id) {
        setKpi(data);
      } else {
        showError("Error", "KPI not found");
        navigate("/dashboard/kpis/all");
      }
    } catch (err) {
      showError("Error", "Failed to load KPI details");
      navigate("/dashboard/kpis/all");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!kpi) return;
    try {
      setDeleting(true);
      await kpiService.deleteKPI(kpi.id || 0);
      success("Success", `"${kpi.field_name}" has been deleted successfully`);
      navigate("/dashboard/kpis/all");
    } catch (err) {
      showError("Error", "Failed to delete KPI");
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };


  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <LoadingSpinner variant="modern" size="xl" color="primary" />
        <p className={`${tw.textMuted} font-medium mt-4`}>Loading KPI details...</p>
      </div>
    );
  }

  if (!kpi) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <BackButton showBreadcrumb={true} currentLabel="KPI Details" parentLabel={parentLabel} />
          <p className={tw.textSecondary}>KPI not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div className="flex items-center space-x-2 sm:space-x-4">
          <BackButton showBreadcrumb={true} currentLabel="KPI Details" parentLabel={parentLabel} />
          <div></div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() =>
              navigate(`/dashboard/kpis/${kpi.id}/edit`)
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

      {/* KPI Information */}
      <div className="space-y-6">
        {/* KPI Overview & Data Source Information */}
        <div className={`bg-white ${tw.rounded} p-6`}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label
                className={`text-xs font-medium ${tw.textMuted} uppercase tracking-wide`}
              >
                Field Name
              </label>
              <p className={`text-sm ${tw.textPrimary}`}>
                {kpi.field_name}
              </p>
            </div>
            <div className="space-y-1">
              <label
                className={`text-xs font-medium ${tw.textMuted} uppercase tracking-wide`}
              >
                Field Value
              </label>
              <p className={`text-sm ${tw.textPrimary}`}>
                {kpi.field_value}
              </p>
            </div>
            <div className="space-y-1">
              <label
                className={`text-xs font-medium ${tw.textMuted} uppercase tracking-wide`}
              >
                Field Type
              </label>
              <p className={`text-sm ${tw.textPrimary}`}>
                {kpi.field_type}
              </p>
            </div>
            <div className="space-y-1">
              <label
                className={`text-xs font-medium ${tw.textMuted} uppercase tracking-wide`}
              >
                Database Type
              </label>
              <p className={`text-sm ${tw.textPrimary}`}>
                {kpi.field_pg_type}
              </p>
            </div>
            <div className="space-y-1">
              <label
                className={`text-xs font-medium ${tw.textMuted} uppercase tracking-wide`}
              >
                Source Table
              </label>
              <p className={`text-sm ${tw.textPrimary}`}>
                {kpi.field_source_table || "—"}
              </p>
            </div>
            <div className="space-y-1">
              <label
                className={`text-xs font-medium ${tw.textMuted} uppercase tracking-wide`}
              >
                Data Latency
              </label>
              <p className={`text-sm ${tw.textPrimary}`}>
                {kpi.data_latency || "—"}
              </p>
            </div>
            <div className="space-y-1">
              <label
                className={`text-xs font-medium ${tw.textMuted} uppercase tracking-wide`}
              >
                Description
              </label>
              <p className={`text-sm ${tw.textPrimary}`}>
                {kpi.description || "—"}
              </p>
            </div>
            {(kpi as any).category_name && (
              <div className="space-y-1">
                <label
                  className={`text-xs font-medium ${tw.textMuted} uppercase tracking-wide`}
                >
                  Category
                </label>
                <p className={`text-sm ${tw.textPrimary}`}>
                  {(kpi as any).category_name}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Extraction Logic */}
        {kpi.extraction_logic && (
          <div className={`bg-white ${tw.rounded} p-6`}>
            <h3 className={`text-sm font-semibold ${tw.textPrimary} mb-4`}>
              Extraction Logic
            </h3>
            <pre className={`text-sm ${tw.textPrimary} bg-gray-50 p-4 rounded font-mono overflow-x-auto`}>
              {kpi.extraction_logic}
            </pre>
          </div>
        )}

        {/* Field Configuration */}
        <div className={`bg-white ${tw.rounded} p-6`}>
          <h3 className={`text-sm font-semibold ${tw.textPrimary} mb-4`}>
            Field Configuration
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {kpi.field_column_name && (
              <div className="space-y-1">
                <label className={`text-xs font-medium ${tw.textMuted} uppercase tracking-wide`}>
                  Column Name
                </label>
                <p className={`text-sm ${tw.textPrimary}`}>{kpi.field_column_name}</p>
              </div>
            )}
            {kpi.ui_component_type && (
              <div className="space-y-1">
                <label className={`text-xs font-medium ${tw.textMuted} uppercase tracking-wide`}>
                  UI Component Type
                </label>
                <p className={`text-sm ${tw.textPrimary}`}>{kpi.ui_component_type}</p>
              </div>
            )}
            <div className="space-y-1">
              <label className={`text-xs font-medium ${tw.textMuted} uppercase tracking-wide`}>
                Multi Select
              </label>
              <p className={`text-sm ${tw.textPrimary}`}>{kpi.is_multi_select ? "Yes" : "No"}</p>
            </div>
            <div className="space-y-1">
              <label className={`text-xs font-medium ${tw.textMuted} uppercase tracking-wide`}>
                Required
              </label>
              <p className={`text-sm ${tw.textPrimary}`}>{kpi.is_required ? "Yes" : "No"}</p>
            </div>
            {kpi.field_allowed_value_length && (
              <div className="space-y-1">
                <label className={`text-xs font-medium ${tw.textMuted} uppercase tracking-wide`}>
                  Max Value Length
                </label>
                <p className={`text-sm ${tw.textPrimary}`}>{kpi.field_allowed_value_length}</p>
              </div>
            )}
            {kpi.field_type_precision && (
              <div className="space-y-1">
                <label className={`text-xs font-medium ${tw.textMuted} uppercase tracking-wide`}>
                  Type Precision
                </label>
                <p className={`text-sm ${tw.textPrimary}`}>{kpi.field_type_precision}</p>
              </div>
            )}
            {kpi.field_allowed_distinct_values && kpi.field_allowed_distinct_values.length > 0 && (
              <div className="space-y-1 md:col-span-2">
                <label className={`text-xs font-medium ${tw.textMuted} uppercase tracking-wide`}>
                  Allowed Distinct Values
                </label>
                <p className={`text-sm ${tw.textPrimary}`}>{kpi.field_allowed_distinct_values.join(", ")}</p>
              </div>
            )}
            {kpi.field_allowed_range_min !== undefined && (
              <div className="space-y-1">
                <label className={`text-xs font-medium ${tw.textMuted} uppercase tracking-wide`}>
                  Min Range Value
                </label>
                <p className={`text-sm ${tw.textPrimary}`}>{kpi.field_allowed_range_min ?? "—"}</p>
              </div>
            )}
            {kpi.field_allowed_range_max !== undefined && (
              <div className="space-y-1">
                <label className={`text-xs font-medium ${tw.textMuted} uppercase tracking-wide`}>
                  Max Range Value
                </label>
                <p className={`text-sm ${tw.textPrimary}`}>{kpi.field_allowed_range_max ?? "—"}</p>
              </div>
            )}
          </div>
        </div>

        {/* Validation & Status */}
        <div className={`bg-white ${tw.rounded} p-6`}>
          <h3 className={`text-sm font-semibold ${tw.textPrimary} mb-4`}>
            Validation & Status
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className={`text-xs font-medium ${tw.textMuted} uppercase tracking-wide`}>
                Status
              </label>
              <p className={`text-sm ${tw.textPrimary}`}>{kpi.is_active ? "Active" : "Inactive"}</p>
            </div>
            <div className="space-y-1">
              <label className={`text-xs font-medium ${tw.textMuted} uppercase tracking-wide`}>
                Computable
              </label>
              <p className={`text-sm ${tw.textPrimary}`}>{kpi.is_computable ? "Yes" : "No"}</p>
            </div>
            {kpi.validation_strategy && (
              <div className="space-y-1">
                <label className={`text-xs font-medium ${tw.textMuted} uppercase tracking-wide`}>
                  Validation Strategy
                </label>
                <p className={`text-sm ${tw.textPrimary}`}>{kpi.validation_strategy}</p>
              </div>
            )}
            {kpi.tag && (
              <div className="space-y-1">
                <label className={`text-xs font-medium ${tw.textMuted} uppercase tracking-wide`}>
                  KPI Type
                </label>
                <p className={`text-sm ${tw.textPrimary}`}>{kpi.tag}</p>
              </div>
            )}
            {kpi.display_order !== undefined && (
              <div className="space-y-1">
                <label className={`text-xs font-medium ${tw.textMuted} uppercase tracking-wide`}>
                  Display Order
                </label>
                <p className={`text-sm ${tw.textPrimary}`}>{kpi.display_order}</p>
              </div>
            )}
          </div>
        </div>

        {/* Metadata */}
        <div className={`bg-white ${tw.rounded} p-6`}>
          <h3 className={`text-sm font-semibold ${tw.textPrimary} mb-4`}>
            Metadata
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {kpi.created_at && (
              <div className="space-y-1">
                <label className={`text-xs font-medium ${tw.textMuted} uppercase tracking-wide`}>
                  Created At
                </label>
                <p className={`text-sm ${tw.textPrimary}`}>{new Date(kpi.created_at).toLocaleString()}</p>
              </div>
            )}
            {kpi.created_by && (
              <div className="space-y-1">
                <label className={`text-xs font-medium ${tw.textMuted} uppercase tracking-wide`}>
                  Created By
                </label>
                <p className={`text-sm ${tw.textPrimary}`}>{kpi.created_by}</p>
              </div>
            )}
            {kpi.updated_at && (
              <div className="space-y-1">
                <label className={`text-xs font-medium ${tw.textMuted} uppercase tracking-wide`}>
                  Updated At
                </label>
                <p className={`text-sm ${tw.textPrimary}`}>{new Date(kpi.updated_at).toLocaleString()}</p>
              </div>
            )}
            {kpi.updated_by && (
              <div className="space-y-1">
                <label className={`text-xs font-medium ${tw.textMuted} uppercase tracking-wide`}>
                  Updated By
                </label>
                <p className={`text-sm ${tw.textPrimary}`}>{kpi.updated_by}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-md p-6 max-w-md w-full mx-4">
            <h3 className={`text-sm font-semibold ${tw.textPrimary} mb-2`}>
              Delete KPI
            </h3>
            <p className={`text-sm ${tw.textSecondary} mb-6`}>
              Are you sure you want to delete "{kpi.field_name}"? This action
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
