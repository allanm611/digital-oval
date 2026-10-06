import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import BackButton from "../../../shared/components/ui/BackButton";
import Checkbox from "../../../shared/components/ui/Checkbox";
import FormField from "../../../shared/components/FormField";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import Input from "../../../shared/components/ui/Input";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import { useToast } from "../../../contexts/ToastContext";
import { color, tw } from "../../../shared/utils/utils";
import { extractBackendError } from "../../../shared/utils/errorHandler";
import { connectionProfileService } from "../../connection-profiles/services/connectionProfileService";
import { ConnectionProfileType } from "../../connection-profiles/types/connectionProfile";
import FieldMappingsEditor from "../components/FieldMappingsEditor";
import SourceConfigEditor from "../components/SourceConfigEditor";
import PipelineScheduleFields from "../components/PipelineScheduleFields";
import TargetCatalogFields from "../components/TargetCatalogFields";
import {
  ACTION_TYPE_OPTIONS,
  LOAD_STRATEGY_OPTIONS,
  recommendedSourceType,
  SOURCE_TYPE_OPTIONS,
  sourceMatchesConnection,
} from "../constants/pipelineOptions";
import { useProfilesByConnectionType } from "../hooks/useProfilesByConnectionType";
import { connectionProfilePipelineService } from "../services/pipelineService";
import { PipelineFormState } from "../types/pipeline";
import {
  matchingConnectionTypeValue,
  profileFilterMessage,
  profileSelectOptions,
} from "../utils/connectionTypeCatalog";
import {
  buildPipelinePayload,
  emptyPipelineForm,
  formFromPipeline,
  validatePipelineForm,
} from "../utils/pipelineForm";
import { DiscoveredColumn } from "../utils/sourceColumns";

interface PipelineFormPageProps {
  mode: "create" | "edit";
}

