import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import BackButton from "../../../shared/components/ui/BackButton";
import Input from "../../../shared/components/ui/Input";
import Textarea from "../../../shared/components/ui/Textarea";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import Checkbox from "../../../shared/components/ui/Checkbox";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import FormField from "../../../shared/components/FormField";
import { useFormValidation } from "../../../shared/hooks/useFormValidation";
import { tw, color, button } from "../../../shared/utils/utils";
import { useToast } from "../../../contexts/ToastContext";
import { extractBackendError } from "../../../shared/utils/errorHandler";
import {
  resolveChannelType,
  routeService,
} from "../services/routeService";
import {
  gatewayConfigurationService,
  filterGatewayConfigsByChannelType,
} from "../../configurations/services/gatewayConfigurationService";
import { communicationChannelService } from "../../../shared/services/communicationChannelService";
import { useLanguage } from "../../../contexts/LanguageContext";
import { GatewayConfiguration } from "../../configurations/types/gatewayConfiguration";
import type { RouteChannelType, SMSRoute } from "../types/smsRoute";

type Channel = RouteChannelType;

interface FormData {
  channel: Channel;
  channel_id?: number;
  name: string;
  description: string;
  configuration_id: number;
  is_active: boolean;
  backup_route_id?: number;
  use_backup_on_failure: boolean;
  retry_attempts: number;
}

