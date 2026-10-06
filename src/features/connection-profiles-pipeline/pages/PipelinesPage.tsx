import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Eye, GitBranch } from "lucide-react";
import BackButton from "../../../shared/components/ui/BackButton";
import FeatureActionButton from "../../../shared/components/FeatureActionButton";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import Pagination from "../../../shared/components/ui/Pagination";
import SearchInput from "../../../shared/components/ui/SearchInput";
import { Table, useTable, type TableColumn } from "../../../shared/components/Table";
import { useToast } from "../../../contexts/ToastContext";
import { color, tw } from "../../../shared/utils/utils";
import { extractBackendError } from "../../../shared/utils/errorHandler";
import { connectionProfileService } from "../../connection-profiles/services/connectionProfileService";
import { ConnectionProfileType } from "../../connection-profiles/types/connectionProfile";
import {
  ACTION_TYPE_OPTIONS,
  labelFor,
  LOAD_STRATEGY_OPTIONS,
  SOURCE_TYPE_OPTIONS,
} from "../constants/pipelineOptions";
import { useProfilesByConnectionType } from "../hooks/useProfilesByConnectionType";
import { connectionProfilePipelineService } from "../services/pipelineService";
import { ConnectionProfilePipeline } from "../types/pipeline";
import { describeStoredSchedule } from "../utils/pipelineSchedule";
import {
  connectionTypeLabel,
  matchingConnectionTypeValue,
  normalizeConnectionType,
  profileFilterMessage,
  profileSelectOptions,
} from "../utils/connectionTypeCatalog";

