import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Save } from "lucide-react";
import BackButton from "../../../shared/components/ui/BackButton";
import Input from "../../../shared/components/ui/Input";
import Textarea from "../../../shared/components/ui/Textarea";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import Checkbox from "../../../shared/components/ui/Checkbox";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import { tw, color, button } from "../../../shared/utils/utils";
import { useToast } from "../../../contexts/ToastContext";
import { extractBackendError } from "../../../shared/utils/errorHandler";
import { smsRouteService } from "../services/smsRouteService";
import { emailRouteService } from "../services/emailRouteService";
import { pushNotificationRouteService } from "../services/pushNotificationRouteService";
import { whatsappRouteService } from "../services/whatsappRouteService";
import { ussdRouteService } from "../services/ussdRouteService";
import { smsGatewayConfigService } from "../../configurations/services/smsGatewayConfigService";
import { emailGatewayConfigService } from "../../configurations/services/emailGatewayConfigService";
import { pushGatewayConfigService } from "../../configurations/services/pushGatewayConfigService";
import { whatsappGatewayConfigService } from "../../configurations/services/whatsappGatewayConfigService";
import { ussdGatewayConfigService } from "../../configurations/services/ussdGatewayConfigService";
import { communicationChannelService } from "../../../shared/services/communicationChannelService";
import { PUSH_PLATFORM_OPTIONS, PRIORITY_LEVEL_OPTIONS } from "../constants/pushNotificationRouteEnums";

type Channel = "SMS" | "EMAIL" | "PUSH" | "WHATSAPP" | "USSD" | "";

interface FormData {
  channel: Channel;
  channel_id?: number;
  name: string;
  description: string;
  gateway_config_id: number;
  is_active: boolean;
  backup_route_id?: number;
  use_backup_on_failure: boolean;
  retry_attempts: number;
  senderId?: string;
  platforms?: string[];
  defaultTTL?: string;
  priorityLevel?: string;
  webhookUrl?: string;
  templateSupport?: string;
  qualityThreshold?: string;
  ussdCode?: string;
  networkCode?: string;
  sessionTimeout?: string;
  encoding?: string;
}

const STATUS_OPTIONS = [
  { label: "Active", value: "true" },
  { label: "Inactive", value: "false" },
];

const ENCODING_OPTIONS = [
  { value: "UTF-8", label: "UTF-8" },
  { value: "GSM-7", label: "GSM-7" },
  { value: "UCS2", label: "UCS2" },
];

