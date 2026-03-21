import { useState } from "react";
import {
  Plus,
  Trash2,
  Loader2,
  Search,
  User,
  Users,
  List,
  Zap,
  DollarSign,
  Activity,
} from "lucide-react";
import {
  SegmentCondition,
  SegmentConditionGroup,
  SEGMENT_FIELDS,
} from "../types/segment";
import { color, tw, zIndex } from "../../../shared/utils/utils";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import { useSegmentationFields } from "../hooks/useSegmentationFields";
import { getOperatorsForFieldType } from "../../../shared/utils/operatorMapper";
import SegmentPickerModal from "./SegmentPickerModal";
import QuickListPickerModal from "./QuickListPickerModal";
import SystemEventPickerModal from "./SystemEventPickerModal";
import FieldPickerModal from "./FieldPickerModal";
import { quicklistService } from "../../quicklists/services/quicklistService";
import {
  SYSTEM_EVENTS,
  TIME_OPERATOR_OPTIONS,
  type SystemEvent,
  type SystemEventTimeOperator,
} from "../../kpis/types/systemEvent";
import KPIPickerModal from "../../kpis/components/KPIPickerModal";
import {
  KPI_CONDITION_CONFIG,
  getKPICategoryForConditionType,
  type KPIConditionType,
} from "../../kpis/types/kpiConditionMapping";
import { type KPI } from "../../kpis/types/kpi";
import { generateAllKPIs } from "../../kpis/utils/kpiGenerator";

const allKPIs = generateAllKPIs();

interface SegmentConditionsBuilderProps {
  conditions: SegmentConditionGroup[];
  onChange: (conditions: SegmentConditionGroup[]) => void;
  onSegmentValidate?: (
    segmentId: number,
  ) => Promise<{ valid: boolean; error?: string }>;
  onValidationError?: (error: string) => void;
}

