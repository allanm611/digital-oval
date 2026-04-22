import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
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
  X,
} from "lucide-react";
import {
  SegmentCondition,
  SegmentConditionGroup,
  SEGMENT_FIELDS,
  SegmentType,
} from "../types/segment";
import { color, tw, zIndex } from "../../../shared/utils/utils";
import Input from "../../../shared/components/ui/Input";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import { useSegmentationFields } from "../hooks/useSegmentationFields";
import { getOperatorsForFieldType, getOperatorsForField, DATE_OPERATORS, TIME_WINDOWS, getDateRangeForTimeWindow } from "../../../shared/utils/operatorMapper";
import UnifiedPickerModal from "./UnifiedPickerModal";
import SystemEventPickerModal from "./SystemEventPickerModal";
import FieldPickerModal from "./FieldPickerModal";
import { quicklistService } from "../../quicklists/services/quicklistService";
import { segmentService } from "../services/segmentService";
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

interface QuickListPickerItem {
  id: number;
  name: string;
  description?: string;
  upload_type: string;
  row_count: number;
  created_at: string;
}

interface SegmentConditionsBuilderProps {
  conditions: SegmentConditionGroup[];
  onChange: (conditions: SegmentConditionGroup[]) => void;
  onSegmentValidate?: (
    segmentId: number,
  ) => Promise<{ valid: boolean; error?: string }>;
  onValidationError?: (error: string) => void;
  showPreview?: boolean;
  onPreviewClick?: (previewCount: number) => void;
}

