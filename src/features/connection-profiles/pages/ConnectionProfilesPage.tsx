import { createPortal } from "react-dom";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  BarChart3,
  CheckCircle,
  CheckSquare,
  Database,
  Edit,
  Eye,
  Filter,
  Loader2,
  Play,
  Plus,
  PowerOff,
  RefreshCw,
  Server,
  Shield,
  Square,
  X,
} from "lucide-react";
import SearchInput from "../../../shared/components/ui/SearchInput";
import { useToast } from "../../../contexts/ToastContext";
import { useConfirm } from "../../../contexts/ConfirmContext";
import { useAuth } from "../../../contexts/AuthContext";
import { useLanguage } from "../../../contexts/LanguageContext";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import Pagination from "../../../shared/components/ui/Pagination";
import CreateButton from "../../../shared/components/ui/CreateButton";
import { color, tw, zIndex } from "../../../shared/utils/utils";
import { connectionProfileService } from "../services/connectionProfileService";
import {
  ConnectionProfileEnvironmentStatsItem,
  ConnectionProfileSearchQuery,
  ConnectionProfileType,
  ConnectionProfileTypeStatsItem,
} from "../types/connectionProfile";
import { PermissionGate } from "../../auth/components/PermissionGate";
import Checkbox from "../../../shared/components/ui/Checkbox";

type StatusFilter = "all" | "active" | "inactive" | "expired";
type PiiFilter = "all" | "with" | "without";
type HealthFilter = "all" | "enabled" | "disabled";

const DEFAULT_FETCH_LIMIT = 100;

const CLASSIFICATION_OPTIONS = [
  "public",
  "internal",
  "confidential",
  "restricted",
];

const ENVIRONMENT_FALLBACKS = ["dev", "staging", "production"];

const VALID_ENVIRONMENTS = ["dev", "staging", "production"];

const DEFAULT_FILTERS = {
  connectionType: "all",
  environment: "all",
  classification: "all",
  status: "all" as StatusFilter,
  pii: "all" as PiiFilter,
  health: "all" as HealthFilter,
};

