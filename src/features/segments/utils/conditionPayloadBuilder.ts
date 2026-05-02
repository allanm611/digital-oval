import type { SegmentCondition, SegmentConditionGroup, LayerCondition, SourceLayer, LayerColumnRef, SegmentPayload } from "../types/segment";
import { getDateRangeForTimeWindow } from "../../../shared/utils/operatorMapper";

/**
 * Checks if a condition is a profile-type condition (has field_id and operator_id)
 */
export const isProfileTypeCondition = (condition: SegmentCondition): boolean => {
  return (
    condition &&
    condition.conditionType &&
    ["customer_identity", "revenue_metric", "usage_metric", "kpi"].includes(condition.conditionType) &&
    !!condition.field_id &&
    !!condition.operator_id
  );
};

/**
 * Builds a single layer condition from a segment condition
 */
const buildLayerCondition = (condition: SegmentCondition): LayerCondition | null => {
  if (!isProfileTypeCondition(condition)) {
    return null;
  }

  const hasValue = Array.isArray(condition.value)
    ? (condition.value as (string | number)[]).length > 0
    : condition.value !== "" &&
      condition.value !== undefined &&
      condition.value !== null;

  // Calculate dates from time_window if present
  let calculatedDateRange: { start_date: string; end_date: string } | null = null;
  if (condition.time_window && condition.time_window !== "custom") {
    calculatedDateRange = getDateRangeForTimeWindow(condition.time_window);
  }

  const hasDateRange = condition.start_date || condition.end_date || !!calculatedDateRange;
  const isNullOp =
    condition.operator_id === 10 || condition.operator_id === 11; // IS NULL (10), IS NOT NULL (11)

  const isDateOperator = ["on_date", "since_date", "until_date", "between_dates"].includes(
    condition.operator?.toLowerCase() || ""
  );

  if (!hasValue && !hasDateRange && !isNullOp) {
    return null;
  }

  let condValue: string | number | (string | number)[] | undefined =
    condition.value as string | number | (string | number)[] | undefined;
  if (
    (condition.operator_id === 7 || condition.operator_id === 8) &&
    condValue
  ) {
    if (typeof condValue === "string") {
      condValue = condValue
        .split(",")
        .map((v: string) => v.trim())
        .filter((v: string) => v !== "");
    } else if (!Array.isArray(condValue)) {
      condValue = [condValue];
    }
  }

  // Handle date operators: use start_date/end_date fields per backend spec
  let startDate: string | null = condition.start_date || calculatedDateRange?.start_date || null;
  let endDate: string | null = condition.end_date || calculatedDateRange?.end_date || null;

  if (isDateOperator) {
    if (condition.operator === "on_date") {
      // on_date: keep as value, clear date ranges
      startDate = null;
      endDate = null;
    }
    // between_dates, since_date, until_date: use start_date/end_date fields directly (no value conversion needed)
  }

  // For date operators, send appropriate date fields based on operator type
  let layerCondValue: any;
  if (isDateOperator && condition.operator !== "on_date") {
    // Date range operators - send only the fields that operator needs
    if (condition.operator === "between_dates") {
      layerCondValue = {
        start_date: startDate,
        end_date: endDate,
      };
    } else if (condition.operator === "since_date") {
      layerCondValue = {
        start_date: startDate,
      };
    } else if (condition.operator === "until_date") {
      layerCondValue = {
        end_date: endDate,
      };
    }
  } else if (isNullOp) {
    // Null operators (IS NULL, IS NOT NULL) - send null value
    layerCondValue = { value: null };
  } else {
    // Non-date, non-null operators: use value
    layerCondValue = { value: condValue };
    // If time_window is selected, only include calculated dates for metric conditions
    const isMetricCondition = ["revenue_metric", "usage_metric", "kpi"].includes(condition.conditionType);
    if (calculatedDateRange && isMetricCondition) {
      layerCondValue.start_date = calculatedDateRange.start_date;
      layerCondValue.end_date = calculatedDateRange.end_date;
    }
  }

  const layerCond: LayerCondition = {
    column_ref: {
      layer_index: 0,
      column: condition.field_name || "",
    },
    operator_id: condition.operator_id,
    ...layerCondValue,
  };
  return layerCond;
};

/**
 * Builds layer conditions from a group of segment conditions
 */
