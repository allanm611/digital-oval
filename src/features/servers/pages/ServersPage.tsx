import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  AlertTriangle,
  Archive,
  CheckSquare,
  Edit,
  Eye,
  HeartPulse,
  Loader2,
  MoreVertical,
  Play,
  PowerOff,
  RotateCcw,
  Server as ServerIcon,
  Shield,
  Square,
  X,
} from "lucide-react";
import BackButton from "../../../shared/components/ui/BackButton";
import SearchInput from "../../../shared/components/ui/SearchInput";
import { serverService } from "../services/serverService";
import FeatureActionButton from "../../../shared/components/FeatureActionButton";
import {
  ServerCountByEnvironment,
  ServerCountByProtocol,
  ServerCountByRegion,
  ServerHealthStats,
  ServerType,
} from "../types/server";
import ServerStatsCards from "../components/ServerStatsCards";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import Pagination, { DEFAULT_PAGE_SIZE } from "../../../shared/components/ui/Pagination";
import { useToast } from "../../../contexts/ToastContext";
import { useAuth } from "../../../contexts/AuthContext";
import { extractBackendError } from "../../../shared/utils/errorHandler";;;
import DeleteConfirmModal from "../../../shared/components/ui/DeleteConfirmModal";
import { Table, useTable, type TableColumn } from "../../../shared/components/Table";

import { color, tw, button, zIndex } from "../../../shared/utils/utils";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../../../contexts/LanguageContext";
import { PermissionGate } from "../../auth/components/PermissionGate";
import Checkbox from "../../../shared/components/ui/Checkbox";
import { useDeleteConfirm } from "../../../shared/hooks/useDeleteConfirm";


type ScopeFilter = "all" | "health-enabled" | "health-failing" | "health-due";

