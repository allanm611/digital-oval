import React from "react";
import { Search } from "lucide-react";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import { SegmentCondition } from "../types/segment";

interface SegmentConditionRowProps {
  groupId: string;
  condition: SegmentCondition;
  updateCondition: (groupId: string, conditionId: string, updates: Partial<SegmentCondition>) => void;
  setCurrentEditingCondition: (data: { groupId: string; conditionId: string }) => void;
  setIsSegmentModalOpen: (open: boolean) => void;
  zIndex: Record<string, number>;
  tw: Record<string, string>;
}

export const SegmentConditionRow: React.FC<SegmentConditionRowProps> = ({
  groupId,
  condition,
  updateCondition,
  setCurrentEditingCondition,
  setIsSegmentModalOpen,
  zIndex,
  tw,
}) => {
  const handleOpenSegmentModal = () => {
    setCurrentEditingCondition({
      groupId,
      conditionId: condition.id,
    });
    setIsSegmentModalOpen(true);
  };

  return (
    <div className="flex gap-3 items-center flex-1">
      {/* Segment Picker */}
      <div className="min-w-[280px] flex-1 max-w-[600px]">
        <button
          type="button"
          onClick={handleOpenSegmentModal}
          className={`w-full px-3 py-2 border border-gray-300 ${tw.rounded} focus:outline-none text-sm text-left flex items-center justify-between hover:border-gray-400 transition-colors`}
        >
          <span
            className={
              condition.segment_name ? "text-gray-900" : "text-gray-500"
            }
          >
            {condition.segment_name || "Select a segment..."}
          </span>
          <Search className="w-4 h-4 text-gray-400" />
        </button>
      </div>

      {/* Operator */}
      <div className="min-w-[140px] flex-shrink-0">
        <HeadlessSelect
          options={[
            { value: "in", label: "Is In" },
            { value: "not_in", label: "Is Not In" },
          ]}
          value={condition.operator}
          onChange={(value) => {
            updateCondition(groupId, condition.id, {
              operator: value as "in" | "not_in",
            });
          }}
          placeholder="Select operator"
          className="text-sm"
          zIndex={zIndex.popover}
        />
      </div>
    </div>
  );
};
