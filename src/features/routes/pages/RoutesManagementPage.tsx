import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Trash2, Edit, Plus, Eye } from "lucide-react";
import ActivateDeactivateButton from "../../../shared/components/ui/ActivateDeactivateButton";
import SearchInput from "../../../shared/components/ui/SearchInput";
import { useToast } from "../../../contexts/ToastContext";
import { extractBackendError } from "../../../shared/utils/errorHandler";
import { useLanguage } from "../../../contexts/LanguageContext";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import DeleteConfirmModal from "../../../shared/components/ui/DeleteConfirmModal";
import { color, tw } from "../../../shared/utils/utils";
import BackButton from "../../../shared/components/ui/BackButton";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import Pagination, { DEFAULT_PAGE_SIZE } from "../../../shared/components/ui/Pagination";
import { useDeleteConfirm } from "../../../shared/hooks/useDeleteConfirm";
import { Table, useTable, type TableColumn } from "../../../shared/components/Table";
import { routeService, resolveChannelType } from "../services/routeService";
import { SMSRoute, RouteChannelType } from "../types/smsRoute";
import {
  communicationChannelService,
  toCommunicationChannelOptions,
  type CommunicationChannel,
} from "../../../shared/services/communicationChannelService";

type ChannelKind = Exclude<RouteChannelType, "">;

interface UnifiedRoute {
  id: number;
  name: string;
  description?: string;
  channel: ChannelKind | "UNKNOWN";
  channel_id?: number | null;
  channel_name?: string;
  gateway_provider?: string;
  configuration_name?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  originalRoute: SMSRoute;
}

const formatDisplayValue = (value: string): string => {
  if (!value) return "—";

  const displayMap: Record<string, string> = {
    SMS: "SMS",
    EMAIL: "Email",
    PUSH: "Push",
    WHATSAPP: "WhatsApp",
    USSD: "USSD",
  };

  return (
    displayMap[value] ||
    value
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ")
  );
};

