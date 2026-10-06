import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { GitBranch, Plus } from "lucide-react";
import { color, tw } from "../../../shared/utils/utils";
import { connectionProfilePipelineService } from "../services/pipelineService";
import { ConnectionProfilePipeline } from "../types/pipeline";
import {
  ACTION_TYPE_OPTIONS,
  labelFor,
  SOURCE_TYPE_OPTIONS,
} from "../constants/pipelineOptions";

interface ProfilePipelinesPanelProps {
  profileId: number;
  connectionType?: string | null;
}

export default function ProfilePipelinesPanel({
  profileId,
  connectionType,
}: ProfilePipelinesPanelProps) {
  const navigate = useNavigate();
  const [pipelines, setPipelines] = useState<ConnectionProfilePipeline[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setFailed(false);
      try {
        const response = await connectionProfilePipelineService.listPipelines({
          connection_profile_id: profileId,
        });
        if (!cancelled) setPipelines(response.data);
      } catch (error) {
        console.error("Failed to load pipelines for profile", error);
        if (!cancelled) setFailed(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [profileId]);

  return (
    <div
      className={`${tw.rounded} border border-gray-200 p-6`}
      style={{ backgroundColor: color.surface.cards }}
    >
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h2 className={`${tw.cardHeading} text-gray-900`}>
            Data extraction pipelines
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Queries, file patterns, and field mappings that use this profile.
            Credentials stay on the profile.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            const params = new URLSearchParams({ profileId: String(profileId) });
            if (connectionType) params.set("connectionType", connectionType);
            navigate(
              `/dashboard/connection-profile-pipelines/new?${params.toString()}`,
            );
          }}
          className={`inline-flex items-center gap-2 px-3 py-2 text-sm text-white ${tw.rounded}`}
          style={{ backgroundColor: color.primary.action }}
        >
          <Plus className="w-4 h-4" />
          New pipeline
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">Loading pipelines...</p>
      ) : failed ? (
        <p className="text-sm text-gray-500">
          Pipelines could not be loaded. The extraction list is still available
          from Administration.
        </p>
      ) : pipelines.length === 0 ? (
        <div className="flex items-center gap-3 text-sm text-gray-500">
          <GitBranch className="w-4 h-4" />
          No extraction pipelines use this profile yet.
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {pipelines.slice(0, 5).map((pipeline) => (
            <button
              key={pipeline.id}
              type="button"
              onClick={() =>
                navigate(`/dashboard/connection-profile-pipelines/${pipeline.id}`)
              }
              className="w-full text-left py-3 flex items-center justify-between gap-3 hover:bg-gray-50"
            >
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {pipeline.pipeline_name}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {labelFor(ACTION_TYPE_OPTIONS, pipeline.action_type)} ·{" "}
                  {labelFor(SOURCE_TYPE_OPTIONS, pipeline.source_type)} ·{" "}
                  {pipeline.target_schema}.{pipeline.target_table}
                </p>
              </div>
              <span className="text-xs font-medium text-gray-600">
                {pipeline.is_active ? "Active" : "Inactive"}
              </span>
            </button>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={() =>
          navigate(
            `/dashboard/connection-profile-pipelines?${new URLSearchParams({
              profileId: String(profileId),
              ...(connectionType ? { connectionType } : {}),
            }).toString()}`,
          )
        }
        className="mt-4 text-sm font-medium"
        style={{ color: color.primary.action }}
      >
        View all pipelines for this profile
      </button>
    </div>
  );
}
