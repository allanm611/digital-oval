import type { SegmentCondition, SegmentConditionGroup, LayerCondition, SourceLayer, LayerColumnRef, SegmentPayload } from "../types/segment";
import { getDateRangeForTimeWindow } from "../../../shared/utils/operatorMapper";

/**
 * Checks if a condition is a profile-type condition (has field_id and operator_id, or is a segment/list)
 */
export const isProfileTypeCondition = (condition: SegmentCondition): boolean => {
  if (!condition || !condition.conditionType) return false;

  // Segment and list conditions don't need field_id/operator_id
  if (condition.conditionType === "segment" && condition.segment_id) return true;
  if (condition.conditionType === "list" && condition.list_id) return true;

  // Other profile-type conditions require field_id and operator_id
  return (
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

  // Handle segment conditions
  if (condition.conditionType === "segment" && condition.segment_id) {
    return {
      column_ref: {
        layer_index: 0,
        column: "segment_id",
      },
      operator_id: 1, // "equals" operator
      value: condition.segment_id,
    };
  }

  // Handle list conditions
  if (condition.conditionType === "list" && condition.list_id) {
    return {
      column_ref: {
        layer_index: 0,
        column: "list_id",
      },
      operator_id: 1, // "equals" operator
      value: condition.list_id,
    };
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

  // Check if using custom time window with a date operator
  const isCustomDateOperator = condition.time_window === "custom" && condition.date_operator_id;

  if (!hasValue && !hasDateRange && !isNullOp && !isCustomDateOperator) {
    return null;
  }

  let condValue: string | number | (string | number)[] | undefined =
    condition.value as string | number | (string | number)[] | undefined;

  // Handle "between" operator - combine value and value_end into array
  if (condition.operator_id === 9 && condValue !== undefined && condition.value_end !== undefined) {
    condValue = [condValue, condition.value_end];
  }
  // Handle IN and NOT IN operators - convert to array
  else if (
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

  const isMetricCondition = ["revenue_metric", "usage_metric", "kpi"].includes(condition.conditionType);

  // For date operators, send appropriate date fields based on operator type
  let layerCondValue: any;
  if (isDateOperator) {
    // Date operators: structure depends on operator type
    if (condition.operator === "on_date") {
      layerCondValue = { start_date: startDate };
    } else if (condition.operator === "between_dates") {
      layerCondValue = { start_date: startDate, end_date: endDate };
    } else if (condition.operator === "since_date") {
      layerCondValue = { start_date: startDate };
    } else if (condition.operator === "until_date") {
      layerCondValue = { end_date: endDate };
    }

    // For metric conditions, also include the numeric value
    if (isMetricCondition) {
      layerCondValue.value = condValue;
    }
  } else if (isCustomDateOperator) {
    // Handle custom time window with date operator selection
    if (condition.date_operator === "on") {
      layerCondValue = { start_date: startDate };
    } else if (condition.date_operator === "between") {
      layerCondValue = { start_date: startDate, end_date: endDate };
    } else if (condition.date_operator === "since") {
      layerCondValue = { start_date: startDate };
    } else if (condition.date_operator === "until") {
      layerCondValue = { end_date: endDate };
    } else {
      layerCondValue = { value: condValue };
    }

    // Include the date operator ID for custom selections
    if (condition.date_operator_id) {
      layerCondValue.date_operator_id = condition.date_operator_id;
    }

    // Include time_window_id for custom date operators
    if (condition.time_window_id) {
      layerCondValue.time_window_id = condition.time_window_id;
    }

    // For metric conditions with custom date operator, include the value
    if (isMetricCondition) {
      layerCondValue.value = condValue;
    }
  } else if (isNullOp) {
    // Null operators (IS NULL, IS NOT NULL) - send null value
    layerCondValue = { value: null };
  } else {
    // Non-date, non-null operators: use value
    layerCondValue = { value: condValue };
    // If time_window is selected, only include calculated dates for metric conditions
    if (calculatedDateRange && isMetricCondition) {
      layerCondValue.start_date = calculatedDateRange.start_date;
      layerCondValue.end_date = calculatedDateRange.end_date;
    }
  }

  // Always include time_window_id and time_window when it's selected (for last_7_days, last_30_days, last_90_days, current, or custom)
  if (condition.time_window_id && condition.time_window_id > 0) {
    layerCondValue.time_window_id = condition.time_window_id;
    if (condition.time_window) {
      layerCondValue.time_window = condition.time_window;
    }
  }

  // Include start_time and end_time if provided
  if (condition.start_time) {
    layerCondValue.start_time = condition.start_time;
  }
  if (condition.end_time) {
    layerCondValue.end_time = condition.end_time;
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

  for (let i = 0; i < conditions.length; i++) {
    const group = conditions[i];
    const groupConditions = buildLayerConditionsFromGroup(group);

    if (groupConditions.length > 0 && group) {
      const groupLogic = group.operator ? String(group.operator).toUpperCase() : "AND";
      const validLogic: "AND" | "OR" = (groupLogic === "OR" ? "OR" : "AND") as "AND" | "OR";

      const filterGroup: any = {
        logic: validLogic,
        conditions: groupConditions,
      };

      // If this group has a groupOperator (logic to connect to next group), include it
      if (group.groupOperator && i < conditions.length - 1) {
        const nextGroupLogic = String(group.groupOperator).toUpperCase();
        filterGroup.group_logic = (nextGroupLogic === "OR" ? "OR" : "AND") as "AND" | "OR";
      }

      layerFilterGroups.push(filterGroup);
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
  // const sourceLayers: SourceLayer[] = [
  //   {
  //     source_type: "subscribers",
  //   },
  // ];

  // const addedSegments = new Set<number>();
  // const addedQuicklists = new Set<number>();
  // let currentLayerIndex = 1;

  // // First pass: add segment and quicklist layers
  // for (const group of conditions) {
  //   for (const condition of group.conditions) {
  //     if (condition.conditionType === "segment" && condition.segment_id) {
  //       if (!addedSegments.has(condition.segment_id)) {
  //         sourceLayers.push({
  //           source_type: "segment",
  //           segment_id: condition.segment_id,
  //           join_config: {
  //             join_type: "INNER JOIN",
  //             left_column_ref: { layer_index: 0, column: "customer_id" },
  //             right_column: "customer_id",
  //           },
  //         });
  //         addedSegments.add(condition.segment_id);
  //         currentLayerIndex++;
  //       }
  //     } else if (condition.conditionType === "list" && condition.list_id) {
  //       if (!addedQuicklists.has(condition.list_id)) {
  //         sourceLayers.push({
  //           source_type: "quicklist",
  //           quicklist_id: condition.list_id,
  //           join_config: {
  //             join_type: "INNER JOIN",
  //             left_column_ref: { layer_index: 0, column: "msisdn" },
  //             right_column: "msisdn",
  //           },
  //         });
  //         addedQuicklists.add(condition.list_id);
  //         currentLayerIndex++;
  //       }
  //     }
  //   }
  // }

  // // Check if we need layer_fields
  // const hasSegmentsOrQuicklists = sourceLayers.some(
  //   (layer) =>
  //     layer.source_type === "segment" || layer.source_type === "quicklist"
  // );

  // const STANDARD_LAYER_FIELDS: LayerColumnRef[] = [
  //   { layer_index: 0, column: "msisdn" },
  //   { layer_index: 0, column: "customer_id" },
  //   { layer_index: 0, column: "first_name" },
  //   { layer_index: 0, column: "last_name" },
  //   { layer_index: 0, column: "customer_type" },
  //   { layer_index: 0, column: "status" },
  //   { layer_index: 0, column: "activation_date" },
  //   { layer_index: 0, column: "city" },
  // ];

  // const layerFields = hasSegmentsOrQuicklists ? STANDARD_LAYER_FIELDS : undefined;

  // Build layer_filters
  const layerFilterGroups = buildLayerFilterGroups(conditions);

  const payload: SegmentPayload = {
    // source_layers: sourceLayers,
    // layer_fields: layerFields,
    layer_filters:
      layerFilterGroups.length > 0
        ? {
            groups: layerFilterGroups,
          }
        : undefined,
  };

  if (includeLimit) {
    (payload as any).limit = 100;
  }

  return payload;
};
