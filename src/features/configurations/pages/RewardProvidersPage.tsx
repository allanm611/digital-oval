import { useState, useEffect } from "react";
import { Edit, Eye, Trash2 } from "lucide-react";
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
  rewardProviderService,
  RewardProvider,
} from "../services/rewardProviderService";
import { rewardTypeService } from "../../offers/services/rewardTypeService";
import { useDeleteConfirm } from "../../../shared/hooks/useDeleteConfirm";
import {
  Table,
  useTable,
  type TableColumn,
} from "../../../shared/components/Table";

type StatusFilter = "" | "active" | "inactive";

export default function RewardProvidersPage() {
  const navigate = useNavigate();
  const { success: showSuccess, error: showError } = useToast();
  const [providers, setProviders] = useState<RewardProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [rewardTypeFilter, setRewardTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("");
  const [rewardTypeOptions, setRewardTypeOptions] = useState<
    { value: string; label: string }[]
  >([]);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [providerToDelete, setProviderToDelete] =
    useState<RewardProvider | null>(null);

  const {
    deleteConfirm,
    isDeleting,
    openDeleteConfirm,
    closeDeleteConfirm,
    handleDelete: confirmDeleteProvider,
  } = useDeleteConfirm({
    onDelete: async (id) => {
      if (!providerToDelete) return;
      await rewardProviderService.delete(Number(id));
      setProviders((prev) => prev.filter((p) => p.id !== Number(id)));
      showSuccess(`"${providerToDelete.name}" has been deleted successfully.`);
    },
    itemLabel: "Reward Provider",
  });

  useEffect(() => {
    loadRewardTypes();
    loadProviders();
  }, []);

  useEffect(() => {
    loadProviders();
  }, [rewardTypeFilter]);

  const loadRewardTypes = async () => {
    try {
      const response = await rewardTypeService.getAllRewardTypes();
      setRewardTypeOptions(
        (response.data || [])
          .filter((rt) => rt.is_active !== false)
          .map((rt) => ({
            value: rt.reward_key,
            label: rt.name || rt.reward_key,
          })),
      );
    } catch {
      setRewardTypeOptions([]);
    }
  };

  const loadProviders = async () => {
    try {
      setLoading(true);
      const data = await rewardProviderService.getAll({
        reward_type: rewardTypeFilter || undefined,
        include_inactive: true,
      });
      setProviders(data);
    } catch (err) {
      showError(
        extractBackendError(
          err,
          "Failed to load reward providers. Please try again.",
        ),
      );
      setProviders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (provider: RewardProvider) => {
    setProviderToDelete(provider);
    openDeleteConfirm(provider.id, provider.name);
  };

  const handleToggleActive = async (provider: RewardProvider) => {
    const newActive = !(provider.is_active !== false);
    setTogglingId(provider.id);
    setProviders((prev) =>
      prev.map((p) =>
        p.id === provider.id ? { ...p, is_active: newActive } : p,
      ),
    );

    try {
      await rewardProviderService.update(provider.id, {
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
          p.id === provider.id ? { ...p, is_active: !newActive } : p,
        ),
      );
      showError(
        extractBackendError(
          err,
          "Failed to update provider status. Please try again.",
        ),
      );
    } finally {
      setTogglingId(null);
    }
  };

  const filteredProviders = providers.filter((provider) => {
    if (statusFilter === "active" && provider.is_active === false) {
      return false;
    }
    if (statusFilter === "inactive" && provider.is_active !== false) {
      return false;
    }
    const term = searchTerm.toLowerCase();
    return (
      !term ||
      provider.name.toLowerCase().includes(term) ||
      provider.reward_type.toLowerCase().includes(term) ||
      provider.api_path.toLowerCase().includes(term) ||
      (provider.description || "").toLowerCase().includes(term)
    );
  });

  const defaultColumns: TableColumn<RewardProvider>[] = [
    { id: "name", label: "Name", visible: true },
    {
      id: "reward_type",
      label: "Reward Type",
      visible: true,
      render: (value) => (
        <span className="font-mono text-sm">{String(value)}</span>
      ),
    },
    {
      id: "api_path",
      label: "API Path",
      visible: true,
      render: (value, row) => (
        <span className="text-sm">
          <span className="font-mono">{row.http_method}</span> {String(value)}
        </span>
      ),
    },
    {
      id: "auth_schema",
      label: "Schemas",
      visible: true,
      sortable: false,
      render: (_value, row) =>
        `${row.auth_schema?.fields?.length ?? 0} auth / ${row.payload_schema?.fields?.length ?? 0} payload fields`,
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
              navigate(`/dashboard/reward-providers/${provider.id}/details`)
            }
            className={`p-0 icon-edit ${tw.rounded} transition-all duration-200`}
            title="View details"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() =>
              navigate(`/dashboard/reward-providers/${provider.id}/edit`)
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
    tableId: "reward-providers-table",
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
  }, [searchTerm, rewardTypeFilter, statusFilter, tableHandlePageChange]);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-4">
          <BackButton showBreadcrumb={true} currentLabel="Reward Providers" />
          <FeatureActionButton
            featureId="reward-providers"
            action="create"
            onClick={() => navigate("/dashboard/reward-providers/create")}
          />
        </div>
        <p className={`text-sm ${tw.textSecondary}`}>
          Define reward fulfilment provider templates.
        </p>
      </div>

      <div className="my-5 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-2">
          <SearchInput
            placeholder="Search by name, reward type, API path..."
            value={searchTerm}
            onChange={setSearchTerm}
          />
        </div>
        <HeadlessSelect
          label=""
          value={rewardTypeFilter}
          onChange={setRewardTypeFilter}
          options={[
            { value: "", label: "All reward types" },
            ...rewardTypeOptions,
          ]}
          placeholder="Filter by reward type"
        />
        <HeadlessSelect
          label=""
          value={statusFilter}
          onChange={(v) => setStatusFilter(v as StatusFilter)}
          options={[
            { value: "", label: "All statuses" },
            { value: "active", label: "Active only" },
            { value: "inactive", label: "Inactive only" },
          ]}
          placeholder="Filter by status"
        />
      </div>

      <div className={`${tw.rounded} overflow-hidden`}>
        {filteredProviders.length === 0 && !loading ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 text-gray-400 mx-auto mb-4">🎁</div>
            <h3 className={`text-lg font-medium ${tw.textPrimary} mb-2`}>
              {searchTerm || rewardTypeFilter || statusFilter
                ? "No providers found"
                : "No reward providers yet"}
            </h3>
            <p className={`${tw.textMuted} mb-6`}>
              {searchTerm || rewardTypeFilter || statusFilter
                ? "Try adjusting your search or filter"
                : "Create a reward provider template before adding configurations"}
            </p>
            {!searchTerm && !rewardTypeFilter && !statusFilter && (
              <FeatureActionButton
                featureId="reward-providers"
                action="create"
                onClick={() => navigate("/dashboard/reward-providers/create")}
                className="mx-auto"
              />
            )}
          </div>
        ) : (
          <>
            <Table<RewardProvider>
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
        title="Delete Reward Provider"
        description="This action cannot be undone. Configurations and fulfilment flows that reference this provider will be affected."
        itemName={deleteConfirm.itemName || ""}
        isLoading={isDeleting}
      />
    </div>
  );
}