export default function ServersPage() {
  const { error: showError, success } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [scope, setScope] = useState<ScopeFilter>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [environmentFilter, setEnvironmentFilter] = useState("all");
  const [protocolFilter, setProtocolFilter] = useState("all");
  const [regionFilter, setRegionFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [serverTypeFilter, setServerTypeFilter] = useState("all");

  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [isLoadingServers, setIsLoadingServers] = useState(true);
  const [sourceServers, setSourceServers] = useState<ServerType[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedServerIds, setSelectedServerIds] = useState<Set<number>>(
    () => new Set(),
  );
  const [showColumnPicker, setShowColumnPicker] = useState(false);
  const [isBulkActionLoading, setIsBulkActionLoading] = useState(false);
  const [actionState, setActionState] = useState<{
    id: number;
    action: "activate" | "deactivate" | "health" | "deprecate";
  } | null>(null);
  const userId = user?.user_id;
  const headerCheckboxRef = useRef<HTMLInputElement | null>(null);

  // Table columns definition
  const defaultColumns: TableColumn<ServerType>[] = [
    {
      id: "select",
      label: "Select",
      visible: isSelectionMode,
      sortable: false,
      render: (_, server) => (
        <div
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => toggleServerSelection(server.id)}
        >
          <Checkbox
            id={`row-${server.id}`}
            checked={selectedServerIds.has(server.id)}
            onChange={() => toggleServerSelection(server.id)}
            aria-label={`Select ${server.name}`}
            className="h-4 w-4 rounded border-gray-300 text-black focus:ring-black"
          />
        </div>
      ),
    },
    {
      id: "name",
      label: "Server",
      visible: true,
      render: (value, server) => (
        <button
          type="button"
          onClick={() => navigate(`/dashboard/servers/${server.id}`)}
          className={`${tw.tableFirstColumn} text-sm text-black whitespace-nowrap`}
        >
          {value}
        </button>
      ),
    },
    {
      id: "code",
      label: "Code",
      visible: true,
      render: (value) => (
        <p className="text-sm text-black whitespace-nowrap">{value || "—"}</p>
      ),
    },
    {
      id: "environment",
      label: "Environment",
      visible: true,
      render: (value) => (
        <div className="whitespace-nowrap">
          {value ? String(value).replace(/_/g, " ") : "—"}
        </div>
      ),
    },
    {
      id: "host",
      label: "Endpoint",
      visible: true,
      render: (value, server) => (
        <p className="text-sm text-black whitespace-nowrap">
          {`${server.protocol}://${server.host}${
            server.port ? `:${server.port}` : ""
          }${server.base_path || ""}`.replace(/\/+$/, "")}
        </p>
      ),
    },
    {
      id: "health_check_enabled",
      label: "Health",
      visible: true,
      render: (_, server) => renderHealthBadge(server),
    },
    {
      id: "is_active",
      label: "Status",
      visible: true,
      render: (value) => (
        <span className="text-sm whitespace-nowrap text-black">
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
      render: (_, server) => (
        <div className="flex items-center justify-end gap-1">
          <button
            type="button"
            onClick={() => navigate(`/dashboard/servers/${server.id}`)}
            className={`inline-flex items-center justify-center icon-edit ${tw.rounded} p-0 transition-colors hover:bg-gray-100`}
            aria-label={`View ${server.name}`}
            title="View details"
          >
            <Eye size={16} />
          </button>
          <PermissionGate permission="servers.update">
            <button
              type="button"
              onClick={(e) => handleEdit(server, e)}
              className={`inline-flex items-center justify-center icon-edit ${tw.rounded} p-0 transition-colors hover:bg-gray-100`}
              aria-label={`Edit ${server.name}`}
              title="Edit server"
            >
              <Edit size={16} />
            </button>
          </PermissionGate>
          <PermissionGate permission="servers.update">
            <div className="relative">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenMenuId(openMenuId === server.id ? null : server.id);
                }}
                className={`inline-flex items-center justify-center ${tw.rounded} p-2 text-gray-600 transition-colors hover:bg-gray-100`}
                aria-label="More actions"
                title="More actions"
              >
                <MoreVertical size={16} />
              </button>
              {openMenuId === server.id && (
                <div
                  ref={menuRef}
                  className={`absolute right-0 top-full mt-1 ${tw.rounded} border border-gray-200 bg-white shadow-lg z-40 min-w-max`}
                >
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleHealthToggle(server, e);
                      setOpenMenuId(null);
                    }}
                    disabled={actionState?.id === server.id && actionState?.action === "health"}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors first:rounded-t last:rounded-b disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {actionState?.id === server.id && actionState?.action === "health" ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <HeartPulse size={14} />
                    )}
                    {server.health_check_enabled ? "Disable health checks" : "Enable health checks"}
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeprecationToggle(server, e);
                      setOpenMenuId(null);
                    }}
                    disabled={actionState?.id === server.id && actionState?.action === "deprecate"}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors first:rounded-t last:rounded-b disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 border-t border-gray-100"
                  >
                    {actionState?.id === server.id && actionState?.action === "deprecate" ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Archive size={14} />
                    )}
                    {server.is_deprecated ? "Restore" : "Archive"}
                  </button>
                </div>
              )}
            </div>
          </PermissionGate>
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
    tableId: "servers-table",
    defaultColumns,
    defaultPageSize: DEFAULT_PAGE_SIZE,
    persistToLocalStorage: true,
  });

  const [healthStats, setHealthStats] = useState<ServerHealthStats | null>(
    null,
  );
  const [environmentCounts, setEnvironmentCounts] =
    useState<ServerCountByEnvironment>([]);
  const [protocolCounts, setProtocolCounts] = useState<ServerCountByProtocol>(
    [],
  );
  const [regionCounts, setRegionCounts] = useState<ServerCountByRegion>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [isClosingFilters, setIsClosingFilters] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const defaultShowColumnPicker = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [menuPosition, setMenuPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm.trim().toLowerCase());
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuId(null);
        setMenuPosition(null);
      }
    };

    if (openMenuId !== null) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [openMenuId]);

  const closeFilters = useCallback(() => {
    setIsClosingFilters(true);
    setTimeout(() => {
      setShowFilters(false);
      setIsClosingFilters(false);
    }, 300);
  }, []);
  const loadStats = useCallback(async () => {
    setIsLoadingStats(true);
    try {
      const [health, env, protocol, regions] = await Promise.all([
        serverService.getHealthStats(),
        serverService.getEnvironmentCounts(),
        serverService.getProtocolCounts(),
        serverService.getRegionDistribution(),
      ]);
      setHealthStats(health);
      setEnvironmentCounts(Array.isArray(env) ? env : []);
      setProtocolCounts(Array.isArray(protocol) ? protocol : []);
      setRegionCounts(Array.isArray(regions) ? regions : []);
    } catch (err) {
      showError("Failed to load server analytics", extractBackendError(err, "Failed to load server analytics. Please try again."));
    } finally {
      setIsLoadingStats(false);
    }
  }, [showError]);

  const loadServers = useCallback(async () => {
    setIsLoadingServers(true);
    try {
      const params: any = {
        limit: tablePageSize,
        offset: (tableCurrentPage - 1) * tablePageSize,
        skipCache: true,
      };

      if (statusFilter === "active") {
        params.activeOnly = true;
      } else if (statusFilter === "inactive") {
        params.activeOnly = false;
      }

      if (environmentFilter !== "all") {
        params.environment = environmentFilter;
      }

      if (protocolFilter !== "all") {
        params.protocol = protocolFilter;
      }

      if (regionFilter !== "all") {
        params.region = regionFilter;
      }

      if (serverTypeFilter !== "all") {
        params.serverType = serverTypeFilter;
      }

      if (debouncedSearchTerm) {
        params.searchTerm = debouncedSearchTerm;
      }

      const response = await serverService.listServers(params);
      setSourceServers(Array.isArray(response.data) ? response.data : []);
      setTotalCount(response.meta?.total || 0);
    } catch (err) {
      setSourceServers([]);
      setTotalCount(0);
      showError("Failed to load servers", extractBackendError(err, "Failed to load servers. Please try again."));
    } finally {
      setIsLoadingServers(false);
    }
  }, [
    tableCurrentPage,
    tablePageSize,
    statusFilter,
    environmentFilter,
    protocolFilter,
    regionFilter,
    serverTypeFilter,
    debouncedSearchTerm,
    showError,
  ]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  useEffect(() => {
    loadServers();
  }, [loadServers]);

  useEffect(() => {
    setSelectedServerIds((prev) => {
      if (prev.size === 0) {
        return prev;
      }
      const next = new Set<number>();
      sourceServers.forEach((server) => {
        if (prev.has(server.id)) {
          next.add(server.id);
        }
      });
      return next;
    });
  }, [sourceServers]);

  useEffect(() => {
    tableHandlePageChange(1);
  }, [
    environmentFilter,
    protocolFilter,
    regionFilter,
    statusFilter,
    serverTypeFilter,
    debouncedSearchTerm,
    scope,
    tableHandlePageChange,
  ]);


  const visibleIds = useMemo(
    () => sourceServers.map((server) => server.id),
    [sourceServers],
  );

  const allVisibleSelected =
    visibleIds.length > 0 &&
    visibleIds.every((id) => selectedServerIds.has(id));

  const someVisibleSelected = visibleIds.some((id) =>
    selectedServerIds.has(id),
  );

  const hasSelection = selectedServerIds.size > 0;

  useEffect(() => {
    if (headerCheckboxRef.current) {
      headerCheckboxRef.current.indeterminate =
        someVisibleSelected && !allVisibleSelected;
    }
  }, [someVisibleSelected, allVisibleSelected]);

  const environmentOptions = useMemo(() => {
    const values = new Set(
      environmentCounts
        .map((env) => env.environment)
        .filter((env): env is string => Boolean(env)),
    );
    sourceServers.forEach((server) => {
      if (server.environment) {
        values.add(server.environment);
      }
    });
    return ["all", ...Array.from(values)];
  }, [environmentCounts, sourceServers]);

  const protocolOptions = useMemo(() => {
    const values = new Set(
      protocolCounts
        .map((protocol) => protocol.protocol)
        .filter((protocol): protocol is string => Boolean(protocol)),
    );
    sourceServers.forEach((server) => {
      if (server.protocol) {
        values.add(server.protocol);
      }
    });
    return ["all", ...Array.from(values)];
  }, [protocolCounts, sourceServers]);

  const regionOptions = useMemo(() => {
    const values = new Set(
      regionCounts
        .map((region) => region.region)
        .filter((region): region is string => Boolean(region)),
    );
    sourceServers.forEach((server) => {
      if (server.region) {
        values.add(server.region);
      }
    });
    return ["all", ...Array.from(values)];
  }, [regionCounts, sourceServers]);

  const serverTypeOptions = useMemo(() => {
    const values = new Set<string>();
    sourceServers.forEach((server) => {
      if (server.server_type) {
        values.add(server.server_type);
      }
    });
    return ["all", ...Array.from(values)];
  }, [sourceServers]);

  const handleRefresh = useCallback(() => {
    loadStats();
    loadServers();
  }, [loadServers, loadStats]);

  const handleEdit = (server: ServerType, event: React.MouseEvent) => {
    event.stopPropagation();
    navigate(`/dashboard/servers/${server.id}/edit`);
  };

  const renderHealthBadge = (server: ServerType) => {
    if (!server.health_check_enabled) {
      return (
        <span className="text-sm font-medium text-black">
          disabled
        </span>
      );
    }

    // If health check is enabled but status is null, show null
    if (
      !server.last_health_check_status ||
      server.last_health_check_status === null
    ) {
      return (
        <span className="text-sm font-medium text-black">
          null
        </span>
      );
    }

    // Display backend status as-is (no capitalization)
    return (
      <span className="text-sm font-medium text-black">
        {server.last_health_check_status || "unknown"}
      </span>
    );
  };

  const isEmptyState = !isLoadingServers && sourceServers.length === 0;

  const toggleServerSelection = (id: number) => {
    setSelectedServerIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAllVisible = () => {
    if (visibleIds.length === 0) return;
    setSelectedServerIds((prev) => {
      const next = new Set(prev);
      const everyVisibleSelected = visibleIds.every((id) => next.has(id));
      if (everyVisibleSelected) {
        visibleIds.forEach((id) => next.delete(id));
      } else {
        visibleIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  const handleBulkStatusChange = async (
    action: "activate" | "deactivate",
  ): Promise<void> => {
    const ids = Array.from(selectedServerIds);
    if (ids.length === 0) return;

    if (!userId) {
      showError("Error", "User ID is required");
      return;
    }

    setIsBulkActionLoading(true);
    setSourceServers((prev) =>
      prev.map((s) =>
        ids.includes(s.id) ? { ...s, is_active: action === "activate" } : s,
      ),
    );

    try {
      const payload = {
        serverIds: ids,
        user_id: userId,
      };
      const response =
        action === "activate"
          ? await serverService.bulkActivateServers(payload)
          : await serverService.bulkDeactivateServers(payload);
      const updatedCount =
        response?.activated ?? response?.deactivated ?? ids.length;
      success(
        `${updatedCount} server${updatedCount === 1 ? "" : "s"} ${
          action === "activate" ? "activated" : "deactivated"
        }`,
        `Successfully ${
          action === "activate" ? "activated" : "deactivated"
        } ${updatedCount} server${updatedCount === 1 ? "" : "s"}.`,
      );
      setSelectedServerIds(new Set());
      await loadStats();
    } catch (err) {
      await loadServers();
      showError(        `Failed to ${          action === "activate" ? "activate" : "deactivate"        } servers`,        err instanceof Error ? err.message : "Please try again.",      );
    } finally {
      setIsBulkActionLoading(false);
    }
  };

  const handleActivationToggle = async (
    server: ServerType,
    event?: React.MouseEvent,
  ) => {
    event?.stopPropagation();
    const action = server.is_active ? "deactivate" : "activate";

    setActionState({ id: server.id, action });
    setSourceServers((prev) =>
      prev.map((s) =>
        s.id === server.id ? { ...s, is_active: action === "activate" } : s,
      ),
    );

    try {
      const updatedServer =
        action === "activate"
          ? await serverService.activateServer(server.id)
          : await serverService.deactivateServer(server.id);

      // Update the server in place to maintain position
      setSourceServers((prev) =>
        prev.map((s) => (s.id === server.id ? updatedServer : s)),
      );

      success(
        `Server ${action === "activate" ? "activated" : "deactivated"}`,
        `${server.name} is now ${
          action === "activate" ? "active" : "inactive"
        }.`,
      );
    } catch (err) {
      await loadServers();
      showError(        `Failed to ${action} server`,        err instanceof Error ? err.message : "Please try again.",      );
    } finally {
      setActionState(null);
    }
  };

  const handleDeprecationToggle = async (
    server: ServerType,
    event?: React.MouseEvent,
  ) => {
    event?.stopPropagation();
    const nextAction = server.is_deprecated ? "undeprecate" : "deprecate";

    setActionState({ id: server.id, action: "deprecate" });
    try {
      const updatedServer =
        nextAction === "deprecate"
          ? await serverService.deprecateServer(server.id)
          : await serverService.undeprecateServer(server.id);

      // Update the server in place to maintain position
      setSourceServers((prev) =>
        prev.map((s) => (s.id === server.id ? updatedServer : s)),
      );

      success(
        `Server ${nextAction === "deprecate" ? "deprecated" : "restored"}`,
        `${server.name} ${
          nextAction === "deprecate"
            ? "will no longer receive jobs"
            : "is available again"
        }.`,
      );
    } catch (err) {
      showError(`Failed to ${nextAction} server`, err instanceof Error ? err.message : "Please try again.");
    } finally {
      setActionState(null);
    }
  };

  const handleHealthToggle = async (
    server: ServerType,
    event?: React.MouseEvent,
  ) => {
    event?.stopPropagation();
    const action = server.health_check_enabled ? "disable" : "enable";

    setActionState({ id: server.id, action: "health" });
    try {
      if (action === "enable") {
        await serverService.enableHealthCheck(server.id, {
          healthCheckUrl: server.health_check_url || undefined,
        });
      } else {
        await serverService.disableHealthCheck(server.id);
      }
      success(
        `Health checks ${action === "enable" ? "enabled" : "disabled"}`,
        `${server.name} ${
          action === "enable"
            ? "will report uptime again"
            : "will stop automated health polling"
        }.`,
      );
      // Optimistically update the server
      setSourceServers((prev) =>
        prev.map((s) =>
          s.id === server.id
            ? { ...s, health_check_enabled: action === "enable" }
            : s,
        ),
      );
      // Refetch health stats to update the stat card
      await loadStats();
    } catch (err) {
      showError(`Failed to ${action} health checks`, err instanceof Error ? err.message : "Please try again.");
    } finally {
      setActionState(null);
    }
  };

  const isServerActionInFlight = (
    serverId: number,
    actions: Array<"activate" | "deactivate" | "health" | "deprecate">,
  ) => actionState?.id === serverId && actions.includes(actionState.action);

  return (
    <div className="overflow-x-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <BackButton
          showBreadcrumb={true}
          currentLabel="Servers"
        />
        <div className="flex items-center gap-3">
            <PermissionGate permission="servers.select">
              <button
                onClick={() => {
                  if (!isSelectionMode) {
                    // Entering selection mode - select all visible servers
                    setIsSelectionMode(true);
                    setSelectedServerIds(new Set(visibleIds));
                  } else {
                    // Exiting selection mode - clear selection
                    setIsSelectionMode(false);
                    setSelectedServerIds(new Set());
                  }
                }}
                className={`inline-flex items-center gap-2 ${tw.rounded} px-4 py-2 text-sm font-medium focus:outline-none transition-colors`}
                style={{
                  backgroundColor: isSelectionMode
                    ? color.primary.action
                    : "transparent",
                  color: isSelectionMode ? "white" : "var(--c-bordered-button-color)",
                  borderColor: "var(--c-bordered-button-color)",
                  borderWidth: "1px",
                  borderStyle: "solid",
                }}
              >
                {isSelectionMode ? (
                  <CheckSquare size={16} />
                ) : (
                  <Square size={16} />
                )}
                {isSelectionMode
                  ? t.servers.exitSelection
                  : t.servers.selectServers}
              </button>
            </PermissionGate>
            <FeatureActionButton featureId="servers" action="create" />
        </div>
      </div>
      <p className={`${tw.textSecondary} text-sm mt-1`}>
        {t.servers.description}
      </p>

      <div className="mt-6">
        <ServerStatsCards
          healthStats={healthStats}
          environmentCounts={environmentCounts}
          protocolCounts={protocolCounts}
          regionCounts={regionCounts}
          isLoading={isLoadingStats}
        />
      </div>

      <div className="space-y-4 mt-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <div className="flex-1">
            <SearchInput
              placeholder="Search by name or code..."
              value={searchTerm}
              onChange={(value) => setSearchTerm(value)}
            />
          </div>
          <HeadlessSelect
            options={[
              { value: "all", label: "All servers" },
              { value: "health-enabled", label: "Health on" },
              { value: "health-failing", label: "Failing" },
              { value: "health-due", label: "Due" },
            ]}
            value={scope}
            onChange={(value) => setScope((value as ScopeFilter) ?? "all")}
            placeholder="Dataset"
            className="md:w-60"
          />
          <button
            onClick={() => setShowFilters(true)}
            className={`inline-flex items-center justify-center gap-2 ${tw.rounded} transition-colors font-medium`}
            style={{
              backgroundColor: button.secondaryAction.background,
              color: button.secondaryAction.color,
              border: button.secondaryAction.border,
              padding: `${button.secondaryAction.paddingY} ${button.secondaryAction.paddingX}`,
              borderRadius: button.secondaryAction.borderRadius,
              fontSize: button.secondaryAction.fontSize,
            }}
          >
            Filters
          </button>
        </div>
      </div>

      {/* Batch Actions Toolbar */}
      {isSelectionMode && selectedServerIds.size > 0 && (
        <div
          className={`flex items-center justify-between ${tw.rounded} border border-gray-200 bg-white px-4 py-3`}
        >
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">
              {selectedServerIds.size} server(s) selected
            </span>
            <button
              onClick={() => setSelectedServerIds(new Set())}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              <X size={16} />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleBulkStatusChange("activate")}
              disabled={isBulkActionLoading}
              className={`inline-flex items-center gap-2 ${tw.rounded} px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed`}
              style={{ backgroundColor: color.primary.action }}
            >
              <Play size={14} />
              Activate
            </button>
            <button
              onClick={() => handleBulkStatusChange("deactivate")}
              disabled={isBulkActionLoading}
              className={`inline-flex items-center gap-2 ${tw.rounded} border border-red-200 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50`}
            >
              <PowerOff size={14} />
              Deactivate
            </button>
          </div>
        </div>
      )}

      <div className={`${tw.rounded}`}>
        {isLoadingServers ? (
          <div className="flex flex-col items-center justify-center py-20">
            <LoadingSpinner variant="modern" size="lg" color="primary" />
            <p className="mt-4 text-sm text-gray-500">
              {t.servers.loadingServers}
            </p>
          </div>
        ) : isEmptyState ? (
          <div className="py-16 text-center bg-white">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-gray-400">
              <ServerIcon size={24} />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-gray-900">
              No servers match the filters
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              Adjust your filters or refresh the data.
            </p>
          </div>
        ) : (
          <div className={`${tw.rounded} overflow-hidden`}>
            <Table<ServerType>
              columns={columns}
              data={sourceServers}
              totalItems={totalCount}
              currentPage={tableCurrentPage}
              pageSize={tablePageSize}
              isLoading={isLoadingServers}
              onPageChange={tableHandlePageChange}
              onPageSizeChange={tableHandlePageSizeChange}
              onSort={handleSort}
              sortConfigs={sortConfigs}
              onHideColumn={toggleColumn}
              onManageColumnsClick={() => setShowColumnPicker(true)}
              style={{
                headerBackground: color.surface.tableHeader,
                headerTextColor: color.surface.tableHeaderText,
                rowBackground: color.surface.tablebodybg,
                rowSpacing: "0 8px",
              }}
            />
          </div>
        )}
      </div>

      {!isLoadingServers && totalCount > 0 && (
        <Pagination
          currentPage={tableCurrentPage}
          pageSize={tablePageSize}
          totalItems={totalCount}
          onPageChange={tableHandlePageChange}
          onPageSizeChange={tableHandlePageSizeChange}
        />
      )}

      {(showFilters || isClosingFilters) &&
        createPortal(
          <div
            className={`fixed inset-0 ${
              isClosingFilters
                ? "animate-out fade-out duration-300"
                : "animate-in fade-in duration-300"
            }`}
            style={{ zIndex: zIndex.modal }}
          >
            <div
              className="absolute inset-0 bg-black/50"
              onClick={closeFilters}
              role="presentation"
            />
            <div
              className={`absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl transition-transform duration-300 ${
                isClosingFilters ? "translate-x-full" : "translate-x-0"
              }`}
            >
              <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
                <button
                  onClick={closeFilters}
                  className="text-xl text-gray-400 hover:text-gray-600"
                  aria-label="Close filters"
                >
                  ×
                </button>
              </div>

              <div className="h-[calc(100%-140px)] space-y-6 overflow-y-auto px-6 py-6">
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Status
                  </p>
                  <HeadlessSelect
                    options={[
                      { value: "all", label: "All statuses" },
                      { value: "active", label: "Active" },
                      { value: "inactive", label: "Inactive" },
                      { value: "deprecated", label: "Deprecated" },
                    ]}
                    value={statusFilter}
                    onChange={(value) => setStatusFilter(String(value))}
                    placeholder="Status"
                  />
                </div>

                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Environment
                  </p>
                  <HeadlessSelect
                    options={environmentOptions.map((value) => ({
                      value,
                      label:
                        value === "all"
                          ? "All environments"
                          : value.toString().toUpperCase(),
                    }))}
                    value={environmentFilter}
                    onChange={(value) => setEnvironmentFilter(String(value))}
                    placeholder="Environment"
                    searchable
                  />
                </div>

                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Protocol
                  </p>
                  <HeadlessSelect
                    options={protocolOptions.map((value) => ({
                      value,
                      label:
                        value === "all" ? "All protocols" : value.toString(),
                    }))}
                    value={protocolFilter}
                    onChange={(value) => setProtocolFilter(String(value))}
                    placeholder="Protocol"
                    searchable
                  />
                </div>

                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Region
                  </p>
                  <HeadlessSelect
                    options={regionOptions.map((value) => ({
                      value,
                      label: value === "all" ? "All regions" : value.toString(),
                    }))}
                    value={regionFilter}
                    onChange={(value) => setRegionFilter(String(value))}
                    placeholder="Region"
                    searchable
                  />
                </div>

                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Server Type
                  </p>
                  <HeadlessSelect
                    options={serverTypeOptions.map((value) => ({
                      value,
                      label:
                        value === "all" ? "All server types" : value.toString(),
                    }))}
                    value={serverTypeFilter}
                    onChange={(value) => setServerTypeFilter(String(value))}
                    placeholder="Server Type"
                    searchable
                  />
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-gray-200 px-6 py-4">
                <button
                  onClick={() => {
                    setStatusFilter("all");
                    setEnvironmentFilter("all");
                    setProtocolFilter("all");
                    setRegionFilter("all");
                    setServerTypeFilter("all");
                  }}
                  className="text-sm font-medium text-gray-600 hover:text-gray-900"
                >
                  Clear all
                </button>
                <button
                  onClick={closeFilters}
                  className={`${tw.rounded} bg-black px-5 py-2 text-sm font-semibold text-white hover:bg-black/80`}
                >
                  Apply filters
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
