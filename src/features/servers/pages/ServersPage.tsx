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
  Search,
  Server as ServerIcon,
  Shield,
  Square,
  X,
} from "lucide-react";
import { serverService } from "../services/serverService";
import CreateButton from "../../../shared/components/ui/CreateButton";
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
import Pagination from "../../../shared/components/ui/Pagination";
import { useToast } from "../../../contexts/ToastContext";
import { useAuth } from "../../../contexts/AuthContext";
import { useConfirm } from "../../../contexts/ConfirmContext";
import { color, tw, button, zIndex } from "../../../shared/utils/utils";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../../../contexts/LanguageContext";
import { PermissionGate } from "../../auth/components/PermissionGate";

const PAGE_SIZE = 15;
const BASE_FETCH_LIMIT = 100;

type ScopeFilter = "all" | "health-enabled" | "health-failing" | "health-due";

export default function ServersPage() {
  const { error: showError, success } = useToast();
  const { confirm } = useConfirm();
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
  const [filteredServers, setFilteredServers] = useState<ServerType[]>([]);
  const [visibleServers, setVisibleServers] = useState<ServerType[]>([]);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedServerIds, setSelectedServerIds] = useState<Set<number>>(
    () => new Set(),
  );
  const [isBulkActionLoading, setIsBulkActionLoading] = useState(false);
  const [actionState, setActionState] = useState<{
    id: number;
    action: "activate" | "deactivate" | "health" | "deprecate";
  } | null>(null);
  const userId = user?.user_id;
  const headerCheckboxRef = useRef<HTMLInputElement | null>(null);

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
      showError(
        "Failed to load server analytics",
        (err as Error).message || "Please try again later.",
      );
    } finally {
      setIsLoadingStats(false);
    }
  }, [showError]);

  const loadServers = useCallback(async () => {
    setIsLoadingServers(true);
    try {
      let dataset: ServerType[] = [];
      const searchValue = debouncedSearchTerm.trim();
      const usingBackendSearch = scope === "all" && Boolean(searchValue);
      const listQuery = {
        limit: BASE_FETCH_LIMIT,
        offset: 0,
      };

      if (scope === "health-enabled") {
        dataset = await serverService.listHealthCheckEnabled();
      } else if (scope === "health-failing") {
        dataset = await serverService.listHealthCheckFailing();
      } else if (scope === "health-due") {
        dataset = await serverService.listHealthCheckDue();
      } else if (usingBackendSearch) {
        dataset = await serverService.searchServers({
          ...listQuery,
          searchTerm: searchValue,
        });
      } else if (statusFilter === "deprecated") {
        dataset = await serverService.getDeprecatedServers(listQuery);
      } else if (statusFilter === "active") {
        dataset = await serverService.getActiveServers(listQuery);
      } else if (environmentFilter !== "all") {
        dataset = await serverService.getServersByEnvironment(
          environmentFilter,
          listQuery,
        );
      } else if (protocolFilter !== "all") {
        dataset = await serverService.getServersByProtocol(
          protocolFilter,
          listQuery,
        );
      } else if (regionFilter !== "all") {
        dataset = await serverService.getServersByRegion(
          regionFilter,
          listQuery,
        );
      } else if (serverTypeFilter !== "all") {
        dataset = await serverService.getServersByType(
          serverTypeFilter,
          listQuery,
        );
      } else {
        const response = await serverService.listServers({
          ...listQuery,
          activeOnly: statusFilter === "inactive" ? false : undefined,
        });
        dataset = response.data || [];
      }

      setSourceServers(Array.isArray(dataset) ? dataset : []);
    } catch (err) {
      setSourceServers([]);
      showError(
        "Failed to load servers",
        (err as Error).message || "Unable to load server registry.",
      );
    } finally {
      setIsLoadingServers(false);
    }
  }, [
    scope,
    showError,
    debouncedSearchTerm,
    environmentFilter,
    protocolFilter,
    regionFilter,
    statusFilter,
    serverTypeFilter,
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
    setPage(1);
  }, [
    environmentFilter,
    protocolFilter,
    regionFilter,
    statusFilter,
    serverTypeFilter,
    debouncedSearchTerm,
    scope,
    sourceServers,
  ]);

  useEffect(() => {
    const usingBackendSearch = scope === "all" && Boolean(debouncedSearchTerm);

    const filtered = sourceServers.filter((server) => {
      if (
        environmentFilter !== "all" &&
        server.environment?.toLowerCase() !== environmentFilter.toLowerCase()
      ) {
        return false;
      }

      if (
        protocolFilter !== "all" &&
        server.protocol?.toLowerCase() !== protocolFilter.toLowerCase()
      ) {
        return false;
      }

      if (
        regionFilter !== "all" &&
        (server.region || "").toLowerCase() !== regionFilter.toLowerCase()
      ) {
        return false;
      }

      if (statusFilter === "active" && !server.is_active) {
        return false;
      }

      if (statusFilter === "inactive" && server.is_active) {
        return false;
      }

      if (statusFilter === "deprecated" && !server.is_deprecated) {
        return false;
      }

      if (
        debouncedSearchTerm &&
        !usingBackendSearch &&
        !`${server.name} ${server.code}`
          .toLowerCase()
          .includes(debouncedSearchTerm)
      ) {
        return false;
      }

      return true;
    });

    // Sort by created_at descending (newest first)
    const sorted = [...filtered].sort((a, b) => {
      const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return dateB - dateA; // Descending order (newest first)
    });

    setFilteredServers(sorted);
    setTotalCount(sorted.length);
  }, [
    sourceServers,
    environmentFilter,
    protocolFilter,
    regionFilter,
    statusFilter,
    debouncedSearchTerm,
  ]);

  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
    setPage((prev) => Math.min(prev, totalPages));
  }, [totalCount]);

  useEffect(() => {
    const start = (page - 1) * PAGE_SIZE;
    const slice = filteredServers.slice(start, start + PAGE_SIZE);
    setVisibleServers(slice);
  }, [filteredServers, page]);

  const visibleIds = useMemo(
    () => visibleServers.map((server) => server.id),
    [visibleServers],
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

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

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
        <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-black">
          <Shield size={14} />
          Disabled
        </span>
      );
    }

    // If health check is enabled but status is null, show null
    if (
      !server.last_health_check_status ||
      server.last_health_check_status === null
    ) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-black">
          <Shield size={14} />
          null
        </span>
      );
    }

    if (server.last_health_check_status === "unhealthy") {
      return (
        <span
          className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium text-black"
          style={{
            backgroundColor: "rgba(251,113,133,0.12)",
          }}
        >
          <AlertTriangle size={14} className="text-black" />
          Unhealthy
        </span>
      );
    }

    if (server.last_health_check_status === "healthy") {
      return (
        <span
          className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium text-black"
          style={{
            backgroundColor: "rgba(16,185,129,0.12)",
          }}
        >
          <Shield size={14} className="text-black" />
          Healthy
        </span>
      );
    }

    // Fallback for any other status values
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-black">
        <Shield size={14} />
        {server.last_health_check_status || "Unknown"}
      </span>
    );
  };

  const isEmptyState = !isLoadingServers && filteredServers.length === 0;

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

    const confirmed = await confirm({
      title: `${action === "activate" ? "Activate" : "Deactivate"} Servers`,
      message: `Apply the ${
        action === "activate" ? "activation" : "deactivation"
      } status to ${ids.length} selected server${ids.length === 1 ? "" : "s"}?`,
      type: action === "activate" ? "success" : "warning",
      confirmText: action === "activate" ? "Activate" : "Deactivate",
      cancelText: "Cancel",
    });

    if (!confirmed) return;

    if (!userId) {
      showError("Error", "User ID is required");
      return;
    }

    setIsBulkActionLoading(true);
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
      await loadServers();
      await loadStats();
    } catch (err) {
      showError(
        `Failed to ${
          action === "activate" ? "activate" : "deactivate"
        } servers`,
        err instanceof Error ? err.message : "Please try again.",
      );
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
    const confirmed = await confirm({
      title: `${action === "activate" ? "Activate" : "Deactivate"} Server`,
      message: `Are you sure you want to ${action} "${server.name}"?`,
      type: action === "activate" ? "success" : "warning",
      confirmText: action === "activate" ? "Activate" : "Deactivate",
      cancelText: "Cancel",
    });
    if (!confirmed) return;

    setActionState({ id: server.id, action });
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
      showError(
        `Failed to ${action} server`,
        err instanceof Error ? err.message : "Please try again.",
      );
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
    const confirmed = await confirm({
      title: `${nextAction === "deprecate" ? "Deprecate" : "Restore"} Server`,
      message: `Are you sure you want to ${nextAction} "${server.name}"?`,
      type: nextAction === "deprecate" ? "warning" : "info",
      confirmText: nextAction === "deprecate" ? "Deprecate" : "Restore",
      cancelText: "Cancel",
    });
    if (!confirmed) return;

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
      showError(
        `Failed to ${nextAction} server`,
        err instanceof Error ? err.message : "Please try again.",
      );
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
    const confirmed = await confirm({
      title: `${action === "enable" ? "Enable" : "Disable"} Health Checks`,
      message: `Are you sure you want to ${action} health monitoring for "${server.name}"?`,
      type: action === "enable" ? "success" : "warning",
      confirmText: action === "enable" ? "Enable" : "Disable",
      cancelText: "Cancel",
    });
    if (!confirmed) return;

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
      await loadServers();
      await loadStats(); // Refetch health stats to update the stat card
    } catch (err) {
      showError(
        `Failed to ${action} health checks`,
        err instanceof Error ? err.message : "Please try again.",
      );
    } finally {
      setActionState(null);
    }
  };

  const isServerActionInFlight = (
    serverId: number,
    actions: Array<"activate" | "deactivate" | "health" | "deprecate">,
  ) => actionState?.id === serverId && actions.includes(actionState.action);

  return (
    <div className="space-y-6 overflow-x-auto">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className={`${tw.mainHeading} ${tw.textPrimary}`}>
            {t.servers.title}
          </h1>
          <p className={`${tw.textSecondary} mt-2 text-sm`}>
            {t.servers.description}
          </p>
        </div>
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
                color: isSelectionMode ? "white" : color.primary.action,
                border: `1px solid ${color.primary.action}`,
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
          <PermissionGate permission="servers.create">
            <CreateButton route="/dashboard/servers/new" />
          </PermissionGate>
        </div>
      </div>

      <ServerStatsCards
        healthStats={healthStats}
        environmentCounts={environmentCounts}
        protocolCounts={protocolCounts}
        regionCounts={regionCounts}
        isLoading={isLoadingStats}
      />

      <div className="space-y-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
              aria-hidden
            />
            <input
              type="text"
              placeholder="Search by name or code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full ${tw.rounded} border border-gray-200 bg-white py-3 pl-10 pr-4 text-sm focus:border-gray-300 focus:outline-none focus:ring-0`}
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

      <div className={`${tw.rounded} border border-gray-200`}>
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
          <div className="overflow-x-auto">
            <table
              className="w-full min-w-[900px] text-sm"
              style={{ borderCollapse: "separate", borderSpacing: "0 8px" }}
            >
              <thead style={{ background: color.surface.tableHeader }}>
                <tr className="text-left text-xs uppercase tracking-wide text-black">
                  {isSelectionMode && (
                    <th
                      className="px-3 py-3 text-sm font-medium"
                      style={{
                        borderTopLeftRadius: "0.375rem",
                      }}
                    >
                      <input
                        ref={headerCheckboxRef}
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300 text-black focus:ring-black"
                        checked={allVisibleSelected}
                        onChange={toggleSelectAllVisible}
                        aria-label="Select visible servers"
                      />
                    </th>
                  )}
                  <th
                    className="px-4 sm:px-6 py-3 sm:py-4 text-sm font-medium"
                    style={{
                      ...(!isSelectionMode && {
                        borderTopLeftRadius: "0.375rem",
                      }),
                    }}
                  >
                    Server
                  </th>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-sm font-medium">
                    Code
                  </th>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-sm font-medium">
                    Environment
                  </th>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-sm font-medium">
                    Endpoint
                  </th>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-sm font-medium">
                    Health
                  </th>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-sm font-medium">
                    Status
                  </th>
                  <th
                    className="px-4 sm:px-6 py-3 sm:py-4 text-right text-sm font-medium"
                    style={{
                      borderTopRightRadius: "0.375rem",
                    }}
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {visibleServers.map((server) => {
                  const activationLoading = isServerActionInFlight(server.id, [
                    "activate",
                    "deactivate",
                  ]);
                  const healthLoading = isServerActionInFlight(server.id, [
                    "health",
                  ]);
                  const deprecateLoading = isServerActionInFlight(server.id, [
                    "deprecate",
                  ]);

                  return (
                    <tr key={server.id} className="transition-colors text-sm">
                      {isSelectionMode && (
                        <td
                          className="px-3 py-3"
                          style={{
                            backgroundColor: color.surface.tablebodybg,
                            borderTopLeftRadius: "0.375rem",
                            borderBottomLeftRadius: "0.375rem",
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={selectedServerIds.has(server.id)}
                            onChange={(event) => {
                              event.stopPropagation();
                              toggleServerSelection(server.id);
                            }}
                            aria-label={`Select ${server.name}`}
                            className="h-4 w-4 rounded border-gray-300 text-black focus:ring-black"
                          />
                        </td>
                      )}
                      <td
                        className="px-4 sm:px-6 py-3 sm:py-4 text-sm whitespace-nowrap"
                        style={{
                          backgroundColor: color.surface.tablebodybg,
                          ...(!isSelectionMode && {
                            borderTopLeftRadius: "0.375rem",
                            borderBottomLeftRadius: "0.375rem",
                          }),
                        }}
                      >
                        <button
                          type="button"
                          onClick={() =>
                            navigate(`/dashboard/servers/${server.id}`)
                          }
                          className="font-semibold text-black whitespace-nowrap"
                        >
                          {server.name}
                        </button>
                      </td>
                      <td
                        className="px-4 sm:px-6 py-3 sm:py-4 text-sm text-black whitespace-nowrap"
                        style={{ backgroundColor: color.surface.tablebodybg }}
                      >
                        <p className="text-sm text-black whitespace-nowrap">
                          {server.code || "—"}
                        </p>
                      </td>
                      <td
                        className="px-4 sm:px-6 py-3 sm:py-4 text-black text-sm whitespace-nowrap"
                        style={{ backgroundColor: color.surface.tablebodybg }}
                      >
                        <div className="whitespace-nowrap">
                          {server.environment
                            ? String(server.environment).replace(/_/g, " ")
                            : "—"}
                        </div>
                        {server.region && (
                          <p className="text-xs text-black whitespace-nowrap">
                            {String(server.region).replace(/_/g, " ")}
                          </p>
                        )}
                      </td>
                      <td
                        className="px-4 sm:px-6 py-3 sm:py-4 text-sm text-black whitespace-nowrap"
                        style={{ backgroundColor: color.surface.tablebodybg }}
                      >
                        <p className="text-sm text-black whitespace-nowrap">
                          {`${server.protocol}://${server.host}${
                            server.port ? `:${server.port}` : ""
                          }${server.base_path || ""}`.replace(/\/+$/, "")}
                        </p>
                        <p className="text-xs text-black whitespace-nowrap">
                          Timeout {server.timeout_seconds}s · Retries{" "}
                          {server.max_retries}
                        </p>
                      </td>
                      <td
                        className="px-4 sm:px-6 py-3 sm:py-4 text-sm"
                        style={{ backgroundColor: color.surface.tablebodybg }}
                      >
                        {renderHealthBadge(server)}
                      </td>
                      <td
                        className="px-4 sm:px-6 py-3 sm:py-4 text-sm whitespace-nowrap"
                        style={{ backgroundColor: color.surface.tablebodybg }}
                      >
                        <div className="flex flex-wrap gap-2">
                          <span
                            className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium text-white"
                            style={{
                              backgroundColor: color.primary.accent,
                            }}
                          >
                            {server.is_active ? "Active" : "Inactive"}
                          </span>
                          {server.is_deprecated && (
                            <span
                              className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium text-white"
                              style={{
                                backgroundColor: color.primary.accent,
                              }}
                            >
                              Deprecated
                            </span>
                          )}
                        </div>
                      </td>
                      <td
                        className="px-4 sm:px-6 py-3 sm:py-4 text-right"
                        style={{
                          backgroundColor: color.surface.tablebodybg,
                          borderTopRightRadius: "0.375rem",
                          borderBottomRightRadius: "0.375rem",
                        }}
                      >
                        <div className="flex items-center justify-end gap-1">
                          {/* View Details Button */}
                          <button
                            type="button"
                            onClick={() =>
                              navigate(`/dashboard/servers/${server.id}`)
                            }
                            className={`inline-flex items-center justify-center ${tw.rounded} p-2 text-black transition-colors hover:bg-gray-100`}
                            aria-label={`View ${server.name}`}
                            title="View details"
                          >
                            <Eye size={16} />
                          </button>

                          {/* Edit Button */}
                          <PermissionGate permission="servers.update">
                            <button
                              type="button"
                              onClick={(e) => handleEdit(server, e)}
                              className={`inline-flex items-center justify-center ${tw.rounded} p-2 text-black transition-colors hover:bg-gray-100`}
                              aria-label={`Edit ${server.name}`}
                              title="Edit server"
                            >
                              <Edit size={16} />
                            </button>
                          </PermissionGate>

                          {/* More Actions Menu */}
                          <div className="relative" ref={menuRef}>
                            <button
                              type="button"
                              onClick={(e) => {
                                const button = e.currentTarget;
                                if (openMenuId === server.id) {
                                  setOpenMenuId(null);
                                  setMenuPosition(null);
                                } else {
                                  setOpenMenuId(server.id);
                                  // Calculate menu position
                                  const buttonRect =
                                    button.getBoundingClientRect();
                                  setMenuPosition({
                                    top: buttonRect.bottom + 4,
                                    left: buttonRect.right - 160, // w-40 = 160px, align right
                                  });
                                }
                              }}
                              className={`inline-flex items-center justify-center ${tw.rounded} p-2 text-black transition-colors hover:bg-gray-100`}
                              aria-label={`More actions for ${server.name}`}
                              title="More actions"
                            >
                              <MoreVertical size={16} />
                            </button>

                            {/* Dropdown Menu - Using createPortal to avoid overflow issues */}
                            {openMenuId === server.id &&
                              menuPosition &&
                              createPortal(
                                <div
                                  ref={menuRef}
                                  className="fixed bg-white rounded shadow-lg border border-gray-200 w-40 py-1"
                                  style={{
                                    top: `${menuPosition.top}px`,
                                    left: `${menuPosition.left}px`,
                                    zIndex: zIndex.popover,
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {/* Health Check Option */}
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      handleHealthToggle(server, e);
                                      setOpenMenuId(null);
                                      setMenuPosition(null);
                                    }}
                                    disabled={healthLoading}
                                    className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 hover:bg-gray-100 transition-colors ${
                                      healthLoading ? "opacity-50" : ""
                                    } ${
                                      server.health_check_enabled
                                        ? "text-green-600"
                                        : "text-black"
                                    }`}
                                    title={
                                      server.health_check_enabled
                                        ? "Disable health checks"
                                        : "Enable health checks"
                                    }
                                  >
                                    {healthLoading ? (
                                      <Loader2
                                        size={14}
                                        className="animate-spin"
                                      />
                                    ) : (
                                      <HeartPulse size={14} />
                                    )}
                                    <span>
                                      {server.health_check_enabled
                                        ? "Disable Health"
                                        : "Enable Health"}
                                    </span>
                                  </button>

                                  {/* Deprecate Option */}
                                  <PermissionGate permission="servers.delete">
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        handleDeprecationToggle(server, e);
                                        setOpenMenuId(null);
                                        setMenuPosition(null);
                                      }}
                                      disabled={deprecateLoading}
                                      className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 hover:bg-gray-100 transition-colors border-t border-gray-100 ${
                                        deprecateLoading ? "opacity-50" : ""
                                      } text-purple-600`}
                                      title={
                                        server.is_deprecated
                                          ? "Undeprecate"
                                          : "Deprecate"
                                      }
                                    >
                                      {deprecateLoading ? (
                                        <Loader2
                                          size={14}
                                          className="animate-spin"
                                        />
                                      ) : server.is_deprecated ? (
                                        <RotateCcw size={14} />
                                      ) : (
                                        <Archive size={14} />
                                      )}
                                      <span>
                                        {server.is_deprecated
                                          ? "Undeprecate"
                                          : "Deprecate"}
                                      </span>
                                    </button>
                                  </PermissionGate>
                                </div>,
                                document.body,
                              )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {!isLoadingServers && filteredServers.length > 0 && (
        <Pagination
          currentPage={page}
          pageSize={PAGE_SIZE}
          totalItems={totalCount}
          onPageChange={(newPage) => setPage(newPage)}
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