export default function ConnectionProfilesPage() {
  const navigate = useNavigate();
  const { error: showError, success: showSuccess } = useToast();
  const { confirm } = useConfirm();
  const { user } = useAuth();
  const { t } = useLanguage();

  const [profiles, setProfiles] = useState<ConnectionProfileType[]>([]);
  const [filteredProfiles, setFilteredProfiles] = useState<
    ConnectionProfileType[]
  >([]);
  const [loadingProfiles, setLoadingProfiles] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);
  const [connectionTypeStats, setConnectionTypeStats] = useState<
    ConnectionProfileTypeStatsItem[]
  >([]);
  const [environmentStats, setEnvironmentStats] = useState<
    ConnectionProfileEnvironmentStatsItem[]
  >([]);
  const [statsSummary, setStatsSummary] = useState({
    total: 0,
    active: 0,
    withPii: 0,
    healthEnabled: 0,
  });
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);
  const [closingFiltersPanel, setClosingFiltersPanel] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [serverFilter, setServerFilter] = useState("");
  const [debouncedServerFilter, setDebouncedServerFilter] = useState("");
  const [selectedProfileIds, setSelectedProfileIds] = useState<Set<number>>(
    new Set(),
  );
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [bulkActionType, setBulkActionType] = useState<
    "activate" | "auto" | null
  >(null);

  const [filters, setFilters] = useState({ ...DEFAULT_FILTERS });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalProfiles, setTotalProfiles] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const openFiltersPanel = () => setShowFiltersPanel(true);

  const closeFiltersPanel = () => {
    setClosingFiltersPanel(true);
    setTimeout(() => {
      setShowFiltersPanel(false);
      setClosingFiltersPanel(false);
    }, 250);
  };

  const handleApplyFilters = () => {
    closeFiltersPanel();
  };

  const handleClearFilters = () => {
    setFilters({ ...DEFAULT_FILTERS });
    setServerFilter("");
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm.trim().toLowerCase());
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedServerFilter(serverFilter.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [serverFilter]);

  const reloadProfiles = useCallback(async () => {
    try {
      setLoadingProfiles(true);
      let data: ConnectionProfileType[] = [];
      let paginationMetadata: any = null;
      const serverId = debouncedServerFilter
        ? Number(debouncedServerFilter)
        : null;
      const offset = (currentPage - 1) * pageSize;
      const shouldUseSearch = Boolean(
        debouncedSearchTerm ||
        filters.status === "inactive" ||
        filters.status === "active" ||
        filters.pii !== "all" ||
        filters.health !== "all",
      );

      if (filters.connectionType !== "all") {
        const response =
          await connectionProfileService.getProfilesByConnectionType(
            filters.connectionType,
            { limit: pageSize, offset, skipCache: true },
          );
        data = Array.isArray(response?.data) ? response.data : Array.isArray(response) ? response : [];
        paginationMetadata = response?.pagination;
      } else if (
        filters.environment !== "all" &&
        VALID_ENVIRONMENTS.includes(filters.environment)
      ) {
        const response =
          await connectionProfileService.getProfilesByEnvironment(
            filters.environment,
            { limit: pageSize, offset, skipCache: true },
          );
        data = Array.isArray(response?.data) ? response.data : Array.isArray(response) ? response : [];
        paginationMetadata = response?.pagination;
      } else if (filters.classification !== "all") {
        const response =
          await connectionProfileService.getProfilesByClassification(
            filters.classification,
            { limit: pageSize, offset, skipCache: true },
          );
        data = Array.isArray(response?.data) ? response.data : Array.isArray(response) ? response : [];
        paginationMetadata = response?.pagination;
      } else if (serverId) {
        const response =
          await connectionProfileService.getProfilesByServer(serverId, {
            limit: pageSize,
            offset,
            skipCache: true,
          });
        data = Array.isArray(response?.data) ? response.data : Array.isArray(response) ? response : [];
        paginationMetadata = response?.pagination;
      } else if (filters.status === "expired") {
        const response = await connectionProfileService.getExpiredProfiles(true);
        data = Array.isArray(response?.data) ? response.data : Array.isArray(response) ? response : [];
      } else if (shouldUseSearch) {
        const searchPayload: ConnectionProfileSearchQuery = {
          limit: pageSize,
          offset,
          skipCache: true,
        };
        if (debouncedSearchTerm) {
          searchPayload.profile_name = debouncedSearchTerm;
          searchPayload.profile_code = debouncedSearchTerm;
        }
        if (filters.connectionType !== "all") {
          searchPayload.connection_type = filters.connectionType;
        }
        if (
          filters.environment !== "all" &&
          VALID_ENVIRONMENTS.includes(filters.environment)
        ) {
          searchPayload.environment = filters.environment;
        }
        if (filters.classification !== "all") {
          searchPayload.data_classification = filters.classification;
        }
        if (filters.status === "active") {
          searchPayload.is_active = true;
        }
        if (filters.status === "inactive") {
          searchPayload.is_active = false;
        }
        if (filters.pii === "with") {
          searchPayload.contains_pii = true;
        }
        if (filters.pii === "without") {
          searchPayload.contains_pii = false;
        }
        if (filters.health === "enabled") {
          searchPayload.health_check_enabled = true;
        }
        if (filters.health === "disabled") {
          searchPayload.health_check_enabled = false;
        }
        const response =
          await connectionProfileService.searchProfiles(searchPayload);
        data = Array.isArray(response.data) ? response.data : [];
        paginationMetadata = response.pagination;
      } else {
        const response = await connectionProfileService.listProfiles({
          limit: pageSize,
          offset,
          skipCache: true,
        });
        data = Array.isArray(response.data) ? response.data : [];
        paginationMetadata = response.pagination;
      }

      // Extract pagination metadata
      if (paginationMetadata) {
        setTotalProfiles(paginationMetadata.total || 0);
        setHasMore(paginationMetadata.hasMore || false);
      } else {
        setTotalProfiles(data.length);
        setHasMore(false);
      }

      setProfiles(data);
      setStatsSummary((prev) => ({
        ...prev,
        total: data.length,
        active: data.filter((profile) => profile.is_active).length,
      }));
      setSelectedProfileIds(new Set());
    } catch (err) {
      console.error("Failed to load connection profiles", err);
      showError(
        t.analytics?.["failed_to_load"] || "Failed to load connection profiles",
        err instanceof Error
          ? err.message
          : t.common?.["try_again_later"] || "Please try again later.",
      );
      setProfiles([]);
    } finally {
      setLoadingProfiles(false);
    }
  }, [
    debouncedSearchTerm,
    debouncedServerFilter,
    filters.connectionType,
    filters.environment,
    filters.classification,
    filters.status,
    filters.pii,
    filters.health,
    showError,
    t,
    currentPage,
    pageSize,
  ]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [
    debouncedSearchTerm,
    debouncedServerFilter,
    filters.connectionType,
    filters.environment,
    filters.classification,
    filters.status,
    filters.pii,
    filters.health,
  ]);

  useEffect(() => {
    reloadProfiles();
  }, [reloadProfiles]);

  const loadStats = useCallback(async () => {
    try {
      setLoadingStats(true);
      const [
        connectionTypes,
        environments,
        governance,
        activeProfiles,
        piiProfiles,
        healthProfiles,
      ] = await Promise.all([
        connectionProfileService.getConnectionTypeStats(),
        connectionProfileService.getEnvironmentStats(),
        connectionProfileService.getDataGovernanceStats(),
        connectionProfileService.getActiveProfiles(true),
        connectionProfileService.getProfilesWithPii(true),
        connectionProfileService.getHealthCheckEnabledProfiles(true),
      ]);

      setConnectionTypeStats(connectionTypes || []);
      setEnvironmentStats(environments || []);
      setStatsSummary((prev) => ({
        ...prev,
        total:
          governance?.total ??
          prev.total ??
          (governance?.classificationCounts
            ? Object.values(governance.classificationCounts).reduce(
                (sum, count) => sum + (Number(count) || 0),
                0,
              )
            : prev.total),
        active: activeProfiles?.length ?? prev.active,
        withPii: piiProfiles?.length ?? prev.withPii,
        healthEnabled: healthProfiles?.length ?? prev.healthEnabled,
      }));
    } catch (err) {
      console.error("Failed to load connection profile stats", err);
      showError(
        t.analytics?.["failed_to_load"] || "Failed to load stats",
        err instanceof Error
          ? err.message
          : t.common?.["try_again_later"] || "Please try again later.",
      );
    } finally {
      setLoadingStats(false);
    }
  }, [showError, t]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  useEffect(() => {
    if (!profiles.length) {
      setFilteredProfiles([]);
      return;
    }

    const now = new Date();
    const matchesFilters = (profile: ConnectionProfileType) => {
      const searchHaystack = `${profile.profile_name ?? ""} ${
        profile.profile_code ?? ""
      } ${profile.connection_type ?? ""}`.toLowerCase();
      if (
        debouncedSearchTerm &&
        !searchHaystack.includes(debouncedSearchTerm)
      ) {
        return false;
      }

      if (
        filters.connectionType !== "all" &&
        profile.connection_type !== filters.connectionType
      ) {
        return false;
      }

      if (
        filters.environment !== "all" &&
        profile.environment !== filters.environment
      ) {
        return false;
      }

      if (
        filters.classification !== "all" &&
        profile.data_classification !== filters.classification
      ) {
        return false;
      }

      const validTo = profile.valid_to ? new Date(profile.valid_to) : null;
      const isExpired = validTo ? validTo < now : false;

      if (filters.status === "active" && (!profile.is_active || isExpired)) {
        return false;
      }
      if (filters.status === "inactive" && profile.is_active) {
        return false;
      }
      if (filters.status === "expired" && !isExpired) {
        return false;
      }

      if (filters.pii === "with" && !profile.contains_pii) {
        return false;
      }
      if (filters.pii === "without" && profile.contains_pii) {
        return false;
      }

      if (filters.health === "enabled" && !profile.health_check_enabled) {
        return false;
      }
      if (filters.health === "disabled" && profile.health_check_enabled) {
        return false;
      }

      return true;
    };

    setFilteredProfiles(profiles.filter(matchesFilters));
  }, [profiles, debouncedSearchTerm, filters]);

  const handleCreate = () => {
    navigate("/dashboard/connection-profiles/new");
  };

  const handleView = (id: number) => {
    navigate(`/dashboard/connection-profiles/${id}`);
  };

  const handleEdit = (id: number) => {
    navigate(`/dashboard/connection-profiles/${id}/edit`);
  };

  const handleToggleActive = async (
    profile: ConnectionProfileType,
    event?: React.MouseEvent,
  ) => {
    event?.stopPropagation();
    const action = profile.is_active ? "deactivate" : "activate";
    const confirmed = await confirm({
      title: `${action === "activate" ? "Activate" : "Deactivate"} Profile`,
      message: `Are you sure you want to ${action} "${profile.profile_name}"?`,
      type: action === "activate" ? "success" : "warning",
      confirmText: action === "activate" ? "Activate" : "Deactivate",
      cancelText: "Cancel",
    });
    if (!confirmed) return;

    try {
      if (action === "activate") {
        await connectionProfileService.activateProfile(
          profile.id,
          user?.user_id,
        );
        showSuccess(
          "Profile activated",
          `${profile.profile_name} is now active.`,
        );
      } else {
        await connectionProfileService.deactivateProfile(
          profile.id,
          user?.user_id,
        );
        showSuccess(
          "Profile deactivated",
          `${profile.profile_name} is now inactive.`,
        );
      }
      await reloadProfiles();
      await loadStats();
    } catch (err) {
      showError(
        `Failed to ${action} profile`,
        err instanceof Error ? err.message : "Please try again.",
      );
    }
  };

  const selectedCount = selectedProfileIds.size;

  const toggleProfileSelection = (id: number) => {
    setSelectedProfileIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleBulkActivateSelected = async () => {
    if (!selectedProfileIds.size) {
      return;
    }
    setBulkActionType("activate");
    setBulkActionLoading(true);
    try {
      await connectionProfileService.bulkActivateProfiles({
        profile_ids: Array.from(selectedProfileIds).slice(0, 50),
      });
      showSuccess("Selected profiles activated");
      await reloadProfiles();
      await loadStats();
    } catch (err) {
      showError(
        "Failed to activate selected profiles",
        err instanceof Error ? err.message : "Please try again later.",
      );
    } finally {
      setBulkActionType(null);
      setBulkActionLoading(false);
    }
  };

  const handleAutoDeactivateExpired = async () => {
    setBulkActionType("auto");
    setBulkActionLoading(true);
    try {
      await connectionProfileService.autoDeactivateExpired();
      showSuccess("Expired profiles queued for deactivation");
      await reloadProfiles();
      await loadStats();
    } catch (err) {
      showError(
        "Failed to auto-deactivate expired profiles",
        err instanceof Error ? err.message : "Please try again later.",
      );
    } finally {
      setBulkActionType(null);
      setBulkActionLoading(false);
    }
  };

  const formatNumber = (value?: number | null) =>
    typeof value === "number" ? value.toLocaleString() : "--";

  const connectionTypeOptions = useMemo(() => {
    const typesFromStats = connectionTypeStats.map(
      (item) => item.connection_type,
    );
    const typesFromProfiles = Array.from(
      new Set(profiles.map((profile) => profile.connection_type)),
    );
    return Array.from(
      new Set([...typesFromStats, ...typesFromProfiles]),
    ).filter(Boolean);
  }, [connectionTypeStats, profiles]);

  const environmentOptions = useMemo(() => {
    const fromStats = environmentStats.map((item) => item.environment);
    const fromProfiles = Array.from(
      new Set(profiles.map((profile) => profile.environment)),
    );
    const combined = Array.from(new Set([...fromStats, ...fromProfiles]));
    // Filter to only include valid environments
    const validCombined = combined.filter((env) =>
      VALID_ENVIRONMENTS.includes(env),
    );
    return validCombined.length ? validCombined : ENVIRONMENT_FALLBACKS;
  }, [environmentStats, profiles]);

  const getStatusBadge = (profile: ConnectionProfileType) => {
    const now = new Date();
    const validTo = profile.valid_to ? new Date(profile.valid_to) : null;
    const expired = validTo ? validTo < now : false;

    if (!profile.is_active) {
      return <span className="text-sm font-medium text-black">Inactive</span>;
    }

    if (expired) {
      return <span className="text-sm font-medium text-black">Expired</span>;
    }

    if (profile.last_health_check_status === "unhealthy") {
      return <span className="text-sm font-medium text-black">Unhealthy</span>;
    }

    return <span className="text-sm font-medium text-black">Active</span>;
  };

  const statsCards = [
    {
      name: "Total Profiles",
      value: formatNumber(statsSummary.total),
      icon: Database,
      color: color.primary.accent,
    },
    {
      name: "Active Profiles",
      value: formatNumber(statsSummary.active),
      icon: CheckCircle,
      color: color.tertiary.tag4,
    },
    {
      name: "With PII",
      value: formatNumber(statsSummary.withPii),
      icon: Shield,
      color: color.tertiary.tag3,
    },
    {
      name: "Health Enabled",
      value: formatNumber(statsSummary.healthEnabled),
      icon: Activity,
      color: color.primary.accent,
    },
  ];

  const renderEmptyState = () => (
    <div
      className={`${tw.rounded} shadow-sm border border-gray-200 text-center py-16 px-4`}
      style={{ backgroundColor: color.surface.cards }}
    >
      <Server className="w-16 h-16 text-gray-300 mx-auto mb-4" />
      <h3 className={`${tw.cardHeading} text-gray-900 mb-1`}>
        No connection profiles found
      </h3>
      <p className="text-sm text-gray-500 mb-6">
        {profiles.length
          ? "Try adjusting your filters"
          : "Create your first connection profile to get started"}
      </p>
      {!profiles.length && (
        <PermissionGate permission="connection-profiles.create">
          <CreateButton route="/dashboard/connection-profiles/new" />
        </PermissionGate>
      )}
    </div>
  );

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div>
            <h1 className={`${tw.mainHeading} ${tw.textPrimary}`}>
              Connection Profiles
            </h1>
            <p className={`${tw.textSecondary} mt-2 text-sm`}>
              Manage secure connections, performance tuning, and governance
              controls for every integration endpoint
            </p>
          </div>
          <div className="flex gap-3 flex-wrap">
            <PermissionGate permission="connection-profiles.select">
              <button
                onClick={() => {
                  if (!isSelectionMode) {
                    // Entering selection mode - select all visible profiles
                    setIsSelectionMode(true);
                    setSelectedProfileIds(
                      new Set(filteredProfiles.map((p) => p.id)),
                    );
                  } else {
                    // Exiting selection mode - clear selection
                    setIsSelectionMode(false);
                    setSelectedProfileIds(new Set());
                  }
                }}
                className={`inline-flex items-center gap-2 ${tw.rounded} px-4 py-2 text-sm font-medium focus:outline-none transition-colors whitespace-nowrap`}
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
                {isSelectionMode ? "Cancel Selection" : "Select Profiles"}
              </button>
            </PermissionGate>
            <button
              onClick={() =>
                navigate("/dashboard/connection-profiles/analytics")
              }
              className={`inline-flex items-center gap-2 ${tw.rounded} px-4 py-2 text-sm font-medium focus:outline-none transition-colors whitespace-nowrap`}
              style={{
                backgroundColor: "transparent",
                color: color.primary.action,
                border: `1px solid ${color.primary.action}`,
              }}
            >
              <BarChart3 className="h-4 w-4" />
              Analytics
            </button>
            <PermissionGate permission="connection-profiles.create">
              <CreateButton route="/dashboard/connection-profiles/new" />
            </PermissionGate>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statsCards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.name}
                className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}
              >
                <div className="flex items-center gap-2">
                  <Icon className="h-5 w-5" style={{ color: card.color }} />
                  <p className="text-sm font-medium text-black">{card.name}</p>
                </div>
                <p className="mt-2 text-3xl font-bold text-black">
                  {loadingStats ? "..." : card.value}
                </p>
              </div>
            );
          })}
        </div>

        {isSelectionMode && selectedProfileIds.size > 0 && (
          <div
            className={`${tw.rounded} border border-gray-200 bg-white px-4 py-3 shadow-sm flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between`}
          >
            <div className="flex items-center gap-3 text-sm text-black">
              <span>
                {selectedCount} selected / {filteredProfiles.length} visible
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <button
                type="button"
                onClick={handleBulkActivateSelected}
                disabled={!selectedCount || bulkActionLoading}
                className={`inline-flex items-center gap-2 px-4 py-2 ${tw.rounded} text-white disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap`}
                style={{ backgroundColor: color.primary.action }}
              >
                {bulkActionLoading && bulkActionType === "activate" && (
                  <Loader2 className="w-4 h-4 animate-spin" />
                )}
                Activate
              </button>
              <button
                type="button"
                onClick={handleAutoDeactivateExpired}
                disabled={bulkActionLoading}
                className={`inline-flex items-center gap-2 px-4 py-2 ${tw.rounded} border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap`}
              >
                {bulkActionLoading && bulkActionType === "auto" ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                Auto Deactivate Expired
              </button>
            </div>
          </div>
        )}

        {/* Search & Filters */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <SearchInput
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Search by profile name, code, or type..."
            />
            <HeadlessSelect
              options={[
                { value: "all", label: "All Status" },
                { value: "active", label: "Active" },
                { value: "inactive", label: "Inactive" },
                { value: "expired", label: "Expired" },
              ]}
              value={filters.status}
              onChange={(value) =>
                setFilters((prev) => ({
                  ...prev,
                  status: (value || "all") as StatusFilter,
                }))
              }
              className="whitespace-nowrap"
            />
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={openFiltersPanel}
                className={`flex items-center gap-2 px-4 py-2 text-sm text-gray-700 bg-gray-100 ${tw.rounded} whitespace-nowrap`}
              >
                <Filter className="w-4 h-4" />
                Filters
              </button>
            </div>
          </div>
        </div>

        {/* Profiles */}
        {loadingProfiles ? (
          <div className="flex flex-col items-center justify-center py-16">
            <LoadingSpinner
              variant="modern"
              size="xl"
              color="primary"
              className="mb-4"
            />
            <p className={`${tw.textMuted} font-medium`}>
              Loading connection profiles...
            </p>
          </div>
        ) : filteredProfiles.length === 0 ? (
          renderEmptyState()
        ) : (
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <table
              className="w-full min-w-[1000px] text-sm"
              style={{ borderCollapse: "separate", borderSpacing: "0 8px" }}
            >
              <thead style={{ background: color.surface.tableHeader }}>
                <tr className="text-left text-sm uppercase tracking-wide text-black">
                  {isSelectionMode && (
                    <th
                      className="px-3 py-3 text-sm font-medium whitespace-nowrap"
                      style={{ borderTopLeftRadius: "0.375rem" }}
                    >
                      <div
                        className="flex items-center gap-2 cursor-pointer"
                        onClick={() => {
                          if (selectedProfileIds.size > 0 && selectedProfileIds.size === filteredProfiles.length) {
                            setSelectedProfileIds(new Set());
                          } else {
                            setSelectedProfileIds(
                              new Set(filteredProfiles.map((p) => p.id)),
                            );
                          }
                        }}
                      >
                        <Checkbox
                          id="select-all-profiles"
                          checked={
                            selectedProfileIds.size > 0 &&
                            selectedProfileIds.size === filteredProfiles.length
                          }
                          onChange={() => {
                            if (selectedProfileIds.size > 0 && selectedProfileIds.size === filteredProfiles.length) {
                              setSelectedProfileIds(new Set());
                            } else {
                              setSelectedProfileIds(
                                new Set(filteredProfiles.map((p) => p.id)),
                              );
                            }
                          }}
                        />
                      </div>
                    </th>
                  )}
                  <th
                    className="px-4 sm:px-6 py-3 sm:py-4 text-sm font-medium whitespace-nowrap"
                    style={{
                      ...(!isSelectionMode && {
                        borderTopLeftRadius: "0.375rem",
                      }),
                    }}
                  >
                    Profile Name
                  </th>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-sm font-medium whitespace-nowrap">
                    Code
                  </th>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-sm font-medium whitespace-nowrap">
                    Type
                  </th>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-sm font-medium whitespace-nowrap">
                    Environment
                  </th>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-sm font-medium whitespace-nowrap">
                    Classification
                  </th>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-sm font-medium whitespace-nowrap">
                    Status
                  </th>
                  <th
                    className="px-4 sm:px-6 py-3 sm:py-4 text-right text-sm font-medium whitespace-nowrap"
                    style={{ borderTopRightRadius: "0.375rem" }}
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredProfiles.map((profile) => {
                  const isSelected = selectedProfileIds.has(profile.id);
                  return (
                    <tr
                      key={profile.id}
                      className="transition-colors text-sm"
                      style={{ backgroundColor: color.surface.tablebodybg }}
                    >
                      {isSelectionMode && (
                        <td
                          className="px-3 py-3 whitespace-nowrap"
                          style={{
                            borderTopLeftRadius: "0.375rem",
                            borderBottomLeftRadius: "0.375rem",
                          }}
                        >
                          <div
                            className="flex items-center gap-2 cursor-pointer"
                            onClick={() => toggleProfileSelection(profile.id)}
                          >
                            <Checkbox
                              id={`profile-${profile.id}`}
                              checked={isSelected}
                              onChange={() => toggleProfileSelection(profile.id)}
                            />
                          </div>
                        </td>
                      )}
                      <td
                        className="px-4 sm:px-6 py-4 whitespace-nowrap"
                        style={{
                          ...(!isSelectionMode && {
                            borderTopLeftRadius: "0.375rem",
                            borderBottomLeftRadius: "0.375rem",
                          }),
                        }}
                      >
                        <span className="font-medium text-black">
                          {profile.profile_name}
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-black">
                        {profile.profile_code}
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-black">
                        {profile.connection_type}
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-black">
                        {profile.environment}
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-black">
                        {profile.data_classification}
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(profile)}
                      </td>
                      <td
                        className="px-4 sm:px-6 py-4 whitespace-nowrap text-right"
                        style={{
                          borderTopRightRadius: "0.375rem",
                          borderBottomRightRadius: "0.375rem",
                        }}
                      >
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleView(profile.id)}
                            className={`p-2 hover:bg-gray-100 ${tw.rounded} transition-colors`}
                            title="View Details"
                          >
                            <Eye className="w-4 h-4 text-black" />
                          </button>
                          <PermissionGate permission="connection-profiles.update">
                            <button
                              onClick={() => handleEdit(profile.id)}
                              className={`p-2 hover:bg-gray-100 ${tw.rounded} transition-colors`}
                              title="Edit"
                            >
                              <Edit className="w-4 h-4 text-black" />
                            </button>
                          </PermissionGate>
                          <PermissionGate permission="connection-profiles.update">
                            <button
                              onClick={(e) => handleToggleActive(profile, e)}
                              className={`p-2 hover:bg-gray-100 ${tw.rounded} transition-colors`}
                              title={
                                profile.is_active ? "Deactivate" : "Activate"
                              }
                            >
                              {profile.is_active ? (
                                <PowerOff className="w-4 h-4 text-red-600" />
                              ) : (
                                <Play className="w-4 h-4 text-black" />
                              )}
                            </button>
                          </PermissionGate>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {/* Pagination Controls */}
            {filteredProfiles.length > 0 && (
              <Pagination
                currentPage={currentPage}
                pageSize={pageSize}
                totalItems={filteredProfiles.length}
                onPageChange={setCurrentPage}
              />
            )}
          </div>
        )}
      </div>

      {(showFiltersPanel || closingFiltersPanel) &&
        createPortal(
          <div style={{ position: "fixed", inset: 0, zIndex: zIndex.modal }}>
            <div
              className="absolute inset-0 bg-black bg-opacity-50"
              onClick={closeFiltersPanel}
            />
            <div
              className={`absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl transform transition-transform duration-300 ${
                closingFiltersPanel ? "translate-x-full" : "translate-x-0"
              }`}
              style={{ zIndex: zIndex.popover }}
            >
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  Filter Profiles
                </h3>
                <button
                  type="button"
                  onClick={closeFiltersPanel}
                  className="text-gray-500 hover:text-gray-800 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
              <div className="p-4 space-y-4 overflow-y-auto h-[calc(100%-120px)]" style={{ position: "relative", zIndex: zIndex.popover }}>
                <div style={{ position: "relative", zIndex: zIndex.popover }}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <HeadlessSelect
                    options={[
                      { value: "all", label: "All Status" },
                      { value: "active", label: "Active" },
                      { value: "inactive", label: "Inactive" },
                      { value: "expired", label: "Expired" },
                    ]}
                    value={filters.status}
                    onChange={(value) =>
                      setFilters((prev) => ({
                        ...prev,
                        status: (value || "all") as StatusFilter,
                      }))
                    }
                  />
                </div>
                <div style={{ position: "relative", zIndex: zIndex.popover }}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Connection Type
                  </label>
                  <HeadlessSelect
                    options={[
                      { value: "all", label: "All Connection Types" },
                      ...connectionTypeOptions.map((type) => ({
                        value: type,
                        label: type,
                      })),
                    ]}
                    value={filters.connectionType}
                    onChange={(value) =>
                      setFilters((prev) => ({
                        ...prev,
                        connectionType: String(value || "all"),
                      }))
                    }
                  />
                </div>
                <div style={{ position: "relative", zIndex: zIndex.popover }}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Environment
                  </label>
                  <HeadlessSelect
                    options={[
                      { value: "all", label: "All Environments" },
                      ...environmentOptions.map((env) => ({
                        value: env,
                        label: env,
                      })),
                    ]}
                    value={filters.environment}
                    onChange={(value) =>
                      setFilters((prev) => ({
                        ...prev,
                        environment: String(value || "all"),
                      }))
                    }
                  />
                </div>
                <div style={{ position: "relative", zIndex: zIndex.popover }}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Data Classification
                  </label>
                  <HeadlessSelect
                    options={[
                      { value: "all", label: "All Classifications" },
                      ...CLASSIFICATION_OPTIONS.map((classification) => ({
                        value: classification,
                        label: classification,
                      })),
                    ]}
                    value={filters.classification}
                    onChange={(value) =>
                      setFilters((prev) => ({
                        ...prev,
                        classification: String(value || "all"),
                      }))
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Server ID
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={serverFilter}
                    onChange={(e) => setServerFilter(e.target.value)}
                    placeholder="Enter server ID"
                    className={`w-full px-3 py-2 border border-gray-300 ${tw.rounded} focus:outline-none text-sm`}
                  />
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div style={{ position: "relative", zIndex: zIndex.popover }}>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      PII
                    </label>
                    <HeadlessSelect
                      options={[
                        { value: "all", label: "Any" },
                        { value: "with", label: "Contains PII" },
                        { value: "without", label: "No PII" },
                      ]}
                      value={filters.pii}
                      onChange={(value) =>
                        setFilters((prev) => ({
                          ...prev,
                          pii: (value || "all") as PiiFilter,
                        }))
                      }
                    />
                  </div>
                  <div style={{ position: "relative", zIndex: zIndex.popover }}>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Health Checks
                    </label>
                    <HeadlessSelect
                      options={[
                        { value: "all", label: "Any" },
                        { value: "enabled", label: "Enabled" },
                        { value: "disabled", label: "Disabled" },
                      ]}
                      value={filters.health}
                      onChange={(value) =>
                        setFilters((prev) => ({
                          ...prev,
                          health: (value || "all") as HealthFilter,
                        }))
                      }
                    />
                  </div>
                </div>
              </div>
              <div className="p-4 border-t border-gray-200 flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className={`px-4 py-2 text-sm text-gray-700 border border-gray-300 ${tw.rounded} hover:bg-gray-50 transition-colors`}
                >
                  Clear Filters
                </button>
                <button
                  type="button"
                  onClick={handleApplyFilters}
                  className={`px-4 py-2 text-sm text-white ${tw.rounded}`}
                  style={{ backgroundColor: color.primary.action }}
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