export default function CreateRoutePage() {
  const navigate = useNavigate();
  const { success, error: showError } = useToast();

  const [formData, setFormData] = useState<FormData>({
    channel: "",
    channel_id: undefined,
    name: "",
    description: "",
    gateway_config_id: 0,
    is_active: true,
    backup_route_id: undefined,
    use_backup_on_failure: false,
    retry_attempts: 3,
    senderId: "",
    platforms: [],
    defaultTTL: "3600",
    priorityLevel: "NORMAL",
    webhookUrl: "",
    templateSupport: "false",
    qualityThreshold: "50",
    ussdCode: "",
    networkCode: "",
    sessionTimeout: "60",
    encoding: "UTF-8",
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [channels, setChannels] = useState<any[]>([]);
  const [gatewayConfigs, setGatewayConfigs] = useState<any[]>([]);
  const [backupRoutes, setBackupRoutes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (channels.length > 0) {
      loadGatewayConfigs();
      loadBackupRoutes();
    }
  }, [formData.channel]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      await loadChannels();
    } finally {
      setLoading(false);
    }
  };

  const getChannelType = (code: string): Channel => {
    const codeUpper = code?.toUpperCase() || "";
    if (codeUpper.includes("SMS")) return "SMS";
    if (codeUpper.includes("EMAIL")) return "EMAIL";
    if (codeUpper.includes("PUSH")) return "PUSH";
    if (codeUpper.includes("MESSENGER") || codeUpper.includes("WHATSAPP")) return "WHATSAPP";
    if (codeUpper.includes("USSD")) return "USSD";
    return "";
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
    try {
      let configs;
      if (formData.channel === "SMS") {
        configs = await smsGatewayConfigService.getAllConfigs();
      } else if (formData.channel === "EMAIL") {
        configs = await emailGatewayConfigService.getAllConfigs();
      } else if (formData.channel === "PUSH") {
        configs = await pushGatewayConfigService.getAllConfigs();
      } else if (formData.channel === "WHATSAPP") {
        configs = await whatsappGatewayConfigService.getAllConfigs();
      } else if (formData.channel === "USSD") {
        configs = await ussdGatewayConfigService.getAllConfigs();
      }
      setGatewayConfigs(configs || []);
    } catch (error) {
      console.error("Failed to load gateway configs:", error);
      setGatewayConfigs([]);
    }
  };

  const loadBackupRoutes = async () => {
    try {
      let routes;
      if (formData.channel === "SMS") {
        routes = await smsRouteService.getAllRoutes();
      } else if (formData.channel === "PUSH") {
        routes = await pushNotificationRouteService.getAllRoutes();
      } else if (formData.channel === "WHATSAPP") {
        routes = await whatsappRouteService.getAllRoutes();
      } else if (formData.channel === "USSD") {
        routes = await ussdRouteService.getAllRoutes();
      }
      setBackupRoutes(routes || []);
    } catch (error) {
      console.error("Failed to load backup routes:", error);
      setBackupRoutes([]);
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

    if (!validateForm()) return;

    try {
      setSaving(true);

      const baseData = {
        name: formData.name,
        description: formData.description,
        gateway_config_id: formData.gateway_config_id,
        is_active: formData.is_active,
        backup_route_id: formData.backup_route_id,
        use_backup_on_failure: formData.use_backup_on_failure,
        retry_attempts: formData.retry_attempts,
      };

      if (formData.channel === "SMS") {
        await smsRouteService.createRoute(baseData);
      } else if (formData.channel === "EMAIL") {
        await emailRouteService.createRoute(baseData);
      } else if (formData.channel === "PUSH") {
        await pushNotificationRouteService.createRoute({
          ...baseData,
          platforms: formData.platforms || [],
          default_ttl: formData.defaultTTL,
          priority_level: formData.priorityLevel,
          webhook_url: formData.webhookUrl || undefined,
        });
      } else if (formData.channel === "WHATSAPP") {
        await whatsappRouteService.createRoute({
          ...baseData,
          webhook_url: formData.webhookUrl || undefined,
          template_support: formData.templateSupport === "true",
          quality_threshold: Number(formData.qualityThreshold),
        });
      } else if (formData.channel === "USSD") {
        await ussdRouteService.createRoute({
          ...baseData,
          ussd_code: formData.ussdCode || undefined,
          network_code: formData.networkCode || undefined,
          session_timeout: Number(formData.sessionTimeout),
          encoding: formData.encoding,
        });
      }

      success("Route created successfully");
      navigate("/dashboard/routes");
    } catch (error) {
      showError("Error", extractBackendError(error, "Failed to create route"));
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
      {/* Breadcrumb */}
      <BackButton
       
        showBreadcrumb={true}
       
        currentLabel="Create"
      />

      {/* Form Container */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information Section */}
        <div className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}>
          <h2 className={`text-lg font-semibold ${tw.textPrimary} mb-4`}>
            Basic Information
          </h2>
          <div className="space-y-4">
            {/* Channel and Name Row */}
            <div className="grid grid-cols-2 gap-4">
              {/* Channel Selection */}
              <div>
                <label className={`block text-sm font-medium ${tw.textPrimary} mb-2`}>
                  Channel *
                </label>
                <HeadlessSelect
                  value={String(formData.channel_id || "")}
                  onChange={(value) => {
                    const selectedChannel = channels.find((c) => c.id === Number(value));
                    if (selectedChannel) {
                      const channelType = getChannelType(selectedChannel.code);
                      setFormData({
                        ...formData,
                        channel: channelType,
                        channel_id: selectedChannel.id,
                        gateway_config_id: 0,
                        backup_route_id: undefined,
                      });
                      setErrors({});
                    }
                  }}
                  options={channels.map((channel) => ({
                    id: channel.id,
                    value: String(channel.id),
                    label: channel.name,
                  }))}
                  placeholder="Select channel..."
                  disabled={saving}
                />
              </div>
              {/* Name */}
              <Input
                label="Route Name *"
                value={formData.name}
                onChange={(value) => {
                  setFormData({ ...formData, name: value });
                  if (errors.name) setErrors({ ...errors, name: undefined });
                }}
                placeholder="Enter route name"
                hasError={!!errors.name}
                disabled={saving}
              />
              {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
            </div>

            {/* Description */}
            <Textarea
              label="Description"
              value={formData.description}
              onChange={(value) => setFormData({ ...formData, description: value })}
              placeholder="Add notes about this route..."
              rows={3}
              disabled={saving}
            />

            {/* Gateway Configuration */}
            <div>
              <label className={`block text-sm font-medium text-gray-700 mb-2`}>
                Gateway Configuration *
              </label>
              <HeadlessSelect
                value={String(formData.gateway_config_id)}
                onChange={(value) => {
                  setFormData({ ...formData, gateway_config_id: Number(value) });
                  if (errors.gateway_config_id) setErrors({ ...errors, gateway_config_id: undefined });
                }}
                options={[
                  { value: "0", label: "Select a gateway configuration" },
                  ...gatewayConfigs.map((config) => ({
                    value: String(config.id),
                    label: config.name,
                  })),
                ]}
                placeholder="Select gateway..."
                disabled={saving}
              />
              {errors.gateway_config_id && (
                <p className="text-xs text-red-500 mt-1">{errors.gateway_config_id}</p>
              )}
            </div>
          </div>
        </div>

        {/* Failover Settings Section */}
        <div className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}>
            <h2 className={`text-lg font-semibold ${tw.textPrimary} mb-4`}>
              Failover Settings
            </h2>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="use_backup"
                  checked={formData.use_backup_on_failure}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, use_backup_on_failure: e.target.checked })}
                  disabled={saving}
                />
                <label htmlFor="use_backup" className={`text-sm font-medium text-gray-700 cursor-pointer`}>
                  Use backup route on failure
                </label>
              </div>

              {formData.use_backup_on_failure && (
                <>
                  <div>
                    <label className={`block text-sm font-medium text-gray-700 mb-2`}>
                      Backup Route
                    </label>
                    <HeadlessSelect
                      value={String(formData.backup_route_id || 0)}
                      onChange={(value) => setFormData({ ...formData, backup_route_id: value ? Number(value) : undefined })}
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

                  <Input
                    label="Retry Attempts"
                    type="number"
                    value={String(formData.retry_attempts)}
                    onChange={(value) => setFormData({ ...formData, retry_attempts: Number(value) })}
                    placeholder="3"
                    min="0"
                    disabled={saving}
                  />
                </>
              )}
            </div>
        </div>

        {/* Channel-Specific Configuration */}
        {formData.channel && formData.channel === "PUSH" && (
          <div className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}>
            <h2 className={`text-lg font-semibold ${tw.textPrimary} mb-4`}>
              Push Notification Configuration
            </h2>
            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium text-gray-700 mb-2`}>
                  Platforms
                </label>
                <HeadlessSelect
                  value={formData.platforms?.[0] || ""}
                  onChange={(value) => {
                    const platforms = formData.platforms || [];
                    if (platforms.includes(value)) {
                      setFormData({ ...formData, platforms: platforms.filter((p) => p !== value) });
                    } else {
                      setFormData({ ...formData, platforms: [...platforms, value] });
                    }
                  }}
                  options={PUSH_PLATFORM_OPTIONS}
                  disabled={saving}
                />
              </div>

              <Input
                label="Default TTL"
                value={formData.defaultTTL || "3600"}
                onChange={(value) => setFormData({ ...formData, defaultTTL: value })}
                placeholder="3600"
                disabled={saving}
              />

              <div>
                <label className={`block text-sm font-medium text-gray-700 mb-2`}>
                  Priority Level
                </label>
                <HeadlessSelect
                  value={formData.priorityLevel || "NORMAL"}
                  onChange={(value) => setFormData({ ...formData, priorityLevel: value })}
                  options={PRIORITY_LEVEL_OPTIONS}
                  disabled={saving}
                />
              </div>

              <Input
                label="Webhook URL"
                value={formData.webhookUrl || ""}
                onChange={(value) => setFormData({ ...formData, webhookUrl: value })}
                placeholder="https://example.com/webhook"
                type="url"
                disabled={saving}
              />
            </div>
          </div>
        )}

        {formData.channel && formData.channel === "WHATSAPP" && (
          <div className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}>
            <h2 className={`text-lg font-semibold ${tw.textPrimary} mb-4`}>
              WhatsApp Configuration
            </h2>
            <div className="space-y-4">
              <Input
                label="Webhook URL"
                value={formData.webhookUrl || ""}
                onChange={(value) => setFormData({ ...formData, webhookUrl: value })}
                placeholder="https://example.com/webhook"
                type="url"
                disabled={saving}
              />

              <div>
                <label className={`block text-sm font-medium text-gray-700 mb-2`}>
                  Template Support
                </label>
                <HeadlessSelect
                  value={formData.templateSupport || "false"}
                  onChange={(value) => setFormData({ ...formData, templateSupport: value })}
                  options={[
                    { value: "true", label: "Enabled" },
                    { value: "false", label: "Disabled" },
                  ]}
                  disabled={saving}
                />
              </div>

              <Input
                label="Quality Threshold"
                value={formData.qualityThreshold || "50"}
                onChange={(value) => setFormData({ ...formData, qualityThreshold: value })}
                placeholder="50"
                type="number"
                min="0"
                max="100"
                disabled={saving}
              />
            </div>
          </div>
        )}

        {formData.channel && formData.channel === "USSD" && (
          <div className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}>
            <h2 className={`text-lg font-semibold ${tw.textPrimary} mb-4`}>
              USSD Configuration
            </h2>
            <div className="space-y-4">
              <Input
                label="USSD Code"
                value={formData.ussdCode || ""}
                onChange={(value) => setFormData({ ...formData, ussdCode: value })}
                placeholder="*123#"
                disabled={saving}
              />

              <Input
                label="Network Code"
                value={formData.networkCode || ""}
                onChange={(value) => setFormData({ ...formData, networkCode: value })}
                placeholder="Network code"
                disabled={saving}
              />

              <Input
                label="Session Timeout"
                value={formData.sessionTimeout || "60"}
                onChange={(value) => setFormData({ ...formData, sessionTimeout: value })}
                placeholder="60"
                type="number"
                disabled={saving}
              />

              <div>
                <label className={`block text-sm font-medium text-gray-700 mb-2`}>
                  Encoding
                </label>
                <HeadlessSelect
                  value={formData.encoding || "UTF-8"}
                  onChange={(value) => setFormData({ ...formData, encoding: value })}
                  options={ENCODING_OPTIONS}
                  disabled={saving}
                />
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={() => navigate("/dashboard/routes")}
            disabled={saving}
            className={`text-sm font-medium ${tw.rounded} transition-colors`}
            style={{
              backgroundColor: button.bordered.background,
              color: button.bordered.color,
              border: button.bordered.border,
              padding: `${button.bordered.paddingY} ${button.bordered.paddingX}`,
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className={`text-sm text-white font-medium px-4 py-2 ${tw.rounded} transition-colors flex items-center justify-center gap-2 ${
              saving ? "opacity-50 cursor-not-allowed" : "hover:opacity-90"
            }`}
            style={{ backgroundColor: color.primary.action }}
          >
            {saving && <LoadingSpinner size={16} />}
            {saving ? "Creating..." : "Create"}
          </button>
        </div>
      </form>
    </div>
  );
}
