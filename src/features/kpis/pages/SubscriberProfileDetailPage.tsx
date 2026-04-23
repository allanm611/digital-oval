import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Edit, Trash2, Users } from "lucide-react";
import BackButton from "../../../shared/components/ui/BackButton";
import { color, tw, button } from "../../../shared/utils/utils";
import { useToast } from "../../../contexts/ToastContext";
import { useState } from "react";

// Dummy data - same as list page
const DUMMY_PROFILE_FIELDS = [
  {
    id: 1,
    name: "Account Type",
    description: "",
    dataSource: "DB",
    frequency: "D-1",
    status: "Available",
    extractionLogic: "",
  },
  {
    id: 2,
    name: "Activation Date",
    description: "",
    dataSource: "DB",
    frequency: "D-1",
    status: "Available",
    extractionLogic: "BIB_ADM.FLYTXT_DX_DAILY_KPI.ACTIVATION_DATE",
  },
  {
    id: 3,
    name: "CELL_ID",
    description: "",
    dataSource: "DB",
    frequency: "D-1",
    status: "Available",
    extractionLogic: "BIB_ADM.FLYTXT_DX_DAILY_KPI.CELL_ID",
  },
];

export default function SubscriberProfileDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const parentLabel = (location.state as any)?.parentLabel;
  const { showToast } = useToast();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const profile = DUMMY_PROFILE_FIELDS.find((p) => p.id === Number(id));

  if (!profile) {
    return (
      <div className="space-y-6">
        <BackButton fallbackTo="/dashboard/kpis/subscriber-profiles" showBreadcrumb={true} currentLabel="Subscriber Profile Details" parentLabel={parentLabel} />
        <div className="text-center py-12">
          <p className="text-gray-600">Profile field not found</p>
        </div>
      </div>
    );
  }

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      showToast("info", `Delete functionality will be implemented soon`);
      setShowDeleteModal(false);
      navigate("/dashboard/kpis/subscriber-profiles");
    } catch (error) {
      console.error("Failed to delete:", error);
      showToast("error", "Failed to delete profile field");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div className="flex items-center space-x-2 sm:space-x-4">
          <BackButton fallbackTo="/dashboard/kpis/subscriber-profiles" showBreadcrumb={true} currentLabel="Subscriber Profile Details" parentLabel={parentLabel} />
          <div></div>
        </div>
        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => navigate(`/dashboard/kpis/subscriber-profiles/${profile.id}/edit`)}
            className={`px-4 py-2 text-white text-xs ${tw.rounded} font-semibold transition-all duration-200 flex items-center gap-2 w-fit`}
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
            onClick={() => setShowDeleteModal(true)}
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

      {/* Profile Information */}
      <div className="space-y-6">
        {/* Profile Overview */}
        <div className={`bg-white ${tw.rounded} border border-gray-200 p-6`}>
          <div className="flex items-start space-x-4 mb-6">
            <div
              className={`h-14 w-14 ${tw.rounded} flex items-center justify-center flex-shrink-0`}
              style={{ backgroundColor: color.primary.accent }}
            >
              <Users className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1">
              <h2 className={`text-sm font-semibold ${tw.textPrimary} mb-2`}>{profile.name}</h2>
              <p className={`text-sm ${tw.textSecondary} leading-relaxed`}>
                {profile.description || "No description available"}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-gray-200">
            <span
              className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium text-white"
              style={{ backgroundColor: color.primary.accent }}
            >
              {profile.status}
            </span>
            <span
              className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium text-white"
              style={{ backgroundColor: color.primary.accent }}
            >
              {profile.dataSource}
            </span>
          </div>
        </div>

        {/* Basic Information */}
        <div className={`bg-white ${tw.rounded} border border-gray-200 p-6`}>
          <h3 className={`text-sm font-semibold ${tw.textPrimary} mb-6`}>
            Basic Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className={`text-xs font-medium ${tw.textMuted} uppercase tracking-wide`}>
                Field Name
              </label>
              <p className={`text-sm ${tw.textPrimary}`}>{profile.name}</p>
            </div>
            <div className="space-y-1">
              <label className={`text-xs font-medium ${tw.textMuted} uppercase tracking-wide`}>
                Data Source
              </label>
              <p className={`text-sm ${tw.textPrimary}`}>{profile.dataSource}</p>
            </div>
            <div className="space-y-1">
              <label className={`text-xs font-medium ${tw.textMuted} uppercase tracking-wide`}>
                Frequency
              </label>
              <p className={`text-sm ${tw.textPrimary}`}>{profile.frequency}</p>
            </div>
            <div className="space-y-1">
              <label className={`text-xs font-medium ${tw.textMuted} uppercase tracking-wide`}>
                Platform Status
              </label>
              <p className={`text-sm ${tw.textPrimary}`}>{profile.status}</p>
            </div>
          </div>
        </div>

        {/* Extraction Logic */}
        <div className={`bg-white ${tw.rounded} border border-gray-200 p-6`}>
          <h3 className={`text-sm font-semibold ${tw.textPrimary} mb-6`}>
            Extraction Logic
          </h3>
          <div className="space-y-1">
            <label className={`text-xs font-medium ${tw.textMuted} uppercase tracking-wide`}>
              Logic Definition
            </label>
            <pre className={`text-sm ${tw.textPrimary} font-mono bg-gray-50 p-4 ${tw.rounded} overflow-x-auto border border-gray-200`}>
              {profile.extractionLogic || "—"}
            </pre>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-md p-6 max-w-md w-full mx-4">
            <h3 className={`text-sm font-semibold ${tw.textPrimary} mb-2`}>Delete Profile Field</h3>
            <p className={`text-sm ${tw.textSecondary} mb-6`}>
              Are you sure you want to delete "{profile.name}"? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-medium border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors disabled:opacity-60"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
