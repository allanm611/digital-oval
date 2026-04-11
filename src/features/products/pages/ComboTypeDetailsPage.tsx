import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Edit, Trash2, Briefcase, Power, PowerOff } from "lucide-react";
import { useToast } from "../../../contexts/ToastContext";
import { comboTypeService, ComboType } from "../services/comboTypeService";
import BackButton from "../../../shared/components/ui/BackButton";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import DeleteConfirmModal from "../../../shared/components/ui/DeleteConfirmModal";
import { tw, color, button } from "../../../shared/utils/utils";

export default function ComboTypeDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { success, error: showError } = useToast();

  const [comboType, setComboType] = useState<ComboType | null>(null);
  const [loading, setLoading] = useState(!!id);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);

  useEffect(() => {
    if (id) {
      const loadComboType = async () => {
        try {
          const data = await comboTypeService.getComboTypeById(parseInt(id));
          setComboType(data);
        } catch (err) {
          console.error("Failed to load combo type:", err);
          showError("Error", "Failed to load combo type");
          setError("Failed to load combo type");
        } finally {
          setLoading(false);
        }
      };
      loadComboType();
    }
  }, [id, showError]);

  const handleToggleStatus = async () => {
    if (!comboType) return;

    setIsTogglingStatus(true);
    try {
      setComboType((prev) =>
        prev ? { ...prev, is_active: !prev.is_active } : null
      );

      if (comboType.is_active) {
        await comboTypeService.updateComboType(comboType.id, {
          is_active: false,
        });
        success(
          "Combo Type Deactivated",
          `"${comboType.name}" has been deactivated successfully.`
        );
      } else {
        await comboTypeService.updateComboType(comboType.id, {
          is_active: true,
        });
        success(
          "Combo Type Activated",
          `"${comboType.name}" has been activated successfully.`
        );
      }
    } catch (err) {
      console.error("Failed to toggle status:", err);
      showError("Failed to update status", "Please try again later.");
      setComboType((prev) =>
        prev ? { ...prev, is_active: !prev.is_active } : null
      );
    } finally {
      setIsTogglingStatus(false);
    }
  };

  const handleDelete = () => {
    if (!comboType) return;
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!comboType) return;

    setIsDeleting(true);
    try {
      await comboTypeService.deleteComboType(comboType.id);
      success(
        "Combo Type Deleted",
        `"${comboType.name}" has been deleted successfully.`
      );
      navigate("/dashboard/combo-types");
    } catch (err) {
      console.error("Failed to delete:", err);
      showError(
        "Cannot Delete Combo Type",
        err instanceof Error ? err.message : "Failed to delete combo type"
      );
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <LoadingSpinner variant="modern" size="xl" color="primary" className="mb-4" />
        <p className={`${tw.textMuted} font-medium text-sm`}>
          Loading combo type details...
        </p>
      </div>
    );
  }

  if (error || !comboType) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <Briefcase className={`w-16 h-16 text-[${color.primary.accent}] mx-auto mb-4`} />
          <h3 className={`text-lg font-medium ${tw.textPrimary} mb-2`}>
            Combo Type Not Found
          </h3>
          <p className={`${tw.textMuted} mb-6`}>
            The combo type you are looking for does not exist.
          </p>
          <button
            onClick={() => navigate("/dashboard/combo-types")}
            className={`px-4 py-2 text-white ${tw.rounded} font-semibold transition-all duration-200 text-sm`}
            style={{ backgroundColor: button.action.background }}
          >
            Back to Combo Types
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <BackButton fallbackTo="/dashboard/combo-types" showBreadcrumb={true} currentLabel="Combo Type Details" />
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleToggleStatus}
            disabled={isTogglingStatus}
            className={`px-4 py-2 ${tw.rounded} font-semibold transition-all duration-200 flex items-center gap-2 text-sm w-fit disabled:opacity-50 disabled:cursor-not-allowed`}
            style={{
              backgroundColor: button.secondaryAction.background,
              color: "black",
            }}
            onMouseEnter={(e) => {
              if (!isTogglingStatus) {
                (e.target as HTMLButtonElement).style.opacity = "0.9";
              }
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLButtonElement).style.opacity = "1";
            }}
          >
            {isTogglingStatus ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                {comboType.is_active ? "Deactivating..." : "Activating..."}
              </>
            ) : comboType.is_active ? (
              <>
                <PowerOff className="w-4 h-4" />
                Deactivate
              </>
            ) : (
              <>
                <Power className="w-4 h-4" />
                Activate
              </>
            )}
          </button>
          <button
            onClick={() => navigate(`/dashboard/combo-types/${id}/edit`)}
            className={`px-4 py-2 text-white ${tw.rounded} font-semibold transition-all duration-200 flex items-center gap-2 text-sm w-fit`}
            style={{ backgroundColor: button.action.background }}
            onMouseEnter={(e) => {
              (e.target as HTMLButtonElement).style.opacity = "0.9";
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLButtonElement).style.opacity = "1";
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
              (e.target as HTMLButtonElement).style.opacity = "0.9";
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLButtonElement).style.opacity = "1";
            }}
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Overview */}
          <div className={`bg-white ${tw.rounded} border border-gray-200 p-6`}>
            <div className="flex items-start space-x-4 mb-6">
              <div
                className={`h-14 w-14 ${tw.rounded} flex items-center justify-center flex-shrink-0`}
                style={{ backgroundColor: color.primary.accent }}
              >
                <Briefcase className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1">
                <h2 className={`text-xl font-bold ${tw.textPrimary} mb-2`}>
                  {comboType.name}
                </h2>
                <p className={`${tw.textSecondary} text-sm leading-relaxed`}>
                  {comboType.description || "No description available"}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-gray-200">
              <span
                className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${
                  comboType.is_active
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                {comboType.is_active ? "Active" : "Inactive"}
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
                  Combo Type Name
                </label>
                <p className={`text-sm ${tw.textPrimary} font-semibold`}>
                  {comboType.name}
                </p>
              </div>
              <div className="space-y-1">
                <label className={`text-xs font-medium ${tw.textMuted} uppercase tracking-wide`}>
                  Price
                </label>
                <p className={`text-lg font-bold ${tw.textPrimary}`}>
                  {comboType.price || "N/A"}
                </p>
              </div>
              <div className="space-y-1">
                <label className={`text-xs font-medium ${tw.textMuted} uppercase tracking-wide`}>
                  Shared Validity
                </label>
                <p className={`text-sm ${tw.textPrimary}`}>
                  {comboType.shared_validity ? "Yes" : "No"}
                </p>
              </div>
              {comboType.shared_validity && (
                <div className="space-y-1">
                  <label className={`text-xs font-medium ${tw.textMuted} uppercase tracking-wide`}>
                    Validity Hours
                  </label>
                  <p className={`text-sm ${tw.textPrimary}`}>
                    {comboType.validity_hours || "N/A"} hours
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Combo Resources */}
          {comboType.combo_resources && comboType.combo_resources.length > 0 && (
            <div className={`bg-white ${tw.rounded} border border-gray-200 p-6`}>
              <h3 className={`text-lg font-semibold ${tw.textPrimary} mb-6`}>
                Resources ({comboType.combo_resources.length})
              </h3>
              <div className="space-y-4">
                {comboType.combo_resources.map((resource: any, index: number) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="space-y-1">
                        <label className={`text-xs font-medium ${tw.textMuted} uppercase tracking-wide`}>
                          Type
                        </label>
                        <p className={`text-sm ${tw.textPrimary} font-semibold capitalize`}>
                          {resource.resource_type || "N/A"}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <label className={`text-xs font-medium ${tw.textMuted} uppercase tracking-wide`}>
                          Value
                        </label>
                        <p className={`text-sm ${tw.textPrimary}`}>
                          {resource.unit_value || "N/A"}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <label className={`text-xs font-medium ${tw.textMuted} uppercase tracking-wide`}>
                          Unit
                        </label>
                        <p className={`text-sm ${tw.textPrimary}`}>
                          {resource.unit || "N/A"}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <label className={`text-xs font-medium ${tw.textMuted} uppercase tracking-wide`}>
                          Validity (hrs)
                        </label>
                        <p className={`text-sm ${tw.textPrimary}`}>
                          {resource.shared_validity_hours || "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Metadata */}
          <div className={`bg-white ${tw.rounded} border border-gray-200 p-6`}>
            <h3 className={`text-lg font-semibold ${tw.textPrimary} mb-6`}>
              Details
            </h3>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className={`text-xs font-medium ${tw.textMuted} uppercase tracking-wide`}>
                  ID
                </label>
                <p className={`text-sm ${tw.textPrimary} font-mono`}>
                  {comboType.id}
                </p>
              </div>
              <div className="space-y-1">
                <label className={`text-xs font-medium ${tw.textMuted} uppercase tracking-wide`}>
                  Status
                </label>
                <p className={`text-sm ${tw.textPrimary}`}>
                  {comboType.is_active ? "Active" : "Inactive"}
                </p>
              </div>
              {comboType.created_at && (
                <div className="space-y-1">
                  <label className={`text-xs font-medium ${tw.textMuted} uppercase tracking-wide`}>
                    Created
                  </label>
                  <p className={`text-sm ${tw.textPrimary}`}>
                    {new Date(comboType.created_at).toLocaleDateString()}
                  </p>
                </div>
              )}
              {comboType.updated_at && (
                <div className="space-y-1">
                  <label className={`text-xs font-medium ${tw.textMuted} uppercase tracking-wide`}>
                    Updated
                  </label>
                  <p className={`text-sm ${tw.textPrimary}`}>
                    {new Date(comboType.updated_at).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Delete Modal */}
      <DeleteConfirmModal
        isOpen={showDeleteModal}
        title="Delete Combo Type"
        message={`Are you sure you want to delete "${comboType.name}"? This action cannot be undone.`}
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setShowDeleteModal(false)}
      />
    </div>
  );
}
