import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Save } from "lucide-react";
import BackButton from "../../../shared/components/ui/BackButton";
import Input from "../../../shared/components/ui/Input";
import Textarea from "../../../shared/components/ui/Textarea";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import Checkbox from "../../../shared/components/ui/Checkbox";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import { SMSRoute, CreateSMSRouteRequest } from "../types/smsRoute";
import { ussdRouteService } from "../services/ussdRouteService";
import { ussdGatewayConfigService } from "../../configurations/services/ussdGatewayConfigService";
import { useToast } from "../../../contexts/ToastContext";
import { extractBackendError } from "../../../shared/utils/errorHandler";;;
import { color, tw } from "../../../shared/utils/utils";
import { useLanguage } from "../../../contexts/LanguageContext";

const ENCODING_OPTIONS = [
  { value: "UTF-8", label: "UTF-8" },
  { value: "GSM-7", label: "GSM-7" },
  { value: "UCS2", label: "UCS2" },
];

export default function CreateEditUSSDRoutePage() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const { success, error: showError } = useToast();
  const { t } = useLanguage();

  const [loading, setLoading] = useState(!!id);
  const [saving, setSaving] = useState(false);
  const [isLoadingConfigs, setIsLoadingConfigs] = useState(false);
  const [route, setRoute] = useState<SMSRoute | null>(null);
  const [allRoutes, setAllRoutes] = useState<SMSRoute[]>([]);
  const [gatewayConfigs, setGatewayConfigs] = useState<any[]>([]);

  const [formData, setFormData] = useState<CreateSMSRouteRequest>({
    name: "",
    gateway_config_id: 0,
    communication_channel: "USSD",
    is_active: true,
    description: "",
    backup_route_id: undefined,
    use_backup_on_failure: false,
    retry_attempts: 3,
  });

  const [extendedFormData, setExtendedFormData] = useState({
    ussdCode: "",
    networkCode: "",
    sessionTimeout: "60",
    encoding: "UTF-8",
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    const loadAllRoutes = async () => {
      try {
        const routes = await ussdRouteService.getAllRoutes();
        setAllRoutes(routes);
      } catch (err) {
        // Silent fail
      }
    };

    const loadGatewayConfigs = async () => {
      try {
        setIsLoadingConfigs(true);
        const configs = await ussdGatewayConfigService.getAllConfigs();
        setGatewayConfigs(configs);
      } catch (err) {
        showError(t.common.error, "Failed to load gateway configurations");
      } finally {
        setIsLoadingConfigs(false);
      }
    };

    loadAllRoutes();
    loadGatewayConfigs();

    if (id) {
      loadRoute();
    } else {
      setLoading(false);
    }
  }, [id]);

  const loadRoute = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await ussdRouteService.getRouteById(Number(id));
      if (data) {
        setRoute(data);
        setFormData({
          name: data.name,
          gateway_config_id: (data as any).gateway_config_id || 0,
          communication_channel: data.communication_channel || "USSD",
          is_active: data.is_active,
          description: data.description,
          backup_route_id: data.backup_route_id,
          use_backup_on_failure: data.use_backup_on_failure,
          retry_attempts: data.retry_attempts || 3,
        });
        setExtendedFormData({
          ussdCode: (data as any).ussdCode || "",
          networkCode: (data as any).networkCode || "",
          sessionTimeout: (data as any).sessionTimeout || "60",
          encoding: (data as any).encoding || "UTF-8",
        });
      }
    } catch (err) {
      showError(t.common.error, extractBackendError(err, "Error. Please try again."));
      navigate("/dashboard/ussd-routes");
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
    if (!extendedFormData.ussdCode.trim()) {
      newErrors.ussdCode = "USSD code is required";
    }

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

      if (id) {
        await ussdRouteService.updateRoute(Number(id), payloadData);
        success(t.common.success, "USSD route updated successfully");
      } else {
        await ussdRouteService.createRoute(payloadData);
        success(t.common.success, "USSD route created successfully");
      }

      navigate("/dashboard/ussd-routes");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to save route";
      showError(t.common.error, extractBackendError(err, "Error. Please try again."));
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (fieldName: keyof CreateSMSRouteRequest) => (value: string | number) => {
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

    if (errors[fieldName]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <LoadingSpinner variant="modern" size="xl" color="primary" />
        <p className={`${tw.textMuted} font-medium mt-4`}>Loading {t.routes.channels.ussd} {t.routes.route}...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Back Button */}
      <BackButton

        showBreadcrumb={true}
        currentLabel={id ? `${t.common.edit} ${t.routes.channels.ussd} ${t.routes.route}` : `${t.routes.createRoute} ${t.routes.channels.ussd}`}
      />

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
                  placeholder="e.g., Primary USSD Gateway"
                  value={formData.name}
                  onChange={handleInputChange("name")}
                  hasError={!!errors.name}
                  disabled={saving}
                  required
                />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
              </div>

              <div>
                <HeadlessSelect
                  label="USSD Gateway Configuration"
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
                    <p className={`text-xs ${tw.textSecondary} mt-2`}>
                      This route will be used if the primary route fails
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>


        {/* USSD-Specific Configuration Section */}
        <div className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}>
          <h2 className={`${tw.cardHeading} text-gray-900 mb-4`}>{t.routes.channels.ussd} {t.common.metadata}</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Input
                  label="USSD Code *"
                  placeholder="e.g., *123#"
                  value={extendedFormData.ussdCode}
                  onChange={(value) => handleExtendedFieldChange("ussdCode", value)}
                  hasError={!!errors.ussdCode}
                  disabled={saving}
                />
                {errors.ussdCode && <p className="text-red-500 text-xs mt-1">{errors.ussdCode}</p>}
              </div>

              <Input
                label="Network Code (Optional)"
                placeholder="e.g., MCC/MNC code"
                value={extendedFormData.networkCode}
                onChange={(value) => handleExtendedFieldChange("networkCode", value)}
                disabled={saving}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Session Timeout (seconds)"
                type="number"
                placeholder="60"
                value={extendedFormData.sessionTimeout}
                onChange={(value) => handleExtendedFieldChange("sessionTimeout", value)}
                min="10"
                max="300"
                disabled={saving}
              />

              <div>
                <HeadlessSelect
                  label="Encoding"
                  options={ENCODING_OPTIONS}
                  value={extendedFormData.encoding}
                  onChange={(value) => handleExtendedFieldChange("encoding", value as string)}
                  disabled={saving}
                />
              </div>
            </div>

            <div>
              <Input
                label="Retry Attempts"
                type="number"
                placeholder="3"
                value={String(formData.retry_attempts || 3)}
                onChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    retry_attempts: value ? Number(value) : 3,
                  }))
                }
                min="1"
                max="10"
                disabled={saving}
              />
            </div>
          </div>
        </div>


        {/* Form Actions */}
        <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={() => navigate("/dashboard/ussd-routes")}
            disabled={saving}
            className="px-6 py-2 text-sm font-medium rounded-md transition-colors disabled:opacity-60"
            style={{
              background: "transparent",
              color: color.primary.action,
              border: `1px solid ${color.primary.action}`,
            }}
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
            {saving ? (id ? "Updating..." : "Creating...") : id ? t.common.edit : t.routes.createRoute}
          </button>
        </div>
      </form>
    </div>
  );
}
