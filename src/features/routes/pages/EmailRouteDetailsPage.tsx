import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Edit, Trash2, Mail } from "lucide-react";
import BackButton from "../../../shared/components/ui/BackButton";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import { EmailRoute } from "../types/emailRoute";
import { emailRouteService } from "../services/emailRouteService";
import { emailGatewayConfigService } from "../../configurations/services/emailGatewayConfigService";
import { useToast } from "../../../contexts/ToastContext";
import { useLanguage } from "../../../contexts/LanguageContext";
import { extractBackendError } from "../../../shared/utils/errorHandler";;;
import { color, tw, button } from "../../../shared/utils/utils";
import DateFormatter from "../../../shared/components/DateFormatter";

export default function EmailRouteDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { success, error: showError } = useToast();
  const { t } = useLanguage();

  const [loading, setLoading] = useState(true);
  const [route, setRoute] = useState<EmailRoute | null>(null);
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
      const data = await emailRouteService.getRouteById(Number(id));
      if (data) {
        setRoute(data);
        loadGatewayConfig(data.gateway_config_id);
      } else {
        showError(t.common.error, t.routes.emailRouteNotFound);
        navigate("/dashboard/email-routes");
      }
    } catch (err) {
      showError(t.common.error, t.routes.failedLoadEmailRoute);
      navigate("/dashboard/email-routes");
    } finally {
      setLoading(false);
    }
  };

  const loadGatewayConfig = async (configId: number) => {
    try {
      const configs = await emailGatewayConfigService.getAllConfigs();
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
      await emailRouteService.deleteRoute(route.id);
      success(t.common.success, `"${route.name}" ${t.routes.hasBeenDeleted}`);
      navigate("/dashboard/email-routes");
    } catch (err) {
      showError(t.common.error, t.routes.failedDeleteEmailRoute);
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <LoadingSpinner variant="modern" size="xl" color="primary" />
        <p className={`${tw.textMuted} font-medium mt-4`}>{t.routes.loadingRouteDetails}</p>
      </div>
    );
  }

  if (!route) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <BackButton />
          <p className={tw.textSecondary}>{t.routes.routeNotFound}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <BackButton

          showBreadcrumb={true}
          currentLabel={t.routes.emailRouteDetails}
        />

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => navigate(`/dashboard/email-routes/${route.id}/edit`)}
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
            {t.common.edit}
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
            {t.common.delete}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className={`bg-white ${tw.rounded} border border-gray-200 p-6`}>
            <div className="flex items-start space-x-4 mb-6">
              <div
                className={`h-14 w-14 ${tw.rounded} flex items-center justify-center flex-shrink-0`}
                style={{ backgroundColor: color.primary.accent }}
              >
                <Mail className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1">
                <h2 className={`${tw.tableFirstColumn} ${tw.textPrimary} mb-2`}>{route.name}</h2>
                <p className={`${tw.textSecondary} text-base leading-relaxed`}>
                  {route.description || t.routes.noDescriptionAvailable}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-gray-200">
              <span
                className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium text-white`}
                style={{ backgroundColor: route.is_active ? "#16a34a" : "#6b7280" }}
              >
                {route.is_active ? t.common.active : t.common.inactive}
              </span>
            </div>
          </div>

          <div className={`bg-white ${tw.rounded} border border-gray-200 p-6`}>
            <h3 className={`text-lg font-semibold ${tw.textPrimary} mb-6`}>
              {t.routes.basicInformation}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className={`text-xs font-medium ${tw.textMuted} uppercase tracking-wide`}>
                  {t.routes.routeName}
                </label>
                <p className={`${tw.tableFirstColumn} ${tw.textPrimary}`}>{route.name}</p>
              </div>
              <div className="space-y-1">
                <label className={`text-xs font-medium ${tw.textMuted} uppercase tracking-wide`}>
                  {t.common.status}
                </label>
                <p className={`text-base ${tw.textPrimary} capitalize`}>
                  {route.is_active ? t.common.active : t.common.inactive}
                </p>
              </div>
            </div>
          </div>

          <div className={`bg-white ${tw.rounded} border border-gray-200 p-6`}>
            <h3 className={`text-lg font-semibold ${tw.textPrimary} mb-6`}>
              {t.routes.gatewayConfiguration}
            </h3>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className={`text-xs font-medium ${tw.textMuted} uppercase tracking-wide`}>
                  {t.routes.configurationId}
                </label>
                <p className={`text-base ${tw.textPrimary}`}>{route.gateway_config_id}</p>
              </div>
              {gatewayConfig && (
                <>
                  <div className="space-y-1">
                    <label className={`text-xs font-medium ${tw.textMuted} uppercase tracking-wide`}>
                      {t.routes.configurationName}
                    </label>
                    <p className={`text-base ${tw.textPrimary}`}>{gatewayConfig.name}</p>
                  </div>
                  <div className="space-y-1">
                    <label className={`text-xs font-medium ${tw.textMuted} uppercase tracking-wide`}>
                      {t.routes.providerType}
                    </label>
                    <p className={`text-base ${tw.textPrimary}`}>{gatewayConfig.provider_type}</p>
                  </div>
                </>
              )}
            </div>
          </div>

          {route.description && (
            <div className={`bg-white ${tw.rounded} border border-gray-200 p-6`}>
              <h3 className={`text-lg font-semibold ${tw.textPrimary} mb-4`}>
                {t.common.description}
              </h3>
              <p className={`text-base ${tw.textPrimary} leading-relaxed`}>
                {route.description}
              </p>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className={`bg-white ${tw.rounded} border border-gray-200 p-6`}>
            <h3 className={`text-lg font-semibold ${tw.textPrimary} mb-6`}>{t.common.metadata}</h3>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className={`text-xs font-medium ${tw.textMuted} uppercase tracking-wide`}>
                  {t.routes.routeId}
                </label>
                <p className={`text-base ${tw.textPrimary} font-mono font-semibold`}>
                  {route.id}
                </p>
              </div>
              <div className="space-y-1">
                <label className={`text-xs font-medium ${tw.textMuted} uppercase tracking-wide`}>
                  {t.common.created}
                </label>
                <p className={`text-base ${tw.textPrimary}`}>
                  {route.created_at ? (
                    <DateFormatter
                      date={route.created_at}
                      useUserTimezone
                      includeTime
                      useLocale
                      year="numeric"
                      month="short"
                      day="numeric"
                      hour="2-digit"
                      minute="2-digit"
                    />
                  ) : (
                    "—"
                  )}
                </p>
              </div>
              <div className="space-y-1">
                <label className={`text-xs font-medium ${tw.textMuted} uppercase tracking-wide`}>
                  {t.common.lastUpdated}
                </label>
                <p className={`text-base ${tw.textPrimary}`}>
                  {route.updated_at ? (
                    <DateFormatter
                      date={route.updated_at}
                      useUserTimezone
                      includeTime
                      useLocale
                      year="numeric"
                      month="short"
                      day="numeric"
                      hour="2-digit"
                      minute="2-digit"
                    />
                  ) : (
                    "—"
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-md p-6 max-w-md w-full mx-4">
            <h3 className={`text-lg font-semibold ${tw.textPrimary} mb-2`}>
              {t.routes.deleteEmailRoute}
            </h3>
            <p className={`${tw.textSecondary} text-sm mb-6`}>
              {t.routes.areYouSureDeleteRoute}{route.name}"? {t.routes.cannotBeUndone}
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
                className="px-4 py-2 text-sm font-medium border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-60"
              >
                {t.common.cancel}
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors disabled:opacity-60"
              >
                {deleting ? t.routes.deleting : t.common.delete}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
