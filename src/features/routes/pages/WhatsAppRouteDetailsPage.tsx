import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Edit, Trash2 } from "lucide-react";
import BackButton from "../../../shared/components/ui/BackButton";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import ActivateDeactivateButton from "../../../shared/components/ui/ActivateDeactivateButton";
import { WhatsAppRoute } from "../types/whatsappRoute";
import { whatsappRouteService } from "../services/whatsappRouteService";
import { useToast } from "../../../contexts/ToastContext";
import { extractBackendError } from "../../../shared/utils/errorHandler";;;
import DeleteConfirmModal from "../../../shared/components/ui/DeleteConfirmModal";

import { color, tw } from "../../../shared/utils/utils";
import DateFormatter from "../../../shared/components/DateFormatter";
import { useDeleteConfirm } from "../../../shared/hooks/useDeleteConfirm";
import { useLanguage } from "../../../contexts/LanguageContext";

export default function WhatsAppRouteDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { success, error: showError } = useToast();
  const { t } = useLanguage();

  const { deleteConfirm, isDeleting: deleting, openDeleteConfirm, closeDeleteConfirm } = useDeleteConfirm({ onDelete: async () => await confirmDeleteRoute() });

  const [route, setRoute] = useState<WhatsAppRoute | null>(null);
  const [loading, setLoading] = useState(true);
  const [togglingStatus, setTogglingStatus] = useState(false);

  useEffect(() => {
    loadRoute();
  }, [id]);

  const loadRoute = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await whatsappRouteService.getRouteById(Number(id));
      if (data) {
        setRoute(data);
      }
    } catch (err) {
      showError(t.common.error, "Failed to load WhatsApp route");
      navigate("/dashboard/whatsapp-routes");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = () => {
    openDeleteConfirm(route?.id || 0, route?.name || "");
  };

  const confirmDeleteRoute = async () => {
    if (!route) return;

    try {
      await whatsappRouteService.deleteRoute(route.id);
      success(t.common.success, `"${route.name}" has been deleted successfully`);
      closeDeleteConfirm();
      navigate("/dashboard/whatsapp-routes");
    } catch (err) {
      showError("Error", "Failed to delete WhatsApp route");
    } finally {
      closeDeleteConfirm();
    }
  };

  const handleToggleStatus = async () => {
    if (!route) return;

    try {
      setTogglingStatus(true);
      const newStatus = !route.is_active;
      await whatsappRouteService.updateRoute(route.id, {
        is_active: newStatus,
      });
      setRoute((prev) => (prev ? { ...prev, is_active: newStatus } : null));
      success(
        t.common.success,
        `"${route.name}" has been ${newStatus ? t.routes.activated : t.routes.deactivated} successfully`,
      );
    } catch (err) {
      showError(t.common.error, "Failed to update route status");
    } finally {
      setTogglingStatus(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <LoadingSpinner variant="modern" size="xl" color="primary" />
        <p className={`${tw.textMuted} font-medium mt-4`}>
          Loading {t.routes.channels.whatsapp} {t.routes.route} details...
        </p>
      </div>
    );
  }

  if (!route) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <p className={`${tw.textSecondary}`}>Route not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <BackButton showBreadcrumb={true} currentLabel={`${t.routes.channels.whatsapp} ${t.routes.route} Details`} />

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className={`${tw.cardHeading} text-gray-900`}>{route.name}</h1>
          {route.description && (
            <p className={`${tw.textSecondary} mt-2`}>{route.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <ActivateDeactivateButton
            isActive={route.is_active}
            onToggle={handleToggleStatus}
            disabled={deleting || togglingStatus}
            isLoading={togglingStatus}
            variant="button"
            title={route.is_active ? t.common.deactivate : t.common.activate}
          >
            {route.is_active ? t.common.deactivate : t.common.activate}
          </ActivateDeactivateButton>
          <button
            onClick={() => navigate(`/dashboard/routes/edit/${route.id}`)}
            disabled={deleting}
            className={`p-2 text-black hover:bg-gray-100 ${tw.rounded} disabled:opacity-60`}
            title={t.common.edit}
          >
            <Edit className="w-5 h-5" />
          </button>
          <button
            onClick={handleDeleteClick}
            disabled={deleting}
            className={`p-2 text-red-600 hover:bg-red-50 ${tw.rounded} disabled:opacity-60`}
            title={t.common.delete}
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Details Card */}
      <div className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}>
        <h2 className={`${tw.cardHeading} text-gray-900 mb-4`}>Route Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-gray-600 mb-1">{t.routes.routeName}</p>
            <p className="text-sm font-medium text-gray-900">{route.name}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">{t.routes.status}</p>
            <p className="text-sm font-medium text-gray-900">
              {route.is_active ? (
                <span className="inline-block px-2 py-1 text-xs font-semibold text-green-800 bg-green-100 rounded">
                  {t.common.active}
                </span>
              ) : (
                <span className="inline-block px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 rounded">
                  {t.common.inactive}
                </span>
              )}
            </p>
          </div>
          {route.description && (
            <div className="md:col-span-2">
              <p className="text-sm text-gray-600 mb-1">{t.common.description}</p>
              <p className="text-sm text-gray-900">{route.description}</p>
            </div>
          )}
          <div>
            <p className="text-sm text-gray-600 mb-1">{t.common.created}</p>
            <p className="text-sm text-gray-900">
              <DateFormatter date={route.created_at} useUserTimezone includeTime />
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">{t.common.lastUpdated}</p>
            <p className="text-sm text-gray-900">
              <DateFormatter date={route.updated_at} useUserTimezone includeTime />
            </p>
          </div>
        </div>
      </div>

      <DeleteConfirmModal
        isOpen={deleteConfirm.id !== null}
        onClose={() => closeDeleteConfirm()}
        onConfirm={confirmDeleteRoute}
        title={`Delete ${t.routes.channels.whatsapp} Route`}
        description="This action cannot be undone."
        itemName={route?.name || ""}
        isLoading={deleting}
      />
    </div>
  );
}
