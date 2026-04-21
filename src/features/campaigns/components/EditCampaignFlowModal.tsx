import { X } from "lucide-react";
import { color, tw, button } from "../../../shared/utils/utils";
import Input from "../../../shared/components/ui/Input";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import {
  CampaignFlowConfig,
  CampaignFlowResponseData,
} from "../types/campaignFlow";
import { Offer } from "../../offers/types/offer";
import { SegmentType } from "../../segments/types/segment";
import Checkbox from "../../../shared/components/ui/Checkbox";

interface EditCampaignFlowModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedFlow: CampaignFlowResponseData | null;
  editedFlow: Partial<CampaignFlowConfig>;
  setEditedFlow: (flow: Partial<CampaignFlowConfig>) => void;
  rawConditionRuleInput: string;
  setRawConditionRuleInput: (input: string) => void;
  conditionRuleError: string;
  setConditionRuleError: (error: string) => void;
  activeSegments: SegmentType[];
  activeOffers: Offer[];
  isLoadingActiveData: boolean;
  isActionLoading: boolean;
  onSave: () => Promise<void>;
  campaignId?: string | number;
}

const FLOW_TYPE_OPTIONS = [
  {
    value: "STANDARD",
    label: "Multiple Target Group",
    backendType: "STANDARD",
  },
  {
    value: "AB_TEST",
    label: "A/B Test",
    backendType: "AB_TEST",
  },
  {
    value: "CHAMPION_CHALLENGER",
    label: "Champion-Challenger",
    backendType: "CHAMPION_CHALLENGER",
  },
  {
    value: "ROUND_ROBIN",
    label: "Round Robin",
    backendType: "ROUND_ROBIN",
  },
  {
    value: "MULTIPLE_LEVEL",
    label: "Multiple Level",
    backendType: "MULTIPLE_LEVEL",
  },
];

