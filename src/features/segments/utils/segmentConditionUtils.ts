import { User, Users, List, Zap, DollarSign, Activity } from "lucide-react";
import { SegmentCondition, SegmentConditionGroup, SEGMENT_FIELDS } from "../types/segment";
import { getOperatorsForField } from "../../../shared/utils/operatorMapper";

export const formatSQL = (sql: string): string => {
  if (!sql) return "";

  const formatted = sql
    .replace(/\bSELECT\b/gi, "\nSELECT\n  ")
    .replace(/\bFROM\b/gi, "\n\nFROM\n  ")
    .replace(/\bWHERE\b/gi, "\n\nWHERE\n  ")
    .replace(/\bORDER BY\b/gi, "\n\nORDER BY\n  ")
    .replace(/\bGROUP BY\b/gi, "\n\nGROUP BY\n  ")
    .replace(/\bHAVING\b/gi, "\n\nHAVING\n  ")
    .replace(/\bLIMIT\b/gi, "\n\nLIMIT ")
    .replace(/\bOFFSET\b/gi, "\nOFFSET ")
    .replace(/\bJOIN\b/gi, "\nJOIN\n  ")
    .replace(/\bLEFT JOIN\b/gi, "\nLEFT JOIN\n  ")
    .replace(/\bINNER JOIN\b/gi, "\nINNER JOIN\n  ")
    .replace(/\bON\b/gi, "\n  ON ")
    .replace(/\bAND\b/gi, "\n  AND ")
    .replace(/\bOR\b/gi, "\n  OR ")
    .replace(/\n\s*\n\s*\n/g, "\n\n")
    .replace(/,\s*/g, ",\n  ")
    .trim();

  return formatted;
};

export const getConditionTypeIcon = (type: string) => {
  switch (type) {
    case "customer_identity":
      return User;
    case "segment":
      return Users;
    case "list":
      return List;
    case "system_event":
      return Zap;
    case "revenue_metric":
      return DollarSign;
    case "usage_metric":
      return Activity;
    case "kpi":
      return Activity;
    default:
      return User;
  }
};

export const getKPISubcategoryOptions = (
  conditionType: string,
  allKPIs: Array<any>
) => {
  let categoryName: string | undefined;
  if (conditionType === "revenue_metric") {
    categoryName = "Revenue Metric";
  } else if (conditionType === "usage_metric") {
    categoryName = "Usage Metric";
  } else if (conditionType === "kpi") {
    categoryName = "System Event";
  }

  if (!categoryName) return undefined;

  const subcategories = Array.from(
    new Set(
      allKPIs
        .filter((kpi) => kpi.category === categoryName)
        .map((kpi) => kpi.subcategory)
        .filter((sc) => sc !== undefined) as string[]
    )
  ).sort();

  if (subcategories.length === 0) return undefined;

  return [
    { value: "all", label: `All ${categoryName}` },
    ...subcategories.map((sc) => ({
      value: sc,
      label: sc
        .split("_")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" "),
    })),
  ];
};

export const getFirstBackendOperator = (
  field: Record<string, any> | null | undefined
) => {
  const ops = getOperatorsForField(field);
  return ops.length > 0
    ? { id: ops[0].id, label: ops[0].label }
    : { id: 1, label: "equals" };
};

export const isDateFieldType = (
  field: Record<string, any> | null | undefined
): boolean => {
  if (!field?.field_type) return false;
  const ft = field.field_type.toLowerCase();
  return (
    ft === "date" ||
    ft === "timestamp" ||
    ft === "timestamptz" ||
    ft === "datetime"
  );
};

export const getFieldType = (
  fieldKey: string,
  getFieldByValue: (key: string) => Record<string, any> | null | undefined
): string => {
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
        return "string";
      default:
        return "string";
    }
  }
  const field = SEGMENT_FIELDS.find((f) => f.key === fieldKey);
  return field?.type || "string";
};

