import { useState, useEffect } from "react";
import { Edit, Trash2, Eye } from "lucide-react";
import { useToast } from "../../../contexts/ToastContext";
import { extractBackendError } from "../../../shared/utils/errorHandler";;;
import { useLanguage } from "../../../contexts/LanguageContext";
import DeleteConfirmModal from "../../../shared/components/ui/DeleteConfirmModal";
import SearchInput from "../../../shared/components/ui/SearchInput";
import BackButton from "../../../shared/components/ui/BackButton";
import CreateButton from "../../../shared/components/ui/CreateButton";
import ActivateDeactivateButton from "../../../shared/components/ui/ActivateDeactivateButton";
import { color, tw } from "../../../shared/utils/utils";
import { emailGatewayConfigService, EMAIL_GATEWAY_DUMMY_DATA } from "../services/emailGatewayConfigService";
import { smsGatewayConfigService, SMS_GATEWAY_DUMMY_DATA } from "../services/smsGatewayConfigService";
import { whatsappGatewayConfigService, WHATSAPP_GATEWAY_DUMMY_DATA } from "../services/whatsappGatewayConfigService";
import { pushGatewayConfigService, PUSH_GATEWAY_DUMMY_DATA } from "../services/pushGatewayConfigService";
import { ussdGatewayConfigService, USSD_GATEWAY_DUMMY_DATA } from "../services/ussdGatewayConfigService";
import { EmailGatewayConfig } from "../types/emailGatewayConfig";
import { SMSGatewayConfig } from "../types/smsGatewayConfig";
import { WhatsAppGatewayConfig } from "../types/whatsappGatewayConfig";
import { PushGatewayConfig } from "../types/pushGatewayConfig";
import { USSDGatewayConfig } from "../types/ussdGatewayConfig";
import { useNavigate } from "react-router-dom";

type ChannelType = "EMAIL" | "SMS" | "WHATSAPP" | "PUSH" | "USSD";

interface UnifiedGatewayConfig {
  id: number;
  name: string;
  description?: string;
  channel_type: ChannelType;
  provider_type: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  originalConfig:
    | EmailGatewayConfig
    | SMSGatewayConfig
    | WhatsAppGatewayConfig
    | PushGatewayConfig
    | USSDGatewayConfig;
}

const CHANNEL_LABEL: Record<ChannelType, string> = {
  EMAIL: "Email",
  SMS: "SMS",
  WHATSAPP: "WhatsApp",
  PUSH: "Push Notifications",
  USSD: "USSD",
};

const buildInitialConfigs = (): UnifiedGatewayConfig[] => {
  const unifiedConfigs: UnifiedGatewayConfig[] = [];

  EMAIL_GATEWAY_DUMMY_DATA.forEach((config) => {
    unifiedConfigs.push({
      id: config.id,
      name: config.name,
      description: config.description,
      channel_type: "EMAIL",
      provider_type: config.provider_type,
      is_active: config.is_active,
      created_at: config.created_at,
      updated_at: config.updated_at,
      originalConfig: config,
    });
  });

  SMS_GATEWAY_DUMMY_DATA.forEach((config) => {
    unifiedConfigs.push({
      id: config.id,
      name: config.name,
      description: config.description,
      channel_type: "SMS",
      provider_type: config.provider_type,
      is_active: config.is_active,
      created_at: config.created_at,
      updated_at: config.updated_at,
      originalConfig: config,
    });
  });

  WHATSAPP_GATEWAY_DUMMY_DATA.forEach((config) => {
    unifiedConfigs.push({
      id: config.id,
      name: config.name,
      description: config.description,
      channel_type: "WHATSAPP",
      provider_type: config.provider_type,
      is_active: config.is_active,
      created_at: config.created_at,
      updated_at: config.updated_at,
      originalConfig: config,
    });
  });

  PUSH_GATEWAY_DUMMY_DATA.forEach((config) => {
    unifiedConfigs.push({
      id: config.id,
      name: config.name,
      description: config.description,
      channel_type: "PUSH",
      provider_type: config.provider_type,
      is_active: config.is_active,
      created_at: config.created_at,
      updated_at: config.updated_at,
      originalConfig: config,
    });
  });

  USSD_GATEWAY_DUMMY_DATA.forEach((config) => {
    unifiedConfigs.push({
      id: config.id,
      name: config.name,
      description: config.description,
      channel_type: "USSD",
      provider_type: config.provider_type,
      is_active: config.is_active,
      created_at: config.created_at,
      updated_at: config.updated_at,
      originalConfig: config,
    });
  });

  return unifiedConfigs;
};

