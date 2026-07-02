import { useState, useEffect } from "react";
import { Edit, Trash2, Eye } from "lucide-react";
import { useToast } from "../../../contexts/ToastContext";
import { extractBackendError } from "../../../shared/utils/errorHandler";;;
import { useLanguage } from "../../../contexts/LanguageContext";
import DeleteConfirmModal from "../../../shared/components/ui/DeleteConfirmModal";
import SearchInput from "../../../shared/components/ui/SearchInput";
import BackButton from "../../../shared/components/ui/BackButton";
import FeatureActionButton from "../../../shared/components/FeatureActionButton";
import ActivateDeactivateButton from "../../../shared/components/ui/ActivateDeactivateButton";
import Pagination, { DEFAULT_PAGE_SIZE } from "../../../shared/components/ui/Pagination";
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
import { useDeleteConfirm } from "../../../shared/hooks/useDeleteConfirm";
import { Table, useTable, type TableColumn } from "../../../shared/components/Table";

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
  const [showColumnPicker, setShowColumnPicker] = useState(false);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [configToDelete, setConfigToDelete] = useState<UnifiedGatewayConfig | null>(null);

  const { deleteConfirm, isDeleting, openDeleteConfirm, closeDeleteConfirm, handleDelete: confirmDeleteConfig } = useDeleteConfirm({
    onDelete: async (id) => {
      if (!configToDelete) return;
      const { channel_type, id: configId } = configToDelete;

      if (channel_type === "EMAIL") {
        await emailGatewayConfigService.deleteConfig(configId);
      } else if (channel_type === "SMS") {
        await smsGatewayConfigService.deleteConfig(configId);
      } else if (channel_type === "WHATSAPP") {
        await whatsappGatewayConfigService.deleteConfig(configId);
      } else if (channel_type === "PUSH") {
        await pushGatewayConfigService.deleteConfig(configId);
      } else if (channel_type === "USSD") {
        await ussdGatewayConfigService.deleteConfig(configId);
      }

      setConfigs((prev) => prev.filter((c) => !(c.id === configId && c.channel_type === channel_type)));
      showSuccess(`"${configToDelete.name}" has been deleted successfully.`);
    },
    itemLabel: "Gateway Configuration",
  });

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
    openDeleteConfirm(config.id, config.name);
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

  // Table columns definition
  const defaultColumns: TableColumn<UnifiedGatewayConfig>[] = [
    {
      id: "name",
      label: "Name",
      visible: true,
    },
    {
      id: "description",
      label: "Description",
      visible: true,
    },
    {
      id: "channel_type",
      label: "Channel",
      visible: true,
    },
    {
      id: "provider_type",
      label: "Provider",
      visible: true,
    },
    {
      id: "is_active",
      label: "Status",
      visible: true,
      render: (value) => (
        <span className={`text-sm ${value ? tw.success : tw.textMuted}`}>
          {value ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      id: "actions",
      label: "Actions",
      visible: true,
      sortable: false,
      isActionColumn: true,
      render: (value, config) => (
        <div className="flex items-center justify-center gap-2">
          <ActivateDeactivateButton
            isActive={config.is_active}
            isLoading={togglingId === config.id}
            onToggle={() => handleToggleActive(config)}
          />
          <button
            onClick={() => navigate(`/dashboard/gateway-configurations/${config.id}/${config.channel_type}/details`)}
            className={`p-0 icon-edit ${tw.rounded} transition-all duration-200`}
            title="View details"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => navigate(`/dashboard/gateway-configurations/${config.id}/edit`)}
            className={`p-0 icon-edit ${tw.rounded} transition-all duration-200`}
            title="Edit configuration"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDeleteClick(config)}
            className={`p-0 icon-delete ${tw.rounded} transition-all duration-200`}
            title="Delete configuration"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  const {
    columns,
    currentPage: tableCurrentPage,
    pageSize: tablePageSize,
    handlePageChange: tableHandlePageChange,
    handlePageSizeChange: tableHandlePageSizeChange,
    sortConfigs,
    handleSort,
    toggleColumn,
  } = useTable({
    tableId: "gateway-configurations-table",
    defaultColumns,
    defaultPageSize: DEFAULT_PAGE_SIZE,
    persistToLocalStorage: true,
  });

  // Handle pagination slicing
  const paginatedConfigs = filteredConfigs.slice(
    (tableCurrentPage - 1) * tablePageSize,
    tableCurrentPage * tablePageSize
  );

  // Reset to page 1 when search changes
  useEffect(() => {
    tableHandlePageChange(1);
  }, [searchTerm, tableHandlePageChange]);

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <BackButton

            showBreadcrumb={true}

            currentLabel="Gateway Configurations"
          />
          <FeatureActionButton
            featureId="gateway-configurations"
            action="create"
            onClick={() => navigate("/dashboard/gateway-configurations/create")}
          />
        </div>
        <p className={`text-sm ${tw.textSecondary}`}>
          Manage communication channel gateways and configure provider credentials for message delivery.
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
      <div className={`${tw.rounded} overflow-hidden`}>
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
              <FeatureActionButton
                featureId="gateway-configurations"
                action="create"
                onClick={() => navigate("/dashboard/gateway-configurations/create")}
                className="mx-auto"
              />
            )}
          </div>
        ) : (
          <>
            {/* Table */}
            <Table<UnifiedGatewayConfig>
              columns={columns}
              data={paginatedConfigs}
              totalItems={filteredConfigs.length}
              currentPage={tableCurrentPage}
              pageSize={tablePageSize}
              isLoading={false}
              onPageChange={tableHandlePageChange}
                onPageSizeChange={tableHandlePageSizeChange}
              onSort={handleSort}
              sortConfigs={sortConfigs}
              getRowId={(row) => `${row.id}-${row.channel_type}`}
              onHideColumn={toggleColumn}
              onManageColumnsClick={() => setShowColumnPicker(true)}
              style={{
                headerBackground: color.surface.tableHeader,
                headerTextColor: color.surface.tableHeaderText,
                rowBackground: color.surface.tablebodybg,
                rowSpacing: "0 8px",
              }}
            />

            {/* Pagination */}
            {paginatedConfigs.length > 0 && filteredConfigs.length > 0 && (
              <div className="mt-4">
                <Pagination
                  currentPage={tableCurrentPage}
                  pageSize={tablePageSize}
                  totalItems={filteredConfigs.length}
                  onPageChange={tableHandlePageChange}
                onPageSizeChange={tableHandlePageSizeChange}
                />
              </div>
            )}
          </>
        )}
      </div>

      <DeleteConfirmModal
        isOpen={deleteConfirm.id !== null}
        onClose={closeDeleteConfirm}
        onConfirm={confirmDeleteConfig}
        title="Delete Gateway Configuration"
        description="This may affect message delivery."
        itemName={deleteConfirm.itemName || ""}
        isLoading={isDeleting}
      />
    </div>
  );
}