export const getDataSourceOptions = (
  categories: Array<any>
): Array<{
  value: string;
  label: string;
  type: SegmentCondition["conditionType"];
}> => {
  const options: {
    value: string;
    label: string;
    type: SegmentCondition["conditionType"];
  }[] = [];

  const categoriesArray = Array.isArray(categories) ? categories : [];
  categoriesArray.forEach((cat) => {
    let condType: SegmentCondition["conditionType"] = "customer_identity";

    // Map category value to conditionType
    const catValue = (cat.value || "").toLowerCase();
    if (catValue === "segments") {
      condType = "segment";
    } else if (catValue === "quicklists") {
      condType = "list";
    } else if (catValue === "revenue_kpis" || catValue === "revenue") {
      condType = "revenue_metric";
    } else if (catValue === "usage_kpis" || catValue === "usage") {
      condType = "usage_metric";
    } else if (catValue === "kpi" || catValue === "kpis") {
      condType = "kpi";
    }
    // else: customer_360, customer_identity, etc. remain as "customer_identity"

    options.push({
      value: `${condType}:${cat.id}`,
      label: cat.name || cat.category || "Unknown",
      type: condType,
    });
  });

  options.push({
    value: "system_event",
    label: "System Event",
    type: "system_event",
  });

  return options;
};

export const getDefaultCondition = (
  categoryId: number,
  firstField: Record<string, any> | null,
  getFieldByValue: (key: string) => Record<string, any> | null | undefined,
  generateId: () => string
): { condition: SegmentCondition; subcategoryId?: number; subcategoryName?: string } => {
  const firstOp = getFirstBackendOperator(firstField);
  const defaultFieldValue = firstField
    ? firstField.field_value
    : SEGMENT_FIELDS.length > 0
      ? SEGMENT_FIELDS[0].key
      : "";
  const defaultFieldId = firstField ? firstField.id : undefined;

  return {
    condition: {
      id: generateId(),
      conditionType: "customer_identity",
      category: categoryId,
      subcategory_id: undefined,
      subcategory_name: undefined,
      field: defaultFieldValue,
      field_name: firstField?.field_name,
      field_id: defaultFieldId,
      operator: firstOp?.label || "equals",
      operator_id: firstOp?.id || 1,
      value: "",
      type: "string",
    },
    subcategoryId: undefined,
    subcategoryName: undefined,
  };
};

