import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
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

export default function EditRoutePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { success, error: showError } = useToast();

  const [formData, setFormData] = useState<FormData>({
    channel: "SMS",
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
  }, [id]);

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
      if (id) {
        await loadRouteData();
      }
    } finally {
      setLoading(false);
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

  const loadRouteData = async () => {
    if (!id) return;
    try {
      // Try to load from each service
      const smsRoutes = await smsRouteService.getAllRoutes();
      const route = smsRoutes.find((r) => r.id === Number(id));
      if (route) {
        setFormData((prev) => ({
          ...prev,
          channel: "SMS",
          name: route.name,
          description: route.description || "",
          gateway_config_id: route.gateway_config_id,
          is_active: route.is_active,
          backup_route_id: route.backup_route_id,
          use_backup_on_failure: route.use_backup_on_failure,
          retry_attempts: route.retry_attempts,
          senderId: route.sender_id || "",
        }));
      }
    } catch (error) {
      console.error("Failed to load route:", error);
      showError("Error", "Failed to load route data");
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
        await smsRouteService.updateRoute(Number(id), baseData);
      } else if (formData.channel === "EMAIL") {
        await emailRouteService.updateRoute(Number(id), baseData);
      } else if (formData.channel === "PUSH") {
        await pushNotificationRouteService.updateRoute(Number(id), {
          ...baseData,
          platforms: formData.platforms || [],
          default_ttl: formData.defaultTTL,
          priority_level: formData.priorityLevel,
          webhook_url: formData.webhookUrl || undefined,
        });
      } else if (formData.channel === "WHATSAPP") {
        await whatsappRouteService.updateRoute(Number(id), {
          ...baseData,
          webhook_url: formData.webhookUrl || undefined,
          template_support: formData.templateSupport === "true",
          quality_threshold: Number(formData.qualityThreshold),
        });
      } else if (formData.channel === "USSD") {
        await ussdRouteService.updateRoute(Number(id), {
          ...baseData,
          ussd_code: formData.ussdCode || undefined,
          network_code: formData.networkCode || undefined,
          session_timeout: Number(formData.sessionTimeout),
          encoding: formData.encoding,
        });
      }

      success("Route updated successfully");
      navigate("/dashboard/routes");
    } catch (error) {
      showError("Error", extractBackendError(error, "Failed to update route"));
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
       
        currentLabel="Edit Route"
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information Section */}
        <div className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}>
          <h2 className={`text-lg font-semibold ${tw.textPrimary} mb-4`}>
            Basic Information
          </h2>
          <div className="space-y-4">
            {/* Channel and Name Row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-medium text-gray-700 mb-2`}>
                  Channel *
                </label>
                <div className="px-3 py-2 border border-gray-300 rounded bg-gray-50 text-sm text-gray-600">
                  {formData.channel}
                </div>
              </div>

              <div>
                <Input
                  label="Route Name"
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
            </div>

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
              <HeadlessSelect
                label="Gateway Configuration"
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
                    <HeadlessSelect
                      label="Backup Route"
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

                  <div>
                    <Input
                      label="Retry Attempts"
                      type="number"
                      value={String(formData.retry_attempts)}
                      onChange={(value) => setFormData({ ...formData, retry_attempts: Number(value) })}
                      placeholder="3"
                      min="0"

                      disabled={saving}
                    />
                  </div>
                </>
              )}
            </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={() => navigate("/dashboard/routes")}
            disabled={saving}
            className={`text-sm font-medium ${tw.rounded} transition-colors`}
            style={{
              backgroundColor: 'transparent',
              color: 'var(--c-text-primary)',
              border: '1px solid var(--c-text-primary)',
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
            {saving ? "Updating..." : "Update"}
          </button>
        </div>
      </form>
    </div>
  );
}