export default function SegmentConditionsBuilder({
  conditions,
  onChange,
  onSegmentValidate,
  onValidationError,
}: SegmentConditionsBuilderProps) {
  const generateId = () => Math.random().toString(36).substr(2, 9);
  const [isSegmentModalOpen, setIsSegmentModalOpen] = useState(false);
  const [isQuickListModalOpen, setIsQuickListModalOpen] = useState(false);
  const [isSystemEventModalOpen, setIsSystemEventModalOpen] = useState(false);
  const [isKPIModalOpen, setIsKPIModalOpen] = useState(false);
  const [isFieldPickerModalOpen, setIsFieldPickerModalOpen] = useState(false);
  const [fieldPickerModalData, setFieldPickerModalData] = useState<{
    fields: Array<{ value: string; label: string }>;
    categoryName: string;
  } | null>(null);
  const [currentKPIModalType, setCurrentKPIModalType] =
    useState<KPIConditionType | null>(null);
  const [currentEditingCondition, setCurrentEditingCondition] = useState<{
    groupId: string;
    conditionId: string;
  } | null>(null);

  // Get icon for condition type (using theme colors only)
  const getConditionTypeIcon = (type: string) => {
    switch (type) {
      case "360_profile":
        return User;
      case "segment":
        return Users;
      case "list":
        return List;
      case "system_event":
        return Zap;
      case "revenue_metric_kpi":
        return DollarSign;
      case "usage_metric_kpi":
        return Activity;
      default:
        return User;
    }
  };

  // Load segmentation fields from backend
  const {
    categories,
    allFields,
    isLoading: isLoadingFields,
    error: fieldsError,
    getFieldByValue,
  } = useSegmentationFields();

  // Helper: get the first operator from a backend field's operators array
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getFirstBackendOperator = (
    field: Record<string, any> | null | undefined,
  ) => {
    if (
      field?.operators &&
      Array.isArray(field.operators) &&
      field.operators.length > 0
    ) {
      return field.operators[0];
    }
    // Fallback to operatorMapper if backend doesn't provide operators
    const ops = getOperatorsForFieldType(field?.field_type || "text");
    return ops.length > 0
      ? { id: ops[0].id, label: ops[0].label }
      : { id: 1, label: "equals" };
  };

  // Helper: get all operators for a backend field (prefer field.operators[], fallback to mapper)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getBackendOperators = (
    field: Record<string, any> | null | undefined,
  ) => {
    if (
      field?.operators &&
      Array.isArray(field.operators) &&
      field.operators.length > 0
    ) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return field.operators.map((op: Record<string, any>) => ({
        id: op.id,
        label: op.label,
        symbol: op.symbol,
        requiresValue: op.requires_value !== false,
        requiresTwoValues: op.requires_two_values === true,
      }));
    }
    return getOperatorsForFieldType(field?.field_type || "text");
  };

  // Helper: check if a field is a date/timestamp field
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const isDateFieldType = (field: Record<string, any> | null | undefined) => {
    if (!field?.field_type) return false;
    const ft = field.field_type.toLowerCase();
    return (
      ft === "date" ||
      ft === "timestamp" ||
      ft === "timestamptz" ||
      ft === "datetime"
    );
  };

  const addConditionGroup = () => {
    const fieldsArray = Array.isArray(allFields) ? allFields : [];
    const categoriesArray = Array.isArray(categories) ? categories : [];

    const firstField = fieldsArray.length > 0 ? fieldsArray[0] : null;
    const defaultFieldValue = firstField
      ? firstField.field_value
      : SEGMENT_FIELDS.length > 0
        ? SEGMENT_FIELDS[0].key
        : "";
    const defaultFieldId = firstField ? firstField.id : undefined;

    // Get default operator from backend field's operators array
    const firstOp = getFirstBackendOperator(firstField);

    const newGroup: SegmentConditionGroup = {
      id: generateId(),
      operator: "AND",
      groupOperator: "AND",
      conditions: [
        {
          id: generateId(),
          conditionType: "360_profile",
          category: categoriesArray.length > 0 ? 1 : undefined,
          field: defaultFieldValue,
          field_name: firstField?.field_name,
          field_id: defaultFieldId,
          operator: firstOp.label || "equals",
          operator_id: firstOp.id,
          value: "",
          type: "string",
        },
      ],
    };
    onChange([...conditions, newGroup]);
  };

  const removeConditionGroup = (groupId: string) => {
    onChange(conditions.filter((group) => group.id !== groupId));
  };

  const updateConditionGroup = (
    groupId: string,
    updates: Partial<SegmentConditionGroup>,
  ) => {
    onChange(
      conditions.map((group) =>
        group.id === groupId ? { ...group, ...updates } : group,
      ),
    );
  };

  const addCondition = (groupId: string) => {
    const fieldsArray = Array.isArray(allFields) ? allFields : [];
    const categoriesArray = Array.isArray(categories) ? categories : [];

    const firstField = fieldsArray.length > 0 ? fieldsArray[0] : null;
    const defaultFieldValue = firstField
      ? firstField.field_value
      : SEGMENT_FIELDS.length > 0
        ? SEGMENT_FIELDS[0].key
        : "";
    const defaultFieldId = firstField ? firstField.id : undefined;

    // Get default operator from backend field's operators array
    const firstOp = getFirstBackendOperator(firstField);

    const newCondition: SegmentCondition = {
      id: generateId(),
      conditionType: "360_profile",
      category: categoriesArray.length > 0 ? 1 : undefined,
      field: defaultFieldValue,
      field_name: firstField?.field_name,
      field_id: defaultFieldId,
      operator: firstOp.label || "equals",
      operator_id: firstOp.id,
      value: "",
      type: "string",
    };

    onChange(
      conditions.map((group) =>
        group.id === groupId
          ? { ...group, conditions: [...group.conditions, newCondition] }
          : group,
      ),
    );
  };

  const removeCondition = (groupId: string, conditionId: string) => {
    onChange(
      conditions.map((group) =>
        group.id === groupId
          ? {
              ...group,
              conditions: group.conditions.filter((c) => c.id !== conditionId),
            }
          : group,
      ),
    );
  };

  const updateCondition = (
    groupId: string,
    conditionId: string,
    updates: Partial<SegmentCondition>,
  ) => {
    onChange(
      conditions.map((group) =>
        group.id === groupId
          ? {
              ...group,
              conditions: group.conditions.map((condition) =>
                condition.id === conditionId
                  ? { ...condition, ...updates }
                  : condition,
              ),
            }
          : group,
      ),
    );
  };

  const getFieldType = (fieldKey: string) => {
    const backendField = getFieldByValue(fieldKey);
    if (backendField) {
      const ft = (backendField.field_type || "").toLowerCase();
      switch (ft) {
        case "numeric":
        case "number":
        case "money":
        case "integer":
        case "decimal":
          return "number";
        case "text":
        case "varchar":
        case "string":
          return "string";
        case "boolean":
        case "bool":
          return "boolean";
        case "date":
        case "timestamp":
        case "timestamptz":
        case "datetime":
          return "string"; // dates are stored as ISO strings
        default:
          return "string";
      }
    }
    const field = SEGMENT_FIELDS.find((f) => f.key === fieldKey);
    return field?.type || "string";
  };

  // Build unified data source options combining categories and special types
  const getDataSourceOptions = () => {
    const options: {
      value: string;
      label: string;
      type: SegmentCondition["conditionType"];
    }[] = [];

    // Add field categories (360_profile)
    const categoriesArray = Array.isArray(categories) ? categories : [];
    categoriesArray.forEach((cat) => {
      options.push({
        value: `360_profile:${cat.id}`,
        label: cat.name || cat.category || "Unknown",
        type: "360_profile",
      });
    });

    // Add special types
    options.push({ value: "segment", label: "Segment", type: "segment" });
    options.push({
      value: "system_event",
      label: "System Event",
      type: "system_event",
    });
    options.push({ value: "list", label: "QuickList", type: "list" });

    return options;
  };

  // Render condition based on type
  const renderLine1Fields = (groupId: string, condition: SegmentCondition) => {
    switch (condition.conditionType) {
      case "360_profile":
        return render360ProfileLine1Fields(groupId, condition);
      case "segment":
        return renderSegmentLine1Fields(groupId, condition);
      case "list":
        return renderListLine1Fields(groupId, condition);
      case "system_event":
        return renderSystemEventLine1Fields(groupId, condition);
      case "revenue_metric_kpi":
      case "usage_metric_kpi":
        return renderKPILine1Fields(groupId, condition);
      default:
        return null;
    }
  };

  const renderLine2Fields = (groupId: string, condition: SegmentCondition) => {
    switch (condition.conditionType) {
      case "360_profile":
        return render360ProfileLine2Fields(groupId, condition);
      case "segment":
        return renderSegmentLine2Fields(groupId, condition);
      case "list":
        return renderListLine2Fields(groupId, condition);
      case "system_event":
        return renderSystemEventLine2Fields(groupId, condition);
      case "revenue_metric_kpi":
      case "usage_metric_kpi":
        return renderKPILine2Fields(groupId, condition);
      default:
        return null;
    }
  };

  // Render 360 Profile condition fields - Line 1 (Field + Operator on same line)
  const render360ProfileLine1Fields = (
    groupId: string,
    condition: SegmentCondition,
  ) => {
    const getFieldOptions = () => {
      if (
        condition.category !== undefined &&
        condition.category !== null
      ) {
        const categoryId = condition.category as number;
        const categoriesArray = Array.isArray(categories)
          ? categories
          : [];
        // Try to find by ID first, then by index
        let selectedCategory = categoriesArray.find(
          (c) => c.id === categoryId,
        );
        if (!selectedCategory) {
          selectedCategory = categoriesArray[categoryId - 1];
        }
        const fieldsToShow = selectedCategory?.fields || [];
        return fieldsToShow.map((field) => ({
          value: field.field_value || "",
          label: field.field_name || "Unknown",
          description: field.field_description || "Unknown",
          type: field.field_type || "Unknown",
        }));
      }
      const fieldsArray = Array.isArray(allFields) ? allFields : [];
      const fieldsToShow =
        fieldsArray.length > 0 ? fieldsArray : SEGMENT_FIELDS;
      return fieldsToShow.map((field) => ({
        value: "field_value" in field ? (field.field_value || "") : (field.key || ""),
        label: "field_name" in field ? (field.field_name || "Unknown") : (field.label || "Unknown"),
        description: "field_description" in field ? (field.field_description || "Unknown") : "Unknown",
        type: "field_type" in field ? (field.field_type || "Unknown") : "Unknown",
      }));
    };

    const fieldOptions = getFieldOptions();
    const selectedField = fieldOptions.find((f) => f.value === condition.field);

    return (
      <>
        {/* Field Selection - Modal Picker */}
        <button
          type="button"
          onClick={() => {
            setCurrentEditingCondition({
              groupId,
              conditionId: condition.id,
            });
            const categoryId = condition.category as number;
            const categoriesArray = Array.isArray(categories) ? categories : [];
            let selectedCategory = categoriesArray.find(
              (c) => c.id === categoryId,
            );
            if (!selectedCategory) {
              selectedCategory = categoriesArray[categoryId - 1];
            }
            setFieldPickerModalData({
              fields: fieldOptions,
              categoryName: selectedCategory?.name || "Field",
            });
            setIsFieldPickerModalOpen(true);
          }}
          className={`min-w-[220px] flex-1 max-w-[350px] px-3 py-2 border border-gray-300 ${tw.rounded} text-sm text-left bg-white hover:bg-gray-50 transition-colors`}
        >
          <span className={selectedField ? "text-gray-900" : "text-gray-500"}>
            {selectedField?.label || "Select field"}
          </span>
        </button>

        {/* Operator Selection - on same line as field (hidden for boolean fields) */}
        {(() => {
          const field = condition.field
            ? getFieldByValue(condition.field)
            : null;
          const isBooleanField = field?.field_type?.toLowerCase() === "boolean";

          if (isBooleanField) {
            return null; // Don't show operator dropdown for boolean fields
          }

          return (
            <div className="min-w-[180px] max-w-[250px] flex-shrink-0">
              <HeadlessSelect
                options={(() => {
                  if (field) {
                    // Use operators from backend field's operators array
                    const operators = getBackendOperators(field);
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    return operators.map((op: Record<string, any>) => ({
                      value: `${op.label}|${op.id}`,
                      label:
                        op.label.charAt(0).toUpperCase() + op.label.slice(1),
                    }));
                  }
                  return [];
                })()}
                value={`${condition.operator}|${condition.operator_id}`}
                onChange={(value) => {
                  const [operator, operatorId] = (value as string).split("|");
                  updateCondition(groupId, condition.id, {
                    operator: operator as SegmentCondition["operator"],
                    operator_id: operatorId ? parseInt(operatorId) : undefined,
                    // Clear date fields and value when operator changes
                    value: "",
                    start_date: undefined,
                    end_date: undefined,
                  });
                }}
                className="text-sm"
                zIndex={zIndex.popover}
              />
            </div>
          );
        })()}
      </>
    );
  };

  // Render 360 Profile condition fields - Line 2 (Value Input - Conditional based on operator)
  const render360ProfileLine2Fields = (
    groupId: string,
    condition: SegmentCondition,
  ) => {
    const backendField = condition.field
      ? getFieldByValue(condition.field)
      : null;
    const isDropdown = backendField?.ui?.component_type === "dropdown";
    const distinctValues = backendField?.validation?.distinct_values || [];
    const operator = condition.operator?.toLowerCase() || "";
    const fieldType = backendField?.field_type?.toLowerCase() || "";
    const isDateField = isDateFieldType(backendField);
    const isBooleanField = fieldType === "boolean" || fieldType === "bool";

    // Check if operator is NULL-type (no value needed) — backend labels: "is empty" / "is not empty"
    const isNullOperator =
      operator.includes("null") || operator.includes("empty");

    // Check if operator needs multiple values (backend labels: "in list" / "not in list")
    const isInListOperator =
      operator === "in list" ||
      operator === "not in list" ||
      operator === "in" ||
      operator === "not in";

    // Check if operator is between (backend label: "between")
    const isBetweenOperator = operator === "between";

    // No value input needed for NULL operators
    if (isNullOperator) {
      return null;
    }

    return (
      <>
        {/* Boolean field - True/False dropdown */}
        {isBooleanField ? (
          <div className="min-w-[120px] flex-1 max-w-[250px]">
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
        ) : isDateField ? (
          // Date fields: use start_date/end_date per backend spec.
          // equals → value (exact match), greater_than/>=  → start_date only,
          // less_than/<= → end_date only, between → start_date + end_date
          <div className="flex gap-2">
            {(operator === "equals" || operator === "not equals") && (
              <input
                type="date"
                placeholder="Date"
                value={
                  condition.value && typeof condition.value === "string"
                    ? condition.value.split("T")[0]
                    : ""
                }
                onChange={(e) => {
                  updateCondition(groupId, condition.id, {
                    value: e.target.value ? `${e.target.value}T00:00:00Z` : "",
                  });
                }}
                className={`px-3 py-2 border border-gray-300 ${tw.rounded} focus:outline-none text-sm min-w-[160px] flex-1`}
              />
            )}
            {(operator === "greater than" ||
              operator === "greater than or equal" ||
              isBetweenOperator) && (
              <input
                type="date"
                placeholder={isBetweenOperator ? "From date" : "After date"}
                value={
                  condition.start_date ? condition.start_date.split("T")[0] : ""
                }
                onChange={(e) => {
                  updateCondition(groupId, condition.id, {
                    start_date: e.target.value
                      ? `${e.target.value}T00:00:00Z`
                      : undefined,
                  });
                }}
                className={`px-3 py-2 border border-gray-300 ${tw.rounded} focus:outline-none text-sm min-w-[160px] flex-1`}
              />
            )}
            {(operator === "less than" ||
              operator === "less than or equal" ||
              isBetweenOperator) && (
              <input
                type="date"
                placeholder={isBetweenOperator ? "To date" : "Before date"}
                value={
                  condition.end_date ? condition.end_date.split("T")[0] : ""
                }
                onChange={(e) => {
                  updateCondition(groupId, condition.id, {
                    end_date: e.target.value
                      ? `${e.target.value}T23:59:59Z`
                      : undefined,
                  });
                }}
                className={`px-3 py-2 border border-gray-300 ${tw.rounded} focus:outline-none text-sm min-w-[160px] flex-1`}
              />
            )}
          </div>
        ) : isInListOperator ? (
          // IN / NOT IN — comma-separated input, stored as array
          <div className="flex gap-2 flex-1">
            <input
              type="text"
              placeholder="Enter comma-separated values (e.g. NAIROBI, MOMBASA)"
              value={
                Array.isArray(condition.value)
                  ? (condition.value as (string | number)[]).join(", ")
                  : (condition.value as string | number) || ""
              }
              onChange={(e) => {
                // Store as array by splitting on commas
                const rawValue = e.target.value;
                const valuesArray = rawValue
                  .split(",")
                  .map((v) => v.trim())
                  .filter((v) => v !== "");
                updateCondition(groupId, condition.id, {
                  value: valuesArray.length > 0 ? valuesArray : rawValue,
                });
              }}
              className={`px-3 py-2 border border-gray-300 ${tw.rounded} focus:outline-none text-sm min-w-[200px] flex-1`}
            />
          </div>
        ) : isBetweenOperator ? (
          // BETWEEN for non-date fields (numeric) — two value inputs
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="Min"
              value={condition.start_date || ""}
              onChange={(e) => {
                updateCondition(groupId, condition.id, {
                  start_date: e.target.value || undefined,
                });
              }}
              className={`px-3 py-2 border border-gray-300 ${tw.rounded} focus:outline-none text-sm min-w-[100px] flex-1`}
            />
            <input
              type="number"
              placeholder="Max"
              value={condition.end_date || ""}
              onChange={(e) => {
                updateCondition(groupId, condition.id, {
                  end_date: e.target.value || undefined,
                });
              }}
              className={`px-3 py-2 border border-gray-300 ${tw.rounded} focus:outline-none text-sm min-w-[100px] flex-1`}
            />
          </div>
        ) : isDropdown && distinctValues.length > 0 ? (
          // Dropdown select if field has distinct values
          <div className="min-w-[160px] flex-1 max-w-[250px]">
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
        ) : (
          // Regular text/number input
          <input
            type={
              getFieldType(condition.field || "") === "number"
                ? "number"
                : "text"
            }
            value={condition.value as string | number}
            onChange={(e) => {
              const fieldType = getFieldType(condition.field || "");
              const value =
                fieldType === "number"
                  ? parseFloat(e.target.value) || 0
                  : e.target.value;
              updateCondition(groupId, condition.id, {
                value,
                type: fieldType,
              });
            }}
            placeholder="Enter value"
            className={`px-3 py-2 border border-gray-300 ${tw.rounded} focus:outline-none text-sm min-w-[160px] flex-1 max-w-[250px]`}
          />
        )}
      </>
    );
  };

  // Render Segment condition fields - Line 1
  const renderSegmentLine1Fields = (
    groupId: string,
    condition: SegmentCondition,
  ) => {
    const handleOpenSegmentModal = () => {
      setCurrentEditingCondition({
        groupId,
        conditionId: condition.id,
      });
      setIsSegmentModalOpen(true);
    };

    return (
      <>
        {/* Segment Selection */}
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
      </>
    );
  };

  // Render Segment condition fields - Line 2
  const renderSegmentLine2Fields = (
    groupId: string,
    condition: SegmentCondition,
  ) => {
    return (
      <>
        {/* Operator for Segment */}
        <div className="min-w-[200px] max-w-[280px] flex-shrink-0">
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
      </>
    );
  };

  // Render List (QuickList) condition fields - Line 1
  const renderListLine1Fields = (
    groupId: string,
    condition: SegmentCondition,
  ) => {
    const handleOpenQuickListModal = () => {
      setCurrentEditingCondition({
        groupId,
        conditionId: condition.id,
      });
      setIsQuickListModalOpen(true);
    };

    return (
      <>
        {/* QuickList Selection */}
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
      </>
    );
  };

  // Render List (QuickList) condition fields - Line 2
  const renderListLine2Fields = (
    groupId: string,
    condition: SegmentCondition,
  ) => {
    return (
      <>
        {/* Operator for List */}
        <div className="min-w-[200px] max-w-[280px] flex-shrink-0">
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
      </>
    );
  };

  // Render System Event condition fields
  const renderSystemEventLine1Fields = (
    groupId: string,
    condition: SegmentCondition,
  ) => {
    const handleOpenSystemEventModal = () => {
      setCurrentEditingCondition({
        groupId,
        conditionId: condition.id,
      });
      setIsSystemEventModalOpen(true);
    };

    return (
      <>
        {/* System Event Selection */}
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
      </>
    );
  };

  const renderSystemEventLine2Fields = (
    groupId: string,
    condition: SegmentCondition,
  ) => {
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
      <>
        {/* Time Operator for System Event - Only show if event selected */}
        {selectedEvent && availableOperators.length > 0 && (
          <>
            <div className="min-w-[200px] max-w-[280px] flex-shrink-0">
              <HeadlessSelect
                options={availableOperators}
                value={condition.operator || ""}
                onChange={(value) => {
                  updateCondition(groupId, condition.id, {
                    operator: value as SystemEventTimeOperator,
                    value: "",
                  });
                }}
                placeholder="Select time condition"
                className="text-sm"
                zIndex={zIndex.popover}
              />
            </div>
          </>
        )}

        {/* Value Input - Only show if event selected and operator requires value */}
        {selectedEvent &&
          currentOperatorOption &&
          currentOperatorOption.requiresValue && (
            <>
              {condition.operator === "on_date" ? (
                <div className="min-w-[180px] flex-shrink-0">
                  <input
                    type="date"
                    value={
                      (typeof condition.value === "string"
                        ? condition.value
                        : "") || ""
                    }
                    onChange={(e) => {
                      updateCondition(groupId, condition.id, {
                        value: e.target.value || "",
                      });
                    }}
                    className={`w-full px-3 py-3 border border-gray-300 ${tw.rounded} focus:outline-none text-sm`}
                    style={{ borderColor: color.border.default }}
                  />
                </div>
              ) : condition.operator === "between_dates" ? (
                <>
                  <div className="min-w-[180px] flex-shrink-0">
                    <input
                      type="date"
                      value={
                        condition.value && typeof condition.value === "object"
                          ? (condition.value as { start: string; end: string })
                              .start || ""
                          : ""
                      }
                      onChange={(e) => {
                        const currentVal =
                          condition.value && typeof condition.value === "object"
                            ? (condition.value as {
                                start: string;
                                end: string;
                              })
                            : { start: "", end: "" };
                        updateCondition(groupId, condition.id, {
                          value: { ...currentVal, start: e.target.value },
                        });
                      }}
                      placeholder="Start date"
                      className={`w-full px-3 py-3 border border-gray-300 ${tw.rounded} focus:outline-none text-sm`}
                      style={{ borderColor: color.border.default }}
                    />
                  </div>
                  <div className="min-w-[180px] flex-shrink-0">
                    <input
                      type="date"
                      value={
                        condition.value && typeof condition.value === "object"
                          ? (condition.value as { start: string; end: string })
                              .end || ""
                          : ""
                      }
                      onChange={(e) => {
                        const currentVal =
                          condition.value && typeof condition.value === "object"
                            ? (condition.value as {
                                start: string;
                                end: string;
                              })
                            : { start: "", end: "" };
                        updateCondition(groupId, condition.id, {
                          value: { ...currentVal, end: e.target.value },
                        });
                      }}
                      placeholder="End date"
                      className={`w-full px-3 py-3 border border-gray-300 ${tw.rounded} focus:outline-none text-sm`}
                      style={{ borderColor: color.border.default }}
                    />
                  </div>
                </>
              ) : (
                <div className="min-w-[100px] max-w-[120px] flex-shrink-0">
                  <input
                    type="number"
                    value={
                      typeof condition.value === "object"
                        ? ""
                        : condition.value || ""
                    }
                    onChange={(e) => {
                      updateCondition(groupId, condition.id, {
                        value: e.target.value ? parseInt(e.target.value) : "",
                      });
                    }}
                    placeholder={
                      currentOperatorOption.placeholder || "Enter value"
                    }
                    className={`w-full px-3 py-3 border border-gray-300 ${tw.rounded} focus:outline-none text-sm`}
                    style={{ borderColor: color.border.default }}
                  />
                </div>
              )}
            </>
          )}

        {/* Unit Selector (for "Occurred in Last" operator) - Only show if event selected */}
        {selectedEvent && condition.operator === "occurred_in_last" && (
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
    );
  };

  // Render KPI condition fields
  const renderKPILine1Fields = (
    groupId: string,
    condition: SegmentCondition,
  ) => {
    const handleOpenKPIModal = () => {
      setCurrentEditingCondition({
        groupId,
        conditionId: condition.id,
      });
      setCurrentKPIModalType(condition.conditionType as KPIConditionType);
      setIsKPIModalOpen(true);
    };

    const categoryName = getKPICategoryForConditionType(
      condition.conditionType,
    );
    const categoryLabel = categoryName
      ? `Select a ${categoryName.toLowerCase()}...`
      : "Select a KPI...";

    return (
      <>
        {/* KPI Selection */}
        <div className="min-w-[280px] flex-1 max-w-[600px]">
          <button
            type="button"
            onClick={handleOpenKPIModal}
            className={`w-full px-3 py-2 border border-gray-300 ${tw.rounded} focus:outline-none text-sm text-left flex items-center justify-between hover:border-gray-400 transition-colors`}
          >
            <span
              className={condition.kpi_name ? "text-gray-900" : "text-gray-500"}
            >
              {condition.kpi_name || categoryLabel}
            </span>
            <Search className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      </>
    );
  };

  const renderKPILine2Fields = (
    groupId: string,
    condition: SegmentCondition,
  ) => {
    return (
      <>
        {/* Operator for KPI - Only show if KPI selected */}
        {condition.kpi_name && (
          <>
            <div className="min-w-[220px] max-w-[300px] flex-shrink-0">
              <HeadlessSelect
                options={[
                  { value: "equals", label: "Equals" },
                  { value: "not_equals", label: "Not Equals" },
                  { value: "on_date", label: "On Date" },
                  { value: "between_dates", label: "Between Dates" },
                  { value: "greater_than", label: "Greater Than" },
                  { value: "less_than", label: "Less Than" },
                  { value: "contains", label: "Contains" },
                  { value: "not_contains", label: "Not Contains" },
                  { value: "in", label: "In" },
                  { value: "not_in", label: "Not In" },
                  // Time-based operators for metrics
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

            {/* Value Input - For "in_last_days" and regular operators */}
            {condition.operator !== "between_dates" &&
              condition.operator !== "on_date" && (
                <input
                  type={
                    condition.operator === "in_last_days" ? "number" : "text"
                  }
                  value={condition.value as string}
                  onChange={(e) => {
                    updateCondition(groupId, condition.id, {
                      value: e.target.value,
                    });
                  }}
                  placeholder={
                    condition.operator === "in_last_days"
                      ? "Enter days (e.g., 30)"
                      : "Enter value"
                  }
                  className={`px-3 py-3 border border-gray-300 ${tw.rounded} focus:outline-none text-sm min-w-[100px] flex-1 max-w-[200px]`}
                  style={{ borderColor: color.border.default }}
                />
              )}

            {/* Single Date Input - For "on_date" operator */}
            {condition.operator === "on_date" && (
              <input
                type="date"
                value={condition.value as string}
                onChange={(e) => {
                  updateCondition(groupId, condition.id, {
                    value: e.target.value,
                  });
                }}
                placeholder="Select Date"
                className={`px-3 py-3 border border-gray-300 ${tw.rounded} focus:outline-none text-sm`}
                style={{ borderColor: color.border.default }}
              />
            )}

            {/* Date Range Inputs - For "between_dates" operator */}
            {condition.operator === "between_dates" && (
              <>
                <input
                  type="date"
                  value={
                    condition.value
                      ? (condition.value as string).split(",")[0] || ""
                      : ""
                  }
                  onChange={(e) => {
                    const endDate = condition.value
                      ? (condition.value as string).split(",")[1] || ""
                      : "";
                    updateCondition(groupId, condition.id, {
                      value: `${e.target.value},${endDate}`,
                    });
                  }}
                  placeholder="Start Date"
                  className={`px-3 py-3 border border-gray-300 ${tw.rounded} focus:outline-none text-sm`}
                  style={{ borderColor: color.border.default }}
                />
                <input
                  type="date"
                  value={
                    condition.value
                      ? (condition.value as string).split(",")[1] || ""
                      : ""
                  }
                  onChange={(e) => {
                    const startDate = condition.value
                      ? (condition.value as string).split(",")[0] || ""
                      : "";
                    updateCondition(groupId, condition.id, {
                      value: `${startDate},${e.target.value}`,
                    });
                  }}
                  placeholder="End Date"
                  className={`px-3 py-3 border border-gray-300 ${tw.rounded} focus:outline-none text-sm`}
                  style={{ borderColor: color.border.default }}
                />
              </>
            )}
          </>
        )}
      </>
    );
  };

  // Show loading state
  if (isLoadingFields) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400 mr-2" />
        <p className="text-gray-500">Loading field configuration...</p>
      </div>
    );
  }

  // Show error if fields failed to load
  if (fieldsError) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-2">Failed to load field configuration</p>
        <p className="text-sm text-gray-500">{fieldsError}</p>
      </div>
    );
  }

  if (conditions.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 mb-4">No conditions defined yet</p>
        <button
          type="button"
          onClick={addConditionGroup}
          className={`inline-flex items-center px-4 py-2 text-sm text-white ${tw.rounded} transition-colors`}
          style={{
            backgroundColor: color.primary.action,
          }}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Condition Group
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {conditions.map((group, groupIndex) => (
        <div key={group.id}>
          <div
            className={`border border-gray-200 ${tw.rounded} p-4 bg-gray-50`}
          >
            {/* Group Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                {/* Operator within group */}
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-medium text-gray-500 uppercase">
                    Within Group:
                  </span>
                  <div className="w-20">
                    <HeadlessSelect
                      options={[
                        { value: "AND", label: "AND" },
                        { value: "OR", label: "OR" },
                      ]}
                      value={group.operator}
                      onChange={(value) =>
                        updateConditionGroup(group.id, {
                          operator: value as "AND" | "OR",
                        })
                      }
                      placeholder="AND"
                      className="text-sm"
                      zIndex={zIndex.popover}
                    />
                  </div>
                </div>

                <span className="text-sm text-gray-600">
                  ({group.conditions.length} condition
                  {group.conditions.length !== 1 ? "s" : ""})
                </span>
              </div>
              <button
                type="button"
                onClick={() => removeConditionGroup(group.id)}
                className="p-1 text-red-600 hover:text-red-700 hover:bg-red-100 rounded transition-colors"
                title="Remove Group"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            {/* Conditions */}
            <div className="space-y-3">
              {group.conditions.map((condition, conditionIndex) => {
                const TypeIcon = getConditionTypeIcon(condition.conditionType);

                return (
                  <div
                    key={condition.id}
                    className={`p-3 ${tw.rounded} border transition-colors hover:border-gray-300`}
                    style={{
                      backgroundColor: color.surface.background,
                      borderColor: color.border.muted,
                    }}
                  >
                    {/* Line 1: Type + Category + Field */}
                    <div className="flex items-center gap-3 mb-3">
                      {/* Type Selector will be injected here */}
                      {conditionIndex > 0 && (
                        <span
                          className={`px-2.5 py-1 text-xs font-semibold ${tw.rounded}`}
                          style={{
                            backgroundColor: `${color.primary.accent}15`,
                            color: color.text.primary,
                          }}
                        >
                          {group.operator}
                        </span>
                      )}

                      {/* Condition Type Badge - Selectable appearance */}
                      <div
                        className={`flex items-center gap-2 px-3 py-2 ${tw.rounded} min-w-[200px] flex-shrink-0 cursor-pointer transition-all hover:shadow-md`}
                        style={{
                          backgroundColor: color.surface.background,
                          border: `1px solid ${color.border.default}`,
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor =
                            color.primary.accent;
                          e.currentTarget.style.backgroundColor = `${color.primary.accent}08`;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor =
                            color.border.default;
                          e.currentTarget.style.backgroundColor =
                            color.surface.background;
                        }}
                      >
                        <TypeIcon
                          className="w-4 h-4 flex-shrink-0"
                          style={{ color: color.text.secondary }}
                        />
                        <div
                          className="flex-1 [&_button]:bg-transparent [&_button]:border-0 [&_button]:p-0 [&_button]:shadow-none [&_button]:font-medium [&_button]:text-sm [&_button]:cursor-pointer"
                          style={{
                            color: color.text.primary,
                          }}
                        >
                          <HeadlessSelect
                            options={getDataSourceOptions().map((opt) => ({
                              value: opt.value,
                              label: opt.label,
                            }))}
                            value={
                              condition.conditionType === "360_profile"
                                ? `360_profile:${condition.category}`
                                : condition.conditionType
                            }
                            onChange={(value) => {
                              const selectedOption =
                                getDataSourceOptions().find(
                                  (opt) => opt.value === value,
                                );
                              if (!selectedOption) return;

                              const condType = selectedOption.type;

                              // Reset condition based on type
                              if (condType === "360_profile") {
                                const fieldsArray = Array.isArray(allFields)
                                  ? allFields
                                  : [];
                                const categoryId = parseInt(
                                  value.split(":")[1] || "1",
                                );
                                const categoriesArray = Array.isArray(
                                  categories,
                                )
                                  ? categories
                                  : [];
                                let selectedCategory = categoriesArray.find(
                                  (c) => c.id === categoryId,
                                );
                                if (!selectedCategory) {
                                  selectedCategory =
                                    categoriesArray[categoryId - 1];
                                }
                                const categoryFields =
                                  selectedCategory?.fields || [];
                                const firstField =
                                  categoryFields.length > 0
                                    ? categoryFields[0]
                                    : fieldsArray[0];

                                // Get first operator from backend field's operators array
                                const firstOp =
                                  getFirstBackendOperator(firstField);

                                updateCondition(group.id, condition.id, {
                                  conditionType: condType,
                                  category: categoryId,
                                  field: firstField
                                    ? firstField.field_value
                                    : "",
                                  field_name: firstField?.field_name,
                                  field_id: firstField?.id,
                                  operator: firstOp.label || "equals",
                                  operator_id: firstOp.id,
                                  value: "",
                                  segment_id: undefined,
                                  segment_name: undefined,
                                  list_id: undefined,
                                  list_name: undefined,
                                  system_event_id: undefined,
                                  system_event_code: undefined,
                                  system_event_name: undefined,
                                  kpi_id: undefined,
                                  kpi_name: undefined,
                                  kpi_category: undefined,
                                });
                              } else if (condType === "segment") {
                                updateCondition(group.id, condition.id, {
                                  conditionType: condType,
                                  operator: "in",
                                  value: "",
                                  category: undefined,
                                  field: undefined,
                                  field_id: undefined,
                                  list_id: undefined,
                                  list_name: undefined,
                                  system_event_id: undefined,
                                  system_event_code: undefined,
                                  system_event_name: undefined,
                                  kpi_id: undefined,
                                  kpi_name: undefined,
                                  kpi_category: undefined,
                                });
                              } else if (condType === "list") {
                                updateCondition(group.id, condition.id, {
                                  conditionType: condType,
                                  operator: "in",
                                  value: "",
                                  category: undefined,
                                  field: undefined,
                                  field_id: undefined,
                                  segment_id: undefined,
                                  segment_name: undefined,
                                  system_event_id: undefined,
                                  system_event_code: undefined,
                                  system_event_name: undefined,
                                  kpi_id: undefined,
                                  kpi_name: undefined,
                                  kpi_category: undefined,
                                });
                              } else if (condType === "system_event") {
                                updateCondition(group.id, condition.id, {
                                  conditionType: condType,
                                  operator: "equals",
                                  value: "",
                                  category: undefined,
                                  field: undefined,
                                  field_id: undefined,
                                  segment_id: undefined,
                                  segment_name: undefined,
                                  list_id: undefined,
                                  list_name: undefined,
                                  kpi_id: undefined,
                                  kpi_name: undefined,
                                  kpi_category: undefined,
                                });
                              }
                            }}
                            placeholder="Select data source"
                            className="text-sm"
                            zIndex={zIndex.popover}
                          />
                        </div>
                      </div>

                      {/* Render Line 1 Fields (Category, Field for 360_profile, etc.) */}
                      {renderLine1Fields(group.id, condition)}
                    </div>

                    {/* Line 2: Operator + Value + Remove */}
                    <div className="flex items-center gap-3">
                      {/* Render Line 2 Fields (Operator, Value for 360_profile, etc.) */}
                      {renderLine2Fields(group.id, condition)}

                      {/* Remove Condition - Only show if more than one condition */}
                      {group.conditions.length > 1 && (
                        <button
                          type="button"
                          onClick={() =>
                            removeCondition(group.id, condition.id)
                          }
                          className="p-1 text-red-600 hover:text-red-700 hover:bg-red-100 rounded transition-colors flex-shrink-0 ml-auto"
                          title="Remove Condition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Add Condition Button */}
            <button
              type="button"
              onClick={() => addCondition(group.id)}
              className={`mt-6 inline-flex items-center px-3 py-2 text-sm text-white ${tw.rounded} transition-colors`}
              style={{
                backgroundColor: color.primary.action,
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Condition
            </button>
          </div>

          {/* Between Groups Operator - Display BETWEEN cards */}
          {groupIndex < conditions.length - 1 && (
            <div className="flex items-center justify-end gap-3 py-4 pr-4">
              <div className="flex-1 h-px bg-gray-300" />
              <div className="flex items-center space-x-2">
                <span className="text-xs font-medium text-gray-500 uppercase whitespace-nowrap">
                  Between Groups:
                </span>
                <div className="w-24">
                  <HeadlessSelect
                    options={[
                      { value: "AND", label: "AND" },
                      { value: "OR", label: "OR" },
                    ]}
                    value={group.groupOperator || "AND"}
                    onChange={(value) =>
                      updateConditionGroup(group.id, {
                        groupOperator: value as "AND" | "OR",
                      })
                    }
                    placeholder="AND"
                    className="text-sm"
                    zIndex={zIndex.popover}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Add Group Button */}
      <button
        type="button"
        onClick={addConditionGroup}
        className={`inline-flex items-center px-4 py-2 text-sm text-white ${tw.rounded} transition-colors`}
        style={{ backgroundColor: color.primary.action }}
      >
        <Plus className="w-4 h-4 mr-2" />
        Add Condition Group
      </button>

      {/* Segment Picker Modal */}
      <SegmentPickerModal
        isOpen={isSegmentModalOpen}
        onClose={() => {
          setIsSegmentModalOpen(false);
          setCurrentEditingCondition(null);
        }}
        onSelect={async (segment) => {
          // Validate segment if validator is provided
          if (onSegmentValidate) {
            const validation = await onSegmentValidate(segment.id!);
            if (!validation.valid) {
              // Validation failed - call error callback instead of alert
              if (onValidationError) {
                onValidationError(
                  validation.error ||
                    "This segment cannot be used as a layer source",
                );
              }
              return;
            }
          }

          if (currentEditingCondition) {
            updateCondition(
              currentEditingCondition.groupId,
              currentEditingCondition.conditionId,
              {
                segment_id: segment.id,
                segment_name: segment.name,
              },
            );
          }
          setIsSegmentModalOpen(false);
          setCurrentEditingCondition(null);
        }}
        selectedSegmentId={
          currentEditingCondition
            ? conditions
                .find((g) => g.id === currentEditingCondition.groupId)
                ?.conditions.find(
                  (c) => c.id === currentEditingCondition.conditionId,
                )?.segment_id
            : undefined
        }
      />

      {/* QuickList Picker Modal */}
      <QuickListPickerModal
        isOpen={isQuickListModalOpen}
        onClose={() => {
          setIsQuickListModalOpen(false);
          setCurrentEditingCondition(null);
        }}
        onSelect={(quicklist) => {
          if (currentEditingCondition) {
            updateCondition(
              currentEditingCondition.groupId,
              currentEditingCondition.conditionId,
              {
                list_id: quicklist.id,
                list_name: quicklist.name,
              },
            );
          }
          setIsQuickListModalOpen(false);
          setCurrentEditingCondition(null);
        }}
        selectedQuickListId={
          currentEditingCondition
            ? conditions
                .find((g) => g.id === currentEditingCondition.groupId)
                ?.conditions.find(
                  (c) => c.id === currentEditingCondition.conditionId,
                )?.list_id
            : undefined
        }
      />

      {/* System Event Picker Modal */}
      <SystemEventPickerModal
        isOpen={isSystemEventModalOpen}
        onClose={() => {
          setIsSystemEventModalOpen(false);
          setCurrentEditingCondition(null);
        }}
        onSelect={(event: SystemEvent) => {
          if (currentEditingCondition) {
            updateCondition(
              currentEditingCondition.groupId,
              currentEditingCondition.conditionId,
              {
                system_event_id: event.id,
                system_event_code: event.event_code,
                system_event_name: event.event_name,
              },
            );
          }
          setIsSystemEventModalOpen(false);
          setCurrentEditingCondition(null);
        }}
      />

      {/* KPI Picker Modal - Only for Revenue and Usage Metrics */}
      {currentKPIModalType && (
        <KPIPickerModal
          isOpen={isKPIModalOpen}
          onClose={() => {
            setIsKPIModalOpen(false);
            setCurrentKPIModalType(null);
            setCurrentEditingCondition(null);
          }}
          onSelect={(kpi: KPI) => {
            if (currentEditingCondition && currentKPIModalType) {
              updateCondition(
                currentEditingCondition.groupId,
                currentEditingCondition.conditionId,
                {
                  kpi_id: kpi.id,
                  kpi_name: kpi.name,
                  kpi_category: kpi.category,
                },
              );
            }
            setIsKPIModalOpen(false);
            setCurrentKPIModalType(null);
            setCurrentEditingCondition(null);
          }}
          kpis={allKPIs}
          category={
            getKPICategoryForConditionType(
              currentKPIModalType,
            ) as KPI["category"]
          }
          title={KPI_CONDITION_CONFIG[currentKPIModalType].kpiCategory}
          searchPlaceholder={`Search ${KPI_CONDITION_CONFIG[currentKPIModalType].kpiCategory.toLowerCase()}...`}
          hasSubcategories={true}
          subcategoryOptions={
            currentKPIModalType === "revenue_metric_kpi"
              ? [
                  { value: "all", label: "All Revenue Metrics" },
                  { value: "data_revenue", label: "Data Revenue" },
                  { value: "voice_revenue", label: "Voice Revenue" },
                  { value: "sms_revenue", label: "SMS Revenue" },
                  { value: "bundle_revenue", label: "Bundle Revenue" },
                  { value: "other_revenue", label: "Other Revenue" },
                ]
              : currentKPIModalType === "usage_metric_kpi"
                ? [
                    { value: "all", label: "All Usage Metrics" },
                    { value: "data_usage", label: "Data Usage" },
                    { value: "voice_usage", label: "Voice Usage" },
                    { value: "sms_usage", label: "SMS Usage" },
                    { value: "bundle_usage", label: "Bundle Usage" },
                    { value: "dou_metrics", label: "DOU Metrics" },
                  ]
                : undefined
          }
        />
      )}

      {/* Field Picker Modal */}
      {fieldPickerModalData && (
        <FieldPickerModal
          isOpen={isFieldPickerModalOpen}
          onClose={() => {
            setIsFieldPickerModalOpen(false);
            setFieldPickerModalData(null);
            setCurrentEditingCondition(null);
          }}
          onSelect={(value) => {
            if (currentEditingCondition) {
              const fieldType = getFieldType(value as string);
              const backendField = getFieldByValue(value as string);

              // Get first operator from backend field's operators array
              const firstOp = getFirstBackendOperator(backendField);

              updateCondition(
                currentEditingCondition.groupId,
                currentEditingCondition.conditionId,
                {
                  field: value as string,
                  field_name: backendField?.field_name,
                  field_id: backendField?.id,
                  operator: firstOp.label as SegmentCondition["operator"],
                  operator_id: firstOp.id,
                  type: fieldType,
                  value: fieldType === "number" ? 0 : "",
                  start_date: undefined,
                  end_date: undefined,
                },
              );
            }
            setIsFieldPickerModalOpen(false);
            setFieldPickerModalData(null);
            setCurrentEditingCondition(null);
          }}
          fields={fieldPickerModalData.fields}
          categoryName={fieldPickerModalData.categoryName}
          selectedValue={
            currentEditingCondition
              ? conditions
                  .find((g) => g.id === currentEditingCondition.groupId)
                  ?.conditions.find(
                    (c) => c.id === currentEditingCondition.conditionId,
                  )?.field
              : undefined
          }
        />
      )}
    </div>
  );
}