export const createNewConditionGroup = (
  allFields: Array<any>,
  categories: Array<any>,
  generateId: () => string,
  getFieldByValue: (key: string) => Record<string, any> | null | undefined
): SegmentConditionGroup => {
  const fieldsArray = Array.isArray(allFields) ? allFields : [];
  const categoriesArray = Array.isArray(categories) ? categories : [];

  const customer360Category =
    categoriesArray.find((c) => c.value === "customer_360") ||
    categoriesArray[0];
  const categoryId = customer360Category?.id || 1;

  let selectedSubcategoryId: number | undefined = undefined;
  let selectedSubcategoryName: string | undefined = undefined;
  let fieldsToUse: any[] = [];

  if (
    customer360Category?.sub_categories &&
    customer360Category.sub_categories.length > 0
  ) {
    const firstSubcategory = customer360Category.sub_categories[0];
    selectedSubcategoryId = firstSubcategory.id;
    selectedSubcategoryName = firstSubcategory.name;
    fieldsToUse = firstSubcategory.fields || [];
  } else {
    fieldsToUse = customer360Category?.fields || fieldsArray;
  }

  const firstField =
    fieldsToUse.length > 0
      ? fieldsToUse[0]
      : fieldsArray.length > 0
        ? fieldsArray[0]
        : null;

  const firstOp = getFirstBackendOperator(firstField);
  const defaultFieldValue = firstField
    ? firstField.field_value
    : SEGMENT_FIELDS.length > 0
      ? SEGMENT_FIELDS[0].key
      : "";
  const defaultFieldId = firstField ? firstField.id : undefined;

  return {
    id: generateId(),
    operator: "AND",
    groupOperator: "AND",
    conditions: [
      {
        id: generateId(),
        conditionType: "customer_identity",
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
};

export const createNewCondition = (
  groupId: string,
  allFields: Array<any>,
  categories: Array<any>,
  generateId: () => string,
  getFieldByValue: (key: string) => Record<string, any> | null | undefined
): SegmentCondition => {
  const fieldsArray = Array.isArray(allFields) ? allFields : [];
  const categoriesArray = Array.isArray(categories) ? categories : [];

  const customer360Category =
    categoriesArray.find((c) => c.value === "customer_360") ||
    categoriesArray[0];
  const categoryId = customer360Category?.id || 1;

  let fieldsToUse: any[] = [];

  if (
    customer360Category?.sub_categories &&
    customer360Category.sub_categories.length > 0
  ) {
    const firstSubcategory = customer360Category.sub_categories[0];
    fieldsToUse = firstSubcategory.fields || [];
  } else {
    fieldsToUse = customer360Category?.fields || fieldsArray;
  }

  const firstField =
    fieldsToUse.length > 0
      ? fieldsToUse[0]
      : fieldsArray.length > 0
        ? fieldsArray[0]
        : null;

  const firstOp = getFirstBackendOperator(firstField);
  const defaultFieldValue = firstField
    ? firstField.field_value
    : SEGMENT_FIELDS.length > 0
      ? SEGMENT_FIELDS[0].key
      : "";
  const defaultFieldId = firstField ? firstField.id : undefined;

  return {
    id: generateId(),
    conditionType: "customer_identity",
    category: categoryId,
    field: defaultFieldValue,
    field_name: firstField?.field_name,
    field_id: defaultFieldId,
    operator: firstOp?.label || "equals",
    operator_id: firstOp?.id || 1,
    value: "",
    type: "string",
    time_window: "last_7_days",
    time_window_id: 1, // Corresponds to "last_7_days"
  };
};

export const applyConditionGroupUpdate = (
  conditions: SegmentConditionGroup[],
  groupId: string,
  updates: Partial<SegmentConditionGroup>
): SegmentConditionGroup[] => {
  return conditions.map((group) =>
    group.id === groupId ? { ...group, ...updates } : group
  );
};

export const removeConditionGroupFromList = (
  conditions: SegmentConditionGroup[],
  groupId: string
): SegmentConditionGroup[] => {
  return conditions.filter((group) => group.id !== groupId);
};

export const applyConditionUpdate = (
  conditions: SegmentConditionGroup[],
  groupId: string,
  conditionId: string,
  updates: Partial<SegmentCondition>
): SegmentConditionGroup[] => {
  return conditions.map((group) =>
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
  );
};

export const removeConditionFromGroup = (
  conditions: SegmentConditionGroup[],
  groupId: string,
  conditionId: string
): SegmentConditionGroup[] => {
  return conditions.map((group) =>
    group.id === groupId
      ? {
          ...group,
          conditions: group.conditions.filter((c) => c.id !== conditionId),
        }
      : group
  );
};

export const addConditionToGroup = (
  conditions: SegmentConditionGroup[],
  groupId: string,
  newCondition: SegmentCondition
): SegmentConditionGroup[] => {
  return conditions.map((group) =>
    group.id === groupId
      ? { ...group, conditions: [...group.conditions, newCondition] }
      : group
  );
};

export const getTodayDateString = (): string => {
  return new Date().toISOString().split('T')[0];
};

export const getDefaultDatesForOperator = (operator: string): { start_date?: string; end_date?: string; value?: string } => {
  const today = new Date();
  const todayStr = getTodayDateString();

  switch (operator) {
    case "between_dates": {
      const thirtyDaysAgo = new Date(today);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return {
        start_date: thirtyDaysAgo.toISOString().split('T')[0],
        end_date: todayStr,
      };
    }
    case "since_date":
      return {
        start_date: todayStr,
      };
    case "until_date":
      return {
        end_date: todayStr,
      };
    case "on_date":
      return {
        value: todayStr,
      };
    default:
      return {};
  }
};

export const detectTimeWindowFromDates = (startDate?: string, endDate?: string): string => {
  if (!startDate || !endDate) return "custom";

  const today = new Date();
  const todayStr = getTodayDateString();

  // Parse the date strings (handle both date-only and full ISO formats)
  const start = new Date(startDate.split('T')[0]);
  const end = new Date(endDate.split('T')[0]);
  const todayDate = new Date(todayStr);

  // Calculate the difference in days
  const diffMs = todayDate.getTime() - start.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  // Check if end date matches today
  if (end.toISOString().split('T')[0] !== todayStr) {
    return "custom";
  }

  // Check for last_7_days
  if (diffDays === 7) {
    return "last_7_days";
  }

  // Check for last_30_days
  if (diffDays === 30) {
    return "last_30_days";
  }

  // Check for last_90_days
  if (diffDays === 90) {
    return "last_90_days";
  }

  // Check for current_month (start date is 1st of current month)
  if (start.getDate() === 1 && start.getMonth() === today.getMonth() && start.getFullYear() === today.getFullYear()) {
    return "current_month";
  }

  return "custom";
};
