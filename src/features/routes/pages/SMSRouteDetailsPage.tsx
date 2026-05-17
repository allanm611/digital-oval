import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Edit, Trash2, Zap } from "lucide-react";
import BackButton from "../../../shared/components/ui/BackButton";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import { SMSRoute } from "../types/smsRoute";
import { smsRouteService } from "../services/smsRouteService";
import { smsGatewayConfigService } from "../../configurations/services/smsGatewayConfigService";
import { useToast } from "../../../contexts/ToastContext";
import { color, tw, button } from "../../../shared/utils/utils";

export default function SMSRouteDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { success, error: showError } = useToast();

  const [loading, setLoading] = useState(true);
  const [route, setRoute] = useState<SMSRoute | null>(null);
  const [gatewayConfig, setGatewayConfig] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    loadRoute();
  }, [id]);

  const loadRoute = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await smsRouteService.getRouteById(Number(id));
      if (data) {
        setRoute(data);
        loadGatewayConfig(data.gateway_config_id);
      } else {
        showError("Error", "SMS route not found");
        navigate("/dashboard/sms-routes");
      }
    } catch (err) {
      showError("Error", "Failed to load SMS route details");
      navigate("/dashboard/sms-routes");
    } finally {
      setLoading(false);
    }
  };

  const loadGatewayConfig = async (configId: number) => {
    try {
      const configs = await smsGatewayConfigService.getAllConfigs();
      const config = configs.find(c => c.id === configId);
      if (config) {
        setGatewayConfig(config);
      }
    } catch (err) {
      // Silent fail
    }
  };

  const handleDelete = () => {
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!route) return;
    try {
      setDeleting(true);
      await smsRouteService.deleteRoute(route.id);
      success("Success", `"${route.name}" has been deleted successfully`);
      navigate("/dashboard/sms-routes");
    } catch (err) {
      showError("Error", "Failed to delete SMS route");
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <LoadingSpinner variant="modern" size="xl" color="primary" />
        <p className={`${tw.textMuted} font-medium mt-4`}>Loading route details...</p>
      </div>
    );
  }

  if (!route) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <BackButton fallbackTo="/dashboard/sms-routes" />
          <p className={tw.textSecondary}>Route not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <BackButton fallbackTo="/dashboard/sms-routes" showBreadcrumb={true} currentLabel="SMS Route Details" />

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => navigate(`/dashboard/sms-routes/${route.id}/edit`)}
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

      {/* Route Information */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Route Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Route Overview */}
          <div className={`bg-white ${tw.rounded} border border-gray-200 p-6`}>
            <div className="flex items-start space-x-4 mb-6">
              <div
                className={`h-14 w-14 ${tw.rounded} flex items-center justify-center flex-shrink-0`}
                style={{ backgroundColor: color.primary.accent }}
              >
                <Zap className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1">
                <h2 className={`${tw.tableFirstColumn} ${tw.textPrimary} mb-2`}>{route.name}</h2>
                <p className={`${tw.textSecondary} text-base leading-relaxed`}>
                  {route.description || "No description available"}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-gray-200">
              <span
                className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium text-white ${
                  route.is_active ? "bg-green-600" : "bg-gray-500"
                }`}
                style={{ backgroundColor: route.is_active ? "#16a34a" : "#6b7280" }}
              >
                {route.is_active ? "Active" : "Inactive"}
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
                  Route Name
                </label>
                <p className={`${tw.tableFirstColumn} ${tw.textPrimary}`}>{route.name}</p>
              </div>
              <div className="space-y-1">
                <label className={`text-xs font-medium ${tw.textMuted} uppercase tracking-wide`}>
                  Gateway Configuration ID
                </label>
                <p className={`text-base ${tw.textPrimary}`}>{route.gateway_config_id}</p>
              </div>
              <div className="space-y-1">
                <label className={`text-xs font-medium ${tw.textMuted} uppercase tracking-wide`}>
                  Status
                </label>
                <p className={`text-base ${tw.textPrimary} capitalize`}>{route.is_active ? "Active" : "Inactive"}</p>
              </div>
            </div>
          </div>

          {/* Gateway Configuration Section */}
          <div className={`bg-white ${tw.rounded} border border-gray-200 p-6`}>
            <h3 className={`text-lg font-semibold ${tw.textPrimary} mb-6`}>
              Gateway Configuration
            </h3>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className={`text-xs font-medium ${tw.textMuted} uppercase tracking-wide`}>
                  Configuration ID
                </label>
                <p className={`text-base ${tw.textPrimary}`}>{route.gateway_config_id}</p>
              </div>
              {gatewayConfig && (
                <>
                  <div className="space-y-1">
                    <label className={`text-xs font-medium ${tw.textMuted} uppercase tracking-wide`}>
                      Configuration Name
                    </label>
                    <p className={`text-base ${tw.textPrimary}`}>{gatewayConfig.name}</p>
                  </div>
                  <div className="space-y-1">
                    <label className={`text-xs font-medium ${tw.textMuted} uppercase tracking-wide`}>
                      Provider Type
                    </label>
                    <p className={`text-base ${tw.textPrimary}`}>{gatewayConfig.provider_type}</p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Description Section */}
          {route.description && (
            <div className={`bg-white ${tw.rounded} border border-gray-200 p-6`}>
              <h3 className={`text-lg font-semibold ${tw.textPrimary} mb-4`}>
                Description
              </h3>
              <p className={`text-base ${tw.textPrimary} leading-relaxed`}>
                {route.description}
              </p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Metadata */}
          <div className={`bg-white ${tw.rounded} border border-gray-200 p-6`}>
            <h3 className={`text-lg font-semibold ${tw.textPrimary} mb-6`}>Metadata</h3>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className={`text-xs font-medium ${tw.textMuted} uppercase tracking-wide`}>
                  Route ID
                </label>
                <p className={`text-base ${tw.textPrimary} font-mono font-semibold`}>
                  {route.id}
                </p>
              </div>
              <div className="space-y-1">
                <label className={`text-xs font-medium ${tw.textMuted} uppercase tracking-wide`}>
                  Created
                </label>
                <p className={`text-base ${tw.textPrimary}`}>
                  {route.created_at
                    ? new Date(route.created_at).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "—"}
                </p>
              </div>
              <div className="space-y-1">
                <label className={`text-xs font-medium ${tw.textMuted} uppercase tracking-wide`}>
                  Last Updated
                </label>
                <p className={`text-base ${tw.textPrimary}`}>
                  {route.updated_at
                    ? new Date(route.updated_at).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "—"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-md p-6 max-w-md w-full mx-4">
            <h3 className={`text-lg font-semibold ${tw.textPrimary} mb-2`}>
              Delete SMS Route
            </h3>
            <p className={`${tw.textSecondary} text-sm mb-6`}>
              Are you sure you want to delete "{route.name}"? This action cannot be undone.
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