export default function PipelineFormPage({ mode }: PipelineFormPageProps) {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const presetProfileId = searchParams.get("profileId") || "";
  const navigate = useNavigate();
  const { success, error: showError } = useToast();

  const [connectionType, setConnectionType] = useState(
    () => searchParams.get("connectionType") || "",
  );
  const [pinnedProfiles, setPinnedProfiles] = useState<ConnectionProfileType[]>(
    [],
  );
  const [profileLabelFallback, setProfileLabelFallback] = useState("");
  const [form, setForm] = useState<PipelineFormState>(() =>
    emptyPipelineForm(presetProfileId),
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [warehouseColumns, setWarehouseColumns] = useState<DiscoveredColumn[]>(
    [],
  );
  const [loading, setLoading] = useState(mode === "edit");
  const [saving, setSaving] = useState(false);
  const parameterIssuesRef = useRef<Record<string, string>>({});

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
  } = useProfilesByConnectionType(connectionType, pinnedProfiles);

  useEffect(() => {
    const canonical = matchingConnectionTypeValue(connectionType, typeOptions);
    if (canonical && canonical !== connectionType) {
      setConnectionType(canonical);
    }
  }, [connectionType, typeOptions]);

  useEffect(() => {
    if (!connectionType) return;
    const nextSource = recommendedSourceType(connectionType);
    if (!nextSource) return;
    setForm((current) =>
      current.source_type === nextSource
        ? current
        : { ...current, source_type: nextSource },
    );
  }, [connectionType]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        if (mode === "edit" && id) {
          const pipeline = await connectionProfilePipelineService.getPipeline(
            Number(id),
          );
          if (cancelled) return;
          setForm(formFromPipeline(pipeline));
          setProfileLabelFallback(pipeline.profile_name || "");
          if (pipeline.connection_type) {
            setConnectionType(pipeline.connection_type);
          }
          try {
            const profile = await connectionProfileService.getProfile(
              pipeline.connection_profile_id,
            );
            if (cancelled) return;
            setPinnedProfiles([profile]);
            if (profile.connection_type) setConnectionType(profile.connection_type);
            if (profile.profile_name) setProfileLabelFallback(profile.profile_name);
          } catch (profileError) {
            console.error("Failed to load pipeline connection profile", profileError);
            showError(
              "Unable to load connection profile",
              extractBackendError(
                profileError,
                "The linked profile could not be loaded. Choose the connection type and profile again.",
              ),
            );
          }
          return;
        }

        const numericProfileId = Number(presetProfileId);
        if (!Number.isInteger(numericProfileId) || numericProfileId <= 0) return;
        try {
          const profile = await connectionProfileService.getProfile(numericProfileId);
          if (cancelled) return;
          setPinnedProfiles([profile]);
          if (profile.connection_type) setConnectionType(profile.connection_type);
          if (profile.profile_name) setProfileLabelFallback(profile.profile_name);
          const recommended = recommendedSourceType(profile.connection_type);
          if (recommended) {
            setForm((current) =>
              current.source_type === recommended
                ? current
                : { ...current, source_type: recommended },
            );
          }
        } catch (profileError) {
          console.error("Failed to load preset connection profile", profileError);
          if (!cancelled) {
            showError(
              "Unable to load connection profile",
              extractBackendError(
                profileError,
                "The selected profile could not be loaded. Choose a connection type and profile.",
              ),
            );
          }
        }
      } catch (error) {
        console.error("Failed to load pipeline form", error);
        showError(
          "Unable to load pipeline",
          extractBackendError(error, "The pipeline form could not be loaded."),
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [id, mode, presetProfileId, showError]);

  const selectedProfile = useMemo(
    () =>
      profiles.find(
        (profile) => String(profile.id) === form.connection_profile_id,
      ) ?? null,
    [form.connection_profile_id, profiles],
  );

  const recommended = recommendedSourceType(connectionType);
  const sourceAligned = sourceMatchesConnection(
    form.source_type,
    selectedProfile?.connection_type,
  );

  const patch = (next: Partial<PipelineFormState>) => {
    setForm((current) => ({ ...current, ...next }));
  };

  const handleConnectionTypeChange = (value: string | number) => {
    const nextType = String(value);
    setConnectionType(nextType);
    setPinnedProfiles([]);
    setProfileLabelFallback("");
    setWarehouseColumns([]);
    const nextSource = recommendedSourceType(nextType);
    setForm((current) => ({
      ...current,
      connection_profile_id: "",
      source_type: nextSource ?? current.source_type,
    }));
    if (errors.connection_type || errors.connection_profile_id) {
      setErrors((current) => ({
        ...current,
        connection_type: "",
        connection_profile_id: "",
      }));
    }
  };

  const handleProfileChange = (value: string | number) => {
    const profile = profiles.find((item) => String(item.id) === String(value));
    if (profile) {
      setPinnedProfiles([profile]);
      setProfileLabelFallback(profile.profile_name);
    }
    const nextSource = profile
      ? recommendedSourceType(profile.connection_type) || form.source_type
      : form.source_type;
    setWarehouseColumns([]);
    patch({
      connection_profile_id: String(value),
      source_type: nextSource,
    });
    if (errors.connection_profile_id) {
      setErrors((current) => ({ ...current, connection_profile_id: "" }));
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const nextErrors = {
      ...validatePipelineForm(form),
      ...parameterIssuesRef.current,
    };
    if (!connectionType) {
      nextErrors.connection_type =
        "Select a connection type before choosing a profile.";
      delete nextErrors.connection_profile_id;
    }
    if (connectionType && !recommended) {
      nextErrors.source_type =
        "This connection type does not have a pipeline source yet.";
    } else if (selectedProfile && !sourceAligned) {
      nextErrors.source_type =
        "Source type must match the selected connection profile.";
    }
    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) {
      showError("Check the pipeline definition", "Some required extraction fields are missing or invalid.");
      return;
    }

    setSaving(true);
    try {
      const payload = buildPipelinePayload(form);
      if (mode === "create") {
        const created = await connectionProfilePipelineService.createPipeline(payload);
        success("Pipeline created", `${created.pipeline_name || form.pipeline_name} is ready to extract data.`);
        navigate("/dashboard/connection-profile-pipelines", { replace: true });
      } else if (id) {
        await connectionProfilePipelineService.updatePipeline(Number(id), payload);
        success("Pipeline updated");
        navigate("/dashboard/connection-profile-pipelines", { replace: true });
      }
    } catch (error) {
      console.error("Failed to save pipeline", error);
      showError(
        mode === "create" ? "Unable to create pipeline" : "Unable to update pipeline",
        extractBackendError(error, "The pipeline could not be saved."),
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <LoadingSpinner variant="modern" size="xl" color="primary" />
        <p className={`${tw.textMuted} font-medium mt-4`}>Loading pipeline...</p>
      </div>
    );
  }

  const profileOptions = profileSelectOptions(profiles);
  if (
    form.connection_profile_id &&
    !profileOptions.some((option) => option.value === form.connection_profile_id)
  ) {
    profileOptions.unshift({
      value: form.connection_profile_id,
      label: profileLabelFallback || `Profile #${form.connection_profile_id}`,
    });
  }
  const profileHelp = profileFilterMessage({
    connectionType,
    profilesLoading,
    profilesLoaded,
    isSearching,
    searchApplied,
    catalogCount,
    visibleCount: profiles.length,
    profilesTruncated,
  });
  const profilePlaceholder = !connectionType
    ? "Select a connection type first"
    : profilesLoading
      ? "Loading profiles..."
      : "Select a profile";

  const actionHelp = ACTION_TYPE_OPTIONS.find(
    (option) => option.value === form.action_type,
  )?.description;
  const sourceHelp = SOURCE_TYPE_OPTIONS.find(
    (option) => option.value === (recommended || form.source_type),
  )?.description;

  return (
    <div className="space-y-6">
      <BackButton
        fallbackTo="/dashboard/connection-profile-pipelines"
        showBreadcrumb
        parentLabel="Connection Pipelines"
        currentLabel={mode === "create" ? "New pipeline" : "Edit pipeline"}
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        <section className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm space-y-6`}>
          <div>
            <h2 className={`${tw.cardHeading} text-gray-900`}>Pipeline</h2>
            <p className="text-sm text-gray-500 mt-1">
              Each pipeline belongs to one connection profile. The profile supplies the host, credentials, and pool.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField error={errors.connection_type}>
              <HeadlessSelect
                label="Connection type*"
                searchable
                searchPlaceholder="Search connection types..."
                value={connectionType}
                error={!!errors.connection_type}
                disabled={typesLoading && typeOptions.length === 0}
                placeholder={
                  typesLoading ? "Loading connection types..." : "Select a connection type"
                }
                options={typeOptions.map((option) => ({
                  value: option.value,
                  label: option.label,
                }))}
                onChange={handleConnectionTypeChange}
              />
            </FormField>
            <FormField error={errors.connection_profile_id}>
              <HeadlessSelect
                key={connectionType || "profile"}
                label="Connection profile*"
                searchable
                searchPlaceholder="Search by name or code..."
                value={form.connection_profile_id}
                error={!!errors.connection_profile_id}
                disabled={!connectionType}
                placeholder={profilePlaceholder}
                options={profileOptions}
                onChange={handleProfileChange}
                onSearchChange={onProfileSearch}
              />
              {profileHelp && (
                <p className="mt-1 text-xs text-gray-500">{profileHelp}</p>
              )}
            </FormField>
            <FormField error={errors.pipeline_name}>
              <Input
                label="Pipeline name*"
                placeholder="Voice SMS CDR pull"
                value={form.pipeline_name}
                hasError={!!errors.pipeline_name}
                onChange={(value) => {
                  patch({ pipeline_name: String(value) });
                  if (errors.pipeline_name) {
                    setErrors((current) => ({ ...current, pipeline_name: "" }));
                  }
                }}
              />
            </FormField>
            <div>
              <HeadlessSelect
                label="Action*"
                value={form.action_type}
                options={ACTION_TYPE_OPTIONS.map((option) => ({
                  value: option.value,
                  label: option.label,
                }))}
                onChange={(value) =>
                  patch({
                    action_type: String(value) as PipelineFormState["action_type"],
                  })
                }
              />
              {actionHelp && (
                <p className="mt-1 text-xs text-gray-500">{actionHelp}</p>
              )}
            </div>
            <div>
              <HeadlessSelect
                label="Source type*"
                value={recommended || ""}
                error={!!errors.source_type}
                disabled
                placeholder="Follows the connection type"
                options={(recommended
                  ? SOURCE_TYPE_OPTIONS.filter((option) => option.value === recommended)
                  : []
                ).map((option) => ({
                  value: option.value,
                  label: option.label,
                }))}
                onChange={() => undefined}
              />
              {errors.source_type && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.source_type}
                </p>
              )}
              {sourceHelp && (
                <p className="mt-1 text-xs text-gray-500">{sourceHelp}</p>
              )}
            </div>
          </div>
          {connectionType && !recommended && (
            <p className="text-sm text-amber-700">
              This connection type does not have a pipeline source yet. Choose a
              file, database, API, Kafka, WebSocket, TCP, or SMS inbox profile.
            </p>
          )}
          <label className="flex items-center gap-3 text-sm text-gray-700">
            <Checkbox
              checked={form.is_active}
              onChange={(event) => patch({ is_active: event.target.checked })}
            />
            Active
          </label>
        </section>

        {connectionType && (
        <section className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm space-y-4`}>
          <div>
            <h2 className={`${tw.cardHeading} text-gray-900`}>Source</h2>
            <p className="text-sm text-gray-500 mt-1">
              {recommended === "DATABASE_QUERY" || recommended === "REST_API"
                ? "Describe what to read."
                : recommended === "FTP_FILE"
                  ? "Name the folder and file pattern. Credentials stay on the connection profile."
                  : "The connection profile holds the host and credentials. These fields only describe what this pipeline reads."}
            </p>
          </div>
          {!recommended ? (
            <p className="text-sm text-gray-500">
              A SQL query or a file path cannot be used for this connection.
              The host and credentials stay on the connection profile.
            </p>
          ) : (
          <SourceConfigEditor
            sourceType={recommended}
            connectionType={connectionType}
            form={form}
            errors={errors}
            onChange={patch}
            onParameterIssue={(field, message) => {
              if (message) parameterIssuesRef.current[field] = message;
              else delete parameterIssuesRef.current[field];
              setErrors((current) => {
                if ((current[field] || "") === message) return current;
                return { ...current, [field]: message };
              });
            }}
          />
          )}
        </section>
        )}

        <section className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}>
          <h2 className={`${tw.cardHeading} text-gray-900 mb-4`}>
            Field mappings
          </h2>
          <FieldMappingsEditor
            form={form}
            errors={errors}
            warehouseColumns={warehouseColumns}
            onChange={(mappings) => patch({ mappings })}
          />
        </section>

        <section className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm space-y-6`}>
          <div>
            <h2 className={`${tw.cardHeading} text-gray-900`}>Target</h2>
            <p className="text-sm text-gray-500 mt-1">
              {form.action_type === "PUSH"
                ? "Name the destination dataset this export writes."
                : "Name the warehouse table the loader writes into."}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <TargetCatalogFields
              form={form}
              errors={errors}
              onChange={(next, columns) => {
                setWarehouseColumns(columns);
                patch(next);
              }}
            />
            <div>
              <HeadlessSelect
                label="Load strategy*"
                value={form.load_strategy}
                error={!!errors.load_strategy}
                options={LOAD_STRATEGY_OPTIONS.map((option) => ({
                  value: option.value,
                  label: option.label,
                }))}
                onChange={(value) =>
                  patch({
                    load_strategy: String(
                      value,
                    ) as PipelineFormState["load_strategy"],
                  })
                }
              />
              <p className="mt-1 text-xs text-gray-500">
                {
                  LOAD_STRATEGY_OPTIONS.find(
                    (option) => option.value === form.load_strategy,
                  )?.description
                }
              </p>
              {errors.load_strategy && (
                <p className="mt-1 text-xs text-red-600">{errors.load_strategy}</p>
              )}
            </div>
            <FormField error={errors.batch_size}>
              <Input
                label="Batch size*"
                type="number"
                value={form.batch_size}
                hasError={!!errors.batch_size}
                onChange={(value) => patch({ batch_size: String(value) })}
              />
            </FormField>
          </div>
        </section>

        <section className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm space-y-4`}>
          <div>
            <h2 className={`${tw.cardHeading} text-gray-900`}>Schedule</h2>
            
          </div>
          <PipelineScheduleFields
            form={form}
            errors={errors}
            onChange={(schedule) => patch({ schedule })}
          />
        </section>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate("/dashboard/connection-profile-pipelines")}
            className={`px-4 py-2 text-sm ${tw.rounded} border border-gray-300`}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className={`px-4 py-2 text-white ${tw.rounded} transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2`}
            style={{ backgroundColor: color.primary.action }}
          >
            {saving && <LoadingSpinner size="sm" color="white" />}
            {mode === "create" ? "Create pipeline" : "Save pipeline"}
          </button>
        </div>
      </form>
    </div>
  );
}
