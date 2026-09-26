import { BarChart3, ChevronDown, Edit, Trash2 } from "lucide-react";
import { color, tw } from "../../../../shared/utils/utils";
import type { TrackingSourceCampaignConfig } from "../../types/trackingRewardConfig";
import {
  formatAttributionWindow,
  formatLimit,
  trackingSourceTypeLabel,
} from "../../utils/trackingRewardConfig";

const addTrackingSourceLabel = "Add tracking source";

interface TrackingSourcesSummaryCellProps {
  sources: TrackingSourceCampaignConfig[];
  isExpanded: boolean;
  onToggle: () => void;
  onAdd: () => void;
  required: boolean;
}

export function TrackingSourcesSummaryCell({
  sources,
  isExpanded,
  onToggle,
  onAdd,
  required,
}: TrackingSourcesSummaryCellProps) {
  const count = sources.length;

  if (!required && count === 0) {
    return (
      <span className={`text-sm ${tw.textMuted}`}>Not required</span>
    );
  }

  if (count === 0) {
    return (
      <div className="flex flex-col items-start gap-1 min-w-[10.5rem]">
        <span className={`text-sm ${tw.textMuted}`}>No tracking source</span>
        <button
          type="button"
          onClick={onAdd}
          className="text-sm font-medium text-gray-700 hover:underline whitespace-nowrap"
        >
          {addTrackingSourceLabel}
        </button>
      </div>
    );
  }

  const preview = sources
    .map((source) => source.tracking_source_name)
    .filter(Boolean)
    .join(", ");

  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex items-start gap-2 min-w-0 max-w-[16rem] text-left"
      aria-expanded={isExpanded}
      title={isExpanded ? "Collapse tracking sources" : "Expand tracking sources"}
    >
      <ChevronDown
        size={16}
        className={`mt-0.5 transition-transform text-gray-900 flex-shrink-0 ${
          isExpanded ? "rotate-180" : ""
        }`}
      />
      <span className="min-w-0">
        <span className="block text-sm font-medium text-gray-900">
          {count} source{count === 1 ? "" : "s"}
        </span>
        {preview ? (
          <span className={`block text-xs ${tw.textMuted} truncate`}>
            {preview}
          </span>
        ) : null}
      </span>
    </button>
  );
}

interface TrackingSourcesExpandedRowProps {
  sources: TrackingSourceCampaignConfig[];
  colSpan: number;
  onAdd: () => void;
  onEdit: (source: TrackingSourceCampaignConfig) => void;
  onDelete: (source: TrackingSourceCampaignConfig) => void;
  required: boolean;
}

export function TrackingSourcesExpandedRow({
  sources,
  colSpan,
  onAdd,
  onEdit,
  onDelete,
  required,
}: TrackingSourcesExpandedRowProps) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-0 py-0">
        <div
          className="px-6 py-6 border-t border-gray-100"
          style={{ backgroundColor: color.surface.tablebodybg }}
        >
          {sources.length === 0 ? (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <p className={`text-sm font-medium ${tw.textPrimary}`}>
                  No tracking source
                </p>
                <p className={`text-sm ${tw.textMuted} mt-0.5`}>
                  {required
                    ? "Add a tracking source for this segment–offer mapping before continuing."
                    : "This offer type does not require a tracking source."}
                </p>
              </div>
              {required && (
                <button
                  type="button"
                  onClick={onAdd}
                  className="text-sm font-medium text-gray-700 hover:underline self-start sm:self-auto"
                >
                  {addTrackingSourceLabel}
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sources.map((source) => (
                  <div
                    key={source.id}
                    className={`border border-gray-200 ${tw.rounded} p-4`}
                    style={{ backgroundColor: color.surface.cards }}
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center space-x-3 flex-wrap gap-y-1 min-w-0">
                        <BarChart3
                          className="w-5 h-5 flex-shrink-0"
                          style={{ color: color.primary.accent }}
                        />
                        <span className="font-medium text-sm text-gray-900 truncate">
                          {source.tracking_source_name}
                        </span>
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                          {trackingSourceTypeLabel(source.tracking_source_type)}
                        </span>
                        <span className="px-2 py-1 text-xs rounded bg-green-100 text-green-700">
                          Configured
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => onEdit(source)}
                          className="p-1 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
                          title="Edit tracking source"
                          aria-label={`Edit ${source.tracking_source_name}`}
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete(source)}
                          className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                          title="Remove tracking source from this mapping"
                          aria-label={`Remove ${source.tracking_source_name}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-gray-500 mb-3">
                      {source.filtering_criteria === "match_any"
                        ? "Match any rule"
                        : "No rule"}
                      {" · window "}
                      {formatAttributionWindow(source.attribution_window)}
                    </p>
                    <div className="space-y-3 pt-3 border-t border-gray-200">
                      <div className="flex flex-col gap-0.5">
                        <span className={`text-xs font-medium ${tw.textMuted}`}>
                          Attribution window
                        </span>
                        <span className={`text-sm ${tw.textPrimary}`}>
                          {formatAttributionWindow(source.attribution_window)}
                        </span>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className={`text-xs font-medium ${tw.textMuted}`}>
                          Rule matching
                        </span>
                        <span className={`text-sm ${tw.textPrimary}`}>
                          {source.filtering_criteria === "match_any"
                            ? "Match any rule"
                            : "No rule"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm text-gray-600 pt-1">
                        <span>Tracking {formatLimit(source.tracking_limit)}</span>
                        <span>Rewards {formatLimit(source.reward_limit)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {required && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={onAdd}
                    className="text-sm font-medium text-gray-700 hover:underline"
                  >
                    {addTrackingSourceLabel}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </td>
    </tr>
  );
}
