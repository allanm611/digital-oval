import React from "react";
import { Search } from "lucide-react";
import Input from "../../../shared/components/ui/Input";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import { SegmentCondition } from "../types/segment";
import { KPIConditionType } from "../types/segment";
import { getOperatorsForFieldType } from "../../../shared/utils/operatorMapper";

interface MetricsConditionRowProps {
  groupId: string;
  condition: SegmentCondition;
  updateCondition: (groupId: string, conditionId: string, updates: Partial<SegmentCondition>) => void;
  setCurrentEditingCondition: (data: { groupId: string; conditionId: string }) => void;
  zIndex: Record<string, number>;
  tw: Record<string, string>;
  color: any;
  line?: "1" | "2";
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
}) => {

  // For numeric KPI fields (Revenue, Usage), show dual operators
  const isNumericKPI =
    condition.conditionType === "revenue_metric" ||
    condition.conditionType === "usage_metric";

  // Check if selected operator is a date operator
  const isDateOperator = ["on_date", "between_dates", "since_date", "until_date"].includes(
    condition.operator?.toLowerCase() || "",
  );

  const categoryName = getKPICategoryForConditionType(condition.conditionType);
  const categoryLabel = categoryName
    ? `Select a ${categoryName.toLowerCase()}...`
    : "Select a KPI...";

  if (line === "1") {
    return (
      <div className="min-w-[280px] flex-1 max-w-[600px]">
        <div
          className={`w-full px-3 py-2 border border-gray-300 ${tw.rounded} text-sm text-left flex items-center justify-between`}
        >
          <span
            className={condition.kpi_name ? "text-gray-900" : "text-gray-500"}
          >
            {condition.kpi_name || categoryLabel}
          </span>
        </div>
      </div>
    );
  }

  // Line 2: Operator, Value, Date Range Inputs
  return condition.kpi_name ? (
        <>
          {/* For numeric KPIs: Show combined operator dropdown (numeric + date options) */}
          {isNumericKPI ? (
            <>
              {/* Wrapper for operator + value + date inputs ALL on one line */}
              <div className="flex items-center gap-2 w-full overflow-x-auto">
                {/* Operator Dropdown - Load from operatorMapper (single source of truth) */}
                <div className="min-w-[220px] max-w-[280px] flex-shrink-0">
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

                      const today = new Date().toISOString().split("T")[0];
                      const thirtyDaysAgo = new Date();
                      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                      const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split("T")[0];

                      let defaultValue: any = "";

                      // Auto-populate default dates for date operators
                      if (operator === "on_date") {
                        defaultValue = today;
                      } else if (operator === "between_dates") {
                        defaultValue = `${thirtyDaysAgoStr}T00:00:00Z,${today}T23:59:59Z`;
                      } else if (operator === "since_date") {
                        defaultValue = `${thirtyDaysAgoStr}T00:00:00Z`;
                      } else if (operator === "until_date") {
                        defaultValue = `${today}T23:59:59Z`;
                      }

                      updateCondition(groupId, condition.id, {
                        operator: operator as SegmentCondition["operator"],
                        operator_id: operatorId,
                        value: defaultValue,
                        start_date: undefined,
                        end_date: undefined,
                      });
                    }}
                    placeholder="Select operator"
                    className="text-sm"
                    zIndex={zIndex.popover}
                  />
                </div>

                {/* Numeric Value Input - Only show if NOT a date operator */}
                {!isDateOperator && (
                  <Input
                    type="number"
                    value={condition.value as string | number}
                    onChange={(value) => {
                      updateCondition(groupId, condition.id, {
                        value: String(value) ? parseFloat(String(value)) : "",
                      });
                    }}
                    placeholder="Enter value"
                    className={` min-w-[100px] max-w-[150px]`}
                    style={{ borderColor: color.border.default }}
                  />
                )}

                {/* Date Operator Inputs */}
                {isDateOperator ? (
                  <>
                    {condition.operator === "on_date" && (
                      <Input
                        type="date"
                        value={
                          condition.value
                            ? (condition.value as string).split("T")[0]
                            : ""
                        }
                        onChange={(value) => {
                          updateCondition(groupId, condition.id, {
                            value: String(value)
                              ? `${String(value)}T00:00:00Z`
                              : "",
                          });
                        }}
                        placeholder="Select date"
                        className={` min-w-[140px] max-w-[180px]`}
                        style={{ borderColor: color.border.default }}
                      />
                    )}

                    {condition.operator === "between_dates" && (
                      <>
                        <Input
                          type="date"
                          value={
                            condition.value
                              ? (condition.value as string).split(",")[0].split("T")[0] || ""
                              : ""
                          }
                          onChange={(value) => {
                            const endDatePart = condition.value
                              ? (condition.value as string).split(",")[1] || ""
                              : "";
                            const endDate = endDatePart.split("T")[0];
                            updateCondition(groupId, condition.id, {
                              value: String(value)
                                ? `${String(value)}T00:00:00Z,${endDate}T23:59:59Z`
                                : "",
                            });
                          }}
                          placeholder="From date"
                          className={` min-w-[140px] max-w-[180px]`}
                          style={{ borderColor: color.border.default }}
                        />
                        <Input
                          type="date"
                          value={
                            condition.value
                              ? (condition.value as string).split(",")[1].split("T")[0] || ""
                              : ""
                          }
                          onChange={(value) => {
                            const startDatePart = condition.value
                              ? (condition.value as string).split(",")[0] || ""
                              : "";
                            const startDate = startDatePart.split("T")[0];
                            updateCondition(groupId, condition.id, {
                              value: startDate
                                ? `${startDate}T00:00:00Z,${String(value)}T23:59:59Z`
                                : `${String(value)}T23:59:59Z`,
                            });
                          }}
                          placeholder="To date"
                          className={` min-w-[140px] max-w-[180px]`}
                          style={{ borderColor: color.border.default }}
                        />
                      </>
                    )}

                    {condition.operator === "since_date" && (
                      <Input
                        type="date"
                        value={
                          condition.value
                            ? (condition.value as string).split("T")[0]
                            : ""
                        }
                        onChange={(value) => {
                          updateCondition(groupId, condition.id, {
                            value: String(value)
                              ? `${String(value)}T00:00:00Z`
                              : "",
                          });
                        }}
                        placeholder="From date"
                        className={` min-w-[140px] max-w-[180px]`}
                        style={{ borderColor: color.border.default }}
                      />
                    )}

                    {condition.operator === "until_date" && (
                      <Input
                        type="date"
                        value={
                          condition.value
                            ? (condition.value as string).split("T")[0]
                            : ""
                        }
                        onChange={(value) => {
                          updateCondition(groupId, condition.id, {
                            value: String(value)
                              ? `${String(value)}T23:59:59Z`
                              : "",
                          });
                        }}
                        placeholder="To date"
                        className={` min-w-[140px] max-w-[180px]`}
                        style={{ borderColor: color.border.default }}
                      />
                    )}
                  </>
                ) : null}
              </div>
            </>
          ) : (
            /* Non-numeric KPIs - only show basic operators and value input */
            <>
              <div className="min-w-[220px] max-w-[300px] flex-shrink-0">
                <HeadlessSelect
                  options={[
                    { value: "equals", label: "Equals" },
                    { value: "not_equals", label: "Not Equals" },
                    { value: "greater_than", label: "Greater Than" },
                    { value: "less_than", label: "Less Than" },
                    { value: "contains", label: "Contains" },
                    { value: "not_contains", label: "Not Contains" },
                    { value: "in", label: "In" },
                    { value: "not_in", label: "Not In" },
                    { value: "in_last_days", label: "In Last Days" },
                  ]}
                  value={condition.operator}
                  onChange={(value) => {
                    updateCondition(groupId, condition.id, {
                      operator: value as SegmentCondition["operator"],
                      value: "",
                      time_unit: undefined,
                    });
                  }}
                  placeholder="Select operator"
                  className="text-sm"
                  zIndex={zIndex.popover}
                />
              </div>

              <Input
                type={
                  condition.operator === "in_last_days"
                    ? "number"
                    : "text"
                }
                value={condition.value as string}
                onChange={(value) => {
                  updateCondition(groupId, condition.id, {
                    value: String(value),
                  });
                }}
                placeholder={
                  condition.operator === "in_last_days"
                    ? "Enter days (e.g., 30)"
                    : "Enter value"
                }
                className={` min-w-[100px] flex-1 max-w-[200px]`}
                style={{ borderColor: color.border.default }}
              />
            </>
          )}
        </>
    ) : null;
};
