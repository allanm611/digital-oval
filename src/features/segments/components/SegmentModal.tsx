import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X, Plus } from "lucide-react";
import {
  Segment,
  CreateSegmentRequest,
  SegmentCondition,
  SegmentConditionGroup,
  SegmentPayload,
} from "../types/segment";
import SegmentConditionsBuilder from "./SegmentConditionsBuilder";
import { segmentService } from "../services/segmentService";
import {
  segmentTypeService,
  SegmentType,
} from "../services/segmentTypeService";
import { color, tw, zIndex } from "../../../shared/utils/utils";
import MultiCategorySelector from "../../../shared/components/MultiCategorySelector";
import TypeSelector from "../../../shared/components/TypeSelector";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import Input from "../../../shared/components/ui/Input";
import CreateCategoryModal from "../../../shared/components/CreateCategoryModal";
import CreateSegmentTypeModal from "./CreateSegmentTypeModal";
import { customerIdentityService } from "../../customerIdentity/services/customerIdentityService";
import { CustomerIdentityField } from "../../customerIdentity/types/customerIdentity";
import { convertConditionsToPayload } from "../utils/conditionPayloadBuilder";

interface SegmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (segment: Segment) => void;
  segment?: Segment | null;
}

export default function SegmentModal({
  isOpen,
  onClose,
  onSave,
  segment,
}: SegmentModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    tags: [] as string[],
    conditions: [] as SegmentConditionGroup[],
    segment_type_id: undefined as number | undefined,
    category: undefined as string | number | undefined,
    customer_identity_field_mapping: undefined as string | undefined,
    unique_identifier: undefined as string | undefined,
  });
  const [tagInput, setTagInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [previewCount, setPreviewCount] = useState<number | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [previewQuery, setPreviewQuery] = useState<string | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingQueries, setPendingQueries] = useState<{
    segment_query: string;
    count_query: string;
    payload?: SegmentPayload;
  } | null>(null);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<
    (string | number)[]
  >([]);
  const [fieldErrors, setFieldErrors] = useState<{
    description?: string;
    conditions?: string;
    segment_type_id?: string;
    unique_identifier?: string;
  }>({});
  const [existingQuery, setExistingQuery] = useState<string | null>(null);
  const [existingCountQuery, setExistingCountQuery] = useState<string | null>(
    null,
  );
  const [fieldSelectorConfig, setFieldSelectorConfig] = useState<any[]>([]);
  const [segmentTypes, setSegmentTypes] = useState<SegmentType[]>([]);
  const [loadingTypes, setLoadingTypes] = useState(false);
  const [categoryRefreshTrigger, setCategoryRefreshTrigger] = useState(0);
  const [showCreateCatalogModal, setShowCreateCatalogModal] = useState(false);
  const [showCreateTypeModal, setShowCreateTypeModal] = useState(false);
  const [customerIdentityFields, setCustomerIdentityFields] = useState<
    CustomerIdentityField[]
  >([]);
  const [isLoadingIdentityFields, setIsLoadingIdentityFields] = useState(false);
  const isUserInteractionRef = useRef(false);

  // Load field selector config once on component mount
  useEffect(() => {
    const loadFieldSelectorConfig = async () => {
      try {
        const response = await segmentService.getSegmentationFields(true);
        if (
          response &&
          response.success &&
          response.data &&
          response.data.length > 0
        ) {
          const config = response.data[0]?.field_selector_config || [];
          setFieldSelectorConfig(config);
        }
      } catch (err) {
        // Silently handle - fields will be fetched on-demand if needed
      }
    };
    loadFieldSelectorConfig();
  }, []);

  // Load segment types on component mount
  useEffect(() => {
    const loadSegmentTypes = async () => {
      setLoadingTypes(true);
      try {
        const response = await segmentTypeService.getAllSegmentTypes();
        if (response.success && response.data) {
          setSegmentTypes(response.data);
        }
      } catch (err) {
        console.error("Failed to load segment types:", err);
        // Silently handle - continue without types
      } finally {
        setLoadingTypes(false);
      }
    };
    loadSegmentTypes();
  }, []);

  // Load customer identity fields when modal opens
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const loadCustomerIdentityFields = async () => {
      try {
        setIsLoadingIdentityFields(true);
        const fields =
          await customerIdentityService.getCustomerIdentityFields(true);
        setCustomerIdentityFields(fields);
      } catch (err) {
        console.error("Failed to load customer identity fields:", err);
        setCustomerIdentityFields([]);
      } finally {
        setIsLoadingIdentityFields(false);
      }
    };

    loadCustomerIdentityFields();
  }, [isOpen]);

  // Update formData.category when selectedCategoryIds changes (use first one)
  // This only runs when user manually changes the selection
  useEffect(() => {
    if (!isOpen) return;

    // Skip if this is from initialization, not user interaction
    if (!isUserInteractionRef.current) return;

    const firstCategoryId =
      selectedCategoryIds.length > 0 ? selectedCategoryIds[0] : undefined;
    if (formData.category !== firstCategoryId) {
      setFormData((prev) => ({
        ...prev,
        category: firstCategoryId, // Send only first to backend
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategoryIds, isOpen]);

  useEffect(() => {
    const loadSegmentData = async () => {
      if (isOpen) {
        isUserInteractionRef.current = false; // Mark as initialization
        // Trigger category refresh to ensure categories are loaded
        setCategoryRefreshTrigger((prev) => prev + 1);

        if (segment && segment.id) {
          try {
            // Fetch full segment data from backend to ensure we have the definition
            const fullSegmentResponse = await segmentService.getSegmentById(
              segment.id,
            );

            const fullSegment =
              fullSegmentResponse && "data" in fullSegmentResponse
                ? fullSegmentResponse.data
                : fullSegmentResponse;

            // Convert the stored definition/payload back to UI conditions
            // Keep category as string since backend returns category IDs as strings
            const category = fullSegment.category
              ? String(fullSegment.category)
              : undefined;

            // Fetch category details if category ID exists (for display purposes)
            if (category) {
              try {
                await segmentService.getSegmentCategoryById(category);
                // Category was successfully fetched - MultiCategorySelector will display it
              } catch (err) {
                console.warn("Failed to fetch category details:", err);
                // Continue anyway - MultiCategorySelector may still display it
              }
            }

            let conditions: SegmentConditionGroup[] = [];

            // Try to get conditions from the definition (SegmentPayload)
            if (fullSegment.definition) {
              conditions = await convertPayloadToConditions(
                fullSegment.definition,
              );
            }

            // Determine segment_type_id from backend response
            let typeId: number | undefined;
            if ((fullSegment as any).segment_type_id) {
              typeId = Number((fullSegment as any).segment_type_id);
            } else if ((fullSegment as any).type_id) {
              typeId = Number((fullSegment as any).type_id);
            } else if (fullSegment.type && segmentTypes?.length > 0) {
              // Try to find the type ID by looking up the name
              const foundType = segmentTypes.find(
                (type) => type.name === fullSegment.type,
              );
              typeId = foundType?.id;
            }

            setFormData({
              name: fullSegment.name,
              description: fullSegment.description || "",
              tags: (fullSegment.tags || []).map((tag: any) =>
                typeof tag === "string" ? tag : tag?.name || String(tag),
              ),
              conditions: conditions,
              segment_type_id: typeId,
              category,
              customer_identity_field_mapping: (fullSegment as any)
                .customer_identity_field_mapping,
              unique_identifier: (fullSegment as any).unique_identifier,
            });
            // Store existing queries (not displayed in edit mode, but kept for reference)
            setExistingQuery(fullSegment.query || null);
            setExistingCountQuery(fullSegment.count_query || null);
            // Initialize selectedCategoryIds from segment category
            setSelectedCategoryIds(category ? [category] : []);
          } catch (err) {
            console.error("Failed to load segment:", err);
            setError("Failed to load segment data");
          }
        } else {
          setFormData({
            name: "",
            description: "",
            tags: [],
            segment_type_id: undefined,
            conditions: [],
            category: undefined,
            customer_identity_field_mapping: undefined,
            unique_identifier: undefined,
          });
          // Reset selectedCategoryIds for new segment
          setSelectedCategoryIds([]);
          // Clear existing queries for new segment
          setExistingQuery(null);
          setExistingCountQuery(null);
        }
        setFieldErrors({});
        // Reset modal states
        setShowPreviewModal(false);
        setShowConfirmModal(false);
        setPendingQueries(null);
        setPreviewQuery(null);

        // Allow user interactions after initialization
        setTimeout(() => {
          isUserInteractionRef.current = true;
        }, 0);
      } else {
        // Clear state when closing to prevent stale data from showing
        setFormData({
          name: "",
          description: "",
          tags: [],
          segment_type_id: undefined,
          conditions: [],
          category: undefined,
          customer_identity_field_mapping: undefined,
          unique_identifier: undefined,
        });
        setFieldErrors({});
        setError("");
      }
    };

    loadSegmentData();
  }, [isOpen, segment]);

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && tagInput.trim()) {
      e.preventDefault();
      const newTag = tagInput.trim().toLowerCase();
      if (!formData.tags.includes(newTag)) {
        const updatedTags = [...formData.tags, newTag];
        setFormData((prev) => ({
          ...prev,
          tags: updatedTags,
        }));
      }
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const updatedTags = formData.tags.filter((tag) => tag !== tagToRemove);
    setFormData((prev) => ({
      ...prev,
      tags: updatedTags,
    }));
  };

  // Convert operator label from backend format (spaces) to UI format (underscores)
  const normalizeOperatorLabel = (label: string): string => {
    if (!label) return "equals";
    // Convert spaces to underscores and lowercase
    return label.toLowerCase().replace(/\s+/g, "_");
  };

  // Convert SegmentPayload back to UI SegmentConditionGroup format for editing
  const convertPayloadToConditions = async (
    payload: SegmentPayload,
  ): Promise<SegmentConditionGroup[]> => {
    if (!payload.layer_filters || !payload.layer_filters.groups) {
      return [];
    }

    // Use the fieldSelectorConfig from state, or fetch if not available
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
          if (fieldNameLower.includes("revenue") || fieldNameLower.includes("transaction_amount") || fieldNameLower.includes("total_value")) {
            inferredConditionType = "revenue_metric";
          } else if (fieldNameLower.includes("usage") || fieldNameLower.includes("total_sms") || fieldNameLower.includes("total_call") || fieldNameLower.includes("total_data")) {
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
          // For KPI/metric conditions, set kpi_name from field_name so MetricsConditionRow renders properly
          kpi_name: (inferredConditionType === "revenue_metric" || inferredConditionType === "usage_metric" || inferredConditionType === "kpi")
            ? (matchedField?.field_name || fieldName)
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
  };

  // TODO: Validate segment - temporarily disabled
  // const validateSegmentNotSelectStar = async (
  //   segmentId: number,
  // ): Promise<{ valid: boolean; error?: string }> => {
  //   try {
  //     const response = await segmentService.getSegmentById(segmentId);
  //     if (response && "data" in response) {
  //       const segment = response.data;
  //       if (segment.query && segment.query.includes("SELECT *")) {
  //         return {
  //           valid: false,
  //           error: "This segment uses SELECT * and cannot be used as a base layer",
  //         };
  //       }
  //     }
  //     return { valid: true };
  //   } catch (err) {
  //     return {
  //       valid: false,
  //       error: "Failed to validate segment",
  //     };
  //   }
  // };

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


  const handlePreview = async () => {
    if (formData.conditions.length === 0) {
      setPreviewCount(0);
      setPreviewQuery(null);
      return;
    }

    setIsPreviewLoading(true);
    setError("");

    try {
      const payload = convertConditionsToPayload(formData.conditions);

      // Call the query generation preview API
      const response =
        await segmentService.generateSegmentQueryPreview(payload);

      if (response.success && response.data) {
        setPreviewQuery(response.data.segment_query);
        setShowPreviewModal(true);
        setPreviewCount(null);
        setError("");
      } else {
        throw new Error("Failed to generate query preview");
      }
    } catch (err) {
      console.error("Preview failed:", err);
      setError((err as Error).message || "Failed to preview segment");
      setPreviewCount(null);
      setPreviewQuery(null);
    } finally {
      setIsPreviewLoading(false);
    }
  };

  /**
   * Generate a unique code from segment name
   */
  const generateSegmentCode = (name: string): string => {
    return name
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .substring(0, 50); // Limit to 50 chars
  };

  /**
   * Generate SQL query from conditions (convert to v2.0 SegmentPayload)
   */
  const generateQueryFromConditions = async (): Promise<{
    segment_query: string;
    count_query: string;
    payload: SegmentPayload;
  } | null> => {
    if (formData.conditions.length === 0) {
      return null;
    }

    try {
      // Convert SegmentConditionGroup to SegmentPayload (v2.0 format) using shared utility
      const payload = convertConditionsToPayload(formData.conditions, false);

      // Keep a copy of the payload for storage (without limit)
      const payloadForStorage = { ...payload };

      // Remove the limit for production query
      delete payload.limit;

      // Call the query generation API
      const response =
        await segmentService.generateSegmentQueryPreview(payload);

      if (response.success && response.data) {
        return {
          segment_query: response.data.segment_query,
          count_query: response.data.count_query,
          payload: payloadForStorage,
        };
      } else {
        throw new Error("Failed to generate query");
      }
    } catch (err) {
      throw new Error(
        (err as Error).message || "Failed to generate query from conditions",
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setFieldErrors({});

    if (!formData.name.trim()) {
      setError("Segment name is required");
      return;
    }

    if (!formData.description.trim()) {
      setFieldErrors({ description: "Description is required" });
      return;
    }

    if (!formData.segment_type_id) {
      setFieldErrors((prev) => ({
        ...prev,
        segment_type_id: "Segment type is required",
      }));
      return;
    }

    if (!formData.unique_identifier) {
      setFieldErrors((prev) => ({
        ...prev,
        unique_identifier: "Customer identity field is required",
      }));
      return;
    }

    if (formData.conditions.length === 0) {
      setFieldErrors((prev) => ({
        ...prev,
        conditions: "Please add at least one condition",
      }));
      return;
    } else {
      setFieldErrors((prev) => ({ ...prev, conditions: undefined }));
    }

    setIsLoading(true);
    try {
      // Generate SQL query from conditions
      const queries = await generateQueryFromConditions();

      if (!queries) {
        setError("Failed to generate query from conditions");
        setIsLoading(false);
        return;
      }

      // Store queries and show confirmation modal
      setPendingQueries(queries);
      setPreviewQuery(queries.segment_query);
      setShowConfirmModal(true);
      setIsLoading(false);
    } catch (err) {
      console.error("Failed to generate query:", err);
      setError((err as Error).message || "Failed to generate query");
      setIsLoading(false);
    }
  };

  const handleConfirmCreate = async () => {
    if (!pendingQueries) return;

    setIsLoading(true);
    setShowConfirmModal(false);
    try {
      const queries = pendingQueries;
      // Generate unique code
      const code = generateSegmentCode(formData.name);

      let savedSegment: Segment;

      if (segment) {
        // Update existing segment with new query
        const segmentId = segment.id!;

        const updateResponse = await segmentService.updateSegment(segmentId, {
          name: formData.name,
          description: formData.description,
          tags: formData.tags,
          segment_type_id: formData.segment_type_id,
          category: formData.category,
          query: queries.segment_query,
          count_query: queries.count_query,
          definition: queries.payload, // Store the original payload for editing
          unique_identifier: formData.unique_identifier,
        });

        // Extract segment from response - backend returns {success: true, data: [segment]}
        const updateResult = updateResponse as
          | { success?: boolean; data?: Segment[] | Segment }
          | Segment;
        if (
          typeof updateResult === "object" &&
          "data" in updateResult &&
          Array.isArray(updateResult.data)
        ) {
          savedSegment = updateResult.data[0];
        } else if (
          typeof updateResult === "object" &&
          "data" in updateResult &&
          updateResult.data
        ) {
          savedSegment = updateResult.data as Segment;
        } else {
          savedSegment = updateResult as Segment;
        }
      } else {
        // Create new segment with query
        const createRequest: CreateSegmentRequest = {
          name: formData.name,
          code: code,
          description: formData.description,
          tags: formData.tags,
          segment_type_id: formData.segment_type_id,
          category: formData.category,
          query: queries.segment_query,
          count_query: queries.count_query,
          is_active: true,
          visibility: "private",
          definition: queries.payload, // Store the original payload for editing
          unique_identifier: formData.unique_identifier,
        };

        const createResponse =
          await segmentService.createSegment(createRequest);

        // Extract segment from response - backend returns {success: true, data: [segment]}
        const response = createResponse as
          | { success: boolean; data?: Segment[] | Segment }
          | Segment;
        if (
          typeof response === "object" &&
          "success" in response &&
          response.success &&
          Array.isArray(response.data)
        ) {
          savedSegment = response.data[0];
        } else if (
          typeof response === "object" &&
          "data" in response &&
          response.data
        ) {
          savedSegment = Array.isArray(response.data)
            ? response.data[0]
            : (response.data as Segment);
        } else {
          savedSegment = response as Segment;
        }
      }

      // Ensure savedSegment includes the name and other form data from formData
      const finalSegment = {
        ...savedSegment,
        name: savedSegment.name || formData.name,
        description: savedSegment.description || formData.description,
        tags: savedSegment.tags || formData.tags,
        category: savedSegment.category || formData.category,
      };

      // After successful create/update, call refresh to compute actual customer count
      // Use || not ?? so that 0 falls through to segment.id
      const segmentIdForRefresh = finalSegment.id || segment?.id;
      if (segmentIdForRefresh) {
        try {
          await segmentService.refreshSegment(Number(segmentIdForRefresh));
        } catch (refreshErr) {
          console.warn(
            "[SegmentModal] Segment saved but refresh failed:",
            refreshErr,
          );
        }
      } else {
      }

      onSave(finalSegment);
      setPendingQueries(null);
      onClose();
    } catch (err: unknown) {
      console.error("Failed to save segment:", err);
      const message = (err as Error).message || "Failed to save segment";
      if (message.toLowerCase().includes("description")) {
        setFieldErrors({ description: message });
      } else {
        setError(message);
      }
      setShowConfirmModal(false);
      setPendingQueries(null);
    } finally {
      setIsLoading(false);
    }
  };

  return isOpen
    ? createPortal(
        <div
          className="fixed inset-0 overflow-y-auto"
          style={{ zIndex: zIndex.modal }}
        >
          <div
            className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
            onClick={onClose}
            style={{ zIndex: zIndex.overlay }}
          />
          <div
            className="flex min-h-full items-center justify-center p-4 relative"
            style={{ zIndex: zIndex.modal }}
          >
            <div
              className={`relative bg-white ${tw.rounded} shadow-2xl w-full max-w-6xl max-h-[95vh] flex flex-col overflow-hidden`}
            >
              {/* Header */}
              <div
                className={`flex items-center justify-between p-6 border-b border-[${tw.borderDefault}] bg-gradient-to-r from-[${color.primary.accent}]/5 to-[${color.primary.accent}]/10 flex-shrink-0`}
              >
                <div>
                  <h2 className={`text-2xl font-bold ${tw.textPrimary}`}>
                    {segment ? "Edit Segment" : "Create New Segment"}
                  </h2>
                  <p className={`${tw.textSecondary} mt-1`}>
                    Define customer segments using rules and filters
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className={`p-2 hover:bg-gray-100 ${tw.rounded} transition-colors`}
                >
                  <X className="w-5 h-5 text-black" />
                </button>
              </div>

              {/* Content - Scrollable */}
              <div className="flex-1 overflow-y-auto">
                <form
                  id="segment-form"
                  onSubmit={handleSubmit}
                  className="p-6 space-y-6"
                >
                  {/* Error Message - Hidden */}

                  {/* Basic Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label
                        className={`block text-sm font-medium ${tw.textPrimary} mb-2`}
                      >
                        Segment Name *
                      </label>
                      <Input
                        value={formData.name}
                        onChange={(value) =>
                          setFormData((prev) => ({
                            ...prev,
                            name: value,
                          }))
                        }
                        placeholder="Enter segment name"
                        required
                        variant="default"
                      />
                    </div>

                    <div>
                      <label
                        className={`block text-sm font-medium ${tw.textPrimary} mb-2`}
                      >
                        Segment Catalog
                      </label>
                      <MultiCategorySelector
                        value={selectedCategoryIds}
                        onChange={(ids) => {
                          isUserInteractionRef.current = true;
                          setSelectedCategoryIds(ids);
                        }}
                        placeholder="Select catalog(s)"
                        entityType="segment"
                        refreshTrigger={categoryRefreshTrigger}
                        className="w-full"
                        allowCreate={false}
                        onCategoryCreated={(categoryId) => {
                          isUserInteractionRef.current = true;
                          setSelectedCategoryIds([categoryId]);
                          setCategoryRefreshTrigger((prev) => prev + 1);
                          setShowCreateCatalogModal(false);
                        }}
                      />
                      {/* <p className="text-xs text-gray-500 mt-1">
                        You can select multiple catalogs. Only the first one
                        will be saved to the backend.
                      </p> */}
                    </div>
                  </div>

                  <div>
                    <label
                      className={`block text-sm font-medium ${tw.textPrimary} `}
                    >
                      Map to Customer Identity Field *
                    </label>
                    <p className={`text-xs ${tw.textSecondary} mb-2`}>
                      Select which customer field this segment represents
                    </p>
                    <HeadlessSelect
                      options={customerIdentityFields.map((field) => ({
                        value: field.field_value,
                        label: field.field_name,
                      }))}
                      value={formData.unique_identifier || ""}
                      onChange={(value) => {
                        setFormData((prev) => ({
                          ...prev,
                          unique_identifier: String(value),
                          customer_identity_field_mapping: String(value),
                        }));
                        setFieldErrors((prev) => ({
                          ...prev,
                          unique_identifier: undefined,
                        }));
                      }}
                      placeholder="Select identity field..."
                      disabled={
                        isLoadingIdentityFields ||
                        customerIdentityFields.length === 0
                      }
                    />
                    {fieldErrors.unique_identifier && (
                      <p className="mt-2 text-sm text-red-600">
                        {fieldErrors.unique_identifier}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label
                        className={`block text-sm font-medium ${tw.textPrimary} mb-2`}
                      >
                        Tags
                      </label>
                      <div className="space-y-2">
                        <div className="flex">
                          <div className="flex-1">
                            <Input
                              value={tagInput}
                              onChange={(value) => {
                                setTagInput(value);

                                // Auto-add tag when comma is typed
                                if (value.includes(",")) {
                                  const tag = value.replace(",", "").trim();
                                  if (
                                    tag &&
                                    !formData.tags.includes(tag.toLowerCase())
                                  ) {
                                    const updatedTags = [
                                      ...formData.tags,
                                      tag.toLowerCase(),
                                    ];
                                    setFormData((prev) => ({
                                      ...prev,
                                      tags: updatedTags,
                                    }));
                                    setTagInput("");
                                  }
                                }
                              }}
                              onKeyDown={(e) => {
                                handleAddTag(e);
                              }}
                              placeholder="Type tags separated by commas (e.g., premium, high-value)"
                              variant="default"
                              style={{
                                borderTopRightRadius: "0",
                                borderBottomRightRadius: "0",
                              }}
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              if (tagInput.trim()) {
                                const newTag = tagInput.trim().toLowerCase();
                                if (!formData.tags.includes(newTag)) {
                                  const updatedTags = [
                                    ...formData.tags,
                                    newTag,
                                  ];
                                  setFormData((prev) => ({
                                    ...prev,
                                    tags: updatedTags,
                                  }));
                                  setTagInput("");
                                }
                              }
                            }}
                            className="px-3 py-2 text-white rounded-r-md flex items-center justify-center text-sm border-l-0 font-medium"
                            style={{
                              backgroundColor: color.primary.action,
                              borderColor: color.primary.action,
                            }}
                            title="Add tag"
                          >
                            Add
                          </button>
                        </div>
                        {formData.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {formData.tags.map((tag, index) => (
                              <span
                                key={`${tag}-${index}`}
                                className="inline-flex items-center px-3 py-1 text-sm font-medium rounded-full border"
                                style={{
                                  borderColor: color.primary.accent,
                                  color: color.primary.accent,
                                }}
                              >
                                {tag}
                                <button
                                  type="button"
                                  onClick={() => handleRemoveTag(tag)}
                                  className="ml-2 hover:opacity-80"
                                  style={{ color: color.primary.accent }}
                                >
                                  ×
                                </button>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <label
                        className={`block text-sm font-medium ${tw.textPrimary} mb-2`}
                      >
                        Segment Type *
                      </label>
                      <TypeSelector
                        value={
                          formData.segment_type_id
                            ? String(formData.segment_type_id)
                            : ""
                        }
                        onChange={(value) => {
                          setFormData((prev) => ({
                            ...prev,
                            segment_type_id: value ? Number(value) : undefined,
                          }));
                          setFieldErrors((prev) => ({
                            ...prev,
                            segment_type_id: undefined,
                          }));
                        }}
                        options={
                          segmentTypes && segmentTypes.length > 0
                            ? segmentTypes
                                .filter((type) => type.is_active !== false)
                                .map((type) => {
                                  return {
                                    value: String(type.id),
                                    label: type.name || "Unknown Type",
                                  };
                                })
                            : []
                        }
                        placeholder={
                          loadingTypes ? "Loading..." : "Select segment type"
                        }
                        disabled={
                          loadingTypes ||
                          !segmentTypes ||
                          segmentTypes.length === 0
                        }
                        allowCreate={true}
                        onCreate={() => setShowCreateTypeModal(true)}
                        error={!!fieldErrors.segment_type_id}
                      />
                      {fieldErrors.segment_type_id && (
                        <p className="mt-2 text-sm text-red-600">
                          {fieldErrors.segment_type_id}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label
                      className={`block text-sm font-medium ${tw.textPrimary} mb-2`}
                    >
                      Description *
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                      onBlur={() => {
                        if (!formData.description.trim()) {
                          setFieldErrors((prev) => ({
                            ...prev,
                            description: "Description is required",
                          }));
                        }
                      }}
                      onFocus={() =>
                        setFieldErrors((prev) => ({
                          ...prev,
                          description: undefined,
                        }))
                      }
                      placeholder="Describe this segment..."
                      rows={3}
                      className={`w-full px-4 py-3 border ${tw.rounded} text-sm focus:outline-none`}
                      style={{
                        borderColor: fieldErrors.description
                          ? "#ef4444"
                          : tw.borderDefault,
                      }}
                    />
                    {fieldErrors.description && (
                      <p className="mt-2 text-sm text-red-600">
                        {fieldErrors.description}
                      </p>
                    )}
                  </div>

                  {/* Segment Conditions - Builder now includes title and preview button */}
                  <div>
                    <div
                      className={`${tw.rounded} p-4`}
                      style={{
                        border: `1px solid ${
                          fieldErrors.conditions ? "#ef4444" : tw.borderDefault
                        }`,
                        backgroundColor: color.surface.cards,
                      }}
                    >
                      <SegmentConditionsBuilder
                        conditions={formData.conditions}
                        onChange={(conditions) =>
                          setFormData((prev) => {
                            setFieldErrors((errors) => ({
                              ...errors,
                              conditions: undefined,
                            }));
                            return { ...prev, conditions };
                          })
                        }
                        // onSegmentValidate={validateSegmentNotSelectStar}
                        onValidationError={(errorMsg) => setError(errorMsg)}
                        showPreview={true}
                      />
                    </div>
                    {fieldErrors.conditions && (
                      <p className="mt-2 text-sm text-red-600">
                        {fieldErrors.conditions}
                      </p>
                    )}
                  </div>
                </form>
              </div>

              {/* Footer - Sticky */}
              <div
                className={`flex items-center justify-end space-x-4 p-6 border-t border-[${tw.borderDefault}]  flex-shrink-0`}
              >
                <button
                  type="button"
                  onClick={onClose}
                  className={`px-6 py-2 ${tw.textSecondary} bg-white border border-[${tw.borderDefault}] ${tw.rounded} hover:bg-[${color.surface.cards}] transition-colors text-sm`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="segment-form"
                  disabled={isLoading}
                  className={`inline-flex items-center px-6 py-2 text-white ${tw.rounded} transition-colors text-sm`}
                  style={{
                    backgroundColor: isLoading
                      ? color.text.muted
                      : color.primary.action,
                  }}
                  onMouseEnter={(e) => {
                    if (!isLoading) {
                      (e.target as HTMLButtonElement).style.backgroundColor =
                        color.primary.action;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isLoading) {
                      (e.target as HTMLButtonElement).style.backgroundColor =
                        color.primary.action;
                    }
                  }}
                >
                  {isLoading
                    ? "Saving..."
                    : segment
                      ? "Update Segment"
                      : "Create Segment"}
                </button>
              </div>
            </div>

            {/* SQL Preview Modal (for Preview button) */}
            {showPreviewModal && previewQuery && (
              <div
                className="absolute inset-0 z-50 flex items-center justify-center p-4"
                style={{
                  backgroundColor: "rgba(0, 0, 0, 0.5)",
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
                        Preview of the generated SQL query (360 Profile
                        conditions only)
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
                          <h4
                            className={`text-sm font-medium ${tw.textPrimary}`}
                          >
                            Segment Query
                          </h4>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(
                              formatSQL(previewQuery),
                            );
                          }}
                          className="text-xs px-3 py-1.5 rounded transition-colors font-medium"
                          style={{
                            backgroundColor: color.surface.cards,
                            border: `1px solid ${color.border.default}`,
                            color: color.text.primary,
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.backgroundColor =
                              color.interactive.hover;
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.backgroundColor =
                              color.surface.cards;
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
              </div>
            )}

            {/* Confirmation Modal (for Create/Update Segment button) */}
            {showConfirmModal && pendingQueries && (
              <div
                className="absolute inset-0 z-50 flex items-center justify-center p-4"
                style={{
                  backgroundColor: "rgba(0, 0, 0, 0.5)",
                }}
              >
                <div
                  className={`bg-white ${tw.rounded} shadow-xl w-full max-w-md`}
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Header */}
                  <div className="p-6 pb-8">
                    <h3
                      className={`text-xl font-semibold ${tw.textPrimary} mb-2`}
                    >
                      {segment
                        ? "Confirm Segment Update"
                        : "Confirm Segment Creation"}
                    </h3>
                    <p className={`text-sm ${tw.textSecondary}`}>
                      {segment
                        ? "Are you sure you want to update this segment?"
                        : "Are you sure you want to create this segment?"}
                    </p>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-end space-x-3 px-6 pb-6">
                    <button
                      type="button"
                      onClick={() => {
                        setShowConfirmModal(false);
                        setPendingQueries(null);
                      }}
                      className={`px-5 py-2.5 ${tw.rounded} text-sm font-medium transition-colors hover:bg-gray-100`}
                      style={{
                        backgroundColor: "white",
                        border: `1px solid ${color.border.default}`,
                        color: color.text.primary,
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmCreate}
                      disabled={isLoading}
                      className={`px-5 py-2.5 text-white ${tw.rounded} text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90`}
                      style={{
                        backgroundColor: color.primary.action,
                      }}
                    >
                      {isLoading
                        ? segment
                          ? "Updating..."
                          : "Creating..."
                        : segment
                          ? "Confirm & Update"
                          : "Confirm & Create"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Create Catalog Modal */}
            <CreateCategoryModal
              isOpen={showCreateCatalogModal}
              onClose={() => setShowCreateCatalogModal(false)}
              entityType="segment"
              onCategoryCreated={(categoryId) => {
                isUserInteractionRef.current = true;
                setSelectedCategoryIds([categoryId]);
                setCategoryRefreshTrigger((prev) => prev + 1);
                setShowCreateCatalogModal(false);
              }}
            />

            {/* Create Segment Type Modal */}
            <CreateSegmentTypeModal
              isOpen={showCreateTypeModal}
              onClose={() => setShowCreateTypeModal(false)}
              onTypeCreated={(typeId) => {
                const loadSegmentTypes = async () => {
                  try {
                    const response =
                      await segmentTypeService.getAllSegmentTypes();
                    if (response.success && response.data) {
                      setSegmentTypes(response.data);
                    }
                  } catch (err) {
                    console.error("Failed to reload segment types:", err);
                  }
                };
                setFormData((prev) => ({
                  ...prev,
                  segment_type_id: typeId,
                }));
                loadSegmentTypes();
                setShowCreateTypeModal(false);
              }}
            />
          </div>
        </div>,
        document.body,
      )
    : null;
}
