import { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
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
import { gatewayConfigurationService } from "../../configurations/services/gatewayConfigurationService";
import {
  communicationChannelService,
  toCommunicationChannelOptions,
  type CommunicationChannel,
} from "../../../shared/services/communicationChannelService";
import { useLanguage } from "../../../contexts/LanguageContext";
import { GatewayConfiguration } from "../../configurations/types/gatewayConfiguration";
import type { RouteChannelType, SMSRoute } from "../types/smsRoute";
import { filterRoutesForOfferChannel } from "../utils/routeSelect";

interface FormData {
  channel: RouteChannelType;
  channel_id?: number;
  name: string;
  description: string;
  configuration_id: number;
  is_active: boolean;
  backup_route_id?: number;
  use_backup_on_failure: boolean;
  retry_attempts: number;
}

function parsePositiveInt(value: string | null): number | undefined {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

function channelTypeOf(
  channel?: Pick<CommunicationChannel, "code" | "name"> | null,
): RouteChannelType {
  return resolveChannelType(channel?.code || channel?.name);
}

export default function CreateRoutePage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const channelIdFromUrl = parsePositiveInt(searchParams.get("channel_id"));
  const channelTypeFromUrl = (searchParams.get("channel") ||
    "") as RouteChannelType;
  const isEditMode = !!id;
  const navigate = useNavigate();
  const { success, error: showError } = useToast();
  const { t } = useLanguage();
  const { registerFieldRef } = useFormValidation();

  const [formData, setFormData] = useState<FormData>({
    channel: channelTypeFromUrl || "",
    channel_id: channelIdFromUrl,
    name: "",
    description: "",
    configuration_id: 0,
    is_active: true,
    backup_route_id: undefined,
    use_backup_on_failure: false,
    retry_attempts: 3,
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [channels, setChannels] = useState<CommunicationChannel[]>([]);
  const [gatewayConfigs, setGatewayConfigs] = useState<GatewayConfiguration[]>(
    [],
  );
  const [backupRoutes, setBackupRoutes] = useState<SMSRoute[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const channelOptions = useMemo(
    () =>
      toCommunicationChannelOptions(channels, {
        includeIds: [formData.channel_id],
      }),
    [channels, formData.channel_id],
  );

  useEffect(() => {
    loadInitialData();
  }, [id]);

  useEffect(() => {
    if (formData.channel_id) {
      loadGatewayConfigs();
      loadBackupRoutes();
    } else {
      setGatewayConfigs([]);
      setBackupRoutes([]);
    }
  }, [formData.channel_id, channels]);

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
      const channelId =
        route.communication_channel_id ?? channelIdFromUrl ?? undefined;

      setFormData({
        channel:
          route.channel_type ||
          resolveChannelType(route.channel_code) ||
          channelTypeFromUrl ||
          "",
        channel_id: channelId,
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
      const list = Array.isArray(allChannels) ? allChannels : [];
      setChannels(list);

      setFormData((prev) => {
        if (prev.channel_id) {
          const selected = list.find((channel) => channel.id === prev.channel_id);
          return {
            ...prev,
            channel: channelTypeOf(selected) || prev.channel,
          };
        }

        if (!channelTypeFromUrl) return prev;

        const matches = list.filter(
          (channel) =>
            channel.is_active &&
            channelTypeOf(channel) === channelTypeFromUrl,
        );
        if (matches.length !== 1) {
          return { ...prev, channel: channelTypeFromUrl };
        }

        return {
          ...prev,
          channel_id: matches[0].id,
          channel: channelTypeFromUrl,
        };
      });
    } catch (error) {
      console.error("Failed to load channels:", error);
      setChannels([]);
      showError(
        t.common.error,
        extractBackendError(
          error,
          "Failed to load communication channels. Please try again.",
        ),
      );
    }
  };

  const loadGatewayConfigs = async () => {
    if (!formData.channel_id) {
      setGatewayConfigs([]);
      return;
    }
    try {
      const data = await gatewayConfigurationService.getAll({
        channel_id: formData.channel_id,
      });
      setGatewayConfigs(data.filter((config) => config.is_active !== false));
    } catch (error) {
      console.error("Failed to load gateway configs:", error);
      setGatewayConfigs([]);
    }
  };

  const loadBackupRoutes = async () => {
    if (!formData.channel_id) {
      setBackupRoutes([]);
      return;
    }
    try {
      const routes = await routeService.getAllRoutesEnriched();
      const selected = channels.find(
        (channel) => channel.id === formData.channel_id,
      );
      const options = filterRoutesForOfferChannel(routes, {
        channelType: channelTypeOf(selected) || formData.channel,
        channel: selected,
        allChannels: channels,
      }).filter((route) => !(isEditMode && id && route.id === Number(id)));
      setBackupRoutes(options);
    } catch (error) {
      console.error("Failed to load backup routes:", error);
      setBackupRoutes([]);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.channel_id) {
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

      const selectedConfig = gatewayConfigs.find(
        (config) => config.id === formData.configuration_id,
      );
      const matchedChannel =
        channels.find((channel) => channel.id === formData.channel_id) ||
        channels.find((channel) => channel.id === selectedConfig?.channel_id);

      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        configuration_id: formData.configuration_id,
        communication_channel_id:
          formData.channel_id ??
          matchedChannel?.id ??
          selectedConfig?.channel_id ??
          null,
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
                  value={
                    formData.channel_id != null ? String(formData.channel_id) : ""
                  }
                  onChange={(value) => {
                    if (!value) return;
                    const nextChannelId = Number(value);
                    const nextChannel = channels.find(
                      (channel) => channel.id === nextChannelId,
                    );
                    setFormData({
                      ...formData,
                      channel_id: nextChannelId,
                      channel: channelTypeOf(nextChannel),
                      configuration_id: 0,
                      backup_route_id: undefined,
                    });
                    setErrors({});
                  }}
                  options={channelOptions}
                  placeholder={
                    channelOptions.length === 0
                      ? "No communication channels available"
                      : "Select channel..."
                  }
                  disabled={saving || isEditMode || channelOptions.length === 0}
                />
                {channelOptions.length === 0 && (
                  <p className="mt-1 text-xs text-gray-500">
                    Add communication channels under Configurations before
                    creating a route.
                  </p>
                )}
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
                  const configurationId = Number(value);
                  const selectedConfig = gatewayConfigs.find(
                    (config) => config.id === configurationId,
                  );
                  setFormData({
                    ...formData,
                    configuration_id: configurationId,
                    channel_id:
                      selectedConfig?.channel_id ?? formData.channel_id,
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
                disabled={saving || !formData.channel_id}
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
