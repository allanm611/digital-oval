import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Edit, Trash2 } from "lucide-react";
import BackButton from "../../../shared/components/ui/BackButton";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import { creativeTemplateService, CreativeTemplate } from "../services/creativeTemplateService";
import { useToast } from "../../../contexts/ToastContext";
import { useLanguage } from "../../../contexts/LanguageContext";
import { color, tw } from "../../../shared/utils/utils";

export default function CreativeTemplateDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { error: showError } = useToast();
  const { t } = useLanguage();
  const [template, setTemplate] = useState<CreativeTemplate | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTemplate();
  }, [id]);

  const loadTemplate = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const response = await creativeTemplateService.getCreativeTemplateById(Number(id));
      setTemplate(response.data);
    } catch (err) {
      showError(t("messages.error"), t("creativeTemplates.loadError"));
      navigate("/dashboard/creative-templates");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!template) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <BackButton fallbackTo="/dashboard/creative-templates" />
          <div>
            <h1 className={`text-2xl font-bold ${tw.textPrimary}`}>
              {template.name}
            </h1>
            <p className={`text-sm ${tw.textSecondary} mt-1`}>
              {template.description}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => navigate(`/dashboard/creative-templates/${id}/edit`)}
            className={`inline-flex items-center px-4 py-2 ${tw.rounded} text-sm font-medium text-white transition-colors hover:opacity-90`}
            style={{ backgroundColor: color.primary.action }}
          >
            <Edit className="h-4 w-4 mr-2" />
            {t("common.edit")}
          </button>
          <button
            onClick={async () => {
              if (!template) return;
              try {
                await creativeTemplateService.deleteCreativeTemplate(Number(id));
                showError(t("messages.success"), t("creativeTemplates.deleteSuccess"));
                navigate("/dashboard/creative-templates");
              } catch (err) {
                showError(t("messages.error"), t("creativeTemplates.deleteError"));
              }
            }}
            className={`inline-flex items-center px-4 py-2 ${tw.rounded} text-sm font-medium text-white transition-colors hover:opacity-90`}
            style={{ backgroundColor: "#DC2626" }}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            {t("common.delete")}
          </button>
        </div>
      </div>

      <div className={`bg-white ${tw.rounded} border`} style={{ borderColor: color.border.default }}>
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className={`text-xs font-medium ${tw.textSecondary} mb-2`}>
                {t("creativeTemplates.templateCode")}
              </p>
              <p className={`text-sm font-mono font-semibold ${tw.textPrimary}`}>
                {template.code}
              </p>
            </div>
            <div>
              <p className={`text-xs font-medium ${tw.textSecondary} mb-2`}>
                {t("creativeTemplates.channel")}
              </p>
              <p className={`text-sm font-semibold ${tw.textPrimary}`}>
                {template.channel}
              </p>
            </div>
            <div>
              <p className={`text-xs font-medium ${tw.textSecondary} mb-2`}>
                {t("creativeTemplates.locale")}
              </p>
              <p className={`text-sm font-semibold ${tw.textPrimary}`}>
                {template.locale || "—"}
              </p>
            </div>
            <div>
              <p className={`text-xs font-medium ${tw.textSecondary} mb-2`}>
                {t("common.status")}
              </p>
              <p className={`text-sm font-semibold ${tw.textPrimary}`}>
                {template.is_active ? t("common.active") : t("common.inactive")}
              </p>
            </div>
          </div>

          {template.title && (
            <div className="border-t pt-6">
              <h3 className={`text-lg font-semibold ${tw.textPrimary} mb-4`}>
                {t("creativeTemplates.content")}
              </h3>
              <div className="space-y-4">
                <div>
                  <p className={`text-xs font-medium ${tw.textSecondary} mb-2`}>
                    {t("creativeTemplates.title")}
                  </p>
                  <p className={`text-sm ${tw.textPrimary}`}>{template.title}</p>
                </div>
              </div>
            </div>
          )}

          {template.body_text && (
            <div>
              <p className={`text-xs font-medium ${tw.textSecondary} mb-2`}>
                {t("creativeTemplates.bodyText")}
              </p>
              <p className={`text-sm ${tw.textPrimary} whitespace-pre-wrap`}>
                {template.body_text}
              </p>
            </div>
          )}

          {template.body_html && (
            <div>
              <p className={`text-xs font-medium ${tw.textSecondary} mb-2`}>
                {t("creativeTemplates.htmlBody")}
              </p>
              <div
                className={`text-sm ${tw.textPrimary} bg-gray-50 p-4 rounded border`}
                style={{ borderColor: color.border.default }}
              >
                <pre className="overflow-x-auto text-xs">{template.body_html}</pre>
              </div>
            </div>
          )}

          {template.variables && Object.keys(template.variables).length > 0 && (
            <div className="border-t pt-6">
              <h3 className={`text-lg font-semibold ${tw.textPrimary} mb-4`}>
                {t("creativeTemplates.variables")}
              </h3>
              <div className="space-y-2">
                {Object.entries(template.variables).map(([key, value]) => (
                  <div key={key} className="flex gap-4">
                    <span className="text-sm font-mono font-semibold text-gray-600 w-32">
                      {key}
                    </span>
                    <span className={`text-sm ${tw.textPrimary}`}>
                      {JSON.stringify(value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="border-t pt-6">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className={`text-xs font-medium ${tw.textSecondary} mb-1`}>
                  {t("common.createdAt")}
                </p>
                <p className={tw.textPrimary}>
                  {template.created_at && new Date(template.created_at).toLocaleString()}
                </p>
              </div>
              <div>
                <p className={`text-xs font-medium ${tw.textSecondary} mb-1`}>
                  {t("common.updatedAt")}
                </p>
                <p className={tw.textPrimary}>
                  {template.updated_at && new Date(template.updated_at).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