export default function SegmentConditionsBuilder({
  conditions,
  onChange,
  onSegmentValidate,
  onValidationError,
  showPreview = true,
  onPreviewClick,
}: SegmentConditionsBuilderProps) {
  const generateId = () => Math.random().toString(36).substr(2, 9);

  // Format SQL query for better readability
  const formatSQL = (sql: string): string => {
    if (!sql) return "";

    // Add line breaks and indentation for better readability
    const formatted = sql
      // Main clauses
      .replace(/\bSELECT\b/gi, "\nSELECT\n  ")
      .replace(/\bFROM\b/gi, "\n\nFROM\n  ")
      .replace(/\bWHERE\b/gi, "\n\nWHERE\n  ")
      .replace(/\bORDER BY\b/gi, "\n\nORDER BY\n  ")
      .replace(/\bGROUP BY\b/gi, "\n\nGROUP BY\n  ")
      .replace(/\bHAVING\b/gi, "\n\nHAVING\n  ")
      .replace(/\bLIMIT\b/gi, "\n\nLIMIT ")
      .replace(/\bOFFSET\b/gi, "\nOFFSET ")
      // Joins
      .replace(/\bJOIN\b/gi, "\nJOIN\n  ")
      .replace(/\bLEFT JOIN\b/gi, "\nLEFT JOIN\n  ")
      .replace(/\bINNER JOIN\b/gi, "\nINNER JOIN\n  ")
      .replace(/\bON\b/gi, "\n  ON ")
      // Logical operators
      .replace(/\bAND\b/gi, "\n  AND ")
      .replace(/\bOR\b/gi, "\n  OR ")
      // Clean up extra spaces and newlines
      .replace(/\n\s*\n\s*\n/g, "\n\n")
      .replace(/,\s*/g, ",\n  ")
      .trim();

    return formatted;
  };
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

  const buildPreviewPayload = (conditionGroups: SegmentConditionGroup[]) => {
    // Build payload in correct v2.0 format with source_layers, layer_fields, layer_filters
    // Layer 0: always subscribers (base layer)
    const sourceLayers: any[] = [
      {
        source_type: "subscribers",
      },
    ];

    // First pass: add all segment and quicklist layers as joined layers (index 1+)
    // Each segment/quicklist becomes a layer that joins to the base on msisdn
    for (const group of conditionGroups) {
      for (const condition of group.conditions) {
        if (condition.conditionType === "segment" && condition.segment_id) {
          sourceLayers.push({
            source_type: "segment",
            segment_id: condition.segment_id,
            join_config: {
              join_type: "INNER JOIN",
              left_column_ref: { layer_index: 0, column: "msisdn" },
              right_column: "msisdn",
            },
          });
        } else if (condition.conditionType === "list" && condition.list_id) {
          sourceLayers.push({
            source_type: "quicklist",
            quicklist_id: condition.list_id,
            join_config: {
              join_type: "INNER JOIN",
              left_column_ref: { layer_index: 0, column: "msisdn" },
              right_column: "msisdn",
            },
          });
        }
      }
    }

    // layer_fields is optional - omitting it means SELECT * (all columns)
    // This is fine for preview. If we wanted to be precise, we'd only include
    // the fields that appear in conditions, but for preview simplicity we use SELECT *
    const layerFields = undefined;

    // Build layer_filters with proper group structure
    const layerFilterGroups: any[] = [];

    for (const group of conditionGroups) {
      const groupConditions: any[] = [];

      for (const condition of group.conditions) {
        // Include all profile-type conditions (360_profile, revenue_metric_kpi, usage_metric_kpi)
        // These become WHERE conditions in layer_filters
        // Segment/list conditions are handled above as joined layers (source_layers index 1+)
        if (
          condition &&
          condition.conditionType &&
          ["360_profile", "revenue_metric_kpi", "usage_metric_kpi"].includes(condition.conditionType) &&
          condition.field_id &&
          condition.field_name &&
          condition.operator_id !== undefined &&
          condition.operator_id !== null
        ) {
          const hasValue = Array.isArray(condition.value)
            ? (condition.value as (string | number)[]).length > 0
            : condition.value !== "" && condition.value !== undefined && condition.value !== null;
          const hasDateRange = (condition.start_date && condition.start_date !== "") || (condition.end_date && condition.end_date !== "");
          const isNullOp = condition.operator_id === 13 || condition.operator_id === 14;

          if (!hasValue && !hasDateRange && !isNullOp) {
            continue;
          }

          // Format value correctly for different operator types
          let condValue: string | number | (string | number)[] | undefined = condition.value as
            | string
            | number
            | (string | number)[]
            | undefined;
          if ((condition.operator_id === 7 || condition.operator_id === 8) && condValue) {
            if (typeof condValue === "string") {
              condValue = condValue
                .split(",")
                .map((v: string) => v.trim())
                .filter((v: string) => v !== "");
            } else if (!Array.isArray(condValue)) {
              condValue = [condValue];
            }
          }

          const layerCond = {
            column_ref: {
              layer_index: 0,
              column: condition.field_name,
            },
            operator_id: condition.operator_id,
            ...(isNullOp
              ? {} // IS NULL/IS NOT NULL: no value needed
              : hasDateRange
                ? {
                    start_date: condition.start_date || null,
                    end_date: condition.end_date || null,
                  }
                : { value: condValue || undefined }),
          };
          groupConditions.push(layerCond);
        }
      }

      // Only add group if it has conditions
      if (groupConditions.length > 0 && group) {
        // Validate and normalize logic value to "AND" or "OR"
        const groupLogic = group.operator ? String(group.operator).toUpperCase() : "AND";
        const validLogic: "AND" | "OR" = (groupLogic === "OR" ? "OR" : "AND") as "AND" | "OR";

        layerFilterGroups.push({
          logic: validLogic,
          conditions: groupConditions,
        });
      }
    }

    // Determine top-level logic with validation
    let topLevelLogic: "AND" | "OR" = "AND";
    if (conditionGroups && conditionGroups.length > 0 && conditionGroups[0]) {
      const groupOp = conditionGroups[0].groupOperator ? String(conditionGroups[0].groupOperator).toUpperCase() : "AND";
      topLevelLogic = (groupOp === "OR" ? "OR" : "AND") as "AND" | "OR";
    }

    const payload = {
      source_layers: sourceLayers,
      layer_fields: layerFields,
      layer_filters:
        layerFilterGroups.length > 0
          ? {
              logic: topLevelLogic,
              groups: layerFilterGroups,
            }
          : undefined,
      limit: 100, // Preview limit
    };

    return payload;
  };

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
              "360_profile",
              "revenue_metric_kpi",
              "usage_metric_kpi",
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

      const payload = buildPreviewPayload(conditions);

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
                ? (segmentFilter as "static" | "dynamic" | "trigger")
                : undefined,
            skipCache: true,
          });
        } else {
          response = await segmentService.getSegments({
            type:
              segmentFilter !== "all"
                ? (segmentFilter as "static" | "dynamic" | "trigger")
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

  const getFirstBackendOperator = (
    field: Record<string, any> | null | undefined,
  ) => {
    const ops = getOperatorsForField(field);
    return ops.length > 0
      ? { id: ops[0].id, label: ops[0].label }
      : { id: 1, label: "equals" };
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

    // Get Customer 360 category (should be first)
    const customer360Category = categoriesArray.find((c) => c.value === "customer_360") || categoriesArray[0];
    const categoryId = customer360Category?.id || 1;

    // Get first subcategory if available, otherwise use category fields
    let selectedSubcategoryId: number | undefined = undefined;
    let selectedSubcategoryName: string | undefined = undefined;
    let fieldsToUse: any[] = [];

    if (customer360Category?.sub_categories && customer360Category.sub_categories.length > 0) {
      const firstSubcategory = customer360Category.sub_categories[0];
      selectedSubcategoryId = firstSubcategory.id;
      selectedSubcategoryName = firstSubcategory.name;
      fieldsToUse = firstSubcategory.fields || [];
    } else {
      fieldsToUse = customer360Category?.fields || fieldsArray;
    }

    const firstField = fieldsToUse.length > 0 ? fieldsToUse[0] : (fieldsArray.length > 0 ? fieldsArray[0] : null);
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
          category: categoryId,
          subcategory_id: selectedSubcategoryId,
          subcategory_name: selectedSubcategoryName,
          field: defaultFieldValue,
          field_name: firstField?.field_name,
          field_id: defaultFieldId,
          operator: firstOp?.label || "equals",
          operator_id: firstOp?.id || 1,
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

    // Get Customer 360 category (should be first)
    const customer360Category = categoriesArray.find((c) => c.value === "customer_360") || categoriesArray[0];
    const categoryId = customer360Category?.id || 1;

    // Get first subcategory if available, otherwise use category fields
    let selectedSubcategoryId: number | undefined = undefined;
    let selectedSubcategoryName: string | undefined = undefined;
    let fieldsToUse: any[] = [];

    if (customer360Category?.sub_categories && customer360Category.sub_categories.length > 0) {
      const firstSubcategory = customer360Category.sub_categories[0];
      selectedSubcategoryId = firstSubcategory.id;
      selectedSubcategoryName = firstSubcategory.name;
      fieldsToUse = firstSubcategory.fields || [];
    } else {
      fieldsToUse = customer360Category?.fields || fieldsArray;
    }

    const firstField = fieldsToUse.length > 0 ? fieldsToUse[0] : (fieldsArray.length > 0 ? fieldsArray[0] : null);
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
      category: categoryId,
      subcategory_id: selectedSubcategoryId,
      subcategory_name: selectedSubcategoryName,
      field: defaultFieldValue,
      field_name: firstField?.field_name,
      field_id: defaultFieldId,
      operator: firstOp?.label || "equals",
      operator_id: firstOp?.id || 1,
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
      // Determine condition type based on category value
      let condType: SegmentCondition["conditionType"] = "360_profile";
      if (cat.value === "segments") {
        condType = "segment";
      } else if (cat.value === "quicklists") {
        condType = "list";
      }

      options.push({
        value: `${condType}:${cat.id}`,
        label: cat.name || cat.category || "Unknown",
        type: condType,
      });
    });

    // Add system event option
    options.push({
      value: "system_event",
      label: "System Event",
      type: "system_event",
    });

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
    const getCategoryAndSubcategory = () => {
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
        return selectedCategory;
      }
      return null;
    };

    const selectedCategoryObj = getCategoryAndSubcategory();
    const hasSubcategories = selectedCategoryObj?.sub_categories && selectedCategoryObj.sub_categories.length > 0;

    // Get fields based on subcategory (if selected) or category
    const getFieldOptions = () => {
      if (!selectedCategoryObj) {
        const fieldsArray = Array.isArray(allFields) ? allFields : [];
        const fieldsToShow =
          fieldsArray.length > 0 ? fieldsArray : SEGMENT_FIELDS;
        return fieldsToShow.map((field) => ({
          value: "field_value" in field ? (field.field_value || "") : (field.key || ""),
          label: "field_name" in field ? (field.field_name || "Unknown") : (field.label || "Unknown"),
          description: "field_description" in field ? (field.field_description || "Unknown") : "Unknown",
          type: "field_type" in field ? (field.field_type || "Unknown") : "Unknown",
        }));
      }

      // If category has subcategories and one is selected, use subcategory's fields
      if (hasSubcategories && condition.subcategory_id) {
        const selectedSubcategory = selectedCategoryObj.sub_categories.find(
          (sc: any) => sc.id === condition.subcategory_id,
        );
        const fieldsToShow = selectedSubcategory?.fields || [];
        return fieldsToShow.map((field: any) => ({
          value: field.field_value || "",
          label: field.field_name || "Unknown",
          description: field.field_description || "Unknown",
          type: field.field_type || "Unknown",
        }));
      }

      // If category has no subcategories, use category's fields directly
      if (!hasSubcategories) {
        const fieldsToShow = selectedCategoryObj?.fields || [];
        return fieldsToShow.map((field: any) => ({
          value: field.field_value || "",
          label: field.field_name || "Unknown",
          description: field.field_description || "Unknown",
          type: field.field_type || "Unknown",
        }));
      }

      // If subcategories exist but none selected, show empty
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

    return (
      <>
        {/* Subcategory Dropdown - Show if category has subcategories */}
        {hasSubcategories && (
          <div className="flex-1 min-w-[80px]">
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
                options={subcategoryOptions}
                value={condition.subcategory_id || ""}
                onChange={(value) => {
                  const subcatId = parseInt(value as string);
                  updateCondition(groupId, condition.id, {
                    subcategory_id: subcatId,
                    subcategory_name: subcategoryOptions.find((opt) => opt.value === subcatId)?.label,
                    field: "", // Clear field selection when subcategory changes
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

        {/* Field Selection - Modal Picker - Only show if subcategory is selected (or no subcategories) */}
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
            onMouseEnter={(e) => {
              // e.currentTarget.style.borderColor = color.primary.accent;
              // e.currentTarget.style.backgroundColor = `${color.primary.accent}08`;
            }}
            onMouseLeave={(e) => {
              // e.currentTarget.style.borderColor = color.border.default;
              // e.currentTarget.style.backgroundColor = color.surface.background;
            }}
          >
            <span style={{ color: selectedField ? color.text.primary : color.text.secondary }}>
              {selectedField?.label || "Select field"}
            </span>
          </button>
        )}

        {/* Operator & Time Window Selection - on same line */}
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
            <div className="flex items-center gap-2">
              {/* Operator Dropdown */}
              <div className="min-w-[160px] max-w-[200px] flex-shrink-0">
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
                      updateCondition(groupId, condition.id, {
                        operator: operator as SegmentCondition["operator"],
                        operator_id: operatorId ? parseInt(operatorId) : undefined,
                        value: "",
                        start_date: undefined,
                        end_date: undefined,
                      });
                    }}
                    className="text-sm"
                    zIndex={zIndex.popover}
                  />
                </div>
              </div>

              {/* Time Window Selector - only for computable fields */}
              {isComputable && (
                <div className="min-w-[140px] max-w-[180px] flex-shrink-0">
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

    // Check if field is numeric (Money, decimal, numeric)
    const isNumericField = ["money", "decimal", "numeric"].includes(fieldType);

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

    // Check if selected operator is a date operator
    const isDateOperator = ["on_date", "between_dates", "since_date", "until_date"].includes(operator);

    // No value input needed for NULL operators
    if (isNullOperator) {
      return null;
    }

    // For computable fields, handle time window and value input
    if (backendField?.is_computable === true) {
      const timeWindow = condition.time_window || "last_7_days";
      const isCustom = timeWindow === "custom";

      return (
        <div className="flex items-center gap-2">
          {/* Value Input */}
          <div className="min-w-[140px] max-w-[160px]">
            <Input
              type="number"
              value={condition.value as string | number}
              onChange={(value) => {
                updateCondition(groupId, condition.id, {
                  value: String(value) ? parseFloat(String(value)) : "",
                });
              }}
              placeholder="Enter value"
              variant="medium"
            />
          </div>

          {/* Custom Date Controls - only if time_window === "custom" */}
          {isCustom && (() => {
            const dateOp = condition.date_operator || "between";
            const isOnDate = dateOp === "on";
            const isBetweenDates = dateOp === "between";
            const isSince = dateOp === "since";
            const isUntil = dateOp === "until";

            return (
              <>
                <div className="min-w-[140px] max-w-[160px]">
                  <HeadlessSelect
                    options={DATE_OPERATORS}
                    value={dateOp}
                    onChange={(value) => {
                      updateCondition(groupId, condition.id, {
                        date_operator: value as SegmentCondition["date_operator"],
                        start_date: undefined,
                        end_date: undefined,
                      });
                    }}
                    placeholder="Select date type"
                    className="text-sm"
                    zIndex={zIndex.popover}
                  />
                </div>

                {(isOnDate || isBetweenDates) && (
                  <div className="min-w-[140px] max-w-[160px]">
                    <Input
                      type="date"
                      value={condition.start_date || ""}
                      onChange={(value) => {
                        updateCondition(groupId, condition.id, {
                          start_date: String(value),
                        });
                      }}
                      placeholder="Select date"
                      variant="medium"
                    />
                  </div>
                )}

                {isBetweenDates && (
                  <>
                    <span className="text-gray-500 text-sm">to</span>
                    <div className="min-w-[140px] max-w-[160px]">
                      <Input
                        type="date"
                        value={condition.end_date || ""}
                        onChange={(value) => {
                          updateCondition(groupId, condition.id, {
                            end_date: String(value),
                          });
                        }}
                        placeholder="End date"
                        variant="medium"
                      />
                    </div>
                  </>
                )}

                {(isSince || isUntil) && (
                  <div className="min-w-[140px] max-w-[160px]">
                    <Input
                      type="date"
                      value={condition.start_date || ""}
                      onChange={(value) => {
                        updateCondition(groupId, condition.id, {
                          start_date: String(value),
                        });
                      }}
                      placeholder={isSince ? "Since date" : "Until date"}
                      variant="medium"
                    />
                  </div>
                )}
              </>
            );
          })()}
        </div>
      );
    }

    // For numeric fields, show dual-operator UI (value + secondary date dropdown)
    // But NOT if a date operator is selected
    if (isNumericField && !isBetweenOperator && !isInListOperator && !isDateField && !isDateOperator) {
      return (
        <>
          {/* Numeric field dual-operator UI - ALL on one line */}
          <div className="flex items-center gap-2 w-full overflow-x-auto">
            {/* Numeric Value Input */}
            <Input type="number"
              value={condition.value as string | number}
              onChange={(value) => {
                updateCondition(groupId, condition.id, {
                  value: String(value) ? parseFloat(String(value)) : "",
                });
              }}
              placeholder="Enter value"
              className={`px-3 py-3 border border-gray-300 ${tw.rounded} focus:outline-none text-sm min-w-[100px] max-w-[150px]`}
              style={{ borderColor: color.border.default }}
            />

            <div className="min-w-[140px] max-w-[170px] flex-shrink-0">
              <HeadlessSelect
                options={DATE_OPERATORS}
                value={condition.date_operator || "on"}
                onChange={(value) => {
                  updateCondition(groupId, condition.id, {
                    date_operator: value as SegmentCondition["date_operator"],
                    start_date: undefined,
                    end_date: undefined,
                  });
                }}
                placeholder="Select date type"
                className="text-sm"
                zIndex={zIndex.popover}
              />
            </div>

            {(condition.date_operator || "on") === "on" && (
              <Input type="date"
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
                placeholder="Select date"
                className={`px-3 py-3 border border-gray-300 ${tw.rounded} focus:outline-none text-sm min-w-[140px] max-w-[180px]`}
                style={{ borderColor: color.border.default }}
              />
            )}

            {(condition.date_operator || "on") === "between" && (
              <>
                <Input type="date"
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
                  placeholder="From date"
                  className={`px-3 py-3 border border-gray-300 ${tw.rounded} focus:outline-none text-sm min-w-[140px] max-w-[180px]`}
                  style={{ borderColor: color.border.default }}
                />
                <Input type="date"
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
                  placeholder="To date"
                  className={`px-3 py-3 border border-gray-300 ${tw.rounded} focus:outline-none text-sm min-w-[140px] max-w-[180px]`}
                  style={{ borderColor: color.border.default }}
                />
              </>
            )}

            {(condition.date_operator || "on") === "since" && (
              <Input type="date"
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
                placeholder="From date"
                className={`px-3 py-3 border border-gray-300 ${tw.rounded} focus:outline-none text-sm min-w-[140px] max-w-[180px]`}
                style={{ borderColor: color.border.default }}
              />
            )}

            {(condition.date_operator || "on") === "until" && (
              <Input type="date"
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
                placeholder="To date"
                className={`px-3 py-3 border border-gray-300 ${tw.rounded} focus:outline-none text-sm min-w-[140px] max-w-[180px]`}
                style={{ borderColor: color.border.default }}
              />
            )}
          </div>
        </>
      );
    }

    // For numeric fields with date operators, show date inputs directly (no secondary dropdown)
    if (isNumericField && isDateOperator) {
      return (
        <>
          <div className="flex items-center gap-2 w-full overflow-x-auto">
            {condition.operator === "on_date" && (
              <Input type="date"
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
                className={`px-3 py-3 border border-gray-300 ${tw.rounded} focus:outline-none text-sm min-w-[140px] max-w-[180px]`}
                style={{ borderColor: color.border.default }}
              />
            )}

            {condition.operator === "between_dates" && (
              <>
                <Input type="date"
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
                  placeholder="From date"
                  className={`px-3 py-3 border border-gray-300 ${tw.rounded} focus:outline-none text-sm min-w-[140px] max-w-[180px]`}
                  style={{ borderColor: color.border.default }}
                />
                <Input type="date"
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
                  placeholder="To date"
                  className={`px-3 py-3 border border-gray-300 ${tw.rounded} focus:outline-none text-sm min-w-[140px] max-w-[180px]`}
                  style={{ borderColor: color.border.default }}
                />
              </>
            )}

            {condition.operator === "since_date" && (
              <Input type="date"
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
                placeholder="From date"
                className={`px-3 py-3 border border-gray-300 ${tw.rounded} focus:outline-none text-sm min-w-[140px] max-w-[180px]`}
                style={{ borderColor: color.border.default }}
              />
            )}

            {condition.operator === "until_date" && (
              <Input type="date"
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
                placeholder="To date"
                className={`px-3 py-3 border border-gray-300 ${tw.rounded} focus:outline-none text-sm min-w-[140px] max-w-[180px]`}
                style={{ borderColor: color.border.default }}
              />
            )}
          </div>
        </>
      );
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
              <Input type="date"
                placeholder="Date"
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
                className={`px-3 py-2 border border-gray-300 ${tw.rounded} focus:outline-none text-sm min-w-[160px] flex-1`}
              />
            )}
            {(operator === "greater than" ||
              operator === "greater than or equal" ||
              isBetweenOperator) && (
              <Input type="date"
                placeholder={isBetweenOperator ? "From date" : "After date"}
                value={
                  condition.start_date ? condition.start_date.split("T")[0] : ""
                }
                onChange={(value) => {
                  updateCondition(groupId, condition.id, {
                    start_date: String(value)
                      ? `${String(value)}T00:00:00Z`
                      : undefined,
                  });
                }}
                className={`px-3 py-2 border border-gray-300 ${tw.rounded} focus:outline-none text-sm min-w-[160px] flex-1`}
              />
            )}
            {(operator === "less than" ||
              operator === "less than or equal" ||
              isBetweenOperator) && (
              <Input type="date"
                placeholder={isBetweenOperator ? "To date" : "Before date"}
                value={
                  condition.end_date ? condition.end_date.split("T")[0] : ""
                }
                onChange={(value) => {
                  updateCondition(groupId, condition.id, {
                    end_date: String(value)
                      ? `${String(value)}T23:59:59Z`
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
            <Input type="text"
              placeholder="Enter comma-separated values (e.g. NAIROBI, MOMBASA)"
              value={
                Array.isArray(condition.value)
                  ? (condition.value as (string | number)[]).join(", ")
                  : (condition.value as string | number) || ""
              }
              onChange={(value) => {
                // Store as array by splitting on commas
                const rawValue = String(value);
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
            <Input type="number"
              placeholder="Min"
              value={condition.start_date || ""}
              onChange={(value) => {
                updateCondition(groupId, condition.id, {
                  start_date: String(value) || undefined,
                });
              }}
              className={`px-3 py-2 border border-gray-300 ${tw.rounded} focus:outline-none text-sm min-w-[100px] flex-1`}
            />
            <Input type="number"
              placeholder="Max"
              value={condition.end_date || ""}
              onChange={(value) => {
                updateCondition(groupId, condition.id, {
                  end_date: String(value) || undefined,
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
                  <Input type="date"
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
                    className={`w-full px-3 py-3 border border-gray-300 ${tw.rounded} focus:outline-none text-sm`}
                    style={{ borderColor: color.border.default }}
                  />
                </div>
              ) : condition.operator === "between_dates" ? (
                <>
                  <div className="min-w-[180px] flex-shrink-0">
                    <Input type="date"
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
                      className={`w-full px-3 py-3 border border-gray-300 ${tw.rounded} focus:outline-none text-sm`}
                      style={{ borderColor: color.border.default }}
                    />
                  </div>
                  <div className="min-w-[180px] flex-shrink-0">
                    <Input type="date"
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
                      className={`w-full px-3 py-3 border border-gray-300 ${tw.rounded} focus:outline-none text-sm`}
                      style={{ borderColor: color.border.default }}
                    />
                  </div>
                </>
              ) : (
                <div className="min-w-[100px] max-w-[120px] flex-shrink-0">
                  <Input type="number"
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
    // For numeric KPI fields (Revenue, Usage), show dual operators
    const isNumericKPI =
      condition.conditionType === "revenue_metric_kpi" ||
      condition.conditionType === "usage_metric_kpi";

    // Check if selected operator is a date operator (new date operators for numeric fields)
    const isDateOperator = ["on_date", "between_dates", "since_date", "until_date"].includes(
      condition.operator?.toLowerCase() || "",
    );

    // For non-revenue KPIs, check if the selected field is of type "date"
    // Revenue/Usage KPIs always support date operators, others only if field is date type
    const shouldShowDateOperators = isNumericKPI; // Only Revenue/Usage have date operators

    return (
      <>
        {/* Operator for KPI - Only show if KPI selected */}
        {condition.kpi_name && (
          <>
            {/* For numeric KPIs: Show combined operator dropdown (numeric + date options) */}
            {isNumericKPI ? (
              <>
                {/* Wrapper for operator + value + date operator dropdowns + date inputs ALL on one line */}
                <div className="flex items-center gap-2 w-full overflow-x-auto">
                  {/* Operator Dropdown */}
                  <div className="min-w-[220px] max-w-[280px] flex-shrink-0">
                    <HeadlessSelect
                      // COMMENTED OUT: Using only backend operators
                      // options={getOperatorsForFieldType("money").map((op) => ({
                      //   value: op.label,
                      //   label: op.label
                      //     .split("_")
                      //     .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                      //     .join(" "),
                      // }))}
                      options={[
                        // TODO: Get KPI operators from backend
                        { value: "equals", label: "Equals" },
                        { value: "greater_than", label: "Greater Than" },
                        { value: "less_than", label: "Less Than" },
                      ]} // Temporary default options - should come from backend
                      value={condition.operator}
                      onChange={(value) => {
                        updateCondition(groupId, condition.id, {
                          operator: value as SegmentCondition["operator"],
                          value: "",
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
                    <Input type="number"
                      value={condition.value as string | number}
                      onChange={(value) => {
                        updateCondition(groupId, condition.id, {
                          value: String(value) ? parseFloat(String(value)) : "",
                        });
                      }}
                      placeholder="Enter value"
                      className={`px-3 py-3 border border-gray-300 ${tw.rounded} focus:outline-none text-sm min-w-[100px] max-w-[150px]`}
                      style={{ borderColor: color.border.default }}
                    />
                  )}

                  {/* TODO: Secondary Date Range Dropdown - Commented out pending backend updates
                  {!isDateOperator && isNumericKPI && (
                    <div className="min-w-[140px] max-w-[170px] flex-shrink-0">
                      <HeadlessSelect
                        options={DATE_OPERATORS}
                        value={condition.date_operator || "on"}
                        onChange={(value) => {
                          updateCondition(groupId, condition.id, {
                            date_operator: value as SegmentCondition["date_operator"],
                            start_date: undefined,
                            end_date: undefined,
                          });
                        }}
                        placeholder="Select date type"
                        className="text-sm"
                        zIndex={zIndex.popover}
                      />
                    </div>
                  )}

                  {isDateOperator ? (
                  // When date operator selected directly
                  <>
                    {condition.operator === "on_date" && (
                      <Input type="date"
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
                        className={`px-3 py-3 border border-gray-300 ${tw.rounded} focus:outline-none text-sm min-w-[140px] max-w-[180px]`}
                        style={{ borderColor: color.border.default }}
                      />
                    )}

                    {condition.operator === "between_dates" && (
                      <>
                        <Input type="date"
                          value={
                            condition.value
                              ? (condition.value as string).split(",")[0] || ""
                              : ""
                          }
                          onChange={(value) => {
                            const endDate = condition.value
                              ? (condition.value as string).split(",")[1] || ""
                              : "";
                            updateCondition(groupId, condition.id, {
                              value: `${String(value)},${endDate}`,
                            });
                          }}
                          placeholder="From date"
                          className={`px-3 py-3 border border-gray-300 ${tw.rounded} focus:outline-none text-sm min-w-[140px] max-w-[180px]`}
                          style={{ borderColor: color.border.default }}
                        />
                        <Input type="date"
                          value={
                            condition.value
                              ? (condition.value as string).split(",")[1] || ""
                              : ""
                          }
                          onChange={(value) => {
                            const startDate = condition.value
                              ? (condition.value as string).split(",")[0] || ""
                              : "";
                            updateCondition(groupId, condition.id, {
                              value: `${startDate},${String(value)}`,
                            });
                          }}
                          placeholder="To date"
                          className={`px-3 py-3 border border-gray-300 ${tw.rounded} focus:outline-none text-sm min-w-[140px] max-w-[180px]`}
                          style={{ borderColor: color.border.default }}
                        />
                      </>
                    )}

                    {condition.operator === "since_date" && (
                      <Input type="date"
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
                        className={`px-3 py-3 border border-gray-300 ${tw.rounded} focus:outline-none text-sm min-w-[140px] max-w-[180px]`}
                        style={{ borderColor: color.border.default }}
                      />
                    )}

                    {condition.operator === "until_date" && (
                      <Input type="date"
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
                        className={`px-3 py-3 border border-gray-300 ${tw.rounded} focus:outline-none text-sm min-w-[140px] max-w-[180px]`}
                        style={{ borderColor: color.border.default }}
                      />
                    )}
                  </>
                ) : (
                  // When numeric operator selected, show secondary date inputs based on date_operator
                  <>
                    {(condition.date_operator || "on") === "on" && (
                      <Input type="date"
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
                        placeholder="Select date"
                        className={`px-3 py-3 border border-gray-300 ${tw.rounded} focus:outline-none text-sm min-w-[140px] max-w-[180px]`}
                        style={{ borderColor: color.border.default }}
                      />
                    )}

                    {(condition.date_operator || "on") === "between" && (
                      <>
                        <Input type="date"
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
                          placeholder="From date"
                          className={`px-3 py-3 border border-gray-300 ${tw.rounded} focus:outline-none text-sm min-w-[140px] max-w-[180px]`}
                          style={{ borderColor: color.border.default }}
                        />
                        <Input type="date"
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
                          placeholder="To date"
                          className={`px-3 py-3 border border-gray-300 ${tw.rounded} focus:outline-none text-sm min-w-[140px] max-w-[180px]`}
                          style={{ borderColor: color.border.default }}
                        />
                      </>
                    )}

                    {(condition.date_operator || "on") === "since" && (
                      <Input type="date"
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
                        placeholder="From date"
                        className={`px-3 py-3 border border-gray-300 ${tw.rounded} focus:outline-none text-sm min-w-[140px] max-w-[180px]`}
                        style={{ borderColor: color.border.default }}
                      />
                    )}

                    {(condition.date_operator || "on") === "until" && (
                      <Input type="date"
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
                        placeholder="To date"
                        className={`px-3 py-3 border border-gray-300 ${tw.rounded} focus:outline-none text-sm min-w-[140px] max-w-[180px]`}
                        style={{ borderColor: color.border.default }}
                      />
                    )}
                  </>
                )}
                */}
                </div>
              </>
            ) : (
              /* Non-numeric KPIs (System Events, etc.) - only show non-date operators */
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
                  className={`px-3 py-3 border border-gray-300 ${tw.rounded} focus:outline-none text-sm min-w-[100px] flex-1 max-w-[200px]`}
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

  const selectedSegmentId = currentEditingCondition
    ? conditions
        .find((g) => g.id === currentEditingCondition.groupId)
        ?.conditions.find((c) => c.id === currentEditingCondition.conditionId)
        ?.segment_id
    : undefined;

  const selectedQuickListId = currentEditingCondition
    ? conditions
        .find((g) => g.id === currentEditingCondition.groupId)
        ?.conditions.find((c) => c.id === currentEditingCondition.conditionId)
        ?.list_id
    : undefined;

  const filteredQuickListOptions = quickListOptions.filter((quicklist) => {
    const matchesSearch =
      quicklist.name.toLowerCase().includes(quickListSearchTerm.toLowerCase()) ||
      (quicklist.description?.toLowerCase() || "").includes(
        quickListSearchTerm.toLowerCase(),
      );

    if (quickListFilter === "all") return matchesSearch;

    return matchesSearch && quicklist.upload_type === quickListFilter;
  });

  return (
    <div className="space-y-4">
      {/* Segment Conditions Title and Preview Button */}
      {showPreview && (
        <div className="flex items-center justify-between">
          <label className={`block text-sm font-medium ${tw.textPrimary}`}>
            Segment Conditions *
          </label>
          <div className="flex items-center space-x-3">
            {previewCount !== null && (
              <span className={`text-sm ${tw.textSecondary}`}>
                {previewCount.toLocaleString()} customers
              </span>
            )}
            <button
              type="button"
              onClick={handlePreview}
              disabled={
                isPreviewLoading || conditions.length === 0
              }
              className={`inline-flex items-center px-4 py-2 text-sm text-white ${tw.rounded} transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
              style={{
                backgroundColor: isPreviewLoading ? color.text.secondary : color.primary.action,
              }}
            >
              {isPreviewLoading && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              {isPreviewLoading ? "Previewing..." : "Preview"}
            </button>
          </div>
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

      {/* Conditions Builder */}
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
                      <div className="max-w-[180px]">
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
                              options={getDataSourceOptions().map((opt) => ({
                                value: opt.value,
                                label: opt.label,
                              }))}
                              value={
                                condition.conditionType === "360_profile"
                                  ? `360_profile:${condition.category}`
                                  : condition.conditionType === "segment" || condition.conditionType === "list"
                                    ? `${condition.conditionType}:${condition.category}`
                                    : condition.conditionType
                              }
                              onChange={(value) => {
                                const selectedOption =
                                  getDataSourceOptions().find(
                                    (opt) => opt.value === value,
                                  );
                                if (!selectedOption) return;

                                const condType = selectedOption.type;
                                const categoryId = parseInt(
                                  value.split(":")[1] || "1",
                                );

                                // Reset condition based on type
                                if (condType === "360_profile") {
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
          { value: "static", label: "Static" },
          { value: "dynamic", label: "Dynamic" },
          { value: "trigger", label: "Trigger" },
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
                  conditionType: currentKPIModalType,
                  kpi_id: kpi.id,
                  kpi_name: kpi.name,
                  kpi_category: kpi.category,
                  operator: "equals",
                  date_operator: "on",
                  value: "",
                  start_date: undefined,
                  end_date: undefined,
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
