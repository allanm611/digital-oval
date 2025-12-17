import { useState, useEffect } from "react";
import { Plus, Trash2, Loader2, Search, User, Users, List } from "lucide-react";
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
import CreateQuickListModal from "../../quicklists/components/CreateQuickListModal";
import { quicklistService } from "../../quicklists/services/quicklistService";
import { UploadType } from "../../quicklists/types/quicklist";

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
  const [isCreateQuickListModalOpen, setIsCreateQuickListModalOpen] =
    useState(false);
  const [uploadTypes, setUploadTypes] = useState<UploadType[]>([]);
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

  // Load upload types for CreateQuickListModal
  useEffect(() => {
    const loadUploadTypes = async () => {
      try {
        const response = await quicklistService.getUploadTypes({
          activeOnly: true,
          skipCache: true,
        });
        if (response.data && Array.isArray(response.data)) {
          setUploadTypes(response.data);
        }
      } catch (err) {
        console.error("Failed to load upload types:", err);
      }
    };
    loadUploadTypes();
  }, []);

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
          category: categories.length > 0 ? categories[0].id : undefined,
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
    updates: Partial<SegmentConditionGroup>
  ) => {
    onChange(
      conditions.map((group) =>
        group.id === groupId ? { ...group, ...updates } : group
      )
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
      category: categories.length > 0 ? categories[0].id : undefined,
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
          : group
      )
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
          : group
      )
    );
  };

  const updateCondition = (
    groupId: string,
    conditionId: string,
    updates: Partial<SegmentCondition>
  ) => {
    onChange(
      conditions.map((group) =>
        group.id === groupId
          ? {
              ...group,
              conditions: group.conditions.map((condition) =>
                condition.id === conditionId
                  ? { ...condition, ...updates }
                  : condition
              ),
            }
          : group
      )
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
    condition: SegmentCondition
  ) => {
    switch (condition.conditionType) {
      case "360_profile":
        return render360ProfileFields(groupId, condition);
      case "segment":
        return renderSegmentFields(groupId, condition);
      case "list":
        return renderListFields(groupId, condition);
      default:
        return null;
    }
  };

  // Render 360 Profile condition fields
  const render360ProfileFields = (
    groupId: string,
    condition: SegmentCondition
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
            options={categories.map((cat) => ({
              value: cat.id.toString(),
              label: cat.name,
            }))}
            value={condition.category?.toString() || ""}
            onChange={(value) => {
              const categoryId = parseInt(value as string);
              const selectedCategory = categories.find(
                (c) => c.id === categoryId
              );
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
          />
        </div>

        {/* Field Selection - Filtered by category */}
        <div className="min-w-[180px] max-w-[220px] flex-shrink-0">
          <HeadlessSelect
            options={(() => {
              if (condition.category) {
                const selectedCategory = categories.find(
                  (c) => c.id === condition.category
                );
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
    condition: SegmentCondition
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
            Create List
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
          />
        </div>
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
                    className={`flex items-center gap-2 px-3 py-2 ${tw.rounded} min-w-[160px] flex-shrink-0 cursor-pointer transition-all hover:shadow-md`}
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
                        ]}
                        value={condition.conditionType}
                        onChange={(value) => {
                          const condType = value as
                            | "360_profile"
                            | "segment"
                            | "list";
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
                            });
                          }
                        }}
                        placeholder="Select type"
                        className="text-sm"
                        zIndex={zIndex.dropdown}
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
              }
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
                  (c) => c.id === currentEditingCondition.conditionId
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
              }
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
                  (c) => c.id === currentEditingCondition.conditionId
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
          await quicklistService.createQuickList(request);
          setIsCreateQuickListModalOpen(false);
          setCurrentEditingCondition(null);
          // Optionally refresh the quicklist picker or show success message
        }}
        uploadTypes={uploadTypes}
      />
    </div>
  );
}
