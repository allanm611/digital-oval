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
  OPERATOR_LABELS,
} from "../types/segment";
import { color, tw, zIndex } from "../../../shared/utils/utils";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import { useSegmentationFields } from "../hooks/useSegmentationFields";
import SegmentPickerModal from "./SegmentPickerModal";
import QuickListPickerModal from "./QuickListPickerModal";
import SystemEventPickerModal from "./SystemEventPickerModal";
import CreateQuickListModal from "../../quicklists/components/CreateQuickListModal";
import { quicklistService } from "../../quicklists/services/quicklistService";
import { SYSTEM_EVENTS, TIME_OPERATOR_OPTIONS, type SystemEvent, type SystemEventTimeOperator } from "../../kpis/types/systemEvent";
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
}

export default function SegmentConditionsBuilder({
  conditions,
  onChange,
}: SegmentConditionsBuilderProps) {
  const generateId = () => Math.random().toString(36).substr(2, 9);
  const [isSegmentModalOpen, setIsSegmentModalOpen] = useState(false);
  const [isQuickListModalOpen, setIsQuickListModalOpen] = useState(false);
  const [isSystemEventModalOpen, setIsSystemEventModalOpen] = useState(false);
  const [isCreateQuickListModalOpen, setIsCreateQuickListModalOpen] =
    useState(false);
  const [isKPIModalOpen, setIsKPIModalOpen] = useState(false);
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

  const addConditionGroup = () => {
    const firstField = allFields.length > 0 ? allFields[0] : null;
    const defaultFieldValue = firstField
      ? firstField.field_value
      : SEGMENT_FIELDS[0].key;
    const defaultFieldId = firstField ? firstField.id : undefined;
    const defaultOperatorId = firstField?.operators[0]?.id;

    const newGroup: SegmentConditionGroup = {
      id: generateId(),
      operator: "AND",
      groupOperator: "AND",
      conditions: [
        {
          id: generateId(),
          conditionType: "360_profile",
          category: categories.length > 0 ? 1 : undefined,
          field: defaultFieldValue,
          field_id: defaultFieldId,
          operator: "equals",
          operator_id: defaultOperatorId,
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
    const firstField = allFields.length > 0 ? allFields[0] : null;
    const defaultFieldValue = firstField
      ? firstField.field_value
      : SEGMENT_FIELDS[0].key;
    const defaultFieldId = firstField ? firstField.id : undefined;
    const defaultOperatorId = firstField?.operators[0]?.id;

    const newCondition: SegmentCondition = {
      id: generateId(),
      conditionType: "360_profile",
      category: categories.length > 0 ? 1 : undefined,
      field: defaultFieldValue,
      field_id: defaultFieldId,
      operator: "equals",
      operator_id: defaultOperatorId,
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
      switch (backendField.field_type) {
        case "numeric":
          return "number";
        case "text":
          return "string";
        case "boolean":
          return "boolean";
        default:
          return "string";
      }
    }
    const field = SEGMENT_FIELDS.find((f) => f.key === fieldKey);
    return field?.type || "string";
  };

  const getAvailableOperators = (fieldKey: string) => {
    const backendField = getFieldByValue(fieldKey);
    if (backendField && backendField.operators.length > 0) {
      return backendField.operators.map((op) => {
        const symbolMap: Record<string, string> = {
          "=": "equals",
          "!=": "not_equals",
          ">": "greater_than",
          "<": "less_than",
          IN: "in",
          "NOT IN": "not_in",
          LIKE: "contains",
          "NOT LIKE": "not_contains",
        };
        return symbolMap[op.symbol] || op.label;
      });
    }
    const field = SEGMENT_FIELDS.find((f) => f.key === fieldKey);
    return field?.operators || ["equals"];
  };

  // Render condition based on type
  const renderConditionFields = (
    groupId: string,
    condition: SegmentCondition,
  ) => {
    switch (condition.conditionType) {
      case "360_profile":
        return render360ProfileFields(groupId, condition);
      case "segment":
        return renderSegmentFields(groupId, condition);
      case "list":
        return renderListFields(groupId, condition);
      case "system_event":
        return renderSystemEventFields(groupId, condition);
      case "revenue_metric_kpi":
      case "usage_metric_kpi":
        return renderKPIFields(groupId, condition);
      default:
        return null;
    }
  };

  // Render 360 Profile condition fields
  const render360ProfileFields = (
    groupId: string,
    condition: SegmentCondition,
  ) => {
    const backendField = condition.field
      ? getFieldByValue(condition.field)
      : null;
    const isDropdown = backendField?.ui?.component_type === "dropdown";
    const distinctValues = backendField?.validation?.distinct_values || [];

    return (
      <>
        {/* Category Selection */}
        <div className="min-w-[150px] max-w-[180px] flex-shrink-0">
          <HeadlessSelect
            options={categories.map((cat, index) => ({
              value: cat.id ? cat.id.toString() : (index + 1).toString(),
              label: cat.name || cat.category || `Category ${index + 1}`,
            }))}
            value={condition.category !== undefined ? condition.category.toString() : ""}
            onChange={(value) => {
              const categoryId = parseInt(value as string);
              // Try to find by ID first, then by index
              let selectedCategory = categories.find((c) => c.id === categoryId);
              if (!selectedCategory) {
                selectedCategory = categories[categoryId - 1];
              }
              const categoryFields = selectedCategory?.fields || [];
              const firstField =
                categoryFields.length > 0 ? categoryFields[0] : null;

              updateCondition(groupId, condition.id, {
                category: categoryId,
                field: firstField ? firstField.field_value : "",
                field_id: firstField?.id,
                operator: "equals",
                operator_id: firstField?.operators[0]?.id,
                value: "",
              });
            }}
            placeholder="Select category"
            className="text-sm"
            zIndex={zIndex.popover}
          />
        </div>

        {/* Field Selection - Filtered by category */}
        <div className="min-w-[180px] max-w-[220px] flex-shrink-0">
          <HeadlessSelect
            options={(() => {
              if (condition.category !== undefined && condition.category !== null) {
                const categoryId = condition.category as number;
                // Try to find by ID first, then by index
                let selectedCategory = categories.find((c) => c.id === categoryId);
                if (!selectedCategory) {
                  selectedCategory = categories[categoryId - 1];
                }
                const fieldsToShow = selectedCategory?.fields || [];
                return fieldsToShow.map((field) => ({
                  value: field.field_value,
                  label: field.field_name,
                }));
              }
              const fieldsToShow =
                allFields.length > 0 ? allFields : SEGMENT_FIELDS;
              return fieldsToShow.map((field) => ({
                value: "field_value" in field ? field.field_value : field.key,
                label: "field_name" in field ? field.field_name : field.label,
              }));
            })()}
            value={condition.field || ""}
            onChange={(value) => {
              const fieldType = getFieldType(value as string);
              const availableOperators = getAvailableOperators(value as string);
              const backendField = getFieldByValue(value as string);
              const firstOperator = backendField?.operators[0];

              const symbolMap: Record<string, string> = {
                "=": "equals",
                "!=": "not_equals",
                ">": "greater_than",
                "<": "less_than",
                IN: "in",
                "NOT IN": "not_in",
                LIKE: "contains",
                "NOT LIKE": "not_contains",
              };
              const mappedOperator = firstOperator
                ? symbolMap[firstOperator.symbol] || firstOperator.label
                : availableOperators[0];

              updateCondition(groupId, condition.id, {
                field: value as string,
                field_id: backendField?.id,
                operator: mappedOperator as SegmentCondition["operator"],
                operator_id: firstOperator?.id,
                type: fieldType,
                value: fieldType === "number" ? 0 : "",
              });
            }}
            placeholder="Select field"
            className="text-sm"
            zIndex={zIndex.popover}
          />
        </div>

        {/* Operator Selection */}
        <div className="min-w-[100px] max-w-[130px] flex-shrink-0">
          <HeadlessSelect
            options={(() => {
              const field = condition.field
                ? getFieldByValue(condition.field)
                : null;
              if (field && field.operators.length > 0) {
                return field.operators.map((op) => {
                  const symbolMap: Record<string, string> = {
                    "=": "equals",
                    "!=": "not_equals",
                    ">": "greater_than",
                    "<": "less_than",
                    IN: "in",
                    "NOT IN": "not_in",
                    LIKE: "contains",
                    "NOT LIKE": "not_contains",
                  };
                  const mappedOp = symbolMap[op.symbol] || op.label;
                  return {
                    value: `${mappedOp}|${op.id}`,
                    label: op.label.charAt(0).toUpperCase() + op.label.slice(1),
                  };
                });
              }
              return getAvailableOperators(condition.field || "").map((op) => ({
                value: `${op}|`,
                label: OPERATOR_LABELS[op],
              }));
            })()}
            value={
              condition.operator_id
                ? `${condition.operator}|${condition.operator_id}`
                : `${condition.operator}|`
            }
            onChange={(value) => {
              const [operator, operatorId] = (value as string).split("|");
              updateCondition(groupId, condition.id, {
                operator: operator as SegmentCondition["operator"],
                operator_id: operatorId ? parseInt(operatorId) : undefined,
              });
            }}
            placeholder="Select operator"
            className="text-sm"
            zIndex={zIndex.popover}
          />
        </div>

        {/* Value Input */}
        {isDropdown && distinctValues.length > 0 ? (
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
            className={`px-3 py-2 border border-[${tw.borderDefault}] ${tw.rounded} focus:outline-none text-sm min-w-[160px] flex-1 max-w-[250px]`}
          />
        )}
      </>
    );
  };

  // Render Segment condition fields
  const renderSegmentFields = (
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
        <div className="min-w-[200px] flex-1 max-w-[350px]">
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

        {/* Operator for Segment */}
        <div className="min-w-[100px] max-w-[130px] flex-shrink-0">
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

  // Render List (QuickList) condition fields
  const renderListFields = (groupId: string, condition: SegmentCondition) => {
    const handleOpenQuickListModal = () => {
      setCurrentEditingCondition({
        groupId,
        conditionId: condition.id,
      });
      setIsQuickListModalOpen(true);
    };

    const handleOpenCreateModal = () => {
      setCurrentEditingCondition({
        groupId,
        conditionId: condition.id,
      });
      setIsCreateQuickListModalOpen(true);
    };

    return (
      <>
        {/* QuickList Selection */}
        <div className="min-w-[200px] flex-1 max-w-[500px] flex gap-2">
          <button
            type="button"
            onClick={handleOpenQuickListModal}
            className={`flex-1 px-3 py-2 border border-gray-300 ${tw.rounded} focus:outline-none text-sm text-left flex items-center justify-between hover:border-gray-400 transition-colors`}
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
          <button
            type="button"
            onClick={handleOpenCreateModal}
            className={`px-4 py-2 text-sm font-medium ${tw.rounded} text-white whitespace-nowrap`}
            style={{ backgroundColor: color.primary.action }}
          >
            Create quick list
          </button>
        </div>

        {/* Operator for List */}
        <div className="min-w-[100px] max-w-[130px] flex-shrink-0">
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
  const renderSystemEventFields = (
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

    // Get the selected event to determine available operators
    const selectedEvent = SYSTEM_EVENTS.find(
      (e) => e.event_name === condition.system_event_name
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
        {/* System Event Selection */}
        <div className="min-w-[200px] flex-1 max-w-[400px]">
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

        {/* Time Operator for System Event - Only show if event selected */}
        {selectedEvent && availableOperators.length > 0 && (
          <>
            <div className="min-w-[180px] max-w-[220px] flex-shrink-0">
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
        {selectedEvent && currentOperatorOption && currentOperatorOption.requiresValue && (
          <div className="min-w-[100px] max-w-[120px] flex-shrink-0">
            <input
              type="number"
              value={condition.value || ""}
              onChange={(e) => {
                updateCondition(groupId, condition.id, {
                  value: e.target.value ? parseInt(e.target.value) : "",
                });
              }}
              placeholder={currentOperatorOption.placeholder || "Enter value"}
              className={`w-full px-3 py-2 border border-gray-300 ${tw.rounded} focus:outline-none text-sm`}
              style={{ borderColor: color.border.default }}
            />
          </div>
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
  const renderKPIFields = (
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
        <div className="min-w-[200px] flex-1 max-w-[500px]">
          <button
            type="button"
            onClick={handleOpenKPIModal}
            className={`w-full px-3 py-2 border border-gray-300 ${tw.rounded} focus:outline-none text-sm text-left flex items-center justify-between hover:border-gray-400 transition-colors`}
          >
            <span
              className={
                condition.kpi_name ? "text-gray-900" : "text-gray-500"
              }
            >
              {condition.kpi_name || categoryLabel}
            </span>
            <Search className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* Operator for KPI - Only show if KPI selected */}
        {condition.kpi_name && (
          <>
            <div className="min-w-[100px] max-w-[150px] flex-shrink-0">
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
                  // Time-based operators for metrics
                  { value: "in_last_days", label: "In Last (Days)" },
                  { value: "in_last_weeks", label: "In Last (Weeks)" },
                  { value: "in_last_months", label: "In Last (Months)" },
                  { value: "greater_than_in_period", label: "Greater Than In Period" },
                  { value: "less_than_in_period", label: "Less Than In Period" },
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

            {/* Value Input */}
            <input
              type="text"
              value={condition.value as string}
              onChange={(e) => {
                updateCondition(groupId, condition.id, {
                  value: e.target.value,
                });
              }}
              placeholder={
                ["in_last_days", "in_last_weeks", "in_last_months"].includes(
                  condition.operator
                )
                  ? "Enter number"
                  : "Enter value"
              }
              className={`px-3 py-2 border border-gray-300 ${tw.rounded} focus:outline-none text-sm min-w-[100px] flex-1 max-w-[200px]`}
              style={{ borderColor: color.border.default }}
            />

            {/* Time Unit Selector - For time-based operators */}
            {["in_last_days", "in_last_weeks", "in_last_months"].includes(
              condition.operator
            ) && (
              <div className="min-w-[80px] max-w-[120px] flex-shrink-0">
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
    <div className="space-y-4">
      {conditions.map((group, groupIndex) => (
        <div
          key={group.id}
          className={`border border-gray-200 ${tw.rounded} p-4 bg-gray-50`}
        >
          {/* Group Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              {/* Operator Between Groups - Only show for 2nd group onwards */}
              {groupIndex > 0 && (
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-medium text-gray-500 uppercase">
                    Between Groups:
                  </span>
                  <div className="w-20">
                    <HeadlessSelect
                      options={[
                        { value: "AND", label: "AND" },
                        { value: "OR", label: "OR" },
                      ]}
                      value={conditions[groupIndex - 1].groupOperator || "AND"}
                      onChange={(value) =>
                        updateConditionGroup(conditions[groupIndex - 1].id, {
                          groupOperator: value as "AND" | "OR",
                        })
                      }
                      placeholder="AND"
                      className="text-sm"
                      zIndex={zIndex.popover}
                    />
                  </div>
                  <div className="h-6 w-px bg-gray-300 mx-1" />
                </div>
              )}

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
                  className={`flex items-center flex-wrap gap-3 p-3 ${tw.rounded} border transition-colors hover:border-gray-300`}
                  style={{
                    backgroundColor: color.surface.background,
                    borderColor: color.border.muted,
                  }}
                >
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
                      e.currentTarget.style.borderColor = color.primary.accent;
                      e.currentTarget.style.backgroundColor = `${color.primary.accent}08`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = color.border.default;
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
                        options={[
                          { value: "360_profile", label: "360 Profile" },
                          { value: "segment", label: "Segment" },
                          { value: "list", label: "QuickList" },
                          { value: "system_event", label: "System Event" },
                          { value: "revenue_metric_kpi", label: "Revenue Metric" },
                          { value: "usage_metric_kpi", label: "Usage Metric" },
                        ]}
                        value={condition.conditionType}
                        onChange={(value) => {
                          const condType = value as
                            | "360_profile"
                            | "segment"
                            | "list"
                            | "system_event"
                            | "revenue_metric_kpi"
                            | "usage_metric_kpi";
                          // Reset condition based on type
                          if (condType === "360_profile") {
                            const firstField =
                              allFields.length > 0 ? allFields[0] : null;
                            updateCondition(group.id, condition.id, {
                              conditionType: condType,
                              category:
                                categories.length > 0
                                  ? categories[0].id
                                  : undefined,
                              field: firstField?.field_value || "",
                              field_id: firstField?.id,
                              operator: "equals",
                              operator_id: firstField?.operators[0]?.id,
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
                          } else if (
                            condType === "revenue_metric_kpi" ||
                            condType === "usage_metric_kpi"
                          ) {
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
                              system_event_id: undefined,
                              system_event_code: undefined,
                              system_event_name: undefined,
                              kpi_id: undefined,
                              kpi_name: undefined,
                              kpi_category: getKPICategoryForConditionType(condType),
                            });
                          }
                        }}
                        placeholder="Select type"
                        className="text-sm"
                        zIndex={zIndex.popover}
                      />
                    </div>
                  </div>

                  {/* Render fields based on condition type */}
                  {renderConditionFields(group.id, condition)}

                  {/* Remove Condition */}
                  <button
                    type="button"
                    onClick={() => removeCondition(group.id, condition.id)}
                    className="p-1 text-red-600 hover:text-red-700 hover:bg-red-100 rounded transition-colors flex-shrink-0"
                    title="Remove Condition"
                    disabled={group.conditions.length === 1}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>

          {/* Add Condition Button */}
          <button
            type="button"
            onClick={() => addCondition(group.id)}
            className={`mt-3 inline-flex items-center px-3 py-2 text-sm text-white ${tw.rounded} transition-colors`}
            style={{
              backgroundColor: color.primary.action,
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Condition
          </button>
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
        onSelect={(segment) => {
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

      {/* Create QuickList Modal */}
      <CreateQuickListModal
        isOpen={isCreateQuickListModalOpen}
        onClose={() => {
          setIsCreateQuickListModalOpen(false);
          setCurrentEditingCondition(null);
        }}
        onSubmit={async (request) => {
          const response = await quicklistService.createQuickList(request);

          // Auto-select the newly created quicklist
          if (currentEditingCondition && response) {
            // Extract the quicklist data from response
            const quicklistData = response.data || response;
            const quicklistId = quicklistData.id || (Array.isArray(quicklistData) ? quicklistData[0]?.id : undefined);
            const quicklistName = quicklistData.name || (Array.isArray(quicklistData) ? quicklistData[0]?.name : undefined);

            if (quicklistId && quicklistName) {
              updateCondition(
                currentEditingCondition.groupId,
                currentEditingCondition.conditionId,
                {
                  list_id: quicklistId,
                  list_name: quicklistName,
                }
              );
            }
          }

          setIsCreateQuickListModalOpen(false);
          setCurrentEditingCondition(null);
        }}
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
          category={getKPICategoryForConditionType(
            currentKPIModalType,
          ) as KPI["category"]}
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
    </div>
  );
}
