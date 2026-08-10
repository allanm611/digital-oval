import { useState, useEffect, useMemo } from "react";
import { Edit, Eye, Trash2 } from "lucide-react";
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
import { rewardConfigurationService } from "../services/rewardConfigurationService";
import { RewardConfiguration } from "../types/rewardConfiguration";
import { rewardProviderService } from "../services/rewardProviderService";
import { rewardTypeService } from "../../offers/services/rewardTypeService";
import { isDefaultRewardTemplate } from "../utils/rewardTemplateDefaults";
import { useDeleteConfirm } from "../../../shared/hooks/useDeleteConfirm";
import {
  Table,
  useTable,
  type TableColumn,
} from "../../../shared/components/Table";

type StatusFilter = "" | "active" | "inactive";

export default function RewardConfigurationsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const providerFilterFromUrl = searchParams.get("provider_id");
  const { success: showSuccess, error: showError } = useToast();

  const [configs, setConfigs] = useState<RewardConfiguration[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [rewardTypeFilter, setRewardTypeFilter] = useState("");
  const [providerFilter, setProviderFilter] = useState(
    providerFilterFromUrl || "",
  );
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("");
  const [rewardTypeOptions, setRewardTypeOptions] = useState<
    { value: string; label: string }[]
  >([]);
  const [providerOptions, setProviderOptions] = useState<
    { value: string; label: string }[]
  >([]);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [configToDelete, setConfigToDelete] =
    useState<RewardConfiguration | null>(null);

  const {
    deleteConfirm,
    isDeleting,
    openDeleteConfirm,
    closeDeleteConfirm,
    handleDelete: confirmDeleteConfig,
  } = useDeleteConfirm({
    onDelete: async (id) => {
      if (!configToDelete) return;
      await rewardConfigurationService.delete(Number(id));
      setConfigs((prev) => prev.filter((c) => c.id !== Number(id)));
      showSuccess(`"${configToDelete.name}" has been deleted successfully.`);
    },
    itemLabel: "Reward Template",
  });

  useEffect(() => {
    loadRewardTypes();
    loadProviders();
  }, []);

  useEffect(() => {
    if (providerFilterFromUrl) {
      setProviderFilter(providerFilterFromUrl);
    }
  }, [providerFilterFromUrl]);

  useEffect(() => {
    loadConfigs();
  }, [providerFilterFromUrl]);

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
      const data = await rewardProviderService.getAll({ include_inactive: true });
      setProviderOptions(
        (data || []).map((p) => ({
          value: String(p.id),
          label: `${p.name}${p.is_active === false ? " (inactive)" : ""}`,
        })),
      );
    } catch {
      setProviderOptions([]);
    }
  };

  const loadConfigs = async () => {
    try {
      setLoading(true);
      const params: { provider_id?: number; include_inactive?: boolean } = {
        include_inactive: true,
      };
      if (providerFilterFromUrl) {
        params.provider_id = Number(providerFilterFromUrl);
      }
      const data = await rewardConfigurationService.getAll(params);
      setConfigs(data);
    } catch (err) {
      showError(
        extractBackendError(
          err,
          "Failed to load reward templates. Please try again.",
        ),
      );
      setConfigs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (config: RewardConfiguration) => {
    if (isDefaultRewardTemplate(config)) {
      showError(
        "Default template protected",
        "Each reward provider must keep its default template. Edit its values instead of deleting it.",
      );
      return;
    }
    setConfigToDelete(config);
    openDeleteConfirm(config.id, config.name);
  };

  const handleToggleActive = async (config: RewardConfiguration) => {
    const newActive = !(config.is_active !== false);
    if (!newActive && isDefaultRewardTemplate(config)) {
      showError(
        "Default template protected",
        "The provider default template cannot be deactivated.",
      );
      return;
    }
    setTogglingId(config.id);
    setConfigs((prev) =>
      prev.map((c) =>
        c.id === config.id ? { ...c, is_active: newActive } : c,
      ),
    );

    try {
      await rewardConfigurationService.update(config.id, {
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
          "Failed to update template status. Please try again.",
        ),
      );
    } finally {
      setTogglingId(null);
    }
  };

  const filteredConfigs = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    return configs.filter((config) => {
      if (statusFilter === "active" && config.is_active === false) {
        return false;
      }
      if (statusFilter === "inactive" && config.is_active !== false) {
        return false;
      }
      if (providerFilter && String(config.provider_id) !== providerFilter) {
        return false;
      }
      if (
        rewardTypeFilter &&
        (config.reward_type || "").toLowerCase() !==
          rewardTypeFilter.toLowerCase()
      ) {
        return false;
      }
      if (!term) return true;
      const haystack = [
        config.name,
        config.provider_name,
        config.reward_type,
        config.api_path,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(term);
    });
  }, [configs, searchTerm, providerFilter, rewardTypeFilter, statusFilter]);

  const defaultColumns: TableColumn<RewardConfiguration>[] = [
    {
      id: "name",
      label: "Name",
      visible: true,
      render: (value, config) => (
        <div className="flex items-center gap-2 min-w-0">
          <span className="truncate">{(value as string) || "—"}</span>
          {isDefaultRewardTemplate(config) ? (
            <span className="shrink-0 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide rounded bg-emerald-50 text-emerald-800 border border-emerald-100">
              Default
            </span>
          ) : null}
        </div>
      ),
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
      id: "reward_type",
      label: "Reward Type",
      visible: true,
      render: (value) => (value as string) || "—",
    },
    {
      id: "api_path",
      label: "API Path",
      visible: true,
      render: (value) => (
        <span className="font-mono text-xs">{(value as string) || "—"}</span>
      ),
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
            disabled={
              isDefaultRewardTemplate(config) && config.is_active !== false
            }
            title={
              isDefaultRewardTemplate(config) && config.is_active !== false
                ? "Default template cannot be deactivated"
                : undefined
            }
          />
          <button
            onClick={() =>
              navigate(
                `/dashboard/reward-configurations/${config.id}/details`,
              )
            }
            className={`p-0 icon-edit ${tw.rounded} transition-all duration-200`}
            title="View details"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() =>
              navigate(`/dashboard/reward-configurations/${config.id}/edit`)
            }
            className={`p-0 icon-edit ${tw.rounded} transition-all duration-200`}
            title="Edit template"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDeleteClick(config)}
            className={`p-0 icon-delete ${tw.rounded} transition-all duration-200 ${
              isDefaultRewardTemplate(config)
                ? "opacity-40 cursor-not-allowed"
                : ""
            }`}
            title={
              isDefaultRewardTemplate(config)
                ? "Default template cannot be deleted"
                : "Delete template"
            }
            disabled={isDefaultRewardTemplate(config)}
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
    tableId: "reward-configurations-table",
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
  }, [searchTerm, providerFilter, rewardTypeFilter, statusFilter, tableHandlePageChange]);

  const createUrl = providerFilterFromUrl
    ? `/dashboard/reward-configurations/create?provider_id=${providerFilterFromUrl}`
    : "/dashboard/reward-configurations/create";

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-4">
          <BackButton
            showBreadcrumb={true}
            currentLabel="Reward Templates"
          />
          <FeatureActionButton
            featureId="reward-configurations"
            action="create"
            label="Create Reward Template"
            onClick={() => navigate(createUrl)}
          />
        </div>
        <p className={`text-sm ${tw.textSecondary}`}>
          Manage reward templates (credentials and payload settings). Every
          provider includes a protected default template seeded from its schema
          defaults.
        </p>
        {providerFilterFromUrl && (
          <p className={`text-xs ${tw.textMuted}`}>
            Filtered by provider ID {providerFilterFromUrl}.{" "}
            <button
              type="button"
              className="underline"
              onClick={() => navigate("/dashboard/reward-configurations")}
            >
              Clear filter
            </button>
          </p>
        )}
      </div>

      <div className="my-5 flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <SearchInput
            placeholder="Search by name, provider, reward type, or API path..."
            value={searchTerm}
            onChange={setSearchTerm}
          />
        </div>
        <div className="sm:w-56">
          <HeadlessSelect
            value={providerFilter}
            onChange={(v) => setProviderFilter(String(v))}
            options={[
              { value: "", label: "All Providers" },
              ...providerOptions,
            ]}
            placeholder="Filter by provider"
          />
        </div>
        <div className="sm:w-56">
          <HeadlessSelect
            value={rewardTypeFilter}
            onChange={(v) => setRewardTypeFilter(String(v))}
            options={[
              { value: "", label: "All Reward Types" },
              ...rewardTypeOptions,
            ]}
            placeholder="Filter by reward type"
          />
        </div>
        <div className="sm:w-48">
          <HeadlessSelect
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
      </div>

      <div className={`${tw.rounded} overflow-hidden`}>
        {!loading && filteredConfigs.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 text-gray-400 mx-auto mb-4">🎁</div>
            <h3 className={`text-lg font-medium ${tw.textPrimary} mb-2`}>
              {searchTerm || providerFilter || rewardTypeFilter || statusFilter
                ? "No templates found"
                : "No reward templates yet"}
            </h3>
            <p className={`${tw.textMuted} mb-6`}>
              {searchTerm || providerFilter || rewardTypeFilter || statusFilter
                ? "Try adjusting your search or filters"
                : "Create a reward provider first, then add a template with auth and payload values."}
            </p>
            {!searchTerm &&
              !providerFilter &&
              !rewardTypeFilter &&
              !statusFilter && (
              <FeatureActionButton
                featureId="reward-configurations"
                action="create"
                label="Create Reward Template"
                onClick={() => navigate(createUrl)}
                className="mx-auto"
              />
            )}
          </div>
        ) : (
          <>
            <Table<RewardConfiguration>
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
        title="Delete Reward Template"
        description="This action cannot be undone. Offers and manual rewards that reference this template will be affected."
        itemName={deleteConfirm.itemName || ""}
        isLoading={isDeleting}
      />
    </div>
  );
}
