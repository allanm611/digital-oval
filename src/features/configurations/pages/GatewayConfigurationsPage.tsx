import { useState, useEffect, useMemo } from "react";
import { Edit, Trash2, Eye } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useToast } from "../../../contexts/ToastContext";
import { extractBackendError } from "../../../shared/utils/errorHandler";
import DeleteConfirmModal from "../../../shared/components/ui/DeleteConfirmModal";
import SearchInput from "../../../shared/components/ui/SearchInput";
import BackButton from "../../../shared/components/ui/BackButton";
import FeatureActionButton from "../../../shared/components/FeatureActionButton";
import ActivateDeactivateButton from "../../../shared/components/ui/ActivateDeactivateButton";
import Pagination, {
  DEFAULT_PAGE_SIZE,
} from "../../../shared/components/ui/Pagination";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import { color, tw } from "../../../shared/utils/utils";
import { gatewayConfigurationService } from "../services/gatewayConfigurationService";
import { GatewayConfiguration } from "../types/gatewayConfiguration";
import { communicationChannelService } from "../../../shared/services/communicationChannelService";
import { useDeleteConfirm } from "../../../shared/hooks/useDeleteConfirm";
import {
  Table,
  useTable,
  type TableColumn,
} from "../../../shared/components/Table";

function channelDisplay(config: GatewayConfiguration): string {
  return (
    config.channel_label ||
    config.channel_value ||
    (config.channel_id != null ? `Channel #${config.channel_id}` : "—")
  );
}

