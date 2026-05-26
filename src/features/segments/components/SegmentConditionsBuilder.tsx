import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  Plus,
  Trash2,
  Loader2,
  X,
} from "lucide-react";
import QueryEditorTab from "./QueryEditorTab";
import {
  SegmentCondition,
  SegmentConditionGroup,
  SegmentType,
  SEGMENT_FIELDS,
} from "../types/segment";
import { color, tw, zIndex } from "../../../shared/utils/utils";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import { useSegmentationFields } from "../hooks/useSegmentationFields";
import {  getOperatorsForField,  TIME_WINDOWS, OPERATORS } from "../../../shared/utils/operatorMapper";
import UnifiedPickerModal from "./UnifiedPickerModal";
import SystemEventPickerModal from "./SystemEventPickerModal";
import FieldPickerModal from "./FieldPickerModal";
import { quicklistService } from "../../quicklists/services/quicklistService";
import { convertConditionsToPayload } from "../utils/conditionPayloadBuilder";
import { segmentService } from "../services/segmentService";
import { segmentTypeService } from "../services/segmentTypeService";
import { type SystemEvent } from "../../kpis/types/systemEvent";
import CustomerIdentityConditionRow from "./CustomerIdentityConditionRow";
import { SystemEventConditionRow } from "./SystemEventConditionRow";
import { MetricsConditionRow } from "./MetricsConditionRow";
import { SegmentConditionRow } from "./SegmentConditionRow";
import { ListConditionRow } from "./ListConditionRow";
import {
  formatSQL,
  getFirstBackendOperator,
  getFieldType as getFieldTypeUtil,
  getDataSourceOptions,
  createNewConditionGroup,
  createNewCondition,
  applyConditionGroupUpdate,
  removeConditionGroupFromList,
  applyConditionUpdate,
  removeConditionFromGroup,
  addConditionToGroup,
} from "../utils/segmentConditionUtils";
import {
  getSelectedSegmentId,
  getSelectedQuickListId,
  filterQuickListOptions,
} from "../utils/segmentDataHelpers";

interface QuickListPickerItem {
  id: number;
  name: string;
  description?: string;
  upload_type: string;
  row_count: number;
  created_at: string;
}

const RULE_TYPE_OPTIONS = [
  { value: "rule", label: "Rule" },
  { value: "sql", label: "SQL" },
  // { value: "dsl", label: "DSL" },
  // { value: "ai_assisted", label: "AI Assisted" },
  // { value: "hybrid", label: "Hybrid" },
];

interface SegmentConditionsBuilderProps {
  conditions: SegmentConditionGroup[];
  onChange: (conditions: SegmentConditionGroup[]) => void;
  onSegmentValidate?: (
    segmentId: number,
  ) => Promise<{ valid: boolean; error?: string }>;
  onValidationError?: (error: string) => void;
  showPreview?: boolean;
  onPreviewClick?: (previewCount: number) => void;
  onValidationChange?: (isValid: boolean) => void;
  // SQL Editor integration
  ruleType?: "rule" | "sql" | "dsl" | "ai_assisted" | "hybrid";
  onRuleTypeChange?: (type: "rule" | "sql" | "dsl" | "ai_assisted" | "hybrid") => void;
  sqlQuery?: string;
  onSqlChange?: (sql: string) => void;
  sqlPreviewResult?: { count: number; executionTime: number } | null;
  sqlPreviewError?: string | null;
  isSqlPreviewLoading?: boolean;
  onSqlPreview?: () => void;
}

