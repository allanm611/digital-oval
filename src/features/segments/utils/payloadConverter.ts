import { SegmentCondition, SegmentConditionGroup, SegmentPayload } from "../types/segment";
import { segmentService } from "../services/segmentService";

const normalizeOperatorLabel = (label: string): string => {
  return label.toLowerCase().replace(/\s+/g, "_");
};

export async function convertPayloadToConditions(
  payload: SegmentPayload,
  fieldSelectorConfig: any[] = [],
): Promise<SegmentConditionGroup[]> {
  if (!payload.layer_filters || !payload.layer_filters.groups) {
    return [];
  }

  let config = fieldSelectorConfig;
  if (config.length === 0) {
    try {
      const response = await segmentService.getSegmentationFields(true);
      if (
        response &&
        response.success &&
        response.data &&
        response.data.length > 0
      ) {
        config = response.data[0]?.field_selector_config || [];
      }
    } catch (err) {
      // Silently handle - field matching will use fallback logic
    }
  }

  // Flatten all fields from fieldSelectorConfig into a searchable map
  const allBackendFields: Record<string, any> = {};
  for (const category of config) {
    // Handle subcategories (for hierarchical categories like Customer 360)
    if (category.sub_categories && Array.isArray(category.sub_categories)) {
      for (const subcategory of category.sub_categories) {
        if (subcategory.fields && Array.isArray(subcategory.fields)) {
          for (const field of subcategory.fields) {
            // Map by both field_name and field_value (with "p_" prefix handling)
            allBackendFields[field.field_name] = field;
            allBackendFields[field.field_value] = field;
            // Also add with "p_" prefix if not already there
            if (field.field_value && field.field_value.startsWith("p_")) {
              const unprefixed = field.field_value.slice(2);
              allBackendFields[unprefixed] = field;
            }
            // Store parent category and subcategory info
            field.category = category.id;
            field.subcategory_id = subcategory.id;
            field.subcategory_name = subcategory.name;
          }
        }
      }
    }
    // Handle direct fields (no subcategories)
    if (category.fields && Array.isArray(category.fields)) {
      for (const field of category.fields) {
        // Map by both field_name and field_value (with "p_" prefix handling)
        allBackendFields[field.field_name] = field;
        allBackendFields[field.field_value] = field;
        // Also add with "p_" prefix if not already there
        if (field.field_value && field.field_value.startsWith("p_")) {
          const unprefixed = field.field_value.slice(2);
          allBackendFields[unprefixed] = field;
        }
        // Map by category ID for later reference
        field.category = category.id;
      }
    }
  }

  const conditions: SegmentConditionGroup[] = [];

  for (const group of payload.layer_filters.groups) {
    const conditionGroup: SegmentConditionGroup = {
      id: Math.random().toString(36).substr(2, 9),
      operator: group.logic === "OR" ? "OR" : "AND",
      groupOperator: "AND",
      conditions: [],
    };

    for (const layerCond of group.conditions || []) {
      const fieldName = layerCond.column_ref?.column || "";
      const operatorId = layerCond.operator_id;

      // Look up field metadata from backend fields - handles both field_name and field_value
      let matchedField = allBackendFields[fieldName];

      // If not found, try with "p_" prefix (in case field_value format)
      if (!matchedField && !fieldName.startsWith("p_")) {
        matchedField = allBackendFields[`p_${fieldName}`];
      }

      // Map operator_id to operator label from matched field's operators array
      let operatorLabel = "equals";
      let operatorFromField = null;

      if (
        matchedField &&
        matchedField.operators &&
        Array.isArray(matchedField.operators)
      ) {
        operatorFromField = matchedField.operators.find(
          (op: any) => op.id === operatorId,
        );
        if (operatorFromField) {
          // Normalize the label from backend (convert spaces to underscores)
          operatorLabel = normalizeOperatorLabel(
            operatorFromField.label || "equals",
          );
        }
      } else {
        // Fallback to hardcoded mapping if field operators not available
        // These IDs match the backend's actual operator IDs
        switch (operatorId) {
          case 1:
            operatorLabel = "equals";
            break;
          case 2:
            operatorLabel = "not equals";
            break;
          case 3:
            operatorLabel = "greater than";
            break;
          case 4:
            operatorLabel = "less than";
            break;
          case 5:
            operatorLabel = "greater than or equal";
            break;
          case 6:
            operatorLabel = "less than or equal";
            break;
          case 7:
            operatorLabel = "in list";
            break;
          case 8:
            operatorLabel = "not in list";
            break;
          case 12:
            operatorLabel = "between";
            break;
          case 13:
            operatorLabel = "is empty";
            break;
          case 14:
            operatorLabel = "is not empty";
            break;
          default:
            operatorLabel = "equals";
        }
      }

      // Build the condition with all matched field metadata
      // Infer conditionType from matched field's category, or fallback to field name pattern
      let inferredConditionType = "customer_identity"; // default

      // First, try to infer from matchedField category
      if (matchedField?.category) {
        const categoryId = matchedField.category;
        for (const cat of config) {
          if (cat.id === categoryId) {
            const catName = (cat.name || "").toLowerCase();
            if (catName.includes("revenue")) {
              inferredConditionType = "revenue_metric";
            } else if (catName.includes("usage")) {
              inferredConditionType = "usage_metric";
            } else if (catName.includes("kpi")) {
              inferredConditionType = "kpi";
            }
            break;
          }
        }
      } else {
        // Fallback: infer from field name pattern if field not found in config
        const fieldNameLower = fieldName.toLowerCase();
        if (
          fieldNameLower.includes("revenue") ||
          fieldNameLower.includes("transaction_amount") ||
          fieldNameLower.includes("total_value")
        ) {
          inferredConditionType = "revenue_metric";
        } else if (
          fieldNameLower.includes("usage") ||
          fieldNameLower.includes("total_sms") ||
          fieldNameLower.includes("total_call") ||
          fieldNameLower.includes("total_data")
        ) {
          inferredConditionType = "usage_metric";
        } else if (fieldNameLower.includes("kpi")) {
          inferredConditionType = "kpi";
        }
        // Otherwise remains "customer_identity"
      }

      const condition: SegmentCondition = {
        id: Math.random().toString(36).substr(2, 9),
        conditionType: inferredConditionType,
        field_name: matchedField?.field_name || fieldName,
        // Store the actual field_value from the matched field (this is what SegmentConditionsBuilder looks up)
        field:
          matchedField?.field_value ||
          (fieldName.startsWith("p_") ? fieldName : `p_${fieldName}`),
        field_id: matchedField?.id,
        category: matchedField?.category,
        subcategory_id: matchedField?.subcategory_id,
        subcategory_name: matchedField?.subcategory_name,
        operator_id: operatorId,
        operator: operatorLabel,
        value: layerCond.value,
        start_date: layerCond.start_date,
        end_date: layerCond.end_date,
        type: matchedField?.field_type || "string",
        time_window: layerCond.time_window,
        time_window_id: layerCond.time_window_id,
        date_operator_id: layerCond.date_operator_id,
        // For KPI/metric conditions, set kpi_name from field_name so MetricsConditionRow renders properly
        kpi_name:
          inferredConditionType === "revenue_metric" ||
          inferredConditionType === "usage_metric" ||
          inferredConditionType === "kpi"
            ? matchedField?.field_name || fieldName
            : undefined,
      };

      conditionGroup.conditions.push(condition);
    }

    if (conditionGroup.conditions.length > 0) {
      conditions.push(conditionGroup);
    } else {
      // Even if no customer_identity conditions, create a group for segment/quicklist conditions
      // This ensures segment/quicklist are in the same group context
    }
  }

  // Handle segment/quicklist layers - ADD TO THE LAST GROUP (or first group if no groups exist)
  if (payload.source_layers && payload.source_layers.length > 1) {
    const targetGroup =
      conditions.length > 0 ? conditions[conditions.length - 1] : null;

    for (let i = 1; i < payload.source_layers.length; i++) {
      const layer = payload.source_layers[i];

      if (layer.source_type === "segment" && layer.segment_id) {
        const segmentCondition = {
          id: Math.random().toString(36).substr(2, 9),
          conditionType: "segment",
          segment_id: Number(layer.segment_id),
          segment_name: `Segment ${layer.segment_id}`, // Name will be fetched from backend
          operator: "in list",
          operator_id: 7, // IN operator (backend ID)
          value: "",
          type: "string",
        };

        if (targetGroup) {
          // Add to existing group
          targetGroup.conditions.push(segmentCondition);
        } else {
          // Create a new group with just the segment condition
          const layerGroup: SegmentConditionGroup = {
            id: Math.random().toString(36).substr(2, 9),
            operator: "AND",
            groupOperator: "AND",
            conditions: [segmentCondition],
          };
          conditions.push(layerGroup);
        }
      } else if (layer.source_type === "quicklist" && layer.quicklist_id) {
        const quicklistCondition = {
          id: Math.random().toString(36).substr(2, 9),
          conditionType: "list",
          list_id: Number(layer.quicklist_id),
          list_name: `QuickList ${layer.quicklist_id}`, // Name will be fetched from backend
          operator: "in list",
          operator_id: 7, // IN operator (backend ID)
          value: "",
          type: "string",
        };

        if (targetGroup) {
          // Add to existing group
          targetGroup.conditions.push(quicklistCondition);
        } else {
          // Create a new group with just the quicklist condition
          const layerGroup: SegmentConditionGroup = {
            id: Math.random().toString(36).substr(2, 9),
            operator: "AND",
            groupOperator: "AND",
            conditions: [quicklistCondition],
          };
          conditions.push(layerGroup);
        }
      }
    }
  }

  return conditions;
}