export default function RoutesManagementPage() {
  const navigate = useNavigate();
  const { success: showSuccess, error: showError } = useToast();
  const { t } = useLanguage();
  const [routes, setRoutes] = useState<UnifiedRoute[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterChannel, setFilterChannel] = useState<string>("all");
  const [communicationChannels, setCommunicationChannels] = useState<
    CommunicationChannel[]
  >([]);
  const [togglingStatus, setTogglingStatus] = useState<number | null>(null);

  const { deleteConfirm, isDeleting, openDeleteConfirm, closeDeleteConfirm, handleDelete } =
    useDeleteConfirm({
      onDelete: async (id) => {
        const numId = typeof id === "string" ? parseInt(id) : id;
        setRoutes((prev) => prev.filter((r) => r.id !== numId));
        await routeService.deleteRoute(numId);
      },
      itemLabel: "Route",
    });

  useEffect(() => {
    loadAllRoutes();
    loadCommunicationChannels();
  }, []);

  const loadCommunicationChannels = async () => {
    try {
      const channels = await communicationChannelService.getAll();
      setCommunicationChannels(Array.isArray(channels) ? channels : []);
    } catch {
      setCommunicationChannels([]);
    }
  };

  const loadAllRoutes = async () => {
    try {
      setLoading(true);
      const allRoutes = await routeService.getAllRoutesEnriched();

      const unifiedRoutes: UnifiedRoute[] = allRoutes.map((route) => ({
        id: route.id,
        name: route.name,
        description: route.description,
        channel: (route.channel_type || "UNKNOWN") as ChannelKind | "UNKNOWN",
        channel_id: route.communication_channel_id,
        channel_name: route.channel_name,
        gateway_provider: route.provider_name || route.gateway_provider,
        configuration_name: route.configuration_name,
        is_active: route.is_active,
        created_at: route.created_at,
        updated_at: route.updated_at,
        originalRoute: route,
      }));

      setRoutes(unifiedRoutes);
    } catch (err) {
      showError("Error", extractBackendError(err, "Error. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  const filteredRoutes = routes.filter((route) => {
    const matchesSearch = route.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    if (filterChannel === "all") return matchesSearch;

    const selectedFilterChannel = communicationChannels.find(
      (channel) => String(channel.id) === filterChannel,
    );
    const matchesChannelId =
      route.channel_id != null && String(route.channel_id) === filterChannel;
    const matchesLegacyType =
      route.channel_id == null &&
      !!selectedFilterChannel &&
      route.channel ===
        resolveChannelType(
          selectedFilterChannel.code || selectedFilterChannel.name,
        );

    return matchesSearch && (matchesChannelId || matchesLegacyType);
  });

  const defaultColumns: TableColumn<UnifiedRoute>[] = [
    {
      id: "name",
      label: t.common.name,
      visible: true,
      render: (value) => (
        <div
          className={`${tw.tableFirstColumn} ${tw.textPrimary} truncate`}
          title={value as string}
        >
          {value}
        </div>
      ),
    },
    {
      id: "description",
      label: t.common.description,
      visible: true,
      render: (value) => (
        <div
          className={`text-sm ${tw.textSecondary} max-w-md truncate`}
          title={value ? String(value) : "—"}
        >
          {value || "—"}
        </div>
      ),
    },
    {
      id: "channel",
      label: t.routes.channel,
      visible: true,
      render: (_value, route) => (
        <div
          className={`text-sm ${tw.textSecondary} truncate`}
          title={route.channel_name || formatDisplayValue(route.channel)}
        >
          {route.channel_name || formatDisplayValue(route.channel)}
        </div>
      ),
    },
    {
      id: "gateway_provider",
      label: t.routes.gatewayProvider,
      visible: true,
      render: (value, route) => (
        <div
          className={`text-sm ${tw.textSecondary} truncate`}
          title={
            route.configuration_name ||
            (value ? formatDisplayValue(String(value)) : "—")
          }
        >
          {route.configuration_name ||
            (value ? formatDisplayValue(String(value)) : "—")}
        </div>
      ),
    },
    {
      id: "is_active",
      label: t.common.status,
      visible: true,
      render: (value) => (
        <span className={`text-sm ${tw.textSecondary}`}>
          {value ? t.common.active : t.common.inactive}
        </span>
      ),
    },
    {
      id: "actions",
      label: t.common.actions,
      visible: true,
      sortable: false,
      isActionColumn: true,
      render: (_value, route) => (
        <div className="flex items-center justify-center gap-2">
          <ActivateDeactivateButton
            isActive={route.is_active}
            onToggle={() => handleToggleStatus(route)}
            disabled={togglingStatus === route.id}
            isLoading={togglingStatus === route.id}
            title={route.is_active ? t.common.deactivate : t.common.activate}
          />
          <button
            onClick={() => navigate(`/dashboard/routes/${route.id}`)}
            className={`p-0 icon-edit ${tw.rounded} transition-all duration-200`}
            title={t.common.view}
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => navigateToEdit(route)}
            className={`p-0 icon-edit ${tw.rounded} transition-all duration-200`}
            title={t.common.edit}
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDeleteRoute(route)}
            className={`p-0 icon-delete ${tw.rounded} transition-all duration-200`}
            title={t.common.delete}
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
    tableId: "routes-management-table",
    defaultColumns,
    defaultPageSize: DEFAULT_PAGE_SIZE,
    persistToLocalStorage: true,
  });

  const paginatedRoutes = filteredRoutes.slice(
    (tableCurrentPage - 1) * tablePageSize,
    tableCurrentPage * tablePageSize,
  );

  const handleDeleteRoute = (route: UnifiedRoute) => {
    openDeleteConfirm(route.id, route.name);
  };

  const handleToggleStatus = async (route: UnifiedRoute) => {
    try {
      setTogglingStatus(route.id);
      const newStatus = !route.is_active;

      setRoutes((currentRoutes) =>
        currentRoutes.map((r) =>
          r.id === route.id ? { ...r, is_active: newStatus } : r,
        ),
      );

      await routeService.updateRoute(route.id, { is_active: newStatus });

      showSuccess(
        newStatus ? "Activated" : "Deactivated",
        `${t.routes.route} has been ${newStatus ? t.routes.activated : t.routes.deactivated} successfully`,
      );
    } catch (err) {
      setRoutes((currentRoutes) =>
        currentRoutes.map((r) =>
          r.id === route.id ? { ...r, is_active: route.is_active } : r,
        ),
      );
      showError("Error", extractBackendError(err, "Error. Please try again."));
    } finally {
      setTogglingStatus(null);
    }
  };

  const navigateToEdit = (route: UnifiedRoute) => {
    const channelQuery = route.channel_id
      ? `?channel_id=${route.channel_id}`
      : route.channel !== "UNKNOWN"
        ? `?channel=${route.channel}`
        : "";
    navigate(`/dashboard/routes/edit/${route.id}${channelQuery}`);
  };

  const channelOptions = [
    { value: "all", label: t.routes.allChannels },
    ...toCommunicationChannelOptions(communicationChannels),
  ];

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-4">
          <BackButton
            showBreadcrumb={true}
            currentLabel={t.routes.routesManagement}
          />
          <button
            onClick={() => navigate("/dashboard/routes/create")}
            className="inline-flex items-center gap-2 px-4 py-2 text-white font-semibold text-sm rounded transition-colors hover:opacity-90"
            style={{ backgroundColor: color.primary.action }}
          >
            <Plus className="w-4 h-4" />
            {t.routes.createRoute}
          </button>
        </div>
        <p className={`text-sm ${tw.textSecondary}`}>
          {t.routes.manageAllRoutes}
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <SearchInput
            placeholder={t.routes.searchByRouteName}
            value={searchTerm}
            onChange={setSearchTerm}
          />
        </div>
        <div className="w-full md:w-48">
          <HeadlessSelect
            value={filterChannel}
            onChange={setFilterChannel}
            options={channelOptions}
            placeholder={t.routes.filterByChannel}
          />
        </div>
      </div>

      <div className={`${tw.rounded} overflow-hidden`}>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner />
          </div>
        ) : filteredRoutes.length === 0 ? (
          <div className="text-center py-12">
            <p className={`${tw.textSecondary} text-sm`}>
              {searchTerm || filterChannel !== "all"
                ? t.routes.noRoutesFound
                : t.routes.noRoutesCreated}
            </p>
          </div>
        ) : (
          <>
            <Table<UnifiedRoute>
              columns={columns}
              data={paginatedRoutes}
              totalItems={filteredRoutes.length}
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

            {!loading &&
              paginatedRoutes.length > 0 &&
              filteredRoutes.length > 0 && (
                <Pagination
                  currentPage={tableCurrentPage}
                  pageSize={tablePageSize}
                  totalItems={filteredRoutes.length}
                  onPageChange={tableHandlePageChange}
                  onPageSizeChange={tableHandlePageSizeChange}
                />
              )}
          </>
        )}
      </div>

      <DeleteConfirmModal
        isOpen={deleteConfirm.id !== null}
        onClose={closeDeleteConfirm}
        onConfirm={handleDelete}
        title={t.routes.deleteRoute}
        description={t.routes.deleteRouteDescription}
        itemName={deleteConfirm.itemName}
        isLoading={isDeleting}
        confirmText={t.common.delete}
      />
    </div>
  );
}
