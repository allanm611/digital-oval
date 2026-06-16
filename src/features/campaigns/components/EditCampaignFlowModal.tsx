import { X } from "lucide-react";
import { color, tw, button } from "../../../shared/utils/utils";
import Input from "../../../shared/components/ui/Input";
import Textarea from "../../../shared/components/ui/Textarea";
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
              <Input
                type="text"
                label="Campaign ID"
                readOnly
                value={campaignId || selectedFlow?.campaign_id || ""}
                style={{ borderColor: color.border.default }}
              />

              {/* Campaign Type - Read Only Input */}
              <Input
                type="text"
                label="Campaign Type"
                readOnly
                value={flowTypeLabel}
                style={{ borderColor: color.border.default }}
              />
            </div>

            {/* Core Selection */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <HeadlessSelect
                  label="Segment"
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

                <HeadlessSelect
                  label="Offer"
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

              <div>
                <Textarea
                  label="Condition Rule (JSON)"
                  value={rawConditionRuleInput}
                  onChange={(value) => {
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
                  className="font-mono text-xs"
                  hasError={!!conditionRuleError}
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
                <Input
                  type="number"
                  label="Step Order"
                  min="1"
                  value={editedFlow.step_order ?? ""}
                  onChange={(value) =>
                    setEditedFlow({
                      ...editedFlow,
                      step_order: value !== "" ? parseInt(String(value)) : undefined,
                    })
                  }
                  placeholder="1"
                />

                <Input
                  type="number"
                  label="Wait Interval (hours)"
                  min="0"
                  value={editedFlow.wait_interval_hours ?? ""}
                  onChange={(value) =>
                    setEditedFlow({
                      ...editedFlow,
                      wait_interval_hours: value !== "" ? parseInt(String(value)) : undefined,
                    })
                  }
                  placeholder="0"
                />
              </div>

              <div>
                <Input
                  type="text"
                  label={
                    editedFlow.flow_type === "AB_TEST"
                      ? "Bucket Allocation *"
                      : "Bucket Allocation"
                  }
                  placeholder="e.g., 50-50"
                  value={editedFlow.bucket_allocation || ""}
                  onChange={(value) =>
                    setEditedFlow({
                      ...editedFlow,
                      bucket_allocation: String(value),
                    })
                  }
                  hasError={
                    editedFlow.flow_type === "AB_TEST" &&
                    !editedFlow.bucket_allocation
                  }
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
              <HeadlessSelect
                label="Offer Creative"
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
              {isActionLoading ? "Updating..." : "Update"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
