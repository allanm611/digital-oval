import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Edit, Trash2, Wifi, CheckCircle2, XCircle } from "lucide-react";
import BackButton from "../../../shared/components/ui/BackButton";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import DeleteConfirmModal from "../../../shared/components/ui/DeleteConfirmModal";
import { useToast } from "../../../contexts/ToastContext";
import { extractBackendError } from "../../../shared/utils/errorHandler";
import { color, tw, button } from "../../../shared/utils/utils";
import { smsRouteService } from "../services/smsRouteService";
import { emailRouteService } from "../services/emailRouteService";
import { pushNotificationRouteService } from "../services/pushNotificationRouteService";
import { whatsappRouteService } from "../services/whatsappRouteService";
import { ussdRouteService } from "../services/ussdRouteService";
import { useDeleteConfirm } from "../../../shared/hooks/useDeleteConfirm";

export default function RouteDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { success, error: showError } = useToast();

  const [route, setRoute] = useState<any>(null);
  const { deleteConfirm, isDeleting, openDeleteConfirm, closeDeleteConfirm, handleDelete } = useDeleteConfirm({ onDelete: async (id) => {}, itemLabel: "Item", });
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [togglingStatus, setTogglingStatus] = useState(false);

  useEffect(() => {
    loadRoute();
  }, [id]);

  const loadRoute = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const smsRoutes = await smsRouteService.getAllRoutes();
      let foundRoute = smsRoutes.find((r) => r.id === Number(id));
      if (foundRoute) {
        setRoute({ ...foundRoute, channel: "SMS" });
        return;
      }

      const emailRoutes = await emailRouteService.getAllRoutes();
      foundRoute = emailRoutes.find((r) => r.id === Number(id));
      if (foundRoute) {
        setRoute({ ...foundRoute, channel: "EMAIL" });
        return;
      }

      const pushRoutes = await pushNotificationRouteService.getAllRoutes();
      foundRoute = pushRoutes.find((r) => r.id === Number(id));
      if (foundRoute) {
        setRoute({ ...foundRoute, channel: "PUSH" });
        return;
      }

      const whatsappRoutes = await whatsappRouteService.getAllRoutes();
      foundRoute = whatsappRoutes.find((r) => r.id === Number(id));
      if (foundRoute) {
        setRoute({ ...foundRoute, channel: "WHATSAPP" });
        return;
      }

      const ussdRoutes = await ussdRouteService.getAllRoutes();
      foundRoute = ussdRoutes.find((r) => r.id === Number(id));
      if (foundRoute) {
        setRoute({ ...foundRoute, channel: "USSD" });
        return;
      }

      showError("Error", "Route not found");
      navigate("/dashboard/routes");
    } catch (err) {
      showError("Error", "Failed to load route details");
      navigate("/dashboard/routes");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!route) return;
    try {
      setTogglingStatus(true);
      const newStatus = !route.is_active;

      if (route.channel === "SMS") {
        await smsRouteService.updateRoute(route.id, { is_active: newStatus });
      } else if (route.channel === "EMAIL") {
        await emailRouteService.updateRoute(route.id, { is_active: newStatus });
      } else if (route.channel === "PUSH") {
        await pushNotificationRouteService.updateRoute(route.id, { is_active: newStatus });
      } else if (route.channel === "WHATSAPP") {
        await whatsappRouteService.updateRoute(route.id, { is_active: newStatus });
      } else if (route.channel === "USSD") {
        await ussdRouteService.updateRoute(route.id, { is_active: newStatus });
      }

      success("Success", `Route ${newStatus ? "activated" : "deactivated"} successfully`);
      setRoute({ ...route, is_active: newStatus });
    } catch (err) {
      showError("Error", extractBackendError(err, "Failed to update route status"));
    } finally {
      setTogglingStatus(false);
    }
  };

  const handleDelete = () => {
    openDeleteConfirm(item?.id || 0, item?.name || "");
  };

  const handleConfirmDelete = async () => {
    if (!route) return;
    try {
      setDeleting(true);

      if (route.channel === "SMS") {
        await smsRouteService.deleteRoute(route.id);
      } else if (route.channel === "EMAIL") {
        await emailRouteService.deleteRoute(route.id);
      } else if (route.channel === "PUSH") {
        await pushNotificationRouteService.deleteRoute(route.id);
      } else if (route.channel === "WHATSAPP") {
        await whatsappRouteService.deleteRoute(route.id);
      } else if (route.channel === "USSD") {
        await ussdRouteService.deleteRoute(route.id);
      }

      success("Success", `"${route.name}" has been deleted successfully`);
      navigate("/dashboard/routes");
    } catch (err) {
      showError("Error", extractBackendError(err, "Failed to delete route"));
    } finally {
      setDeleting(false);
      closeDeleteConfirm();
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
        <BackButton showBreadcrumb={true} currentLabel="Route Details" />
        <p className={tw.textSecondary}>Route not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div className="flex items-center space-x-2 sm:space-x-4">
          <BackButton showBreadcrumb={true} currentLabel="Route Details" />
          <div></div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleToggleStatus}
            disabled={togglingStatus}
            className={`px-4 py-2 text-xs ${tw.rounded} font-semibold transition-all duration-200 flex items-center gap-2 w-fit`}
            style={{
              backgroundColor: button.secondaryAction.background,
              color: button.secondaryAction.color,
              border: button.secondaryAction.border,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = "0.8";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = "1";
            }}
          >
            {route.is_active ? (
              <>
                <XCircle className="w-4 h-4" />
                Deactivate
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Activate
              </>
            )}
          </button>
          <button
            onClick={() => navigate(`/dashboard/routes/${route.id}/edit`)}
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

      {/* Route Overview Card */}
      <div className={`bg-white ${tw.rounded} border border-gray-200 p-6`}>
        <div className="flex items-start space-x-4 mb-6">
          <div
            className={`h-14 w-14 ${tw.rounded} flex items-center justify-center flex-shrink-0`}
            style={{ backgroundColor: color.primary.accent }}
          >
            <Wifi className="w-7 h-7 text-white" />
          </div>
          <div className="flex-1">
            <h2 className={`text-sm font-semibold ${tw.textPrimary} mb-2`}>
              {route.name}
            </h2>
            <p className={`text-sm ${tw.textSecondary} leading-relaxed`}>
              {route.description || "No description available"}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1">
            <label className={`text-xs font-medium ${tw.textMuted} uppercase tracking-wide`}>
              Route Name
            </label>
            <p className={`text-sm ${tw.textPrimary}`}>{route.name}</p>
          </div>

          <div className="space-y-1">
            <label className={`text-xs font-medium ${tw.textMuted} uppercase tracking-wide`}>
              Channel
            </label>
            <p className={`text-sm ${tw.textPrimary}`}>{route.channel}</p>
          </div>

          <div className="space-y-1">
            <label className={`text-xs font-medium ${tw.textMuted} uppercase tracking-wide`}>
              Gateway Provider
            </label>
            <p className={`text-sm ${tw.textPrimary}`}>{route.gateway_provider || "—"}</p>
          </div>

          <div className="space-y-1">
            <label className={`text-xs font-medium ${tw.textMuted} uppercase tracking-wide`}>
              Status
            </label>
            <p className={`text-sm ${tw.textPrimary}`}>
              {route.is_active ? "Active" : "Inactive"}
            </p>
          </div>

          <div className="space-y-1">
            <label className={`text-xs font-medium ${tw.textMuted} uppercase tracking-wide`}>
              Retry Attempts
            </label>
            <p className={`text-sm ${tw.textPrimary}`}>{route.retry_attempts || 0}</p>
          </div>

          <div className="space-y-1">
            <label className={`text-xs font-medium ${tw.textMuted} uppercase tracking-wide`}>
              Backup Route
            </label>
            <p className={`text-sm ${tw.textPrimary}`}>
              {route.backup_route_id ? "Yes" : "None"}
            </p>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteConfirm.id !== null}
        onClose={() => closeDeleteConfirm()}
        onConfirm={confirmDeleteItem}
        title="Delete Route"
        description="Are you sure you want to delete this route? This action cannot be undone."
        itemName={route.name}
        isLoading={deleting}
        confirmText="Delete"
      />
    </div>
  );
}
