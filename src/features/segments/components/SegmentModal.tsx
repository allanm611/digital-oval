import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import {
  Segment,
  CreateSegmentRequest,
  SegmentConditionGroup,
} from "../types/segment";
import SegmentConditionsBuilder from "./SegmentConditionsBuilder";
import { segmentService } from "../services/segmentService";
import { color, tw, zIndex } from "../../../shared/utils/utils";
import MultiCategorySelector from "../../../shared/components/MultiCategorySelector";

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
    type: "dynamic",
    category: undefined as number | undefined,
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
  } | null>(null);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);
  const [fieldErrors, setFieldErrors] = useState<{
    description?: string;
    conditions?: string;
  }>({});
  const isUserInteractionRef = useRef(false);

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

        if (segment) {
          // NOTE: With the new implementation, segments are created with SQL queries directly
          // We cannot reconstruct UI conditions from the SQL query
          // When editing, user will need to rebuild conditions from scratch
          const category = segment.category ?? undefined;
          setFormData({
            name: segment.name,
            description: segment.description || "",
            tags: segment.tags || [],
            conditions: [], // Cannot reconstruct from query - user must rebuild
            type: "dynamic",
            category,
          });
          // Initialize selectedCategoryIds from segment category
          setSelectedCategoryIds(category ? [category] : []);
        } else {
          setFormData({
            name: "",
            description: "",
            tags: [],
            type: "dynamic",
            conditions: [],
            category: undefined,
          });
          // Reset selectedCategoryIds for new segment
          setSelectedCategoryIds([]);
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
      // Extract all unique field IDs from conditions
      const fieldIds = new Set<number>();
      const queryConditions: Array<{
        field_id: number;
        operator_id: number;
        value: string | number | string[];
      }> = [];

      // Process each condition group - ONLY 360_profile conditions
      for (const group of formData.conditions) {
        for (const condition of group.conditions) {
          // Only process 360_profile conditions
          if (condition.conditionType !== "360_profile") {
            continue; // Skip segment and list conditions
          }

          if (condition.field_id && condition.operator_id) {
            fieldIds.add(condition.field_id);
            queryConditions.push({
              field_id: condition.field_id,
              operator_id: condition.operator_id,
              value: condition.value,
            });
          } else {
            throw new Error(
              `Missing field_id or operator_id for condition. Please reload the page.`,
            );
          }
        }
      }

      if (queryConditions.length === 0) {
        setError(
          "No 360 Profile conditions to preview. Please add at least one 360 Profile condition.",
        );
        setPreviewCount(null);
        setPreviewQuery(null);
        return;
      }

      // Build the request for query generation - ONLY 360_profile conditions
      const queryRequest = {
        fields: Array.from(fieldIds), // Fields to select in the query
        filters: {
          logic: "AND" as const,
          groups: formData.conditions
            .map((group) => ({
              logic: group.operator,
              conditions: group.conditions
                .filter(
                  (c) =>
                    c.conditionType === "360_profile" &&
                    c.field_id &&
                    c.operator_id,
                )
                .map((c) => ({
                  field_id: c.field_id!,
                  operator_id: c.operator_id!,
                  value: c.value,
                })),
            }))
            .filter((group) => group.conditions.length > 0), // Remove empty groups
        },
        limit: 100, // Preview limit
      };

      // Call the query generation preview API
      const response =
        await segmentService.generateSegmentQueryPreview(queryRequest);

      if (response.success && response.data) {
        setPreviewQuery(response.data.segment_query);
        setShowPreviewModal(true);
        // Note: The backend doesn't return count in preview yet
        // You could parse the SQL or make a separate count call
        setPreviewCount(null); // Set to null for now, or implement count extraction
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
   * Generate SQL query from conditions
   */
  const generateQueryFromConditions = async (): Promise<{
    segment_query: string;
    count_query: string;
  } | null> => {
    // Allow empty conditions - return a basic SELECT all query
    if (formData.conditions.length === 0) {
      return {
        segment_query: "SELECT * FROM subscriber_360",
        count_query: "SELECT COUNT(*) FROM subscriber_360",
      };
    }

    try {
      // Extract all unique field IDs from conditions
      const fieldIds = new Set<number>();

      // Process each condition group - ONLY 360_profile conditions
      for (const group of formData.conditions) {
        for (const condition of group.conditions) {
          // Only process 360_profile conditions
          if (condition.conditionType !== "360_profile") {
            continue; // Skip segment and list conditions
          }

          if (condition.field_id && condition.operator_id) {
            fieldIds.add(condition.field_id);
          } else {
            throw new Error(
              `Missing field_id or operator_id for condition. Please reload the page.`,
            );
          }
        }
      }

      if (fieldIds.size === 0) {
        throw new Error("No valid conditions to generate query");
      }

      // Build the request for query generation (without limit for production) - ONLY 360_profile
      const queryRequest = {
        fields: Array.from(fieldIds),
        filters: {
          logic: "AND" as const,
          groups: formData.conditions
            .map((group) => ({
              logic: group.operator,
              conditions: group.conditions
                .filter(
                  (c) =>
                    c.conditionType === "360_profile" &&
                    c.field_id &&
                    c.operator_id,
                )
                .map((c) => ({
                  field_id: c.field_id!,
                  operator_id: c.operator_id!,
                  value: c.value,
                })),
            }))
            .filter((group) => group.conditions.length > 0), // Remove empty groups
        },
        // Don't set limit for production query
      };

      // Call the query generation API
      const response =
        await segmentService.generateSegmentQueryPreview(queryRequest);

      if (response.success && response.data) {
        return {
          segment_query: response.data.segment_query,
          count_query: response.data.count_query,
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
          category: formData.category,
          query: queries.segment_query,
          count_query: queries.count_query,
        });

        // Extract segment from response
        const updateResult = updateResponse as { data?: Segment } | Segment;
        savedSegment =
          (typeof updateResult === "object" &&
            "data" in updateResult &&
            updateResult.data) ||
          (updateResult as Segment);
      } else {
        // Create new segment with query
        const createRequest: CreateSegmentRequest = {
          name: formData.name,
          code: code,
          description: formData.description,
          tags: formData.tags,
          type: "dynamic",
          category: formData.category,
          query: queries.segment_query,
          count_query: queries.count_query,
          is_active: true,
          visibility: "private",
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

      onSave(savedSegment);
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
              className={`relative bg-white ${tw.rounded} shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden`}
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
                  {/* Error Message */}
                  {error && (
                    <div
                      className={`p-4 bg-red-50 border border-red-300 ${tw.rounded}`}
                      style={{
                        borderColor: "#ef4444",
                      }}
                    >
                      <p className="text-sm font-medium text-red-600">
                        {error}
                      </p>
                    </div>
                  )}

                  {/* Basic Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label
                        className={`block text-sm font-medium ${tw.textPrimary} mb-2`}
                      >
                        Segment Name *
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            name: e.target.value,
                          }))
                        }
                        placeholder="Enter segment name"
                        className={`w-full px-4 py-3 border border-[${tw.borderDefault}] ${tw.rounded} focus:outline-none text-sm`}
                        required
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
                        className="w-full"
                      />
                      {/* <p className="text-xs text-gray-500 mt-1">
                        You can select multiple catalogs. Only the first one
                        will be saved to the backend.
                      </p> */}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label
                        className={`block text-sm font-medium ${tw.textPrimary} mb-2`}
                      >
                        Tags
                      </label>
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={tagInput}
                            onChange={(e) => {
                              const value = e.target.value;
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
                            className={`flex-1 px-4 py-3 border border-[${tw.borderDefault}] ${tw.rounded} focus:outline-none text-sm`}
                          />
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
                            className={`inline-flex items-center px-4  text-sm text-white ${tw.rounded} transition-colors`}
                            style={{
                              backgroundColor: color.primary.action,
                            }}
                          >
                            Add
                          </button>
                        </div>
                        {formData.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {formData.tags.map((tag) => (
                              <span
                                key={tag}
                                className="inline-flex items-center px-3 py-1 text-sm font-medium rounded-full border"
                                style={{
                                  backgroundColor: `${color.primary.accent}20`,
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

                  {/* Segment Conditions */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <label
                        className={`block text-sm font-medium ${tw.textPrimary}`}
                      >
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
                            isPreviewLoading || formData.conditions.length === 0
                          }
                          className={`inline-flex items-center px-4 py-2 text-sm text-white ${tw.rounded} transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
                          style={{
                            backgroundColor: color.primary.action,
                          }}
                        >
                          {isPreviewLoading ? "Loading..." : "Preview"}
                        </button>
                      </div>
                    </div>

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

            {/* Confirmation Modal (for Create Segment button) */}
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
                      Confirm Segment Creation
                    </h3>
                    <p className={`text-sm ${tw.textSecondary}`}>
                      Are you sure you want to create this segment?
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
                      {isLoading ? "Creating..." : "Confirm & Create"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>,
        document.body,
      )
    : null;
}
