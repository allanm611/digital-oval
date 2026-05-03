import React from "react";
import Input from "../../../shared/components/ui/Input";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import { SegmentCondition } from "../types/segment";
import { getOperatorsForFieldType, TIME_WINDOWS, DATE_OPERATORS } from "../../../shared/utils/operatorMapper";
import { getKPICategoryForConditionType } from "../../kpis/types/kpiConditionMapping";
import { getTodayDateString, getDefaultDatesForOperator } from "../utils/segmentConditionUtils";

interface MetricsConditionRowProps {
  groupId: string;
  condition: SegmentCondition;
  updateCondition: (groupId: string, conditionId: string, updates: Partial<SegmentCondition>) => void;
  setCurrentEditingCondition: (data: { groupId: string; conditionId: string }) => void;
  zIndex: Record<string, number>;
  tw: Record<string, string>;
  color: any;
  line?: "1" | "2";
  categories?: any[];
  allFields?: any[];
  setFieldPickerModalOpen?: (open: boolean) => void;
  setFieldPickerModalData?: (data: any) => void;
}

export const MetricsConditionRow: React.FC<MetricsConditionRowProps> = ({
  groupId,
  condition,
  updateCondition,
  setCurrentEditingCondition,
  zIndex,
  tw,
  color,
  line = "1",
  categories = [],
  setFieldPickerModalOpen,
  setFieldPickerModalData,
}) => {
  const isNumericKPI =
    condition.conditionType === "revenue_metric" ||
    condition.conditionType === "usage_metric";

  const categoryName = getKPICategoryForConditionType(condition.conditionType);
  const categoryId = condition.category;
  const categoryFields = categories.find((c) => c.id === categoryId)?.fields || [];

  const isDateOperator = ["on_date", "between_dates", "since_date", "until_date"].includes(
    (condition.operator || "").toLowerCase()
  );

  // LINE 1: Field | Operator | Time Window (no redundant category label)
  if (line === "1") {
    return (
      <div className="flex items-center gap-3 flex-1">
        {/* Field Picker Button */}
        <button
          type="button"
          onClick={() => {
            setCurrentEditingCondition({
              groupId,
              conditionId: condition.id,
            });
            const categoryName = categories.find((c) => c.id === categoryId)?.name || "Field";
            setFieldPickerModalData?.({
              fields: categoryFields.map((f: any) => ({
                value: f.field_value,
                label: f.field_name,
                description: f.field_description || "Unknown",
                type: f.field_type || "Unknown",
              })),
              categoryName,
            });
            setFieldPickerModalOpen?.(true);
          }}
          className={`flex-1 min-w-[140px] px-3 py-2 ${tw.rounded} text-sm text-left transition-all`}
          style={{
            backgroundColor: color.surface.background,
            borderColor: color.border.default,
            border: `1px solid ${color.border.default}`,
          }}
        >
          {condition.field_name || "Select field"}
        </button>

        {/* Operator Dropdown */}
        <div className="flex-1 min-w-[120px]">
          <HeadlessSelect
            options={(() => {
              const operators = getOperatorsForFieldType("money");
              return operators.map((op) => ({
                value: `${op.label}|${op.id}`,
                label: op.label
                  .split("_")
                  .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
                  .join(" "),
              }));
            })()}
            value={`${condition.operator}|${condition.operator_id}`}
            onChange={(value) => {
              const [operator, operatorIdStr] = (value as string).split("|");
              const operatorId = parseInt(operatorIdStr);
              const isDateOp = ["on_date", "since_date", "until_date", "between_dates"].includes(operator.toLowerCase());

              const updates: Partial<SegmentCondition> = {
                operator: operator as SegmentCondition["operator"],
                operator_id: operatorId,
              };

              if (isDateOp) {
                const defaultDates = getDefaultDatesForOperator(operator);
                if (operator === "on_date") {
                  updates.value = defaultDates.value;
                  updates.start_date = undefined;
                  updates.end_date = undefined;
                } else {
                  updates.start_date = defaultDates.start_date;
                  updates.end_date = defaultDates.end_date;
                }
              }

              updateCondition(groupId, condition.id, updates);
            }}
            placeholder="Select operator"
            className="text-sm"
            zIndex={zIndex.popover}
          />
        </div>

        {/* Time Window Dropdown - Hidden when date operator is selected from main operator dropdown */}
        {!isDateOperator && (
          <div className="flex-1 min-w-[120px]">
            <HeadlessSelect
              options={TIME_WINDOWS.map((tw) => ({
                value: tw.value,
                label: tw.label,
              }))}
              value={condition.time_window || "last_7_days"}
              onChange={(value) => {
                const updates: Partial<SegmentCondition> = {
                  time_window: value as string,
                };

                // When selecting "custom", set a default date operator (on_date = 12)
                if (value === "custom") {
                  updates.date_operator_id = 12; // on_date default
                  updates.date_operator = "on";
                } else {
                  // Clear custom date operator when switching away from custom
                  updates.date_operator_id = undefined;
                  updates.date_operator = undefined;
                }

                updateCondition(groupId, condition.id, updates);
              }}
              placeholder="Last 7 Days"
              className="text-sm"
              zIndex={zIndex.popover}
            />
          </div>
        )}
      </div>
    );
  }

  // LINE 2: Value Input + Date Inputs + Optional Date Operator Dropdown (when custom time window)
  return (
    <div className="flex items-center gap-3">
      <Input
        type="number"
        value={condition.value as string | number}
        onChange={(value) => {
          updateCondition(groupId, condition.id, {
            value: String(value) ? parseFloat(String(value)) : "",
          });
        }}
        placeholder={condition.operator === "between" ? "Min value" : "Enter value"}
        className="min-w-[140px] max-w-[200px]"
        style={{ borderColor: color.border.default }}
      />

      {/* Show second value input for between operator */}
      {condition.operator === "between" && (
        <Input
          type="number"
          value={condition.value_end as string | number}
          onChange={(value) => {
            updateCondition(groupId, condition.id, {
              value_end: String(value) ? parseFloat(String(value)) : "",
            });
          }}
          placeholder="Max value"
          className="min-w-[140px] max-w-[200px]"
          style={{ borderColor: color.border.default }}
        />
      )}

      {/* Show date inputs when main operator is a date operator */}
      {isDateOperator && (condition.operator === "on_date" || condition.operator === "since_date" || condition.operator === "until_date") && (
        <Input
          type="date"
          value={condition.start_date || ""}
          onChange={(value) => {
            updateCondition(groupId, condition.id, {
              start_date: value as string,
            });
          }}
          max={getTodayDateString()}
          placeholder="Date"
          className="min-w-[140px]"
          style={{ borderColor: color.border.default }}
        />
      )}

      {/* Show two date inputs for between_dates operator */}
      {isDateOperator && condition.operator === "between_dates" && (
        <>
          <Input
            type="date"
            value={condition.start_date || ""}
            onChange={(value) => {
              updateCondition(groupId, condition.id, {
                start_date: value as string,
              });
            }}
            max={getTodayDateString()}
            placeholder="Start date"
            className="min-w-[140px]"
            style={{ borderColor: color.border.default }}
          />
          <Input
            type="date"
            value={condition.end_date || ""}
            onChange={(value) => {
              updateCondition(groupId, condition.id, {
                end_date: value as string,
              });
            }}
            max={getTodayDateString()}
            placeholder="End date"
            className="min-w-[140px]"
            style={{ borderColor: color.border.default }}
          />
        </>
      )}

      {/* Show date operator dropdown if "custom" time window is selected and main operator is not a date operator */}
      {!isDateOperator && condition.time_window === "custom" && (
        <>
          <HeadlessSelect
            options={DATE_OPERATORS.map((op) => ({
              value: String(op.id),
              label: op.label,
            }))}
            value={condition.date_operator_id ? String(condition.date_operator_id) : "12"}
            onChange={(value) => {
              const operatorId = parseInt(value);
              const operator = DATE_OPERATORS.find((op) => op.id === operatorId);
              const operatorLabel = operator?.label.toLowerCase().replace(/\s+/g, "_") || "";
              const defaultDates = getDefaultDatesForOperator(operatorLabel);

              updateCondition(groupId, condition.id, {
                date_operator_id: operatorId,
                date_operator: operator?.value,
                start_date: defaultDates.start_date,
                end_date: defaultDates.end_date,
              });
            }}
            placeholder="Select date operator"
            className="text-sm min-w-[150px]"
            zIndex={zIndex.popover}
          />

          {/* Date input fields based on selected operator */}
          {(!condition.date_operator_id || condition.date_operator_id === 12 || condition.date_operator_id === 14 || condition.date_operator_id === 15) && (
            <Input
              type="date"
              value={condition.start_date || ""}
              onChange={(value) => {
                updateCondition(groupId, condition.id, {
                  start_date: value as string,
                });
              }}
              max={getTodayDateString()}
              placeholder="Start date"
              className="min-w-[140px]"
              style={{ borderColor: color.border.default }}
            />
          )}

          {/* Between operator needs two dates */}
          {condition.date_operator_id === 13 && (
            <>
              <Input
                type="date"
                value={condition.start_date || ""}
                onChange={(value) => {
                  updateCondition(groupId, condition.id, {
                    start_date: value as string,
                  });
                }}
                max={getTodayDateString()}
                placeholder="Start date"
                className="min-w-[140px]"
                style={{ borderColor: color.border.default }}
              />
              <Input
                type="date"
                value={condition.end_date || ""}
                onChange={(value) => {
                  updateCondition(groupId, condition.id, {
                    end_date: value as string,
                  });
                }}
                max={getTodayDateString()}
                placeholder="End date"
                className="min-w-[140px]"
                style={{ borderColor: color.border.default }}
              />
            </>
          )}
        </>
      )}
    </div>
  );
};
