import { Settings, Trash2 } from "lucide-react";
import { CampaignSegment } from "../../types/campaign";
import { color , tw} from "../../../../shared/utils/utils";

interface ABTestDisplayProps {
  variantA: CampaignSegment | null;
  variantB: CampaignSegment | null;
  onRemoveSegment: (segmentId: string) => void;
  onConfigureControlGroup: (segmentId: string) => void;
}

export default function ABTestDisplay({
  variantA,
  variantB,
  onRemoveSegment,
  onConfigureControlGroup,
}: ABTestDisplayProps) {
  return (
    <div className="space-y-6">
      <div className="text-sm text-gray-600 mb-2">
        Configure A and B variants for testing
      </div>

      {/* A/B Test Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Variant A */}
        <div>
          {variantA ? (
            <div
              className={`border ${tw.rounded} p-4`}
              style={{ borderColor: color.primary.action }}
            >
              <div className="flex flex-col h-full">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-10 h-10 ${tw.rounded} flex items-center justify-center`}
                      style={{ backgroundColor: color.primary.action }}
                    >
                      <span className="text-white font-bold text-base">A</span>
                    </div>
                    <div>
                      <div className="mb-1">
                        <h4 className="font-semibold text-gray-900">
                          {variantA.name}
                        </h4>
                      </div>
                      <p className="text-xs text-gray-600">
                        {variantA.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-1">
                    <button
                      onClick={() => onConfigureControlGroup(variantA.id)}
                      className={`p-1.5 text-gray-400 hover:text-gray-600 ${tw.rounded} transition-colors`}
                      title="Configure Control Group"
                    >
                      <Settings className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onRemoveSegment(variantA.id)}
                      className={`p-1.5 text-gray-400 hover:text-red-500 ${tw.rounded} transition-colors`}
                      title="Remove"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {variantA.control_group_config &&
                  variantA.control_group_config.type !== "none" && (
                    <div
                      className="pt-3 border-t"
                      style={{ borderColor: `${color.primary.action}30` }}
                    >
                      <div className="flex items-center space-x-2">
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
                    </div>
                  )}
              </div>
            </div>
          ) : (
            <div className={`border-2 border-dashed border-gray-300 ${tw.rounded} p-3`}>
              <div className="flex items-center justify-center">
                <p className="text-sm text-gray-500">Variant A not set</p>
              </div>
            </div>
          )}
        </div>

        {/* Variant B */}
        <div>
          {variantB ? (
            <div
              className={`border ${tw.rounded} p-4`}
              style={{ borderColor: color.primary.accent }}
            >
              <div className="flex flex-col h-full">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-10 h-10 ${tw.rounded} flex items-center justify-center`}
                      style={{ backgroundColor: color.primary.accent }}
                    >
                      <span className="text-white font-bold text-base">B</span>
                    </div>
                    <div>
                      <div className="mb-1">
                        <h4 className="font-semibold text-gray-900">
                          {variantB.name}
                        </h4>
                      </div>
                      <p className="text-xs text-gray-600">
                        {variantB.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-1">
                    <button
                      onClick={() => onConfigureControlGroup(variantB.id)}
                      className={`p-1.5 text-gray-400 hover:text-gray-600 ${tw.rounded} transition-colors`}
                      title="Configure Control Group"
                    >
                      <Settings className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onRemoveSegment(variantB.id)}
                      className={`p-1.5 text-gray-400 hover:text-red-500 ${tw.rounded} transition-colors`}
                      title="Remove"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {variantB.control_group_config &&
                  variantB.control_group_config.type !== "none" && (
                    <div
                      className="pt-3 border-t"
                      style={{ borderColor: `${color.primary.accent}30` }}
                    >
                      <div className="flex items-center space-x-2">
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
                    </div>
                  )}
              </div>
            </div>
          ) : (
            <div className={`border-2 border-dashed border-gray-300 ${tw.rounded} p-3`}>
              <div className="flex items-center justify-center">
                <p className="text-sm text-gray-500">Variant B not set</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
