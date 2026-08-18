import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Edit, Trash2, Users } from "lucide-react";
import BackButton from "../../../shared/components/ui/BackButton";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import DeleteConfirmModal from "../../../shared/components/ui/DeleteConfirmModal";
import { color, tw, button } from "../../../shared/utils/utils";
import { useLanguage } from "../../../contexts/LanguageContext";
import { useToast } from "../../../contexts/ToastContext";
import { useState, useEffect } from "react";
import { subscriberProfileService } from "../services/subscriberProfileService";
import { getOperatorsForFieldType } from "../../../shared/utils/operatorMapper";

interface Profile {
  id: number | string;
  name: string;
  description?: string;
  dataSource: string;
  frequency: string;
  status: string;
  field_type?: string;
}

export default function SubscriberProfileDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const location = useLocation();
  const parentLabel = (location.state as any)?.parentLabel;
  const { showToast } = useToast();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    loadProfile();
  }, [id]);

  const loadProfile = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const profileData = await subscriberProfileService.getProfileById(Number(id));
      if (profileData) {
        const mappedProfile: Profile = {
          id: profileData.id,
          name: profileData.name,
          description: profileData.description,
          dataSource: profileData.data_source || "—",
          frequency: profileData.data_latency || "—",
          status: profileData.is_active ? t.common.active : t.common.inactive,
          field_type: profileData.field_type || "text",
        };
        setProfile(mappedProfile);
      } else {
        showToast("error", "Profile field not found");
        navigate("/dashboard/kpis/subscriber-profiles");
      }
    } catch (err) {
      showToast("error", "Failed to load profile details");
      navigate("/dashboard/kpis/subscriber-profiles");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!profile) return;
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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <LoadingSpinner variant="modern" size="xl" color="primary" />
        <p className={`${tw.textMuted} font-medium mt-4`}>
          Loading profile details...
        </p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="space-y-6">
        <BackButton showBreadcrumb={true} currentLabel="Subscriber Profile Details" parentLabel={parentLabel} />
        <div className="text-center py-12">
          <p className="text-gray-600">Profile field not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div className="flex items-center space-x-2 sm:space-x-4">
          <BackButton showBreadcrumb={true} currentLabel="Subscriber Profile Details" parentLabel={parentLabel} />
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
        {/* Profile Overview & Basic Information */}
        <div className={`bg-white ${tw.rounded} p-6`}>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
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
                {getOperatorsForFieldType(profile.field_type || "text").map((operator) => (
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
            {getOperatorsForFieldType(profile.field_type || "text").map((operator) => (
              <div
                key={operator.id}
                className=" rounded p-4 space-y-2"
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
      <DeleteConfirmModal
        isOpen={showDeleteModal}
        title="Delete Profile Field"
        description="Are you sure you want to delete this profile field? This action cannot be undone."
        itemName={profile?.name || ""}
        onConfirm={handleDelete}
        onClose={() => setShowDeleteModal(false)}
        isLoading={isDeleting}
      />
    </div>
  );
}
