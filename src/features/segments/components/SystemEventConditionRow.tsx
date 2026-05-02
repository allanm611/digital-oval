import React from "react";
import { Search } from "lucide-react";
import Input from "../../../shared/components/ui/Input";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import { SegmentCondition } from "../types/segment";
import { SYSTEM_EVENTS, SystemEventTimeOperator, TIME_OPERATOR_OPTIONS } from "../../kpis/types/systemEvent";
import { getDefaultDatesForOperator, getTodayDateString } from "../utils/segmentConditionUtils";

interface SystemEventConditionRowProps {
  groupId: string;
  condition: SegmentCondition;
  updateCondition: (groupId: string, conditionId: string, updates: Partial<SegmentCondition>) => void;
  setCurrentEditingCondition: (data: { groupId: string; conditionId: string }) => void;
  setIsSystemEventModalOpen: (open: boolean) => void;
  zIndex: Record<string, number>;
  tw: Record<string, string>;
  color: any;
}

export const SystemEventConditionRow: React.FC<SystemEventConditionRowProps> = ({
  groupId,
  condition,
  updateCondition,
  setCurrentEditingCondition,
  setIsSystemEventModalOpen,
  zIndex,
  tw,
  color,
}) => {
  const handleOpenSystemEventModal = () => {
    setCurrentEditingCondition({
      groupId,
      conditionId: condition.id,
    });
    setIsSystemEventModalOpen(true);
  };

  // Get the selected event to determine available operators
  const selectedEvent = SYSTEM_EVENTS.find(
    (e) => e.event_name === condition.system_event_name,
  );

  // Get available time operators for this event
  const availableOperators = selectedEvent
    ? selectedEvent.time_operators.map((op) => ({
        value: op,
        label: TIME_OPERATOR_OPTIONS[op].label,
      }))
    : [];

  const currentOperatorOption = condition.operator
    ? TIME_OPERATOR_OPTIONS[condition.operator as SystemEventTimeOperator]
    : null;

  return (
    <div className="flex gap-3 items-center flex-1">
      {/* Event Picker */}
      <div className="min-w-[280px] flex-1 max-w-[600px]">
        <button
          type="button"
          onClick={handleOpenSystemEventModal}
          className={`w-full px-3 py-2 border border-gray-300 ${tw.rounded} focus:outline-none text-sm text-left flex items-center justify-between hover:border-gray-400 transition-colors`}
        >
          <span
            className={
              condition.system_event_name ? "text-gray-900" : "text-gray-500"
            }
          >
            {condition.system_event_name || "Select event..."}
          </span>
          <Search className="w-4 h-4 text-gray-400" />
        </button>
      </div>

      {/* Time Operator, Value Input, Unit Selector */}
      <>
        {/* Time Operator Dropdown */}
          <div className="min-w-[180px] flex-shrink-0">
            <HeadlessSelect
              options={availableOperators}
              value={condition.operator || ""}
              onChange={(value) => {
                const defaultDates = getDefaultDatesForOperator(value);
                const today = getTodayDateString();

                let defaultValue: any = "";
                if (value === "on_date" || value === "until_date") {
                  defaultValue = defaultDates.start_date || today;
                } else if (value === "between_dates") {
                  defaultValue = {
                    start: defaultDates.start_date?.split("T")[0] || today,
                    end: defaultDates.end_date?.split("T")[0] || today,
                  };
                } else if (value === "since_date") {
                  defaultValue = defaultDates.start_date?.split("T")[0] || today;
                }

                updateCondition(groupId, condition.id, {
                  operator: value as SystemEventTimeOperator,
                  value: defaultValue,
                });
              }}
              placeholder="Select time condition"
              className="text-sm"
              zIndex={zIndex.popover}
            />
          </div>

          {/* Value Input - Only show if event selected and operator requires value */}
          {currentOperatorOption && currentOperatorOption.requiresValue && (
            <>
              {condition.operator === "on_date" ? (
                <div className="min-w-[180px] flex-shrink-0">
                  <Input
                    type="date"
                    value={
                      (typeof condition.value === "string"
                        ? condition.value
                        : "") || ""
                    }
                    onChange={(value) => {
                      updateCondition(groupId, condition.id, {
                        value: String(value) || "",
                      });
                    }}
                  />
                </div>
              ) : condition.operator === "between_dates" ? (
                <>
                  <div className="min-w-[180px] flex-shrink-0">
                    <Input
                      type="date"
                      value={
                        condition.value && typeof condition.value === "object"
                          ? (condition.value as { start: string; end: string })
                              .start || ""
                          : ""
                      }
                      onChange={(value) => {
                        const currentVal =
                          condition.value && typeof condition.value === "object"
                            ? (condition.value as {
                                start: string;
                                end: string;
                              })
                            : { start: "", end: "" };
                        updateCondition(groupId, condition.id, {
                          value: { ...currentVal, start: String(value) },
                        });
                      }}
                      placeholder="Start date"
                      className={`w-full py-2 border border-gray-300 ${tw.rounded} focus:outline-none text-sm`}
                      style={{ borderColor: color.border.default }}
                    />
                  </div>
                  <div className="min-w-[180px] flex-shrink-0">
                    <Input
                      type="date"
                      value={
                        condition.value && typeof condition.value === "object"
                          ? (condition.value as { start: string; end: string })
                              .end || ""
                          : ""
                      }
                      onChange={(value) => {
                        const currentVal =
                          condition.value && typeof condition.value === "object"
                            ? (condition.value as {
                                start: string;
                                end: string;
                              })
                            : { start: "", end: "" };
                        updateCondition(groupId, condition.id, {
                          value: { ...currentVal, end: String(value) },
                        });
                      }}
                      placeholder="End date"
                      className={`w-full py-2 border border-gray-300 ${tw.rounded} focus:outline-none text-sm`}
                      style={{ borderColor: color.border.default }}
                    />
                  </div>
                </>
              ) : (
                <div className="min-w-[100px] max-w-[120px] flex-shrink-0">
                  <Input
                    type="number"
                    value={
                      typeof condition.value === "object"
                        ? ""
                        : condition.value || ""
                    }
                    onChange={(value) => {
                      updateCondition(groupId, condition.id, {
                        value: String(value) ? parseInt(String(value)) : "",
                      });
                    }}
                    placeholder={
                      currentOperatorOption.placeholder || "Enter value"
                    }
                  />
                </div>
              )}
            </>
          )}

          {/* Unit Selector (for "Occurred in Last" operator) */}
          {condition.operator === "occurred_in_last" && (
            <div className="min-w-[90px] max-w-[110px] flex-shrink-0">
              <HeadlessSelect
                options={[
                  { value: "days", label: "Days" },
                  { value: "weeks", label: "Weeks" },
                  { value: "months", label: "Months" },
                ]}
                value={condition.time_unit || "days"}
                onChange={(value) => {
                  updateCondition(groupId, condition.id, {
                    time_unit: value as string,
                  });
                }}
                placeholder="Select unit"
                className="text-sm"
                zIndex={zIndex.popover}
              />
            </div>
          )}
      </>
    </div>
  );
};
