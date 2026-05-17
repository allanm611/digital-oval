import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Save } from "lucide-react";
import BackButton from "../../../shared/components/ui/BackButton";
import Input from "../../../shared/components/ui/Input";
import Checkbox from "../../../shared/components/ui/Checkbox";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import { PushNotificationRoute, CreatePushNotificationRouteRequest } from "../types/pushNotificationRoute";
import { pushNotificationRouteService } from "../services/pushNotificationRouteService";
import { pushGatewayConfigService } from "../../configurations/services/pushGatewayConfigService";
import { PUSH_PLATFORM_OPTIONS, PRIORITY_LEVEL_OPTIONS } from "../constants/pushNotificationRouteEnums";
import { useToast } from "../../../contexts/ToastContext";
import { color, tw } from "../../../shared/utils/utils";

const STATUS_OPTIONS = [
  { label: "Active", value: "true" },
  { label: "Inactive", value: "false" },
];

interface PushNotificationRouteFormPageProps {
  mode: "create" | "edit";
}

export default function PushNotificationRouteFormPage({ mode }: PushNotificationRouteFormPageProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { success, error: showError } = useToast();

  const [loading, setLoading] = useState(mode === "edit");
  const [saving, setSaving] = useState(false);
  const [isLoadingConfigs, setIsLoadingConfigs] = useState(false);
  const [route, setRoute] = useState<PushNotificationRoute | null>(null);
  const [allRoutes, setAllRoutes] = useState<PushNotificationRoute[]>([]);
  const [gatewayConfigs, setGatewayConfigs] = useState<any[]>([]);

  const [formData, setFormData] = useState<CreatePushNotificationRouteRequest>({
    name: "",
    gateway_config_id: 0,
    is_active: true,
    description: "",
    backup_route_id: undefined,
    use_backup_on_failure: false,
    retry_attempts: 3,
  });

  const [extendedFormData, setExtendedFormData] = useState({
    platforms: [] as string[],
    defaultTTL: "3600",
    priorityLevel: "NORMAL",
    webhookUrl: "",
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    const loadAllRoutes = async () => {
      try {
        const routes = await pushNotificationRouteService.getAllRoutes();
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
      const configs = await pushGatewayConfigService.getAllConfigs();
      setGatewayConfigs(configs);
    } catch (err) {
      showError("Error", "Failed to load gateway configurations");
    } finally {
      setIsLoadingConfigs(false);
    }
  };

  const loadRoute = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await pushNotificationRouteService.getRouteById(Number(id));
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
          platforms: (data as any).platforms || [],
          defaultTTL: (data as any).defaultTTL || "3600",
          priorityLevel: (data as any).priorityLevel || "NORMAL",
          webhookUrl: (data as any).webhookUrl || "",
        });
      }
    } catch (err) {
      showError("Error", "Failed to load push notification route");
      navigate("/dashboard/push-notification-routes");
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.name.trim()) {
      newErrors.name = "Route name is required";
    }
    if (!formData.gateway_config_id) {
      newErrors.gateway_config_id = "Gateway configuration is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      showError("Validation Error", "Please fill in all required fields");
      return;
    }

    try {
      setSaving(true);

      if (mode === "edit" && id) {
        await pushNotificationRouteService.updateRoute(Number(id), {
          ...formData,
        });
        success("Success", "Push notification route updated successfully");
      } else {
        await pushNotificationRouteService.createRoute(formData);
        success("Success", "Push notification route created successfully");
      }

      navigate("/dashboard/push-notification-routes");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to save route";
      showError("Error", errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (fieldName: keyof CreatePushNotificationRouteRequest) => (value: string | number) => {
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

  const handleExtendedFieldChange = (fieldName: string, value: string | string[]) => {
    setExtendedFormData((prev) => ({
      ...prev,
      [fieldName]: value,
    }));
  };

  const handlePlatformToggle = (platform: string) => {
    setExtendedFormData((prev) => {
      const platforms = prev.platforms.includes(platform)
        ? prev.platforms.filter(p => p !== platform)
        : [...prev.platforms, platform];
      return {
        ...prev,
        platforms,
      };
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <LoadingSpinner variant="modern" size="xl" color="primary" />
        <p className={`${tw.textMuted} font-medium mt-4`}>Loading push notification route...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Back Button */}
      <BackButton fallbackTo="/dashboard/push-notification-routes" showBreadcrumb={true} currentLabel={mode === "create" ? "Create Push Notification Route" : "Edit Push Notification Route"} />

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Route Configuration Section */}
        <div className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}>
          <h2 className={`${tw.cardHeading} text-gray-900 mb-4`}>Route Configuration</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Route Name *
                </label>
                <Input
                  placeholder="e.g., Firebase Production Gateway"
                  value={formData.name}
                  onChange={handleInputChange('name')}
                  hasError={!!errors.name}
                  variant="medium"
                  disabled={saving}
                />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Push Gateway Configuration *
                </label>
                <HeadlessSelect
                  options={gatewayConfigs.map((config) => ({
                    value: String(config.id),
                    label: `${config.name} (${config.provider_type})`,
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description || ""}
                onChange={handleTextareaChange}
                placeholder="Add notes about this route..."
                rows={3}
                className={`w-full px-3 py-2 text-sm border border-gray-300 ${tw.rounded} focus:outline-none`}
                disabled={saving}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Webhook URL
              </label>
              <Input
                placeholder="e.g., https://api.example.com/webhooks/push-notifications"
                value={extendedFormData.webhookUrl}
                onChange={(value) => handleExtendedFieldChange("webhookUrl", value)}
                variant="medium"
                disabled={saving}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Supported Platforms
              </label>
              <div className="space-y-2">
                {PUSH_PLATFORM_OPTIONS.map((platform) => (
                  <label key={platform.value} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={extendedFormData.platforms.includes(platform.value)}
                      onChange={() => handlePlatformToggle(platform.value)}
                      disabled={saving}
                      className="w-4 h-4 rounded border-gray-300"
                    />
                    <span className="text-sm text-gray-700">{platform.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Default TTL (seconds)
                </label>
                <Input
                  type="number"
                  placeholder="3600"
                  value={extendedFormData.defaultTTL}
                  onChange={(value) => handleExtendedFieldChange("defaultTTL", value)}
                  variant="medium"
                  min="1"
                  disabled={saving}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priority Level
                </label>
                <HeadlessSelect
                  options={PRIORITY_LEVEL_OPTIONS.map(opt => ({
                    value: opt.value,
                    label: opt.label
                  }))}
                  value={extendedFormData.priorityLevel}
                  onChange={(value) => handleExtendedFieldChange("priorityLevel", value as string)}
                  disabled={saving}
                />
              </div>
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Backup Route
                    </label>
                    <HeadlessSelect
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

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Retry Attempts Before Failover
                    </label>
                    <Input
                      type="number"
                      placeholder="3"
                      value={String(formData.retry_attempts || 3)}
                      onChange={(value) =>
                        setFormData((prev) => ({
                          ...prev,
                          retry_attempts: value ? Number(value) : 3,
                        }))
                      }
                      variant="medium"
                      disabled={saving}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-between pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={() => navigate("/dashboard/push-notification-routes")}
            disabled={saving}
            className="px-6 py-2 text-sm font-medium border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-60"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-2 text-sm font-medium text-white rounded-md transition-colors disabled:opacity-60"
            style={{ backgroundColor: color.primary.action }}
          >
            <Save className="w-4 h-4" />
            {saving ? "Saving..." : "Save Route"}
          </button>
        </div>
      </form>
    </div>
  );
}
