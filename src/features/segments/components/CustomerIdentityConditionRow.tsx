import React from "react";
import { SegmentCondition } from "../types/segment";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import Input from "../../../shared/components/ui/Input";
import { Trash2 } from "lucide-react";
import { color, tw, zIndex } from "../../../shared/utils/utils";
import { getOperatorsForField, TIME_WINDOWS, getDateRangeForTimeWindow } from "../../../shared/utils/operatorMapper";

interface CustomerIdentityConditionRowProps {
  groupId: string;
  condition: SegmentCondition;
  updateCondition: (groupId: string, conditionId: string, updates: Partial<SegmentCondition>) => void;
  categories: any[];
  allFields: any[];
  SEGMENT_FIELDS: any[];
  getFieldByValue: (value: string) => any;
  getFieldType: (value: string) => string;
  setCurrentEditingCondition: (data: { groupId: string; conditionId: string }) => void;
  setFieldPickerModalData: (data: any) => void;
  setIsFieldPickerModalOpen: (open: boolean) => void;
  removeCondition?: (groupId: string, conditionId: string) => void;
  line?: "1" | "2";
}

export default function CustomerIdentityConditionRow({
  groupId,
  condition,
  updateCondition,
  categories,
  allFields,
  SEGMENT_FIELDS,
  getFieldByValue,
  getFieldType,
  setCurrentEditingCondition,
  setFieldPickerModalData,
  setIsFieldPickerModalOpen,
  removeCondition,
  line = "1",
}: CustomerIdentityConditionRowProps) {
  const getCategoryAndSubcategory = () => {
    if (condition.category !== undefined && condition.category !== null) {
      const categoryId = condition.category as number;
      const categoriesArray = Array.isArray(categories) ? categories : [];
      let selectedCategory = categoriesArray.find((c) => c.id === categoryId);
      if (!selectedCategory) {
        selectedCategory = categoriesArray[categoryId - 1];
      }
      return selectedCategory;
    }
    return null;
  };

  const selectedCategoryObj = getCategoryAndSubcategory();
  const hasSubcategories = selectedCategoryObj?.sub_categories && selectedCategoryObj.sub_categories.length > 0;

  // Auto-select first subcategory on mount if not already selected
  React.useEffect(() => {
    if (hasSubcategories && !condition.subcategory_id && selectedCategoryObj?.sub_categories?.length > 0) {
      const firstSubcategory = selectedCategoryObj.sub_categories[0];
      updateCondition(groupId, condition.id, {
        subcategory_id: firstSubcategory.id,
        subcategory_name: firstSubcategory.name,
      });
    }
  }, [selectedCategoryObj?.id, hasSubcategories]);

  const getFieldOptions = () => {
    if (!selectedCategoryObj) {
      const fieldsArray = Array.isArray(allFields) ? allFields : [];
      const fieldsToShow = fieldsArray.length > 0 ? fieldsArray : SEGMENT_FIELDS;
      return fieldsToShow.map((field) => ({
        value: "field_value" in field ? (field.field_value || "") : (field.key || ""),
        label: "field_name" in field ? (field.field_name || "Unknown") : (field.label || "Unknown"),
        description: "field_description" in field ? (field.field_description || "Unknown") : "Unknown",
        type: "field_type" in field ? (field.field_type || "Unknown") : "Unknown",
      }));
    }

    if (hasSubcategories && condition.subcategory_id) {
      const selectedSubcategory = selectedCategoryObj.sub_categories.find(
        (sc: any) => sc.id === condition.subcategory_id
      );
      const fieldsToShow = selectedSubcategory?.fields || [];
      return fieldsToShow.map((field: any) => ({
        value: field.field_value || "",
        label: field.field_name || "Unknown",
        description: field.field_description || "Unknown",
        type: field.field_type || "Unknown",
      }));
    }

    if (!hasSubcategories) {
      const fieldsToShow = selectedCategoryObj?.fields || [];
      return fieldsToShow.map((field: any) => ({
        value: field.field_value || "",
        label: field.field_name || "Unknown",
        description: field.field_description || "Unknown",
        type: field.field_type || "Unknown",
      }));
    }

    return [];
  };

  const fieldOptions = getFieldOptions();
  const selectedField = fieldOptions.find((f) => f.value === condition.field);
  const subcategoryOptions = hasSubcategories
    ? (selectedCategoryObj?.sub_categories || []).map((sc: any) => ({
        value: sc.id,
        label: sc.name,
      }))
    : [];

  const maxDate = new Date().toISOString().split("T")[0];

  // Line 1: SubCategory | Field Picker | Operators
  if (line === "1") {
    return (
      <div className="flex items-center gap-3 flex-1">
        {/* SubCategory Selector */}
        {hasSubcategories && (
          <div className="flex-1 min-w-[120px]">
            <div
              className={`${tw.rounded} transition-all cursor-pointer`}
              style={{
                backgroundColor: color.surface.background,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = color.primary.accent;
                e.currentTarget.style.backgroundColor = `${color.primary.accent}08`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = color.border.default;
                e.currentTarget.style.backgroundColor = color.surface.background;
              }}
            >
              <HeadlessSelect
                options={subcategoryOptions}
                value={condition.subcategory_id || ""}
                onChange={(value) => {
                  const subcatId = parseInt(value as string);
                  updateCondition(groupId, condition.id, {
                    subcategory_id: subcatId,
                    subcategory_name: subcategoryOptions.find((opt) => opt.value === subcatId)?.label,
                    field: "",
                    field_name: undefined,
                    field_id: undefined,
                    operator: "equals",
                    operator_id: undefined,
                    value: "",
                  });
                }}
                placeholder="Select subcategory"
                className="text-sm"
                zIndex={zIndex.popover}
              />
            </div>
          </div>
        )}

        {/* Field Picker Button */}
        {(!hasSubcategories || condition.subcategory_id) && (
          <button
            type="button"
            onClick={() => {
              setCurrentEditingCondition({
                groupId,
                conditionId: condition.id,
              });
              const subcategoryName = condition.subcategory_name || selectedCategoryObj?.name || "Field";
              setFieldPickerModalData({
                fields: fieldOptions,
                categoryName: subcategoryName,
              });
              setIsFieldPickerModalOpen(true);
            }}
            className={`flex-1 min-w-[140px] px-3 py-2 ${tw.rounded} text-sm text-left transition-all`}
            disabled={hasSubcategories && !condition.subcategory_id}
            style={{
              backgroundColor: color.surface.background,
              border: `1px solid ${color.border.default}`,
              color: color.text.primary,
            }}
          >
            <span style={{ color: selectedField ? color.text.primary : color.text.secondary }}>
              {selectedField?.label || "Select field"}
            </span>
          </button>
        )}

        {/* Operators Dropdown */}
        {(() => {
          const backendField = getFieldByValue(condition.field);
          let actualField = backendField;
          if (!actualField && hasSubcategories && condition.subcategory_id) {
            const subcategory = selectedCategoryObj?.sub_categories.find(
              (sc: any) => sc.id === condition.subcategory_id
            );
            actualField = subcategory?.fields?.find(
              (f: any) => f.field_value === condition.field
            );
          }

          const isBooleanField = actualField?.field_type?.toLowerCase() === "boolean";
          const isComputable = actualField?.is_computable === true;

          if (isBooleanField) {
            return null;
          }

          return (
            <div className="flex items-center gap-2 flex-1">
              <div className="min-w-[140px] flex-1">
                <div
                  className={`${tw.rounded} transition-all cursor-pointer`}
                  style={{
                    backgroundColor: color.surface.background,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = color.primary.accent;
                    e.currentTarget.style.backgroundColor = `${color.primary.accent}08`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = color.border.default;
                    e.currentTarget.style.backgroundColor = color.surface.background;
                  }}
                >
                  <HeadlessSelect
                    options={(() => {
                      const operators = getOperatorsForField(actualField);
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
                      const [operator, operatorId] = (value as string).split("|");
                      const updates: Partial<SegmentCondition> = {
                        operator: operator as SegmentCondition["operator"],
                        operator_id: operatorId ? parseInt(operatorId) : undefined,
                        value: "",
                        start_date: undefined,
                        end_date: undefined,
                      };

                      if (operator === "between_dates") {
                        const today = new Date();
                        const thirtyDaysAgo = new Date(today);
                        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

                        updates.start_date = thirtyDaysAgo.toISOString().split('T')[0] + "T00:00:00Z";
                        updates.end_date = today.toISOString().split('T')[0] + "T23:59:59Z";
                      }

                      updateCondition(groupId, condition.id, updates);
                    }}
                    className="text-sm"
                    zIndex={zIndex.popover}
                  />
                </div>
              </div>

              {isComputable && !["on_date", "between_dates", "since_date", "until_date"].includes(condition.operator?.toLowerCase() || "") && (
                <div className="min-w-[140px] flex-1">
                  <HeadlessSelect
                    options={TIME_WINDOWS.map((tw) => ({
                      value: tw.value,
                      label: tw.label,
                    }))}
                    value={condition.time_window || "last_7_days"}
                    onChange={(value) => {
                      const tw = value as SegmentCondition["time_window"];
                      const dateRange = tw !== "custom" ? getDateRangeForTimeWindow(tw) : null;

                      updateCondition(groupId, condition.id, {
                        time_window: tw,
                        ...(dateRange ? {
                          start_date: dateRange.start_date,
                          end_date: dateRange.end_date,
                        } : {
                          start_date: undefined,
                          end_date: undefined,
                        }),
                      });
                    }}
                    placeholder="Select time window"
                    className="text-sm"
                    zIndex={zIndex.popover}
                  />
                </div>
              )}
            </div>
          );
        })()}
      </div>
    );
  }

  // Line 2: Value Input | Delete Button
  const renderLine2Fields = () => {
    const backendField = condition.field ? getFieldByValue(condition.field) : null;
    const isDropdown = backendField?.ui?.component_type === "dropdown";
    const distinctValues = backendField?.validation?.distinct_values || [];
    const operator = condition.operator?.toLowerCase() || "";
    const fieldType = backendField?.field_type?.toLowerCase() || "";
    const isDateField = ["date", "timestamp", "timestamptz", "datetime"].includes(fieldType);
    const isBooleanField = fieldType === "boolean" || fieldType === "bool";
    const isNumericField = ["money", "decimal", "numeric"].includes(fieldType);
    const isNullOperator = operator.includes("null") || operator.includes("empty");
    const isInListOperator = operator === "in list" || operator === "not in list" || operator === "in" || operator === "not in";
    const isBetweenOperator = operator === "between";
    const isDateOperator = ["on_date", "between_dates", "since_date", "until_date"].includes(operator);

    if (isNullOperator) {
      return null;
    }

    let valueElement = null;

    // Handle boolean fields
    if (isBooleanField) {
      valueElement = (
        <div className="min-w-[120px] max-w-[250px]">
          <HeadlessSelect
            options={[
              { value: "true", label: "True" },
              { value: "false", label: "False" },
            ]}
            value={
              String(condition.value) === "true"
                ? "true"
                : String(condition.value) === "false"
                  ? "false"
                  : ""
            }
            onChange={(value) => {
              updateCondition(groupId, condition.id, {
                value: value === "true" ? "true" : "false",
                type: "boolean",
              });
            }}
            placeholder="Select value"
            className="text-sm"
            zIndex={zIndex.popover}
          />
        </div>
      );
    } else if (isDateField || isDateOperator) {
      if (operator === "on_date") {
        valueElement = (
          <div className="min-w-[160px] max-w-[160px]">
            <Input type="date"
              placeholder="Select date"
              value={
                condition.value && typeof condition.value === "string"
                  ? condition.value.split("T")[0]
                  : ""
              }
              onChange={(value) => {
                updateCondition(groupId, condition.id, {
                  value: String(value) ? `${String(value)}T00:00:00Z` : "",
                });
              }}
              max={maxDate}
            />
          </div>
        );
      } else if (operator === "since_date") {
        valueElement = (
          <div className="min-w-[160px] max-w-[160px]">
            <Input type="date"
              placeholder="From date"
              value={
                condition.start_date
                  ? condition.start_date.split("T")[0]
                  : ""
              }
              onChange={(value) => {
                updateCondition(groupId, condition.id, {
                  start_date: String(value)
                    ? `${String(value)}T00:00:00Z`
                    : undefined,
                });
              }}
              max={maxDate}
            />
          </div>
        );
      } else if (operator === "until_date") {
        valueElement = (
          <div className="min-w-[160px] max-w-[160px]">
            <Input type="date"
              placeholder="To date"
              value={
                condition.end_date
                  ? condition.end_date.split("T")[0]
                  : ""
              }
              onChange={(value) => {
                updateCondition(groupId, condition.id, {
                  end_date: String(value)
                    ? `${String(value)}T23:59:59Z`
                    : undefined,
                });
              }}
              max={maxDate}
            />
          </div>
        );
      } else if (operator === "between_dates") {
        valueElement = (
          <div className="flex items-center gap-2">
            <div className="min-w-[160px] max-w-[160px]">
              <Input type="date"
                placeholder="From date"
                value={
                  condition.start_date
                    ? condition.start_date.split("T")[0]
                    : ""
                }
                onChange={(value) => {
                  updateCondition(groupId, condition.id, {
                    start_date: String(value) ? `${String(value)}T00:00:00Z` : undefined,
                  });
                }}
                max={maxDate}
              />
            </div>
            <span className="text-gray-500 text-sm">to</span>
            <div className="min-w-[160px] max-w-[160px]">
              <Input type="date"
                placeholder="To date"
                value={
                  condition.end_date
                    ? condition.end_date.split("T")[0]
                    : ""
                }
                onChange={(value) => {
                  updateCondition(groupId, condition.id, {
                    end_date: String(value) ? `${String(value)}T23:59:59Z` : undefined,
                  });
                }}
                max={maxDate}
              />
            </div>
          </div>
        );
      }
    } else if (isInListOperator) {
      valueElement = (
        <div className="min-w-[200px] max-w-[300px]">
          <Input type="text"
            placeholder="Enter comma-separated values (e.g. NAIROBI, MOMBASA)"
            value={
              Array.isArray(condition.value)
                ? (condition.value as (string | number)[]).join(", ")
                : (condition.value as string | number) || ""
            }
            onChange={(value) => {
              updateCondition(groupId, condition.id, {
                value: String(value),
              });
            }}
            onBlur={(e) => {
              const rawValue = String((e.target as HTMLInputElement).value);
              const valuesArray = rawValue
                .split(",")
                .map((v) => v.trim())
                .filter((v) => v !== "");
              updateCondition(groupId, condition.id, {
                value: valuesArray.length > 0 ? valuesArray : rawValue,
              });
            }}
          />
        </div>
      );
    } else if (isBetweenOperator) {
      const betweenValues = Array.isArray(condition.value)
        ? condition.value as (string | number)[]
        : ["", ""];

      valueElement = (
        <div className="flex items-center gap-2">
          <div className="min-w-[100px] max-w-[120px]">
            <Input type="number"
              placeholder="Min"
              value={betweenValues[0] || ""}
              onChange={(value) => {
                updateCondition(groupId, condition.id, {
                  value: [String(value) || "", betweenValues[1] || ""],
                });
              }}
            />
          </div>
          <span className="text-gray-500 text-sm">to</span>
          <div className="min-w-[100px] max-w-[120px]">
            <Input type="number"
              placeholder="Max"
              value={betweenValues[1] || ""}
              onChange={(value) => {
                updateCondition(groupId, condition.id, {
                  value: [betweenValues[0] || "", String(value) || ""],
                });
              }}
            />
          </div>
        </div>
      );
    } else if (isDropdown && distinctValues.length > 0) {
      valueElement = (
        <div className="min-w-[160px] max-w-[250px]">
          <HeadlessSelect
            options={distinctValues.map((val) => ({
              value: val,
              label: val,
            }))}
            value={condition.value as string}
            onChange={(value) => {
              updateCondition(groupId, condition.id, {
                value: value as string,
                type: "string",
              });
            }}
            placeholder="Select value"
            className="text-sm"
            zIndex={zIndex.popover}
          />
        </div>
      );
    } else {
      valueElement = (
        <Input
          type={
            getFieldType(condition.field || "") === "number"
              ? "number"
              : "text"
          }
          value={condition.value as string | number}
          onChange={(value) => {
            const fieldType = getFieldType(condition.field || "");
            const parsedValue =
              fieldType === "number"
                ? parseFloat(String(value)) || 0
                : String(value);
            updateCondition(groupId, condition.id, {
              value: parsedValue,
              type: fieldType,
            });
          }}
          placeholder="Enter value"
          className="min-w-[160px] max-w-[250px]"
        />
      );
    }

    return (
      <div className="flex items-center gap-2 flex-1">
        {valueElement}
        {removeCondition && (
          <button
            type="button"
            onClick={() => removeCondition(groupId, condition.id)}
            className="p-1 text-red-600 hover:text-red-700 hover:bg-red-100 rounded transition-colors flex-shrink-0"
            title="Remove Condition"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    );
  };

  return renderLine2Fields();
}
