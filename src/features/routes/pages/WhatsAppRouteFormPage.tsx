import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Save } from "lucide-react";
import BackButton from "../../../shared/components/ui/BackButton";
import Input from "../../../shared/components/ui/Input";
import Textarea from "../../../shared/components/ui/Textarea";
import Checkbox from "../../../shared/components/ui/Checkbox";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import { WhatsAppRoute, CreateWhatsAppRouteRequest } from "../types/whatsappRoute";
import { whatsappRouteService } from "../services/whatsappRouteService";
import { whatsappGatewayConfigService } from "../../configurations/services/whatsappGatewayConfigService";
import { MESSAGE_TEMPLATE_OPTIONS } from "../constants/whatsappRouteEnums";
import { useToast } from "../../../contexts/ToastContext";
import { extractBackendError } from "../../../shared/utils/errorHandler";;;
import { color, tw } from "../../../shared/utils/utils";
import { useLanguage } from "../../../contexts/LanguageContext";

const STATUS_OPTIONS = (t: any) => [
  { label: t.common.active, value: "true" },
  { label: t.common.inactive, value: "false" },
];

interface WhatsAppRouteFormPageProps {
  mode: "create" | "edit";
}

export default function WhatsAppRouteFormPage({ mode }: WhatsAppRouteFormPageProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { success, error: showError } = useToast();
  const { t } = useLanguage();

  const [loading, setLoading] = useState(mode === "edit");
  const [saving, setSaving] = useState(false);
  const [isLoadingConfigs, setIsLoadingConfigs] = useState(false);
  const [route, setRoute] = useState<WhatsAppRoute | null>(null);
  const [allRoutes, setAllRoutes] = useState<WhatsAppRoute[]>([]);
  const [gatewayConfigs, setGatewayConfigs] = useState<any[]>([]);

  const [formData, setFormData] = useState<CreateWhatsAppRouteRequest>({
    name: "",
    gateway_config_id: 0,
    is_active: true,
    description: "",
    backup_route_id: undefined,
    use_backup_on_failure: false,
    retry_attempts: 3,
  });

  const [extendedFormData, setExtendedFormData] = useState({
    webhookUrl: "",
    templateSupport: "false",
    qualityThreshold: "50",
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    const loadAllRoutes = async () => {
      try {
        const routes = await whatsappRouteService.getAllRoutes();
        setAllRoutes(routes);
      } catch (err) {
        // Silent fail
      }
    };

    loadAllRoutes();
    loadGatewayConfigs();
    if (mode === "edit" && id) {
      loadRoute();
    }
  }, [mode, id]);

  const loadGatewayConfigs = async () => {
    try {
      setIsLoadingConfigs(true);
      const configs = await whatsappGatewayConfigService.getAllConfigs();
      setGatewayConfigs(configs);
    } catch (err) {
      showError(t.common.error, "Failed to load gateway configurations");
    } finally {
      setIsLoadingConfigs(false);
    }
  };

  const loadRoute = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await whatsappRouteService.getRouteById(Number(id));
      if (data) {
        setRoute(data);
        setFormData({
          name: data.name,
          gateway_config_id: (data as any).gateway_config_id || 0,
          is_active: data.is_active,
          description: data.description,
          backup_route_id: (data as any).backup_route_id,
          use_backup_on_failure: (data as any).use_backup_on_failure || false,
          retry_attempts: (data as any).retry_attempts || 3,
        });
        setExtendedFormData({
          webhookUrl: (data as any).webhookUrl || "",
          templateSupport: (data as any).templateSupport || "false",
          qualityThreshold: (data as any).qualityThreshold || "50",
        });
      }
    } catch (err) {
      showError("Error", extractBackendError(err, "Error. Please try again."));
      navigate("/dashboard/whatsapp-routes");
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.name.trim()) {
      newErrors.name = "Route name is required";
    }
    // gateway_config_id is no longer required

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      showError(t.common.error, "Please fill in all required fields");
      return;
    }

    try {
      setSaving(true);

      // Remove gateway_config_id from payload
      const { gateway_config_id, ...payloadData } = formData;

      if (mode === "edit" && id) {
        await whatsappRouteService.updateRoute(Number(id), payloadData);
        success(t.common.success, "WhatsApp route updated successfully");
      } else {
        await whatsappRouteService.createRoute(payloadData);
        success(t.common.success, "WhatsApp route created successfully");
      }

      navigate("/dashboard/whatsapp-routes");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to save route";
      showError(t.common.error, extractBackendError(err, "Error. Please try again."));
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (fieldName: keyof CreateWhatsAppRouteRequest) => (value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      [fieldName]: value,
    }));

    if (errors[fieldName]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSelectChange = (fieldName: string, value: string | number | undefined) => {
    if (fieldName === "is_active") {
      setFormData((prev) => ({
        ...prev,
        [fieldName]: value === "true",
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [fieldName]: value,
      }));
    }

    if (errors[fieldName]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }
  };

  const handleExtendedFieldChange = (fieldName: string, value: string) => {
    setExtendedFormData((prev) => ({
      ...prev,
      [fieldName]: value,
    }));
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <LoadingSpinner variant="modern" size="xl" color="primary" />
        <p className={`${tw.textMuted} font-medium mt-4`}>Loading {t.routes.channels.whatsapp} {t.routes.route}...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Back Button */}
      <BackButton showBreadcrumb={true} currentLabel={mode === "create" ? `${t.routes.createRoute} ${t.routes.channels.whatsapp}` : `${t.common.edit} ${t.routes.channels.whatsapp} ${t.routes.route}`} />

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Route Configuration Section */}
        <div className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}>
          <h2 className={`${tw.cardHeading} text-gray-900 mb-4`}>{t.routes.routeName} {t.common.metadata}</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Input
                  label={t.routes.routeName}
                  placeholder="e.g., Meta WhatsApp Business"
                  value={formData.name}
                  onChange={handleInputChange('name')}
                  hasError={!!errors.name}

                  disabled={saving}
                  required
                />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
              </div>

              <div>
                <HeadlessSelect
                  label="WhatsApp Gateway Configuration"
                  options={gatewayConfigs.map((config) => ({
                    value: String(config.id),
                    label: config.name,
                  }))}
                  value={String(formData.gateway_config_id || "")}
                  onChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      gateway_config_id: value ? Number(value) : 0,
                    }))
                  }
                  placeholder="Select gateway configuration"
                  disabled={saving || isLoadingConfigs}
                  error={!!errors.gateway_config_id}
                />
                {errors.gateway_config_id && (
                  <p className="text-red-500 text-xs mt-1">{errors.gateway_config_id}</p>
                )}
              </div>
            </div>

            <div>
              <Textarea
                label={t.common.description}
                value={formData.description || ""}
                onChange={(value) => setFormData((prev) => ({ ...prev, description: value }))}
                placeholder="Add notes about this route..."
                rows={3}
                disabled={saving}
              />
            </div>

            <div>
              <Input
                label="Webhook URL"
                placeholder="e.g., https://api.example.com/webhooks/whatsapp"
                value={extendedFormData.webhookUrl}
                onChange={(value) => handleExtendedFieldChange("webhookUrl", value)}
               
                disabled={saving}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <HeadlessSelect
                  label="Message Template Support"
                  options={MESSAGE_TEMPLATE_OPTIONS.map(opt => ({
                    value: opt.value,
                    label: opt.label
                  }))}
                  value={extendedFormData.templateSupport}
                  onChange={(value) => handleExtendedFieldChange("templateSupport", value as string)}
                  disabled={saving}
                />
              </div>

              <Input
                label="Quality Threshold (%)"
                type="number"
                placeholder="50"
                value={extendedFormData.qualityThreshold}
                onChange={(value) => handleExtendedFieldChange("qualityThreshold", value)}
                min="0"
                max="100"
                disabled={saving}
              />
            </div>

            <div className="pt-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <Checkbox
                  id="use_backup_on_failure"
                  checked={formData.use_backup_on_failure || false}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev) => ({
                      ...prev,
                      use_backup_on_failure: e.target.checked,
                    }))
                  }
                  disabled={saving}
                />
                <div className="flex-1">
                  <span className="block text-sm font-medium text-gray-700">
                    Use backup route if this route fails
                  </span>
                  <p className={`text-xs ${tw.textSecondary} mt-1`}>
                    Enable automatic failover to a backup route when delivery fails
                  </p>
                </div>
              </label>

              {formData.use_backup_on_failure && (
                <div className="space-y-4 mt-4">
                  <div>
                    <HeadlessSelect
                      label="Backup Route"
                      options={[
                        { value: "", label: "Select a backup route" },
                        ...(allRoutes
                          .filter((r) => r.id !== (route?.id || formData.backup_route_id))
                          .map((route) => ({
                            value: String(route.id),
                            label: route.name,
                          })) || []),
                      ]}
                      value={String(formData.backup_route_id || "")}
                      onChange={(value) =>
                        setFormData((prev) => ({
                          ...prev,
                          backup_route_id: value ? Number(value) : undefined,
                        }))
                      }
                      disabled={saving}
                    />
                  </div>

                  <Input
                    label="Retry Attempts Before Failover"
                    type="number"
                    placeholder="3"
                    value={String(formData.retry_attempts || 3)}
                    onChange={(value) =>
                      setFormData((prev) => ({
                        ...prev,
                        retry_attempts: value ? Number(value) : 3,
                      }))
                    }
                    disabled={saving}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-between pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={() => navigate("/dashboard/whatsapp-routes")}
            disabled={saving}
            className="px-6 py-2 text-sm font-medium border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-60"
          >
            {t.common.cancel}
          </button>

          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-2 text-sm font-medium text-white rounded-md transition-colors disabled:opacity-60"
            style={{ backgroundColor: color.primary.action }}
          >
            <Save className="w-4 h-4" />
            {saving ? t.routes.successfully : t.routes.route}
          </button>
        </div>
      </form>
    </div>
  );
}
