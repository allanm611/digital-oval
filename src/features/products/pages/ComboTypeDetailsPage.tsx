import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Edit, Trash2, Briefcase } from "lucide-react";
import { useToast } from "../../../contexts/ToastContext";
import { extractBackendError } from "../../../shared/utils/errorHandler";;;
import { comboTypeService, ComboType } from "../services/comboTypeService";
import BackButton from "../../../shared/components/ui/BackButton";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import DeleteConfirmModal from "../../../shared/components/ui/DeleteConfirmModal";
import DateFormatter from "../../../shared/components/DateFormatter";
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

  const handleDelete = () => {
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
      showError("Cannot Delete Combo Type", extractBackendError(err, "Cannot Delete Combo Type. Please try again."));
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
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
        <BackButton fallbackTo="/dashboard/combo-types" showBreadcrumb={true} />
        <div className="text-center py-12">
          <Briefcase className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className={`text-lg font-medium ${tw.textPrimary} mb-2`}>
            Combo Type Not Found
          </h3>
          <p className={`${tw.textMuted} mb-6`}>
            The combo type you are looking for does not exist.
          </p>
          <button
            onClick={() => navigate("/dashboard/combo-types")}
            className={`px-4 py-2 text-white ${tw.rounded} font-semibold transition-colors`}
            style={{ backgroundColor: color.primary.action }}
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
        <BackButton
          fallbackTo="/dashboard/combo-types"
          showBreadcrumb={true}
          currentLabel="Combo Type Details"
        />
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => navigate(`/dashboard/combo-types/${id}/edit`)}
            className={`px-4 py-2 text-white ${tw.rounded} font-semibold transition-all duration-200 flex items-center gap-2 text-sm w-fit`}
            style={{ backgroundColor: button.action.background }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.opacity = "0.9";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.opacity = "1";
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
              (e.currentTarget as HTMLButtonElement).style.opacity = "0.9";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.opacity = "1";
            }}
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>
      </div>

      {/* Combo Type Information */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Combo Type Overview */}
          <div className={`bg-white ${tw.rounded} border border-gray-200 p-6`}>
            <div className="flex items-start space-x-4 mb-6">
              <div
                className={`h-14 w-14 ${tw.rounded} flex items-center justify-center flex-shrink-0`}
                style={{ backgroundColor: color.primary.accent }}
              >
                <Briefcase className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1">
                <h2 className={`${tw.tableFirstColumn} ${tw.textPrimary} mb-2`}>
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

          {/* Pricing & Validity Information */}
          <div className={`bg-white ${tw.rounded} border border-gray-200 p-6`}>
            <h3 className={`text-lg font-semibold ${tw.textPrimary} mb-6`}>
              Pricing & Validity
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className={`text-xs font-medium ${tw.textMuted} uppercase tracking-wide`}>
                  Price
                </label>
                <p className={`text-2xl font-bold ${tw.textPrimary}`}>
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
              <div className="hidden lg:block overflow-x-auto">
                <table
                  className="w-full min-w-[720px]"
                  style={{ borderCollapse: "separate", borderSpacing: "0 8px" }}
                >
                  <thead style={{ background: color.surface.tableHeader }}>
                    <tr>
                      {["Type", "Value", "Unit", "Validity (hrs)", "Price"].map((header) => (
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
                    {comboType.combo_resources.map((resource: any, index: number) => (
                      <tr key={index}>
                        <td
                          className="px-6 py-4 text-sm"
                          style={{ backgroundColor: color.surface.tablebodybg }}
                        >
                          <span className={`${tw.textPrimary} capitalize`}>
                            {resource.resource_type || "N/A"}
                          </span>
                        </td>
                        <td
                          className="px-6 py-4 text-sm"
                          style={{ backgroundColor: color.surface.tablebodybg }}
                        >
                          <span className={tw.textSecondary}>
                            {resource.unit_value || "N/A"}
                          </span>
                        </td>
                        <td
                          className="px-6 py-4 text-sm"
                          style={{ backgroundColor: color.surface.tablebodybg }}
                        >
                          <span className={tw.textSecondary}>
                            {resource.unit || "N/A"}
                          </span>
                        </td>
                        <td
                          className="px-6 py-4 text-sm"
                          style={{ backgroundColor: color.surface.tablebodybg }}
                        >
                          <span className={tw.textSecondary}>
                            {resource.shared_validity_hours || "N/A"}
                          </span>
                        </td>
                        <td
                          className="px-6 py-4 text-sm"
                          style={{ backgroundColor: color.surface.tablebodybg }}
                        >
                          <span className={tw.textSecondary}>
                            {resource.price || "N/A"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="lg:hidden space-y-4">
                {comboType.combo_resources.map((resource: any, index: number) => (
                  <div key={index} className="border border-gray-200 rounded p-4 space-y-2">
                    <div>
                      <p className="text-xs font-medium text-gray-600 uppercase">Type</p>
                      <p className={`text-sm ${tw.textPrimary} capitalize`}>
                        {resource.resource_type || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-600 uppercase">Value</p>
                      <p className={`text-sm ${tw.textSecondary}`}>
                        {resource.unit_value || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-600 uppercase">Unit</p>
                      <p className={`text-sm ${tw.textSecondary}`}>
                        {resource.unit || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-600 uppercase">Validity (hrs)</p>
                      <p className={`text-sm ${tw.textSecondary}`}>
                        {resource.shared_validity_hours || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-600 uppercase">Price</p>
                      <p className={`text-sm ${tw.textSecondary}`}>
                        {resource.price || "N/A"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Timeline */}
          <div className={`bg-white ${tw.rounded} border border-gray-200 p-6`}>
            <h3 className={`text-lg font-semibold ${tw.textPrimary} mb-6`}>
              Timeline
            </h3>
            <div className="space-y-5">
              <div className="relative pl-6 border-l-2 border-gray-200">
                <div className="absolute -left-2 top-0 w-4 h-4 rounded-full bg-gray-300"></div>
                <div className="space-y-1">
                  <p className={`text-xs font-medium ${tw.textMuted} uppercase tracking-wide`}>
                    Created
                  </p>
                  <p className={`text-sm ${tw.textPrimary} font-semibold`}>
                    {comboType.created_at ? (
                      <DateFormatter
                        date={comboType.created_at}
                        useLocale
                        year="numeric"
                        month="short"
                        day="numeric"
                      />
                    ) : (
                      "N/A"
                    )}
                  </p>
                  {comboType.created_at && (
                    <p className={`text-xs ${tw.textMuted}`}>
                      <DateFormatter date={comboType.created_at} includeTime />
                    </p>
                  )}
                </div>
              </div>
              {comboType.updated_at && (
                <div className="relative pl-6 border-l-2 border-gray-200">
                  <div
                    className="absolute -left-2 top-0 w-4 h-4 rounded-full"
                    style={{ backgroundColor: color.primary.accent }}
                  ></div>
                  <div className="space-y-1">
                    <p className={`text-xs font-medium ${tw.textMuted} uppercase tracking-wide`}>
                      Last Updated
                    </p>
                    <p className={`text-sm ${tw.textPrimary} font-semibold`}>
                      <DateFormatter
                        date={comboType.updated_at}
                        useLocale
                        year="numeric"
                        month="short"
                        day="numeric"
                      />
                    </p>
                    <p className={`text-xs ${tw.textMuted}`}>
                      <DateFormatter date={comboType.updated_at} includeTime />
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Additional Information */}
          <div className={`bg-white ${tw.rounded} border border-gray-200 p-6`}>
            <h3 className={`text-lg font-semibold ${tw.textPrimary} mb-6`}>
              Additional Information
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
                <p className={`text-sm ${tw.textSecondary}`}>
                  {comboType.is_active ? "Active" : "Inactive"}
                </p>
              </div>
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
