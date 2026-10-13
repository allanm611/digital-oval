import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Loader2, Play, Trash2 } from "lucide-react";
import ActivateDeactivateButton from "../../../shared/components/ui/ActivateDeactivateButton";
import BackButton from "../../../shared/components/ui/BackButton";
import DeleteConfirmModal from "../../../shared/components/ui/DeleteConfirmModal";
import FeatureActionButton from "../../../shared/components/FeatureActionButton";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import DateFormatter from "../../../shared/components/DateFormatter";
import { useToast } from "../../../contexts/ToastContext";
import { color, tw, button } from "../../../shared/utils/utils";
import { extractBackendError } from "../../../shared/utils/errorHandler";
import { connectionProfileService } from "../../connection-profiles/services/connectionProfileService";
import {
  ACTION_TYPE_OPTIONS,
  CONVERSION_OPTIONS,
  labelFor,
  LOAD_STRATEGY_OPTIONS,
  SOURCE_TYPE_OPTIONS,
} from "../constants/pipelineOptions";
import { connectionProfilePipelineService } from "../services/pipelineService";
import {
  describeStoredSchedule,
  isPipelineScheduled,
} from "../utils/pipelineSchedule";
import {
  ConnectionProfilePipeline,
  PipelineExecutionResult,
} from "../types/pipeline";

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-sm text-gray-600">{label}</p>
      <p className="text-sm font-medium text-gray-900 mt-1 break-words">{value}</p>
    </div>
  );
}