export default function GatewayConfigurationsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const providerFilterFromUrl = searchParams.get("provider_id");
  const { success: showSuccess, error: showError } = useToast();

  const [configs, setConfigs] = useState<GatewayConfiguration[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [channelFilter, setChannelFilter] = useState("");
  const [channelOptions, setChannelOptions] = useState<
    { value: string; label: string }[]
  >([]);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [configToDelete, setConfigToDelete] =
    useState<GatewayConfiguration | null>(null);

  const {
    deleteConfirm,
    isDeleting,
    openDeleteConfirm,
    closeDeleteConfirm,
    handleDelete: confirmDeleteConfig,
  } = useDeleteConfirm({
    onDelete: async (id) => {
      if (!configToDelete) return;
      await gatewayConfigurationService.delete(Number(id));
      setConfigs((prev) => prev.filter((c) => c.id !== Number(id)));
      showSuccess(`"${configToDelete.name}" has been deleted successfully.`);
    },
    itemLabel: "Gateway Configuration",
  });

  useEffect(() => {
    loadChannels();
    loadConfigs();
  }, [providerFilterFromUrl]);

  const loadChannels = async () => {
    try {
      const data = await communicationChannelService.getAll();
      setChannelOptions(
        (data || [])
          .filter((ch) => ch.is_active !== false)
          .map((ch) => ({
            value: String(ch.id),
            label: ch.name || ch.code,
          })),
      );
    } catch {
      setChannelOptions([]);
    }
  };

  const loadConfigs = async () => {
    try {
      setLoading(true);
      const params: { provider_id?: number; channel_id?: number } = {};
      if (providerFilterFromUrl) {
        params.provider_id = Number(providerFilterFromUrl);
      }
      const data = await gatewayConfigurationService.getAll(params);
      setConfigs(data);
    } catch (err) {
      showError(
        extractBackendError(
          err,
          "Failed to load gateway configurations. Please try again.",
        ),
      );
      setConfigs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (config: GatewayConfiguration) => {
    setConfigToDelete(config);
    openDeleteConfirm(config.id, config.name);
  };

  const handleToggleActive = async (config: GatewayConfiguration) => {
    const newActive = !(config.is_active !== false);
    setTogglingId(config.id);
    setConfigs((prev) =>
      prev.map((c) =>
        c.id === config.id ? { ...c, is_active: newActive } : c,
      ),
    );

    try {
      await gatewayConfigurationService.update(config.id, {
        is_active: newActive,
      });
      showSuccess(
        newActive ? "Activated" : "Deactivated",
        newActive
          ? `${config.name} has been activated`
          : `${config.name} has been deactivated`,
      );
    } catch (err) {
      setConfigs((prev) =>
        prev.map((c) =>
          c.id === config.id ? { ...c, is_active: !newActive } : c,
        ),
      );
      showError(
        extractBackendError(
          err,
          "Failed to update configuration status. Please try again.",
        ),
      );
    } finally {
      setTogglingId(null);
    }
  };

  const filteredConfigs = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    return configs.filter((config) => {
      if (channelFilter && String(config.channel_id) !== channelFilter) {
        return false;
      }
      if (!term) return true;
      const haystack = [
        config.name,
        config.provider_name,
        channelDisplay(config),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(term);
    });
  }, [configs, searchTerm, channelFilter]);

  const defaultColumns: TableColumn<GatewayConfiguration>[] = [
    {
      id: "name",
      label: "Name",
      visible: true,
    },
    {
      id: "channel_label",
      label: "Channel",
      visible: true,
      render: (_value, config) => channelDisplay(config),
    },
    {
      id: "provider_name",
      label: "Provider",
      visible: true,
      render: (value, config) =>
        (value as string) ||
        (config.provider_id != null ? `#${config.provider_id}` : "—"),
    },
    {
      id: "is_active",
      label: "Status",
      visible: true,
      render: (value) => (
        <span className={`text-sm ${value !== false ? tw.success : tw.textMuted}`}>
          {value !== false ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      id: "actions",
      label: "Actions",
      visible: true,
      sortable: false,
      isActionColumn: true,
      render: (_value, config) => (
        <div className="flex items-center justify-center gap-2">
          <ActivateDeactivateButton
            isActive={config.is_active !== false}
            isLoading={togglingId === config.id}
            onToggle={() => handleToggleActive(config)}
          />
          <button
            onClick={() =>
              navigate(
                `/dashboard/gateway-configurations/${config.id}/details`,
              )
            }
            className={`p-0 icon-edit ${tw.rounded} transition-all duration-200`}
            title="View details"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() =>
              navigate(`/dashboard/gateway-configurations/${config.id}/edit`)
            }
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

  const paginatedConfigs = filteredConfigs.slice(
    (tableCurrentPage - 1) * tablePageSize,
    tableCurrentPage * tablePageSize,
  );

  useEffect(() => {
    tableHandlePageChange(1);
  }, [searchTerm, channelFilter, tableHandlePageChange]);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-4">
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
          Manage gateway credentials for message delivery. Configurations are
          linked to gateway providers and inherit their credential fields.
        </p>
        {providerFilterFromUrl && (
          <p className={`text-xs ${tw.textMuted}`}>
            Filtered by provider ID {providerFilterFromUrl}.{" "}
            <button
              type="button"
              className="underline"
              onClick={() => navigate("/dashboard/gateway-configurations")}
            >
              Clear filter
            </button>
          </p>
        )}
      </div>

      <div className="my-5 flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <SearchInput
            placeholder="Search by name, provider, or channel..."
            value={searchTerm}
            onChange={setSearchTerm}
          />
        </div>
        <div className="sm:w-56">
          <HeadlessSelect
            value={channelFilter}
            onChange={setChannelFilter}
            options={[
              { value: "", label: "All Channels" },
              ...channelOptions,
            ]}
            placeholder="Filter by channel"
          />
        </div>
      </div>

      <div className={`${tw.rounded} overflow-hidden`}>
        {!loading && filteredConfigs.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 text-gray-400 mx-auto mb-4">⚙️</div>
            <h3 className={`text-lg font-medium ${tw.textPrimary} mb-2`}>
              {searchTerm || channelFilter
                ? "No configurations found"
                : "No gateway configurations yet"}
            </h3>
            <p className={`${tw.textMuted} mb-6`}>
              {searchTerm || channelFilter
                ? "Try adjusting your search or filters"
                : "Create a gateway provider first, then add a configuration with its credentials."}
            </p>
            {!searchTerm && !channelFilter && (
              <FeatureActionButton
                featureId="gateway-configurations"
                action="create"
                onClick={() =>
                  navigate("/dashboard/gateway-configurations/create")
                }
                className="mx-auto"
              />
            )}
          </div>
        ) : (
          <>
            <Table<GatewayConfiguration>
              columns={columns}
              data={paginatedConfigs}
              totalItems={filteredConfigs.length}
              currentPage={tableCurrentPage}
              pageSize={tablePageSize}
              isLoading={loading}
              onPageChange={tableHandlePageChange}
              onPageSizeChange={tableHandlePageSizeChange}
              onSort={handleSort}
              sortConfigs={sortConfigs}
              getRowId={(row) => String(row.id)}
              onHideColumn={toggleColumn}
              style={{
                headerBackground: color.surface.tableHeader,
                headerTextColor: color.surface.tableHeaderText,
                rowBackground: color.surface.tablebodybg,
                rowSpacing: "0 8px",
              }}
            />

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
        description="This may affect routes and message delivery that reference this configuration."
        itemName={deleteConfirm.itemName || ""}
        isLoading={isDeleting}
      />
    </div>
  );
}
