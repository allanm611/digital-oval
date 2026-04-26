import React from "react";
import { Search } from "lucide-react";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import { SegmentCondition } from "../types/segment";

interface ListConditionRowProps {
  groupId: string;
  condition: SegmentCondition;
  updateCondition: (groupId: string, conditionId: string, updates: Partial<SegmentCondition>) => void;
  setCurrentEditingCondition: (data: { groupId: string; conditionId: string }) => void;
  setIsQuickListModalOpen: (open: boolean) => void;
  zIndex: Record<string, number>;
  tw: Record<string, string>;
}

export const ListConditionRow: React.FC<ListConditionRowProps> = ({
  groupId,
  condition,
  updateCondition,
  setCurrentEditingCondition,
  setIsQuickListModalOpen,
  zIndex,
  tw,
}) => {
  const handleOpenQuickListModal = () => {
    setCurrentEditingCondition({
      groupId,
      conditionId: condition.id,
    });
    setIsQuickListModalOpen(true);
  };

  return (
    <div className="flex gap-3 items-center flex-1">
      {/* QuickList Picker */}
      <div className="min-w-[280px] flex-1 max-w-[600px]">
        <button
          type="button"
          onClick={handleOpenQuickListModal}
          className={`w-full px-3 py-2 border border-gray-300 ${tw.rounded} focus:outline-none text-sm text-left flex items-center justify-between hover:border-gray-400 transition-colors`}
        >
          <span
            className={
              condition.list_name ? "text-gray-900" : "text-gray-500"
            }
          >
            {condition.list_name || "Select a quicklist..."}
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