export const buildLayerConditionsFromGroup = (
  group: SegmentConditionGroup
): LayerCondition[] => {
  const groupConditions: LayerCondition[] = [];

  for (const condition of group.conditions) {
    const layerCond = buildLayerCondition(condition);
    if (layerCond) {
      groupConditions.push(layerCond);
    }
  }

  return groupConditions;
};

/**
 * Builds layer filter groups from all condition groups
 */
export const buildLayerFilterGroups = (
  conditions: SegmentConditionGroup[]
): any[] => {
  const layerFilterGroups: any[] = [];

  for (const group of conditions) {
    const groupConditions = buildLayerConditionsFromGroup(group);

    if (groupConditions.length > 0 && group) {
      const groupLogic = group.operator ? String(group.operator).toUpperCase() : "AND";
      const validLogic: "AND" | "OR" = (groupLogic === "OR" ? "OR" : "AND") as "AND" | "OR";

      layerFilterGroups.push({
        logic: validLogic,
        conditions: groupConditions,
      });
    }
  }

  return layerFilterGroups;
};

/**
 * Converts segment conditions to SegmentPayload (v2.0 format)
 * Handles source layers (segments, quicklists), layer fields, and layer filters
 */
export const convertConditionsToPayload = (
  conditions: SegmentConditionGroup[],
  includeLimit: boolean = true
): SegmentPayload => {
  const sourceLayers: SourceLayer[] = [
    {
      source_type: "subscribers",
    },
  ];

  const addedSegments = new Set<number>();
  const addedQuicklists = new Set<number>();
  let currentLayerIndex = 1;

  // First pass: add segment and quicklist layers
  for (const group of conditions) {
    for (const condition of group.conditions) {
      if (condition.conditionType === "segment" && condition.segment_id) {
        if (!addedSegments.has(condition.segment_id)) {
          sourceLayers.push({
            source_type: "segment",
            segment_id: condition.segment_id,
            join_config: {
              join_type: "INNER JOIN",
              left_column_ref: { layer_index: 0, column: "customer_id" },
              right_column: "customer_id",
            },
          });
          addedSegments.add(condition.segment_id);
          currentLayerIndex++;
        }
      } else if (condition.conditionType === "list" && condition.list_id) {
        if (!addedQuicklists.has(condition.list_id)) {
          sourceLayers.push({
            source_type: "quicklist",
            quicklist_id: condition.list_id,
            join_config: {
              join_type: "INNER JOIN",
              left_column_ref: { layer_index: 0, column: "msisdn" },
              right_column: "msisdn",
            },
          });
          addedQuicklists.add(condition.list_id);
          currentLayerIndex++;
        }
      }
    }
  }

  // Check if we need layer_fields
  const hasSegmentsOrQuicklists = sourceLayers.some(
    (layer) =>
      layer.source_type === "segment" || layer.source_type === "quicklist"
  );

  const STANDARD_LAYER_FIELDS: LayerColumnRef[] = [
    { layer_index: 0, column: "msisdn" },
    { layer_index: 0, column: "customer_id" },
    { layer_index: 0, column: "first_name" },
    { layer_index: 0, column: "last_name" },
    { layer_index: 0, column: "customer_type" },
    { layer_index: 0, column: "status" },
    { layer_index: 0, column: "activation_date" },
    { layer_index: 0, column: "city" },
  ];

  const layerFields = hasSegmentsOrQuicklists ? STANDARD_LAYER_FIELDS : undefined;

  // Build layer_filters
  const layerFilterGroups = buildLayerFilterGroups(conditions);

  // Determine top-level logic
  let topLevelLogic: "AND" | "OR" = "AND";
  if (conditions && conditions.length > 0 && conditions[0]) {
    const groupOp = conditions[0].groupOperator ? String(conditions[0].groupOperator).toUpperCase() : "AND";
    topLevelLogic = (groupOp === "OR" ? "OR" : "AND") as "AND" | "OR";
  }

  const payload: SegmentPayload = {
    source_layers: sourceLayers,
    layer_fields: layerFields,
    layer_filters:
      layerFilterGroups.length > 0
        ? {
            logic: topLevelLogic,
            groups: layerFilterGroups,
          }
        : undefined,
  };

  if (includeLimit) {
    (payload as any).limit = 100;
  }

  return payload;
};
