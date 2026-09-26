import { useState, useEffect } from "react";
import { Edit, Trash2, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
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
import {
  gatewayProviderService,
  GatewayProvider,
} from "../services/gatewayProviderService";
import {
  gatewayProtocolLabel,
  resolveGatewayProtocol,
} from "../constants/gatewayProtocol";
import { useGatewayProtocols } from "../hooks/useGatewayProtocols";
import { communicationChannelService } from "../../../shared/services/communicationChannelService";
import { useDeleteConfirm } from "../../../shared/hooks/useDeleteConfirm";
import {
  Table,
  useTable,
  type TableColumn,
} from "../../../shared/components/Table";

export default function GatewayProvidersPage() {
  const navigate = useNavigate();
  const { success: showSuccess, error: showError } = useToast();
  const [providers, setProviders] = useState<GatewayProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [channelFilter, setChannelFilter] = useState("");
  const [protocolFilter, setProtocolFilter] = useState("");
  const { catalog, getProtocol } = useGatewayProtocols();
  const [channelOptions, setChannelOptions] = useState<
    { value: string; label: string }[]
  >([]);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [providerToDelete, setProviderToDelete] =
    useState<GatewayProvider | null>(null);

  const {
    deleteConfirm,
    isDeleting,
    openDeleteConfirm,
    closeDeleteConfirm,
    handleDelete: confirmDeleteProvider,
  } = useDeleteConfirm({
    onDelete: async (id) => {
      if (!providerToDelete) return;
      await gatewayProviderService.delete(Number(id));
      setProviders((prev) => prev.filter((p) => p.id !== Number(id)));
      showSuccess(`"${providerToDelete.name}" has been deleted successfully.`);
    },
    itemLabel: "Gateway Provider",
  });

  useEffect(() => {
    loadChannels();
  }, []);

  useEffect(() => {
    loadProviders();
  }, [channelFilter]);

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

  const loadProviders = async () => {
    try {
      setLoading(true);
      const data = await gatewayProviderService.getAll(
        channelFilter ? { channel_id: Number(channelFilter) } : undefined,
      );
      setProviders(data);
    } catch (err) {
      showError(
        extractBackendError(
          err,
          "Failed to load gateway providers. Please try again.",
        ),
      );
      setProviders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (provider: GatewayProvider) => {
    setProviderToDelete(provider);
    openDeleteConfirm(provider.id, provider.name);
  };

  const handleToggleActive = async (provider: GatewayProvider) => {
    const newActive = !(provider.is_active !== false);
    setTogglingId(provider.id);
    setProviders((prev) =>
      prev.map((p) =>
        p.id === provider.id ? { ...p, is_active: newActive } : p,
      ),
    );

    try {
      await gatewayProviderService.update(provider.id, {
        is_active: newActive,
      });
      showSuccess(
        newActive ? "Activated" : "Deactivated",
        newActive
          ? `${provider.name} has been activated`
          : `${provider.name} has been deactivated`,
      );
    } catch (err) {
      setProviders((prev) =>
        prev.map((p) =>
          p.id === provider.id
            ? { ...p, is_active: provider.is_active !== false }
            : p,
        ),
      );
      showError(
        extractBackendError(err, "Failed to update provider status"),
      );
    } finally {
      setTogglingId(null);
    }
  };

  const filteredProviders = providers.filter((provider) => {
    const term = searchTerm.toLowerCase();
    const protocol = resolveGatewayProtocol(provider);
    const protocolLabel = getProtocol(protocol)?.label || gatewayProtocolLabel(protocol);
    const matchesSearch =
      !term ||
      provider.name.toLowerCase().includes(term) ||
      (provider.channel_label || "").toLowerCase().includes(term) ||
      (provider.channel_value || "").toLowerCase().includes(term) ||
      protocol.toLowerCase().includes(term) ||
      protocolLabel.toLowerCase().includes(term);
    const matchesProtocol = !protocolFilter || protocol === protocolFilter;
    return matchesSearch && matchesProtocol;
  });

  const defaultColumns: TableColumn<GatewayProvider>[] = [
    {
      id: "name",
      label: "Name",
      visible: true,
    },
    {
      id: "channel_label",
      label: "Channel",
      visible: true,
      render: (_value, row) => row.channel_label || row.channel_value || "—",
    },
    {
      id: "protocol",
      label: "Protocol",
      visible: true,
      render: (_value, row) =>
        gatewayProtocolLabel(resolveGatewayProtocol(row), catalog),
    },
    {
      id: "field_schema",
      label: "Fields",
      visible: true,
      sortable: false,
      render: (_value, row) =>
        `${row.field_schema?.fields?.length ?? 0} field(s)`,
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
      render: (_value, provider) => (
        <div className="flex items-center justify-center gap-2">
          <ActivateDeactivateButton
            isActive={provider.is_active !== false}
            isLoading={togglingId === provider.id}
            onToggle={() => handleToggleActive(provider)}
          />
          <button
            onClick={() =>
              navigate(`/dashboard/gateway-providers/${provider.id}/details`)
            }
            className={`p-0 icon-edit ${tw.rounded} transition-all duration-200`}
            title="View details"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() =>
              navigate(`/dashboard/gateway-providers/${provider.id}/edit`)
            }
            className={`p-0 icon-edit ${tw.rounded} transition-all duration-200`}
            title="Edit provider"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDeleteClick(provider)}
            className={`p-0 icon-delete ${tw.rounded} transition-all duration-200`}
            title="Delete provider"
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
    tableId: "gateway-providers-table",
    defaultColumns,
    defaultPageSize: DEFAULT_PAGE_SIZE,
    persistToLocalStorage: true,
  });

  const paginatedProviders = filteredProviders.slice(
    (tableCurrentPage - 1) * tablePageSize,
    tableCurrentPage * tablePageSize,
  );

  useEffect(() => {
    tableHandlePageChange(1);
  }, [searchTerm, channelFilter, protocolFilter, tableHandlePageChange]);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-4">
          <BackButton
            showBreadcrumb={true}
            currentLabel="Gateway Providers"
          />
          <FeatureActionButton
            featureId="gateway-providers"
            action="create"
            onClick={() => navigate("/dashboard/gateway-providers/create")}
          />
        </div>
        <p className={`text-sm ${tw.textSecondary}`}>
          Define gateway provider templates by channel and protocol.
          Configurations and routes depend on these providers.
        </p>
      </div>

      <div className="my-5 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-2">
          <SearchInput
            placeholder="Search providers by name, channel, or protocol..."
            value={searchTerm}
            onChange={setSearchTerm}
          />
        </div>
        <HeadlessSelect
          label=""
          value={channelFilter}
          onChange={setChannelFilter}
          options={[
            { value: "", label: "All channels" },
            ...channelOptions,
          ]}
          placeholder="Filter by channel"
        />
        <HeadlessSelect
          label=""
          value={protocolFilter}
          onChange={setProtocolFilter}
          options={[
            { value: "", label: "All protocols" },
            ...catalog.map((item) => ({
              value: item.value,
              label: item.label,
            })),
          ]}
          placeholder="Filter by protocol"
        />
      </div>

      <div className={`${tw.rounded} overflow-hidden`}>
        {filteredProviders.length === 0 && !loading ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 text-gray-400 mx-auto mb-4">🔌</div>
            <h3 className={`text-lg font-medium ${tw.textPrimary} mb-2`}>
              {searchTerm || channelFilter || protocolFilter
                ? "No providers found"
                : "No gateway providers yet"}
            </h3>
            <p className={`${tw.textMuted} mb-6`}>
              {searchTerm || channelFilter || protocolFilter
                ? "Try adjusting your search or filters"
                : "Create a provider template before adding gateway configurations"}
            </p>
            {!searchTerm && !channelFilter && !protocolFilter && (
              <FeatureActionButton
                featureId="gateway-providers"
                action="create"
                onClick={() => navigate("/dashboard/gateway-providers/create")}
                className="mx-auto"
              />
            )}
          </div>
        ) : (
          <>
            <Table<GatewayProvider>
              columns={columns}
              data={paginatedProviders}
              totalItems={filteredProviders.length}
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

            {paginatedProviders.length > 0 && filteredProviders.length > 0 && (
              <div className="mt-4">
                <Pagination
                  currentPage={tableCurrentPage}
                  pageSize={tablePageSize}
                  totalItems={filteredProviders.length}
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
        onConfirm={confirmDeleteProvider}
        title="Delete Gateway Provider"
        description="Existing gateway configurations that use this provider may break. Prefer deactivating instead if the provider is in use."
        itemName={deleteConfirm.itemName || ""}
        isLoading={isDeleting}
      />
    </div>
  );
}