export default function GatewayConfigurationsPage() {
  const navigate = useNavigate();
  const { success: showSuccess, error: showError } = useToast();
  const { t } = useLanguage();
  const [configs, setConfigs] = useState<UnifiedGatewayConfig[]>(buildInitialConfigs);
  const [searchTerm, setSearchTerm] = useState("");
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [configToDelete, setConfigToDelete] = useState<UnifiedGatewayConfig | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadAllConfigs();
  }, []);

  const loadAllConfigs = async () => {
    try {
      const [emailConfigs, smsConfigs, whatsappConfigs, pushConfigs, ussdConfigs] = await Promise.all([
        emailGatewayConfigService.getAllConfigs(),
        smsGatewayConfigService.getAllConfigs(),
        whatsappGatewayConfigService.getAllConfigs(),
        pushGatewayConfigService.getAllConfigs(),
        ussdGatewayConfigService.getAllConfigs(),
      ]);

      const unifiedConfigs: UnifiedGatewayConfig[] = [];

      emailConfigs.forEach((config) => {
        unifiedConfigs.push({
          id: config.id,
          name: config.name,
          description: config.description,
          channel_type: "EMAIL",
          provider_type: config.provider_type,
          is_active: config.is_active,
          created_at: config.created_at,
          updated_at: config.updated_at,
          originalConfig: config,
        });
      });

      smsConfigs.forEach((config) => {
        unifiedConfigs.push({
          id: config.id,
          name: config.name,
          description: config.description,
          channel_type: "SMS",
          provider_type: config.provider_type,
          is_active: config.is_active,
          created_at: config.created_at,
          updated_at: config.updated_at,
          originalConfig: config,
        });
      });

      whatsappConfigs.forEach((config) => {
        unifiedConfigs.push({
          id: config.id,
          name: config.name,
          description: config.description,
          channel_type: "WHATSAPP",
          provider_type: config.provider_type,
          is_active: config.is_active,
          created_at: config.created_at,
          updated_at: config.updated_at,
          originalConfig: config,
        });
      });

      pushConfigs.forEach((config) => {
        unifiedConfigs.push({
          id: config.id,
          name: config.name,
          description: config.description,
          channel_type: "PUSH",
          provider_type: config.provider_type,
          is_active: config.is_active,
          created_at: config.created_at,
          updated_at: config.updated_at,
          originalConfig: config,
        });
      });

      ussdConfigs.forEach((config) => {
        unifiedConfigs.push({
          id: config.id,
          name: config.name,
          description: config.description,
          channel_type: "USSD",
          provider_type: config.provider_type,
          is_active: config.is_active,
          created_at: config.created_at,
          updated_at: config.updated_at,
          originalConfig: config,
        });
      });

      setConfigs(unifiedConfigs);
    } catch (err) {
      showError(extractBackendError(error, "Failed to load gateway configurations. Please try again."));
    }
  };

  const handleDeleteClick = (config: UnifiedGatewayConfig) => {
    setConfigToDelete(config);
    setShowDeleteModal(true);
  };

  const confirmDeleteConfig = async () => {
    if (!configToDelete) return;

    setDeleting(true);
    try {
      const { channel_type, id } = configToDelete;

      if (channel_type === "EMAIL") {
        await emailGatewayConfigService.deleteConfig(id);
      } else if (channel_type === "SMS") {
        await smsGatewayConfigService.deleteConfig(id);
      } else if (channel_type === "WHATSAPP") {
        await whatsappGatewayConfigService.deleteConfig(id);
      } else if (channel_type === "PUSH") {
        await pushGatewayConfigService.deleteConfig(id);
      } else if (channel_type === "USSD") {
        await ussdGatewayConfigService.deleteConfig(id);
      }

      setConfigs((prev) => prev.filter((c) => !(c.id === id && c.channel_type === channel_type)));
      showSuccess(`"${configToDelete.name}" has been deleted successfully.`);
      setShowDeleteModal(false);
      setConfigToDelete(null);
    } catch (err) {
      showError(extractBackendError(error, "Failed to delete gateway configuration. Please try again."));
    } finally {
      setDeleting(false);
    }
  };

  const handleToggleActive = (config: UnifiedGatewayConfig) => {
    const newActive = !config.is_active;
    setTogglingId(config.id);
    setConfigs((prev) =>
      prev.map((c) =>
        c.id === config.id && c.channel_type === config.channel_type
          ? { ...c, is_active: newActive }
          : c
      )
    );
    setTimeout(() => setTogglingId(null), 300);
    showSuccess(
      newActive ? "Activated" : "Deactivated",
      newActive
        ? `${config.name} has been activated`
        : `${config.name} has been deactivated`
    );
  };

  const filteredConfigs = configs.filter(
    (config) =>
      config.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (config.description && config.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <BackButton
            fallbackTo="/dashboard"
            showBreadcrumb={true}
            parentLabel="Administration"
            currentLabel="Gateway Configurations"
          />
          <CreateButton
            onClick={() => navigate("/dashboard/gateway-configurations/create")}
          />
        </div>
        <p className={`text-sm ${tw.textSecondary}`}>
          Manage communication channel gateways (Email, SMS, WhatsApp, Push, USSD) and configure provider credentials for message delivery.
        </p>
      </div>

      {/* Search */}
      <div className="my-5">
        <SearchInput
          placeholder="Search configurations..."
          value={searchTerm}
          onChange={setSearchTerm}
        />
      </div>

      {/* Table */}
      <div
          className={`${tw.rounded} border overflow-hidden`}
          style={{ borderColor: color.border.default }}
        >
          {filteredConfigs.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 text-gray-400 mx-auto mb-4">⚙️</div>
              <h3 className={`text-lg font-medium ${tw.textPrimary} mb-2`}>
                {searchTerm ? "No configurations found" : "No gateway configurations yet"}
              </h3>
              <p className={`${tw.textMuted} mb-6`}>
                {searchTerm
                  ? "Try adjusting your search"
                  : "Create your first gateway configuration to get started"}
              </p>
              {!searchTerm && (
                <CreateButton
                  onClick={() => navigate("/dashboard/gateway-configurations/create")}
                  className="mx-auto"
                />
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table
                className="w-full min-w-[900px]"
                style={{ borderCollapse: "separate", borderSpacing: "0 8px" }}
              >
                <thead>
                  <tr>
                    <th
                      className="px-6 py-4 text-left text-sm font-medium uppercase tracking-wider"
                      style={{
                        color: color.surface.tableHeaderText,
                        backgroundColor: color.surface.tableHeader,
                        borderTopLeftRadius: "0.375rem",
                      }}
                    >
                      Name
                    </th>
                    <th
                      className="px-6 py-4 text-left text-sm font-medium uppercase tracking-wider"
                      style={{
                        color: color.surface.tableHeaderText,
                        backgroundColor: color.surface.tableHeader,
                      }}
                    >
                      Description
                    </th>
                    <th
                      className="px-6 py-4 text-left text-sm font-medium uppercase tracking-wider"
                      style={{
                        color: color.surface.tableHeaderText,
                        backgroundColor: color.surface.tableHeader,
                      }}
                    >
                      Channel
                    </th>
                    <th
                      className="px-6 py-4 text-left text-sm font-medium uppercase tracking-wider"
                      style={{
                        color: color.surface.tableHeaderText,
                        backgroundColor: color.surface.tableHeader,
                      }}
                    >
                      Provider
                    </th>
                    <th
                      className="px-6 py-4 text-left text-sm font-medium uppercase tracking-wider"
                      style={{
                        color: color.surface.tableHeaderText,
                        backgroundColor: color.surface.tableHeader,
                      }}
                    >
                      Status
                    </th>
                    <th
                      className="px-6 py-4 text-right text-xs font-medium uppercase tracking-wider"
                      style={{
                        color: color.surface.tableHeaderText,
                        backgroundColor: color.surface.tableHeader,
                        borderTopRightRadius: "0.375rem",
                      }}
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredConfigs.map((config) => (
                    <tr
                      key={`${config.channel_type}-${config.id}`}
                      style={{
                        backgroundColor: color.surface.cards,
                        borderRadius: "0.375rem",
                      }}
                    >
                      <td className="px-6 py-4">
                        <p className={`text-sm font-medium ${tw.textPrimary}`}>{config.name}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-sm ${tw.textMuted}`}>
                          {config.description || "-"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-sm ${tw.textSecondary}`}>
                          {CHANNEL_LABEL[config.channel_type]}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-sm ${tw.textSecondary}`}>{config.provider_type}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-sm ${config.is_active ? tw.success : tw.textMuted}`}>
                          {config.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <ActivateDeactivateButton
                            isActive={config.is_active}
                            isLoading={togglingId === config.id}
                            onToggle={() => handleToggleActive(config)}
                          />
                          <button
                            onClick={() => navigate(`/dashboard/gateway-configurations/${config.id}/${config.channel_type}/details`)}
                            className={`p-2 rounded hover:bg-green-50 transition ${tw.link}`}
                            title="View details"
                          >
                            <Eye size={18} />
                          </button>
                          <button
                            onClick={() => navigate(`/dashboard/gateway-configurations/${config.id}/edit`)}
                            className={`p-2 rounded hover:bg-blue-50 transition ${tw.link}`}
                            title="Edit configuration"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(config)}
                            className="p-2 rounded hover:bg-red-50 transition text-red-600"
                            title="Delete configuration"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setConfigToDelete(null);
        }}
        onConfirm={confirmDeleteConfig}
        title="Delete Gateway Configuration"
        description="This may affect message delivery."
        itemName={configToDelete?.name || ""}
        isLoading={deleting}
      />
      </div>
    </div>
  );
}