export default function EditCampaignFlowModal({
  isOpen,
  onClose,
  selectedFlow,
  editedFlow,
  setEditedFlow,
  rawConditionRuleInput,
  setRawConditionRuleInput,
  conditionRuleError,
  setConditionRuleError,
  activeSegments,
  activeOffers,
  isLoadingActiveData,
  isActionLoading,
  onSave,
  campaignId,
}: EditCampaignFlowModalProps) {
  if (!isOpen || !selectedFlow) return null;

  const effectiveFlowType =
    editedFlow.flow_type || selectedFlow.flow_type || "";
  const flowTypeLabel =
    FLOW_TYPE_OPTIONS.find((opt) => opt.value === effectiveFlowType)?.label ||
    effectiveFlowType ||
    "-";

  const handleClose = () => {
    setRawConditionRuleInput("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div
          className="fixed inset-0 bg-black bg-opacity-50"
          onClick={handleClose}
        />
        <div
          className={`relative bg-white ${tw.rounded} shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto`}
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className={`text-lg font-semibold ${tw.textPrimary}`}>
              Edit Campaign Flow
            </h3>
            <button
              onClick={handleClose}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
              title="Close"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          <div className="space-y-6 mb-6">
            {/* Campaign ID and Campaign Type on same line */}
            <div className="grid grid-cols-2 gap-4">
              {/* Campaign ID - Read Only Input */}
              <div>
                <label
                  className={`block text-sm font-medium ${tw.textPrimary} mb-2`}
                >
                  Campaign ID
                </label>
                <Input type="text"
                  readOnly
                  value={campaignId || selectedFlow?.campaign_id || ""}
                  className={`w-full px-4 py-2 border ${tw.rounded} text-sm ${tw.textSecondary} bg-gray-50`}
                  style={{ borderColor: color.border.default }}
                />
              </div>

              {/* Campaign Type - Read Only Input */}
              <div>
                <label
                  className={`block text-sm font-medium ${tw.textPrimary} mb-2`}
                >
                  Campaign Type
                </label>
                <Input type="text"
                  readOnly
                  value={flowTypeLabel}
                  className={`w-full px-4 py-2 border ${tw.rounded} text-sm ${tw.textSecondary} bg-gray-50`}
                  style={{ borderColor: color.border.default }}
                />
              </div>
            </div>

            {/* Core Selection */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    className={`block text-sm font-medium ${tw.textPrimary} mb-2`}
                  >
                    Segment
                  </label>
                  <HeadlessSelect
                    value={String(editedFlow.segment_id || "")}
                    onChange={(value) =>
                      setEditedFlow({
                        ...editedFlow,
                        segment_id: parseInt(value) || 0,
                      })
                    }
                    options={[
                      { value: "", label: "Select Segment" },
                      ...activeSegments.map((seg) => ({
                        value: String(seg.id),
                        label: seg.name,
                      })),
                    ]}
                    disabled={isLoadingActiveData}
                  />
                </div>

                <div>
                  <label
                    className={`block text-sm font-medium ${tw.textPrimary} mb-2`}
                  >
                    Offer
                  </label>
                  <HeadlessSelect
                    value={String(editedFlow.offer_id || "")}
                    onChange={(value) =>
                      setEditedFlow({
                        ...editedFlow,
                        offer_id: parseInt(value) || 0,
                      })
                    }
                    options={[
                      { value: "", label: "Select Offer" },
                      ...activeOffers.map((offer) => ({
                        value: String(offer.id),
                        label: offer.name,
                      })),
                    ]}
                    disabled={isLoadingActiveData}
                  />
                </div>
              </div>

              <div>
                <label
                  className={`block text-sm font-medium ${tw.textPrimary} mb-2`}
                >
                  Condition Rule (JSON)
                </label>
                <textarea
                  value={rawConditionRuleInput}
                  onChange={(e) => {
                    const value = e.target.value;
                    setRawConditionRuleInput(value);
                    setConditionRuleError(""); // Clear error on change

                    if (value.trim()) {
                      try {
                        JSON.parse(value);
                        setEditedFlow({
                          ...editedFlow,
                          condition_rule: JSON.parse(value),
                        });
                      } catch (err) {
                        setConditionRuleError("Invalid JSON format");
                      }
                    } else {
                      setEditedFlow({
                        ...editedFlow,
                        condition_rule: undefined,
                      });
                    }
                  }}
                  placeholder='{"condition": "value"}'
                  className={`w-full px-3 py-2 border ${tw.rounded} focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-xs ${
                    conditionRuleError ? "border-red-500" : "border-gray-300"
                  }`}
                  rows={3}
                />
                {conditionRuleError && (
                  <p className="text-xs text-red-600 mt-1">
                    {conditionRuleError}
                  </p>
                )}
              </div>
            </div>

            {/* Execution Settings */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    className={`block text-sm font-medium ${tw.textPrimary} mb-2`}
                  >
                    Step Order
                  </label>
                  <Input type="number"
                    min="1"
                    value={editedFlow.step_order || 1}
                    onChange={(value) =>
                      setEditedFlow({
                        ...editedFlow,
                        step_order: parseInt(String(value)) || 1,
                      })
                    }
                    className={`w-full px-3 py-2 border border-gray-300 ${tw.rounded} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  />
                </div>

                <div>
                  <label
                    className={`block text-sm font-medium ${tw.textPrimary} mb-2`}
                  >
                    Wait Interval (hours)
                  </label>
                  <Input type="number"
                    min="0"
                    value={editedFlow.wait_interval_hours || 0}
                    onChange={(value) =>
                      setEditedFlow({
                        ...editedFlow,
                        wait_interval_hours: parseInt(String(value)) || 0,
                      })
                    }
                    className={`w-full px-3 py-2 border border-gray-300 ${tw.rounded} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  />
                </div>
              </div>

              <div>
                <label
                  className={`block text-sm font-medium ${tw.textPrimary} mb-2`}
                >
                  Bucket Allocation
                  {editedFlow.flow_type === "AB_TEST" && (
                    <span className="text-red-600 ml-1">*</span>
                  )}
                </label>
                <Input type="text"
                  placeholder="e.g., 50-50"
                  value={editedFlow.bucket_allocation || ""}
                  onChange={(value) =>
                    setEditedFlow({
                      ...editedFlow,
                      bucket_allocation: String(value),
                    })
                  }
                  className={`w-full px-3 py-2 border ${
                    editedFlow.flow_type === "AB_TEST" &&
                    !editedFlow.bucket_allocation
                      ? "border-red-500 bg-red-50"
                      : "border-gray-300"
                  } ${tw.rounded} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
                {editedFlow.flow_type === "AB_TEST" &&
                  !editedFlow.bucket_allocation && (
                    <p className="text-red-600 text-sm mt-1">
                      Bucket allocation is required for A/B Test campaigns
                    </p>
                  )}
              </div>
            </div>

            {/* Advanced Fields */}
            <div className="space-y-4">
              <div>
                <label
                  className={`block text-sm font-medium ${tw.textPrimary} mb-2`}
                >
                  Offer Creative
                </label>
                <HeadlessSelect
                  value={String(editedFlow.offer_creative_id || "")}
                  onChange={(value) =>
                    setEditedFlow({
                      ...editedFlow,
                      offer_creative_id: parseInt(value) || undefined,
                    })
                  }
                  options={[
                    { value: "", label: "Select Creative" },
                    // Add creative options here when available from API
                  ]}
                />
              </div>
            </div>

            {/* Status */}
            <div>
              <div
                className="flex items-center gap-2 cursor-pointer"
                onClick={() =>
                  setEditedFlow({
                    ...editedFlow,
                    is_active: !(editedFlow.is_active !== false),
                  })
                }
              >
                <Checkbox
                  id="flowActive"
                  checked={editedFlow.is_active !== false}
                  onChange={() =>
                    setEditedFlow({
                      ...editedFlow,
                      is_active: !(editedFlow.is_active !== false),
                    })
                  }
                />
                <span className={`text-sm font-medium ${tw.textPrimary}`}>
                  Active Flow
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-3 justify-end">
            <button
              onClick={handleClose}
              disabled={isActionLoading}
              className={`px-6 ${tw.rounded} text-sm font-medium transition-colors disabled:opacity-50`}
              style={{
                backgroundColor: "#F3F4F6",
                color: "#374151",
                border: `1px solid #E5E7EB`,
              }}
            >
              Cancel
            </button>
            <button
              onClick={onSave}
              disabled={
                isActionLoading ||
                isLoadingActiveData ||
                (editedFlow.flow_type === "AB_TEST" &&
                  !editedFlow.bucket_allocation)
              }
              className={`px-6 ${tw.rounded} text-white font-medium transition-colors disabled:opacity-50`}
              style={{
                backgroundColor: button.action.background,
                color: button.action.color,
                padding: `${button.action.paddingY} ${button.action.paddingX}`,
              }}
              title={
                editedFlow.flow_type === "AB_TEST" &&
                !editedFlow.bucket_allocation
                  ? "Bucket allocation is required for A/B Test"
                  : ""
              }
            >
              {isActionLoading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