export default function PipelineDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { success, error: showError } = useToast();
  const [pipeline, setPipeline] = useState<ConnectionProfilePipeline | null>(null);
  const [profileName, setProfileName] = useState("");
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [executeOpen, setExecuteOpen] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [lastExecution, setLastExecution] =
    useState<PipelineExecutionResult | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await connectionProfilePipelineService.getPipeline(Number(id));
      setPipeline(data);
      try {
        const profile = await connectionProfileService.getProfile(
          data.connection_profile_id,
          true,
        );
        setProfileName(profile.profile_name);
      } catch {
        setProfileName(data.profile_name || "");
      }
    } catch (error) {
      console.error("Failed to load pipeline", error);
      showError(
        "Unable to load pipeline",
        extractBackendError(error, "This pipeline could not be loaded."),
      );
    } finally {
      setLoading(false);
    }
  }, [id, showError]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (loading || location.hash !== "#schedule") return;
    document.getElementById("schedule")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, [loading, location.hash, pipeline]);

  const handleToggle = async () => {
    if (!pipeline) return;
    setToggling(true);
    try {
      const updated = await connectionProfilePipelineService.setActive(
        pipeline.id,
        !pipeline.is_active,
      );
      setPipeline(updated);
      success(updated.is_active ? "Pipeline activated" : "Pipeline deactivated");
    } catch (error) {
      showError(
        "Unable to update status",
        extractBackendError(error, "The pipeline status could not be changed."),
      );
    } finally {
      setToggling(false);
    }
  };

  const handleDelete = async () => {
    if (!pipeline) return;
    setDeleting(true);
    try {
      await connectionProfilePipelineService.deletePipeline(pipeline.id);
      success("Pipeline deleted");
      navigate("/dashboard/connection-profile-pipelines");
    } catch (error) {
      showError(
        "Unable to delete pipeline",
        extractBackendError(error, "The pipeline could not be deleted."),
      );
    } finally {
      setDeleting(false);
    }
  };

  const handleExecute = async () => {
    if (!pipeline) return;
    setExecuting(true);
    try {
      const result = await connectionProfilePipelineService.executePipeline(
        pipeline.id,
      );
      setLastExecution(result);
      success(
        "Pipeline completed",
        `${result.loaded_records ?? 0} record${
          result.loaded_records === 1 ? "" : "s"
        } loaded in ${(result.execution_time_ms / 1000).toFixed(1)}s.`,
      );
      setExecuteOpen(false);
    } catch (error) {
      showError(
        "Unable to execute pipeline",
        extractBackendError(error, "The pipeline execution could not be started."),
      );
    } finally {
      setExecuting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <LoadingSpinner variant="modern" size="xl" color="primary" />
      </div>
    );
  }

  if (!pipeline) {
    return (
      <div className="space-y-4">
        <BackButton
          fallbackTo="/dashboard/connection-profile-pipelines"
          showBreadcrumb
          currentLabel="Pipeline"
        />
        <p className="text-sm text-gray-500">This pipeline is not available.</p>
      </div>
    );
  }

  const sourceEntries = Object.entries(pipeline.source_config);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <BackButton
          fallbackTo="/dashboard/connection-profile-pipelines"
          showBreadcrumb
          parentLabel="Connection Pipelines"
          currentLabel={pipeline.pipeline_name}
        />
        <div className="flex flex-wrap items-center gap-2 [&>button]:box-border [&>button]:h-9 [&>button]:shrink-0 [&>button]:justify-center [&>button]:whitespace-nowrap">
          <button
            type="button"
            onClick={() => setExecuteOpen(true)}
            disabled={
              !pipeline.is_active ||
              pipeline.action_type !== "PULL" ||
              executing
            }
            className={`${tw.borderedButton} inline-flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-50`}
            style={{
              borderColor: "var(--c-bordered-button-color)",
              color: "var(--c-bordered-button-color)",
            }}
            title={
              !pipeline.is_active
                ? "Activate the pipeline before running it"
                : pipeline.action_type !== "PULL"
                  ? "The backend currently executes pull pipelines only"
                  : "Run this pipeline now"
            }
          >
            {executing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            Run now
          </button>
          <ActivateDeactivateButton
            variant="button"
            isActive={pipeline.is_active}
            isLoading={toggling}
            onToggle={handleToggle}
          >
            {pipeline.is_active ? "Deactivate" : "Activate"}
          </ActivateDeactivateButton>
          <FeatureActionButton
            featureId="connection-profile-pipelines"
            action="edit"
            itemId={pipeline.id}
            variant="primary"
            label="Edit"
          />
          <button
            type="button"
            onClick={() => setDeleteOpen(true)}
            className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-transparent ${tw.rounded}`}
            style={{
              color: button.delete.background,
              border: `1px solid ${button.delete.background}`,
            }}
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <section
            className={`${tw.rounded} border border-gray-200 p-6`}
            style={{ backgroundColor: color.surface.cards }}
          >
            <h2 className={`${tw.cardHeading} text-gray-900 mb-4`}>
              Extraction
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <DetailItem
                label="Action"
                value={labelFor(ACTION_TYPE_OPTIONS, pipeline.action_type)}
              />
              <DetailItem
                label="Source"
                value={labelFor(SOURCE_TYPE_OPTIONS, pipeline.source_type)}
              />
              <DetailItem
                label="Target"
                value={`${pipeline.target_schema}.${pipeline.target_table}`}
              />
              <DetailItem
                label="Load strategy"
                value={labelFor(LOAD_STRATEGY_OPTIONS, pipeline.load_strategy)}
              />
              <DetailItem label="Batch size" value={String(pipeline.batch_size)} />
              <DetailItem
                label="Schedule"
                value={isPipelineScheduled(pipeline) ? "Scheduled" : "Not scheduled"}
              />
              <DetailItem
                label="Status"
                value={pipeline.is_active ? "Active" : "Inactive"}
              />
            </div>
          </section>

          <section
            id="schedule"
            className={`${tw.rounded} border border-gray-200 p-6 scroll-mt-6`}
            style={{ backgroundColor: color.surface.cards }}
          >
            <h2 className={`${tw.cardHeading} text-gray-900 mb-4`}>Schedule</h2>
            {isPipelineScheduled(pipeline) ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <DetailItem label="Repeat" value={describeStoredSchedule(pipeline)} />
                <div>
                  <p className="text-sm text-gray-600">Next run</p>
                  <p className="text-sm font-medium text-gray-900 mt-1">
                    {pipeline.next_execution_at ? (
                      <DateFormatter date={pipeline.next_execution_at} includeTime />
                    ) : (
                      "Due on the next scheduler check"
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Last scheduled run</p>
                  <p className="text-sm font-medium text-gray-900 mt-1">
                    {pipeline.last_executed_at ? (
                      <DateFormatter date={pipeline.last_executed_at} includeTime />
                    ) : (
                      "No scheduled run yet"
                    )}
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-gray-600">
                  This pipeline runs only when someone starts it.
                </p>
                <button
                  type="button"
                  onClick={() =>
                    navigate(
                      `/dashboard/connection-profile-pipelines/${pipeline.id}/edit#schedule`,
                    )
                  }
                  className={`text-sm font-medium underline ${tw.link}`}
                >
                  Set schedule
                </button>
              </div>
            )}
          </section>

          <section
            className={`${tw.rounded} border border-gray-200 p-6`}
            style={{ backgroundColor: color.surface.cards }}
          >
            <h2 className={`${tw.cardHeading} text-gray-900 mb-4`}>Source</h2>
            {sourceEntries.length === 0 ? (
              <p className="text-sm text-gray-500">No source settings stored.</p>
            ) : (
              <div className="space-y-3">
                {sourceEntries.map(([key, value]) => (
                  <div key={key}>
                    <p className="text-sm text-gray-600">{key}</p>
                    <pre className="text-sm font-medium text-gray-900 mt-1 whitespace-pre-wrap break-words">
                      {typeof value === "object"
                        ? JSON.stringify(value, null, 2)
                        : String(value)}
                    </pre>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section
            className={`${tw.rounded} border border-gray-200 p-6`}
            style={{ backgroundColor: color.surface.cards }}
          >
            <h2 className={`${tw.cardHeading} text-gray-900 mb-4`}>
              Field mappings
            </h2>
            {pipeline.field_mappings.length === 0 ? (
              <p className="text-sm text-gray-500">
                No mappings. Source columns pass through to the target.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500">
                      <th className="py-2 pr-4 font-medium">Source</th>
                      <th className="py-2 pr-4 font-medium">Target</th>
                      <th className="py-2 pr-4 font-medium">Type</th>
                      <th className="py-2 pr-4 font-medium">Conversion</th>
                      <th className="py-2 font-medium">Flags</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pipeline.field_mappings.map((mapping) => (
                      <tr key={`${mapping.source_field}-${mapping.target_field}`} className="border-t border-gray-100">
                        <td className="py-2 pr-4">{mapping.source_field}</td>
                        <td className="py-2 pr-4">{mapping.target_field}</td>
                        <td className="py-2 pr-4">{mapping.data_type}</td>
                        <td className="py-2 pr-4">
                          {labelFor(CONVERSION_OPTIONS, mapping.conversion)}
                          {mapping.format ? ` (${mapping.format})` : ""}
                        </td>
                        <td className="py-2">
                          {[
                            mapping.required ? "Required" : "",
                            mapping.is_upsert_key ? "Match key" : "",
                          ]
                            .filter(Boolean)
                            .join(", ") || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>

        <aside className="space-y-6">
          <section
            className={`${tw.rounded} border border-gray-200 p-6`}
            style={{ backgroundColor: color.surface.cards }}
          >
            <h2 className={`${tw.cardHeading} text-gray-900 mb-4`}>
              Connection profile
            </h2>
            <button
              type="button"
              onClick={() =>
                navigate(
                  `/dashboard/connection-profiles/${pipeline.connection_profile_id}`,
                )
              }
              className="text-sm font-medium"
              style={{ color: color.primary.action }}
            >
              {profileName || `Profile #${pipeline.connection_profile_id}`}
            </button>
            <p className="text-xs text-gray-500 mt-2">
              Host, credentials, pool, and health stay on the profile.
            </p>
          </section>
          <section
            className={`${tw.rounded} border border-gray-200 p-6`}
            style={{ backgroundColor: color.surface.cards }}
          >
            <h2 className={`${tw.cardHeading} text-gray-900 mb-4`}>Activity</h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Created</p>
                <p className="text-sm font-medium text-gray-900 mt-1">
                  {pipeline.created_at ? (
                    <DateFormatter date={pipeline.created_at} includeTime />
                  ) : (
                    "—"
                  )}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Next run</p>
                <p className="text-sm font-medium text-gray-900 mt-1">
                  {pipeline.schedule_enabled && pipeline.next_execution_at ? (
                    <DateFormatter date={pipeline.next_execution_at} includeTime />
                  ) : (
                    "Not scheduled"
                  )}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Last scheduled run</p>
                <p className="text-sm font-medium text-gray-900 mt-1">
                  {pipeline.last_executed_at ? (
                    <DateFormatter date={pipeline.last_executed_at} includeTime />
                  ) : (
                    "—"
                  )}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Updated</p>
                <p className="text-sm font-medium text-gray-900 mt-1">
                  {pipeline.updated_at ? (
                    <DateFormatter date={pipeline.updated_at} includeTime />
                  ) : (
                    "—"
                  )}
                </p>
              </div>
            </div>
          </section>
          {lastExecution && (
            <section
              className={`${tw.rounded} border border-green-200 bg-green-50 p-6`}
            >
              <h2 className={`${tw.cardHeading} text-gray-900 mb-4`}>
                Latest run
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <DetailItem
                  label="Extracted"
                  value={String(lastExecution.extracted_records ?? 0)}
                />
                <DetailItem
                  label="Transformed"
                  value={String(lastExecution.transformed_records ?? 0)}
                />
                <DetailItem
                  label="Loaded"
                  value={String(lastExecution.loaded_records ?? 0)}
                />
                <DetailItem
                  label="Duration"
                  value={`${(lastExecution.execution_time_ms / 1000).toFixed(1)}s`}
                />
              </div>
            </section>
          )}
        </aside>
      </div>

      <DeleteConfirmModal
        isOpen={executeOpen}
        onClose={() => {
          if (!executing) setExecuteOpen(false);
        }}
        onConfirm={handleExecute}
        isLoading={executing}
        title="Run pipeline now?"
        itemName={pipeline.pipeline_name}
        description="This immediately asks the execution of the current saved pipeline definition."
        confirmText="Run pipeline"
        variant="warning"
      />

      <DeleteConfirmModal
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        isLoading={deleting}
        title="Delete pipeline"
        itemName={pipeline.pipeline_name}
        description="This removes the extraction definition. The connection profile and its credentials stay in place."
      />
    </div>
  );
}
