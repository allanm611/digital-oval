import { Target, Settings, Trash2 } from "lucide-react";
import { CampaignSegment } from "../../types/campaign";
import { color , tw} from "../../../../shared/utils/utils";

interface SequentialCampaignDisplayProps {
  campaignType: "round_robin" | "multiple_level";
  segment: CampaignSegment | null;
  onRemoveSegment: (segmentId: string) => void;
  onConfigureControlGroup: (segmentId: string) => void;
}

export default function SequentialCampaignDisplay({
  campaignType,
  segment,
  onRemoveSegment,
  onConfigureControlGroup,
}: SequentialCampaignDisplayProps) {
  return (
    <div className="space-y-6">
      {!segment && (
        <div className="text-sm text-gray-600 mb-2">
          {campaignType === "round_robin"
            ? "Define target segment for rotating offers"
            : "Define target segment for sequential offers"}
        </div>
      )}

      {segment ? (
        <div
          className={`border ${tw.rounded} p-4`}
          style={{ borderColor: color.primary.action }}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3 flex-1">
              <div
                className={`w-10 h-10 ${tw.rounded} flex items-center justify-center`}
                style={{ backgroundColor: color.primary.action }}
              >
                <Target className={`w-5 h-5 `} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="mb-1">
                  <h4 className="font-semibold text-gray-900">
                    {segment.name}
                  </h4>
                </div>
                <p className="text-xs text-gray-600">{segment.description}</p>
                {segment.control_group_config &&
                  segment.control_group_config.type !== "none" && (
                    <div className="flex items-center space-x-2 mt-2">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: color.primary.accent }}
                      ></div>
                      <span
                        className="text-xs font-medium"
                        style={{ color: color.primary.accent }}
                      >
                        Control Group
                      </span>
                    </div>
                  )}
              </div>
            </div>
            <div className="flex items-center space-x-1">
              <button
                onClick={() => onConfigureControlGroup(segment.id)}
                className={`p-1.5 text-gray-400 hover:text-gray-600 ${tw.rounded} transition-colors`}
                title="Configure Control Group"
              >
                <Settings className="w-4 h-4" />
              </button>
              <button
                onClick={() => onRemoveSegment(segment.id)}
                className={`p-1.5 text-gray-400 hover:text-red-500 ${tw.rounded} transition-colors`}
                title="Remove Segment"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className={`border-2 border-dashed border-gray-300 ${tw.rounded} p-3`}>
          <div className="flex items-center justify-center">
            <p className="text-sm text-gray-500">No segment defined</p>
          </div>
        </div>
      )}
    </div>
  );
}