export default function SegmentConditionsBuilder({
  conditions,
  onChange,
  onSegmentValidate,
  onValidationError,
  showPreview = true,
  onPreviewClick,
  onValidationChange,
  ruleType = "rule",
  onRuleTypeChange,
  sqlQuery = "",
  onSqlChange,
  sqlPreviewResult,
  sqlPreviewError,
  isSqlPreviewLoading = false,
  onSqlPreview,
}: SegmentConditionsBuilderProps) {
  const generateId = () => Math.random().toString(36).substr(2, 9);

  const isConditionValid = (condition: SegmentCondition): boolean => {
    // Must have operator selected
    if (!condition.operator) {
      return false;
    }

    // Normalize operator label for comparison (handle both "greater than" and "greater_than" formats)
    const normalizedOperator = condition.operator.toLowerCase().replace(/_/g, " ");

    // Check if operator requires a value
    const operatorDef = Object.values(OPERATORS).find(
      (op) => op.label === normalizedOperator || op.label === condition.operator
    );

    // For metric conditions, require both value and date range
    const isMetricCondition = ["revenue_metric", "usage_metric", "kpi"].includes(condition.conditionType);
    if (isMetricCondition) {
      const hasValue = Array.isArray(condition.value)
        ? (condition.value as (string | number)[]).length > 0
        : condition.value !== "" && condition.value !== undefined && condition.value !== null;

      const hasDateRange = condition.start_date || condition.end_date;

      // For custom time window with date operator, need both value and date
      if (condition.time_window === "custom" && condition.date_operator_id) {
        return hasValue && hasDateRange;
      }

      // For preset time window (last_7_days, etc.), only need value
      if (condition.time_window && condition.time_window !== "custom") {
        return hasValue;
      }

      // No time window selected - need both value and date
      return hasValue && hasDateRange;
    }

    // If operator requires a value, check if value is provided
    if (operatorDef?.requiresValue) {
      const hasValue = Array.isArray(condition.value)
        ? (condition.value as (string | number)[]).length > 0
        : condition.value !== "" && condition.value !== undefined && condition.value !== null;

      const hasDateRange = condition.start_date || condition.end_date;

      return hasValue || hasDateRange;
    }

    return true;
  };

  const areAllConditionsValid = (): boolean => {
    return conditions.every((group) =>
      group.conditions.every((condition) => isConditionValid(condition))
    );
  };

  const [isSegmentModalOpen, setIsSegmentModalOpen] = useState(false);
  const [isQuickListModalOpen, setIsQuickListModalOpen] = useState(false);
  const [isSystemEventModalOpen, setIsSystemEventModalOpen] = useState(false);
  const [isFieldPickerModalOpen, setIsFieldPickerModalOpen] = useState(false);
  const [segmentTypes, setSegmentTypes] = useState<Array<{ id: number; name: string }>>([]);
  const [fieldPickerModalData, setFieldPickerModalData] = useState<{
    fields: Array<{ value: string; label: string }>;
    categoryName: string;
  } | null>(null);
  const [currentEditingCondition, setCurrentEditingCondition] = useState<{
    groupId: string;
    conditionId: string;
  } | null>(null);
  const [segmentSearchTerm, setSegmentSearchTerm] = useState("");
  const [segmentFilter, setSegmentFilter] = useState("all");
  const [segmentOptions, setSegmentOptions] = useState<SegmentType[]>([]);
  const [isLoadingSegments, setIsLoadingSegments] = useState(false);
  const [quickListSearchTerm, setQuickListSearchTerm] = useState("");
  const [quickListFilter, setQuickListFilter] = useState("all");
  const [quickListOptions, setQuickListOptions] = useState<QuickListPickerItem[]>([]);
  const [isLoadingQuickLists, setIsLoadingQuickLists] = useState(false);
  const [previewCount, setPreviewCount] = useState<number | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewQuery, setPreviewQuery] = useState<string | null>(null);
  const [previewLimit, setPreviewLimit] = useState<number>(100);

  const PREVIEW_LIMIT_OPTIONS = [
    { value: "10", label: "10" },
    { value: "50", label: "50" },
    { value: "100", label: "100" },
    { value: "500", label: "500" },
    { value: "1000", label: "1000" },
    { value: "5000", label: "5000" },
  ];

  const handlePreview = async () => {
    if (conditions.length === 0) {
      setPreviewCount(0);
      setPreviewQuery(null);
      return;
    }

    try {
      setIsPreviewLoading(true);

      // Check if there are any previewable conditions
      // Supported: profile fields, segments, and quicklists
      // Not supported in preview: system_events
      const previewableConditions = conditions
        .flatMap((group) =>
          group.conditions.filter((c) =>
            [
              "customer_identity",
              "revenue_metric",
              "usage_metric",
              "segment",
              "list",
            ].includes(c.conditionType)
          )
        );

      if (previewableConditions.length === 0) {
        setPreviewCount(0);
        setPreviewQuery(null);
        setIsPreviewLoading(false);
        return;
      }

      const payload = convertConditionsToPayload(conditions, true, previewLimit);

      const response = await segmentService.generateSegmentQueryPreview(payload);

      if (response?.data?.segment_query) {
        setPreviewQuery(response.data.segment_query);
        setPreviewCount(0); // Count will be shown after query runs
        setShowPreviewModal(true);
        onPreviewClick?.(0);
      }
    } catch (error) {
      // Silently fail - preview is optional
      setPreviewQuery(null);
      setPreviewCount(null);
    } finally {
      setIsPreviewLoading(false);
    }
  };

  useEffect(() => {
    onValidationChange?.(areAllConditionsValid());
  }, [conditions, onValidationChange]);

  useEffect(() => {
    const loadSegments = async () => {
      if (!isSegmentModalOpen) {
        return;
      }

      setIsLoadingSegments(true);
      try {
        let response;
        if (segmentSearchTerm.trim()) {
          response = await segmentService.searchSegments({
            q: segmentSearchTerm,
            type:
              segmentFilter !== "all"
                ? (segmentFilter as string)
                : undefined,
            skipCache: true,
          });
        } else {
          response = await segmentService.getSegments({
            type:
              segmentFilter !== "all"
                ? (segmentFilter as string)
                : undefined,
            skipCache: true,
          });
        }
        setSegmentOptions(response.data || []);
      } catch (error) {
        // Failed to load segments
        setSegmentOptions([]);
      } finally {
        setIsLoadingSegments(false);
      }
    };

    loadSegments();
  }, [isSegmentModalOpen, segmentSearchTerm, segmentFilter]);

  useEffect(() => {
    const loadQuickLists = async () => {
      if (!isQuickListModalOpen) {
        return;
      }

      setIsLoadingQuickLists(true);
      try {
        const response = await quicklistService.getAllQuickLists({
          offset: 0,
          limit: 100,
        });

        if (response.success && response.data) {
          const lists = response.data
            .filter(
              (item: any) =>
                item.status === "completed" ||
                item.processing_status === "completed",
            )
            .map((item: any) => ({
              id: item.id,
              name: item.name,
              description: item.description,
              upload_type: item.processing_status || "multi",
              row_count: item.rows_imported || 0,
              created_at: item.created_at,
            }));
          setQuickListOptions(lists);
        } else {
          setQuickListOptions([]);
        }
      } catch (error) {
        // Failed to load quicklists
        setQuickListOptions([]);
      } finally {
        setIsLoadingQuickLists(false);
      }
    };

    loadQuickLists();
  }, [isQuickListModalOpen]);

  useEffect(() => {
    const loadSegmentTypes = async () => {
      try {
        const response = await segmentTypeService.getAllSegmentTypes();
        if (response.data) {
          setSegmentTypes(response.data);
        }
      } catch (error) {
        // Failed to load segment types - fall back to defaults
        setSegmentTypes([
          { id: 1, name: "Static" },
          { id: 2, name: "Dynamic" },
          { id: 3, name: "Trigger" },
        ]);
      }
    };

    loadSegmentTypes();
  }, []);

  // Load segmentation fields from backend
  const {
    categories,
    allFields,
    isLoading: isLoadingFields,
    error: fieldsError,
    getFieldByValue,
  } = useSegmentationFields();

  const getFieldType = (fieldKey: string) => getFieldTypeUtil(fieldKey, getFieldByValue);

  const addConditionGroup = () => {
    const newGroup = createNewConditionGroup(allFields, categories, generateId, getFieldByValue);
    onChange([...conditions, newGroup]);
  };

  const removeConditionGroup = (groupId: string) => {
    onChange(removeConditionGroupFromList(conditions, groupId));
  };

  const updateConditionGroup = (
    groupId: string,
    updates: Partial<SegmentConditionGroup>,
  ) => {
    onChange(applyConditionGroupUpdate(conditions, groupId, updates));
  };

  const addCondition = (groupId: string) => {
    const newCondition = createNewCondition(groupId, allFields, categories, generateId, getFieldByValue);
    onChange(addConditionToGroup(conditions, groupId, newCondition));
  };

  const removeCondition = (groupId: string, conditionId: string) => {
    onChange(removeConditionFromGroup(conditions, groupId, conditionId));
  };

  const updateCondition = (
    groupId: string,
    conditionId: string,
    updates: Partial<SegmentCondition>,
  ) => {
    onChange(applyConditionUpdate(conditions, groupId, conditionId, updates));
  };

  // Render condition based on type - using refactored sub-components
  const renderLine1Fields = (groupId: string, condition: SegmentCondition) => {
    switch (condition.conditionType) {
      case "customer_identity":
        return (
          <CustomerIdentityConditionRow
            groupId={groupId}
            condition={condition}
            updateCondition={updateCondition}
            categories={categories}
            allFields={allFields}
            SEGMENT_FIELDS={SEGMENT_FIELDS}
            getFieldByValue={getFieldByValue}
            getFieldType={getFieldType}
            setCurrentEditingCondition={setCurrentEditingCondition}
            setFieldPickerModalData={setFieldPickerModalData}
            setIsFieldPickerModalOpen={setIsFieldPickerModalOpen}
            line="1"
          />
        );
      case "segment":
        return (
          <SegmentConditionRow
            groupId={groupId}
            condition={condition}
            updateCondition={updateCondition}
            setCurrentEditingCondition={setCurrentEditingCondition}
            setIsSegmentModalOpen={setIsSegmentModalOpen}
            zIndex={zIndex}
            tw={tw}
          />
        );
      case "list":
        return (
          <ListConditionRow
            groupId={groupId}
            condition={condition}
            updateCondition={updateCondition}
            setCurrentEditingCondition={setCurrentEditingCondition}
            setIsQuickListModalOpen={setIsQuickListModalOpen}
            zIndex={zIndex}
            tw={tw}
          />
        );
      case "system_event":
        return (
          <SystemEventConditionRow
            groupId={groupId}
            condition={condition}
            updateCondition={updateCondition}
            setCurrentEditingCondition={setCurrentEditingCondition}
            setIsSystemEventModalOpen={setIsSystemEventModalOpen}
            zIndex={zIndex}
            tw={tw}
            color={color}
            line="1"
          />
        );
      case "revenue_metric":
      case "usage_metric":
        return (
          <MetricsConditionRow
            groupId={groupId}
            condition={condition}
            updateCondition={updateCondition}
            setCurrentEditingCondition={setCurrentEditingCondition}
            zIndex={zIndex}
            tw={tw}
            color={color}
            line="1"
            categories={categories}
            setFieldPickerModalOpen={setIsFieldPickerModalOpen}
            setFieldPickerModalData={setFieldPickerModalData}
          />
        );
      default:
        return null;
    }
  };

  const renderLine2Fields = (groupId: string, condition: SegmentCondition) => {
    switch (condition.conditionType) {
      case "customer_identity":
        return (
          <CustomerIdentityConditionRow
            groupId={groupId}
            condition={condition}
            updateCondition={updateCondition}
            categories={categories}
            allFields={allFields}
            SEGMENT_FIELDS={SEGMENT_FIELDS}
            getFieldByValue={getFieldByValue}
            getFieldType={getFieldType}
            setCurrentEditingCondition={setCurrentEditingCondition}
            setFieldPickerModalData={setFieldPickerModalData}
            setIsFieldPickerModalOpen={setIsFieldPickerModalOpen}
            removeCondition={removeCondition}
            line="2"
          />
        );
      case "segment":
      case "list":
      case "system_event":
        return null;
      case "revenue_metric":
      case "usage_metric":
        return (
          <MetricsConditionRow
            groupId={groupId}
            condition={condition}
            updateCondition={updateCondition}
            setCurrentEditingCondition={setCurrentEditingCondition}
            zIndex={zIndex}
            tw={tw}
            color={color}
            line="2"
            categories={categories}
            setFieldPickerModalOpen={setIsFieldPickerModalOpen}
            setFieldPickerModalData={setFieldPickerModalData}
          />
        );
      default:
        return null;
    }
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

  if (ruleType === "rule" && conditions.length === 0) {
    return (
      <div className="space-y-4">
        {/* Type Selector Header - Always visible */}
        <div className="flex items-center gap-3">
          <label className={`block text-sm font-medium ${tw.textPrimary}`}>
            Query Type *
          </label>
          <div className="w-40">
            <HeadlessSelect
              options={RULE_TYPE_OPTIONS}
              value={ruleType}
              onChange={(value) => onRuleTypeChange?.(value as any)}
              placeholder="Select type"
              className="text-sm"
              zIndex={zIndex.popover}
            />
          </div>
        </div>
        {/* Empty state message */}
        <div className="text-center py-8">
          <p className="text-gray-500 mb-4">No rules defined yet</p>
          <button
            type="button"
            onClick={addConditionGroup}
            className={`inline-flex items-center px-4 py-2 text-sm text-white ${tw.rounded} transition-colors`}
            style={{
              backgroundColor: color.primary.action,
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Rule Group
          </button>
        </div>
      </div>
    );
  }

  const selectedSegmentId = getSelectedSegmentId(currentEditingCondition, conditions);
  const selectedQuickListId = getSelectedQuickListId(currentEditingCondition, conditions);
  const filteredQuickListOptions = filterQuickListOptions(quickListOptions, quickListSearchTerm, quickListFilter);


  return (
    <div className="space-y-4">
      {/* Segment Rules Type Selector (Always visible) */}
      {showPreview && (
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <label className={`block text-sm font-medium ${tw.textPrimary}`}>
              Query Type *
            </label>
            <div className="w-40">
              <HeadlessSelect
                options={RULE_TYPE_OPTIONS}
                value={ruleType}
                onChange={(value) => onRuleTypeChange?.(value as any)}
                placeholder="Select type"
                className="text-sm"
                zIndex={zIndex.popover}
              />
            </div>
          </div>
          {/* Preview Button and Limit (Rule type) OR Preview Button (SQL type) */}
          {ruleType === "rule" ? (
            <div className="flex items-center space-x-3">
              {/* {previewCount !== null && (
                <span className={`text-sm ${tw.textSecondary}`}>
                  {previewCount.toLocaleString()} customers
                </span>
              )} */}
              <div className="flex items-center space-x-2">
                <label className={`text-sm ${tw.textSecondary}`}>Limit:</label>
                <HeadlessSelect
                  options={PREVIEW_LIMIT_OPTIONS}
                  value={String(previewLimit)}
                  onChange={(value) => setPreviewLimit(parseInt(value))}
                  placeholder="Select limit"
                  className="text-sm"
                  zIndex={zIndex.popover}
                />
              </div>
              <button
                type="button"
                onClick={handlePreview}
                disabled={
                  isPreviewLoading || conditions.length === 0 || !areAllConditionsValid()
                }
                className={`inline-flex items-center px-4 py-2 text-sm text-white ${tw.rounded} transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
                style={{
                  backgroundColor: isPreviewLoading ? color.text.secondary : color.primary.action,
                }}
                title={!areAllConditionsValid() ? "Complete all conditions (operator and value required)" : ""}
              >
                {isPreviewLoading && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                {isPreviewLoading ? "Previewing..." : "Preview"}
              </button>
            </div>
          ) : ruleType === "sql" && (
            <button
              type="button"
              onClick={onSqlPreview}
              disabled={isSqlPreviewLoading || !sqlQuery}
              className={`inline-flex items-center px-4 py-2 text-sm text-white ${tw.rounded} transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
              style={{
                backgroundColor: isSqlPreviewLoading ? color.text.secondary : color.primary.action,
              }}
            >
              {isSqlPreviewLoading && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              {isSqlPreviewLoading ? "Validating..." : "Validate Query"}
            </button>
          )}
        </div>
      )}

      {/* SQL Preview Modal */}
      {showPreviewModal && previewQuery &&
        createPortal(
          <div
            className="fixed inset-0 flex items-center justify-center p-4"
            style={{
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              zIndex: zIndex.popover,
            }}
            onClick={() => setShowPreviewModal(false)}
          >
            <div
              className={`bg-white ${tw.rounded} shadow-2xl w-full max-w-3xl max-h-[80vh] flex flex-col`}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div
                className="flex items-center justify-between p-6 border-b flex-shrink-0"
                style={{
                  borderColor: color.border.default,
                }}
              >
                <div>
                  <h3 className={`text-lg font-semibold ${tw.textPrimary}`}>
                    SQL Query Preview
                  </h3>
                  <p className={`text-sm ${tw.textSecondary} mt-1`}>
                    Preview of the generated SQL query (360 Profile conditions only)
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPreviewModal(false)}
                  className={`p-2 ${tw.textSecondary} hover:${tw.textPrimary} transition-colors`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* SQL Preview */}
              <div className="flex-1 overflow-y-auto p-6">
                <div
                  className={`p-4 ${tw.rounded} border`}
                  style={{
                    backgroundColor: color.surface.background,
                    borderColor: color.border.default,
                  }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <span
                        className="px-2 py-1 rounded text-xs font-medium"
                        style={{
                          backgroundColor: `${color.primary.accent}20`,
                          color: color.primary.accent,
                        }}
                      >
                        Generated SQL
                      </span>
                      <h4 className={`text-sm font-medium ${tw.textPrimary}`}>
                        Segment Query
                      </h4>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(formatSQL(previewQuery));
                      }}
                      className="text-xs px-3 py-1.5 rounded transition-colors font-medium"
                      style={{
                        backgroundColor: color.surface.cards,
                        border: `1px solid ${color.border.default}`,
                        color: color.text.primary,
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.backgroundColor = color.interactive.hover;
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.backgroundColor = color.surface.cards;
                      }}
                    >
                      📋 Copy
                    </button>
                  </div>
                  <pre
                    className="text-sm p-4 rounded overflow-auto font-mono"
                    style={{
                      backgroundColor: color.surface.cards,
                      border: `1px solid ${color.border.muted}`,
                      color: color.text.primary,
                      maxHeight: "450px",
                      whiteSpace: "pre",
                      lineHeight: "1.6",
                      tabSize: 2,
                    }}
                  >
                    <code>{formatSQL(previewQuery)}</code>
                  </pre>
                </div>
              </div>

              {/* Footer */}
              <div
                className="flex items-center justify-end space-x-3 p-6 border-t flex-shrink-0"
                style={{
                  borderColor: color.border.default,
                }}
              >
                <button
                  type="button"
                  onClick={() => setShowPreviewModal(false)}
                  className={`px-4 py-2 ${tw.rounded} text-sm font-medium transition-colors`}
                  style={{
                    backgroundColor: color.surface.cards,
                    border: `1px solid ${color.border.default}`,
                    color: color.text.primary,
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Rules Builder or SQL Editor based on type */}
      {ruleType === "rule" ? (
        <>
          {/* Rules Builder */}
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
                      <div className="min-w-[180px] max-w-[220px]">
                        <div
                          className={`${tw.rounded} transition-all cursor-pointer`}
                          style={{
                            backgroundColor: color.surface.background,
                            // border: `1px solid ${color.border.default}`,
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
                                const opts = getDataSourceOptions(categories);
                                const selectedValue = condition.conditionType === "customer_identity"
                                  ? `customer_identity:${condition.category}`
                                  : condition.conditionType === "segment" || condition.conditionType === "list"
                                    ? `${condition.conditionType}:${condition.category}`
                                    : condition.conditionType;
                                return opts.map((opt) => ({
                                  value: opt.value,
                                  label: opt.label,
                                }));
                              })()}
                              value={
                                condition.conditionType === "customer_identity" || condition.conditionType === "revenue_metric" || condition.conditionType === "usage_metric"
                                  ? `${condition.conditionType}:${condition.category}`
                                  : condition.conditionType === "segment" || condition.conditionType === "list"
                                    ? `${condition.conditionType}:${condition.category}`
                                    : condition.conditionType
                              }
                              onChange={(value) => {
                                const selectedOption =
                                  getDataSourceOptions(categories).find(
                                    (opt) => opt.value === value,
                                  );
                                if (!selectedOption) return;

                                const condType = selectedOption.type;
                                const categoryId = parseInt(
                                  String(value).split(":")[1] || "1",
                                );

                                // Reset condition based on type
                                if (condType === "customer_identity") {
                                  const fieldsArray = Array.isArray(allFields)
                                    ? allFields
                                    : [];
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

                                  // Handle categories with subcategories (like Customer 360)
                                  let firstField: any = null;
                                  let selectedSubcategoryId: number | undefined = undefined;
                                  let selectedSubcategoryName: string | undefined = undefined;

                                  if (
                                    selectedCategory?.sub_categories &&
                                    selectedCategory.sub_categories.length > 0
                                  ) {
                                    // Get first subcategory
                                    const firstSubcategory =
                                      selectedCategory.sub_categories[0];
                                    selectedSubcategoryId = firstSubcategory.id;
                                    selectedSubcategoryName = firstSubcategory.name;
                                    firstField = firstSubcategory.fields?.[0];
                                  } else {
                                    // Categories without subcategories
                                    const categoryFields =
                                      selectedCategory?.fields || [];
                                    firstField =
                                      categoryFields.length > 0
                                        ? categoryFields[0]
                                        : fieldsArray[0];
                                  }

                                  // Get first operator from backend field's operators array
                                  const firstOp =
                                    getFirstBackendOperator(firstField);

                                  updateCondition(group.id, condition.id, {
                                    conditionType: condType,
                                    category: categoryId,
                                    subcategory_id: selectedSubcategoryId,
                                    subcategory_name: selectedSubcategoryName,
                                    field: firstField
                                      ? firstField.field_value
                                      : "",
                                    field_name: firstField?.field_name,
                                    field_id: firstField?.id,
                                    operator: firstOp?.label || "equals",
                                    operator_id: firstOp?.id || 1,
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
                                    category: categoryId,
                                    operator: "in",
                                    operator_id: 7,
                                    value: "",
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
                                    category: categoryId,
                                    operator: "in",
                                    operator_id: 7,
                                    value: "",
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
                                    category: undefined,
                                    operator: "equals",
                                    value: "",
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
                                } else if (condType === "revenue_metric" || condType === "usage_metric") {
                                  // For metric types: select first field from the category
                                  const categoryFields = Array.isArray(categories)
                                    ? (categories.find((c) => c.id === categoryId)?.fields || [])
                                    : [];
                                  const firstField = categoryFields.length > 0 ? categoryFields[0] : null;
                                  const firstOp = getFirstBackendOperator(firstField);

                                  const updates: Partial<SegmentCondition> = {
                                    conditionType: condType,
                                    category: categoryId,
                                    field: firstField?.field_value || "",
                                    field_id: firstField?.id,
                                    field_name: firstField?.field_name || "",
                                    kpi_name: firstField?.field_name || "",
                                    operator: firstOp?.label || "equals",
                                    operator_id: firstOp?.id || 1,
                                    value: "",
                                    segment_id: undefined,
                                    segment_name: undefined,
                                    list_id: undefined,
                                    list_name: undefined,
                                    system_event_id: undefined,
                                    system_event_code: undefined,
                                    system_event_name: undefined,
                                  };

                                  // Only set default time_window if not already set
                                  if (!condition.time_window_id) {
                                    updates.time_window = "last_7_days";
                                    updates.time_window_id = 1;
                                  }

                                  updateCondition(group.id, condition.id, updates);
                                }
                              }}
                              placeholder="Select data source"
                              className="text-sm"
                              zIndex={zIndex.popover}
                            />
                        </div>
                      </div>

                      {/* Render Line 1 Fields (Category, Field for customer_identity, etc.) */}
                      {renderLine1Fields(group.id, condition)}
                    </div>

                    {/* Line 2: Operator + Value + Remove */}
                    <div className="flex items-center gap-3">
                      {/* Render Line 2 Fields (Operator, Value for customer_identity, etc.) */}
                      {renderLine2Fields(group.id, condition)}

                      {/* Remove Condition - Only show if more than one condition and not customer_identity */}
                      {group.conditions.length > 1 && condition.conditionType !== "customer_identity" && (
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

            {/* Add Rule Button */}
            <button
              type="button"
              onClick={() => addCondition(group.id)}
              className={`mt-6 inline-flex items-center px-3 py-2 text-sm text-white ${tw.rounded} transition-colors`}
              style={{
                backgroundColor: color.primary.action,
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Rule
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

          {/* Add Rule Group Button */}
          <button
            type="button"
            onClick={addConditionGroup}
            className={`inline-flex items-center px-4 py-2 text-sm text-white ${tw.rounded} transition-colors`}
            style={{ backgroundColor: color.primary.action }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Rule Group
          </button>
        </>
      ) : ruleType === "sql" && (
        /* SQL Editor */
        <div
          className={`${tw.rounded} p-4 border flex flex-col`}
          style={{
            borderColor: sqlPreviewError ? "#ef4444" : tw.borderDefault,
            backgroundColor: "#ffffff",
            height: "calc(100vh - 350px)",
          }}
        >
          <QueryEditorTab
            sql={sqlQuery || ""}
            onSqlChange={onSqlChange || (() => {})}
            onPreviewResult={() => {}}
            isPreviewLoading={isSqlPreviewLoading || false}
            previewResult={sqlPreviewResult}
            previewError={sqlPreviewError}
            onPreview={onSqlPreview || (() => {})}
          />
        </div>
      )}

      {/* Segment Picker Modal (Unified UI) */}
      <UnifiedPickerModal
        isOpen={isSegmentModalOpen}
        onClose={() => {
          setIsSegmentModalOpen(false);
          setCurrentEditingCondition(null);
        }}
        title="Select a Segment"
        subtitle="Choose a segment to use in this condition"
        searchTerm={segmentSearchTerm}
        onSearchTermChange={setSegmentSearchTerm}
        searchPlaceholder="Search segments..."
        filterOptions={[
          { value: "all", label: "All Segments" },
          ...segmentTypes.map((type) => ({
            value: type.name.toLowerCase(),
            label: type.name,
          })),
        ]}
        filterValue={segmentFilter}
        onFilterChange={setSegmentFilter}
        items={segmentOptions.map((segment) => ({
          id: segment.id || segment.name,
          title: segment.name,
          description: segment.description,
          raw: segment,
        }))}
        selectedId={selectedSegmentId}
        loading={isLoadingSegments}
        loadingText="Loading segments..."
        emptyTitle="No segments found"
        emptyDescription="Try adjusting your search or filter criteria"
        onSelect={async (item) => {
          const segment = item.raw;

          if (onSegmentValidate) {
            const validation = await onSegmentValidate(segment.id!);
            if (!validation.valid) {
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
      />

      {/* QuickList Picker Modal (Unified UI) */}
      <UnifiedPickerModal
        isOpen={isQuickListModalOpen}
        onClose={() => {
          setIsQuickListModalOpen(false);
          setCurrentEditingCondition(null);
        }}
        title="Select a QuickList"
        subtitle="Choose a quicklist to use in this condition"
        searchTerm={quickListSearchTerm}
        onSearchTermChange={setQuickListSearchTerm}
        searchPlaceholder="Search quicklists..."
        filterOptions={[
          { value: "all", label: "All Types" },
          { value: "email", label: "Email" },
          { value: "phone", label: "Phone" },
          { value: "multi", label: "Multi-Channel" },
        ]}
        filterValue={quickListFilter}
        onFilterChange={setQuickListFilter}
        items={filteredQuickListOptions.map((quicklist) => ({
          id: quicklist.id,
          title: quicklist.name,
          description: quicklist.description,
          raw: quicklist,
        }))}
        selectedId={selectedQuickListId}
        loading={isLoadingQuickLists}
        loadingText="Loading quicklists..."
        emptyTitle="No quicklists found"
        emptyDescription="Try adjusting your search or filter criteria"
        onSelect={(item) => {
          const quicklist = item.raw;
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
                  operator: firstOp?.label as SegmentCondition["operator"],
                  operator_id: firstOp?.id,
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