export default function CreateRoutePage() {
  const { id } = useParams<{ id: string }>();
  const searchParams = new URLSearchParams(window.location.search);
  const channelFromUrl = searchParams.get("channel") as Channel | null;
  const isEditMode = !!id;
  const navigate = useNavigate();
  const { success, error: showError } = useToast();
  const { t } = useLanguage();
  const { registerFieldRef } = useFormValidation();

  const [formData, setFormData] = useState<FormData>({
    channel: channelFromUrl || "",
    channel_id: undefined,
    name: "",
    description: "",
    configuration_id: 0,
    is_active: true,
    backup_route_id: undefined,
    use_backup_on_failure: false,
    retry_attempts: 3,
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [channels, setChannels] = useState<
    Awaited<ReturnType<typeof communicationChannelService.getAll>>
  >([]);
  const [gatewayConfigs, setGatewayConfigs] = useState<GatewayConfiguration[]>(
    [],
  );
  const [backupRoutes, setBackupRoutes] = useState<SMSRoute[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, [id]);

  useEffect(() => {
    if (formData.channel) {
      loadGatewayConfigs();
      loadBackupRoutes();
    } else {
      setGatewayConfigs([]);
      setBackupRoutes([]);
    }
  }, [formData.channel, channels]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      await loadChannels();
      if (isEditMode && id) {
        await loadRouteData();
      }
    } finally {
      setLoading(false);
    }
  };

  const loadRouteData = async () => {
    if (!id) return;
    try {
      const route = await routeService.getRouteByIdEnriched(Number(id));
      const channel =
        (channelFromUrl as Channel) ||
        route.channel_type ||
        resolveChannelType(route.channel_code) ||
        "";

      setFormData({
        channel,
        channel_id: route.communication_channel_id ?? undefined,
        name: route.name,
        description: route.description || "",
        configuration_id: route.configuration_id || route.gateway_config_id || 0,
        is_active: route.is_active !== false,
        backup_route_id: route.backup_route_id || undefined,
        use_backup_on_failure: route.use_backup_on_failure || false,
        retry_attempts: route.retry_attempts ?? 3,
      });
    } catch {
      showError(t.common.error, "Failed to load route data");
    }
  };

  const loadChannels = async () => {
    try {
      const allChannels = await communicationChannelService.getAll();
      setChannels(allChannels || []);
    } catch (error) {
      console.error("Failed to load channels:", error);
      setChannels([]);
    }
  };

  const loadGatewayConfigs = async () => {
    if (!formData.channel) {
      setGatewayConfigs([]);
      return;
    }
    try {
      const matchedChannel = channels.find(
        (ch) => resolveChannelType(ch.code || ch.name) === formData.channel,
      );
      const data = await gatewayConfigurationService.getAll(
        matchedChannel ? { channel_id: matchedChannel.id } : undefined,
      );
      const filtered = matchedChannel
        ? data.filter((c) => c.is_active !== false)
        : filterGatewayConfigsByChannelType(data, formData.channel).filter(
            (c) => c.is_active !== false,
          );
      setGatewayConfigs(filtered);

      if (matchedChannel && formData.channel_id !== matchedChannel.id) {
        setFormData((prev) => ({ ...prev, channel_id: matchedChannel.id }));
      }
    } catch (error) {
      console.error("Failed to load gateway configs:", error);
      setGatewayConfigs([]);
    }
  };

  const loadBackupRoutes = async () => {
    if (!formData.channel) {
      setBackupRoutes([]);
      return;
    }
    try {
      const routes = await routeService.getRoutesByChannel(formData.channel);
      // Exclude the route being edited from backup options
      const options = isEditMode && id
        ? routes.filter((r) => r.id !== Number(id))
        : routes;
      setBackupRoutes(options);
    } catch (error) {
      console.error("Failed to load backup routes:", error);
      setBackupRoutes([]);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.channel) {
      newErrors.channel = "Channel is required";
    }
    if (!formData.name.trim()) {
      newErrors.name = "Route name is required";
    }
    if (!formData.configuration_id) {
      newErrors.configuration_id = "Gateway configuration is required";
    }
    if (
      formData.use_backup_on_failure &&
      formData.retry_attempts != null &&
      formData.retry_attempts < 0
    ) {
      newErrors.retry_attempts = "Retry attempts cannot be negative";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setSaving(true);

      const matchedChannel =
        channels.find(
          (ch) => resolveChannelType(ch.code || ch.name) === formData.channel,
        ) || channels.find((ch) => ch.id === formData.channel_id);

      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        configuration_id: formData.configuration_id,
        communication_channel_id:
          matchedChannel?.id ?? formData.channel_id ?? null,
        is_active: formData.is_active,
        use_backup_on_failure: formData.use_backup_on_failure,
        backup_route_id: formData.use_backup_on_failure
          ? formData.backup_route_id || null
          : null,
        retry_attempts: formData.use_backup_on_failure
          ? formData.retry_attempts
          : formData.retry_attempts ?? 3,
      };

      if (isEditMode && id) {
        await routeService.updateRoute(Number(id), payload);
        success(t.common.success, "Route updated successfully");
      } else {
        await routeService.createRoute(payload);
        success(t.common.success, "Route created successfully");
      }
      navigate("/dashboard/routes");
    } catch (error) {
      showError(
        t.common.error,
        extractBackendError(error, "Failed to save route"),
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <BackButton
        showBreadcrumb={true}
        currentLabel={isEditMode ? t.routes.editRoute : t.routes.createRoute}
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div
          className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}
        >
          <h2 className={`text-lg font-semibold ${tw.textPrimary} mb-4`}>
            Basic Information
          </h2>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                error={errors?.channel}
                ref={registerFieldRef("channel")}
              >
                <HeadlessSelect
                  label={t.routes.channel}
                  value={formData.channel}
                  onChange={(value) => {
                    setFormData({
                      ...formData,
                      channel: value as Channel,
                      configuration_id: 0,
                      channel_id: undefined,
                      backup_route_id: undefined,
                    });
                    setErrors({});
                  }}
                  options={[
                    { value: "SMS", label: t.routes.channels.sms },
                    { value: "EMAIL", label: t.routes.channels.email },
                    { value: "PUSH", label: t.routes.channels.push },
                    { value: "WHATSAPP", label: t.routes.channels.whatsapp },
                    { value: "USSD", label: t.routes.channels.ussd },
                  ]}
                  placeholder="Select channel..."
                  disabled={saving || isEditMode}
                />
              </FormField>

              <FormField error={errors?.name} ref={registerFieldRef("name")}>
                <Input
                  label={`${t.routes.routeName} *`}
                  value={formData.name}
                  onChange={(value) => {
                    setFormData({ ...formData, name: String(value) });
                    if (errors.name) {
                      const { name: _, ...rest } = errors;
                      setErrors(rest);
                    }
                  }}
                  placeholder="Enter route name"
                  hasError={!!errors.name}
                  disabled={saving}
                />
              </FormField>
            </div>

            <Textarea
              label={t.common.description}
              value={formData.description}
              onChange={(value) =>
                setFormData({ ...formData, description: value })
              }
              placeholder="Add notes about this route..."
              rows={3}
              disabled={saving}
            />

            <FormField
              error={errors?.configuration_id}
              ref={registerFieldRef("configuration_id")}
            >
              <HeadlessSelect
                label={t.routes.gatewayProvider}
                value={String(formData.configuration_id)}
                onChange={(value) => {
                  setFormData({
                    ...formData,
                    configuration_id: Number(value),
                  });
                  if (errors.configuration_id) {
                    const { configuration_id: _, ...rest } = errors;
                    setErrors(rest);
                  }
                }}
                options={[
                  { value: "0", label: "Select a gateway configuration" },
                  ...gatewayConfigs.map((config) => ({
                    value: String(config.id),
                    label: config.provider_name
                      ? `${config.name} (${config.provider_name})`
                      : config.name,
                  })),
                ]}
                placeholder="Select a gateway configuration"
                disabled={saving || !formData.channel}
              />
            </FormField>
          </div>
        </div>

        {/* Failover Settings — matches original design */}
        <div
          className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}
        >
          <h2 className={`text-lg font-semibold ${tw.textPrimary} mb-4`}>
            Failover Settings
          </h2>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Checkbox
                id="use_backup"
                checked={formData.use_backup_on_failure}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData({
                    ...formData,
                    use_backup_on_failure: e.target.checked,
                    backup_route_id: e.target.checked
                      ? formData.backup_route_id
                      : undefined,
                  })
                }
                disabled={saving}
              />
              <label
                htmlFor="use_backup"
                className="text-sm font-medium text-gray-700 cursor-pointer"
              >
                Use backup route on failure
              </label>
            </div>

            {formData.use_backup_on_failure && (
              <>
                <div>
                  <HeadlessSelect
                    label="Backup Route"
                    value={String(formData.backup_route_id || 0)}
                    onChange={(value) =>
                      setFormData({
                        ...formData,
                        backup_route_id: value ? Number(value) : undefined,
                      })
                    }
                    options={[
                      { value: "0", label: "None" },
                      ...backupRoutes.map((route) => ({
                        value: String(route.id),
                        label: route.name,
                      })),
                    ]}
                    disabled={saving}
                  />
                </div>

                <FormField
                  error={errors?.retry_attempts}
                  ref={registerFieldRef("retry_attempts")}
                >
                  <Input
                    label="Retry Attempts"
                    type="number"
                    value={String(formData.retry_attempts)}
                    onChange={(value) =>
                      setFormData({
                        ...formData,
                        retry_attempts: Number(value),
                      })
                    }
                    placeholder="3"
                    min="0"
                    disabled={saving}
                    hasError={!!errors.retry_attempts}
                  />
                </FormField>
              </>
            )}
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={() => navigate("/dashboard/routes")}
            disabled={saving}
            className={`text-sm font-medium ${tw.rounded} transition-colors`}
            style={{
              backgroundColor: "transparent",
              color: "var(--c-text-primary)",
              border: "1px solid var(--c-text-primary)",
              padding: `${button.bordered.paddingY} ${button.bordered.paddingX}`,
            }}
          >
            {t.common.cancel}
          </button>
          <button
            type="submit"
            disabled={saving}
            className={`text-sm text-white font-medium px-4 py-2 ${tw.rounded} transition-colors flex items-center justify-center gap-2 ${
              saving ? "opacity-50 cursor-not-allowed" : "hover:opacity-90"
            }`}
            style={{ backgroundColor: color.primary.action }}
          >
            {saving && <LoadingSpinner size="sm" />}
            {saving
              ? isEditMode
                ? "Updating..."
                : "Creating..."
              : isEditMode
                ? t.routes.editRoute
                : t.routes.createRoute}
          </button>
        </div>
      </form>
    </div>
  );
}
