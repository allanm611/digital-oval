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
import {
  ACTION_TYPE_OPTIONS,
  LOAD_STRATEGY_OPTIONS,
  recommendedSourceType,
  SOURCE_TYPE_OPTIONS,
  sourceMatchesConnection,
} from "../constants/pipelineOptions";
import { connectionProfilePipelineService } from "../services/pipelineService";
import { PipelineFormState } from "../types/pipeline";
import {
  buildPipelinePayload,
  emptyPipelineForm,
  formFromPipeline,
  validatePipelineForm,
} from "../utils/pipelineForm";

interface PipelineFormPageProps {
  mode: "create" | "edit";
}

export default function PipelineFormPage({ mode }: PipelineFormPageProps) {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { success, error: showError } = useToast();

  const [profiles, setProfiles] = useState<ConnectionProfileType[]>([]);
  const [form, setForm] = useState<PipelineFormState>(() =>
    emptyPipelineForm(searchParams.get("profileId")),
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(mode === "edit");
  const [saving, setSaving] = useState(false);
  const sourceTouchedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const profileResponse = await connectionProfileService.listProfiles({
          limit: 100,
          skipCache: true,
        });
        if (cancelled) return;
        const loadedProfiles = profileResponse.data ?? [];
        setProfiles(loadedProfiles);

        if (mode === "create" && !sourceTouchedRef.current) {
          setForm((current) => {
            const profile = loadedProfiles.find(
              (item) => String(item.id) === current.connection_profile_id,
            );
            const recommended = recommendedSourceType(profile?.connection_type);
            if (!recommended || recommended === current.source_type) return current;
            return { ...current, source_type: recommended };
          });
        }

        if (mode === "edit" && id) {
          const pipeline = await connectionProfilePipelineService.getPipeline(
            Number(id),
          );
          if (cancelled) return;
          setForm(formFromPipeline(pipeline));
          sourceTouchedRef.current = true;
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
  }, [id, mode, showError]);

  const selectedProfile = useMemo(
    () =>
      profiles.find(
        (profile) => String(profile.id) === form.connection_profile_id,
      ),
    [form.connection_profile_id, profiles],
  );

  const recommended = recommendedSourceType(selectedProfile?.connection_type);
  const sourceAligned = sourceMatchesConnection(
    form.source_type,
    selectedProfile?.connection_type,
  );

  const patch = (next: Partial<PipelineFormState>) => {
    setForm((current) => ({ ...current, ...next }));
  };

  const handleProfileChange = (value: string | number) => {
    const profile = profiles.find((item) => String(item.id) === String(value));
    const nextSource =
      !sourceTouchedRef.current && profile
        ? recommendedSourceType(profile.connection_type) || form.source_type
        : form.source_type;
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
    const nextErrors = validatePipelineForm(form);
    if (selectedProfile && !sourceAligned) {
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

  const actionHelp = ACTION_TYPE_OPTIONS.find(
    (option) => option.value === form.action_type,
  )?.description;
  const sourceHelp = SOURCE_TYPE_OPTIONS.find(
    (option) => option.value === form.source_type,
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
              Each pipeline belongs to one connection profile. The profile
              supplies the host, credentials, and pool.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField error={errors.connection_profile_id}>
              <HeadlessSelect
                label="Connection profile*"
                searchable
                value={form.connection_profile_id}
                error={!!errors.connection_profile_id}
                placeholder="Select a profile"
                options={profiles.map((profile) => ({
                  value: String(profile.id),
                  label: `${profile.profile_name} (${profile.connection_type})`,
                }))}
                onChange={handleProfileChange}
              />
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
                value={form.source_type}
                error={!!errors.source_type}
                options={SOURCE_TYPE_OPTIONS.map((option) => ({
                  value: option.value,
                  label: option.label,
                }))}
                onChange={(value) => {
                  sourceTouchedRef.current = true;
                  patch({
                    source_type: String(value) as PipelineFormState["source_type"],
                  });
                  if (errors.source_type) {
                    setErrors((current) => ({ ...current, source_type: "" }));
                  }
                }}
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
          {selectedProfile && recommended && (
            <p className={`text-sm ${sourceAligned ? "text-gray-600" : "text-amber-700"}`}>
              {selectedProfile.profile_name} is a {selectedProfile.connection_type}{" "}
              profile.
              {sourceAligned
                ? " This source type matches that connection."
                : ` The usual source for this connection is ${
                    SOURCE_TYPE_OPTIONS.find((option) => option.value === recommended)
                      ?.label
                  }. Select that source type before saving because execution uses the profile's connection driver.`}
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

        <section className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm space-y-4`}>
          <div>
            <h2 className={`${tw.cardHeading} text-gray-900`}>Source</h2>
            <p className="text-sm text-gray-500 mt-1">
              Describe what to read. Do not put passwords or tokens here
            </p>
          </div>
          <SourceConfigEditor
            sourceType={form.source_type}
            form={form}
            errors={errors}
            onChange={patch}
          />
        </section>

        <section className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}>
          <h2 className={`${tw.cardHeading} text-gray-900 mb-4`}>
            Field mappings
          </h2>
          <FieldMappingsEditor
            mappings={form.mappings}
            errors={errors}
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
            <FormField error={errors.target_schema}>
              <Input
                label="Target schema*"
                value={form.target_schema}
                hasError={!!errors.target_schema}
                onChange={(value) => patch({ target_schema: String(value) })}
              />
            </FormField>
            <FormField error={errors.target_table}>
              <Input
                label="Target table*"
                placeholder="tracking_events"
                value={form.target_table}
                hasError={!!errors.target_table}
                onChange={(value) => patch({ target_table: String(value) })}
              />
            </FormField>
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