export default function PipelinesPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { error: showError } = useToast();

  const profileIdParam = searchParams.get("profileId") || "all";
  const connectionTypeParam = searchParams.get("connectionType") || "";
  const [pipelines, setPipelines] = useState<ConnectionProfilePipeline[]>([]);
  const [pinnedProfiles, setPinnedProfiles] = useState<ConnectionProfileType[]>([]);
  const [namedProfiles, setNamedProfiles] = useState<ConnectionProfileType[]>([]);
  const [namesResolved, setNamesResolved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const {
    typeOptions,
    typesLoading,
    profiles,
    profilesLoading,
    profilesLoaded,
    profilesTruncated,
    isSearching,
    searchApplied,
    catalogCount,
    onProfileSearch,
  } = useProfilesByConnectionType(connectionTypeParam, pinnedProfiles);

  const profileNameById = useMemo(() => {
    const names = new Map<number, string>();
    profiles.forEach((profile) => names.set(profile.id, profile.profile_name));
    namedProfiles.forEach((profile) => names.set(profile.id, profile.profile_name));
    pipelines.forEach((pipeline) => {
      if (pipeline.profile_name) {
        names.set(pipeline.connection_profile_id, pipeline.profile_name);
      }
    });
    pinnedProfiles.forEach((profile) => names.set(profile.id, profile.profile_name));
    return names;
  }, [namedProfiles, pinnedProfiles, pipelines, profiles]);

  const profileIdsOfType = useMemo(
    () => new Set(profiles.map((profile) => profile.id)),
    [profiles],
  );

  const profileOptions = useMemo(() => {
    if (!connectionTypeParam) {
      if (profileIdParam === "all") return [];
      return [
        {
          value: profileIdParam,
          label:
            profileNameById.get(Number(profileIdParam)) ||
            `Profile #${profileIdParam}`,
        },
      ];
    }

    const options = [
      {
        value: "all",
        label: `All ${connectionTypeLabel(connectionTypeParam)} profiles`,
      },
      ...profileSelectOptions(profiles),
    ];
    if (
      profileIdParam !== "all" &&
      !options.some((option) => option.value === profileIdParam)
    ) {
      options.push({
        value: profileIdParam,
        label:
          profileNameById.get(Number(profileIdParam)) ||
          `Profile #${profileIdParam}`,
      });
    }
    return options;
  }, [connectionTypeParam, profileIdParam, profileNameById, profiles]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const pipelineResponse =
        await connectionProfilePipelineService.listPipelines();
      setPipelines(pipelineResponse.data);
    } catch (error) {
      console.error("Failed to load connection profile pipelines", error);
      showError(
        "Unable to load pipelines",
        extractBackendError(error, "The extraction pipeline list could not be loaded."),
      );
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    load();
  }, [load]);

  const profileIdsKey = useMemo(
    () =>
      [...new Set(pipelines.map((pipeline) => pipeline.connection_profile_id))]
        .filter((id) => Number.isInteger(id) && id > 0)
        .sort((left, right) => left - right)
        .join(","),
    [pipelines],
  );

  useEffect(() => {
    const ids = profileIdsKey
      .split(",")
      .map((id) => Number(id))
      .filter((id) => Number.isInteger(id) && id > 0);
    if (ids.length === 0) {
      setNamedProfiles([]);
      setNamesResolved(true);
      return;
    }

    setNamesResolved(false);
    let cancelled = false;
    const resolveNames = async () => {
      const loaded = await Promise.all(
        ids.map(async (id) => {
          try {
            return await connectionProfileService.getProfile(id);
          } catch (error) {
            console.error("Failed to load connection profile name", id, error);
            return null;
          }
        }),
      );
      if (cancelled) return;
      setNamedProfiles(
        loaded.filter((profile): profile is ConnectionProfileType =>
          Boolean(profile?.profile_name),
        ),
      );
      setNamesResolved(true);
    };
    void resolveNames();
    return () => {
      cancelled = true;
    };
  }, [profileIdsKey]);

  useEffect(() => {
    const canonical = matchingConnectionTypeValue(
      connectionTypeParam,
      typeOptions,
    );
    if (!canonical || canonical === connectionTypeParam) return;
    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current);
        next.set("connectionType", canonical);
        return next;
      },
      { replace: true },
    );
  }, [connectionTypeParam, setSearchParams, typeOptions]);

  useEffect(() => {
    if (profileIdParam === "all") return;
    const numericId = Number(profileIdParam);
    if (!Number.isInteger(numericId) || numericId <= 0) return;
    if (pinnedProfiles.some((profile) => profile.id === numericId)) return;

    let cancelled = false;
    const resolveProfile = async () => {
      try {
        const profile = await connectionProfileService.getProfile(numericId);
        if (cancelled) return;
        setPinnedProfiles([profile]);
        if (
          profile.connection_type &&
          normalizeConnectionType(profile.connection_type) !==
            normalizeConnectionType(connectionTypeParam)
        ) {
          setSearchParams(
            (current) => {
              const next = new URLSearchParams(current);
              if (next.get("profileId") !== String(profile.id)) return current;
              next.set("connectionType", profile.connection_type);
              return next;
            },
            { replace: true },
          );
        }
      } catch (error) {
        console.error("Failed to resolve filtered connection profile", error);
      }
    };
    resolveProfile();
    return () => {
      cancelled = true;
    };
  }, [connectionTypeParam, pinnedProfiles, profileIdParam, setSearchParams]);

  const rows = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return pipelines
      .map((pipeline) => ({
        ...pipeline,
        profile_name:
          pipeline.profile_name ||
          profileNameById.get(pipeline.connection_profile_id) ||
          (namesResolved ? `#${pipeline.connection_profile_id}` : ""),
      }))
      .filter((pipeline) => {
        const haystack = [
          pipeline.pipeline_name,
          pipeline.profile_name,
          pipeline.target_schema,
          pipeline.target_table,
        ]
          .join(" ")
          .toLowerCase();
        if (
          profileIdParam !== "all" &&
          String(pipeline.connection_profile_id) !== profileIdParam
        ) {
          return false;
        }
        const selectedType = normalizeConnectionType(connectionTypeParam);
        if (selectedType && profileIdParam === "all") {
          const rowType = normalizeConnectionType(pipeline.connection_type);
          if (rowType) {
            if (rowType !== selectedType) return false;
          } else if (profilesLoaded) {
            const known = profileIdsOfType.has(pipeline.connection_profile_id);
            if (!known && !profilesTruncated) return false;
          }
        }
        if (term && !haystack.includes(term)) return false;
        if (actionFilter !== "all" && pipeline.action_type !== actionFilter) {
          return false;
        }
        if (sourceFilter !== "all" && pipeline.source_type !== sourceFilter) {
          return false;
        }
        if (statusFilter === "active" && !pipeline.is_active) return false;
        if (statusFilter === "inactive" && pipeline.is_active) return false;
        return true;
      });
  }, [
    actionFilter,
    connectionTypeParam,
    pipelines,
    profileIdParam,
    profileIdsOfType,
    profileNameById,
    profilesLoaded,
    namesResolved,
    profilesTruncated,
    searchTerm,
    sourceFilter,
    statusFilter,
  ]);

  const columns: TableColumn<ConnectionProfilePipeline>[] = useMemo(
    () => [
      {
        id: "pipeline_name",
        label: "Pipeline",
        visible: true,
        sortable: true,
        render: (_value, pipeline) => (
          <button
            type="button"
            onClick={() =>
              navigate(`/dashboard/connection-profile-pipelines/${pipeline.id}`)
            }
            className={`${tw.tableFirstColumn} text-sm`}
          >
            {pipeline.pipeline_name}
          </button>
        ),
      },
      {
        id: "connection_profile_id",
        label: "Connection profile",
        visible: true,
        render: (_value, pipeline) => pipeline.profile_name,
      },
      {
        id: "action_type",
        label: "Action",
        visible: true,
        sortable: true,
        render: (value) => labelFor(ACTION_TYPE_OPTIONS, value),
      },
      {
        id: "source_type",
        label: "Source",
        visible: true,
        render: (value) => labelFor(SOURCE_TYPE_OPTIONS, value),
      },
      {
        id: "target_table",
        label: "Target",
        visible: true,
        render: (_value, pipeline) =>
          `${pipeline.target_schema}.${pipeline.target_table}`,
      },
      {
        id: "load_strategy",
        label: "Load",
        visible: true,
        render: (value) => labelFor(LOAD_STRATEGY_OPTIONS, value),
      },
      {
        id: "schedule_enabled",
        label: "Schedule",
        visible: true,
        render: (_value, pipeline) => describeStoredSchedule(pipeline),
      },
      {
        id: "is_active",
        label: "Status",
        visible: true,
        sortable: true,
        render: (value) => (
          <span className="text-sm font-medium">
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
        render: (_value, pipeline) => (
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() =>
                navigate(`/dashboard/connection-profile-pipelines/${pipeline.id}`)
              }
              className={`p-0 icon-edit ${tw.rounded} hover:bg-gray-100 transition-colors`}
              aria-label="View pipeline"
            >
              <Eye className="w-4 h-4" />
            </button>
            <FeatureActionButton
              featureId="connection-profile-pipelines"
              action="edit"
              itemId={pipeline.id}
              variant="icon"
            />
          </div>
        ),
      },
    ],
    [navigate],
  );

  const {
    columns: tableColumns,
    currentPage,
    pageSize,
    handlePageChange,
    handlePageSizeChange,
    sortConfigs,
    handleSort,
    toggleColumn,
  } = useTable({
    tableId: "connection-profile-pipelines-table",
    defaultColumns: columns,
    persistToLocalStorage: true,
  });

  const profileHelp = profileFilterMessage({
    connectionType: connectionTypeParam,
    profilesLoading,
    profilesLoaded,
    isSearching,
    searchApplied,
    catalogCount,
    visibleCount: profiles.length,
    profilesTruncated,
  });
  const activeCount = rows.filter((pipeline) => pipeline.is_active).length;
  const pullCount = rows.filter((pipeline) => pipeline.action_type === "PULL").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <BackButton
          fallbackTo="/dashboard/administration"
          showBreadcrumb
          parentLabel="Administration"
          currentLabel="Connection Pipelines"
        />
        <FeatureActionButton
          featureId="connection-profile-pipelines"
          action="create"
          label="New pipeline"
          onClick={
            profileIdParam !== "all" || connectionTypeParam
              ? () => {
                  const params = new URLSearchParams();
                  if (connectionTypeParam) {
                    params.set("connectionType", connectionTypeParam);
                  }
                  if (profileIdParam !== "all") {
                    params.set("profileId", profileIdParam);
                  }
                  navigate(
                    `/dashboard/connection-profile-pipelines/new?${params.toString()}`,
                  );
                }
              : undefined
          }
        />
      </div>
      <p className={`text-sm ${tw.textSecondary}`}>
        Define how each connection profile extracts or exports data.
      </p>
      

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
            { name: "Pipelines", value: rows.length },
          { name: "Active", value: activeCount },
          { name: "Pull", value: pullCount },
        ].map((card) => (
          <div
            key={card.name}
            className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}
          >
            <div className="flex items-center gap-2">
              <GitBranch className="h-5 w-5" style={{ color: color.primary.accent }} />
              <p className="text-sm font-medium text-black">{card.name}</p>
            </div>
            <p className="mt-2 text-3xl font-bold text-black">
              {loading ? "..." : card.value}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-start">
        <SearchInput
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Search name, profile, or table"
        />
        <HeadlessSelect
          value={connectionTypeParam || "all"}
          placeholder={
            typesLoading ? "Loading connection types..." : "All connection types"
          }
          searchable
          searchPlaceholder="Search connection types..."
          disabled={typesLoading && typeOptions.length === 0}
          options={[
            { value: "all", label: "All connection types" },
            ...typeOptions.map((option) => ({
              value: option.value,
              label: option.label,
            })),
          ]}
          onChange={(value) => {
            const next = String(value);
            setSearchParams((current) => {
              const params = new URLSearchParams(current);
              if (next === "all") params.delete("connectionType");
              else params.set("connectionType", next);
              params.delete("profileId");
              return params;
            });
            setPinnedProfiles([]);
            handlePageChange(1);
          }}
        />
        {connectionTypeParam ? (
          <div>
            <HeadlessSelect
              key={connectionTypeParam}
              value={profileIdParam}
              placeholder="All profiles"
              searchable
              searchPlaceholder="Search by name or code..."
              options={profileOptions}
              onChange={(value) => {
                const next = String(value);
                if (next === "all") {
                  setPinnedProfiles([]);
                } else {
                  const profile = profiles.find((item) => String(item.id) === next);
                  if (profile) setPinnedProfiles([profile]);
                }
                setSearchParams((current) => {
                  const params = new URLSearchParams(current);
                  if (next === "all") params.delete("profileId");
                  else params.set("profileId", next);
                  return params;
                });
                handlePageChange(1);
              }}
              onSearchChange={onProfileSearch}
            />
            {profileHelp ? (
              <p className="mt-1 text-xs text-gray-500">{profileHelp}</p>
            ) : null}
          </div>
        ) : null}
        <HeadlessSelect
          value={actionFilter}
          options={[
            { value: "all", label: "All actions" },
            ...ACTION_TYPE_OPTIONS.map((option) => ({
              value: option.value,
              label: option.label,
            })),
          ]}
          onChange={(value) => {
            setActionFilter(String(value));
            handlePageChange(1);
          }}
        />
        <HeadlessSelect
          value={sourceFilter}
          options={[
            { value: "all", label: "All sources" },
            ...SOURCE_TYPE_OPTIONS.map((option) => ({
              value: option.value,
              label: option.label,
            })),
          ]}
          onChange={(value) => {
            setSourceFilter(String(value));
            handlePageChange(1);
          }}
        />
        <HeadlessSelect
          value={statusFilter}
          options={[
            { value: "all", label: "All statuses" },
            { value: "active", label: "Active" },
            { value: "inactive", label: "Inactive" },
          ]}
          onChange={(value) => {
            setStatusFilter(String(value));
            handlePageChange(1);
          }}
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <LoadingSpinner variant="modern" size="xl" color="primary" />
        </div>
      ) : rows.length === 0 ? (
        <div
          className={`${tw.rounded} border border-gray-200 text-center py-16 px-4`}
          style={{ backgroundColor: color.surface.cards }}
        >
          <GitBranch className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className={`${tw.cardHeading} text-gray-900 mb-1`}>
            No pipelines found
          </h3>
          <p className="text-sm text-gray-500">
            {pipelines.length
              ? "Adjust the search or filters."
              : "Create a pipeline to define how a connection profile extracts data."}
          </p>
        </div>
      ) : (
        <>
          <Table<ConnectionProfilePipeline>
            columns={tableColumns}
            data={rows}
            totalItems={rows.length}
            currentPage={currentPage}
            pageSize={pageSize}
            onPageChange={handlePageChange}
            onSort={handleSort}
            sortConfigs={sortConfigs}
            onHideColumn={toggleColumn}
          />
          <Pagination
            currentPage={currentPage}
            pageSize={pageSize}
            totalItems={rows.length}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
          />
        </>
      )}
    </div>
  );
}
